# 🔴 ISSUE CRÍTICO: Zonas API usa Legacy Store

**Fecha**: Octubre 16, 2025, 8:10 PM  
**Severidad**: ALTA  
**Estado**: BLOQUEANTE  
**Fase**: 5.2 - Validación de Flujos

---

## 🐛 Problema Identificado

### Descripción
Al intentar crear zonas desde la UI, el sistema **no funciona correctamente** porque el API endpoint `/api/zones/route.ts` está usando **`zones-store` legacy** en lugar del servicio de Supabase.

### Ubicación
**Archivo**: `app/api/zones/route.ts`  
**Línea 3**: 
```typescript
import { listZones, createZone } from "@/lib/server/zones-store"
```

### Impacto
- ❌ No se pueden crear zonas
- ❌ No se pueden crear mesas (requieren zonas)
- ❌ **BLOQUEA toda la validación del flujo de mesas**

### Ya Identificado
✅ Este issue fue identificado en **AUDIT_LEGACY_STORES_REMAINING.md**  
✅ Estaba marcado para migración posterior  
✅ Ahora se convirtió en **BLOQUEANTE CRÍTICO**

---

## 🔧 Solución Rápida (15 minutos)

### Opción A: Migrar zones API ahora (RECOMENDADO)

**Cambios necesarios**:

1. **Actualizar `app/api/zones/route.ts`**:
```typescript
// ❌ ANTES
import { listZones, createZone } from "@/lib/server/zones-store"

// ✅ DESPUÉS
import { getZones, createZone } from "@/lib/services/zones-service"
```

2. **Actualizar llamadas en el código**:
```typescript
// ❌ ANTES
const zones = await listZones(tenantId)

// ✅ DESPUÉS
const { data: zones, error } = await getZones(tenantId)
if (error) throw error
```

3. **Actualizar `app/api/zones/[id]/route.ts`** (mismo patrón)

**Tiempo estimado**: 15-20 minutos  
**Riesgo**: BAJO (zones-service ya existe y está testeado)

---

### Opción B: Crear zona manualmente en Supabase (WORKAROUND)

**Pasos**:
1. Ir a Supabase Dashboard
2. Table Editor → `zones`
3. Insert row:
   ```
   name: "Principal"
   description: "Zona principal del restaurante"
   tenant_id: [tu tenant_id]
   active: true
   ```
4. Volver a la app y refrescar

**Tiempo estimado**: 2 minutos  
**Limitación**: Solo crea 1 zona, no resuelve el problema del API

---

### Opción C: Posponer validación de zonas (NO RECOMENDADO)

Saltar validación de zonas y continuar con otros flujos.

**Problemas**:
- No valida funcionalidad completa
- Mesas quedan sin zona asignada
- Issue queda pendiente

---

## 🎯 Recomendación

**OPCIÓN A + B COMBINADAS**:

1. **Ahora** (2 min): Crear zona manual en Supabase para desbloquear testing
2. **Después de testing** (20 min): Migrar zones API para fix permanente

**Razón**: Permite continuar validación inmediatamente mientras preparamos fix definitivo.

---

## 📋 Decisión Requerida

**¿Qué prefieres hacer?**

**A)** Migrar zones API ahora (20 min) → Testing completo después  
**B)** Crear zona manual (2 min) → Continuar testing → Migrar después  
**C)** Otra opción

---

## 🔗 Referencias

- **Auditoría original**: `docs/AUDIT_LEGACY_STORES_REMAINING.md`
- **Servicio Supabase**: `lib/services/zones-service.ts` (ya existe ✅)
- **API legacy**: `app/api/zones/route.ts` (a migrar)
- **Plan de migración**: Ver AUDIT_LEGACY_STORES_REMAINING.md líneas 134-198

---

**Status**: ⏸️ ESPERANDO DECISIÓN  
**Bloqueado**: Validación de Mesas + Zonas  
**Próximo**: Aplicar solución elegida
