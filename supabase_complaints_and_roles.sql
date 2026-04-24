-- ==========================================
-- Taxi App — Complaints, Revisions & Roles
-- ==========================================
-- Run AFTER supabase_functions_and_triggers.sql
-- ==========================================

-- ==========================================
-- 1. EXTEND users.role TO SUPPORT 'supervisor'
-- ==========================================

ALTER TABLE users DROP CONSTRAINT IF EXISTS users_role_check;
ALTER TABLE users ADD CONSTRAINT users_role_check
  CHECK (role IN ('user', 'driver', 'supervisor'));

-- Add is_blocked column for fine-grained blocking (separate from is_active)
ALTER TABLE users ADD COLUMN IF NOT EXISTS is_blocked BOOLEAN DEFAULT false;
ALTER TABLE users ADD COLUMN IF NOT EXISTS blocked_at TIMESTAMPTZ;
ALTER TABLE users ADD COLUMN IF NOT EXISTS blocked_reason TEXT;

-- ==========================================
-- 2. COMPLAINTS TABLE
-- ==========================================

CREATE TABLE IF NOT EXISTS complaints (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  subject VARCHAR(255) NOT NULL,
  message TEXT NOT NULL,
  category VARCHAR(50) DEFAULT 'general'
    CHECK (category IN ('general', 'driver', 'trip', 'payment', 'app', 'other')),
  trip_id UUID REFERENCES trips(id) ON DELETE SET NULL,
  driver_id UUID REFERENCES users(id) ON DELETE SET NULL,
  status VARCHAR(20) DEFAULT 'open'
    CHECK (status IN ('open', 'in_progress', 'resolved', 'closed')),
  priority VARCHAR(10) DEFAULT 'normal'
    CHECK (priority IN ('low', 'normal', 'high', 'urgent')),
  admin_reply TEXT,
  admin_id UUID REFERENCES users(id) ON DELETE SET NULL,
  replied_at TIMESTAMPTZ,
  resolved_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE complaints ENABLE ROW LEVEL SECURITY;

-- Drop existing policies
DROP POLICY IF EXISTS "Users can create complaints" ON complaints;
DROP POLICY IF EXISTS "Users can read own complaints" ON complaints;
DROP POLICY IF EXISTS "Admins can read all complaints" ON complaints;
DROP POLICY IF EXISTS "Admins can update complaints" ON complaints;
DROP POLICY IF EXISTS "Supervisors can read complaints" ON complaints;
DROP POLICY IF EXISTS "Supervisors can update complaints" ON complaints;

-- Users can submit complaints
CREATE POLICY "Users can create complaints" ON complaints
FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Users can read their own complaints
CREATE POLICY "Users can read own complaints" ON complaints
FOR SELECT USING (auth.uid() = user_id);

-- Admins: full access
CREATE POLICY "Admins can read all complaints" ON complaints
FOR SELECT USING (is_admin_user());

CREATE POLICY "Admins can update complaints" ON complaints
FOR UPDATE USING (is_admin_user()) WITH CHECK (is_admin_user());

CREATE POLICY "Admins can delete complaints" ON complaints
FOR DELETE USING (is_admin_user());

-- Supervisors: read + update (but not delete)
CREATE POLICY "Supervisors can read complaints" ON complaints
FOR SELECT
USING (EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'supervisor'));

CREATE POLICY "Supervisors can update complaints" ON complaints
FOR UPDATE
USING (EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'supervisor'))
WITH CHECK (EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'supervisor'));

-- Trigger for updated_at
DROP TRIGGER IF EXISTS update_complaints_updated_at ON complaints;
CREATE TRIGGER update_complaints_updated_at
  BEFORE UPDATE ON complaints
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Indexes
CREATE INDEX IF NOT EXISTS idx_complaints_user_id ON complaints(user_id);
CREATE INDEX IF NOT EXISTS idx_complaints_status ON complaints(status);
CREATE INDEX IF NOT EXISTS idx_complaints_category ON complaints(category);
CREATE INDEX IF NOT EXISTS idx_complaints_created_at ON complaints(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_complaints_priority ON complaints(priority);

-- ==========================================
-- 3. DRIVER REVISION REQUESTS TABLE
-- ==========================================
-- Admin can request a driver to resubmit specific documents

CREATE TABLE IF NOT EXISTS driver_revision_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  driver_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  admin_id UUID NOT NULL REFERENCES users(id) ON DELETE SET NULL,
  fields_requested TEXT[] NOT NULL,   -- e.g. ['national_id_image_url', 'license_image_url']
  message TEXT NOT NULL,              -- Message shown to driver explaining what's needed
  status VARCHAR(20) DEFAULT 'pending'
    CHECK (status IN ('pending', 'submitted', 'approved', 'rejected')),
  driver_response TEXT,               -- Optional message from driver when resubmitting
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE driver_revision_requests ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Drivers can read own revisions" ON driver_revision_requests;
DROP POLICY IF EXISTS "Drivers can update own revisions" ON driver_revision_requests;
DROP POLICY IF EXISTS "Admins can manage revisions" ON driver_revision_requests;
DROP POLICY IF EXISTS "Supervisors can read revisions" ON driver_revision_requests;

-- Drivers can see their own revision requests
CREATE POLICY "Drivers can read own revisions" ON driver_revision_requests
FOR SELECT USING (auth.uid() = driver_id);

-- Drivers can respond to a revision request (update driver_response + status → submitted)
CREATE POLICY "Drivers can update own revisions" ON driver_revision_requests
FOR UPDATE
USING (auth.uid() = driver_id AND status = 'pending')
WITH CHECK (auth.uid() = driver_id);

-- Admins: full management
CREATE POLICY "Admins can manage revisions" ON driver_revision_requests
FOR ALL USING (is_admin_user()) WITH CHECK (is_admin_user());

-- Supervisors: read + create
CREATE POLICY "Supervisors can read revisions" ON driver_revision_requests
FOR SELECT
USING (EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'supervisor'));

CREATE POLICY "Supervisors can create revisions" ON driver_revision_requests
FOR INSERT
WITH CHECK (EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'supervisor'));

-- Trigger for updated_at
DROP TRIGGER IF EXISTS update_driver_revisions_updated_at ON driver_revision_requests;
CREATE TRIGGER update_driver_revisions_updated_at
  BEFORE UPDATE ON driver_revision_requests
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Indexes
CREATE INDEX IF NOT EXISTS idx_drr_driver_id ON driver_revision_requests(driver_id);
CREATE INDEX IF NOT EXISTS idx_drr_status ON driver_revision_requests(status);
CREATE INDEX IF NOT EXISTS idx_drr_created_at ON driver_revision_requests(created_at DESC);

-- ==========================================
-- 4. FUNCTION: block_user() — Admin only
-- ==========================================

CREATE OR REPLACE FUNCTION block_user(
  p_user_id UUID,
  p_reason  TEXT DEFAULT NULL
)
RETURNS BOOLEAN AS $$
BEGIN
  IF NOT is_admin_user() THEN
    RAISE EXCEPTION 'Only admins can block users';
  END IF;

  IF p_user_id = auth.uid() THEN
    RAISE EXCEPTION 'Cannot block yourself';
  END IF;

  -- Prevent blocking other admins
  IF EXISTS (SELECT 1 FROM users WHERE id = p_user_id AND is_admin = true) THEN
    RAISE EXCEPTION 'Cannot block admin accounts';
  END IF;

  UPDATE users
  SET is_blocked     = true,
      is_active      = false,
      blocked_at     = NOW(),
      blocked_reason = p_reason,
      updated_at     = NOW()
  WHERE id = p_user_id;

  PERFORM log_admin_action('BLOCK_USER', 'users', p_user_id,
    jsonb_build_object('is_blocked', false),
    jsonb_build_object('is_blocked', true, 'reason', p_reason));

  RETURN FOUND;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION block_user(UUID, TEXT) TO authenticated;

-- ==========================================
-- 5. FUNCTION: unblock_user() — Admin only
-- ==========================================

CREATE OR REPLACE FUNCTION unblock_user(p_user_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  IF NOT is_admin_user() THEN
    RAISE EXCEPTION 'Only admins can unblock users';
  END IF;

  UPDATE users
  SET is_blocked     = false,
      is_active      = true,
      blocked_at     = NULL,
      blocked_reason = NULL,
      updated_at     = NOW()
  WHERE id = p_user_id;

  PERFORM log_admin_action('UNBLOCK_USER', 'users', p_user_id,
    jsonb_build_object('is_blocked', true),
    jsonb_build_object('is_blocked', false));

  RETURN FOUND;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION unblock_user(UUID) TO authenticated;

-- ==========================================
-- 6. FUNCTION: set_user_role() — Admin only
-- ==========================================
-- Admins can grant 'supervisor' or revoke it.
-- Cannot change role of other admins.
-- Cannot change own role.

CREATE OR REPLACE FUNCTION set_user_role(
  p_user_id UUID,
  p_role    VARCHAR   -- 'user', 'supervisor' (not 'driver' — that's set at registration)
)
RETURNS BOOLEAN AS $$
BEGIN
  IF NOT is_admin_user() THEN
    RAISE EXCEPTION 'Only admins can change user roles';
  END IF;

  IF p_user_id = auth.uid() THEN
    RAISE EXCEPTION 'Cannot change your own role';
  END IF;

  IF EXISTS (SELECT 1 FROM users WHERE id = p_user_id AND is_admin = true) THEN
    RAISE EXCEPTION 'Cannot change the role of admin accounts';
  END IF;

  IF p_role NOT IN ('user', 'supervisor') THEN
    RAISE EXCEPTION 'Invalid role. Allowed: user, supervisor';
  END IF;

  UPDATE users
  SET role       = p_role,
      updated_at = NOW()
  WHERE id = p_user_id AND role <> 'driver'; -- don't change driver role

  PERFORM log_admin_action('SET_ROLE', 'users', p_user_id,
    NULL,
    jsonb_build_object('role', p_role));

  RETURN FOUND;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION set_user_role(UUID, VARCHAR) TO authenticated;

-- ==========================================
-- 7. FUNCTION: resolve_complaint() — Admin/Supervisor
-- ==========================================

CREATE OR REPLACE FUNCTION resolve_complaint(
  p_complaint_id UUID,
  p_reply        TEXT,
  p_status       VARCHAR DEFAULT 'resolved'
)
RETURNS BOOLEAN AS $$
DECLARE
  v_is_staff BOOLEAN;
BEGIN
  SELECT (
    is_admin_user() OR
    EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'supervisor')
  ) INTO v_is_staff;

  IF NOT v_is_staff THEN
    RAISE EXCEPTION 'Only admins or supervisors can resolve complaints';
  END IF;

  IF p_status NOT IN ('open', 'in_progress', 'resolved', 'closed') THEN
    RAISE EXCEPTION 'Invalid status';
  END IF;

  UPDATE complaints
  SET admin_reply = p_reply,
      admin_id    = auth.uid(),
      status      = p_status,
      replied_at  = NOW(),
      resolved_at = CASE WHEN p_status IN ('resolved', 'closed') THEN NOW() ELSE NULL END,
      updated_at  = NOW()
  WHERE id = p_complaint_id;

  RETURN FOUND;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION resolve_complaint(UUID, TEXT, VARCHAR) TO authenticated;

-- ==========================================
-- 8. FUNCTION: request_driver_revision()
-- ==========================================

CREATE OR REPLACE FUNCTION request_driver_revision(
  p_driver_id       UUID,
  p_fields          TEXT[],
  p_message         TEXT
)
RETURNS UUID AS $$
DECLARE
  v_id UUID;
  v_is_staff BOOLEAN;
BEGIN
  SELECT (
    is_admin_user() OR
    EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'supervisor')
  ) INTO v_is_staff;

  IF NOT v_is_staff THEN
    RAISE EXCEPTION 'Only admins or supervisors can request revisions';
  END IF;

  -- Mark driver as pending revision (unverify temporarily)
  UPDATE drivers_profile
  SET is_verified = false
  WHERE id = p_driver_id;

  -- Create revision request
  INSERT INTO driver_revision_requests (driver_id, admin_id, fields_requested, message)
  VALUES (p_driver_id, auth.uid(), p_fields, p_message)
  RETURNING id INTO v_id;

  RETURN v_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION request_driver_revision(UUID, TEXT[], TEXT) TO authenticated;

-- ==========================================
-- 9. UPDATED VIEW: admin_users_list with is_blocked
-- ==========================================

CREATE OR REPLACE VIEW admin_users_list AS
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
-- 10. VERIFICATION
-- ==========================================

SELECT table_name FROM information_schema.tables
WHERE table_schema = 'public'
  AND table_name IN ('complaints', 'driver_revision_requests')
ORDER BY table_name;

SELECT routine_name FROM information_schema.routines
WHERE routine_schema = 'public'
  AND routine_name IN (
    'block_user', 'unblock_user', 'set_user_role',
    'resolve_complaint', 'request_driver_revision'
  )
ORDER BY routine_name;

-- ==========================================
-- END
-- ==========================================
