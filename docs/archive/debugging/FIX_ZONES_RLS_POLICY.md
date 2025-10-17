# 🔒 Solución: RLS bloqueando INSERT en tabla zones

**Fecha**: Octubre 16, 2025, 9:10 PM  
**Problema**: `new row violates row-level security policy for table "zones"`

---

## 🎯 Causa Raíz

La tabla `zones` en Supabase tiene **Row Level Security (RLS)** habilitado pero **NO tiene política de INSERT**.

**Logs que lo confirman**:
```
[2025-10-16T23:47:20.728Z][ERROR] Error al crear zona {"duration":679}
new row violates row-level security policy for table "zones"
POST /api/zones 500 in 704ms
```

**Por qué pasa**:
- RLS está activo en la tabla `zones`
- Hay política de SELECT (por eso GET funciona y retorna 0 zonas)
- NO hay política de INSERT (por eso POST falla)
- Supabase bloquea por defecto cualquier operación sin política

---

## 🔧 Soluciones (Elegir UNA)

### ✅ **Opción 1: Crear Política INSERT (RECOMENDADO)**

**Descripción**: Agregar política RLS para permitir INSERT a usuarios autenticados en su tenant

**Ventajas**:
- ✅ Mantiene seguridad multi-tenant
- ✅ Sigue mejores prácticas
- ✅ Escalable

**Desventajas**:
- ⚠️ Requiere acceso a Supabase Dashboard

**Pasos**:

1. Ir a: https://supabase.com/dashboard/project/vblbngnajogwypvkfjsr
2. Click en **"Table Editor"** → Tabla **"zones"**
3. Click en **"RLS"** (arriba a la derecha)
4. Click en **"New Policy"**
5. Template: **"Enable insert for authenticated users only"**
6. Ajustar a:

```sql
CREATE POLICY "Users can insert zones in their tenant"
ON zones FOR INSERT
TO authenticated
WITH CHECK (
  tenant_id IN (
    SELECT tenant_id 
    FROM users 
    WHERE id = auth.uid()
  )
);
```

7. **Save Policy**
8. Probar crear zona desde la app

---

### ⚡ **Opción 2: Deshabilitar RLS Temporalmente (RÁPIDO)**

**Descripción**: Quitar RLS de la tabla zones mientras desarrollamos

**Ventajas**:
- ✅ Súper rápido (1 query SQL)
- ✅ Permite continuar desarrollo

**Desventajas**:
- ⚠️ **INSEGURO para producción**
- ⚠️ Todos los usuarios ven todas las zonas de todos los tenants

**Pasos**:

1. Ir a: Supabase Dashboard → **SQL Editor**
2. Ejecutar:

```sql
ALTER TABLE zones DISABLE ROW LEVEL SECURITY;
```

3. Probar crear zona desde la app
4. **IMPORTANTE**: Re-habilitar RLS antes de producción

---

### 🛠️ **Opción 3: Usar Service Role Key (ALTERNATIVA)**

**Descripción**: Hacer que el API use `service_role` key que bypasea RLS

**Ventajas**:
- ✅ No requiere cambiar políticas
- ✅ Útil para operaciones admin

**Desventajas**:
- ⚠️ Expone más riesgo si hay vulnerabilidad
- ⚠️ Requiere cambios en el código

**Pasos**:

1. Verificar que `.env.local` tiene:
```env
SUPABASE_SERVICE_ROLE_KEY=eyJh...  # Key que bypassea RLS
```

2. Modificar `app/api/zones/route.ts`:

```typescript
import { createClient } from '@supabase/supabase-js'

// Crear cliente con service role
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!  // ← Usa service role
)
```

3. Probar crear zona

**⚠️ ADVERTENCIA**: Esto bypasea TODAS las políticas RLS. Solo usar para operaciones admin.

---

## 🎯 Recomendación

**Para desarrollo**: Usar **Opción 2** (deshabilitar RLS temporalmente)
- Es rápido
- Permite continuar validación
- Podemos arreglar políticas después

**Para producción**: Usar **Opción 1** (crear política INSERT correcta)
- Mantiene seguridad
- Sigue mejores prácticas

---

## 📝 Siguiente Paso

**¿Qué prefieres?**

A) **Deshabilitar RLS ahora** → Yo te doy el SQL para copiar/pegar  
B) **Crear política correcta** → Te guío paso a paso en Supabase Dashboard  
C) **Usar service role** → Modifico el código API

---

**Estado**: 🟡 ESPERANDO DECISIÓN  
**Impacto**: 🔥 CRÍTICO (Bloquea creación de zonas)
