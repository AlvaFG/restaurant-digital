-- ============================================
-- Migration: Add Row Level Security (RLS)
-- Description: Enable RLS to automatically filter by tenant
-- Author: Restaurant Digital Team
-- Date: 2025-10-11
-- ============================================

-- Enable RLS on all tables
ALTER TABLE tenants ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE tables ENABLE ROW LEVEL SECURITY;
ALTER TABLE menu_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE menu_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE inventory ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_discounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_taxes ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE qr_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

-- ============================================
-- HELPER FUNCTION: Get current tenant from JWT
-- ============================================
CREATE OR REPLACE FUNCTION current_tenant_id()
RETURNS UUID AS $$
BEGIN
  -- Extract tenant_id from JWT claim
  -- In Supabase, custom claims are stored in app_metadata
  RETURN COALESCE(
    current_setting('request.jwt.claims', true)::json->>'tenant_id',
    current_setting('app.current_tenant_id', true)
  )::uuid;
EXCEPTION
  WHEN OTHERS THEN
    RETURN NULL;
END;
$$ LANGUAGE plpgsql STABLE;

-- ============================================
-- RLS POLICIES: TENANTS
-- ============================================

-- Users can only see their own tenant
CREATE POLICY tenant_isolation_policy ON tenants
  FOR ALL
  USING (id = current_tenant_id());

-- ============================================
-- RLS POLICIES: USERS
-- ============================================

-- Users can only see users from their tenant
CREATE POLICY users_isolation_policy ON users
  FOR ALL
  USING (tenant_id = current_tenant_id());

-- ============================================
-- RLS POLICIES: TABLES
-- ============================================

-- Users can only see tables from their tenant
CREATE POLICY tables_isolation_policy ON tables
  FOR ALL
  USING (tenant_id = current_tenant_id());

-- Allow QR sessions to read table info (for public QR ordering)
CREATE POLICY tables_qr_read_policy ON tables
  FOR SELECT
  USING (
    qr_token IS NOT NULL AND 
    qr_expires_at > NOW()
  );

-- ============================================
-- RLS POLICIES: MENU CATEGORIES
-- ============================================

-- Users can only see menu categories from their tenant
CREATE POLICY menu_categories_isolation_policy ON menu_categories
  FOR ALL
  USING (tenant_id = current_tenant_id());

-- Public read for QR ordering (anonymous users)
CREATE POLICY menu_categories_public_read ON menu_categories
  FOR SELECT
  USING (active = true);

-- ============================================
-- RLS POLICIES: MENU ITEMS
-- ============================================

-- Users can only manage menu items from their tenant
CREATE POLICY menu_items_isolation_policy ON menu_items
  FOR ALL
  USING (tenant_id = current_tenant_id());

-- Public read for QR ordering (anonymous users can see available items)
CREATE POLICY menu_items_public_read ON menu_items
  FOR SELECT
  USING (available = true);

-- ============================================
-- RLS POLICIES: INVENTORY
-- ============================================

-- Users can only see inventory from their tenant
CREATE POLICY inventory_isolation_policy ON inventory
  FOR ALL
  USING (tenant_id = current_tenant_id());

-- ============================================
-- RLS POLICIES: ORDERS
-- ============================================

-- Users can only see orders from their tenant
CREATE POLICY orders_isolation_policy ON orders
  FOR ALL
  USING (tenant_id = current_tenant_id());

-- QR customers can insert orders (will be validated via trigger)
CREATE POLICY orders_qr_insert ON orders
  FOR INSERT
  WITH CHECK (
    source = 'qr' AND
    tenant_id = current_tenant_id()
  );

-- QR customers can read their own orders (via session token)
CREATE POLICY orders_qr_read ON orders
  FOR SELECT
  USING (
    source = 'qr' AND
    table_id IN (
      SELECT table_id FROM qr_sessions
      WHERE token = current_setting('request.jwt.claims', true)::json->>'session_token'
      AND status = 'active'
    )
  );

-- ============================================
-- RLS POLICIES: ORDER ITEMS
-- ============================================

-- Users can only see order items from their tenant's orders
CREATE POLICY order_items_isolation_policy ON order_items
  FOR ALL
  USING (
    order_id IN (
      SELECT id FROM orders WHERE tenant_id = current_tenant_id()
    )
  );

-- ============================================
-- RLS POLICIES: ORDER DISCOUNTS
-- ============================================

CREATE POLICY order_discounts_isolation_policy ON order_discounts
  FOR ALL
  USING (
    order_id IN (
      SELECT id FROM orders WHERE tenant_id = current_tenant_id()
    )
  );

-- ============================================
-- RLS POLICIES: ORDER TAXES
-- ============================================

CREATE POLICY order_taxes_isolation_policy ON order_taxes
  FOR ALL
  USING (
    order_id IN (
      SELECT id FROM orders WHERE tenant_id = current_tenant_id()
    )
  );

-- ============================================
-- RLS POLICIES: PAYMENTS
-- ============================================

-- Users can only see payments from their tenant
CREATE POLICY payments_isolation_policy ON payments
  FOR ALL
  USING (tenant_id = current_tenant_id());

-- ============================================
-- RLS POLICIES: QR SESSIONS
-- ============================================

-- Users can only see QR sessions from their tenant
CREATE POLICY qr_sessions_isolation_policy ON qr_sessions
  FOR ALL
  USING (tenant_id = current_tenant_id());

-- Public can create QR sessions (for scanning)
CREATE POLICY qr_sessions_public_insert ON qr_sessions
  FOR INSERT
  WITH CHECK (true);

-- Public can read their own session
CREATE POLICY qr_sessions_public_read ON qr_sessions
  FOR SELECT
  USING (
    token = current_setting('request.jwt.claims', true)::json->>'session_token'
  );

-- ============================================
-- RLS POLICIES: AUDIT LOGS
-- ============================================

-- Only admins can read audit logs
CREATE POLICY audit_logs_admin_only ON audit_logs
  FOR SELECT
  USING (
    tenant_id = current_tenant_id() AND
    EXISTS (
      SELECT 1 FROM users
      WHERE id = auth.uid()
      AND role = 'admin'
      AND tenant_id = current_tenant_id()
    )
  );

-- System can always insert audit logs
CREATE POLICY audit_logs_system_insert ON audit_logs
  FOR INSERT
  WITH CHECK (true);

-- ============================================
-- SERVICE ROLE BYPASS
-- ============================================
-- Service role (backend) bypasses all RLS policies
-- This is automatic in Supabase when using the service_role key

COMMENT ON FUNCTION current_tenant_id IS 'Returns the current tenant ID from JWT claims or session variable';
