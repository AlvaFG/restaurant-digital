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
- Formulario `OrderForm` usa `createOrder` (`lib/order-service.ts`) para llamar a **POST `/api/order`**. Valida respuestas 201, propaga errores 4xx con el mensaje del backend y muestra un mensaje generico ante 5xx. Tras un alta exitosa se confia en los eventos de socket; si `NEXT_PUBLIC_DISABLE_SOCKET === "1"`, se fuerza `refetch({ silent: false })` para mantener el estado consistente.

## Hook `useOrdersPanel`
- Ubicado en `app/pedidos/_hooks/use-orders-panel.ts`.
- Gestiona `orders`, `summary`, `lastUpdated`, flags (`isLoading`, `isRefreshing`, `error`) y filtros (`statusFilters`, `paymentFilter`, `search`).
- Debounce de busqueda (300 ms), polling cada 30 s y escucha los eventos order.created, order.updated y order.summary.updated via `useSocket` para sincronizar sin refetch completo.
- `refetch(options?: { silent?: boolean })` permite refrescos manuales o forzados (retry usa `silent: false`). Cancela fetches previos con `AbortController` y limpia timers al desmontar.

## Accesibilidad
- Controles etiquetados con `Label` y `aria-live="polite"` en timestamp/contadores.
- Tarjetas enfocables (`tabIndex=0` + `focus-visible:ring`) con descripciones legibles.
- Botones `Actualizar` y `Reintentar` con `aria-label` y estados deshabilitados.
- Empty state y errores descriptivos via `Alert`.

## Pruebas manuales sugeridas
> Nota QA: El endpoint GET/POST `/api/order` esta cubierto por la suite `app/api/__tests__/orders-api.test.ts`; ejecuta `npm test` antes de QA manual.
1. Cambiar filtros de estado/pago y verificar actualizacion en listas y metricas.
2. Probar busqueda por mesa o nombre de item.
3. Pulsar "Actualizar" y confirmar animacion en icono (sin bloquear lista).
4. Forzar error (offline) para comprobar alerta y CTA "Reintentar".
5. Reducir viewport a 768 px para validar layout en columna.
6. Crear un pedido manual y verificar toast de exito; el nuevo pedido debe aparecer en el panel (con sockets deshabilitados usar `NEXT_PUBLIC_DISABLE_SOCKET=1` para validar el refetch de respaldo).
7. Emitir `order.updated` desde `MockSocketClient` y confirmar refetch silencioso.

## Dependencias y proximos pasos
- Milestone websockets en vivo permanecera en la feature `feature/lib-socket-events`.
