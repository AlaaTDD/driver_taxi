-- ==========================================
-- SECURITY FIX: Views Security Invoker
-- ==========================================
-- Problem: Views in public schema are SECURITY DEFINER by default,
-- meaning they run with Postgres (creator) permissions and BYPASS RLS.
-- This means any API caller (even anonymous) could access them.
--
-- Fix: Recreate all admin views with security_invoker = true
-- so they respect RLS and the querying user's permissions.
-- Additionally, revoke anon access entirely.
--
-- Run this AFTER all other SQL scripts.
-- ==========================================

-- ==========================================
-- 0. ENSURE REQUIRED COLUMNS EXIST
-- ==========================================
ALTER TABLE users ADD COLUMN IF NOT EXISTS is_blocked BOOLEAN DEFAULT false;
ALTER TABLE users ADD COLUMN IF NOT EXISTS blocked_at TIMESTAMPTZ;
ALTER TABLE users ADD COLUMN IF NOT EXISTS blocked_reason TEXT;

ALTER TABLE users DROP CONSTRAINT IF EXISTS users_role_check;
ALTER TABLE users ADD CONSTRAINT users_role_check CHECK (role IN ('user', 'driver', 'supervisor'));

-- ==========================================
-- 1. RECREATE admin_dashboard (security_invoker = true)
-- ==========================================

DROP VIEW IF EXISTS admin_dashboard;
CREATE VIEW admin_dashboard
WITH (security_invoker = true)
AS
SELECT
  (SELECT COUNT(*) FROM users WHERE role = 'user' AND is_admin = false) AS total_users,
  (SELECT COUNT(*) FROM users WHERE role = 'driver' AND is_admin = false) AS total_drivers,
  (SELECT COUNT(*) FROM drivers_profile WHERE is_verified = true) AS verified_drivers,
  (SELECT COUNT(*) FROM drivers_profile WHERE is_available = true) AS available_drivers,
  (SELECT COUNT(*) FROM trips WHERE status NOT IN ('completed','cancelled','no_drivers')) AS active_trips,
  (SELECT COUNT(*) FROM trips WHERE status = 'completed') AS completed_trips,
  (SELECT COUNT(*) FROM trips WHERE created_at >= CURRENT_DATE) AS trips_today,
  (SELECT COALESCE(SUM(price), 0) FROM trips WHERE status = 'completed' AND created_at >= CURRENT_DATE) AS revenue_today;

-- ==========================================
-- 2. RECREATE admin_users_list (security_invoker = true)
-- ==========================================

DROP VIEW IF EXISTS admin_users_list;
CREATE VIEW admin_users_list
WITH (security_invoker = true)
AS
SELECT
  u.id,
  u.name,
  u.email,
  u.phone,
  u.role,
  u.is_admin,
  u.is_active,
  u.is_blocked,
  u.blocked_reason,
  u.blocked_at,
  u.rating,
  u.total_trips,
  u.avatar_url,
  u.created_at,
  dp.is_verified,
  dp.is_available,
  dp.national_id,
  dp.license_number,
  dp.vehicle_type,
  dp.vehicle_brand,
  dp.vehicle_model,
  dp.vehicle_year,
  dp.vehicle_color,
  dp.vehicle_plate,
  dp.national_id_image_url,
  dp.license_image_url,
  dp.criminal_record_url,
  dp.vehicle_image_url
FROM users u
LEFT JOIN drivers_profile dp ON u.id = dp.id
ORDER BY u.created_at DESC;

-- ==========================================
-- 3. RECREATE admin_pending_verifications (security_invoker = true)
-- ==========================================

DROP VIEW IF EXISTS admin_pending_verifications;
CREATE VIEW admin_pending_verifications
WITH (security_invoker = true)
AS
SELECT
  dp.id,
  dp.national_id,
  dp.license_number,
  dp.vehicle_type,
  dp.vehicle_plate,
  dp.national_id_image_url,
  dp.license_image_url,
  dp.criminal_record_url,
  dp.vehicle_image_url,
  u.name,
  u.email,
  u.phone,
  u.created_at
FROM drivers_profile dp
JOIN users u ON dp.id = u.id
WHERE dp.is_verified = false
ORDER BY u.created_at DESC;

-- ==========================================
-- 4. RECREATE admin_recent_trips (security_invoker = true)
-- ==========================================

DROP VIEW IF EXISTS admin_recent_trips;
CREATE VIEW admin_recent_trips
WITH (security_invoker = true)
AS
SELECT
  t.id,
  t.status,
  t.price,
  t.distance_km,
  t.vehicle_type,
  t.pickup_address,
  t.destination_address,
  t.created_at,
  t.completed_at,
  t.cancelled_at,
  t.cancel_reason,
  u_user.name   AS user_name,
  u_user.phone  AS user_phone,
  u_driver.name AS driver_name,
  u_driver.phone AS driver_phone
FROM trips t
JOIN users u_user ON t.user_id = u_user.id
LEFT JOIN users u_driver ON t.driver_id = u_driver.id
ORDER BY t.created_at DESC
LIMIT 100;

-- ==========================================
-- 5. RECREATE admin_audit_log (security_invoker = true)
-- ==========================================

DROP VIEW IF EXISTS admin_audit_log;
CREATE VIEW admin_audit_log
WITH (security_invoker = true)
AS
SELECT
  al.id,
  al.action,
  al.table_name,
  al.record_id,
  al.old_data,
  al.new_data,
  al.created_at,
  u.name  AS admin_name,
  u.email AS admin_email
FROM admin_logs al
JOIN users u ON al.admin_id = u.id
ORDER BY al.created_at DESC
LIMIT 1000;

-- ==========================================
-- 6. RESTRICT API ACCESS — Revoke anon, keep authenticated
-- ==========================================
-- Revoke all access from anon (unauthenticated callers)
REVOKE ALL ON admin_dashboard            FROM anon;
REVOKE ALL ON admin_users_list           FROM anon;
REVOKE ALL ON admin_pending_verifications FROM anon;
REVOKE ALL ON admin_recent_trips         FROM anon;
REVOKE ALL ON admin_audit_log            FROM anon;

-- Grant read to authenticated only (RLS will further restrict to admins/supervisors)
GRANT SELECT ON admin_dashboard            TO authenticated;
GRANT SELECT ON admin_users_list           TO authenticated;
GRANT SELECT ON admin_pending_verifications TO authenticated;
GRANT SELECT ON admin_recent_trips         TO authenticated;
GRANT SELECT ON admin_audit_log            TO authenticated;



-- ==========================================
-- 8. VERIFICATION — Check security_invoker is set
-- ==========================================
SELECT
  viewname,
  CASE
    WHEN definition ILIKE '%security_invoker%' THEN 'security_invoker ✓'
    ELSE 'SECURITY DEFINER ⚠'
  END AS security_type
FROM pg_views
WHERE schemaname = 'public'
  AND viewname IN (
    'admin_dashboard',
    'admin_users_list',
    'admin_pending_verifications',
    'admin_recent_trips',
    'admin_audit_log'
  )
ORDER BY viewname;

-- ==========================================
-- END
-- ==========================================
