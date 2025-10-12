-- ============================================
-- SEED DEFAULT ZONES
-- ============================================
-- Crear zonas por defecto para todos los tenants que no tengan zonas

-- Función para crear zonas por defecto
CREATE OR REPLACE FUNCTION create_default_zones_for_tenant(p_tenant_id UUID)
RETURNS void AS $$
BEGIN
  -- Solo crear si el tenant no tiene zonas
  IF NOT EXISTS (SELECT 1 FROM zones WHERE tenant_id = p_tenant_id) THEN
    INSERT INTO zones (tenant_id, name, description, sort_order, active)
    VALUES
      (p_tenant_id, 'Salón Principal', 'Área principal del restaurante', 1, true),
      (p_tenant_id, 'Terraza', 'Área exterior', 2, true),
      (p_tenant_id, 'Patio', 'Patio al aire libre', 3, true),
      (p_tenant_id, 'Bar', 'Área de barra', 4, true),
      (p_tenant_id, 'VIP', 'Área exclusiva', 5, true);
  END IF;
END;
$$ LANGUAGE plpgsql;

-- Comentario
COMMENT ON FUNCTION create_default_zones_for_tenant IS 'Crea zonas por defecto para un tenant si no tiene ninguna';

-- Crear zonas por defecto para todos los tenants existentes
-- (solo si no tienen zonas ya creadas)
DO $$
DECLARE
  tenant_record RECORD;
BEGIN
  FOR tenant_record IN SELECT id FROM tenants LOOP
    PERFORM create_default_zones_for_tenant(tenant_record.id);
  END LOOP;
END;
$$;

-- ============================================
-- TRIGGER: Crear zonas al crear nuevo tenant
-- ============================================

CREATE OR REPLACE FUNCTION trigger_create_default_zones()
RETURNS TRIGGER AS $$
BEGIN
  PERFORM create_default_zones_for_tenant(NEW.id);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER create_default_zones_on_tenant_insert
  AFTER INSERT ON tenants
  FOR EACH ROW
  EXECUTE FUNCTION trigger_create_default_zones();

-- Comentario
COMMENT ON TRIGGER create_default_zones_on_tenant_insert ON tenants IS 
  'Crea zonas por defecto automáticamente cuando se crea un nuevo tenant';
