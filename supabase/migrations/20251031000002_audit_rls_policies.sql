-- ============================================
-- AUDITORÍA DE POLÍTICAS RLS
-- ============================================
-- Fecha: 2025-10-31
-- Descripción: Script de consulta para auditar todas las políticas RLS existentes
-- Autor: Restaurant Digital Team
-- Uso: Ejecutar en SQL Editor de Supabase para ver todas las políticas

-- ============================================
-- 1. LISTAR TODAS LAS TABLAS CON RLS
-- ============================================

SELECT 
  schemaname,
  tablename,
  CASE 
    WHEN rowsecurity THEN '✅ ENABLED'
    ELSE '❌ DISABLED'
  END as rls_status
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY tablename;

-- ============================================
-- 2. LISTAR TODAS LAS POLÍTICAS RLS
-- ============================================

SELECT 
  schemaname,
  tablename,
  policyname,
  CASE cmd
    WHEN 'r' THEN 'SELECT'
    WHEN 'a' THEN 'INSERT'
    WHEN 'w' THEN 'UPDATE'
    WHEN 'd' THEN 'DELETE'
    WHEN '*' THEN 'ALL'
  END as command,
  CASE permissive
    WHEN 'PERMISSIVE' THEN '✅ PERMISSIVE'
    WHEN 'RESTRICTIVE' THEN '⚠️ RESTRICTIVE'
  END as type,
  CASE 
    WHEN qual IS NOT NULL THEN '✅ USING clause'
    ELSE '❌ No USING'
  END as has_using,
  CASE 
    WHEN with_check IS NOT NULL THEN '✅ WITH CHECK clause'
    ELSE '❌ No WITH CHECK'
  END as has_with_check
FROM pg_policies
WHERE schemaname = 'public'
ORDER BY tablename, policyname;

-- ============================================
-- 3. TABLAS SIN POLÍTICAS RLS (VULNERABLES)
-- ============================================

SELECT 
  t.tablename as table_name,
  '⚠️ NO POLICIES' as status,
  'Tabla expuesta sin políticas de seguridad' as warning
FROM pg_tables t
WHERE 
  t.schemaname = 'public' AND
  t.rowsecurity = true AND
  NOT EXISTS (
    SELECT 1 
    FROM pg_policies p 
    WHERE p.schemaname = t.schemaname 
    AND p.tablename = t.tablename
  )
ORDER BY t.tablename;

-- ============================================
-- 4. POLÍTICAS DELETE (CRÍTICAS)
-- ============================================
-- Listar todas las políticas que permiten DELETE

SELECT 
  tablename,
  policyname,
  '🔴 DELETE ALLOWED' as risk_level,
  CASE 
    WHEN qual LIKE '%is_admin()%' THEN '✅ Admin only'
    WHEN qual LIKE '%auth.uid()%' THEN '⚠️ User self-delete'
    ELSE '❌ Unrestricted'
  END as restriction_type
FROM pg_policies
WHERE 
  schemaname = 'public' AND
  (cmd = 'd' OR cmd = '*')
ORDER BY tablename, policyname;

-- ============================================
-- 5. POLÍTICAS INSERT (VERIFICAR VALIDACIONES)
-- ============================================

SELECT 
  tablename,
  policyname,
  '🟡 INSERT ALLOWED' as operation,
  CASE 
    WHEN with_check LIKE '%is_admin()%' THEN '✅ Admin only'
    WHEN with_check LIKE '%current_tenant_id()%' THEN '✅ Tenant isolation'
    WHEN with_check LIKE '%true%' THEN '⚠️ Public insert'
    ELSE '❓ Check policy'
  END as validation_level
FROM pg_policies
WHERE 
  schemaname = 'public' AND
  (cmd = 'a' OR cmd = '*')
ORDER BY tablename, policyname;

-- ============================================
-- 6. VERIFICAR AISLAMIENTO POR TENANT
-- ============================================
-- Políticas que verifican tenant_id

SELECT 
  tablename,
  policyname,
  CASE 
    WHEN qual LIKE '%current_tenant_id()%' OR with_check LIKE '%current_tenant_id()%' 
    THEN '✅ Tenant isolation active'
    ELSE '❌ NO TENANT CHECK'
  END as tenant_isolation_status
FROM pg_policies
WHERE schemaname = 'public'
ORDER BY tablename, policyname;

-- ============================================
-- 7. FUNCIONES HELPER DE SEGURIDAD
-- ============================================

SELECT 
  routine_name as function_name,
  CASE routine_type
    WHEN 'FUNCTION' THEN '✅ FUNCTION'
    ELSE routine_type
  END as type,
  security_type,
  data_type as return_type
FROM information_schema.routines
WHERE 
  routine_schema = 'public' AND
  routine_name IN (
    'current_tenant_id',
    'current_user_role',
    'is_admin',
    'is_staff',
    'is_manager'
  )
ORDER BY routine_name;

-- ============================================
-- 8. RESUMEN DE SEGURIDAD
-- ============================================

-- Contar tablas por estado de RLS
SELECT 
  '📊 RESUMEN RLS' as category,
  COUNT(CASE WHEN rowsecurity THEN 1 END) as tables_with_rls,
  COUNT(CASE WHEN NOT rowsecurity THEN 1 END) as tables_without_rls,
  COUNT(*) as total_tables
FROM pg_tables
WHERE schemaname = 'public';

-- Contar políticas por tipo
SELECT 
  '📊 RESUMEN POLÍTICAS' as category,
  COUNT(CASE WHEN cmd = 'r' THEN 1 END) as select_policies,
  COUNT(CASE WHEN cmd = 'a' THEN 1 END) as insert_policies,
  COUNT(CASE WHEN cmd = 'w' THEN 1 END) as update_policies,
  COUNT(CASE WHEN cmd = 'd' THEN 1 END) as delete_policies,
  COUNT(CASE WHEN cmd = '*' THEN 1 END) as all_policies,
  COUNT(*) as total_policies
FROM pg_policies
WHERE schemaname = 'public';
