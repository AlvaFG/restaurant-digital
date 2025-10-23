-- =============================================
-- CLEANUP: Eliminar tablas y funciones anteriores
-- Ejecuta esto ANTES de aplicar las migraciones principales
-- =============================================

-- 1. Eliminar vistas (dependen de la tabla)
DROP VIEW IF EXISTS public.recent_table_status_changes CASCADE;
DROP VIEW IF EXISTS public.table_status_changes_summary CASCADE;

-- 2. Eliminar funciones
DROP FUNCTION IF EXISTS public.log_table_status_change CASCADE;
DROP FUNCTION IF EXISTS public.calculate_previous_state_duration CASCADE;
DROP FUNCTION IF EXISTS public.update_table_audit_updated_at CASCADE;
DROP FUNCTION IF EXISTS public.create_order_with_table_update CASCADE;
DROP FUNCTION IF EXISTS public.validate_table_status_transition CASCADE;
DROP FUNCTION IF EXISTS public.update_table_status_safe CASCADE;

-- 3. Eliminar tabla de auditoría
DROP TABLE IF EXISTS public.table_status_audit CASCADE;

-- Verificación
SELECT 'Cleanup completado. Ahora ejecuta las migraciones.' as status;
