# Mobile QR Menu Flow

## Overview
- Public route `/qr/{tableId}` lets diners open the digital menu after scanning the table QR.
- Screen is mobile-first, single column, keeps 48px+ tap targets, supports dark mode and large text.
- Data comes from `/api/tables/{id}` (table metadata) and `/api/menu` (catalog + headers).
- Cart state persists in `localStorage` per table so a refresh does not wipe the draft order.
- CTA `Enviar pedido` posts to `/api/menu/orders` and shows the mock confirmation with the generated order id.

## Route & Layout
- Files live under `app/(public)/qr` with a dedicated layout to avoid auth redirects.
- `QrMenuHeader` shows branding, table number/zone and menu version info (headers + metadata timestamps).
- Category navigation uses horizontal pills (defaults to all) and keeps focus styles for accessibility.
- Floating cart (`QrCartSheet`) sticks to the bottom, expands as a drawer, and blocks submission when items are unavailable.

## Data Loading
- `useQrTable(tableId)` fetches `/api/tables/{id}` with no-store cache, handles not-found, network errors, and refetch states.
- `useMenuCatalog()` is reused from the tablet view; headers `x-menu-version` and `x-menu-updated-at` surface in the UI.
- Skeletons cover initial load; errors show retry CTA; offline errors are surfaced via toast.

## API Contracts

### GET `/api/menu`
- **Headers**: `x-menu-version` (string), `x-menu-updated-at` (ISO timestamp).
- **Response 200**:
  ```json
  {
    "data": {
      "categories": [
        { "id": "drinks", "name": "Bebidas", "sort": 1, "description": "" }
      ],
      "items": [
        {
          "id": "item-1",
          "categoryId": "drinks",
          "name": "Limonada",
          "description": "Con menta y jengibre",
          "priceCents": 1200,
          "available": true,
          "allergens": [ { "code": "gluten", "contains": false, "traces": true } ]
        }
      ],
      "allergens": [
        { "code": "gluten", "name": "Gluten", "description": "Presencia o trazas de gluten" }
      ],
      "metadata": { "currency": "ARS", "version": 3, "updatedAt": "2025-09-25T23:41:12.000Z" }
    }
  }
  ```
- **Errors**: `500` returns `{ "error": "No se pudo obtener el catalogo" }` (message may vary).

### GET `/api/tables/{id}`
- **Response 200**:
  ```json
  {
    "data": {
      "id": "1",
      "number": 1,
      "zone": "Salon Principal",
      "status": "libre",
      "seats": 4,
      "covers": { "current": 0, "total": 0, "sessions": 0 },
      "qrcodeUrl": "https://restaurant360.local/qr/1"
    },
    "metadata": { "version": 12, "updatedAt": "2025-09-26T00:13:01.565Z" },
    "history": []
  }
  ```
- **404**: `{ "error": "Mesa no encontrada" }`.
- **500**: `{ "error": "No se pudo obtener la mesa" }`.

### POST `/api/menu/orders`
- **Request** (`application/json`):
  ```json
  {
    "tableId": "1",
    "items": [
      { "menuItemId": "item-1", "quantity": 2 }
    ]
  }
  ```
- **Response 201**:
  ```json
  {
    "data": {
      "id": "order-1695758982000",
      "tableId": "1",
      "items": [
        { "id": "item-1", "name": "Limonada", "quantity": 2, "price": 1200 }
      ],
      "subtotal": 2400,
      "total": 2400,
      "status": "abierto",
      "paymentStatus": "pendiente",
      "createdAt": "2025-09-26T00:22:30.000Z"
    }
  }
  ```
  - Includes menu headers `x-menu-version` / `x-menu-updated-at` in the response.
- **400**: validation errors (missing tableId, empty items, quantity < 1).
- **404**: `{ "error": "Menu item not found: item-x" }` when payload references an unknown dish.
- **500**: `{ "error": "No se pudo crear la orden" }` for unexpected issues.

## Error & Offline UX
- Missing table => full-screen message with CTA to rescan or retry.
- Network failures show toast (`Sin conexion`) and keep draft cart.
- Unavailable items stay in cart but block submission until removed or updated.

## Performance & Testing Notes
- Designed to meet LCP < 2s on simulated fast 3G with a warm cache; run Lighthouse mobile audit before shipping and record results here (pending run for this session).
- Manual test script: `/qr/1` on iPhone 12 viewport (skeleton -> load -> add -> send order -> confirmation), `/qr/mesa-invalida`, offline mode toggle.

## Follow-ups
- Add analytics events once socket layer for customer orders is available.
- Extend localization (ES/EN) for mobile microcopy and toasts.
- Evaluate saving the cart server-side when multi-device sync is required.
