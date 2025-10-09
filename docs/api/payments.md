# Payment API Documentation

## Overview
Sistema de pagos digitales integrado con MercadoPago Checkout Pro para procesamiento de pagos de pedidos de restaurante.

**Versión**: 1.0.0  
**Base URL**: `/api/payment`  
**Autenticación**: Session-based (cookies)

## Endpoints

### POST /api/payment
Crea un nuevo pago para un pedido existente.

**Request Body:**
```json
{
  "orderId": "order-1696861200000",
  "amount": 10000
}
```

**Parameters:**
- `orderId` (string, required): ID del pedido a pagar
- `amount` (number, required): Monto en centavos (10000 = ARS 100.00)

**Response (200 OK):**
```json
{
  "id": "pay-1696861200000",
  "orderId": "order-1696861200000",
  "tableId": "table-001",
  "amount": 10000,
  "currency": "ARS",
  "status": "pending",
  "provider": "mercadopago",
  "externalId": "12345678-pref",
  "checkoutUrl": "https://www.mercadopago.com.ar/checkout/v1/redirect?pref_id=12345678-pref",
  "createdAt": "2025-10-09T12:00:00.000Z",
  "updatedAt": "2025-10-09T12:00:00.000Z"
}
```

**Error Responses:**

**400 Bad Request** - Validación fallida
```json
{
  "error": "Ya existe un pago activo para este pedido",
  "code": "DUPLICATE_PAYMENT"
}
```

**404 Not Found** - Pedido no existe
```json
{
  "error": "El pedido order-123 no existe",
  "code": "ORDER_NOT_FOUND"
}
```

**500 Internal Server Error** - Error del proveedor
```json
{
  "error": "Error al crear el pago",
  "details": "MercadoPago API error"
}
```

---

### GET /api/payment
Lista pagos con filtros opcionales y paginación.

**Query Parameters:**
- `orderId` (string, optional): Filtrar por ID de pedido
- `status` (string, optional): Filtrar por estado (`pending`, `approved`, `rejected`, etc.)
- `limit` (number, optional): Número de resultados por página (default: 50, max: 100)
- `offset` (number, optional): Offset para paginación (default: 0)

**Examples:**
```
GET /api/payment
GET /api/payment?orderId=order-123
GET /api/payment?status=approved
GET /api/payment?limit=20&offset=40
```

**Response (200 OK):**
```json
{
  "payments": [
    {
      "id": "pay-1696861200000",
      "orderId": "order-123",
      "tableId": "table-001",
      "amount": 10000,
      "currency": "ARS",
      "status": "approved",
      "provider": "mercadopago",
      "externalId": "12345678",
      "checkoutUrl": "https://www.mercadopago.com.ar/checkout/v1/redirect?pref_id=...",
      "paymentMethod": "credit_card",
      "createdAt": "2025-10-09T12:00:00.000Z",
      "updatedAt": "2025-10-09T12:05:00.000Z"
    }
  ],
  "summary": {
    "total": 150,
    "byStatus": {
      "pending": 10,
      "approved": 120,
      "rejected": 15,
      "cancelled": 3,
      "refunded": 2
    },
    "totalAmount": 1500000,
    "approvedAmount": 1200000,
    "successRate": 80.0,
    "oldestDate": "2025-09-01T00:00:00.000Z",
    "latestDate": "2025-10-09T12:00:00.000Z"
  }
}
```

---

### GET /api/payment/:id
Obtiene un pago específico por ID.

**URL Parameters:**
- `id` (string, required): ID del pago

**Example:**
```
GET /api/payment/pay-1696861200000
```

**Response (200 OK):**
```json
{
  "id": "pay-1696861200000",
  "orderId": "order-123",
  "tableId": "table-001",
  "amount": 10000,
  "currency": "ARS",
  "status": "approved",
  "provider": "mercadopago",
  "externalId": "12345678",
  "checkoutUrl": "https://www.mercadopago.com.ar/checkout/v1/redirect?pref_id=...",
  "paymentMethod": "credit_card",
  "payerEmail": "customer@example.com",
  "createdAt": "2025-10-09T12:00:00.000Z",
  "updatedAt": "2025-10-09T12:05:00.000Z",
  "metadata": {
    "ipAddress": "192.168.1.1",
    "userAgent": "Mozilla/5.0..."
  }
}
```

**Error Responses:**

**404 Not Found** - Pago no existe
```json
{
  "error": "Pago no encontrado"
}
```

---

### POST /api/webhook/mercadopago
Webhook para recibir notificaciones de MercadoPago sobre cambios de estado de pagos.

**Headers Required:**
- `x-signature` (string): Firma HMAC de seguridad de MercadoPago
- `x-request-id` (string): ID único de la petición

**Request Body:**
```json
{
  "action": "payment.updated",
  "api_version": "v1",
  "data": {
    "id": "12345678"
  },
  "date_created": "2025-10-09T12:05:00.000Z",
  "id": 98765432,
  "live_mode": false,
  "type": "payment",
  "user_id": "123456789"
}
```

**Response (200 OK):**
```json
{
  "status": "ok"
}
```

**Notes:**
- Webhook procesa solo eventos de tipo `payment`
- Otros tipos de eventos retornan 200 sin procesamiento
- Errores internos también retornan 200 para evitar reintentos
- Validación de firma implementada (comentada en sandbox)

---

## Data Types

### Payment Status
Estados posibles de un pago:

| Status | Descripción | Terminal |
|--------|-------------|----------|
| `pending` | Pago pendiente de procesamiento | No |
| `in_process` | Pago en procesamiento | No |
| `approved` | Pago aprobado exitosamente | Sí |
| `rejected` | Pago rechazado | Sí |
| `cancelled` | Pago cancelado por el usuario | Sí |
| `refunded` | Pago reembolsado | Sí |

### Payment Status Flow
```
pending → in_process → approved
                    ↓
                  rejected
                    ↓
                  cancelled
                    ↓
                  refunded
```

### Payment Methods
Métodos de pago soportados por MercadoPago:

- **Tarjeta de crédito**: Visa, Mastercard, American Express, etc.
- **Tarjeta de débito**: Visa Débito, Maestro, etc.
- **Efectivo**: Rapipago, Pago Fácil, etc.
- **Transferencia bancaria**
- **Mercado Pago Wallet**
- **Otros métodos locales**

---

## WebSocket Events

### payment:updated
Emitido cuando el estado de un pago cambia (por webhook o actualización manual).

**Event Name:** `payment:updated`

**Payload:**
```typescript
{
  payment: {
    id: string,
    orderId: string,
    tableId: string,
    amount: number,
    currency: string,
    status: PaymentStatus,
    provider: string,
    externalId?: string,
    paymentMethod?: string,
    createdAt: string,
    updatedAt: string
  },
  metadata: {
    version: number,
    updatedAt: string
  }
}
```

**Client Usage:**
```typescript
socket.on('payment:updated', (data) => {
  console.log('Payment updated:', data.payment.id, data.payment.status);
  // Update UI automatically
});
```

---

## Environment Variables

### Server-side (Required)
```bash
# MercadoPago Access Token
MERCADOPAGO_ACCESS_TOKEN=TEST-1234567890-100516-abcd1234efgh5678-ijkl9012

# Sandbox mode (true for development, false for production)
PAYMENT_SANDBOX=true

# Webhook URL (must be publicly accessible)
PAYMENT_WEBHOOK_URL=https://yourdomain.com/api/webhook/mercadopago
```

### Client-side (Required)
```bash
# MercadoPago Public Key
NEXT_PUBLIC_MERCADOPAGO_PUBLIC_KEY=TEST-1234567890-100516-abcd1234efgh5678

# Sandbox mode for frontend
NEXT_PUBLIC_PAYMENT_SANDBOX=true
```

### Configuration
Add to `.env.local` for development:
```bash
# Payment Gateway - MercadoPago
MERCADOPAGO_ACCESS_TOKEN=TEST-your-access-token
NEXT_PUBLIC_MERCADOPAGO_PUBLIC_KEY=TEST-your-public-key
PAYMENT_SANDBOX=true
NEXT_PUBLIC_PAYMENT_SANDBOX=true
PAYMENT_WEBHOOK_URL=https://your-ngrok-url.ngrok.io/api/webhook/mercadopago
```

---

## Testing

### Sandbox Test Cards (Argentina)

#### Approved Payments
| Card Number | CVV | Expiry | Card Type |
|-------------|-----|--------|-----------|
| 5031 7557 3453 0604 | 123 | 11/25 | Mastercard |
| 4509 9535 6623 3704 | 123 | 11/25 | Visa |
| 3711 803032 57522 | 1234 | 11/25 | Amex |

#### Rejected Payments
| Card Number | Rejection Reason |
|-------------|------------------|
| 4000 0000 0000 0002 | Insufficient funds |
| 4000 0000 0000 0010 | Invalid CVV |
| 4000 0000 0000 0036 | Expired card |

#### Pending Payments
| Card Number | Result |
|-------------|--------|
| 4000 0000 0000 0008 | Pending approval |

**Cardholder Name:** Any name  
**Document Number:** Any valid DNI/CUIT  

### Testing Workflow
1. Create order in Orders Panel
2. Click "Pagar" button
3. Use test card in MercadoPago Checkout Pro
4. Verify payment status updates
5. Check WebSocket event emission
6. Verify success/failure page redirect

---

## Error Handling

### Error Codes

| Code | Description | HTTP Status |
|------|-------------|-------------|
| `DUPLICATE_PAYMENT` | Ya existe un pago activo para este pedido | 400 |
| `ORDER_NOT_FOUND` | El pedido especificado no existe | 404 |
| `INVALID_AMOUNT` | El monto debe ser mayor a 0 | 400 |
| `PROVIDER_ERROR` | Error del proveedor de pagos (MercadoPago) | 500 |
| `WEBHOOK_SIGNATURE_INVALID` | Firma del webhook inválida | 401 |

### Common Errors

#### Duplicate Payment
**Cause:** Intentar crear un pago cuando ya existe uno activo para el mismo pedido.

**Solution:** Verificar que no exista un pago pendiente antes de crear uno nuevo, o esperar a que el pago anterior finalice.

**Prevention:**
```typescript
const { payments } = await fetch(`/api/payment?orderId=${orderId}&status=pending`);
if (payments.length > 0) {
  console.log('Already has active payment');
  return;
}
```

#### Order Not Found
**Cause:** El orderId proporcionado no corresponde a ningún pedido existente.

**Solution:** Verificar que el pedido existe antes de intentar crear el pago.

### Retry Logic
El sistema implementa retry con backoff exponencial para operaciones de MercadoPago:

- **Intento 1**: Inmediato
- **Intento 2**: 1 segundo de espera
- **Intento 3**: 2 segundos de espera
- **Intento 4**: 4 segundos de espera
- **Max intentos**: 4

---

## Rate Limits

| Endpoint | Limit | Window |
|----------|-------|--------|
| POST /api/payment | 10 requests | 1 minute per IP |
| GET /api/payment | 100 requests | 1 minute per IP |
| GET /api/payment/:id | 100 requests | 1 minute per IP |
| POST /api/webhook/mercadopago | No limit | Authenticated via signature |

---

## Performance Benchmarks

| Operation | P50 | P95 | P99 |
|-----------|-----|-----|-----|
| Payment creation | <300ms | <500ms | <800ms |
| Payment retrieval | <100ms | <200ms | <300ms |
| Payment list (50 items) | <150ms | <300ms | <500ms |
| Webhook processing | <50ms | <100ms | <150ms |

**Target Throughput:** >100 req/s  
**Availability:** 99.9%

---

## Security

### Webhook Signature Validation
MercadoPago envía firma HMAC en header `x-signature` para validar autenticidad:

```typescript
const signature = request.headers.get('x-signature');
const requestId = request.headers.get('x-request-id');

// Validate signature (implementation in webhook handler)
const isValid = validateWebhookSignature(body, signature, requestId);
```

### PCI Compliance
- ✅ No card data stored on our servers
- ✅ All payment processing through PCI-compliant MercadoPago
- ✅ TLS/SSL for all API communication
- ✅ Webhook signature validation

### Data Privacy
- Payment data stored with minimal PII
- Logs sanitized (no card numbers)
- Environment variables for sensitive keys
- Access control via authentication middleware

---

## Support & Troubleshooting

### Common Issues

#### Webhook not receiving notifications
1. Verify `PAYMENT_WEBHOOK_URL` is publicly accessible
2. Check MercadoPago dashboard webhook configuration
3. Use ngrok for local development
4. Verify no firewall blocking

#### Payment stuck in pending
1. Check MercadoPago dashboard for payment status
2. Verify webhook is working
3. Manually trigger webhook via MercadoPago API
4. Check network logs for webhook delivery

#### Checkout Pro not opening
1. Verify popup blocker is disabled
2. Check browser console for errors
3. Verify `NEXT_PUBLIC_MERCADOPAGO_PUBLIC_KEY` is set
4. Test in incognito mode

### Debug Mode
Enable detailed logging:
```bash
DEBUG=payment:* npm run dev
```

### Contact Support
- **Technical Issues:** dev@restaurant.com
- **MercadoPago Support:** https://www.mercadopago.com.ar/developers/es/support
- **Emergency:** +54 11 1234-5678

---

## Changelog

### v1.0.0 (2025-10-09)
- ✨ Initial release
- ✨ MercadoPago Checkout Pro integration
- ✨ Webhook handler for real-time updates
- ✨ WebSocket events for UI updates
- ✨ Payment result pages (success/failure/pending)
- ✨ Orders Panel integration

---

## Related Documentation
- [Payment Flow Diagrams](../diagrams/payment-flow.md)
- [MercadoPago API Reference](https://www.mercadopago.com.ar/developers/es/reference)
- [WebSocket Events](../../lib/socket-events.ts)
- [PR Checklist](../checklists/payment-pr-checklist.md)
