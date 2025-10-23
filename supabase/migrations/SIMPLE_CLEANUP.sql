-- CLEANUP SIMPLE (sin la tabla que no existe)
DROP VIEW IF EXISTS table_status_changes_summary CASCADE;
DROP VIEW IF EXISTS recent_table_status_changes CASCADE;
DROP FUNCTION IF EXISTS log_table_status_change(UUID, UUID, TEXT, TEXT, TEXT, UUID, TEXT, UUID, JSONB) CASCADE;
DROP FUNCTION IF EXISTS calculate_previous_state_duration(UUID, UUID) CASCADE;
DROP FUNCTION IF EXISTS update_table_audit_updated_at() CASCADE;

SELECT 'Cleanup completado - Base de datos limpia' as resultado;
