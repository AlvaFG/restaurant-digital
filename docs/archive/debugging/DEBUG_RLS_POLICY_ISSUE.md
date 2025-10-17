# 🔍 Debug: Política RLS no funciona

**Fecha**: Octubre 16, 2025, 9:20 PM  
**Problema**: Política creada pero INSERT sigue fallando

---

## 🎯 Posibles Causas

### 1. La política busca tenant_id en auth.uid() pero debería ser diferente

**Problema**: La política asume que `tenant_id` está en la tabla `users` con columna `id = auth.uid()`

**Verificar**:
- ¿La tabla `users` tiene una columna `tenant_id`?
- ¿El `auth.uid()` del usuario coincide con algún `id` en `users`?

### 2. La política puede necesitar ajuste

**Política actual**:
```sql
CREATE POLICY "Users can insert zones in their tenant"
ON zones FOR INSERT TO authenticated
WITH CHECK (
  tenant_id IN (
    SELECT tenant_id FROM users WHERE id = auth.uid()
  )
);
```

**Problema**: Si la relación usuario-tenant es diferente, esto no funcionará.

---

## 🔧 Solución Rápida: Deshabilitar RLS

Para continuar con el desarrollo y validar el flujo:

```sql
-- Ejecutar en Supabase SQL Editor
ALTER TABLE zones DISABLE ROW LEVEL SECURITY;
```

Esto permite:
- ✅ Crear zonas inmediatamente
- ✅ Continuar con validación Fase 5.2
- ⚠️ Después arreglamos RLS correctamente

---

## 🔍 Diagnóstico Avanzado

### Verificar estructura de users:
```sql
-- Ver columnas de tabla users
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'users';
```

### Verificar relación usuario actual:
```sql
-- Ver datos del usuario actual
SELECT id, tenant_id 
FROM users 
WHERE id = auth.uid();
```

### Ver políticas actuales en zones:
```sql
-- Listar todas las políticas de zones
SELECT * FROM pg_policies WHERE tablename = 'zones';
```

---

## 🎯 Próximos Pasos

**Opción A - RÁPIDA**: Deshabilitar RLS ahora, arreglar después
**Opción B - COMPLETA**: Investigar estructura y ajustar política

**¿Cuál prefieres?**
