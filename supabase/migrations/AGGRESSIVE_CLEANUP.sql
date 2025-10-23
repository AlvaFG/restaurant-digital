-- CLEANUP AGRESIVO - Ejecuta PRIMERO
DROP TABLE IF EXISTS public.table_status_audit CASCADE;
DROP VIEW IF EXISTS table_status_changes_summary CASCADE;
DROP VIEW IF EXISTS recent_table_status_changes CASCADE;
DROP FUNCTION IF EXISTS log_table_status_change(UUID, UUID, TEXT, TEXT, TEXT, UUID, TEXT, UUID, JSONB) CASCADE;
DROP FUNCTION IF EXISTS calculate_previous_state_duration(UUID, UUID) CASCADE;
DROP FUNCTION IF EXISTS update_table_audit_updated_at() CASCADE;
DROP TRIGGER IF EXISTS trigger_table_audit_updated_at ON public.table_status_audit CASCADE;
DROP POLICY IF EXISTS table_audit_tenant_isolation ON public.table_status_audit;
DROP POLICY IF EXISTS table_audit_insert ON public.table_status_audit;
DROP POLICY IF EXISTS table_audit_no_update ON public.table_status_audit;
DROP POLICY IF EXISTS table_audit_no_delete ON public.table_status_audit;

SELECT 'Cleanup agresivo completado' as resultado;