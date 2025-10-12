-- ============================================
-- MODIFY TABLES STRUCTURE
-- ============================================
-- 1. Cambiar 'number' de INTEGER a TEXT para permitir identificadores flexibles
-- 2. Cambiar 'zone' de TEXT a zone_id (FK a zones)

-- ============================================
-- PASO 1: Migrar datos existentes de zones
-- ============================================

-- Insertar zonas únicas existentes en la tabla zones
INSERT INTO zones (tenant_id, name, sort_order, active)
SELECT DISTINCT 
  tenant_id,
  COALESCE(zone, 'Sin zona') as name,
  0 as sort_order,
  true as active
FROM tables
WHERE zone IS NOT NULL
ON CONFLICT (tenant_id, name) DO NOTHING;

-- Insertar zona por defecto para registros sin zona
INSERT INTO zones (tenant_id, name, sort_order, active)
SELECT DISTINCT 
  tenant_id,
  'Sin zona' as name,
  999 as sort_order,
  true as active
FROM tables
WHERE zone IS NULL
ON CONFLICT (tenant_id, name) DO NOTHING;

-- ============================================
-- PASO 2: Agregar columna zone_id temporal
-- ============================================

ALTER TABLE tables ADD COLUMN zone_id UUID REFERENCES zones(id) ON DELETE SET NULL;

-- Crear índice en zone_id
CREATE INDEX idx_tables_zone_id ON tables(zone_id);

-- ============================================
-- PASO 3: Migrar datos de zone (TEXT) a zone_id (UUID)
-- ============================================

-- Actualizar zone_id basado en el nombre de zona existente
UPDATE tables t
SET zone_id = z.id
FROM zones z
WHERE t.tenant_id = z.tenant_id 
  AND COALESCE(t.zone, 'Sin zona') = z.name;

-- ============================================
-- PASO 4: Eliminar columna zone antigua
-- ============================================

ALTER TABLE tables DROP COLUMN zone;

-- ============================================
-- PASO 5: Cambiar tipo de 'number' a TEXT
-- ============================================

-- Crear columna temporal
ALTER TABLE tables ADD COLUMN number_text TEXT;

-- Migrar datos: convertir INTEGER a TEXT
UPDATE tables SET number_text = number::TEXT;

-- Eliminar constraint único antiguo
ALTER TABLE tables DROP CONSTRAINT IF EXISTS tables_tenant_id_number_key;

-- Eliminar columna antigua
ALTER TABLE tables DROP COLUMN number;

-- Renombrar columna temporal
ALTER TABLE tables RENAME COLUMN number_text TO number;

-- Hacer NOT NULL
ALTER TABLE tables ALTER COLUMN number SET NOT NULL;

-- Agregar constraint único para TEXT
ALTER TABLE tables ADD CONSTRAINT tables_tenant_id_number_key UNIQUE(tenant_id, number);

-- ============================================
-- COMENTARIOS ACTUALIZADOS
-- ============================================

COMMENT ON COLUMN tables.number IS 'Identificador de la mesa (texto libre: "1", "Mesa 1", "M1", etc.)';
COMMENT ON COLUMN tables.zone_id IS 'Zona/área donde se encuentra la mesa';

-- ============================================
-- NOTAS DE MIGRACIÓN
-- ============================================

-- Esta migración:
-- 1. Preserva todas las zonas existentes creando registros en 'zones'
-- 2. Convierte la relación de TEXT a FK (zone_id → zones.id)
-- 3. Cambia 'number' de INTEGER a TEXT para mayor flexibilidad
-- 4. Mantiene la unicidad de identificadores por tenant
-- 5. Usa ON DELETE SET NULL para no eliminar mesas si se borra una zona
