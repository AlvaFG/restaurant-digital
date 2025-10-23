-- DIAGNÓSTICO COMPLETO: Buscar duplicados de table_number en toda la base de datos

-- 1. Ver si existe alguna tabla con columna table_number duplicada
SELECT 
  table_name,
  column_name,
  ordinal_position,
  data_type
FROM information_schema.columns
WHERE table_schema = 'public'
  AND column_name = 'table_number'
ORDER BY table_name, ordinal_position;

-- 2. Verificar si hay triggers o funciones que referencian table_number
SELECT 
  routine_name,
  routine_type,
  routine_definition
FROM information_schema.routines
WHERE routine_schema = 'public'
  AND routine_definition LIKE '%table_number%'
ORDER BY routine_name;

-- 3. Ver todas las constraints que involucran columnas con 'table'
SELECT 
  tc.table_name,
  tc.constraint_name,
  tc.constraint_type,
  kcu.column_name
FROM information_schema.table_constraints tc
JOIN information_schema.key_column_usage kcu 
  ON tc.constraint_name = kcu.constraint_name
WHERE tc.table_schema = 'public'
  AND (tc.table_name LIKE '%table%' OR kcu.column_name LIKE '%table%')
ORDER BY tc.table_name, kcu.column_name;

-- 4. Buscar views que puedan estar causando conflicto
SELECT 
  table_name,
  view_definition
FROM information_schema.views
WHERE table_schema = 'public'
  AND view_definition LIKE '%table_number%';

-- 5. Verificar si existe alguna tabla temporal o cache
SELECT 
  schemaname,
  tablename,
  tableowner
FROM pg_tables
WHERE tablename LIKE '%audit%'
   OR tablename LIKE '%table_status%';
