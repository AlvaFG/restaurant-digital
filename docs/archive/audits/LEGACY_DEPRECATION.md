# Legacy Files - Deprecation Notice

**⚠️ ESTOS ARCHIVOS ESTÁN DEPRECADOS Y SERÁN ELIMINADOS**

Los siguientes archivos han sido reemplazados por servicios modernos que usan Supabase como única fuente de datos:

## Stores Deprecados

### `lib/server/order-store.ts`
- **Reemplazado por:** `lib/services/orders-service.ts`
- **Motivo:** Usa archivos JSON locales en vez de Supabase
- **Estado:** Deprecado - No usar en nuevo código

### `lib/server/menu-store.ts`
- **Reemplazado por:** `lib/services/menu-service.ts`
- **Motivo:** Usa archivos JSON locales y mock-data
- **Estado:** Deprecado - No usar en nuevo código

### `lib/server/table-store.ts`
- **Reemplazado por:** `lib/services/tables-service.ts`
- **Motivo:** Usa archivos JSON locales y mock-data
- **Estado:** Deprecado - No usar en nuevo código

### `lib/server/zones-store.ts`
- **Reemplazado por:** `lib/services/zones-service.ts`
- **Motivo:** Usa lógica local en vez de Supabase
- **Estado:** Deprecado - No usar en nuevo código

### `lib/server/payment-store.ts`
- **Reemplazado por:** `lib/services/payments-service.ts`
- **Motivo:** Usa lógica local en vez de Supabase
- **Estado:** Deprecado - No usar en nuevo código

## Archivos JSON Deprecados

### `data/order-store.json`
- **Reemplazado por:** Tabla `orders` en Supabase
- **Estado:** Deprecado - Será eliminado

### `data/menu-store.json`
- **Reemplazado por:** Tablas `menu_categories` y `menu_items` en Supabase
- **Estado:** Deprecado - Será eliminado

### `data/table-store.json`
- **Reemplazado por:** Tabla `tables` en Supabase
- **Estado:** Deprecado - Será eliminado

## Mock Data Deprecado

### `lib/mock-data.ts`
- **Reemplazado por:** Datos reales en Supabase
- **Motivo:** Mock data debe usarse solo en tests
- **Estado:** Deprecado - Refactorizar importaciones

## Migración

Para migrar de los stores legacy a los nuevos servicios:

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

## Próximos Pasos

1. ✅ Crear nuevos servicios en `lib/services/`
2. ⏳ Refactorizar componentes para usar nuevos servicios
3. ⏳ Eliminar imports de stores legacy
4. ⏳ Eliminar archivos deprecados
5. ⏳ Actualizar tests

## Flags de Migración

Los siguientes flags en `.env.local` deben estar en `true`:

```bash
NEXT_PUBLIC_USE_SUPABASE_MENU=true
NEXT_PUBLIC_USE_SUPABASE_ORDERS=true
NEXT_PUBLIC_USE_SUPABASE_PAYMENTS=true
NEXT_PUBLIC_USE_SUPABASE_TABLES=true
NEXT_PUBLIC_USE_SUPABASE_AUTH=true
```
