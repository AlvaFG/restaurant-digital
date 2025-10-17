# 🔒 Script RLS Completo - Listo para Ejecutar

**Fecha**: Octubre 17, 2025, 12:40 AM

---

## ✅ Información Confirmada

### **Usuario Actual**
- **ID**: `f46e1868-1b50-422c-b4d9-1eae1e6c6f1d`
- **Email**: `afernandezguyot@gmail.com`
- **Tenant ID**: `46824e99-1d3f-4a13-8e96-17797f6149af`
- **Role**: `admin`

✅ **Confirmado**: El usuario existe en `public.users` con `tenant_id` correcto.

### **Tabla de Mesas**
- **Nombre**: `tables` (en schema `public`)
- ✅ **Confirmado**: Es la tabla correcta de mesas del restaurante.

---

## 📋 Script SQL Completo

**EJECUTAR EN ORDEN** en Supabase SQL Editor:

### **PASO 1: Limpiar Políticas Viejas**

```sql
-- Eliminar políticas problemáticas o redundantes en zones
DROP POLICY IF EXISTS "Users can insert zones in their tenant" ON zones;
DROP POLICY IF EXISTS "zones_isolation_policy" ON zones;

-- Eliminar políticas redundantes en tables
DROP POLICY IF EXISTS "tables_isolation_policy" ON tables;
```

---

### **PASO 2: Crear Políticas para ZONES**

```sql
-- ====================================
-- POLÍTICAS PARA TABLA ZONES
-- ====================================

-- SELECT: Ver solo zonas de su tenant
CREATE POLICY "zones_select_policy"
ON zones FOR SELECT
TO authenticated
USING (
  tenant_id IN (
    SELECT tenant_id FROM public.users WHERE id = auth.uid()
  )
);

-- INSERT: Crear solo en su tenant
CREATE POLICY "zones_insert_policy"
ON zones FOR INSERT
TO authenticated
WITH CHECK (
  tenant_id IN (
    SELECT tenant_id FROM public.users WHERE id = auth.uid()
  )
);

-- UPDATE: Modificar solo de su tenant
CREATE POLICY "zones_update_policy"
ON zones FOR UPDATE
TO authenticated
USING (
  tenant_id IN (
    SELECT tenant_id FROM public.users WHERE id = auth.uid()
  )
)
WITH CHECK (
  tenant_id IN (
    SELECT tenant_id FROM public.users WHERE id = auth.uid()
  )
);

-- DELETE: Eliminar solo de su tenant
CREATE POLICY "zones_delete_policy"
ON zones FOR DELETE
TO authenticated
USING (
  tenant_id IN (
    SELECT tenant_id FROM public.users WHERE id = auth.uid()
  )
);
```

---

### **PASO 3: Crear Políticas para TABLES**

```sql
-- ====================================
-- POLÍTICAS PARA TABLA TABLES
-- ====================================

-- SELECT: Ver solo mesas de su tenant
CREATE POLICY "tables_select_policy"
ON tables FOR SELECT
TO authenticated
USING (
  tenant_id IN (
    SELECT tenant_id FROM public.users WHERE id = auth.uid()
  )
);

-- INSERT: Crear solo en su tenant
CREATE POLICY "tables_insert_policy"
ON tables FOR INSERT
TO authenticated
WITH CHECK (
  tenant_id IN (
    SELECT tenant_id FROM public.users WHERE id = auth.uid()
  )
);

-- UPDATE: Modificar solo de su tenant
CREATE POLICY "tables_update_policy"
ON tables FOR UPDATE
TO authenticated
USING (
  tenant_id IN (
    SELECT tenant_id FROM public.users WHERE id = auth.uid()
  )
)
WITH CHECK (
  tenant_id IN (
    SELECT tenant_id FROM public.users WHERE id = auth.uid()
  )
);

-- DELETE: Eliminar solo de su tenant
CREATE POLICY "tables_delete_policy"
ON tables FOR DELETE
TO authenticated
USING (
  tenant_id IN (
    SELECT tenant_id FROM public.users WHERE id = auth.uid()
  )
);
```

---

### **PASO 4: Re-habilitar RLS**

```sql
-- ====================================
-- RE-HABILITAR ROW LEVEL SECURITY
-- ====================================

ALTER TABLE zones ENABLE ROW LEVEL SECURITY;
ALTER TABLE tables ENABLE ROW LEVEL SECURITY;
```

---

### **PASO 5: Verificar Políticas Creadas**

```sql
-- Ver políticas de zones
SELECT schemaname, tablename, policyname, permissive, roles, cmd
FROM pg_policies
WHERE tablename = 'zones';

-- Ver políticas de tables
SELECT schemaname, tablename, policyname, permissive, roles, cmd
FROM pg_policies
WHERE tablename = 'tables';

-- Verificar RLS activo
SELECT schemaname, tablename, rowsecurity
FROM pg_tables
WHERE tablename IN ('zones', 'tables');
```

---

## 🎯 Resultado Esperado

Después de ejecutar todo:

### **Tabla zones**:
- ✅ 4 políticas: select, insert, update, delete
- ✅ RLS = true
- ✅ Solo ve/modifica datos de tenant `46824e99-1d3f-4a13-8e96-17797f6149af`

### **Tabla tables**:
- ✅ 4 políticas: select, insert, update, delete (+ tables_qr_read_policy existente)
- ✅ RLS = true
- ✅ Solo ve/modifica datos de su tenant

---

## ⚠️ IMPORTANTE: Política QR Existente

La política `tables_qr_read_policy` (SELECT público por qr_token) **NO la eliminamos** porque permite acceso público a mesas via QR sin autenticación, lo cual es funcionalidad necesaria.

---

## 🧪 Cómo Probar

1. **Ejecuta el script completo** en Supabase SQL Editor
2. **Vuelve a la app** (http://localhost:3000/mesas)
3. **Prueba**:
   - ✅ Crear una nueva zona
   - ✅ Crear una nueva mesa
   - ✅ Asignar zona a mesa
   - ✅ Ver zonas y mesas en la lista

Si todo funciona = ✅ **RLS configurado correctamente**

---

## 🚨 Si Algo Falla

### **Síntoma**: No puedes crear zonas/mesas
**Solución**: 
```sql
-- Verificar que tu usuario tiene tenant_id
SELECT id, tenant_id FROM public.users WHERE id = auth.uid();

-- Si retorna vacío, hay problema con la relación auth <-> users
```

### **Síntoma**: Políticas no se aplican
**Solución**:
```sql
-- Verificar RLS está activo
SELECT tablename, rowsecurity FROM pg_tables 
WHERE tablename IN ('zones', 'tables');

-- Debe retornar rowsecurity = true para ambas
```

---

## 📝 Script Todo-en-Uno (Copy/Paste)

```sql
-- ==========================================
-- SCRIPT COMPLETO RLS - ZONES Y TABLES
-- ==========================================

-- PASO 1: LIMPIAR
DROP POLICY IF EXISTS "Users can insert zones in their tenant" ON zones;
DROP POLICY IF EXISTS "zones_isolation_policy" ON zones;
DROP POLICY IF EXISTS "tables_isolation_policy" ON tables;

-- PASO 2: POLÍTICAS ZONES
CREATE POLICY "zones_select_policy" ON zones FOR SELECT TO authenticated
USING (tenant_id IN (SELECT tenant_id FROM public.users WHERE id = auth.uid()));

CREATE POLICY "zones_insert_policy" ON zones FOR INSERT TO authenticated
WITH CHECK (tenant_id IN (SELECT tenant_id FROM public.users WHERE id = auth.uid()));

CREATE POLICY "zones_update_policy" ON zones FOR UPDATE TO authenticated
USING (tenant_id IN (SELECT tenant_id FROM public.users WHERE id = auth.uid()))
WITH CHECK (tenant_id IN (SELECT tenant_id FROM public.users WHERE id = auth.uid()));

CREATE POLICY "zones_delete_policy" ON zones FOR DELETE TO authenticated
USING (tenant_id IN (SELECT tenant_id FROM public.users WHERE id = auth.uid()));

-- PASO 3: POLÍTICAS TABLES
CREATE POLICY "tables_select_policy" ON tables FOR SELECT TO authenticated
USING (tenant_id IN (SELECT tenant_id FROM public.users WHERE id = auth.uid()));

CREATE POLICY "tables_insert_policy" ON tables FOR INSERT TO authenticated
WITH CHECK (tenant_id IN (SELECT tenant_id FROM public.users WHERE id = auth.uid()));

CREATE POLICY "tables_update_policy" ON tables FOR UPDATE TO authenticated
USING (tenant_id IN (SELECT tenant_id FROM public.users WHERE id = auth.uid()))
WITH CHECK (tenant_id IN (SELECT tenant_id FROM public.users WHERE id = auth.uid()));

CREATE POLICY "tables_delete_policy" ON tables FOR DELETE TO authenticated
USING (tenant_id IN (SELECT tenant_id FROM public.users WHERE id = auth.uid()));

-- PASO 4: RE-HABILITAR RLS
ALTER TABLE zones ENABLE ROW LEVEL SECURITY;
ALTER TABLE tables ENABLE ROW LEVEL SECURITY;
```

---

**Estado**: 🟢 LISTO PARA EJECUTAR  
**Tiempo estimado**: 2-3 minutos  
**Riesgo**: 🟡 MEDIO (probar inmediatamente después)
