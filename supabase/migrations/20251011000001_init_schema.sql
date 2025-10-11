-- ============================================
-- Migration: Init Schema
-- Description: Create initial database schema for restaurant management
-- Author: Restaurant Digital Team
-- Date: 2025-10-11
-- ============================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- TENANTS TABLE
-- ============================================
CREATE TABLE tenants (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  logo_url TEXT,
  settings JSONB DEFAULT '{
    "theme": {
      "accentColor": "#3b82f6"
    },
    "features": {
      "tablets": true,
      "kds": true,
      "payments": true
    }
  }'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_tenants_slug ON tenants(slug);

-- Comments
COMMENT ON TABLE tenants IS 'Multi-tenant configuration';
COMMENT ON COLUMN tenants.settings IS 'JSON configuration for theme, features, etc.';

-- ============================================
-- USERS TABLE
-- ============================================
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  name TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('admin', 'staff', 'manager')),
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_users_tenant ON users(tenant_id);
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_role ON users(role);

-- Comments
COMMENT ON TABLE users IS 'System users with roles';

-- ============================================
-- TABLES (Restaurant Tables)
-- ============================================
CREATE TABLE tables (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  number INTEGER NOT NULL,
  zone TEXT,
  capacity INTEGER NOT NULL DEFAULT 4,
  status TEXT NOT NULL DEFAULT 'libre' CHECK (
    status IN ('libre', 'ocupada', 'reservada', 'pedido-en-curso', 'cuenta-pedida', 'en-limpieza')
  ),
  position JSONB,
  qrcode_url TEXT,
  qr_token TEXT,
  qr_expires_at TIMESTAMPTZ,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(tenant_id, number)
);

-- Indexes
CREATE INDEX idx_tables_tenant ON tables(tenant_id);
CREATE INDEX idx_tables_status ON tables(status);
CREATE INDEX idx_tables_qr_token ON tables(qr_token) WHERE qr_token IS NOT NULL;
CREATE INDEX idx_tables_zone ON tables(zone) WHERE zone IS NOT NULL;

-- Comments
COMMENT ON TABLE tables IS 'Restaurant tables with QR codes';
COMMENT ON COLUMN tables.position IS 'JSON: { x: number, y: number }';

-- ============================================
-- MENU CATEGORIES
-- ============================================
CREATE TABLE menu_categories (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  sort_order INTEGER NOT NULL DEFAULT 0,
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(tenant_id, name)
);

-- Indexes
CREATE INDEX idx_menu_categories_tenant ON menu_categories(tenant_id);
CREATE INDEX idx_menu_categories_sort ON menu_categories(sort_order);
CREATE INDEX idx_menu_categories_active ON menu_categories(active);

-- Comments
COMMENT ON TABLE menu_categories IS 'Menu categories (Entradas, Principales, Postres, etc.)';

-- ============================================
-- MENU ITEMS
-- ============================================
CREATE TABLE menu_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  category_id UUID NOT NULL REFERENCES menu_categories(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT NOT NULL,
  price_cents INTEGER NOT NULL CHECK (price_cents >= 0),
  available BOOLEAN DEFAULT true,
  image_url TEXT,
  tags TEXT[] DEFAULT '{}',
  allergens JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_menu_items_tenant ON menu_items(tenant_id);
CREATE INDEX idx_menu_items_category ON menu_items(category_id);
CREATE INDEX idx_menu_items_available ON menu_items(available);
CREATE INDEX idx_menu_items_tags ON menu_items USING GIN(tags);

-- Comments
COMMENT ON TABLE menu_items IS 'Menu items (dishes)';
COMMENT ON COLUMN menu_items.allergens IS 'JSON: [{ code, contains, traces, notes }]';

-- ============================================
-- INVENTORY
-- ============================================
CREATE TABLE inventory (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  menu_item_id UUID NOT NULL REFERENCES menu_items(id) ON DELETE CASCADE,
  stock INTEGER NOT NULL DEFAULT 0 CHECK (stock >= 0),
  min_stock INTEGER NOT NULL DEFAULT 3,
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(tenant_id, menu_item_id)
);

-- Indexes
CREATE INDEX idx_inventory_tenant ON inventory(tenant_id);
CREATE INDEX idx_inventory_menu_item ON inventory(menu_item_id);
CREATE INDEX idx_inventory_low_stock ON inventory(stock) WHERE stock <= min_stock;

-- Comments
COMMENT ON TABLE inventory IS 'Stock tracking for menu items';

-- ============================================
-- ORDERS
-- ============================================
CREATE TABLE orders (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  table_id UUID REFERENCES tables(id) ON DELETE SET NULL,
  order_number TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'abierto' CHECK (
    status IN ('abierto', 'en-preparacion', 'listo', 'servido', 'pagado', 'cancelado')
  ),
  payment_status TEXT NOT NULL DEFAULT 'pendiente' CHECK (
    payment_status IN ('pendiente', 'parcial', 'pagado', 'reembolsado')
  ),
  source TEXT DEFAULT 'staff' CHECK (source IN ('staff', 'qr', 'kiosk')),
  subtotal_cents INTEGER NOT NULL,
  discount_total_cents INTEGER DEFAULT 0,
  tax_total_cents INTEGER NOT NULL,
  tip_cents INTEGER DEFAULT 0,
  service_charge_cents INTEGER DEFAULT 0,
  total_cents INTEGER NOT NULL,
  notes TEXT,
  customer_data JSONB,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(tenant_id, order_number)
);

-- Indexes
CREATE INDEX idx_orders_tenant ON orders(tenant_id);
CREATE INDEX idx_orders_table ON orders(table_id);
CREATE INDEX idx_orders_status ON orders(status);
CREATE INDEX idx_orders_payment_status ON orders(payment_status);
CREATE INDEX idx_orders_created ON orders(created_at DESC);
CREATE INDEX idx_orders_source ON orders(source);

-- Comments
COMMENT ON TABLE orders IS 'Customer orders';
COMMENT ON COLUMN orders.customer_data IS 'JSON: { name, email, phone }';

-- ============================================
-- ORDER ITEMS
-- ============================================
CREATE TABLE order_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  menu_item_id UUID NOT NULL REFERENCES menu_items(id) ON DELETE RESTRICT,
  name TEXT NOT NULL,
  quantity INTEGER NOT NULL CHECK (quantity > 0),
  unit_price_cents INTEGER NOT NULL,
  total_cents INTEGER NOT NULL,
  notes TEXT,
  modifiers JSONB DEFAULT '[]'::jsonb,
  discount JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_order_items_order ON order_items(order_id);
CREATE INDEX idx_order_items_menu_item ON order_items(menu_item_id);

-- Comments
COMMENT ON TABLE order_items IS 'Items in an order';
COMMENT ON COLUMN order_items.modifiers IS 'JSON: [{ id?, name, priceCents }]';
COMMENT ON COLUMN order_items.discount IS 'JSON: { type, value, amountCents, code, reason }';

-- ============================================
-- ORDER DISCOUNTS
-- ============================================
CREATE TABLE order_discounts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('percentage', 'fixed')),
  value NUMERIC NOT NULL,
  amount_cents INTEGER NOT NULL,
  code TEXT,
  reason TEXT,
  scope TEXT NOT NULL DEFAULT 'order' CHECK (scope IN ('order', 'item')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_order_discounts_order ON order_discounts(order_id);

-- Comments
COMMENT ON TABLE order_discounts IS 'Discounts applied to orders';

-- ============================================
-- ORDER TAXES
-- ============================================
CREATE TABLE order_taxes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  code TEXT NOT NULL,
  name TEXT NOT NULL,
  rate NUMERIC,
  amount_cents INTEGER NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_order_taxes_order ON order_taxes(order_id);

-- Comments
COMMENT ON TABLE order_taxes IS 'Taxes applied to orders';

-- ============================================
-- PAYMENTS
-- ============================================
CREATE TABLE payments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  table_id UUID REFERENCES tables(id) ON DELETE SET NULL,
  payment_number TEXT NOT NULL,
  provider TEXT NOT NULL CHECK (provider IN ('mercadopago', 'stripe', 'cash')),
  status TEXT NOT NULL DEFAULT 'pending' CHECK (
    status IN ('pending', 'processing', 'completed', 'failed', 'refunded', 'cancelled', 'expired')
  ),
  method TEXT,
  amount_cents INTEGER NOT NULL,
  currency TEXT NOT NULL DEFAULT 'ARS',
  external_id TEXT,
  checkout_url TEXT,
  expires_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  failure_reason TEXT,
  failure_code TEXT,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(tenant_id, payment_number)
);

-- Indexes
CREATE INDEX idx_payments_tenant ON payments(tenant_id);
CREATE INDEX idx_payments_order ON payments(order_id);
CREATE INDEX idx_payments_status ON payments(status);
CREATE INDEX idx_payments_external_id ON payments(external_id) WHERE external_id IS NOT NULL;
CREATE INDEX idx_payments_created ON payments(created_at DESC);

-- Comments
COMMENT ON TABLE payments IS 'Payment transactions';

-- ============================================
-- QR SESSIONS
-- ============================================
CREATE TABLE qr_sessions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  table_id UUID NOT NULL REFERENCES tables(id) ON DELETE CASCADE,
  token TEXT UNIQUE NOT NULL,
  status TEXT NOT NULL DEFAULT 'active' CHECK (
    status IN ('active', 'completed', 'expired', 'error')
  ),
  ip_address INET,
  user_agent TEXT,
  scanned_at TIMESTAMPTZ DEFAULT NOW(),
  last_activity_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ NOT NULL,
  completed_at TIMESTAMPTZ,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_qr_sessions_tenant ON qr_sessions(tenant_id);
CREATE INDEX idx_qr_sessions_table ON qr_sessions(table_id);
CREATE INDEX idx_qr_sessions_token ON qr_sessions(token);
CREATE INDEX idx_qr_sessions_status ON qr_sessions(status);
CREATE INDEX idx_qr_sessions_expires ON qr_sessions(expires_at);

-- Comments
COMMENT ON TABLE qr_sessions IS 'QR code scanning sessions';

-- ============================================
-- AUDIT LOGS
-- ============================================
CREATE TABLE audit_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  action TEXT NOT NULL,
  entity_type TEXT NOT NULL,
  entity_id UUID,
  changes JSONB,
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_audit_logs_tenant ON audit_logs(tenant_id);
CREATE INDEX idx_audit_logs_entity ON audit_logs(entity_type, entity_id);
CREATE INDEX idx_audit_logs_user ON audit_logs(user_id);
CREATE INDEX idx_audit_logs_created ON audit_logs(created_at DESC);

-- Comments
COMMENT ON TABLE audit_logs IS 'Audit trail for all changes';
COMMENT ON COLUMN audit_logs.changes IS 'JSON: { before: {}, after: {} }';

-- ============================================
-- TRIGGERS FOR UPDATED_AT
-- ============================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply to all tables with updated_at
CREATE TRIGGER update_tenants_updated_at BEFORE UPDATE ON tenants
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_tables_updated_at BEFORE UPDATE ON tables
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_menu_categories_updated_at BEFORE UPDATE ON menu_categories
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_menu_items_updated_at BEFORE UPDATE ON menu_items
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_orders_updated_at BEFORE UPDATE ON orders
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_payments_updated_at BEFORE UPDATE ON payments
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- INITIAL DATA
-- ============================================

-- Create default tenant
INSERT INTO tenants (name, slug) VALUES ('Restaurant Demo', 'demo');
