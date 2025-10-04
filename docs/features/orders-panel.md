# Panel de pedidos (/pedidos)

## Objetivo
Ofrecer al staff y administradores una vista centralizada para controlar pedidos en curso, su estado operativo y la situacion de cobro sin abandonar la consola. El panel convive con el formulario manual de altas, accesible como segunda pestana.

## Layout
- Tabs `Panel` (por defecto) y `Nuevo pedido`. En >=768px los filtros quedan a la izquierda y las listas agrupadas a la derecha.
- Resumen con metricas: pedidos supervisados, pendientes de cobro, pedido mas reciente y total de cerrados.
- Filtros: busqueda por mesa/cliente/item, toggles por estado (`abierto`, `preparando`, `listo`, `entregado`, `cerrado`) y selector de estado de pago (`pendiente`, `pagado`, `cancelado`).
- Listas agrupadas por estado con scroll interno (max 480px), badges reutilizando variantes centralizadas, totales, items destacados, hora relativa, nota del cliente y badge de pago.
- Boton "Actualizar" con `aria-label` que dispara refetch silencioso y badge de error con CTA "Reintentar".

## Datos y contratos
- **GET `/api/order`** (App Router):
  - Query params soportados: `status` (repetible), `paymentStatus`, `tableId`, `search`, `limit`, `sort` (`newest|oldest`).
  - Respuesta `{ data: SerializedOrder[], metadata: { store, summary } }` donde `summary` incluye totales por estado/pago, `oldestOrderAt`, `latestOrderAt` y `pendingPayment`.
  - Peticiones con `cache: "no-store"`; errores `400 INVALID_QUERY` (parametros invalidos) y `500 INTERNAL_ERROR` (fallo general).
- Servicios internos: `listOrders`, `getOrdersSummary` en `lib/server/order-store.ts` filtran y ordenan pedidos, devolviendo clones inmutables.
- Cliente: `fetchOrders` (`lib/order-service.ts`) arma query params, normaliza fechas a `Date`, expone labels (`ORDER_STATUS_LABELS`, `PAYMENT_STATUS_LABELS`) y variantes de badge (`ORDER_STATUS_BADGE_VARIANT`, `PAYMENT_STATUS_BADGE_VARIANT`). Caidas retornan `MOCK_ORDERS` con warning `[order-service]`.

## Hook `useOrdersPanel`
- Ubicado en `app/pedidos/_hooks/use-orders-panel.ts`.
- Gestiona `orders`, `summary`, `lastUpdated`, flags (`isLoading`, `isRefreshing`, `error`) y filtros (`statusFilters`, `paymentFilter`, `search`).
- Debounce de busqueda (300 ms), polling cada 30 s y escucha los eventos order.created, order.updated y order.summary.updated vía useSocket para sincronizar sin refetch completo.
- `refetch(options?: { silent?: boolean })` permite refrescos manuales o forzados (retry usa `silent: false`). Cancela fetches previos con `AbortController` y limpia timers al desmontar.

## Accesibilidad
- Controles etiquetados con `Label` y `aria-live="polite"` en timestamp/contadores.
- Tarjetas enfocables (`tabIndex=0` + `focus-visible:ring`) con descripciones legibles.
- Botones `Actualizar` y `Reintentar` con `aria-label` y estados deshabilitados.
- Empty state y errores descriptivos via `Alert`.

## Pruebas manuales sugeridas
1. Cambiar filtros de estado/pago y verificar actualizacion en listas y metricas.
2. Probar busqueda por mesa o nombre de item.
3. Pulsar "Actualizar" y confirmar animacion en icono (sin bloquear lista).
4. Forzar error (offline) para comprobar alerta y CTA "Reintentar".
5. Reducir viewport a 768 px para validar layout en columna.
6. Emitir `order.updated` desde `MockSocketClient` y confirmar refetch silencioso.

## Dependencias y proximos pasos
- Depende de `feature/lib-socket-events` para eventos reales (payload extendido con totales/mesa).
- Integrar `POST /api/order` con el panel (refetch post-creacion) en proximas iteraciones.
- Milestone websockets en vivo permanecera en la feature `feature/lib-socket-events`.
