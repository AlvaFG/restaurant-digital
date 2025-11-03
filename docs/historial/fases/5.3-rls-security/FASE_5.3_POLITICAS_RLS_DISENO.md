# 🔒 Políticas RLS - Diseño para Zones y Tables

**Fecha**: Octubre 17, 2025, 12:35 AM

---

## 🎯 Estrategia RLS

Basados en la estructura confirmada:
- `users.tenant_id` → Identifica el tenant del usuario
- `zones.tenant_id` → Identifica el tenant de la zona
- `tables.tenant_id` → Identifica el tenant de la mesa

**Política base**: Usuario solo puede operar sobre registros donde `tenant_id` coincide con su tenant.

---

## 📋 Políticas para Tabla `zones`

### **Paso 1: Eliminar Política Problemática**

La política actual "Users can insert zones in their tenant" tiene `qual = NULL` lo cual es problemático.

```sql
-- Eliminar política problemática
DROP POLICY IF EXISTS "Users can insert zones in their tenant" ON zones;
```

### **Paso 2: Crear Políticas Correctas**

#### **SELECT Policy**
```sql
CREATE POLICY "zones_select_policy"
ON zones FOR SELECT
TO authenticated
USING (
  tenant_id IN (
    SELECT tenant_id 
    FROM public.users 
    WHERE id = auth.uid()
  )
);
```

#### **INSERT Policy**
```sql
CREATE POLICY "zones_insert_policy"
ON zones FOR INSERT
TO authenticated
WITH CHECK (
  tenant_id IN (
    SELECT tenant_id 
    FROM public.users 
    WHERE id = auth.uid()
  )
);
```

#### **UPDATE Policy**
```sql
CREATE POLICY "zones_update_policy"
ON zones FOR UPDATE
TO authenticated
USING (
  tenant_id IN (
    SELECT tenant_id 
    FROM public.users 
    WHERE id = auth.uid()
  )
)
WITH CHECK (
  tenant_id IN (
    SELECT tenant_id 
    FROM public.users 
    WHERE id = auth.uid()
  )
);
```

#### **DELETE Policy**
```sql
CREATE POLICY "zones_delete_policy"
ON zones FOR DELETE
TO authenticated
USING (
  tenant_id IN (
    SELECT tenant_id 
    FROM public.users 
    WHERE id = auth.uid()
  )
);
```

---

## 📋 Políticas para Tabla `tables`

**NOTA**: Primero necesitamos confirmar el nombre exacto de la tabla de mesas del restaurante.

Probablemente sea una de estas:
- `restaurant_tables`
- `dining_tables`
- O simplemente `tables` en un schema diferente

### **Verificar Nombre Correcto**

```sql
-- Listar todas las tablas que contienen 'table' en el nombre
SELECT table_schema, table_name
FROM information_schema.tables
WHERE table_name LIKE '%table%'
AND table_schema = 'public';
```

### **Políticas (una vez confirmado el nombre)**

Reemplazar `TABLE_NAME` con el nombre correcto:

#### **SELECT Policy**
```sql
CREATE POLICY "tables_select_policy"
ON TABLE_NAME FOR SELECT
TO authenticated
USING (
  tenant_id IN (
    SELECT tenant_id 
    FROM public.users 
    WHERE id = auth.uid()
  )
);
```

#### **INSERT Policy**
```sql
CREATE POLICY "tables_insert_policy"
ON TABLE_NAME FOR INSERT
TO authenticated
WITH CHECK (
  tenant_id IN (
    SELECT tenant_id 
    FROM public.users 
    WHERE id = auth.uid()
  )
);
```

#### **UPDATE Policy**
```sql
CREATE POLICY "tables_update_policy"
ON TABLE_NAME FOR UPDATE
TO authenticated
USING (
  tenant_id IN (
    SELECT tenant_id 
    FROM public.users 
    WHERE id = auth.uid()
  )
)
WITH CHECK (
  tenant_id IN (
    SELECT tenant_id 
    FROM public.users 
    WHERE id = auth.uid()
  )
);
```

#### **DELETE Policy**
```sql
CREATE POLICY "tables_delete_policy"
ON TABLE_NAME FOR DELETE
TO authenticated
USING (
  tenant_id IN (
    SELECT tenant_id 
    FROM public.users 
    WHERE id = auth.uid()
  )
);
```

---

## 🔧 Política Especial para QR Codes (Tables)

Mantener la política existente `tables_qr_read_policy` que permite lectura pública por QR token.

---

## ⚠️ Consideraciones Importantes

### **1. Política `zones_isolation_policy`**
Ya existe y filtra por tenant_id con cmd=ALL. 

**Opciones**:
- **A)** Eliminarla y usar las 4 políticas específicas (SELECT, INSERT, UPDATE, DELETE)
- **B)** Mantenerla y agregar solo las que falten

**Recomendación**: Eliminarla y usar políticas específicas para mayor claridad.

```sql
DROP POLICY IF EXISTS "zones_isolation_policy" ON zones;
```

### **2. Política `tables_isolation_policy`**
Mismo caso que zones.

```sql
DROP POLICY IF EXISTS "tables_isolation_policy" ON TABLE_NAME;
```

---

## 📝 Script Completo de Implementación

```sql
-- ====================================
-- PASO 1: LIMPIAR POLÍTICAS VIEJAS
-- ====================================

-- Eliminar políticas problemáticas o redundantes en zones
DROP POLICY IF EXISTS "Users can insert zones in their tenant" ON zones;
DROP POLICY IF EXISTS "zones_isolation_policy" ON zones;

-- Eliminar políticas redundantes en tables (reemplazar TABLE_NAME)
-- DROP POLICY IF EXISTS "tables_isolation_policy" ON TABLE_NAME;


-- ====================================
-- PASO 2: CREAR POLÍTICAS ZONES
-- ====================================

CREATE POLICY "zones_select_policy"
ON zones FOR SELECT
TO authenticated
USING (
  tenant_id IN (
    SELECT tenant_id FROM public.users WHERE id = auth.uid()
  )
);

CREATE POLICY "zones_insert_policy"
ON zones FOR INSERT
TO authenticated
WITH CHECK (
  tenant_id IN (
    SELECT tenant_id FROM public.users WHERE id = auth.uid()
  )
);

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

CREATE POLICY "zones_delete_policy"
ON zones FOR DELETE
TO authenticated
USING (
  tenant_id IN (
    SELECT tenant_id FROM public.users WHERE id = auth.uid()
  )
);


-- ====================================
-- PASO 3: RE-HABILITAR RLS EN ZONES
-- ====================================

ALTER TABLE zones ENABLE ROW LEVEL SECURITY;


-- ====================================
-- PASO 4: REPETIR PARA TABLES
-- (Una vez confirmado el nombre correcto)
-- ====================================

-- CREATE POLICY "tables_select_policy" ON TABLE_NAME ...
-- CREATE POLICY "tables_insert_policy" ON TABLE_NAME ...
-- CREATE POLICY "tables_update_policy" ON TABLE_NAME ...
-- CREATE POLICY "tables_delete_policy" ON TABLE_NAME ...

-- ALTER TABLE TABLE_NAME ENABLE ROW LEVEL SECURITY;
```

---

## 🧪 Prueba Antes de Aplicar

Antes de ejecutar todo, podemos probar si un usuario existe en `public.users`:

```sql
-- Ver tu usuario específico
SELECT id, email, tenant_id, role
FROM public.users
WHERE id = 'f46e1868-1b50-422c-b4d9-1eae1e6c6f1d';
```

Si retorna datos, las políticas funcionarán.  
Si retorna vacío, necesitamos investigar la relación auth <-> public.users.

---

**Estado**: 🟢 LISTO PARA IMPLEMENTAR (zones)  
**Pendiente**: Confirmar nombre tabla de mesas
