# 🎯 PLAN EJECUTIVO - Migración Completa Legacy a Supabase

**Fecha:** 28 de Octubre, 2025  
**Duración Estimada:** 2-3 horas  
**Dificultad:** Media  

---

## ✅ ESTADO ACTUAL

- ✅ Backups creados en `data/legacy-backup/`
- ✅ `/api/tables` migrado y funcionando
- ⏳ Faltan 9+ APIs por migrar

---

## 🚀 OPCIÓN RECOMENDADA: Migración Incremental

Te recomiendo la **Opción 2: Manual pero Seguro** con este enfoque:

### Estrategia: "Migra, Prueba, Avanza"

1. **Migrar 1 API** → Probar → Si funciona, continuar
2. **Migrar la siguiente** → Probar → Si funciona, continuar
3. Repetir hasta completar todas

**Ventajas:**
- ✅ Control total sobre cada cambio
- ✅ Si algo falla, es fácil identificarlo
- ✅ Puedes pausar y continuar después
- ✅ Aprendes el código en el proceso

---

## 📋 LISTA COMPLETA DE CAMBIOS NECESARIOS

### 🔧 Grupo 1: APIs de Mesas (Prioridad Alta)

#### ✅ 1. `/api/tables` - COMPLETADO
**Archivo:** `app/api/tables/route.ts`  
**Status:** ✅ Migrado y funcionando

#### ⏳ 2. `/api/tables/[id]`
**Archivo:** `app/api/tables/[id]/route.ts`  
**Complejidad:** 🟡 Media  
**Tiempo:** 15 min

**Cambios necesarios:**
```typescript
// Línea 3-9: Cambiar imports
import {
  getTableById as getTableByIdService,
  updateTable as updateTableService,
  deleteTable as deleteTableService,
} from '@/lib/services/tables-service'

// GET: Reemplazar lógica (línea 37-73)
const { data: table, error } = await getTableByIdService(tableId, tenantId)

// PATCH: Reemplazar lógica  
const { data: updatedTable, error } = await updateTableService(tableId, updates, tenantId)

// DELETE: Reemplazar lógica
const { error } = await deleteTableService(tableId, tenantId)
```

#### ⏳ 3. `/api/tables/[id]/state`
**Archivo:** `app/api/tables/[id]/state/route.ts`  
**Complejidad:** 🟢 Baja  
**Tiempo:** 10 min

**Cambios:**
```typescript
import { updateTableStatus } from '@/lib/services/tables-service'

// En PATCH
const { data, error } = await updateTableStatus(tableId, newStatus, tenantId)
```

#### ⏳ 4. `/api/tables/[id]/covers`
**Archivo:** `app/api/tables/[id]/covers/route.ts`  
**Complejidad:** 🟡 Media  
**Tiempo:** 15 min

**Nota:** Esta API maneja "covers" (comensales). Necesita lógica especial.

#### ⏳ 5. `/api/table-layout`
**Archivo:** `app/api/table-layout/route.ts`  
**Complejidad:** 🟡 Media  
**Tiempo:** 20 min

**Nota:** Maneja el layout visual de mesas. Puede requerir nueva tabla en Supabase.

---

### 🔧 Grupo 2: APIs de Órdenes (Prioridad Alta)

#### ⏳ 6. `/api/order`
**Archivo:** `app/api/order/route.ts`  
**Complejidad:** 🔴 Alta  
**Tiempo:** 30 min

**Cambios necesarios:**
```typescript
// Cambiar imports
import {
  createOrder as createOrderService,
  getOrders,
  getOrdersSummary,
} from '@/lib/services/orders-service'

// GET: Usar getOrders con tenant
const { data: orders, error } = await getOrders(tenantId, {
  status: parsed.status,
  paymentStatus: parsed.paymentStatus,
  tableId: parsed.tableId,
  limit: parsed.limit,
})

// POST: Usar createOrderService
const { data: order, error } = await createOrderService(parsed.data, tenantId)
```

#### ⏳ 7. `/api/order/[id]`
**Archivo:** `app/api/order/[id]/route.ts` (si existe)  
**Complejidad:** 🟡 Media  
**Tiempo:** 15 min

---

### 🔧 Grupo 3: APIs de Menú (Prioridad Media)

#### ⏳ 8. `/api/menu`
**Archivo:** `app/api/menu/route.ts`  
**Complejidad:** 🔴 Alta  
**Tiempo:** 40 min

**Acción:** Crear nuevo servicio `lib/services/menu-service.ts`

```typescript
// Nuevo archivo: lib/services/menu-service.ts
import { createBrowserClient } from "@/lib/supabase/client"

export async function getMenuCatalog(tenantId: string) {
  const supabase = createBrowserClient()
  
  // Obtener categorías
  const { data: categories } = await supabase
    .from('menu_categories')
    .select('*')
    .eq('tenant_id', tenantId)
    .order('sort', { ascending: true })
  
  // Obtener items
  const { data: items } = await supabase
    .from('menu_items')
    .select('*')
    .eq('tenant_id', tenantId)
    .eq('available', true)
  
  return {
    categories: categories || [],
    items: items || [],
    metadata: {
      version: 1,
      updatedAt: new Date().toISOString()
    }
  }
}
```

#### ⏳ 9. `/api/menu/categories`
**Archivo:** `app/api/menu/categories/route.ts`  
**Complejidad:** 🟢 Baja  
**Tiempo:** 10 min

#### ⏳ 10. `/api/menu/orders`
**Archivo:** `app/api/menu/orders/route.ts`  
**Complejidad:** 🟢 Baja  
**Tiempo:** 10 min

---

### 🔧 Grupo 4: APIs de WebSocket y Pago (Prioridad Baja)

#### ⏳ 11. `/api/socket`
**Archivo:** `app/api/socket/route.ts`  
**Complejidad:** 🔴 Muy Alta  
**Tiempo:** 45 min

**Nota:** Usa múltiples stores. Migrar al final.

#### ⏳ 12. `/api/payment`
**Archivo:** `app/api/payment/route.ts`  
**Complejidad:** 🟡 Media  
**Tiempo:** 20 min

---

## ⚡ FAST TRACK: Migración Rápida (Si tienes prisa)

Si necesitas que el sistema funcione YA, puedes:

### Opción A: Migrar solo lo crítico (1 hora)
1. ✅ `/api/tables` - HECHO
2. `/api/tables/[id]` - Crítico para editar mesas
3. `/api/order` - Crítico para crear pedidos
4. Dejar el resto para después

### Opción B: Feature Flag (30 min)
Agregar flag para usar legacy o Supabase:

```typescript
// .env.local
NEXT_PUBLIC_USE_SUPABASE_TABLES=true
NEXT_PUBLIC_USE_SUPABASE_ORDERS=false  # Mantener legacy temporalmente

// En las APIs
const useSupabase = process.env.NEXT_PUBLIC_USE_SUPABASE_TABLES === 'true'

if (useSupabase) {
  return await getTablesFromSupabase(tenantId)
} else {
  return await getTablesFromJSON()
}
```

---

## 🎯 MI RECOMENDACIÓN

**Para tu caso específico, te sugiero:**

### Plan "Seguro y Progresivo" (3 horas)

**Hoy (1 hora):**
1. ✅ `/api/tables` - HECHO
2. ⏳ `/api/tables/[id]` - Migrar ahora
3. ⏳ `/api/order` - Migrar ahora
4. Probar que todo funciona

**Mañana (1 hora):**
5. `/api/menu` - Crear servicio y migrar
6. `/api/table-layout` - Evaluar si es necesario

**Después (1 hora):**
7. APIs restantes
8. Limpieza final con `-FullCleanup`
9. Testing completo

---

## ✅ CHECKLIST DE VERIFICACIÓN

Después de cada migración, verifica:

- [ ] Servidor inicia sin errores (`npm run dev`)
- [ ] No hay errores de compilación TypeScript
- [ ] La API responde correctamente (curl o Postman)
- [ ] Los datos son correctos (compara con Supabase)
- [ ] No hay errores en la consola del browser
- [ ] Los cambios se persisten (refrescar página)

---

## 🆘 ROLLBACK RÁPIDO

Si algo falla en cualquier momento:

```powershell
# 1. Detener servidor
# Ctrl+C en la terminal

# 2. Restaurar el archivo problemático desde Git
git checkout app/api/tables/[id]/route.ts

# 3. O restaurar desde backup
cp data/legacy-backup/table-store-*.json data/table-store.json

# 4. Reiniciar
npm run dev
```

---

## 📞 DECISIÓN FINAL

**¿Qué prefieres hacer ahora?**

### Opción A: Continuar con migración completa (te guío paso a paso)
- Tiempo: 2-3 horas
- Resultado: Sistema 100% en Supabase
- Riesgo: Bajo (con backups)

### Opción B: Migrar solo lo crítico (más rápido)
- Tiempo: 1 hora
- Resultado: APIs principales funcionando
- Riesgo: Muy bajo

### Opción C: Pausar y continuar después
- Guardar progreso actual
- Dejar documentación lista
- Continuar en otro momento

---

**Responde con A, B o C y continuamos** 🚀
