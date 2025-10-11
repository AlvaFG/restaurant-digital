-- ============================================
-- Migration: Add Auth System
-- Description: Add authentication helpers for restaurant users
-- Author: Restaurant Digital Team
-- Date: 2025-10-11
-- ============================================

-- ============================================
-- EXTEND USERS TABLE
-- ============================================

-- Add last_login tracking
ALTER TABLE users ADD COLUMN last_login_at TIMESTAMPTZ;

-- Add password reset fields
ALTER TABLE users ADD COLUMN reset_token TEXT;
ALTER TABLE users ADD COLUMN reset_token_expires_at TIMESTAMPTZ;

-- Index for password reset tokens
CREATE INDEX idx_users_reset_token ON users(reset_token) WHERE reset_token IS NOT NULL;

-- Comments
COMMENT ON COLUMN users.last_login_at IS 'Timestamp of last successful login';
COMMENT ON COLUMN users.reset_token IS 'Token for password reset';

-- ============================================
-- HELPER FUNCTIONS FOR AUTH
-- ============================================

-- Function to get user's tenant
CREATE OR REPLACE FUNCTION get_user_tenant(user_id UUID)
RETURNS UUID AS $$
DECLARE
  user_tenant UUID;
BEGIN
  SELECT tenant_id
  INTO user_tenant
  FROM users
  WHERE id = user_id
  AND active = true;
  
  RETURN user_tenant;
END;
$$ LANGUAGE plpgsql STABLE;

-- Function to validate user can access tenant
CREATE OR REPLACE FUNCTION can_access_tenant(user_id UUID, target_tenant_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  -- User can only access their own tenant
  RETURN EXISTS (
    SELECT 1 FROM users
    WHERE id = user_id
    AND tenant_id = target_tenant_id
    AND active = true
  );
END;
$$ LANGUAGE plpgsql STABLE;

-- Function to create new tenant admin
CREATE OR REPLACE FUNCTION create_tenant_admin(
  p_tenant_id UUID,
  p_email TEXT,
  p_password_hash TEXT,
  p_name TEXT
)
RETURNS UUID AS $$
DECLARE
  new_user_id UUID;
BEGIN
  INSERT INTO users (
    tenant_id,
    email,
    password_hash,
    name,
    role,
    active
  ) VALUES (
    p_tenant_id,
    p_email,
    p_password_hash,
    p_name,
    'admin',
    true
  )
  RETURNING id INTO new_user_id;
  
  -- Log the creation
  INSERT INTO audit_logs (
    tenant_id,
    user_id,
    action,
    entity_type,
    entity_id,
    changes
  ) VALUES (
    p_tenant_id,
    new_user_id,
    'CREATE',
    'user',
    new_user_id,
    jsonb_build_object(
      'after', jsonb_build_object(
        'email', p_email,
        'name', p_name,
        'role', 'admin'
      )
    )
  );
  
  RETURN new_user_id;
END;
$$ LANGUAGE plpgsql;

-- Function to create staff user
CREATE OR REPLACE FUNCTION create_staff_user(
  p_tenant_id UUID,
  p_email TEXT,
  p_password_hash TEXT,
  p_name TEXT,
  p_role TEXT,
  p_created_by UUID
)
RETURNS UUID AS $$
DECLARE
  new_user_id UUID;
BEGIN
  -- Validate that creator has permission
  IF NOT can_access_tenant(p_created_by, p_tenant_id) THEN
    RAISE EXCEPTION 'Unauthorized to create users for this tenant';
  END IF;
  
  -- Validate role
  IF p_role NOT IN ('staff', 'manager') THEN
    RAISE EXCEPTION 'Invalid role. Must be staff or manager';
  END IF;
  
  INSERT INTO users (
    tenant_id,
    email,
    password_hash,
    name,
    role,
    active
  ) VALUES (
    p_tenant_id,
    p_email,
    p_password_hash,
    p_name,
    p_role,
    true
  )
  RETURNING id INTO new_user_id;
  
  -- Log the creation
  INSERT INTO audit_logs (
    tenant_id,
    user_id,
    action,
    entity_type,
    entity_id,
    changes
  ) VALUES (
    p_tenant_id,
    p_created_by,
    'CREATE',
    'user',
    new_user_id,
    jsonb_build_object(
      'after', jsonb_build_object(
        'email', p_email,
        'name', p_name,
        'role', p_role
      )
    )
  );
  
  RETURN new_user_id;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- VIEWS FOR CONVENIENCE
-- ============================================

-- View: Active users by tenant
CREATE OR REPLACE VIEW v_active_users AS
SELECT 
  u.id,
  u.tenant_id,
  t.name as tenant_name,
  u.email,
  u.name,
  u.role,
  u.active,
  u.last_login_at,
  u.created_at
FROM users u
JOIN tenants t ON u.tenant_id = t.id
WHERE u.active = true;

-- View: Tenant statistics
CREATE OR REPLACE VIEW v_tenant_stats AS
SELECT
  t.id,
  t.name,
  t.slug,
  COUNT(DISTINCT u.id) FILTER (WHERE u.active = true) as active_users,
  COUNT(DISTINCT tb.id) as total_tables,
  COUNT(DISTINCT mi.id) as menu_items,
  COUNT(DISTINCT o.id) as total_orders,
  COUNT(DISTINCT o.id) FILTER (WHERE o.created_at > NOW() - INTERVAL '7 days') as orders_last_7_days,
  t.created_at
FROM tenants t
LEFT JOIN users u ON u.tenant_id = t.id
LEFT JOIN tables tb ON tb.tenant_id = t.id
LEFT JOIN menu_items mi ON mi.tenant_id = t.id
LEFT JOIN orders o ON o.tenant_id = t.id
GROUP BY t.id, t.name, t.slug, t.created_at;

-- Grant access to views
GRANT SELECT ON v_active_users TO authenticated;
GRANT SELECT ON v_tenant_stats TO authenticated;

-- Comments
COMMENT ON VIEW v_active_users IS 'Active users with tenant information';
COMMENT ON VIEW v_tenant_stats IS 'Statistics per tenant for dashboard';

-- ============================================
-- SEED ADMIN USER FOR DEMO TENANT
-- ============================================

-- Create admin user for demo tenant
-- Password: "demo123" (for testing)
INSERT INTO users (
  tenant_id,
  email,
  password_hash,
  name,
  role,
  active
) VALUES (
  (SELECT id FROM tenants WHERE slug = 'demo' LIMIT 1),
  'admin@demo.restaurant',
  '$2a$10$demo123hashdemo123hashdemo123hashdemo123hashdemo123hash', -- Replace with real hash
  'Admin Demo',
  'admin',
  true
);

-- Create sample staff user
INSERT INTO users (
  tenant_id,
  email,
  password_hash,
  name,
  role,
  active
) VALUES (
  (SELECT id FROM tenants WHERE slug = 'demo' LIMIT 1),
  'mesero@demo.restaurant',
  '$2a$10$staff123hashstaff123hashstaff123hashstaff123hashstaff', -- Replace with real hash
  'Juan Mesero',
  'staff',
  true
);

-- ============================================
-- TRIGGERS FOR AUDIT LOGGING
-- ============================================

-- Trigger to log user creation
CREATE OR REPLACE FUNCTION log_user_creation()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO audit_logs (
    tenant_id,
    user_id,
    action,
    entity_type,
    entity_id,
    changes
  ) VALUES (
    NEW.tenant_id,
    NEW.id,
    'CREATE',
    'user',
    NEW.id,
    jsonb_build_object(
      'after', row_to_json(NEW)
    )
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER user_creation_audit
  AFTER INSERT ON users
  FOR EACH ROW
  EXECUTE FUNCTION log_user_creation();

-- Trigger to log user updates
CREATE OR REPLACE FUNCTION log_user_update()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO audit_logs (
    tenant_id,
    user_id,
    action,
    entity_type,
    entity_id,
    changes
  ) VALUES (
    NEW.tenant_id,
    NEW.id,
    'UPDATE',
    'user',
    NEW.id,
    jsonb_build_object(
      'before', row_to_json(OLD),
      'after', row_to_json(NEW)
    )
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER user_update_audit
  AFTER UPDATE ON users
  FOR EACH ROW
  EXECUTE FUNCTION log_user_update();

-- ============================================
-- PERMISSIONS SUMMARY
-- ============================================

COMMENT ON FUNCTION get_user_tenant IS 'Get user tenant ID';
COMMENT ON FUNCTION can_access_tenant IS 'Check if user can access specific tenant';
COMMENT ON FUNCTION create_tenant_admin IS 'Create admin user for new tenant';
COMMENT ON FUNCTION create_staff_user IS 'Create staff/manager user (must be called by admin)';

-- Summary of roles:
-- admin: Can manage their tenant (restaurant owner)
-- manager: Can manage operations (shift supervisor)
-- staff: Can take orders and serve tables (waiters)
