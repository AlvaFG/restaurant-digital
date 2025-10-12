-- ============================================
-- ZONES TABLE
-- ============================================
-- Tabla para gestionar zonas/áreas del restaurante
-- Cada tenant puede tener múltiples zonas (Salón, Terraza, Patio, etc.)

CREATE TABLE zones (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  sort_order INTEGER NOT NULL DEFAULT 0,
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Nombre de zona único por tenant
  UNIQUE(tenant_id, name)
);

-- Indexes
CREATE INDEX idx_zones_tenant ON zones(tenant_id);
CREATE INDEX idx_zones_active ON zones(active);
CREATE INDEX idx_zones_sort_order ON zones(sort_order);

-- Comments
COMMENT ON TABLE zones IS 'Zonas/áreas del restaurante (Salón, Terraza, Patio, etc.)';
COMMENT ON COLUMN zones.sort_order IS 'Orden de visualización de las zonas';
COMMENT ON COLUMN zones.active IS 'Si la zona está activa para asignar mesas';

-- ============================================
-- RLS POLICIES FOR ZONES
-- ============================================

ALTER TABLE zones ENABLE ROW LEVEL SECURITY;

-- Users can only see zones from their tenant
CREATE POLICY zones_isolation_policy ON zones
  FOR ALL
  USING (tenant_id = current_tenant_id());

-- ============================================
-- TRIGGER: Updated At
-- ============================================

CREATE TRIGGER set_zones_updated_at
  BEFORE UPDATE ON zones
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
