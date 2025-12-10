-- ============================================
-- ADD POSITION TO ZONES TABLE
-- ============================================
-- Agregar campo position para almacenar la posición visual en el mapa

ALTER TABLE zones 
ADD COLUMN IF NOT EXISTS position JSONB DEFAULT NULL;

-- Comment
COMMENT ON COLUMN zones.position IS 'Posición visual de la zona en el mapa: {x, y, w, h}';

-- Index for performance
CREATE INDEX IF NOT EXISTS idx_zones_position ON zones USING GIN(position);
