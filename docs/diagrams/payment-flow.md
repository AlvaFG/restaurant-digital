# Payment Flow Diagrams

## 1. User Journey - Happy Path

```
┌─────────────────────────────────────────────────────────────────────┐
│                         PAYMENT FLOW                                 │
└─────────────────────────────────────────────────────────────────────┘

┌─────────────┐
│   Cliente   │
│   en Mesa   │
└──────┬──────┘
       │
       │ 1. Solicita cuenta al mozo
       │
       ▼
┌─────────────┐
│    Mozo     │
│   accede    │
│   Pedidos   │
└──────┬──────┘
       │
       │ 2. Click "Pagar" en pedido
       │
       ▼
┌─────────────┐
│  Modal de   │
│    Pago     │
│  (Summary)  │
└──────┬──────┘
       │
       │ 3. Revisa monto y confirma
       │
       ▼
┌─────────────┐
│  Checkout   │
│  MercadoPago│
│   (Popup)   │
└──────┬──────┘
       │
       │ 4. Cliente completa pago
       │    (Ingresa datos de tarjeta)
       │
       ▼
┌─────────────┐
│  MercadoPago│
│   procesa   │
│    pago     │
└──────┬──────┘
       │
       │ 5. Envía webhook a servidor
       │
       ▼
┌─────────────┐
│   Webhook   │
│   Handler   │
│  actualiza  │
│     DB      │
└──────┬──────┘
       │
       │ 6. Emite evento WebSocket
       │
       ▼
┌─────────────┐
│     UI      │
│  actualiza  │
│ automática- │
│    mente    │
└──────┬──────┘
       │
       │ 7. Muestra confirmación
       │
       ▼
┌─────────────┐
│   Success   │
│    Page     │
│  "¡Pagado!" │
└─────────────┘
```

---

## 2. Technical Flow - Component Interaction

```
┌────────────┐          ┌────────────┐          ┌────────────┐
│            │          │            │          │            │
│  Frontend  │          │  Backend   │          │ MercadoPago│
│            │          │            │          │            │
└─────┬──────┘          └─────┬──────┘          └─────┬──────┘
      │                       │                       │
      │  POST /api/payment    │                       │
      ├──────────────────────>│                       │
      │  {orderId, amount}    │                       │
      │                       │                       │
      │                       │ Validate order exists │
      │                       ├───────────────────┐   │
      │                       │                   │   │
      │                       │<──────────────────┘   │
      │                       │                       │
      │                       │  Create Preference    │
      │                       ├──────────────────────>│
      │                       │  {amount, items,      │
      │                       │   backUrls, etc}      │
      │                       │                       │
      │                       │   Preference ID       │
      │                       │   + init_point URL    │
      │                       │<──────────────────────┤
      │                       │                       │
      │                       │ Save payment in DB    │
      │                       ├───────────────────┐   │
      │                       │                   │   │
      │                       │<──────────────────┘   │
      │                       │                       │
      │  Payment + checkoutUrl│                       │
      │<──────────────────────┤                       │
      │                       │                       │
      │  window.open(url)     │                       │
      ├───────────────────────┼──────────────────────>│
      │                       │                       │
      │                       │              Customer │
      │                       │              completes│
      │                       │              checkout │
      │                       │                       │
      │                       │  Webhook Notification │
      │                       │<──────────────────────┤
      │                       │  POST /webhook/mp     │
      │                       │  {type: payment,      │
      │                       │   data: {id: xxx}}    │
      │                       │                       │
      │                       │  Fetch payment status │
      │                       ├──────────────────────>│
      │                       │  GET /payments/:id    │
      │                       │                       │
      │                       │   Payment details     │
      │                       │<──────────────────────┤
      │                       │   {status: approved}  │
      │                       │                       │
      │                       │ Update payment in DB  │
      │                       ├───────────────────┐   │
      │                       │  status = approved│   │
      │                       │<──────────────────┘   │
      │                       │                       │
      │                       │ Emit WebSocket event  │
      │                       ├───────────────────┐   │
      │                       │ payment:updated   │   │
      │                       │<──────────────────┘   │
      │                       │                       │
      │  payment:updated      │                       │
      │<──────────────────────┤                       │
      │  {payment: {...}}     │                       │
      │                       │                       │
      │  Update UI (React)    │                       │
      ├───────────────────┐   │                       │
      │  Show success msg │   │                       │
      │  Disable pay btn  │   │                       │
      │<──────────────────┘   │                       │
      │                       │                       │
      ▼                       ▼                       ▼
```

---

## 3. State Machine - Payment Status

```
┌─────────────────────────────────────────────────────────────┐
│                    PAYMENT STATUS FLOW                       │
└─────────────────────────────────────────────────────────────┘

                    ┌────────────┐
                    │  PENDING   │ ◄──── Initial state
                    └─────┬──────┘
                          │
              ┌───────────┴───────────┐
              │                       │
              ▼                       ▼
    ┌────────────────┐       ┌────────────────┐
    │  IN_PROCESS    │       │   REJECTED     │ ◄── Card declined
    │  (Processing)  │       │   (Terminal)   │     Insufficient funds
    └────────┬───────┘       └────────────────┘     Invalid CVV
             │
     ┌───────┴────────┐
     │                │
     ▼                ▼
┌──────────┐    ┌────────────┐
│ APPROVED │    │  REJECTED  │
│(Terminal)│    │ (Terminal) │
└────┬─────┘    └────────────┘
     │
     │ User/Admin action
     │
     ▼
┌──────────┐
│CANCELLED │
│(Terminal)│
└────┬─────┘
     │
     │ Refund process
     │
     ▼
┌──────────┐
│ REFUNDED │
│(Terminal)│
└──────────┘


Legend:
- Terminal states: No further transitions
- Active states: Can transition to other states
```

---

## 4. Component Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                      FRONTEND COMPONENTS                         │
└─────────────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────┐
│                     OrdersPanel                          │
│  ┌────────────────────────────────────────────────────┐  │
│  │  Order Card #1                                     │  │
│  │  ┌──────────────────────────────────────────────┐  │  │
│  │  │  Mesa 5 - Pedido #123                       │  │  │
│  │  │  Total: $1,500.00                           │  │  │
│  │  │  [Pagar] ◄──── Triggers PaymentModal        │  │  │
│  │  └──────────────────────────────────────────────┘  │  │
│  └────────────────────────────────────────────────────┘  │
└──────────────────────────────────────────────────────────┘
                        │
                        │ onClick
                        ▼
┌──────────────────────────────────────────────────────────┐
│                     PaymentModal                         │
│  ┌────────────────────────────────────────────────────┐  │
│  │  Pagar Pedido - Mesa 5                            │  │
│  │  ─────────────────────────────────────────────    │  │
│  │  Resumen del pedido:                              │  │
│  │    2x Hamburguesa.......$800.00                   │  │
│  │    1x Coca-Cola..........$200.00                  │  │
│  │  ─────────────────────────────────────────────    │  │
│  │  Total: $1,500.00                                 │  │
│  │                                                    │  │
│  │  ┌──────────────────────────────────────────────┐ │  │
│  │  │    CheckoutButton                            │ │  │
│  │  │  [💳 Pagar $1,500.00] ◄── Opens Checkout Pro │ │  │
│  │  └──────────────────────────────────────────────┘ │  │
│  │                                                    │  │
│  │  Status Badge: [Pendiente] ◄── Updates via WS    │  │
│  │  ID de transacción: mp-12345678                   │  │
│  └────────────────────────────────────────────────────┘  │
└──────────────────────────────────────────────────────────┘
                        │
                        │ usePayment hook
                        ▼
┌──────────────────────────────────────────────────────────┐
│                   usePayment Hook                        │
│  ┌────────────────────────────────────────────────────┐  │
│  │  - createPayment(orderId, amount)                 │  │
│  │  - getPaymentStatus(paymentId)                    │  │
│  │  - payment state                                  │  │
│  │  - isLoading state                                │  │
│  │  - error state                                    │  │
│  │  - WebSocket listener (payment:updated)          │  │
│  └────────────────────────────────────────────────────┘  │
└──────────────────────────────────────────────────────────┘
                        │
                        │ fetch API
                        ▼
                 [Backend APIs]
```

---

## 5. Sequence Diagram - Error Handling

```
User         Frontend      Backend       MercadoPago
 │               │             │              │
 │  Click Pay    │             │              │
 ├──────────────>│             │              │
 │               │ POST /api   │              │
 │               ├────────────>│              │
 │               │  /payment   │              │
 │               │             │              │
 │               │             │ Create Pref  │
 │               │             ├─────────────>│
 │               │             │              │
 │               │             │ ❌ Error 500 │
 │               │             │<─────────────┤
 │               │             │ (API Down)   │
 │               │             │              │
 │               │  ❌ 500     │              │
 │               │<────────────┤              │
 │               │  Error msg  │              │
 │               │             │              │
 │  Toast Error  │             │              │
 │<──────────────┤             │              │
 │ "Error al     │             │              │
 │  crear pago"  │             │              │
 │               │             │              │
 │  Retry button │             │              │
 │  available    │             │              │
 │               │             │              │
 ▼               ▼             ▼              ▼
```

---

## 6. Data Flow - WebSocket Real-time Updates

```
┌────────────┐       ┌────────────┐       ┌────────────┐
│  Browser   │       │   Server   │       │  Browser   │
│  Tab #1    │       │  WebSocket │       │  Tab #2    │
│            │       │    Bus     │       │            │
└─────┬──────┘       └─────┬──────┘       └─────┬──────┘
      │                    │                    │
      │ Create payment     │                    │
      ├───────────────────>│                    │
      │                    │                    │
      │                    │ Webhook updates    │
      │                    │ payment status     │
      │                    ├──────────┐         │
      │                    │          │         │
      │                    │<─────────┘         │
      │                    │                    │
      │                    │ Emit event to ALL  │
      │                    │ connected clients  │
      │                    │                    │
      │ payment:updated    │  payment:updated   │
      │<───────────────────┼───────────────────>│
      │                    │                    │
      │ Update UI          │          Update UI │
      ├──────────┐         │         ┌──────────┤
      │  [Pago   │         │         │  [Pago   │
      │ Aprobado]│         │         │ Aprobado]│
      │<─────────┘         │         └─────────>│
      │                    │                    │
      ▼                    ▼                    ▼

Both tabs show same state in real-time!
```

---

## 7. Deployment Architecture

```
┌──────────────────────────────────────────────────────────────┐
│                         PRODUCTION                           │
└──────────────────────────────────────────────────────────────┘

                    Internet
                       │
                       ▼
            ┌──────────────────┐
            │   Load Balancer  │
            │   (Nginx/HAProxy)│
            └────────┬─────────┘
                     │
         ┌───────────┼───────────┐
         │           │           │
         ▼           ▼           ▼
    ┌────────┐  ┌────────┐  ┌────────┐
    │ Next.js│  │ Next.js│  │ Next.js│
    │ Server │  │ Server │  │ Server │
    │  #1    │  │  #2    │  │  #3    │
    └───┬────┘  └───┬────┘  └───┬────┘
        │           │           │
        └───────────┼───────────┘
                    │
        ┌───────────┴───────────┐
        │                       │
        ▼                       ▼
┌──────────────┐        ┌──────────────┐
│ Redis Cache  │        │  PostgreSQL  │
│ (Sessions)   │        │  (Future)    │
└──────────────┘        └──────────────┘
        │                       │
        └───────────┬───────────┘
                    │
                    ▼
            ┌──────────────┐
            │  File System │
            │  JSON Stores │
            │  (Current)   │
            └──────────────┘

External Services:
    │
    ├─> MercadoPago API (payments)
    └─> Monitoring/Logs (DataDog/Sentry)
```

---

## 8. Security Flow

```
┌────────────────────────────────────────────────────────────┐
│              WEBHOOK SECURITY VALIDATION                    │
└────────────────────────────────────────────────────────────┘

MercadoPago                Server
     │                        │
     │  POST /webhook         │
     ├───────────────────────>│
     │  Headers:              │
     │   x-signature:         │
     │   x-request-id:        │
     │                        │
     │                        │ 1. Extract signature
     │                        ├─────────────────┐
     │                        │                 │
     │                        │<────────────────┘
     │                        │
     │                        │ 2. Calculate HMAC
     │                        │    with secret key
     │                        ├─────────────────┐
     │                        │                 │
     │                        │<────────────────┘
     │                        │
     │                        │ 3. Compare
     │                        │    signatures
     │                        ├─────────────────┐
     │                        │  Match? ✓       │
     │                        │<────────────────┘
     │                        │
     │                        │ 4. Process webhook
     │                        ├─────────────────┐
     │                        │  Update payment │
     │                        │<────────────────┘
     │                        │
     │        200 OK          │
     │<───────────────────────┤
     │                        │
     ▼                        ▼

If signature doesn't match:
- Log security warning
- Return 401 Unauthorized
- Don't process webhook
```

---

## Notes

- All diagrams use UTF-8 box drawing characters
- Diagrams optimized for monospace font viewing
- Copy diagrams to markdown viewers for best results
- Update diagrams when flow changes

## Tools Used

- ASCII art for diagrams
- Mermaid.js compatible (for future migration)
- Markdown-friendly formatting

## Related Documentation

- [Payment API Documentation](../api/payments.md)
- [WebSocket Events](../../lib/socket-events.ts)
- [MercadoPago Integration](../../lib/server/providers/mercadopago-provider.ts)
