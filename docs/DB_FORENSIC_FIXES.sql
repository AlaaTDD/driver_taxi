-- Taxi Admin Dashboard forensic database fixes
-- Run in Supabase SQL editor with a privileged role.
-- Keep VACUUM statements outside explicit transactions.



-- 2) Atomic wallet adjustment used by /api/wallets/adjust.
CREATE OR REPLACE FUNCTION public.admin_wallet_adjust(
  p_wallet_id uuid,
  p_wallet_type text,
  p_amount numeric,
  p_tx_type text DEFAULT 'adjustment',
  p_description text DEFAULT NULL,
  p_admin_email text DEFAULT NULL
) RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_before numeric;
  v_after numeric;
BEGIN
  IF p_wallet_type NOT IN ('driver', 'user') THEN
    RAISE EXCEPTION 'invalid wallet type';
  END IF;

  IF p_tx_type NOT IN ('bonus', 'penalty', 'adjustment') THEN
    RAISE EXCEPTION 'invalid transaction type';
  END IF;

  IF p_amount IS NULL OR p_amount = 0 OR abs(p_amount) > 100000 THEN
    RAISE EXCEPTION 'invalid amount';
  END IF;

  IF p_wallet_type = 'driver' THEN
    SELECT balance INTO v_before
    FROM public.driver_wallets
    WHERE id = p_wallet_id
    FOR UPDATE;

    IF NOT FOUND THEN
      RAISE EXCEPTION 'wallet not found';
    END IF;

    v_after := v_before + p_amount;

    UPDATE public.driver_wallets
    SET balance = v_after,
        updated_at = now()
    WHERE id = p_wallet_id;
  ELSE
    SELECT balance INTO v_before
    FROM public.user_wallets
    WHERE id = p_wallet_id
    FOR UPDATE;

    IF NOT FOUND THEN
      RAISE EXCEPTION 'wallet not found';
    END IF;

    v_after := v_before + p_amount;

    UPDATE public.user_wallets
    SET balance = v_after,
        updated_at = now()
    WHERE id = p_wallet_id;
  END IF;

  INSERT INTO public.wallet_transactions (
    wallet_id,
    wallet_type,
    type,
    amount,
    balance_before,
    balance_after,
    description,
    status,
    metadata
  ) VALUES (
    p_wallet_id,
    p_wallet_type,
    p_tx_type,
    p_amount,
    v_before,
    v_after,
    p_description,
    'completed',
    jsonb_build_object('admin_email', p_admin_email)
  );
END;
$$;

REVOKE ALL ON FUNCTION public.admin_wallet_adjust(uuid, text, numeric, text, text, text) FROM PUBLIC;

-- 3) Atomic user wallet top-up used by /api/wallets/top-up.
CREATE OR REPLACE FUNCTION public.admin_wallet_top_up(
  p_wallet_id uuid,
  p_amount numeric,
  p_description text DEFAULT NULL,
  p_admin_email text DEFAULT NULL
) RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_before numeric;
  v_after numeric;
BEGIN
  IF p_amount IS NULL OR p_amount <= 0 OR p_amount > 100000 THEN
    RAISE EXCEPTION 'invalid amount';
  END IF;

  SELECT balance INTO v_before
  FROM public.user_wallets
  WHERE id = p_wallet_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'wallet not found';
  END IF;

  v_after := v_before + p_amount;

  UPDATE public.user_wallets
  SET balance = v_after,
      total_topped_up = COALESCE(total_topped_up, 0) + p_amount,
      updated_at = now()
  WHERE id = p_wallet_id;

  INSERT INTO public.wallet_transactions (
    wallet_id,
    wallet_type,
    type,
    amount,
    balance_before,
    balance_after,
    description,
    status,
    metadata
  ) VALUES (
    p_wallet_id,
    'user',
    'top_up',
    p_amount,
    v_before,
    v_after,
    p_description,
    'completed',
    jsonb_build_object('admin_email', p_admin_email)
  );
END;
$$;

REVOKE ALL ON FUNCTION public.admin_wallet_top_up(uuid, numeric, text, text) FROM PUBLIC;

-- 4) Atomic coupon assignment used by /api/user-coupons/assign.
CREATE OR REPLACE FUNCTION public.admin_assign_user_coupon(
  p_user_id uuid,
  p_coupon_id uuid
) RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_coupon record;
BEGIN
  SELECT id, is_active, max_uses, used_count
  INTO v_coupon
  FROM public.coupons
  WHERE id = p_coupon_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'coupon not found';
  END IF;

  IF v_coupon.is_active IS NOT TRUE THEN
    RAISE EXCEPTION 'coupon inactive';
  END IF;

  IF v_coupon.max_uses IS NOT NULL AND v_coupon.used_count >= v_coupon.max_uses THEN
    RAISE EXCEPTION 'coupon max uses reached';
  END IF;

  INSERT INTO public.user_coupons (user_id, coupon_id)
  VALUES (p_user_id, p_coupon_id);

  UPDATE public.coupons
  SET used_count = used_count + 1
  WHERE id = p_coupon_id;
END;
$$;

REVOKE ALL ON FUNCTION public.admin_assign_user_coupon(uuid, uuid) FROM PUBLIC;

-- 5) Low-risk constraints. NOT VALID avoids breaking deploys with historical bad rows.
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'chk_trip_status') THEN
    ALTER TABLE public.trips
      ADD CONSTRAINT chk_trip_status
      CHECK (status IN ('searching','accepted','driver_arriving','in_progress','completed','cancelled'))
      NOT VALID;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'chk_rating_value') THEN
    ALTER TABLE public.ratings
      ADD CONSTRAINT chk_rating_value
      CHECK (rating >= 1 AND rating <= 5)
      NOT VALID;
  END IF;
END $$;

-- 6) Maintenance for the bloat highlighted in the forensic reports.
VACUUM ANALYZE public.vehicle_types;
VACUUM ANALYZE public.users;
VACUUM ANALYZE public.driver_locations;
VACUUM ANALYZE public.trip_route_waypoints;
VACUUM ANALYZE public.pricing_config;
VACUUM ANALYZE public.driver_wallets;
VACUUM ANALYZE public.trip_offers;
VACUUM ANALYZE public.trips;

-- 7) Optional pg_cron schedules, only if pg_cron is enabled.
DO $$
BEGIN
  IF to_regclass('cron.job') IS NOT NULL THEN
    IF NOT EXISTS (SELECT 1 FROM cron.job WHERE jobname = 'cleanup-stale-trips') THEN
      PERFORM cron.schedule('cleanup-stale-trips', '*/10 * * * *', 'SELECT public.cleanup_stale_trips()');
    END IF;

    IF NOT EXISTS (SELECT 1 FROM cron.job WHERE jobname = 'cleanup-presence') THEN
      PERFORM cron.schedule('cleanup-presence', '*/15 * * * *', 'SELECT public.cleanup_stale_user_presence()');
    END IF;

    IF NOT EXISTS (SELECT 1 FROM cron.job WHERE jobname = 'expire-coupons') THEN
      PERFORM cron.schedule('expire-coupons', '0 * * * *', 'SELECT public.fn_auto_deactivate_expired_coupons()');
    END IF;
  END IF;
END $$;
