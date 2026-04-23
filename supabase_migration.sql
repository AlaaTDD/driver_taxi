-- ==========================================
-- Taxi App - Supabase Migration Script
-- ==========================================
-- This script adds missing tables, columns, and RLS policies
-- required by the web admin panel that are NOT in the
-- Flutter app's supabase_rls_policies.sql
--
-- Run AFTER supabase_rls_policies.sql in Supabase SQL Editor
-- ==========================================

-- ==========================================
-- 1. PRICING_CONFIG TABLE (used by web admin /pricing page)
-- ==========================================

CREATE TABLE IF NOT EXISTS pricing_config (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  vehicle_type VARCHAR(50) NOT NULL UNIQUE CHECK (vehicle_type IN ('car', 'motorcycle')),
  base_fare DECIMAL(10,2) NOT NULL DEFAULT 0,
  price_per_km DECIMAL(10,2) NOT NULL DEFAULT 0,
  minimum_fare DECIMAL(10,2) NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE pricing_config ENABLE ROW LEVEL SECURITY;

-- Drop existing policies
DROP POLICY IF EXISTS "Public can read pricing" ON pricing_config;
DROP POLICY IF EXISTS "Admins can manage pricing" ON pricing_config;

-- SELECT: Public can read pricing (for fare calculation in app)
CREATE POLICY "Public can read pricing" ON pricing_config
FOR SELECT
USING (true);

-- ALL: Admins can manage pricing config
CREATE POLICY "Admins can manage pricing" ON pricing_config
FOR ALL
USING (is_admin_user())
WITH CHECK (is_admin_user());

-- Add trigger for updated_at
DROP TRIGGER IF EXISTS update_pricing_config_updated_at ON pricing_config;
CREATE TRIGGER update_pricing_config_updated_at
  BEFORE UPDATE ON pricing_config
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Insert default pricing if table is empty
INSERT INTO pricing_config (vehicle_type, base_fare, price_per_km, minimum_fare)
SELECT 'car', 15.00, 5.00, 20.00
WHERE NOT EXISTS (SELECT 1 FROM pricing_config WHERE vehicle_type = 'car');

INSERT INTO pricing_config (vehicle_type, base_fare, price_per_km, minimum_fare)
SELECT 'motorcycle', 10.00, 3.00, 15.00
WHERE NOT EXISTS (SELECT 1 FROM pricing_config WHERE vehicle_type = 'motorcycle');

-- Index
CREATE INDEX IF NOT EXISTS idx_pricing_config_vehicle_type ON pricing_config(vehicle_type);

-- ==========================================
-- 2. ADD ADDITIONAL TRIP STATUSES
-- ==========================================
-- The web admin uses extended trip statuses for better tracking

-- Drop old constraint and add new one with additional statuses
ALTER TABLE trips DROP CONSTRAINT IF EXISTS trips_status_check;
ALTER TABLE trips ADD CONSTRAINT trips_status_check
  CHECK (status IN ('pending', 'searching', 'accepted', 'driver_arriving', 'in_progress', 'completed', 'cancelled', 'no_drivers', 'problem'));

-- Add cancelled_at timestamp
ALTER TABLE trips ADD COLUMN IF NOT EXISTS cancelled_at TIMESTAMPTZ;

-- Add cancel_reason
ALTER TABLE trips ADD COLUMN IF NOT EXISTS cancel_reason TEXT;

-- ==========================================
-- 3. EXTEND NOTIFICATION TYPES
-- ==========================================
-- The web admin and Flutter app use extended notification types

-- Update type CHECK constraint to include all notification types
ALTER TABLE notifications DROP CONSTRAINT IF EXISTS notifications_type_check;
ALTER TABLE notifications ADD CONSTRAINT notifications_type_check
  CHECK (type IN ('general', 'trip', 'promo', 'system', 'trip_offer', 'offer_accepted', 'driver_arriving', 'trip_started', 'trip_completed', 'trip_cancelled', 'no_drivers', 'new_message', 'account_verified'));

-- ==========================================
-- 4. CREATE ADMIN ACCOUNT
-- ==========================================
-- This creates an admin user in Supabase Auth and sets is_admin = true
-- You need to run this in the Supabase SQL Editor with service_role access
--
-- IMPORTANT: Change the email and password before running!
-- After running, update the password in Supabase Dashboard > Authentication

-- Step 1: Create admin user in auth.users (only if not exists)
-- Replace 'admin@taxi.com' and 'Admin@2024!' with your desired credentials
DO $$
DECLARE
  admin_id UUID;
BEGIN
  -- Check if admin user already exists in auth.users
  SELECT id INTO admin_id FROM auth.users WHERE email = 'admin@taxi.com';

  IF admin_id IS NULL THEN
    -- Create the admin user
    INSERT INTO auth.users (
      instance_id,
      id,
      aud,
      role,
      email,
      encrypted_password,
      email_confirmed_at,
      created_at,
      updated_at,
      confirmation_token,
      email_change,
      email_change_token_new,
      recovery_token
    )
    VALUES (
      '00000000-0000-0000-0000-000000000000',
      gen_random_uuid(),
      'authenticated',
      'authenticated',
      'admin@taxi.com',
      crypt('Admin@2024!', gen_salt('bf')),
      NOW(),
      NOW(),
      NOW(),
      '',
      '',
      '',
      ''
    );
    RAISE NOTICE 'Admin user created in auth.users';
  ELSE
    RAISE NOTICE 'Admin user already exists in auth.users, skipping';
  END IF;
END $$;

-- Step 2: Create/update the admin user record in public.users table
INSERT INTO users (id, name, phone, email, role, is_active, is_admin)
SELECT
  au.id,
  'مدير النظام',
  '0000000000',
  'admin@taxi.com',
  'user',
  true,
  true
FROM auth.users au
WHERE au.email = 'admin@taxi.com'
ON CONFLICT (id) DO UPDATE SET
  is_admin = true,
  is_active = true;

-- ==========================================
-- 5. ADDITIONAL INDEXES FOR WEB ADMIN QUERIES
-- ==========================================

-- Trips: composite index for common admin queries
CREATE INDEX IF NOT EXISTS idx_trips_status_vehicle ON trips(status, vehicle_type);

-- Notifications: index on type for filtering
CREATE INDEX IF NOT EXISTS idx_notifications_type ON notifications(type);

-- ==========================================
-- 6. VERIFICATION QUERIES
-- ==========================================

-- Verify all tables exist
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public'
  AND table_name IN (
    'users',
    'drivers_profile',
    'trips',
    'ratings',
    'coupons',
    'user_coupons',
    'coupon_usages',
    'support_messages',
    'driver_locations',
    'users_profile',
    'admin_logs',
    'notifications',
    'pricing_config'
  )
ORDER BY table_name;

-- Verify admin user exists
SELECT id, name, email, is_admin
FROM users
WHERE is_admin = true;

-- Verify pricing config has defaults
SELECT * FROM pricing_config;

-- ==========================================
-- END OF MIGRATION SCRIPT
-- ==========================================
