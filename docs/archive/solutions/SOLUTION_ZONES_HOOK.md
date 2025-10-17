# 🔴 PROBLEMA IDENTIFICADO: Hook useZones() usa servicio directo

**Fecha**: Octubre 16, 2025, 8:35 PM  
**Severidad**: 🔥 CRÍTICA  
**Estado**: ✅ DIAGNOSTICADO

---

## 🐛 Problema Raíz

El hook `useZones()` **importa y llama directamente** a `zones-service.ts`:

```typescript
// ❌ INCORRECTO - hooks/use-zones.ts línea 15
import {
  getZones as getZonesService,
  createZone as createZoneService,
  ...
} from '@/lib/services/zones-service'

// Luego en línea 48:
const { data, error: createError } = await createZoneService(input, tenant.id)
```

**¿Por qué es un problema?**

1. **`zones-service.ts` es para uso BACKEND/Server-side**
   - Usa `createBrowserClient()` que NO tiene autenticación completa
   - No tiene acceso al `tenant_id` del usuario
   - No pasa por las validaciones del API

2. **El flujo correcto debería ser**:
   ```
   Frontend → fetch('/api/zones') → API valida auth → zones-service → Supabase
   ```

3. **El flujo actual (INCORRECTO) es**:
   ```
   Frontend → zones-service directo → Supabase ❌ (sin tenant_id válido)
   ```

---

## 🔍 Evidencia del Problema

### En `hooks/use-zones.ts` (línea 44-54)
```typescript
const createZoneMutation = useMutation({
  mutationFn: async (input: {
    name: string
    description?: string
    sortOrder?: number
  }) => {
    if (!tenant?.id) throw new Error('No tenant ID available')
    const { data, error: createError } = await createZoneService(input, tenant.id)
    //                                           ↑ Llama directamente al servicio
    if (createError) throw createError
    return data
  },
  ...
})
```

### En `lib/services/zones-service.ts` (línea 11-14)
```typescript
const logger = createLogger('zones-service')

type Zone = Database['public']['Tables']['zones']['Row']
type ZoneInsert = Database['public']['Tables']['zones']['Insert']

/**
 * Obtiene todas las zonas
 */
export async function getZones(tenantId: string, includeInactive = false) {
  const supabase = createBrowserClient()  // ← PROBLEMA: cliente browser sin auth completa
  //                ↑ No tiene tenant_id en contexto de autenticación
  
  try {
    let query = supabase
      .from('zones')
      .select('*')
      .eq('tenant_id', tenantId)  // ← tenant_id viene de parámetro, no de auth
```

---

## ✅ Solución

### Opción A: Modificar hooks para usar fetch (RECOMENDADA)

**Cambiar `hooks/use-zones.ts` para que haga fetch al API**:

```typescript
// ✅ CORRECTO - hooks/use-zones.ts
const createZoneMutation = useMutation({
  mutationFn: async (input: {
    name: string
    description?: string
    sortOrder?: number
  }) => {
    // Hacer POST al API
    const response = await fetch('/api/zones', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(input),
    })
    
    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.error || 'Error al crear zona')
    }
    
    const result = await response.json()
    return result.data
  },
  ...
})
```

**Ventajas**:
- ✅ Usa el API que acabamos de migrar
- ✅ Valida autenticación correctamente
- ✅ Tenant_id se obtiene del usuario autenticado
- ✅ Logs centralizados en el API
- ✅ Manejo de errores consistente

**Desventajas**:
- ⚠️ Requiere modificar el hook completo
- ⚠️ Cambio de arquitectura (pero es el correcto)

---

### Opción B: Usar zones-service pero en server-side (NO RECOMENDADA)

**Problema**: Los hooks se ejecutan en el cliente, no en el servidor.

---

## 📝 Plan de Implementación (Opción A)

### Paso 1: Modificar `hooks/use-zones.ts`

Cambiar todas las funciones para usar fetch:

1. **getZones** → `GET /api/zones`
2. **createZone** → `POST /api/zones`
3. **getZoneById** → `GET /api/zones/[id]`
4. **updateZone** → `PATCH /api/zones/[id]`
5. **deleteZone** → `DELETE /api/zones/[id]`

### Paso 2: Eliminar imports de services

```typescript
// ❌ ELIMINAR
import {
  getZones as getZonesService,
  createZone as createZoneService,
  ...
} from '@/lib/services/zones-service'

// ✅ NO SE NECESITA (usar fetch nativo)
```

### Paso 3: Crear función helper para fetch

```typescript
// En hooks/use-zones.ts (al inicio)
async function fetchAPI(endpoint: string, options?: RequestInit) {
  const response = await fetch(endpoint, options)
  
  if (!response.ok) {
    const error = await response.json().catch(() => ({}))
    throw new Error(error.error || `HTTP ${response.status}`)
  }
  
  const result = await response.json()
  return result.data
}
```

### Paso 4: Actualizar cada mutation

```typescript
// createZone
const createZoneMutation = useMutation({
  mutationFn: async (input: { name: string; description?: string }) => {
    return await fetchAPI('/api/zones', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(input),
    })
  },
  ...
})

// updateZone
const updateZoneMutation = useMutation({
  mutationFn: async ({ zoneId, updates }: { zoneId: string; updates: any }) => {
    return await fetchAPI(`/api/zones/${zoneId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updates),
    })
  },
  ...
})

// deleteZone
const deleteZoneMutation = useMutation({
  mutationFn: async (zoneId: string) => {
    return await fetchAPI(`/api/zones/${zoneId}`, {
      method: 'DELETE',
    })
  },
  ...
})
```

### Paso 5: Actualizar query (GET)

```typescript
const {
  data: zones = [],
  isLoading: loading,
  error,
} = useQuery({
  queryKey,
  queryFn: async () => {
    if (!tenant?.id) return []
    return await fetchAPI(`/api/zones?includeInactive=${includeInactive}`)
  },
  enabled: !!tenant?.id,
})
```

### Paso 6: Testing

1. ✅ Verificar compila sin errores
2. ✅ Crear zona "999" en UI
3. ✅ Ver logs del API en terminal
4. ✅ Verificar registro en Supabase
5. ✅ Verificar zona aparece en selector

---

## 🎯 Impacto

### Archivos a Modificar
- ✅ `hooks/use-zones.ts` (completo)

### Archivos que NO se modifican
- ✅ `lib/services/zones-service.ts` (se queda igual, para uso server-side)
- ✅ `app/api/zones/route.ts` (ya migrado, funcionará correctamente)
- ✅ `components/create-zone-dialog.tsx` (no cambia, usa el hook)

### Tests a Actualizar
- ⚠️ `tests/hooks/use-zones.test.tsx` (mock de fetch en vez de service)

---

## ⏱️ Estimación

- **Tiempo**: 15-20 minutos
- **Complejidad**: Media (es un refactor de hook)
- **Riesgo**: Bajo (el API ya está migrado y funcionando)

---

**Decisión**: ¿Procedemos con Opción A (modificar hook para usar fetch)?
