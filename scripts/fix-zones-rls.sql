-- ================================================
-- DIAGNÓSTICO Y CORRECCIÓN DE POLÍTICAS RLS PARA TABLA ZONES
-- ================================================

-- Paso 1: Ver políticas existentes
-- ================================================
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies 
WHERE tablename = 'zones';

-- Paso 2: Ver datos en tabla zones
-- ================================================
SELECT 
  id,
  tenant_id,
  name,
  active,
  created_at,
  updated_at
FROM zones
ORDER BY created_at;

-- Paso 3: Verificar estructura de tabla users
-- ================================================
SELECT 
  id,
  tenant_id,
  name,
  email,
  role,
  active
FROM users
LIMIT 5;

-- ================================================
-- CORRECCIÓN: Eliminar políticas problemáticas
-- ================================================

-- Eliminar todas las políticas existentes en zones
DROP POLICY IF EXISTS "Users can view zones from their tenant" ON zones;
DROP POLICY IF EXISTS "Users can view their tenant zones" ON zones;
DROP POLICY IF EXISTS "Tenant users can view zones" ON zones;
DROP POLICY IF EXISTS "Staff can insert zones for their tenant" ON zones;
DROP POLICY IF EXISTS "Staff can insert zones" ON zones;
DROP POLICY IF EXISTS "Tenant staff can insert zones" ON zones;
DROP POLICY IF EXISTS "Staff can update zones for their tenant" ON zones;
DROP POLICY IF EXISTS "Staff can update zones" ON zones;
DROP POLICY IF EXISTS "Tenant staff can update zones" ON zones;
DROP POLICY IF EXISTS "Staff can delete zones for their tenant" ON zones;
DROP POLICY IF EXISTS "Staff can delete zones" ON zones;
DROP POLICY IF EXISTS "Tenant staff can delete zones" ON zones;

-- ================================================
-- CREAR POLÍTICAS RLS CORRECTAS
-- ================================================

-- Política SELECT: Todos los usuarios pueden ver zonas de su tenant
CREATE POLICY "zones_select_policy" ON zones
  FOR SELECT
  USING (
    tenant_id IN (
      SELECT tenant_id 
      FROM users 
      WHERE id = auth.uid() 
      AND active = true
    )
  );

-- Política INSERT: Solo staff puede crear zonas para su tenant
CREATE POLICY "zones_insert_policy" ON zones
  FOR INSERT
  WITH CHECK (
    tenant_id IN (
      SELECT tenant_id 
      FROM users 
      WHERE id = auth.uid() 
      AND role = 'staff' 
      AND active = true
    )
  );

-- Política UPDATE: Solo staff puede actualizar zonas de su tenant
CREATE POLICY "zones_update_policy" ON zones
  FOR UPDATE
  USING (
    tenant_id IN (
      SELECT tenant_id 
      FROM users 
      WHERE id = auth.uid() 
      AND role = 'staff' 
      AND active = true
    )
  )
  WITH CHECK (
    tenant_id IN (
      SELECT tenant_id 
      FROM users 
      WHERE id = auth.uid() 
      AND role = 'staff' 
      AND active = true
    )
  );

-- Política DELETE: Solo staff puede eliminar zonas de su tenant
CREATE POLICY "zones_delete_policy" ON zones
  FOR DELETE
  USING (
    tenant_id IN (
      SELECT tenant_id 
      FROM users 
      WHERE id = auth.uid() 
      AND role = 'staff' 
      AND active = true
    )
  );

-- ================================================
-- VERIFICACIÓN: Ver políticas creadas
-- ================================================

SELECT 
  policyname,
  cmd,
  qual,
  with_check
FROM pg_policies 
WHERE tablename = 'zones';

-- ================================================
-- TESTING: Probar acceso como usuario
-- ================================================

-- Nota: Esto debe ejecutarse EN LA APLICACIÓN después de hacer login
-- Para probar manualmente:

-- 1. Obtener el user_id de un usuario de prueba:
SELECT id, tenant_id, email, role FROM users WHERE email = 'TU_EMAIL_AQUI';

-- 2. Simular consulta como ese usuario (usando Supabase client con auth)
-- Esto se hace desde la aplicación, no directamente en SQL

-- ================================================
-- ALTERNATIVA: Si auth.uid() no funciona
-- ================================================

-- Si las políticas RLS con auth.uid() no funcionan, puede ser porque
-- el contexto de autenticación no está configurado correctamente.
-- 
-- Solución temporal: Usar Service Role client en el servidor
-- (Ya implementado en zones-store.ts con getWritableSupabaseClient)

-- ================================================
-- TROUBLESHOOTING
-- ================================================

-- Si sigues teniendo problemas:

-- 1. Verificar que RLS está habilitado:
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public' AND tablename = 'zones';

-- Si rowsecurity = false, habilitar RLS:
ALTER TABLE zones ENABLE ROW LEVEL SECURITY;

-- 2. Verificar que las funciones de autenticación están disponibles:
SELECT auth.uid(); -- Debe retornar el UUID del usuario autenticado

-- 3. Verificar configuración de Supabase:
--    - Dashboard > Authentication > Policies
--    - Debe mostrar las políticas creadas
--    - Usar "Policy Editor" para editar visualmente

-- ================================================
-- LIMPIEZA (si quieres empezar de nuevo)
-- ================================================

-- ADVERTENCIA: Esto eliminará todas las zonas
-- DELETE FROM zones WHERE tenant_id = 'TU_TENANT_ID_AQUI';

-- Para recrear zonas de prueba:
-- INSERT INTO zones (tenant_id, name, active) 
-- VALUES 
--   ('TU_TENANT_ID_AQUI', 'Bar', true),
--   ('TU_TENANT_ID_AQUI', 'Salón Principal', true),
--   ('TU_TENANT_ID_AQUI', 'Terraza', true);
