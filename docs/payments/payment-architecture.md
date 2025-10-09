# Arquitectura de Sistema de Pagos

**Fecha:** 9 de octubre de 2025  
**Versión:** 1.0  
**Estado:** Design Phase

---

## 🎯 Objetivos de Arquitectura

1. **Abstracción:** Independiente de pasarela específica (Mercado Pago, Stripe)
2. **Escalabilidad:** Soportar múltiples pasarelas simultáneamente
3. **Seguridad:** PCI-DSS compliant, no almacenar datos sensibles
4. **Resiliencia:** Manejo robusto de fallos y timeouts
5. **Observabilidad:** Logs completos, trazabilidad end-to-end

---

## 📐 Componentes del Sistema

### 1. Payment Service (lib/payment-service.ts)

**Responsabilidad:** Abstracción de pasarelas de pago

```typescript
/**
 * Interface común para todos los payment providers
 */
interface PaymentProvider {
  /**
   * Crear una intención de pago
   */
  createPayment(
    order: Order,
    options: PaymentOptions
  ): Promise<PaymentResult>

  /**
   * Consultar estado actual de un pago
   */
  getPaymentStatus(paymentId: string): Promise<PaymentStatus>

  /**
   * Procesar webhook de la pasarela
   */
  processWebhook(payload: unknown): Promise<WebhookResult>

  /**
   * Cancelar un pago pendiente
   */
  cancelPayment(paymentId: string): Promise<void>

  /**
   * Generar URL de checkout hosted
   */
  getCheckoutUrl(paymentId: string): Promise<string>
}

/**
 * Implementación específica de Mercado Pago
 */
class MercadoPagoProvider implements PaymentProvider {
  constructor(private config: MercadoPagoConfig) {}

  async createPayment(order, options) {
    // 1. Validar orden
    // 2. Crear preference en Mercado Pago
    // 3. Obtener checkout URL
    // 4. Retornar PaymentResult
  }

  async processWebhook(payload) {
    // 1. Verificar firma del webhook
    // 2. Validar estructura del payload
    // 3. Actualizar estado del payment
    // 4. Emitir eventos internos
  }
}

/**
 * Implementación específica de Stripe (futuro)
 */
class StripeProvider implements PaymentProvider {
  // Implementación similar pero usando Stripe API
}

/**
 * Factory para seleccionar provider
 */
function getPaymentProvider(
  provider: 'mercadopago' | 'stripe'
): PaymentProvider {
  switch (provider) {
    case 'mercadopago':
      return new MercadoPagoProvider(mercadoPagoConfig)
    case 'stripe':
      return new StripeProvider(stripeConfig)
    default:
      throw new Error(`Unknown provider: ${provider}`)
  }
}
```

---

### 2. Payment Store (lib/server/payment-store.ts)

**Responsabilidad:** Persistencia de transacciones y estado

```typescript
/**
 * Modelo de Payment en el store
 */
interface Payment {
  id: string                    // ID interno: pmt-{timestamp}-{sequence}
  orderId: string               // Referencia a orden
  tableId: string               // Referencia a mesa
  provider: 'mercadopago' | 'stripe'
  status: PaymentStatus
  amount: number                // En centavos
  currency: string              // 'ARS', 'USD', etc.
  externalId: string            // ID de la pasarela externa
  checkoutUrl?: string          // URL para pagar
  method?: PaymentMethod        // credit_card, qr, etc.
  metadata: PaymentMetadata
  createdAt: Date
  updatedAt: Date
  completedAt?: Date
  failureReason?: string
}

/**
 * Store en memoria con persistencia en JSON
 */
class PaymentStore {
  private cache: PaymentStoreData | null = null
  private writeQueue: Promise<unknown> = Promise.resolve()

  /**
   * Crear nuevo payment
   */
  async createPayment(
    orderId: string,
    amount: number,
    provider: PaymentProvider
  ): Promise<Payment>

  /**
   * Actualizar estado de payment
   */
  async updatePaymentStatus(
    paymentId: string,
    status: PaymentStatus,
    metadata?: Partial<PaymentMetadata>
  ): Promise<Payment>

  /**
   * Obtener payment por ID
   */
  async getPaymentById(paymentId: string): Promise<Payment | null>

  /**
   * Listar payments por orden
   */
  async getPaymentsByOrderId(orderId: string): Promise<Payment[]>

  /**
   * Listar todos los payments con filtros
   */
  async listPayments(filters: PaymentFilters): Promise<Payment[]>
}
```

**Archivo de persistencia:** `data/payment-store.json`

```json
{
  "payments": [
    {
      "id": "pmt-1760040800000-1-abc",
      "orderId": "ord-1760040265062-1-00ma",
      "status": "completed",
      "amount": 4356,
      "provider": "mercadopago",
      "externalId": "12345678",
      "createdAt": "2025-10-09T17:00:00.000Z",
      "completedAt": "2025-10-09T17:05:30.000Z"
    }
  ],
  "metadata": {
    "version": 5,
    "updatedAt": "2025-10-09T17:05:30.000Z"
  }
}
```

---

### 3. API Endpoints

#### POST /api/payment

**Crear intención de pago**

```typescript
// Request
{
  "orderId": "ord-xxx",
  "provider": "mercadopago",  // opcional, default del config
  "returnUrl": "https://...", // opcional
  "metadata": {
    "customerEmail": "user@example.com"
  }
}

// Response 201 Created
{
  "data": {
    "paymentId": "pmt-xxx",
    "checkoutUrl": "https://www.mercadopago.com.ar/checkout/v1/redirect?pref_id=xxx",
    "status": "pending",
    "expiresAt": "2025-10-09T18:00:00.000Z"
  },
  "metadata": {
    "provider": "mercadopago",
    "createdAt": "2025-10-09T17:00:00.000Z"
  }
}
```

**Validaciones:**
- ✅ Orden existe y está en estado válido
- ✅ Orden no tiene payment completado
- ✅ Mesa asociada permite pagos
- ✅ Amount > 0

**Errors:**
- `400 INVALID_PAYLOAD` - Payload inválido
- `404 ORDER_NOT_FOUND` - Orden no existe
- `409 ORDER_ALREADY_PAID` - Orden ya pagada
- `409 PAYMENT_IN_PROGRESS` - Ya hay payment pendiente
- `500 PROVIDER_ERROR` - Error de la pasarela

---

#### GET /api/payment/:id

**Consultar estado de pago**

```typescript
// Request
GET /api/payment/pmt-xxx

// Response 200 OK
{
  "data": {
    "id": "pmt-xxx",
    "orderId": "ord-xxx",
    "status": "completed",
    "amount": 4356,
    "currency": "ARS",
    "provider": "mercadopago",
    "method": "credit_card",
    "createdAt": "2025-10-09T17:00:00.000Z",
    "completedAt": "2025-10-09T17:05:30.000Z"
  },
  "metadata": {
    "provider": "mercadopago"
  }
}
```

**Errors:**
- `404 PAYMENT_NOT_FOUND` - Payment no existe

---

#### POST /api/payment/webhook

**Recibir notificaciones de pasarelas**

```typescript
// Request (desde Mercado Pago)
{
  "id": 12345678,
  "live_mode": false,
  "type": "payment",
  "date_created": "2025-10-09T17:05:30.000-04:00",
  "user_id": "123456",
  "api_version": "v1",
  "action": "payment.updated",
  "data": {
    "id": "12345678"
  }
}

// Response 200 OK
{
  "status": "processed",
  "paymentId": "pmt-xxx"
}
```

**Procesamiento:**
1. Verificar firma del webhook (x-signature header)
2. Validar IP de origen (whitelist)
3. Buscar payment por externalId
4. Consultar estado en pasarela
5. Actualizar payment en store
6. Actualizar orden si completed
7. Emitir eventos WebSocket
8. Retornar 200 (idempotente)

**Errors:**
- `400 INVALID_SIGNATURE` - Firma inválida
- `403 FORBIDDEN` - IP no autorizada
- `404 PAYMENT_NOT_FOUND` - Payment no encontrado
- `500 PROCESSING_ERROR` - Error procesando

---

### 4. Integración con Order Store

**Modificaciones en order-store.ts:**

```typescript
// Agregar campo a StoredOrder
interface StoredOrder {
  // ... campos existentes
  paymentId?: string
  paymentStatus: 'pending' | 'paid' | 'failed'
}

// Nuevo método
async function markOrderAsPaid(
  orderId: string,
  paymentId: string
): Promise<StoredOrder> {
  // 1. Validar que orden existe
  // 2. Validar que payment está completed
  // 3. Actualizar paymentStatus a 'paid'
  // 4. Asociar paymentId
  // 5. Emitir evento order.payment.updated
  // 6. Trigger cambio de estado de mesa
}

// Validación en createOrder
async function createOrder(payload: CreateOrderPayload) {
  // ... código existente
  
  // Inicializar paymentStatus
  order.paymentStatus = 'pending'
  
  return order
}
```

**Eventos WebSocket nuevos:**
- `order.payment.updated` - Cuando cambia estado de pago
- `payment.completed` - Cuando pago se completa
- `payment.failed` - Cuando pago falla

---

### 5. Flujo de Estados

```
┌─────────────────────────────────────────────────────────────┐
│                    FLUJO DE PAGO COMPLETO                    │
└─────────────────────────────────────────────────────────────┘

1. CREAR ORDEN
   Order (abierto, paymentStatus: pending)
   Table (ocupada / order_in_progress)
   
   ↓

2. INICIAR PAGO
   POST /api/payment
   → Payment Store: create (status: pending)
   → Mercado Pago: create preference
   → Return: checkoutUrl
   
   ↓

3. USUARIO PAGA
   Usuario abre checkoutUrl
   Ingresa datos en Mercado Pago
   Confirma pago
   
   ↓

4. WEBHOOK RECIBIDO
   POST /api/payment/webhook
   → Verificar firma
   → Buscar payment
   → Consultar Mercado Pago
   → Payment Store: update (status: processing)
   
   ↓

5. CONFIRMACIÓN
   Payment (status: completed)
   → Order Store: markOrderAsPaid
   → Order (paymentStatus: paid)
   → Emit: order.payment.updated
   → Emit: payment.completed
   
   ↓

6. LIBERAR MESA
   Table Store: updateTableState
   → Table (cuenta_solicitada → libre)
   → Emit: table.updated
```

**Estados de Payment:**
- `pending` - Creado, esperando pago
- `processing` - En validación por pasarela
- `completed` - Pago exitoso
- `failed` - Pago rechazado
- `cancelled` - Cancelado por usuario/sistema
- `refunded` - Reembolsado

**Transiciones válidas:**
```
pending → processing → completed
pending → failed
pending → cancelled
completed → refunded
```

---

### 6. Manejo de Errores y Resiliencia

#### Retry Logic para Webhooks

```typescript
interface WebhookAttempt {
  timestamp: string
  success: boolean
  error?: string
}

// En payment metadata
metadata: {
  webhookAttempts: WebhookAttempt[]
  webhookRetries: number
}

// Al procesar webhook
const MAX_RETRIES = 3
if (metadata.webhookRetries >= MAX_RETRIES) {
  // Marcar para revisión manual
  logger.error('Max webhook retries exceeded', { paymentId })
  await notifyAdmin(paymentId)
  return
}
```

#### Polling de Fallback

```typescript
/**
 * Si webhook tarda mucho, polling cada X segundos
 */
async function pollPaymentStatus(paymentId: string) {
  const payment = await getPaymentById(paymentId)
  
  if (payment.status !== 'pending') {
    return // Ya procesado
  }
  
  const elapsed = Date.now() - payment.createdAt.getTime()
  if (elapsed > 10 * 60 * 1000) { // 10 minutos
    // Consultar directamente a pasarela
    const provider = getPaymentProvider(payment.provider)
    const status = await provider.getPaymentStatus(payment.externalId)
    
    if (status !== payment.status) {
      await updatePaymentStatus(paymentId, status)
    }
  }
}
```

#### Idempotencia

```typescript
/**
 * Evitar procesar el mismo webhook múltiples veces
 */
const processedWebhooks = new Set<string>()

async function processWebhook(webhookId: string, payload: unknown) {
  if (processedWebhooks.has(webhookId)) {
    logger.info('Webhook already processed', { webhookId })
    return { status: 'already_processed' }
  }
  
  try {
    const result = await actuallyProcessWebhook(payload)
    processedWebhooks.add(webhookId)
    return result
  } catch (error) {
    // No agregar a set si falla, permitir retry
    throw error
  }
}
```

---

## 🔒 Seguridad

### Variables de Entorno Requeridas

```bash
# Payment Configuration
PAYMENT_PROVIDER=mercadopago
PAYMENT_SANDBOX=true

# Mercado Pago
MERCADOPAGO_ACCESS_TOKEN=TEST-xxxx-replace-with-your-token
MERCADOPAGO_PUBLIC_KEY=TEST-xxxx-replace-with-your-key
MERCADOPAGO_WEBHOOK_SECRET=your-webhook-secret

# Stripe (futuro)
STRIPE_SECRET_KEY=sk_test_xxx
STRIPE_PUBLISHABLE_KEY=pk_test_xxx
STRIPE_WEBHOOK_SECRET=whsec_xxx

# URLs
NEXT_PUBLIC_APP_URL=http://localhost:3000
PAYMENT_RETURN_URL=http://localhost:3000/payment/success
PAYMENT_FAILURE_URL=http://localhost:3000/payment/failure
PAYMENT_WEBHOOK_URL=https://tu-dominio.com/api/payment/webhook
```

### Validación de Webhooks

**Mercado Pago:**
```typescript
import crypto from 'crypto'

function verifyMercadoPagoWebhook(
  payload: string,
  signature: string,
  secret: string
): boolean {
  const hmac = crypto
    .createHmac('sha256', secret)
    .update(payload)
    .digest('hex')
  
  return crypto.timingSafeEqual(
    Buffer.from(hmac),
    Buffer.from(signature)
  )
}
```

**IP Whitelist:**
```typescript
const MERCADOPAGO_IPS = [
  '209.225.49.0/24',
  '216.33.197.0/24',
  '216.33.196.0/24'
  // Lista completa en docs de Mercado Pago
]

function isAllowedIP(ip: string): boolean {
  return MERCADOPAGO_IPS.some(range => ipInRange(ip, range))
}
```

---

## 📊 Compliance y Regulaciones

### PCI-DSS Compliance

✅ **NO almacenar datos de tarjeta**
- Usar checkout hosted (Checkout Pro)
- No tocar datos sensibles
- Mercado Pago/Stripe son PCI-DSS Level 1

✅ **Usar HTTPS en producción**
- Certificado SSL/TLS válido
- Forzar HTTPS en middleware

✅ **Logs sin información sensible**
- No loggear números de tarjeta
- No loggear CVV
- Sanitizar logs antes de persistir

### GDPR / Ley de Protección de Datos Personales

✅ **Almacenar solo metadata necesaria**
- Email opcional (con consentimiento)
- No almacenar datos biométricos
- Anonimizar IDs externos

✅ **Permitir eliminación de datos**
- Endpoint DELETE /api/payment/:id/gdpr
- Soft delete con anonymization
- Retención mínima legal

✅ **Encriptar datos sensibles**
- Encriptar externalId en DB
- Usar environment variables
- No hardcodear secrets

---

## 📈 Observabilidad

### Logging

```typescript
interface PaymentLog {
  timestamp: string
  level: 'info' | 'warn' | 'error'
  event: string
  paymentId?: string
  orderId?: string
  provider: string
  metadata: Record<string, unknown>
}

// Ejemplo
logger.info('payment.created', {
  paymentId: 'pmt-xxx',
  orderId: 'ord-xxx',
  provider: 'mercadopago',
  amount: 4356,
  currency: 'ARS'
})
```

### Métricas

```typescript
// Contadores
- payment.created.count
- payment.completed.count
- payment.failed.count
- webhook.received.count
- webhook.processed.count

// Timers
- payment.creation.duration
- webhook.processing.duration
- provider.api.call.duration

// Gauges
- payments.pending.count
- payments.processing.count
```

### Alertas

```typescript
// Condiciones de alerta
- payment.failed.rate > 10% (últimas 100 transacciones)
- webhook.processing.error > 5 (última hora)
- provider.timeout > 3 (últimos 15 min)
- payment.pending.duration > 30min (stuck payments)
```

---

## 🧪 Testing Strategy

### Unit Tests
- Payment Store CRUD operations
- Provider implementations
- Webhook signature validation
- State transitions

### Integration Tests
- API endpoints (POST/GET)
- Order Store integration
- WebSocket events emission

### E2E Tests
- Flujo completo: Crear orden → Pagar → Webhook → Mesa libre
- Edge cases: Timeouts, retries, fallos

---

## 📦 Dependencias Nuevas

```json
{
  "dependencies": {
    "mercadopago": "^2.0.0",
    "stripe": "^14.0.0"  // futuro
  }
}
```

---

## 🎯 Próximos Pasos

1. ✅ Arquitectura aprobada
2. → Crear payment-types.ts (Fase 1)
3. → Implementar backend (Fase 2)
4. → Implementar frontend (Fase 3)
5. → Testing E2E (Fase 4)

---

**Elaborado por:** Backend Architect  
**Revisado por:** Lib Logic Owner + Security Specialist  
**Aprobado para implementación:** ✅ Proceder con tipos y backend
