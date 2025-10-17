# 🔧 Migración Zones API → Supabase

**Fecha**: Octubre 16, 2025, 8:15 PM  
**Razón**: Issue bloqueante en validación 5.2  
**Decisión**: Migración completa ahora (no workaround)  
**Tiempo estimado**: 20 minutos

---

## 📋 Plan de Migración

### Archivos Migrados

1. ✅ `app/api/zones/route.ts` - GET y POST (list + create)
   - **Backup**: route.ts.backup
   - **Cambios**: 3 bloques de código actualizados
   - **Compilación**: ✅ 0 errores TypeScript
   
2. ✅ `app/api/zones/[id]/route.ts` - GET, PATCH, DELETE (individual ops)
   - **Backup**: [id]/route.ts.backup
   - **Cambios**: 4 bloques de código actualizados
   - **Compilación**: ✅ 0 errores TypeScript

### Cambios a Realizar

#### Imports
```typescript
// ❌ ANTES
import { listZones, createZone, getZoneById, updateZone, deleteZone } from "@/lib/server/zones-store"

// ✅ DESPUÉS
import { getZones, createZone, getZoneById, updateZone, deleteZone } from "@/lib/services/zones-service"
```

#### Llamadas a funciones
```typescript
// ❌ ANTES
const zones = await listZones(tenantId)

// ✅ DESPUÉS
const { data: zones, error } = await getZones(tenantId)
if (error) throw error
```

---

## 🚀 Ejecución

### Paso 1: Backup
- ✅ Crear backup de archivos originales
  - `route.ts.backup` creado

### Paso 2: Migrar route.ts (GET/POST)
- ✅ Actualizar imports
  - `listZones, createZone` → `getZones, createZone`
  - `from "@/lib/server/zones-store"` → `from "@/lib/services/zones-service"`
- ✅ Actualizar GET (listZones → getZones)
  - Ahora usa `const { data: zones, error } = await getZones(tenantId)`
  - Maneja errores con `if (error) throw error`
- ✅ Actualizar POST (createZone)
  - Ahora usa `const { data: zone, error } = await createZone({...}, tenantId)`
  - Firma: `createZone(input, tenantId)` en vez de `createZone({...tenantId})`

### Paso 3: Migrar [id]/route.ts
- ✅ Actualizar imports
  - `from "@/lib/server/zones-store"` → `from "@/lib/services/zones-service"`
- ✅ Actualizar GET (getZoneById)
  - Ahora usa `const { data: zone, error } = await getZoneById(zoneId, tenantId)`
- ✅ Actualizar PATCH (updateZone)
  - Ahora usa `const { data: zone, error } = await updateZone(zoneId, updates, tenantId)`
  - Firma ajustada al servicio Supabase
- ✅ Actualizar DELETE (deleteZone)
  - Ahora usa `const { error } = await deleteZone(zoneId, tenantId)`

### Paso 4: Testing
- ✅ Verificar compila (get_errors)
  - ✅ route.ts: **0 errores**
  - ✅ [id]/route.ts: **0 errores**
- ⏳ Verificar en UI funciona
- ⏳ Crear zona de prueba

---

**Estado**: � COMPILACIÓN OK - Probando en UI
