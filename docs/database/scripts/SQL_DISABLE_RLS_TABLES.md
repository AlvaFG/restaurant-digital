# ⚡ SQL para Deshabilitar RLS en tabla tables

**Problema**: No se pueden crear mesas porque RLS bloquea INSERT en tabla `tables`

**Ejecutar en Supabase SQL Editor**:

```sql
ALTER TABLE tables DISABLE ROW LEVEL SECURITY;
```

**Resultado esperado**: `Success. No rows returned`

---

## ✅ Esto permitirá:
- Crear mesas con zonas asignadas
- Completar validación Fase 5.2
- Probar el flujo completo

## ⚠️ Después (en Fase 5.3):
- Investigar y crear políticas RLS correctas para `tables`
- Investigar y crear políticas RLS correctas para `zones`
- Re-habilitar RLS en ambas tablas antes de producción

---

## 📋 Lista de Tablas con RLS Deshabilitado (Temporal)

1. ✅ `zones` - Deshabilitado
2. ⏳ `tables` - Deshabilitar ahora

**COPY/PASTE ESTE SQL EN SUPABASE**:

```sql
ALTER TABLE tables DISABLE ROW LEVEL SECURITY;
```

---

## 🔍 Por Qué Falla

El error será similar:
```
new row violates row-level security policy for table "tables"
```

La tabla `tables` tiene RLS activo pero no tiene política de INSERT, o la política existente no coincide con la estructura de autenticación.

---

**Estado**: 🔴 BLOQUEANDO creación de mesas  
**Prioridad**: 🔥 ALTA - Necesario para completar Fase 5.2
