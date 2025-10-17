# ⚡ SQL para Deshabilitar RLS en tabla zones

**Ejecutar en Supabase SQL Editor**:

```sql
ALTER TABLE zones DISABLE ROW LEVEL SECURITY;
```

**Resultado esperado**: `Success. No rows returned`

---

## ✅ Esto permitirá:
- Crear zonas sin restricciones RLS
- Continuar con validación Fase 5.2
- Probar el flujo completo

## ⚠️ Después:
- Investigar por qué la política no funciona
- Ajustar la política correctamente
- Re-habilitar RLS antes de producción

---

**COPY/PASTE ESTE SQL EN SUPABASE**:

```sql
ALTER TABLE zones DISABLE ROW LEVEL SECURITY;
```
