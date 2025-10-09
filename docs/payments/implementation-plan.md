# Payment Integration - Implementation Plan

## Plan de Implementación de Pagos Digitales (Fases 2-4)

Este documento detalla el plan de implementación técnica para las fases restantes del M5 (Pagos Digitales).

---

## 📋 Resumen Ejecutivo

**Estado Actual:** Fase 1 completada (Research & Setup)  
**Fases Pendientes:** 3 fases  
**Estimación Total:** 18-24 horas (~3-4 días laborables)  
**Complejidad:** Media-Alta  
**Riesgo:** Medio (depende de estabilidad de Mercado Pago SDK)

---

## 🗓️ Cronograma de Fases

| Fase | Descripción | Duración | Agentes | Prioridad |
|------|-------------|----------|---------|-----------|
| ✅ **Fase 1** | Research & Setup | 2-3h | @code-agent, @doc-agent | ✅ Completada |
| 🔄 **Fase 2** | Backend Implementation | 6-8h | @backend-agent, @code-agent | 🔥 Alta |
| ⏳ **Fase 3** | Frontend Implementation | 8-10h | @frontend-agent, @ux-agent | 🔥 Alta |
| ⏳ **Fase 4** | Testing & Validation | 4-6h | @test-agent, @qa-agent | ⚠️ Crítica |

---

## 🔧 Fase 2: Backend Implementation

**Objetivo:** Implementar store de pagos, provider de Mercado Pago, endpoints API, y webhooks.

**Duración:** 6-8 horas  
**Agentes:** `@backend-agent` (lead), `@code-agent` (support)  
**Dependencias:** Fase 1 completada  
**Branch:** `feature/backend-payments`

### 2.1 PaymentStore (2h)

**Archivos a crear:**
- `lib/server/payment-store.ts`
- `data/payment-store.json`

**Implementación:**

```typescript
// lib/server/payment-store.ts

import fs from 'fs/promises'
import path from 'path'
import type { 
  Payment, 
  PaymentStoreData, 
  CreatePaymentPayload,
  PaymentStatus,
  ListPaymentsFilters 
} from './payment-types'

const STORE_PATH = path.join(process.cwd(), 'data', 'payment-store.json')

class PaymentStore {
  // CRUD operations
  async create(data: CreatePaymentPayload): Promise<Payment>
  async getById(id: string): Promise<Payment | null>
  async getByOrderId(orderId: string): Promise<Payment[]>
  async list(filters?: ListPaymentsFilters): Promise<Payment[]>
  async update(id: string, updates: Partial<Payment>): Promise<Payment>
  async updateStatus(id: string, status: PaymentStatus, meta?: object): Promise<Payment>
  
  // Validation
  async validateOrderCanBePaid(orderId: string): Promise<boolean>
  async hasActivePayment(orderId: string): Promise<boolean>
  
  // Utilities
  private generatePaymentId(): string
  private incrementSequence(): Promise<number>
  private emitWebSocketEvent(event: string, data: unknown): void
}

export const paymentStore = new PaymentStore()
```

**Tests:**
- ✅ Create payment with valid data
- ✅ Get payment by ID
- ✅ List payments with filters
- ✅ Update payment status
- ✅ Validate order-payment relationship
- ✅ Prevent duplicate active payments
- ❌ Create payment with invalid data
- ❌ Get non-existent payment
- ❌ Sequence collision handling

**Validación:**
```bash
npm run test -- payment-store.test.ts
# Debe pasar 12/12 tests
```

---

### 2.2 Mercado Pago Provider (2-3h)

**Archivos a crear:**
- `lib/server/providers/mercadopago-provider.ts`
- `lib/server/providers/base-provider.ts` (abstracción)
- `lib/server/payment-config.ts`

**Dependencias:**
```bash
npm install mercadopago@^2.0.0
npm install -D @types/mercadopago
```

**Implementación:**

```typescript
// lib/server/providers/base-provider.ts

export interface IPaymentProvider {
  createPayment(options: CreatePaymentOptions): Promise<PaymentResult>
  getPaymentStatus(externalId: string): Promise<PaymentStatus>
  processWebhook(payload: WebhookPayload): Promise<WebhookResult>
  refundPayment?(paymentId: string, amount?: number): Promise<void>
}

// lib/server/providers/mercadopago-provider.ts

import { MercadoPagoConfig, Preference, Payment as MPPayment } from 'mercadopago'
import type { IPaymentProvider, CreatePaymentOptions, PaymentResult } from '../payment-types'

export class MercadoPagoProvider implements IPaymentProvider {
  private client: MercadoPagoConfig
  private preferenceClient: Preference
  private paymentClient: MPPayment

  constructor(config: MercadoPagoConfig) {
    this.client = new MercadoPagoConfig({
      accessToken: config.accessToken,
      options: { timeout: config.timeout }
    })
    this.preferenceClient = new Preference(this.client)
    this.paymentClient = new MPPayment(this.client)
  }

  async createPayment(options: CreatePaymentOptions): Promise<PaymentResult> {
    // 1. Crear preference en Mercado Pago
    // 2. Retornar init_point (checkout URL)
    // 3. Mapear response a PaymentResult
  }

  async getPaymentStatus(externalId: string): Promise<PaymentStatus> {
    // 1. Consultar payment por preference_id
    // 2. Mapear status de MP a nuestro PaymentStatus
  }

  async processWebhook(payload: WebhookPayload): Promise<WebhookResult> {
    // 1. Validar firma x-signature
    // 2. Extraer payment_id del payload
    // 3. Consultar estado actual en MP
    // 4. Retornar WebhookResult con nuevo estado
  }
}

// lib/server/payment-config.ts

export function getPaymentConfig() {
  validatePaymentConfig()
  
  return {
    provider: process.env.PAYMENT_DEFAULT_PROVIDER || 'mercadopago',
    mercadopago: {
      accessToken: process.env.MP_ACCESS_TOKEN!,
      publicKey: process.env.NEXT_PUBLIC_MP_PUBLIC_KEY!,
      webhookSecret: process.env.MP_WEBHOOK_SECRET!,
      sandbox: process.env.MP_ENVIRONMENT === 'sandbox',
      timeout: parseInt(process.env.PAYMENT_PROVIDER_TIMEOUT || '10000')
    }
  }
}
```

**Tests:**
- ✅ Create payment preference
- ✅ Get payment status
- ✅ Process webhook with valid signature
- ✅ Map MP statuses to our PaymentStatus
- ✅ Handle MP API errors gracefully
- ❌ Invalid webhook signature
- ❌ MP API timeout
- ❌ Invalid preference data

**Validación:**
```bash
npm run test -- mercadopago-provider.test.ts
# Debe pasar 10/10 tests
```

---

### 2.3 API Endpoints (2h)

**Archivos a crear:**
- `app/api/payment/route.ts` (POST, GET all)
- `app/api/payment/[id]/route.ts` (GET by ID)
- `app/api/webhook/mercadopago/route.ts` (POST)

**Implementación:**

#### POST /api/payment

```typescript
// app/api/payment/route.ts

import { NextRequest, NextResponse } from 'next/server'
import { paymentStore } from '@/lib/server/payment-store'
import { MercadoPagoProvider } from '@/lib/server/providers/mercadopago-provider'
import { getPaymentConfig } from '@/lib/server/payment-config'
import { PaymentError, PAYMENT_ERROR_CODES } from '@/lib/server/payment-types'
import { orderStore } from '@/lib/server/order-store'

export async function POST(request: NextRequest) {
  try {
    const payload = await request.json()
    
    // 1. Validar payload
    if (!payload.orderId) {
      throw new PaymentError(
        'orderId is required',
        PAYMENT_ERROR_CODES.INVALID_PAYLOAD,
        400
      )
    }

    // 2. Validar que orden existe
    const order = await orderStore.getById(payload.orderId)
    if (!order) {
      throw new PaymentError(
        'Order not found',
        PAYMENT_ERROR_CODES.ORDER_NOT_FOUND,
        404
      )
    }

    // 3. Validar que orden no tenga payment activo
    const hasActive = await paymentStore.hasActivePayment(payload.orderId)
    if (hasActive) {
      throw new PaymentError(
        'Order already has an active payment',
        PAYMENT_ERROR_CODES.ORDER_ALREADY_PAID,
        409
      )
    }

    // 4. Crear payment en provider
    const config = getPaymentConfig()
    const provider = new MercadoPagoProvider(config.mercadopago)
    
    const result = await provider.createPayment({
      amount: order.total,
      currency: 'ARS',
      orderId: order.id,
      description: `Pedido #${order.id} - Mesa ${order.tableId}`,
      customerEmail: payload.metadata?.customerEmail,
      returnUrl: payload.returnUrl,
      failureUrl: payload.failureUrl,
      metadata: payload.metadata
    })

    // 5. Guardar payment en store
    const payment = await paymentStore.create({
      orderId: payload.orderId,
      provider: 'mercadopago',
      externalId: result.externalId,
      checkoutUrl: result.checkoutUrl,
      amount: order.total,
      currency: 'ARS',
      metadata: payload.metadata
    })

    // 6. Emitir evento WebSocket
    io.emit('payment.created', { payment })

    return NextResponse.json({
      data: {
        paymentId: payment.id,
        checkoutUrl: payment.checkoutUrl,
        status: payment.status,
        expiresAt: payment.expiresAt?.toISOString()
      },
      metadata: {
        provider: payment.provider,
        createdAt: payment.createdAt.toISOString()
      }
    }, { status: 201 })

  } catch (error) {
    if (error instanceof PaymentError) {
      return NextResponse.json(
        { error: error.message, code: error.code },
        { status: error.status }
      )
    }
    
    console.error('[API] Payment creation error:', error)
    return NextResponse.json(
      { error: 'Internal server error', code: PAYMENT_ERROR_CODES.INTERNAL_ERROR },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
  // List payments with filters
  const { searchParams } = new URL(request.url)
  const filters = {
    orderId: searchParams.get('orderId') || undefined,
    status: searchParams.get('status') as PaymentStatus | undefined,
    limit: parseInt(searchParams.get('limit') || '50')
  }
  
  const payments = await paymentStore.list(filters)
  
  return NextResponse.json({
    data: payments.map(serializePayment),
    metadata: {
      total: payments.length
    }
  })
}
```

#### POST /api/webhook/mercadopago

```typescript
// app/api/webhook/mercadopago/route.ts

import { NextRequest, NextResponse } from 'next/server'
import { MercadoPagoProvider } from '@/lib/server/providers/mercadopago-provider'
import { paymentStore } from '@/lib/server/payment-store'
import { getPaymentConfig } from '@/lib/server/payment-config'

export async function POST(request: NextRequest) {
  try {
    const payload = await request.json()
    const signature = request.headers.get('x-signature')
    
    console.log('[WEBHOOK] Received notification:', payload.type)
    
    // 1. Validar firma
    const config = getPaymentConfig()
    const provider = new MercadoPagoProvider(config.mercadopago)
    
    const webhookPayload = {
      provider: 'mercadopago' as const,
      event: payload.type,
      data: payload.data,
      signature: signature || undefined
    }
    
    // 2. Procesar webhook
    const result = await provider.processWebhook(webhookPayload)
    
    if (!result.processed) {
      console.warn('[WEBHOOK] Ignored event:', payload.type)
      return NextResponse.json({ status: 'ignored' })
    }
    
    // 3. Actualizar payment en store
    const payment = await paymentStore.updateStatus(
      result.paymentId,
      result.status,
      {
        method: result.method,
        failureReason: result.failureReason,
        failureCode: result.failureCode,
        completedAt: result.status === 'completed' ? new Date() : undefined
      }
    )
    
    // 4. Emitir evento WebSocket
    if (result.status === 'completed') {
      io.emit('payment.completed', { payment, orderId: payment.orderId })
    } else if (result.status === 'failed') {
      io.emit('payment.failed', { 
        payment, 
        reason: result.failureReason,
        code: result.failureCode
      })
    }
    
    console.log(`[WEBHOOK] Payment ${payment.id} updated to ${result.status}`)
    
    return NextResponse.json({ status: 'ok' })

  } catch (error) {
    console.error('[WEBHOOK] Processing error:', error)
    
    // Retornar 200 para evitar reintentos de MP
    return NextResponse.json({ status: 'error' }, { status: 200 })
  }
}
```

**Tests:**
- ✅ POST /api/payment with valid data
- ✅ GET /api/payment with filters
- ✅ GET /api/payment/[id]
- ✅ POST /api/webhook/mercadopago with valid signature
- ✅ Webhook updates payment status correctly
- ❌ POST /api/payment without orderId
- ❌ POST /api/payment with non-existent order
- ❌ POST /api/payment with duplicate active payment
- ❌ Webhook with invalid signature
- ❌ Webhook with unknown event type

**Validación:**
```bash
npm run test -- app/api/payment
# Debe pasar 15/15 tests
```

---

### 2.4 Checklist de Fase 2

- [ ] PaymentStore implementado con todos los métodos
- [ ] payment-store.json inicializado
- [ ] MercadoPagoProvider implementado con IPaymentProvider
- [ ] payment-config.ts con validación de env vars
- [ ] POST /api/payment endpoint funcional
- [ ] GET /api/payment (list) endpoint funcional
- [ ] GET /api/payment/[id] endpoint funcional
- [ ] POST /api/webhook/mercadopago endpoint funcional
- [ ] Validación de firmas de webhook
- [ ] WebSocket events emitidos correctamente
- [ ] 37/37 tests pasando (store + provider + API)
- [ ] npm run lint sin warnings
- [ ] npm run build exitoso
- [ ] Documentación de API actualizada

**Validación Final:**
```bash
npm run test
npm run lint
npm run build
git status # Verificar archivos modificados
```

---

## 🎨 Fase 3: Frontend Implementation

**Objetivo:** Crear UI de checkout, integrar SDK de Mercado Pago, manejar estados de pago.

**Duración:** 8-10 horas  
**Agentes:** `@frontend-agent` (lead), `@ux-agent` (support)  
**Dependencias:** Fase 2 completada  
**Branch:** `feature/frontend-payments`

### 3.1 Checkout Flow Components (3-4h)

**Archivos a crear:**
- `components/checkout-button.tsx`
- `components/payment-modal.tsx`
- `components/payment-status.tsx`
- `hooks/use-payment.ts`

**Implementación:**

#### CheckoutButton Component

```typescript
// components/checkout-button.tsx

'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { PaymentModal } from './payment-modal'
import type { Order } from '@/lib/server/order-types'

interface CheckoutButtonProps {
  order: Order
  onSuccess?: (paymentId: string) => void
  onError?: (error: Error) => void
}

export function CheckoutButton({ order, onSuccess, onError }: CheckoutButtonProps) {
  const [showModal, setShowModal] = useState(false)
  const [isCreating, setIsCreating] = useState(false)

  async function handleCheckout() {
    setIsCreating(true)
    
    try {
      const response = await fetch('/api/payment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          orderId: order.id,
          returnUrl: `${window.location.origin}/payment/success`,
          failureUrl: `${window.location.origin}/payment/failure`,
          metadata: {
            customerName: 'Cliente',
            reference: order.id
          }
        })
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.message || 'Error al crear pago')
      }

      const { data } = await response.json()
      
      // Abrir checkout en nueva ventana/tab
      window.open(data.checkoutUrl, '_blank')
      
      setShowModal(true)
      onSuccess?.(data.paymentId)

    } catch (error) {
      console.error('Checkout error:', error)
      onError?.(error as Error)
    } finally {
      setIsCreating(false)
    }
  }

  return (
    <>
      <Button 
        onClick={handleCheckout} 
        disabled={isCreating || order.status !== 'pending'}
        className="w-full"
      >
        {isCreating ? 'Creando pago...' : `Pagar $${(order.total / 100).toFixed(2)}`}
      </Button>

      {showModal && (
        <PaymentModal 
          orderId={order.id}
          onClose={() => setShowModal(false)}
        />
      )}
    </>
  )
}
```

#### Payment Status Hook

```typescript
// hooks/use-payment.ts

'use client'

import { useState, useEffect } from 'react'
import { useSocket } from './use-socket'
import type { Payment, PaymentStatus } from '@/lib/server/payment-types'

export function usePayment(orderId: string) {
  const [payment, setPayment] = useState<Payment | null>(null)
  const [status, setStatus] = useState<PaymentStatus>('pending')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)
  
  const socket = useSocket()

  // Fetch initial payment
  useEffect(() => {
    async function fetchPayment() {
      try {
        const response = await fetch(`/api/payment?orderId=${orderId}`)
        if (!response.ok) throw new Error('Failed to fetch payment')
        
        const { data } = await response.json()
        const latestPayment = data[0] // Get most recent
        
        if (latestPayment) {
          setPayment(latestPayment)
          setStatus(latestPayment.status)
        }
      } catch (err) {
        setError(err as Error)
      } finally {
        setLoading(false)
      }
    }

    fetchPayment()
  }, [orderId])

  // Listen to WebSocket events
  useEffect(() => {
    if (!socket) return

    function handlePaymentUpdated(data: { payment: Payment }) {
      if (data.payment.orderId === orderId) {
        setPayment(data.payment)
        setStatus(data.payment.status)
      }
    }

    function handlePaymentCompleted(data: { payment: Payment }) {
      if (data.payment.orderId === orderId) {
        setPayment(data.payment)
        setStatus('completed')
      }
    }

    function handlePaymentFailed(data: { payment: Payment; reason: string }) {
      if (data.payment.orderId === orderId) {
        setPayment(data.payment)
        setStatus('failed')
        setError(new Error(data.reason))
      }
    }

    socket.on('payment.updated', handlePaymentUpdated)
    socket.on('payment.completed', handlePaymentCompleted)
    socket.on('payment.failed', handlePaymentFailed)

    return () => {
      socket.off('payment.updated', handlePaymentUpdated)
      socket.off('payment.completed', handlePaymentCompleted)
      socket.off('payment.failed', handlePaymentFailed)
    }
  }, [socket, orderId])

  return {
    payment,
    status,
    loading,
    error,
    isCompleted: status === 'completed',
    isFailed: status === 'failed',
    isPending: status === 'pending',
    isProcessing: status === 'processing'
  }
}
```

**Tests:**
- ✅ CheckoutButton renders correctly
- ✅ Creates payment on click
- ✅ Opens checkout URL in new window
- ✅ Shows PaymentModal after creation
- ✅ usePayment hook fetches initial status
- ✅ usePayment hook listens to WebSocket updates
- ✅ PaymentModal updates status in real-time
- ❌ Handles API error gracefully
- ❌ Disables button when order already paid

---

### 3.2 Payment Status Pages (2-3h)

**Archivos a crear:**
- `app/payment/success/page.tsx`
- `app/payment/failure/page.tsx`
- `app/payment/pending/page.tsx`

**Implementación:**

```typescript
// app/payment/success/page.tsx

'use client'

import { useEffect } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { CheckCircle } from 'lucide-react'

export default function PaymentSuccessPage() {
  const searchParams = useSearchParams()
  const router = useRouter()
  
  const paymentId = searchParams.get('payment_id')
  const externalReference = searchParams.get('external_reference')

  useEffect(() => {
    // Log analytics event
    if (typeof window !== 'undefined' && window.gtag) {
      window.gtag('event', 'payment_success', {
        payment_id: paymentId,
        order_id: externalReference
      })
    }
  }, [paymentId, externalReference])

  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <div className="max-w-md text-center space-y-6">
        <CheckCircle className="w-24 h-24 text-green-500 mx-auto" />
        
        <div>
          <h1 className="text-3xl font-bold">¡Pago exitoso!</h1>
          <p className="text-muted-foreground mt-2">
            Tu pedido ha sido confirmado y será procesado pronto.
          </p>
        </div>

        {externalReference && (
          <div className="bg-muted p-4 rounded-lg">
            <p className="text-sm font-medium">Número de pedido</p>
            <p className="text-2xl font-bold">{externalReference}</p>
          </div>
        )}

        <Button onClick={() => router.push('/pedidos')} size="lg">
          Ver mis pedidos
        </Button>
      </div>
    </div>
  )
}
```

**Tests:**
- ✅ Success page renders correctly
- ✅ Failure page shows error message
- ✅ Pending page shows waiting state
- ✅ Analytics events tracked correctly

---

### 3.3 Orders Panel Integration (2-3h)

**Archivo a modificar:**
- `components/orders-panel.tsx`

**Cambios:**

```typescript
// Agregar columna de Payment Status
<TableCell>
  {order.paymentStatus === 'completed' ? (
    <Badge variant="success">Pagado</Badge>
  ) : order.paymentStatus === 'pending' ? (
    <Badge variant="warning">Pendiente</Badge>
  ) : (
    <Badge variant="secondary">Sin pagar</Badge>
  )}
</TableCell>

// Agregar CheckoutButton en acciones
<CheckoutButton 
  order={order}
  onSuccess={() => toast.success('Checkout creado')}
  onError={(error) => toast.error(error.message)}
/>
```

**Tests:**
- ✅ Payment status badge renders correctly
- ✅ CheckoutButton appears for unpaid orders
- ✅ Real-time updates via WebSocket
- ✅ Toast notifications work correctly

---

### 3.4 Checklist de Fase 3

- [ ] CheckoutButton component implementado
- [ ] PaymentModal component implementado
- [ ] PaymentStatus component implementado
- [ ] use-payment hook implementado
- [ ] Payment success page creada
- [ ] Payment failure page creada
- [ ] Payment pending page creada
- [ ] Orders panel integrado con payments
- [ ] WebSocket real-time updates funcionando
- [ ] 18/18 tests de frontend pasando
- [ ] Estilos y UX validados
- [ ] Responsive design verificado
- [ ] Accesibilidad (a11y) validada

**Validación Final:**
```bash
npm run test -- components/checkout
npm run lint
npm run build
npm run dev # Manual testing
```

---

## ✅ Fase 4: Testing & Validation

**Objetivo:** Validar integración end-to-end, tests E2E, load testing, documentación.

**Duración:** 4-6 horas  
**Agentes:** `@test-agent` (lead), `@qa-agent` (support)  
**Dependencias:** Fases 2 y 3 completadas  
**Branch:** `feature/payments-testing`

### 4.1 E2E Tests (2-3h)

**Archivos a crear:**
- `__tests__/e2e/payment-flow.test.ts`
- `__tests__/e2e/webhook-flow.test.ts`

**Herramientas:**
- Vitest para unit tests
- Playwright para E2E (opcional)

**Implementación:**

```typescript
// __tests__/e2e/payment-flow.test.ts

import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import { orderStore } from '@/lib/server/order-store'
import { paymentStore } from '@/lib/server/payment-store'

describe('Payment E2E Flow', () => {
  let testOrderId: string
  let testPaymentId: string

  beforeAll(async () => {
    // Create test order
    const order = await orderStore.create({
      tableId: 'table-1',
      items: [{ dishId: 'dish-1', quantity: 1, price: 50000 }],
      total: 50000,
      status: 'pending'
    })
    testOrderId = order.id
  })

  afterAll(async () => {
    // Cleanup
    await orderStore.delete(testOrderId)
    if (testPaymentId) {
      await paymentStore.delete(testPaymentId)
    }
  })

  it('should create payment successfully', async () => {
    const response = await fetch('http://localhost:3000/api/payment', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        orderId: testOrderId,
        returnUrl: 'http://localhost:3000/payment/success'
      })
    })

    expect(response.status).toBe(201)
    
    const { data } = await response.json()
    expect(data.paymentId).toBeDefined()
    expect(data.checkoutUrl).toContain('mercadopago.com')
    
    testPaymentId = data.paymentId
  })

  it('should prevent duplicate payments', async () => {
    const response = await fetch('http://localhost:3000/api/payment', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ orderId: testOrderId })
    })

    expect(response.status).toBe(409)
    
    const { code } = await response.json()
    expect(code).toBe('ORDER_ALREADY_PAID')
  })

  it('should process webhook and update payment status', async () => {
    // Simulate MP webhook
    const webhookPayload = {
      type: 'payment',
      data: { id: 'mp-payment-123' }
    }

    const response = await fetch('http://localhost:3000/api/webhook/mercadopago', {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'x-signature': 'valid-signature-here'
      },
      body: JSON.stringify(webhookPayload)
    })

    expect(response.status).toBe(200)
    
    // Verify payment updated
    const payment = await paymentStore.getById(testPaymentId)
    expect(payment?.status).toBe('completed')
  })

  it('should emit WebSocket event on payment completion', (done) => {
    const socket = io('http://localhost:3000')
    
    socket.on('payment.completed', (data) => {
      expect(data.payment.id).toBe(testPaymentId)
      socket.disconnect()
      done()
    })

    // Trigger webhook
    fetch('http://localhost:3000/api/webhook/mercadopago', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ type: 'payment', data: { id: 'mp-payment-123' } })
    })
  })
})
```

**Tests E2E:**
- ✅ Full payment flow (create → checkout → webhook → complete)
- ✅ Duplicate payment prevention
- ✅ Webhook signature validation
- ✅ WebSocket event emission
- ✅ Payment status synchronization
- ✅ Order-payment relationship
- ❌ Failed payment flow
- ❌ Expired payment handling
- ❌ Concurrent payment attempts

---

### 4.2 Load Testing (1-2h)

**Herramientas:**
- Artillery.io o k6 para load testing

**Implementación:**

```yaml
# artillery-payment.yml

config:
  target: "http://localhost:3000"
  phases:
    - duration: 60
      arrivalRate: 10  # 10 requests/sec
      name: "Warm up"
    - duration: 120
      arrivalRate: 50  # 50 requests/sec
      name: "Sustained load"
    - duration: 60
      arrivalRate: 100 # 100 requests/sec
      name: "Spike"

scenarios:
  - name: "Create Payment"
    flow:
      - post:
          url: "/api/payment"
          json:
            orderId: "{{ $randomString() }}"
            returnUrl: "http://localhost:3000/payment/success"
          capture:
            - json: "$.data.paymentId"
              as: "paymentId"
      
      - think: 2
      
      - get:
          url: "/api/payment/{{ paymentId }}"
```

**Métricas esperadas:**
- p95 response time < 500ms
- p99 response time < 1000ms
- Error rate < 1%
- Throughput > 100 req/s

**Validación:**
```bash
artillery run artillery-payment.yml
```

---

### 4.3 Documentation Updates (1h)

**Archivos a actualizar:**
- `docs/api/payment-endpoint.md` (agregar ejemplos reales)
- `README.md` (agregar sección de payments)
- `ROADMAP.md` (marcar M5 como completado)

**Contenido:**

```markdown
## Payments API

### Create Payment

**Endpoint:** `POST /api/payment`

**Example:**
```bash
curl -X POST http://localhost:3000/api/payment \
  -H "Content-Type: application/json" \
  -d '{
    "orderId": "order-12345",
    "returnUrl": "https://turestaurante.com/payment/success",
    "metadata": {
      "customerEmail": "cliente@example.com"
    }
  }'
```

**Response:**
```json
{
  "data": {
    "paymentId": "pmt-1234567890-001-a1b2",
    "checkoutUrl": "https://www.mercadopago.com.ar/checkout/v1/redirect?pref_id=123456789-abc123",
    "status": "pending",
    "expiresAt": "2024-03-20T12:00:00Z"
  },
  "metadata": {
    "provider": "mercadopago",
    "createdAt": "2024-03-20T10:00:00Z"
  }
}
```

### Webhooks

Mercado Pago envía notificaciones a `/api/webhook/mercadopago` cuando el estado del pago cambia.

**Headers:**
- `x-signature`: Firma para validar autenticidad
- `x-request-id`: ID único del request

**Events:**
- `payment.created` → Payment creado
- `payment.updated` → Payment actualizado
- `payment.completed` → Payment completado exitosamente
- `payment.failed` → Payment falló o fue rechazado
```

---

### 4.4 Checklist de Fase 4

- [ ] E2E tests implementados (9 tests)
- [ ] Load testing configurado con Artillery
- [ ] Load testing ejecutado exitosamente
- [ ] Métricas de performance documentadas
- [ ] API documentation actualizada
- [ ] README.md actualizado con sección de payments
- [ ] ROADMAP.md actualizado (M5 al 100%)
- [ ] Manual testing checklist completado
- [ ] Security review completado
- [ ] 64/64 tests totales pasando (unit + E2E)
- [ ] npm run build exitoso
- [ ] Branch merged a `main`

**Validación Final:**
```bash
npm run test
npm run lint
npm run build
artillery run artillery-payment.yml
git status
```

---

## 📊 Resumen de Estimaciones

| Fase | Tareas | Tests | Duración | Agentes |
|------|--------|-------|----------|---------|
| **Fase 2** | PaymentStore, Provider, API, Webhooks | 37 | 6-8h | @backend-agent |
| **Fase 3** | Components, Hooks, Pages, Integration | 18 | 8-10h | @frontend-agent |
| **Fase 4** | E2E Tests, Load Testing, Docs | 9 | 4-6h | @test-agent |
| **TOTAL** | **25 archivos nuevos** | **64 tests** | **18-24h** | **3-4 días** |

---

## 🎯 Criterios de Aceptación

### Funcionales

- ✅ Usuario puede crear payment desde orden
- ✅ Checkout URL se abre en nueva ventana
- ✅ Webhooks actualizan estado en tiempo real
- ✅ WebSocket emite eventos de payment
- ✅ UI muestra estado de pago correctamente
- ✅ Órdenes no pueden tener múltiples payments activos
- ✅ Payments expirados se marcan automáticamente

### No Funcionales

- ✅ p95 response time < 500ms
- ✅ 64/64 tests pasando
- ✅ Cobertura de tests > 80%
- ✅ npm run lint sin warnings
- ✅ npm run build exitoso
- ✅ Documentación completa y actualizada
- ✅ Logs estructurados para debugging
- ✅ Error handling robusto

### Seguridad

- ✅ Webhook signatures validadas
- ✅ Credenciales en env vars (no hardcoded)
- ✅ HTTPS obligatorio en producción
- ✅ Payment IDs no predecibles
- ✅ Rate limiting en endpoints de payment
- ✅ Input validation en todos los endpoints

---

## 🚀 Deployment Checklist

Antes de deployar a producción:

- [ ] Credenciales de PRODUCCIÓN configuradas
- [ ] Webhook URL apuntando a dominio real
- [ ] HTTPS habilitado con certificado válido
- [ ] Firewall permite IPs de Mercado Pago
- [ ] Logs agregados a observabilidad (Datadog, Sentry)
- [ ] Alerts configuradas para errores de payment
- [ ] Backup de payment-store.json configurado
- [ ] Rollback plan documentado
- [ ] Manual testing en staging completado
- [ ] Stakeholders notificados

---

## 📚 Recursos Útiles

- **Mercado Pago API Docs:** https://www.mercadopago.com.ar/developers/es/reference
- **Webhook Testing:** https://webhook.site
- **Load Testing:** https://www.artillery.io/docs
- **Vitest Docs:** https://vitest.dev
- **Next.js App Router:** https://nextjs.org/docs/app

---

**Última actualización:** {{CURRENT_DATE}}  
**Autor:** @code-agent, @backend-agent, @frontend-agent, @test-agent  
**Estado:** ✅ Fase 1 completada, Fases 2-4 pendientes
