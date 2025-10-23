-- PASO 2: FUNCIONES Y VISTAS (ejecutar DESPUÉS del paso 1)
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

CREATE OR REPLACE FUNCTION calculate_previous_state_duration(p_table_id UUID, p_tenant_id UUID)
RETURNS INTEGER AS $$
DECLARE
  last_change TIMESTAMPTZ;
  duration INTEGER;
BEGIN
  SELECT changed_at INTO last_change
  FROM public.table_status_audit
  WHERE table_id = p_table_id AND tenant_id = p_tenant_id
  ORDER BY changed_at DESC LIMIT 1;
  
  IF last_change IS NULL THEN RETURN NULL; END IF;
  
  duration := EXTRACT(EPOCH FROM (NOW() - last_change))::INTEGER;
  RETURN duration;
END;
$$ LANGUAGE plpgsql;

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
  v_duration := calculate_previous_state_duration(p_table_id, p_tenant_id);
  
  INSERT INTO public.table_status_audit (
    tenant_id, table_id, table_number, previous_status, new_status,
    changed_by, changed_at, reason, order_id, duration_seconds, metadata
  ) VALUES (
    p_tenant_id, p_table_id, p_table_number, p_previous_status, p_new_status,
    COALESCE(p_changed_by, auth.uid()), NOW(), p_reason, p_order_id, v_duration, p_metadata
  ) RETURNING id INTO v_audit_id;
  
  RETURN v_audit_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE VIEW table_status_changes_summary AS
SELECT t.id as table_id, t.number as table_number, t.tenant_id,
  COUNT(*) as total_changes,
  COUNT(DISTINCT DATE(tsa.changed_at)) as days_with_changes,
  AVG(tsa.duration_seconds) as avg_duration_seconds,
  MAX(tsa.changed_at) as last_change_at
FROM public.tables t
LEFT JOIN public.table_status_audit tsa ON t.id = tsa.table_id
GROUP BY t.id, t.number, t.tenant_id;

CREATE OR REPLACE VIEW recent_table_status_changes AS
SELECT 
  tsa.id,
  tsa.tenant_id,
  tsa.table_id,
  tsa.table_number,
  tsa.previous_status,
  tsa.new_status,
  tsa.changed_by,
  tsa.changed_at,
  tsa.reason,
  tsa.order_id,
  tsa.session_id,
  tsa.duration_seconds,
  tsa.metadata,
  tsa.created_at,
  tsa.updated_at,
  t.number as current_table_number,
  u.email as changed_by_email,
  o.order_number
FROM public.table_status_audit tsa
JOIN public.tables t ON tsa.table_id = t.id
LEFT JOIN public.users u ON tsa.changed_by = u.id
LEFT JOIN public.orders o ON tsa.order_id = o.id
WHERE tsa.changed_at >= NOW() - INTERVAL '24 hours'
ORDER BY tsa.changed_at DESC;

GRANT SELECT, INSERT ON public.table_status_audit TO authenticated;
GRANT SELECT ON table_status_changes_summary TO authenticated;
GRANT SELECT ON recent_table_status_changes TO authenticated;
GRANT EXECUTE ON FUNCTION log_table_status_change TO authenticated;
GRANT EXECUTE ON FUNCTION calculate_previous_state_duration TO authenticated;

SELECT 'PASO 2 COMPLETADO: Funciones y vistas creadas' as resultado;
