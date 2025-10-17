# Fase 3: Refactorización de Componentes - Progreso

## Fecha: 2024
## Estado: EN PROGRESO

---

## Objetivo de la Fase 3

Refactorizar todos los componentes React para usar los nuevos custom hooks en lugar de:
- Imports directos de servicios legacy (`lib/server/*-store.ts`)
- Imports de `lib/mock-data.ts`
- Llamadas directas a servicios (sin capa de hooks)

---

## Hooks Creados ✅

### 1. `hooks/use-orders.ts`
**Hooks exportados:**
- `useOrders()` - Lista de órdenes con loading/error states
- `useOrder(orderId)` - Orden individual
- `useOrdersSummary()` - Estadísticas de órdenes

**Funcionalidades:**
- `createOrder()` - Crear nueva orden
- `updateOrderStatus()` - Actualizar estado de orden
- `updatePaymentStatus()` - Actualizar estado de pago
- `cancelOrder()` - Cancelar orden

### 2. `hooks/use-menu.ts`
**Hooks exportados:**
- `useMenuCategories()` - Lista de categorías
- `useMenuItems(categoryId?)` - Items del menú (opcional: filtrado por categoría)
- `useMenuItem(itemId)` - Item individual
- `useFullMenu()` - Menú completo con categorías anidadas

**Funcionalidades:**
- CRUD completo para categorías y items
- Soft delete para items
- Carga anidada (categorías con sus items)

### 3. `hooks/use-tables.ts`
**Hooks exportados:**
- `useTables()` - Lista de mesas con loading/error
- `useTable(tableId)` - Mesa individual
- `useTablesByZone(zoneId)` - Mesas filtradas por zona
- `useTablesStats()` - Estadísticas de mesas

**Funcionalidades:**
- CRUD completo para mesas
- `updateStatus()` - Cambiar estado de mesa
- `deleteTable()` - Eliminar mesa
- Filtrado por zona

### 4. `hooks/use-zones.ts`
**Hooks exportados:**
- `useZones()` - Lista de zonas
- `useZone(zoneId)` - Zona individual
- `useZonesWithStats()` - Zonas con estadísticas de mesas

**Funcionalidades:**
- CRUD completo para zonas
- Soft delete (campo `active`)
- Hard delete con `hardDeleteZone()`
- Estadísticas automáticas

### 5. `hooks/use-payments.ts`
**Hooks exportados:**
- `usePayments(orderId?)` - Pagos (opcional: filtrado por orden)
- `usePayment(paymentId)` - Pago individual
- `usePaymentByExternalId(externalId)` - Búsqueda por ID externo (MP, Stripe)
- `usePaymentsStats()` - Estadísticas de pagos

**Funcionalidades:**
- `createPayment()` - Crear pago
- `updatePaymentStatus()` - Actualizar estado
- Integración con proveedores externos

### 6. `hooks/index.ts`
Export central de todos los hooks para imports limpios:
```typescript
import { useOrders, useTables, useMenu } from '@/hooks'
```

---

## Componentes Refactorizados ✅

### 1. **table-list.tsx** ✅ COMPLETADO
**Cambios realizados:**

#### Imports actualizados:
```typescript
// ANTES
import type { Table, Zone } from "@/lib/mock-data"
import { fetchTables, inviteHouse, resetTable, deleteTable } from "@/lib/table-service"
import { fetchZones } from "@/lib/zones-service"

// DESPUÉS
import type { Database } from "@/lib/supabase/database.types"
import { useTables } from "@/hooks/use-tables"
import { useZones } from "@/hooks/use-zones"

type Table = Database['public']['Tables']['tables']['Row'] & {
  zone?: Database['public']['Tables']['zones']['Row']
}
type Zone = Database['public']['Tables']['zones']['Row'] & {
  table_count?: number
}
```

#### State simplificado:
```typescript
// ANTES
const [tables, setTables] = useState<Table[]>([])
const [zones, setZones] = useState<Zone[]>([])
const [isLoading, setIsLoading] = useState(true)
const [error, setError] = useState<string | null>(null)

// DESPUÉS
const { tables, loading: tablesLoading, error: tablesError, updateStatus, deleteTable: deleteTableMutation } = useTables()
const { zones, loading: zonesLoading } = useZones()

const isLoading = tablesLoading || zonesLoading
const error = tablesError ? tablesError.message : null
```

#### Eliminación de funciones de carga manual:
```typescript
// ANTES
const loadTables = useCallback(async () => {
  setIsLoading(true)
  setError(null)
  try {
    const [tablesResponse, zonesData] = await Promise.all([
      fetchTables(),
      fetchZones()
    ])
    setTables(tablesResponse.data)
    setZones(zonesData)
  } catch (loadError) {
    setError("Error...")
  } finally {
    setIsLoading(false)
  }
}, [])

useEffect(() => {
  void loadTables()
}, [loadTables])

// DESPUÉS
// ¡Los hooks manejan todo automáticamente!
// No se necesita useEffect ni useCallback
```

#### Acciones refactorizadas:
```typescript
// ANTES
await resetTable(selectedTable.id)
await loadTables() // Recarga manual

// DESPUÉS
await updateStatus(selectedTable.id, 'libre')
// ¡Recarga automática gracias al hook!
```

```typescript
// ANTES
await deleteTable(selectedTable.id)
await loadTables() // Recarga manual

// DESPUÉS
await deleteTableMutation(selectedTable.id)
// ¡Recarga automática!
```

#### Tipos corregidos:
- `table.seats` → `table.capacity` (campo correcto en BD)
- Type assertions para `status` (string en BD vs enums en UI)
- Uso de `keyof typeof` para type safety

**Resultado:**
- ✅ Sin errores TypeScript
- ✅ Sin imports de legacy stores
- ✅ Sin imports de mock-data
- ✅ Recarga automática de datos
- ✅ Loading y error states manejados por hooks

---

## Componentes Pendientes de Refactorización

### Prioridad Alta
1. **orders-panel.tsx** - Usa `fetchTables`, imports de `mock-data`, context provider complejo
2. **order-form.tsx** - Usa `MOCK_MENU_CATEGORIES`, `MOCK_MENU_ITEMS`
3. **salon-live-view.tsx** - Usa `MOCK_ORDERS`, `MOCK_TABLES`
4. **table-map.tsx** - Usa `fetchTables`, `MOCK_TABLES`

### Prioridad Media
5. **zones-management.tsx** - Usa `fetchZones`, `createZone`, `updateZone`, `deleteZone`
6. **salon-zones-panel.tsx** - Usa `fetchZones`
7. **add-table-dialog.tsx** - Usa `createTable` directo

### Prioridad Baja
8. **alerts-center.tsx** - Posible uso de mock data
9. **notification-bell.tsx** - Posible uso de mock data

---

## Patrón de Refactorización

Para cada componente seguir estos pasos:

### 1. Actualizar Imports
```typescript
// Remover
import { fetchX } from '@/lib/x-service'
import { MOCK_X } from '@/lib/mock-data'
import type { X } from '@/lib/mock-data'

// Agregar
import { useX } from '@/hooks/use-x'
import type { Database } from '@/lib/supabase/database.types'

type X = Database['public']['Tables']['x']['Row']
```

### 2. Reemplazar State Local
```typescript
// Remover
const [data, setData] = useState([])
const [loading, setLoading] = useState(false)
const [error, setError] = useState(null)

// Agregar
const { data, loading, error, createX, updateX, deleteX } = useX()
```

### 3. Eliminar Funciones de Carga
```typescript
// Remover
const loadData = async () => { ... }
useEffect(() => { loadData() }, [])

// Los hooks cargan automáticamente
```

### 4. Usar Mutaciones del Hook
```typescript
// Remover llamadas directas a servicios
await createX(...)
await fetchX()

// Usar mutaciones del hook
await createX(...)
// Recarga automática!
```

### 5. Ajustar Tipos
- Usar tipos de `database.types.ts`
- Type assertions donde sea necesario
- Verificar campos (ej: `capacity` vs `seats`)

---

## Beneficios de la Refactorización

### Code Quality
- ✅ Eliminación de duplicación (fetching logic)
- ✅ Separación de responsabilidades
- ✅ Código más declarativo y menos imperativo
- ✅ Type safety mejorado

### Developer Experience
- ✅ Menos boilerplate en componentes
- ✅ Loading/error states consistentes
- ✅ Recarga automática después de mutaciones
- ✅ API uniforme para todas las entidades

### Performance
- ✅ Caché automático (si implementamos SWR/React Query)
- ✅ Optimistic updates preparados
- ✅ Menos re-renders innecesarios

### Maintainability
- ✅ Cambios centralizados en hooks
- ✅ Testing más fácil
- ✅ Migración gradual (flags de feature)

---

## Próximos Pasos

1. **Continuar refactorización de componentes** en orden de prioridad
2. **Testing de componentes refactorizados**
3. **Agregar optimistic updates** a los hooks
4. **Implementar caché** (considerar SWR o React Query)
5. **Remover archivos legacy** una vez completada la migración
6. **Actualizar documentación** de componentes

---

## Notas Técnicas

### Type Compatibility
Los tipos de Supabase (`database.types.ts`) usan `string` para campos enum. Necesitamos:
```typescript
// Type assertion pattern
TABLE_STATE_LABELS[status as keyof typeof TABLE_STATE_LABELS]
```

### Database Field Mapping
| Mock Data | Supabase DB |
|-----------|-------------|
| `table.seats` | `table.capacity` |
| `zone.tables` | Computed via JOIN |

### Hook Return Pattern
Todos los hooks siguen este patrón consistente:
```typescript
{
  data: T | T[],
  loading: boolean,
  error: Error | null,
  // Mutations
  create?: (...) => Promise<void>,
  update?: (...) => Promise<void>,
  delete?: (...) => Promise<void>,
  // Specific actions
  ...
}
```

---

## Checklist de Validación

Antes de marcar un componente como completado:

- [ ] Remover todos los imports de `lib/mock-data.ts`
- [ ] Remover todos los imports de `lib/server/*-store.ts`
- [ ] Reemplazar state local por hooks
- [ ] Eliminar funciones de fetching manual
- [ ] Usar mutaciones de hooks en lugar de servicios directos
- [ ] Verificar tipos de Supabase
- [ ] Ejecutar `npm run type-check` sin errores
- [ ] Testing manual del componente
- [ ] Verificar auto-refresh después de mutaciones

---

**Estado Actual:** 1 de 9 componentes refactorizados (11%)

**Próximo Componente:** `orders-panel.tsx` o componente más simple como `add-table-dialog.tsx`
