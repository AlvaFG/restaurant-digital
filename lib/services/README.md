# Services - Supabase Integration

Esta carpeta contiene todos los servicios que interactúan con Supabase como única fuente de datos.

## Estructura

```
lib/services/
├── orders-service.ts      # Gestión de órdenes
├── menu-service.ts        # Gestión de menú (categorías e items)
├── tables-service.ts      # Gestión de mesas
├── zones-service.ts       # Gestión de zonas
├── payments-service.ts    # Gestión de pagos
└── index.ts              # Exportaciones centralizadas
```

## Uso

### Importación

```typescript
import { 
  createOrder, 
  getOrders, 
  updateOrderStatus 
} from '@/lib/services'
```

### Ejemplo: Crear una orden

```typescript
import { createOrder } from '@/lib/services'
import { useAuth } from '@/contexts/auth-context'

function MyComponent() {
  const { tenant } = useAuth()

  const handleCreateOrder = async () => {
    const { data, error } = await createOrder({
      tableId: 'table-123',
      items: [
        {
          menuItemId: 'item-456',
          quantity: 2,
          notes: 'Sin cebolla'
        }
      ],
      notes: 'Pedido urgente'
    }, tenant.id)

    if (error) {
      console.error('Error:', error)
      return
    }

    console.log('Orden creada:', data)
  }

  return <button onClick={handleCreateOrder}>Crear Orden</button>
}
```

### Ejemplo: Obtener menú completo

```typescript
import { getFullMenu } from '@/lib/services'
import { useAuth } from '@/contexts/auth-context'
import { useEffect, useState } from 'react'

function MenuComponent() {
  const { tenant } = useAuth()
  const [menu, setMenu] = useState(null)

  useEffect(() => {
    const loadMenu = async () => {
      const { data, error } = await getFullMenu(tenant.id)
      if (!error) {
        setMenu(data)
      }
    }
    loadMenu()
  }, [tenant.id])

  return <div>{/* Renderizar menú */}</div>
}
```

## Características

### ✅ Ventajas

- **Única fuente de verdad:** Todos los datos vienen de Supabase
- **Tipado completo:** TypeScript con tipos generados de Supabase
- **Logging:** Todos los servicios incluyen logging para debugging
- **Manejo de errores:** Retornan `{ data, error }` para manejo consistente
- **Multi-tenant:** Todos los servicios requieren `tenantId` para seguridad

### 🔒 Seguridad

- Todos los servicios validan el `tenantId`
- Las políticas RLS de Supabase se aplican automáticamente
- No hay acceso directo a datos de otros tenants

### 📊 Logging

Todos los servicios incluyen logging automático:

```typescript
logger.info('Orden creada', { orderId: data.id, orderNumber })
logger.error('Error al crear orden', error as Error)
```

## Migración desde stores legacy

Si estás migrando código que usaba los stores legacy:

### Antes (Legacy)

```typescript
import { createOrder } from '@/lib/server/order-store'

const order = await createOrder(payload)
```

### Después (Nuevo)

```typescript
import { createOrder } from '@/lib/services'
import { useAuth } from '@/contexts/auth-context'

const { tenant } = useAuth()
const { data: order, error } = await createOrder(input, tenant.id)
```

## API Reference

### Orders Service

- `createOrder(input, tenantId)` - Crea una nueva orden
- `getOrders(tenantId, filters?)` - Obtiene órdenes con filtros
- `getOrderById(orderId, tenantId)` - Obtiene una orden específica
- `updateOrderStatus(orderId, status, tenantId)` - Actualiza estado de orden
- `updateOrderPaymentStatus(orderId, paymentStatus, tenantId)` - Actualiza estado de pago
- `cancelOrder(orderId, tenantId)` - Cancela una orden
- `getOrdersSummary(tenantId, filters?)` - Obtiene estadísticas de órdenes

### Menu Service

- `getMenuCategories(tenantId)` - Obtiene categorías
- `getMenuItems(tenantId, filters?)` - Obtiene items del menú
- `getMenuItemById(itemId, tenantId)` - Obtiene un item específico
- `createMenuItem(input, tenantId)` - Crea un nuevo item
- `updateMenuItem(itemId, updates, tenantId)` - Actualiza un item
- `deleteMenuItem(itemId, tenantId)` - Elimina un item
- `createMenuCategory(input, tenantId)` - Crea una categoría
- `updateMenuCategory(categoryId, updates, tenantId)` - Actualiza una categoría
- `getFullMenu(tenantId)` - Obtiene el menú completo con categorías e items

### Tables Service

- `getTables(tenantId, filters?)` - Obtiene mesas
- `getTableById(tableId, tenantId)` - Obtiene una mesa específica
- `createTable(input, tenantId)` - Crea una nueva mesa
- `updateTable(tableId, updates, tenantId)` - Actualiza una mesa
- `updateTableStatus(tableId, status, tenantId)` - Actualiza estado de mesa
- `deleteTable(tableId, tenantId)` - Elimina una mesa
- `getTablesByZone(zoneId, tenantId)` - Obtiene mesas de una zona
- `getTablesStats(tenantId)` - Obtiene estadísticas de mesas

### Zones Service

- `getZones(tenantId, includeInactive?)` - Obtiene zonas
- `getZoneById(zoneId, tenantId)` - Obtiene una zona específica
- `createZone(input, tenantId)` - Crea una nueva zona
- `updateZone(zoneId, updates, tenantId)` - Actualiza una zona
- `deleteZone(zoneId, tenantId)` - Desactiva una zona (soft delete)
- `hardDeleteZone(zoneId, tenantId)` - Elimina permanentemente una zona
- `getZonesWithStats(tenantId)` - Obtiene zonas con estadísticas de mesas

### Payments Service

- `createPayment(input, tenantId)` - Crea un nuevo pago
- `getPayments(tenantId, filters?)` - Obtiene pagos
- `getPaymentById(paymentId, tenantId)` - Obtiene un pago específico
- `getPaymentByExternalId(externalId, tenantId)` - Obtiene pago por ID externo
- `updatePaymentStatus(paymentId, status, tenantId, updates?)` - Actualiza estado de pago
- `updatePayment(paymentId, updates, tenantId)` - Actualiza un pago
- `getPaymentsStats(tenantId, filters?)` - Obtiene estadísticas de pagos

## Soporte

Para más información, ver:
- [docs/LEGACY_DEPRECATION.md](../../docs/LEGACY_DEPRECATION.md)
- [Supabase Database Types](../supabase/database.types.ts)
