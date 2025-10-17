# 🔍 Plan de Diagnóstico: Zones API no retorna datos

**Fecha**: Octubre 16, 2025, 9:05 PM  
**Síntomas**:
1. No aparecen zonas en la lista principal (filtro)
2. Selector de "Agregar mesa" → "No hay zonas creadas"
3. GET /api/zones retorna vacío o error

---

## 🎯 Plan de Acción (5 pasos)

### Paso 1: Ver logs del terminal (AHORA)
**Objetivo**: Confirmar si llega la petición y qué retorna

**Buscar en terminal**:
```
[GET /api/zones] Iniciando petición...
[GET /api/zones] ✅ Usuario autenticado
[GET /api/zones] tenant_id extraído
[GET /api/zones] Llamando Supabase con tenant_id
[GET /api/zones] ✅ Zonas obtenidas: X
```

**¿Qué puede estar pasando?**
- [ ] No llega la petición (hook no hace fetch)
- [ ] Llega pero falla autenticación (user null)
- [ ] Llega pero tenant_id es null
- [ ] Query Supabase retorna 0 resultados
- [ ] Error en el query Supabase

---

### Paso 2: Verificar datos en Supabase (MANUAL)
**Objetivo**: Confirmar que las zonas existen en la BD

**Ir a**: https://supabase.com/dashboard/project/vblbngnajogwypvkfjsr

1. Ir a **Table Editor**
2. Abrir tabla **zones**
3. Verificar:
   - ¿Hay registros?
   - ¿Qué `tenant_id` tienen?
   - ¿Están `active: true`?

**Esperado**:
- Al menos 1 zona "test" o "999"
- `tenant_id`: `46824e99-1d3f-4a13-8e96-17797f6149af`
- `active`: `true`

---

### Paso 3: Agregar logs detallados al API
**Objetivo**: Ver exactamente qué retorna Supabase

**Modificar** `app/api/zones/route.ts`:

```typescript
console.log('[GET /api/zones] Llamando Supabase con tenant_id:', tenantId)

const supabase = createServerClient()

console.log('[DEBUG] Supabase client created')

const { data: zones, error } = await supabase
  .from('zones')
  .select('*')
  .eq('tenant_id', tenantId)
  .eq('active', true)
  .order('sort_order', { ascending: true })

console.log('[DEBUG] Query result:', { 
  zones: zones?.length || 0, 
  error: error?.message,
  rawData: zones 
})

if (error) {
  console.log('[GET /api/zones] ❌ Error al obtener zonas:', error.message)
  console.log('[DEBUG] Error completo:', JSON.stringify(error))
  throw error
}
```

---

### Paso 4: Probar query desde navegador
**Objetivo**: Confirmar que el endpoint funciona

**En consola del navegador**:
```javascript
fetch('/api/zones?includeInactive=false')
  .then(r => r.json())
  .then(console.log)
```

**Respuesta esperada**:
```json
{
  "data": [
    {
      "id": "...",
      "name": "test",
      "tenant_id": "...",
      "active": true
    }
  ]
}
```

---

### Paso 5: Verificar RLS en Supabase
**Objetivo**: Confirmar que las políticas RLS permiten SELECT

**Ir a**: Supabase → Authentication → Policies → tabla `zones`

**Verificar política**:
```sql
-- Debe existir algo como:
CREATE POLICY "Users can view their tenant zones"
ON zones FOR SELECT
USING (tenant_id = auth.uid() OR tenant_id IN (
  SELECT tenant_id FROM users WHERE id = auth.uid()
));
```

**Problema común**: RLS bloquea el SELECT si:
- No hay política de SELECT
- La política no coincide con el `tenant_id`
- El usuario no tiene acceso al tenant

---

## 🔧 Soluciones Posibles

### Si el problema es RLS (MÁS PROBABLE):

**Opción A**: Deshabilitar RLS temporalmente
```sql
ALTER TABLE zones DISABLE ROW LEVEL SECURITY;
```

**Opción B**: Crear/Actualizar política SELECT
```sql
CREATE POLICY "Enable read access for authenticated users on their tenant zones"
ON zones FOR SELECT
TO authenticated
USING (
  tenant_id IN (
    SELECT tenant_id 
    FROM users 
    WHERE id = auth.uid()
  )
);
```

---

### Si el problema es el query:

**Posibilidad 1**: `active` no existe en la tabla
```typescript
// Quitar el filtro de active
const { data: zones, error } = await supabase
  .from('zones')
  .select('*')
  .eq('tenant_id', tenantId)
  // .eq('active', true)  // ← Comentar esta línea
  .order('sort_order', { ascending: true })
```

**Posibilidad 2**: Tenant_id no coincide
```typescript
// Loggear para comparar
console.log('[DEBUG] Buscando zonas con tenant_id:', tenantId)
console.log('[DEBUG] Tipo de tenant_id:', typeof tenantId)
```

---

### Si el problema es autenticación:

**Verificar que createServerClient() funciona**:
```typescript
const supabase = createServerClient()

// Probar que el cliente está autenticado
const { data: { user } } = await supabase.auth.getUser()
console.log('[DEBUG] User from server client:', user?.id)
```

---

## 🧪 Checklist de Debug

Ejecutar en orden:

- [ ] **1. Ver logs del terminal** (si no hay logs, hook no hace fetch)
- [ ] **2. Verificar tabla zones en Supabase** (si está vacía, crear zona)
- [ ] **3. Agregar logs detallados al API** (ver qué retorna Supabase)
- [ ] **4. Probar endpoint desde consola** (confirmar API funciona)
- [ ] **5. Verificar RLS** (si bloquea, ajustar políticas)

---

## 🚀 Acción Inmediata

**Paso 1**: Revisar logs del terminal cuando haces clic en "Agregar mesa"

**¿Qué aparece?**
- Nada → Hook no hace fetch (problema en frontend)
- `[GET /api/zones]` sin zonas → API funciona pero query vacío (problema RLS o datos)
- Error → Ver mensaje exacto

**Avísame qué ves en el terminal y continuamos** 🎯

---

**Estado**: 🟡 DIAGNOSTICANDO  
**Prioridad**: 🔥 ALTA
