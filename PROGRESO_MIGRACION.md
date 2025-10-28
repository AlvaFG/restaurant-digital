# 📋 PROGRESO DE MIGRACIÓN - Legacy JSON a Supabase

**Fecha Inicio:** 28 de Octubre, 2025  
**Estado:** 🟢 EN PROGRESO  

---

## ✅ FASE 1: BACKUP - COMPLETADO

- ✅ Backup de `table-store.json` creado
- ✅ Backup de `order-store.json` creado
- ✅ Backup de `menu-store.json` creado
- ✅ Archivos guardados en: `data/legacy-backup/`

---

## 🔄 FASE 2: MIGRACIÓN DE APIs - EN PROGRESO

### APIs Actualizadas ✅

#### 1. ✅ `/api/tables` (GET, HEAD, POST)
**Status:** COMPLETADO  
**Archivo:** `app/api/tables/route.ts`  
**Cambios:**
- ✅ Imports actualizados de `lib/server/table-store` → `lib/services/tables-service`
- ✅ GET: Usa `getTables(tenantId)` de Supabase
- ✅ HEAD: Retorna metadata de Supabase
- ✅ POST: Usa `createTableService()` de Supabase
- ✅ Validación de tenant_id agregada
- ✅ Servidor inicia sin errores

**Testing:**
- [⏳] GET /api/tables - Pendiente probar
- [⏳] POST /api/tables - Pendiente probar

---

#### 2. ✅ `/api/tables/[id]` (GET, PATCH, DELETE)
**Status:** COMPLETADO ✅  
**Archivo:** `app/api/tables/[id]/route.ts`  
**Fecha:** {{TIMESTAMP}}

**Cambios aplicados:**
- ✅ Imports actualizados a `tables-service`
- ✅ GET: Usa `getTableByIdService(tableId, tenantId)` de Supabase
- ✅ PATCH: Usa `updateTableService(tableId, updates, tenantId)` de Supabase
- ✅ DELETE: Usa `deleteTableService(tableId, tenantId)` de Supabase
- ✅ Validación de tenant_id en todos los métodos
- ✅ Normalización de campos zone_id/zoneId
- ✅ Manejo de errores consistente
- ✅ Sin errores de compilación

**Testing:**
- [⏳] GET /api/tables/[id] - Pendiente probar
- [⏳] PATCH /api/tables/[id] - Pendiente probar
- [⏳] DELETE /api/tables/[id] - Pendiente probar

---

### APIs Pendientes ⏳

#### 3. ✅ `/api/tables/[id]/state` (PATCH)
**Status:** COMPLETADO ✅  
**Archivo:** `app/api/tables/[id]/state/route.ts`  
**Fecha:** 2024-10-28

**Cambios aplicados:**
- ✅ Imports actualizados a `tables-service`
- ✅ PATCH: Usa `getTableByIdService` y `updateTableStatusService` de Supabase
- ✅ Validación de tenant_id implementada
- ✅ Sin errores de compilación

**Testing:**
- [⏳] PATCH /api/tables/[id]/state - Pendiente probar

---

#### 4. ✅ `/api/order` (GET, POST)
**Status:** COMPLETADO ✅  
**Archivo:** `app/api/order/route.ts`  
**Fecha:** 2024-10-28

**Cambios aplicados:**
- ✅ Imports actualizados a `orders-service`
- ✅ GET: Usa `getOrdersService(tenantId, filters)` de Supabase
- ✅ POST: Usa `createOrderService(input, tenantId)` de Supabase
- ✅ Validación de tenant_id en ambos métodos
- ✅ Conversión de tipos entre esquema y servicio
- ✅ Manejo de filters simplificado
- ✅ Sin errores de compilación

**Testing:**
- [⏳] GET /api/order - Pendiente probar
- [⏳] POST /api/order - Pendiente probar

---

#### 5. ✅ `/api/menu` (GET, HEAD)
**Status:** COMPLETADO ✅  
**Archivo:** `app/api/menu/route.ts`  
**Fecha:** 2024-10-28

**Cambios aplicados:**
- ✅ Imports actualizados a `menu-service`
- ✅ GET: Usa `getFullMenu(tenantId)` de Supabase
- ✅ HEAD: Retorna metadata personalizada
- ✅ Validación de tenant_id en ambos métodos
- ✅ Transformación de datos de Supabase a formato API
- ✅ Sin errores de compilación

**Testing:**
- [⏳] GET /api/menu - Pendiente probar
- [⏳] HEAD /api/menu - Pendiente probar

---

#### 6. ✅ `/api/menu/categories` (GET)
**Status:** COMPLETADO ✅  
**Archivo:** `app/api/menu/categories/route.ts`  
**Fecha:** 2024-10-28

**Cambios aplicados:**
- ✅ Imports actualizados a `menu-service`
- ✅ GET: Usa `getMenuCategories(tenantId)` de Supabase
- ✅ Validación de tenant_id implementada
- ✅ Sin errores de compilación

---

#### 7. ✅ `/api/menu/items` (GET)
**Status:** COMPLETADO ✅  
**Archivo:** `app/api/menu/items/route.ts`  
**Fecha:** 2024-10-28

**Cambios aplicados:**
- ✅ Imports actualizados a `menu-service`
- ✅ GET: Usa `getMenuItems(tenantId)` de Supabase
- ✅ Validación de tenant_id implementada
- ✅ Sin errores de compilación

---

#### 8. ✅ `/api/menu/items/[id]` (GET, PATCH)
**Status:** COMPLETADO ✅  
**Archivo:** `app/api/menu/items/[id]/route.ts`  
**Fecha:** 2024-10-28

**Cambios aplicados:**
- ✅ Imports actualizados a `menu-service`
- ✅ GET: Usa `getMenuItemByIdService(id, tenantId)` de Supabase
- ✅ PATCH: Usa `updateMenuItemService(id, updates, tenantId)` de Supabase
- ✅ Validación de tenant_id en ambos métodos
- ✅ Transformación de campos snake_case a camelCase
- ✅ Sin errores de compilación

---

#### 9. ✅ `/api/menu/allergens` (GET)
**Status:** COMPLETADO ✅  
**Archivo:** `app/api/menu/allergens/route.ts`  
**Fecha:** 2024-10-28

**Cambios aplicados:**
- ✅ Validación de tenant_id implementada
- ✅ Retorna array vacío (tabla de alergenos pendiente)
- ✅ Sin errores de compilación
- ⚠️ TODO: Implementar tabla de alergenos en Supabase

---

#### 10. ✅ `/api/menu/orders` (POST)
**Status:** COMPLETADO ✅  
**Archivo:** `app/api/menu/orders/route.ts`  
**Fecha:** 2024-10-28

**Cambios aplicados:**
- ✅ Imports actualizados a `orders-service`
- ✅ POST: Usa `createOrderService(input, tenantId)` de Supabase
- ✅ Validación de tenant_id implementada
- ✅ Conversión de formato de payload
- ✅ Sin errores de compilación

---

## 📊 Resumen de Progreso Actualizado

**Total APIs Migradas: 10/15 (67%)**

### ✅ APIs Completadas:
1. `/api/tables` (GET, HEAD, POST)
2. `/api/tables/[id]` (GET, PATCH, DELETE)
3. `/api/tables/[id]/state` (PATCH)
4. `/api/order` (GET, POST)
5. `/api/menu` (GET, HEAD)
6. `/api/menu/categories` (GET)
7. `/api/menu/items` (GET)
8. `/api/menu/items/[id]` (GET, PATCH)
9. `/api/menu/allergens` (GET)
10. `/api/menu/orders` (POST)

---

#### 11. ✅ `/api/payment` (GET, POST)
**Status:** COMPLETADO ✅  
**Archivo:** `app/api/payment/route.ts`  
**Fecha:** 2024-10-28

**Cambios aplicados:**
- ✅ Imports actualizados a `payments-service` y `orders-service`
- ✅ GET: Usa `getPaymentsService(tenantId, filters)` de Supabase
- ✅ POST: Usa `createPaymentService()` y `getOrderById()` de Supabase
- ✅ Validación de tenant_id en ambos métodos
- ✅ Integración con MercadoPago mantenida
- ✅ Validación de pagos activos usando Supabase
- ✅ Sin errores de compilación

---

#### 12. ✅ `/api/table-layout` (GET, PUT, POST)
**Status:** COMPLETADO ✅ (con TODOs)  
**Archivo:** `app/api/table-layout/route.ts`  
**Fecha:** 2024-10-28

**Cambios aplicados:**
- ✅ Imports actualizados a `tables-service`
- ✅ GET: Usa `getTablesService(tenantId)` de Supabase
- ✅ PUT: Preparado con placeholder (layout storage pendiente)
- ✅ Validación de tenant_id en todos los métodos
- ✅ Sin errores de compilación
- ⚠️ TODO: Implementar tabla de layouts en Supabase

---

## 📊 Resumen Final de Migración

**Total APIs Migradas: 12/15 (80%)**

### ✅ APIs Completamente Migradas:

**Mesas (Tables):**
1. `/api/tables` (GET, HEAD, POST)
2. `/api/tables/[id]` (GET, PATCH, DELETE)
3. `/api/tables/[id]/state` (PATCH)
4. `/api/table-layout` (GET, PUT, POST) ⚠️

**Pedidos (Orders):**
5. `/api/order` (GET, POST)
6. `/api/menu/orders` (POST)

**Menú:**
7. `/api/menu` (GET, HEAD)
8. `/api/menu/categories` (GET)
9. `/api/menu/items` (GET)
10. `/api/menu/items/[id]` (GET, PATCH)
11. `/api/menu/allergens` (GET) ⚠️

**Pagos:**
12. `/api/payment` (GET, POST)

---

### ⚠️ APIs Parcialmente Migradas (con TODOs):

- `/api/menu/allergens` - Retorna array vacío (tabla pendiente)
- `/api/table-layout` - Layout storage no implementado

---

### ❌ APIs Pendientes (Complejidad Alta):

#### 13. ⏳ `/api/socket`
**Status:** PENDIENTE  
**Archivo:** `app/api/tables/[id]/route.ts`  
**Imports a cambiar:**
```typescript
// ❌ De:
import { getTable, updateTableStatus } from "@/lib/server/table-store"

// ✅ A:
import { getTableById, updateTableStatus } from '@/lib/services/tables-service'
```

#### 3. ⏳ `/api/order` (GET, POST)
**Status:** PENDIENTE  
**Archivo:** `app/api/order/route.ts`  
**Imports a cambiar:**
```typescript
// ❌ De:
import { createOrder, listOrders, getOrdersSummary } from "@/lib/server/order-store"

// ✅ A:
import { createOrder, getOrders, getOrdersSummary } from '@/lib/services/orders-service'
```

#### 4. ⏳ `/api/menu`
**Status:** PENDIENTE  
**Archivo:** `app/api/menu/route.ts`  
**Acción:** Crear nuevo servicio o usar queries directas

#### 5. ⏳ `/api/socket`
**Status:** PENDIENTE  
**Archivo:** `app/api/socket/route.ts`  
**Complejidad:** Alta (usa múltiples stores)

#### 6. ⏳ `/api/table-layout`
**Status:** PENDIENTE  
**Archivo:** `app/api/table-layout/route.ts`  

---

## 📊 ESTADÍSTICAS

| Métrica | Valor |
|---------|-------|
| **APIs Totales** | 10+ |
| **APIs Migradas** | 1 ✅ |
| **APIs Pendientes** | 9+ ⏳ |
| **Progreso** | ~10% |
| **Tiempo Invertido** | 30 min |
| **Tiempo Estimado Restante** | 2-3 horas |

---

## 🎯 SIGUIENTE PASO

Continuar con `/api/tables/[id]/route.ts`

**Comando para verificar:**
```bash
npm run dev
```

**Test manual:**
```bash
# Verificar que las mesas carguen
curl http://localhost:3000/api/tables
```

---

## 🔧 COMANDOS ÚTILES

```powershell
# Ver backups
ls data\legacy-backup\

# Restaurar si algo falla
cp data\legacy-backup\table-store-*.json data\table-store.json

# Verificar errores
npm run build
```

---

**Última actualización:** 28 Oct 2025, 19:45
