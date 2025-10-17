# 📊 Reporte: Stores Legacy Restantes

**Fecha**: Octubre 16, 2025  
**Fase**: 5.1 - Auditoría de Código (continuación)  
**Estado**: 🟡 Stores legacy AÚN EN USO

---

## 🎯 Resumen

### Stores Verificados

| Store Legacy | Servicio Supabase | Estado | Acción |
|-------------|-------------------|--------|--------|
| `table-store.ts` | `tables-service.ts` | ✅ **MIGRADO** | ✅ Listo para eliminar |
| `order-store.ts` | `orders-service.ts` | ⚠️ **Tipos usados** | 🔧 Centralizar tipos primero |
| `menu-store.ts` | `menu-service.ts` | ⚠️ **Tipos usados** | 🔧 Centralizar tipos primero |
| `payment-store.ts` | `payments-service.ts` | 🔴 **EN USO** | 🔧 Migrar API routes |
| `zones-store.ts` | `zones-service.ts` | 🔴 **EN USO** | 🔧 Migrar API routes |

---

## 🔴 CRÍTICO: payment-store.ts EN USO

### Archivos que lo usan (4)

1. **`app/api/payment/route.ts`** (CREATE payment)
   ```typescript
   import { paymentStore } from '@/lib/server/payment-store'
   ```

2. **`app/api/payment/[id]/route.ts`** (GET/UPDATE payment)
   ```typescript
   import { paymentStore } from '@/lib/server/payment-store'
   ```

3. **`app/api/webhook/mercadopago/route.ts`** (Webhook handler)
   ```typescript
   import { paymentStore } from '@/lib/server/payment-store'
   ```

4. **`lib/server/__tests__/payment-store.test.ts`** (Tests legacy)
   ```typescript
   import { paymentStore } from '../payment-store';
   ```

### Servicio Supabase Disponible ✅

**`lib/services/payments-service.ts`** tiene todas las funciones:

```typescript
✅ export async function createPayment(...)
✅ export async function getPayments(...)
✅ export async function getPaymentById(...)
✅ export async function getPaymentByExternalId(...)
✅ export async function updatePaymentStatus(...)
✅ export async function updatePayment(...)
✅ export async function getPaymentsStats(...)
```

### Plan de Migración

#### 1. Migrar `app/api/payment/route.ts` (CREATE)

**Antes**:
```typescript
import { paymentStore } from '@/lib/server/payment-store'

export async function POST(request: Request) {
  const payment = await paymentStore.createPayment(...)
}
```

**Después**:
```typescript
import { createPayment } from '@/lib/services/payments-service'

export async function POST(request: Request) {
  const { data: payment, error } = await createPayment(...)
}
```

#### 2. Migrar `app/api/payment/[id]/route.ts` (GET/UPDATE)

**Antes**:
```typescript
import { paymentStore } from '@/lib/server/payment-store'

export async function GET(...) {
  const payment = await paymentStore.getPaymentById(id)
}
```

**Después**:
```typescript
import { getPaymentById, updatePayment } from '@/lib/services/payments-service'

export async function GET(...) {
  const { data: payment, error } = await getPaymentById(id, tenantId)
}
```

#### 3. Migrar `app/api/webhook/mercadopago/route.ts` (WEBHOOK)

**Antes**:
```typescript
import { paymentStore } from '@/lib/server/payment-store'

export async function POST(request: Request) {
  await paymentStore.updatePaymentStatus(...)
}
```

**Después**:
```typescript
import { updatePaymentStatus } from '@/lib/services/payments-service'

export async function POST(request: Request) {
  const { data, error } = await updatePaymentStatus(...)
}
```

#### 4. Actualizar Tests

Crear `lib/services/__tests__/payments-service.test.ts` (migrar de payment-store.test.ts)

**Tiempo estimado**: 2-3 horas

---

## 🔴 CRÍTICO: zones-store.ts EN USO

### Archivos que lo usan (2)

1. **`app/api/zones/route.ts`** (LIST/CREATE zones)
   ```typescript
   import { listZones, createZone } from "@/lib/server/zones-store"
   ```

2. **`app/api/zones/[id]/route.ts`** (GET/UPDATE/DELETE zone)
   ```typescript
   import { getZoneById, updateZone, deleteZone } from "@/lib/server/zones-store"
   ```

### Servicio Supabase Disponible ✅

**`lib/services/zones-service.ts`** tiene todas las funciones:

```typescript
✅ export async function getZones(...)
✅ export async function getZoneById(...)
✅ export async function createZone(...)
✅ export async function updateZone(...)
✅ export async function deleteZone(...)
✅ export async function hardDeleteZone(...)
✅ export async function getZonesWithStats(...)
```

### Plan de Migración

#### 1. Migrar `app/api/zones/route.ts`

**Antes**:
```typescript
import { listZones, createZone } from "@/lib/server/zones-store"

export async function GET() {
  const zones = await listZones()
}
```

**Después**:
```typescript
import { getZones, createZone } from "@/lib/services/zones-service"

export async function GET() {
  const { data: zones, error } = await getZones(tenantId)
}
```

#### 2. Migrar `app/api/zones/[id]/route.ts`

**Antes**:
```typescript
import { getZoneById, updateZone, deleteZone } from "@/lib/server/zones-store"
```

**Después**:
```typescript
import { getZoneById, updateZone, deleteZone } from "@/lib/services/zones-service"
```

**Tiempo estimado**: 1-2 horas

---

## ⚠️ TIPOS: order-store.ts y menu-store.ts

### Archivos que importan tipos

#### order-store.ts

```bash
lib/server/socket-payloads.ts
  → import type { OrdersSummary } from "@/lib/server/order-store"

lib/order-service.ts
  → import type { OrdersSummary } from "@/lib/server/order-store"

app/pedidos/_hooks/use-orders-panel.ts
  → import type { OrdersSummary } from "@/lib/server/order-store"
```

#### menu-store.ts

```bash
lib/mock-data.ts
  → const { getMenuItemsSnapshot } = await import("@/lib/server/menu-store")
```

### Plan de Migración

1. **Crear `lib/types/orders.ts`**
   ```typescript
   export type OrdersSummary = {
     // ... copiar de order-store.ts
   }
   ```

2. **Crear `lib/types/menu.ts`**
   ```typescript
   export type MenuItem = {
     // ... copiar de menu-store.ts
   }
   ```

3. **Actualizar imports** (~5 archivos)
   ```typescript
   // Antes
   import type { OrdersSummary } from "@/lib/server/order-store"
   
   // Después
   import type { OrdersSummary } from "@/lib/types/orders"
   ```

4. **mock-data.ts**: Cambiar a usar `menu-service.ts` o seedear directamente desde Supabase

**Tiempo estimado**: 1 hora

---

## 📋 Plan de Acción Completo

### Fase 1: Migrar API Routes (CRÍTICO)

**Prioridad**: ALTA (afecta funcionalidad productiva)

1. **Migrar payment API routes** (2-3h)
   - [ ] `app/api/payment/route.ts`
   - [ ] `app/api/payment/[id]/route.ts`
   - [ ] `app/api/webhook/mercadopago/route.ts`
   - [ ] Testing manual de pagos

2. **Migrar zones API routes** (1-2h)
   - [ ] `app/api/zones/route.ts`
   - [ ] `app/api/zones/[id]/route.ts`
   - [ ] Testing manual de zonas

**Total Fase 1**: 3-5 horas

---

### Fase 2: Centralizar Tipos (MEDIA)

**Prioridad**: MEDIA (no afecta runtime, solo desarrollo)

3. **Centralizar tipos de orders** (30min)
   - [ ] Crear `lib/types/orders.ts`
   - [ ] Actualizar imports (3 archivos)
   - [ ] Verificar type-check

4. **Centralizar tipos de menu** (30min)
   - [ ] Crear `lib/types/menu.ts`
   - [ ] Actualizar mock-data.ts
   - [ ] Verificar type-check

**Total Fase 2**: 1 hora

---

### Fase 3: Eliminar Stores Legacy (BAJA)

**Prioridad**: BAJA (solo después de migrar todo)

5. **Eliminar archivos legacy** (30min)
   - [ ] Verificar que nada importa de stores legacy
   - [ ] Eliminar `lib/server/table-store.ts` ✅ (ya migrado)
   - [ ] Eliminar `lib/server/order-store.ts` (después tipos)
   - [ ] Eliminar `lib/server/menu-store.ts` (después tipos)
   - [ ] Eliminar `lib/server/payment-store.ts` (después API)
   - [ ] Eliminar `lib/server/zones-store.ts` (después API)
   - [ ] Eliminar `data/table-store.json`
   - [ ] Run tests (verificar nada se rompe)

**Total Fase 3**: 30 minutos

---

## 📊 Resumen de Esfuerzo

| Fase | Tarea | Tiempo | Prioridad |
|------|-------|--------|-----------|
| 1 | Migrar payment API routes | 2-3h | 🔴 ALTA |
| 1 | Migrar zones API routes | 1-2h | 🔴 ALTA |
| 2 | Centralizar tipos orders | 30min | 🟡 MEDIA |
| 2 | Centralizar tipos menu | 30min | 🟡 MEDIA |
| 3 | Eliminar stores legacy | 30min | 🟢 BAJA |
| **TOTAL** | | **5-6.5h** | |

---

## ✅ Próxima Acción Recomendada

### Opción A: Continuar limpieza ahora (3-5h más)

Completar migración de payment y zones API routes → liberar stores legacy → avanzar a Fase 5.2

**Ventajas**:
- Elimina deuda técnica completamente
- Sistema 100% en Supabase
- Arquitectura limpia antes de testing

**Desventajas**:
- Requiere ~5h más de trabajo
- Puede introducir bugs en pagos/zonas

---

### Opción B: Marcar como pendiente y continuar Fase 5.2

Documentar stores legacy pendientes → pasar a validación de flujos de usuario

**Ventajas**:
- Progreso más rápido en fase 5
- Se puede hacer migración después
- Menos riesgo ahora

**Desventajas**:
- Deuda técnica queda pendiente
- Sistema mixto (legacy + Supabase)

---

### Opción C: Migrar solo zones (1-2h), payment después

Zones es más simple, menos crítico que pagos

**Ventajas**:
- Progreso visible
- Menos riesgo que migrar pagos
- 1 store menos legacy

**Desventajas**:
- Deuda técnica parcial
- Payment store sigue legacy

---

## 🎯 Recomendación

**Opción B**: Marcar como pendiente, continuar con Fase 5.2-5.3

**Razón**:
- Payment es CRÍTICO (MercadoPago webhook)
- Mejor migrar con más tiempo y testing
- Fase 5.2 (flujos) puede revelar otros issues
- Fase 5.3 (RLS) es más urgente para producción

**Plan**:
1. Crear issue/task para migrar payment + zones API routes
2. Continuar con Fase 5.2: Validación de flujos
3. Volver a migración después de validar sistema funciona

---

**Estado**: 📝 Stores legacy identificados y documentados  
**Siguiente decisión**: ¿Migrar ahora o después?  
**Progreso Fase 5.1**: 90% completo (auditoría terminada)
