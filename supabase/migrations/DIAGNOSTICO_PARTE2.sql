-- DIAGNÓSTICO PARTE 2: Buscar el origen exacto del error

-- 6. Ver estructura COMPLETA de la tabla 'tables' (puede tener table_number ya)
SELECT 
  column_name,
  data_type,
  column_default,
  is_nullable,
  ordinal_position
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'tables'
ORDER BY ordinal_position;

-- 7. Buscar índices con 'table_number'
SELECT 
  schemaname,
  tablename,
  indexname,
  indexdef
FROM pg_indexes
WHERE schemaname = 'public'
  AND indexdef LIKE '%table_number%';

-- 8. Ver si hay alguna secuencia o tipo personalizado
SELECT 
  typname,
  typtype,
  typowner
FROM pg_type
WHERE typname LIKE '%table%'
  AND typnamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'public');

-- 9. Buscar CUALQUIER objeto que contenga 'table_number' en su definición
SELECT 
  'FUNCTION' as object_type,
  routine_name as object_name,
  LEFT(routine_definition, 200) as definition_preview
FROM information_schema.routines
WHERE routine_schema = 'public'
  AND routine_definition LIKE '%table_number%'
UNION ALL
SELECT 
  'VIEW' as object_type,
  table_name as object_name,
  LEFT(view_definition, 200) as definition_preview
FROM information_schema.views
WHERE table_schema = 'public'
  AND view_definition LIKE '%table_number%'
UNION ALL
SELECT 
  'TRIGGER' as object_type,
  trigger_name as object_name,
  LEFT(action_statement, 200) as definition_preview
FROM information_schema.triggers
WHERE trigger_schema = 'public'
  AND action_statement LIKE '%table_number%';
