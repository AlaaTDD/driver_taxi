-- ==========================================
-- Taxi App — Functions, Triggers & Fixes
-- ==========================================
-- Run this AFTER supabase_rls_policies.sql AND supabase_migration.sql
-- ==========================================

-- ==========================================
-- 1. UNIFY vehicle_type VALUES
-- ==========================================
-- First migrate existing data (old values: sedan, suv, van, minibus → car)
UPDATE drivers_profile
SET vehicle_type = 'car'
WHERE vehicle_type NOT IN ('car', 'motorcycle');

UPDATE trips
SET vehicle_type = 'car'
WHERE vehicle_type NOT IN ('car', 'motorcycle');

-- NOW add CHECK constraints safely
ALTER TABLE drivers_profile
  DROP CONSTRAINT IF EXISTS drivers_profile_vehicle_type_check;

ALTER TABLE drivers_profile
  ADD CONSTRAINT drivers_profile_vehicle_type_check
  CHECK (vehicle_type IN ('car', 'motorcycle'));

ALTER TABLE trips
  DROP CONSTRAINT IF EXISTS trips_vehicle_type_check;

ALTER TABLE trips
  ADD CONSTRAINT trips_vehicle_type_check
  CHECK (vehicle_type IN ('car', 'motorcycle'));

-- ==========================================
-- 2. FUNCTION: calculate_trip_price()
-- ==========================================
-- Returns the correct fare based on pricing_config.
-- Used by the app when building a trip request.

CREATE OR REPLACE FUNCTION calculate_trip_price(
  p_vehicle_type VARCHAR,
  p_distance_km  DECIMAL
)
RETURNS DECIMAL(10,2) AS $$
DECLARE
  v_base_fare    DECIMAL(10,2);
  v_per_km       DECIMAL(10,2);
  v_minimum      DECIMAL(10,2);
  v_total        DECIMAL(10,2);
BEGIN
  SELECT base_fare, price_per_km, minimum_fare
  INTO   v_base_fare, v_per_km, v_minimum
  FROM   pricing_config
  WHERE  vehicle_type = p_vehicle_type
  LIMIT  1;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'No pricing config found for vehicle_type: %', p_vehicle_type;
  END IF;

  v_total := v_base_fare + (v_per_km * p_distance_km);
  RETURN GREATEST(v_total, v_minimum);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute to authenticated users (app uses it)
GRANT EXECUTE ON FUNCTION calculate_trip_price(VARCHAR, DECIMAL) TO authenticated;
GRANT EXECUTE ON FUNCTION calculate_trip_price(VARCHAR, DECIMAL) TO anon;

-- ==========================================
-- 3. TRIGGER: update total_trips after trip completes
-- ==========================================
-- Automatically increments total_trips for both rider and driver
-- whenever a trip's status changes to 'completed'.

CREATE OR REPLACE FUNCTION _fn_update_total_trips_on_complete()
RETURNS TRIGGER AS $$
BEGIN
  -- Only act on status change → completed
  IF NEW.status = 'completed' AND OLD.status <> 'completed' THEN
    -- Rider
    UPDATE users
    SET    total_trips = COALESCE(total_trips, 0) + 1,
           updated_at  = NOW()
    WHERE  id = NEW.user_id;

    -- Driver (if assigned)
    IF NEW.driver_id IS NOT NULL THEN
      UPDATE users
      SET    total_trips = COALESCE(total_trips, 0) + 1,
             updated_at  = NOW()
      WHERE  id = NEW.driver_id;
    END IF;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trip_completed_update_total_trips ON trips;
CREATE TRIGGER trip_completed_update_total_trips
  AFTER UPDATE ON trips
  FOR EACH ROW
  EXECUTE FUNCTION _fn_update_total_trips_on_complete();

-- ==========================================
-- 4. TRIGGER: recalculate driver rating after new rating
-- ==========================================
-- Recalculates and stores the accurate average rating on users.rating
-- every time a new rating row is inserted.

CREATE OR REPLACE FUNCTION _fn_recalculate_driver_rating()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE users
  SET    rating     = (
           SELECT ROUND(AVG(r.rating)::NUMERIC, 2)
           FROM   ratings r
           WHERE  r.driver_id = NEW.driver_id
         ),
         updated_at = NOW()
  WHERE  id = NEW.driver_id;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS rating_inserted_update_driver ON ratings;
CREATE TRIGGER rating_inserted_update_driver
  AFTER INSERT ON ratings
  FOR EACH ROW
  EXECUTE FUNCTION _fn_recalculate_driver_rating();

-- ==========================================
-- 5. TRIGGER: increment coupon used_count on usage
-- ==========================================
-- Every time a row is inserted into coupon_usages,
-- increment used_count on the parent coupon.

CREATE OR REPLACE FUNCTION _fn_increment_coupon_used_count()
RETURNS TRIGGER AS $$
DECLARE
  v_coupon_id UUID;
BEGIN
  -- Resolve coupon_id via user_coupons
  SELECT coupon_id INTO v_coupon_id
  FROM   user_coupons
  WHERE  id = NEW.user_coupon_id;

  IF v_coupon_id IS NOT NULL THEN
    UPDATE coupons
    SET    used_count = COALESCE(used_count, 0) + 1
    WHERE  id = v_coupon_id;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS coupon_usage_inserted_increment ON coupon_usages;
CREATE TRIGGER coupon_usage_inserted_increment
  AFTER INSERT ON coupon_usages
  FOR EACH ROW
  EXECUTE FUNCTION _fn_increment_coupon_used_count();

-- ==========================================
-- 6. FUNCTION: validate_coupon()
-- ==========================================
-- Used by the app to validate a coupon code before applying it.
-- Returns the coupon row if valid, raises exception if not.

CREATE OR REPLACE FUNCTION validate_coupon(
  p_code          VARCHAR,
  p_trip_price    DECIMAL,
  p_user_id       UUID
)
RETURNS TABLE (
  id              UUID,
  discount_type   VARCHAR,
  discount_value  DECIMAL,
  discount_amount DECIMAL
) AS $$
DECLARE
  v_coupon        coupons%ROWTYPE;
  v_already_used  BOOLEAN;
  v_discount      DECIMAL(10,2);
BEGIN
  -- Find coupon
  SELECT * INTO v_coupon FROM coupons
  WHERE  code = p_code AND is_active = true
  LIMIT  1;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'الكوبون غير موجود أو غير نشط';
  END IF;

  -- Check expiry
  IF v_coupon.expires_at IS NOT NULL AND v_coupon.expires_at < NOW() THEN
    RAISE EXCEPTION 'انتهت صلاحية الكوبون';
  END IF;

  -- Check max uses
  IF v_coupon.max_uses IS NOT NULL AND v_coupon.used_count >= v_coupon.max_uses THEN
    RAISE EXCEPTION 'تم استنفاد عدد استخدامات الكوبون';
  END IF;

  -- Check minimum trip price
  IF v_coupon.min_trip_price IS NOT NULL AND p_trip_price < v_coupon.min_trip_price THEN
    RAISE EXCEPTION 'قيمة الرحلة أقل من الحد الأدنى للكوبون';
  END IF;

  -- Check user already used this coupon
  SELECT EXISTS (
    SELECT 1 FROM user_coupons uc
    JOIN   coupon_usages cu ON cu.user_coupon_id = uc.id
    WHERE  uc.coupon_id = v_coupon.id
    AND    uc.user_id   = p_user_id
  ) INTO v_already_used;

  IF v_already_used THEN
    RAISE EXCEPTION 'لقد استخدمت هذا الكوبون من قبل';
  END IF;

  -- Calculate discount
  IF v_coupon.discount_type = 'percentage' THEN
    v_discount := ROUND((p_trip_price * v_coupon.discount_value / 100)::NUMERIC, 2);
  ELSE
    v_discount := LEAST(v_coupon.discount_value, p_trip_price);
  END IF;

  RETURN QUERY SELECT
    v_coupon.id,
    v_coupon.discount_type,
    v_coupon.discount_value,
    v_discount;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION validate_coupon(VARCHAR, DECIMAL, UUID) TO authenticated;

-- ==========================================
-- 7. FUNCTION: apply_coupon_to_trip()
-- ==========================================
-- Atomically marks user_coupon as used and inserts coupon_usage record.

CREATE OR REPLACE FUNCTION apply_coupon_to_trip(
  p_trip_id       UUID,
  p_coupon_code   VARCHAR,
  p_user_id       UUID,
  p_trip_price    DECIMAL
)
RETURNS DECIMAL(10,2) AS $$
DECLARE
  v_coupon_id     UUID;
  v_user_coupon_id UUID;
  v_discount      DECIMAL(10,2);
  v_result        RECORD;
BEGIN
  -- Validate first
  SELECT * INTO v_result
  FROM validate_coupon(p_coupon_code, p_trip_price, p_user_id)
  LIMIT 1;

  v_coupon_id  := v_result.id;
  v_discount   := v_result.discount_amount;

  -- Get or create user_coupon
  SELECT id INTO v_user_coupon_id
  FROM   user_coupons
  WHERE  coupon_id = v_coupon_id AND user_id = p_user_id
  LIMIT  1;

  IF v_user_coupon_id IS NULL THEN
    INSERT INTO user_coupons (user_id, coupon_id)
    VALUES (p_user_id, v_coupon_id)
    RETURNING id INTO v_user_coupon_id;
  END IF;

  -- Mark as used
  UPDATE user_coupons
  SET    is_used = true, used_at = NOW()
  WHERE  id = v_user_coupon_id;

  -- Insert usage record (trigger will increment used_count)
  INSERT INTO coupon_usages (trip_id, user_coupon_id, discount_amount)
  VALUES (p_trip_id, v_user_coupon_id, v_discount);

  RETURN v_discount;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION apply_coupon_to_trip(UUID, VARCHAR, UUID, DECIMAL) TO authenticated;

-- ==========================================
-- 8. MISSING RLS: Admin DELETE on notifications
-- ==========================================

DROP POLICY IF EXISTS "Admins can delete notifications" ON notifications;
CREATE POLICY "Admins can delete notifications" ON notifications
FOR DELETE
USING (is_admin_user());

-- ==========================================
-- 9. FUNCTION: get_admin_dashboard_stats()
-- ==========================================
-- Single efficient call for the web dashboard page.

CREATE OR REPLACE FUNCTION get_admin_dashboard_stats()
RETURNS JSON AS $$
DECLARE
  v_result JSON;
BEGIN
  SELECT json_build_object(
    'total_users',       (SELECT COUNT(*) FROM users WHERE role = 'user'),
    'total_drivers',     (SELECT COUNT(*) FROM users WHERE role = 'driver'),
    'verified_drivers',  (SELECT COUNT(*) FROM drivers_profile WHERE is_verified = true),
    'available_drivers', (SELECT COUNT(*) FROM drivers_profile WHERE is_available = true),
    'total_trips',       (SELECT COUNT(*) FROM trips),
    'active_trips',      (SELECT COUNT(*) FROM trips WHERE status NOT IN ('completed','cancelled','no_drivers')),
    'completed_trips',   (SELECT COUNT(*) FROM trips WHERE status = 'completed'),
    'total_revenue',     (SELECT COALESCE(SUM(price),0) FROM trips WHERE status = 'completed'),
    'revenue_today',     (SELECT COALESCE(SUM(price),0) FROM trips WHERE status = 'completed' AND created_at >= CURRENT_DATE),
    'trips_today',       (SELECT COUNT(*) FROM trips WHERE created_at >= CURRENT_DATE),
    'unread_notifications', (SELECT COUNT(*) FROM notifications WHERE is_read = false)
  ) INTO v_result;

  RETURN v_result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION get_admin_dashboard_stats() TO authenticated;

-- ==========================================
-- 10. FUNCTION: admin_update_pricing()
-- ==========================================
-- Web admin updates pricing config via this secure function.

CREATE OR REPLACE FUNCTION admin_update_pricing(
  p_vehicle_type  VARCHAR,
  p_base_fare     DECIMAL,
  p_price_per_km  DECIMAL,
  p_minimum_fare  DECIMAL
)
RETURNS BOOLEAN AS $$
BEGIN
  IF NOT is_admin_user() THEN
    RAISE EXCEPTION 'Access denied: admins only';
  END IF;

  INSERT INTO pricing_config (vehicle_type, base_fare, price_per_km, minimum_fare)
  VALUES (p_vehicle_type, p_base_fare, p_price_per_km, p_minimum_fare)
  ON CONFLICT (vehicle_type) DO UPDATE
  SET base_fare    = EXCLUDED.base_fare,
      price_per_km = EXCLUDED.price_per_km,
      minimum_fare = EXCLUDED.minimum_fare,
      updated_at   = NOW();

  PERFORM log_admin_action(
    'UPDATE_PRICING', 'pricing_config', NULL,
    NULL,
    jsonb_build_object(
      'vehicle_type', p_vehicle_type,
      'base_fare', p_base_fare,
      'price_per_km', p_price_per_km,
      'minimum_fare', p_minimum_fare
    )
  );

  RETURN true;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION admin_update_pricing(VARCHAR, DECIMAL, DECIMAL, DECIMAL) TO authenticated;

-- ==========================================
-- 11. MISSING: driver_locations UPSERT support
-- ==========================================
-- The app updates location frequently; add unique constraint
-- so ON CONFLICT works per driver.

ALTER TABLE driver_locations
  DROP CONSTRAINT IF EXISTS driver_locations_driver_id_unique;

ALTER TABLE driver_locations
  ADD CONSTRAINT driver_locations_driver_id_unique UNIQUE (driver_id);

-- FUNCTION: upsert driver location
CREATE OR REPLACE FUNCTION upsert_driver_location(
  p_driver_id UUID,
  p_lat       DECIMAL,
  p_lng       DECIMAL,
  p_heading   DECIMAL,
  p_geohash   VARCHAR
)
RETURNS VOID AS $$
BEGIN
  INSERT INTO driver_locations (driver_id, lat, lng, heading, geohash, updated_at)
  VALUES (p_driver_id, p_lat, p_lng, p_heading, p_geohash, NOW())
  ON CONFLICT (driver_id) DO UPDATE
  SET lat       = EXCLUDED.lat,
      lng       = EXCLUDED.lng,
      heading   = EXCLUDED.heading,
      geohash   = EXCLUDED.geohash,
      updated_at = NOW();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION upsert_driver_location(UUID, DECIMAL, DECIMAL, DECIMAL, VARCHAR) TO authenticated;

-- ==========================================
-- 12. FUNCTION: get_nearby_drivers()
-- ==========================================
-- Returns available+verified drivers within a geohash prefix.

CREATE OR REPLACE FUNCTION get_nearby_drivers(
  p_geohash_prefix VARCHAR,   -- e.g. first 5 chars of geohash
  p_vehicle_type   VARCHAR
)
RETURNS TABLE (
  driver_id   UUID,
  lat         DECIMAL,
  lng         DECIMAL,
  heading     DECIMAL,
  name        VARCHAR,
  rating      DECIMAL,
  total_trips INTEGER,
  vehicle_type VARCHAR,
  vehicle_brand VARCHAR,
  vehicle_model VARCHAR,
  vehicle_color VARCHAR,
  vehicle_plate VARCHAR
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    dl.driver_id,
    dl.lat,
    dl.lng,
    dl.heading,
    u.name,
    u.rating,
    u.total_trips,
    dp.vehicle_type,
    dp.vehicle_brand,
    dp.vehicle_model,
    dp.vehicle_color,
    dp.vehicle_plate
  FROM   driver_locations dl
  JOIN   drivers_profile  dp ON dp.id = dl.driver_id
  JOIN   users            u  ON u.id  = dl.driver_id
  WHERE  dp.is_verified  = true
  AND    dp.is_available = true
  AND    u.is_active     = true
  AND    dp.vehicle_type = p_vehicle_type
  AND    dl.geohash LIKE p_geohash_prefix || '%'
  AND    dl.updated_at > NOW() - INTERVAL '5 minutes'  -- only fresh locations
  ORDER  BY dl.updated_at DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION get_nearby_drivers(VARCHAR, VARCHAR) TO authenticated;
GRANT EXECUTE ON FUNCTION get_nearby_drivers(VARCHAR, VARCHAR) TO anon;

-- ==========================================
-- 13. VERIFICATION
-- ==========================================

-- Check all new functions exist
SELECT routine_name, routine_type
FROM information_schema.routines
WHERE routine_schema = 'public'
  AND routine_name IN (
    'calculate_trip_price',
    'validate_coupon',
    'apply_coupon_to_trip',
    'get_admin_dashboard_stats',
    'admin_update_pricing',
    'upsert_driver_location',
    'get_nearby_drivers',
    '_fn_update_total_trips_on_complete',
    '_fn_recalculate_driver_rating',
    '_fn_increment_coupon_used_count'
  )
ORDER BY routine_name;

-- Check all triggers exist
SELECT trigger_name, event_object_table, action_timing, event_manipulation
FROM information_schema.triggers
WHERE trigger_schema = 'public'
  AND trigger_name IN (
    'trip_completed_update_total_trips',
    'rating_inserted_update_driver',
    'coupon_usage_inserted_increment'
  )
ORDER BY trigger_name;

-- ==========================================
-- END
-- ==========================================
