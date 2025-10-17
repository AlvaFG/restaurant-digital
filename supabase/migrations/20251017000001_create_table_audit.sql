-- =============================================
-- Migration: Create Table Status Audit System
-- Description: Tabla de auditoría para trackear todos los cambios de estado de mesas
-- Author: System
-- Date: 2025-10-17
-- =============================================

-- Crear tabla de auditoría para cambios de estado de mesas
CREATE TABLE IF NOT EXISTS public.table_status_audit (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  table_id UUID NOT NULL REFERENCES public.tables(id) ON DELETE CASCADE,
  table_number TEXT NOT NULL,
  
  -- Estados
  previous_status TEXT NOT NULL,
  new_status TEXT NOT NULL,
  
  -- Contexto del cambio
  changed_by UUID REFERENCES public.users(id) ON DELETE SET NULL,
  changed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  reason TEXT,
  
  -- Referencias relacionadas
  order_id UUID REFERENCES public.orders(id) ON DELETE SET NULL,
  session_id UUID,
  
  -- Métricas
  duration_seconds INTEGER, -- Tiempo que estuvo en el estado anterior
  
  -- Metadata adicional (JSON flexible)
  metadata JSONB DEFAULT '{}'::jsonb,
  
  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- =============================================
-- Índices para optimizar consultas
-- =============================================

-- Índice por mesa (consultas de historial)
CREATE INDEX idx_table_audit_table_id ON public.table_status_audit(table_id);

-- Índice por tenant (aislamiento multi-tenant)
CREATE INDEX idx_table_audit_tenant_id ON public.table_status_audit(tenant_id);

-- Índice por fecha (consultas por rango de tiempo)
CREATE INDEX idx_table_audit_changed_at ON public.table_status_audit(changed_at DESC);

-- Índice por usuario (quién hizo qué)
CREATE INDEX idx_table_audit_changed_by ON public.table_status_audit(changed_by);

-- Índice por pedido (relacionar cambios con pedidos)
CREATE INDEX idx_table_audit_order_id ON public.table_status_audit(order_id);

-- Índice compuesto para consultas frecuentes
CREATE INDEX idx_table_audit_table_date ON public.table_status_audit(table_id, changed_at DESC);

-- =============================================
-- Trigger para actualizar updated_at
-- =============================================

CREATE OR REPLACE FUNCTION update_table_audit_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_table_audit_updated_at
  BEFORE UPDATE ON public.table_status_audit
  FOR EACH ROW
  EXECUTE FUNCTION update_table_audit_updated_at();

-- =============================================
-- Row Level Security (RLS)
-- =============================================

-- Habilitar RLS
ALTER TABLE public.table_status_audit ENABLE ROW LEVEL SECURITY;

-- Policy: Los usuarios solo pueden ver auditorías de su tenant
CREATE POLICY table_audit_tenant_isolation ON public.table_status_audit
  FOR SELECT
  USING (
    tenant_id IN (
      SELECT tenant_id FROM public.users WHERE id = auth.uid()
    )
  );

-- Policy: Solo usuarios autenticados pueden insertar registros de auditoría
CREATE POLICY table_audit_insert ON public.table_status_audit
  FOR INSERT
  WITH CHECK (
    tenant_id IN (
      SELECT tenant_id FROM public.users WHERE id = auth.uid()
    )
  );

-- Policy: No se permite actualizar registros de auditoría (inmutables)
CREATE POLICY table_audit_no_update ON public.table_status_audit
  FOR UPDATE
  USING (false);

-- Policy: No se permite eliminar registros de auditoría (solo admin)
CREATE POLICY table_audit_no_delete ON public.table_status_audit
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.users 
      WHERE id = auth.uid() 
      AND role = 'admin'
      AND tenant_id = table_status_audit.tenant_id
    )
  );

-- =============================================
-- Función helper: Calcular duración en estado anterior
-- =============================================

CREATE OR REPLACE FUNCTION calculate_previous_state_duration(
  p_table_id UUID,
  p_tenant_id UUID
)
RETURNS INTEGER AS $$
DECLARE
  last_change TIMESTAMPTZ;
  duration INTEGER;
BEGIN
  -- Obtener el último cambio de estado
  SELECT changed_at INTO last_change
  FROM public.table_status_audit
  WHERE table_id = p_table_id
    AND tenant_id = p_tenant_id
  ORDER BY changed_at DESC
  LIMIT 1;
  
  -- Si no hay cambios previos, retornar NULL
  IF last_change IS NULL THEN
    RETURN NULL;
  END IF;
  
  -- Calcular duración en segundos
  duration := EXTRACT(EPOCH FROM (NOW() - last_change))::INTEGER;
  
  RETURN duration;
END;
$$ LANGUAGE plpgsql;

-- =============================================
-- Función: Registrar cambio de estado
-- =============================================

CREATE OR REPLACE FUNCTION log_table_status_change(
  p_tenant_id UUID,
  p_table_id UUID,
  p_table_number TEXT,
  p_previous_status TEXT,
  p_new_status TEXT,
  p_changed_by UUID DEFAULT NULL,
  p_reason TEXT DEFAULT NULL,
  p_order_id UUID DEFAULT NULL,
  p_metadata JSONB DEFAULT '{}'::jsonb
)
RETURNS UUID AS $$
DECLARE
  v_audit_id UUID;
  v_duration INTEGER;
BEGIN
  -- Calcular duración en estado anterior
  v_duration := calculate_previous_state_duration(p_table_id, p_tenant_id);
  
  -- Insertar registro de auditoría
  INSERT INTO public.table_status_audit (
    tenant_id,
    table_id,
    table_number,
    previous_status,
    new_status,
    changed_by,
    changed_at,
    reason,
    order_id,
    duration_seconds,
    metadata
  ) VALUES (
    p_tenant_id,
    p_table_id,
    p_table_number,
    p_previous_status,
    p_new_status,
    COALESCE(p_changed_by, auth.uid()),
    NOW(),
    p_reason,
    p_order_id,
    v_duration,
    p_metadata
  )
  RETURNING id INTO v_audit_id;
  
  RETURN v_audit_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =============================================
-- Vistas útiles para reportes
-- =============================================

-- Vista: Resumen de cambios por mesa
CREATE OR REPLACE VIEW table_status_changes_summary AS
SELECT 
  t.id as table_id,
  t.number as table_number,
  t.tenant_id,
  COUNT(*) as total_changes,
  COUNT(DISTINCT DATE(tsa.changed_at)) as days_with_changes,
  AVG(tsa.duration_seconds) as avg_duration_seconds,
  MAX(tsa.changed_at) as last_change_at
FROM public.tables t
LEFT JOIN public.table_status_audit tsa ON t.id = tsa.table_id
GROUP BY t.id, t.number, t.tenant_id;

-- Vista: Cambios recientes (últimas 24 horas)
CREATE OR REPLACE VIEW recent_table_status_changes AS
SELECT 
  tsa.*,
  t.number as table_number,
  u.email as changed_by_email,
  o.order_number
FROM public.table_status_audit tsa
JOIN public.tables t ON tsa.table_id = t.id
LEFT JOIN public.users u ON tsa.changed_by = u.id
LEFT JOIN public.orders o ON tsa.order_id = o.id
WHERE tsa.changed_at >= NOW() - INTERVAL '24 hours'
ORDER BY tsa.changed_at DESC;

-- =============================================
-- Comentarios de documentación
-- =============================================

COMMENT ON TABLE public.table_status_audit IS 
  'Tabla de auditoría que registra todos los cambios de estado de las mesas para trazabilidad y análisis';

COMMENT ON COLUMN public.table_status_audit.duration_seconds IS 
  'Tiempo en segundos que la mesa permaneció en el estado anterior antes de este cambio';

COMMENT ON COLUMN public.table_status_audit.metadata IS 
  'Campo JSONB flexible para almacenar información adicional sobre el cambio de estado';

COMMENT ON FUNCTION log_table_status_change IS 
  'Función helper para registrar cambios de estado con cálculo automático de duración';

-- =============================================
-- Datos de ejemplo (solo para desarrollo)
-- =============================================

-- Descomentar solo en ambiente de desarrollo
/*
INSERT INTO public.table_status_audit (
  tenant_id,
  table_id,
  table_number,
  previous_status,
  new_status,
  reason,
  metadata
) VALUES (
  (SELECT id FROM public.tenants LIMIT 1),
  (SELECT id FROM public.tables LIMIT 1),
  '1',
  'libre',
  'ocupada',
  'Cliente llegó y fue asignado',
  '{"party_size": 4, "waiter": "Juan"}'::jsonb
);
*/

-- =============================================
-- Grants de permisos
-- =============================================

-- Permitir a usuarios autenticados leer y escribir auditoría
GRANT SELECT, INSERT ON public.table_status_audit TO authenticated;
GRANT SELECT ON table_status_changes_summary TO authenticated;
GRANT SELECT ON recent_table_status_changes TO authenticated;

-- Permitir ejecutar funciones
GRANT EXECUTE ON FUNCTION log_table_status_change TO authenticated;
GRANT EXECUTE ON FUNCTION calculate_previous_state_duration TO authenticated;

-- =============================================
-- Finalización
-- =============================================

-- Verificar que la tabla fue creada correctamente
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name = 'table_status_audit'
  ) THEN
    RAISE NOTICE 'Tabla table_status_audit creada exitosamente';
  ELSE
    RAISE EXCEPTION 'Error al crear tabla table_status_audit';
  END IF;
END $$;
