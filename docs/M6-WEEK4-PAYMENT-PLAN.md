# M6 Week 4 - Payment Integration Plan

## 📋 Overview

**Timeline**: Days 16-17 (2 days)  
**Focus**: Payment system integration for Argentine market  
**Goal**: Allow customers to pay orders via multiple payment methods  

---

## 🎯 Objectives

1. ✅ Research best payment provider for Argentina
2. ⬜ Set up payment provider account (sandbox)
3. ⬜ Create backend payment endpoints
4. ⬜ Implement webhook handler for payment confirmation
5. ⬜ Build frontend payment form UI
6. ⬜ Integrate payment flow with checkout
7. ⬜ Test payment scenarios (success, failure, pending)
8. ⬜ Handle edge cases (timeout, network error)

---

## 🔍 Payment Provider Research

### Option 1: MercadoPago (Recommended for Argentina) ✅

**Pros**:
- 🇦🇷 **Native to Argentina** - most popular in LATAM
- 💳 Accepts local payment methods (Rapipago, Pago Fácil, etc.)
- 💰 Lower fees for Argentine merchants
- 🏦 Easy bank account integration in ARS
- 📱 Mobile-first design (matches our use case)
- 🔒 Strong fraud protection
- 📚 Good documentation in Spanish
- ⚡ Fast settlement (24-48h)

**Cons**:
- Limited outside Latin America
- API slightly less mature than Stripe

**Fees**:
- 3.99% + ARS $3.99 per transaction (QR payments)
- No monthly fees
- No setup fees

**Integration Complexity**: Medium (REST API, webhooks)

**Recommendation**: **USE THIS** for Argentine restaurant

---

### Option 2: Stripe

**Pros**:
- 🌍 Global coverage
- 🛠️ Best developer experience
- 📚 Excellent documentation
- 🎨 Beautiful pre-built UI components
- 🔒 Industry-leading security
- 📊 Advanced analytics dashboard

**Cons**:
- ❌ **Limited Argentine support** (only credit cards)
- ❌ No local payment methods (no Rapipago, etc.)
- 💸 Higher fees for international transactions
- 🏦 Harder to get ARS payouts

**Fees**:
- 2.9% + $0.30 per transaction (US)
- Cross-border fees apply for Argentina

**Integration Complexity**: Easy (excellent SDK)

**Recommendation**: Use if expanding internationally later

---

### Decision: MercadoPago ✅

**Reasoning**:
1. Target market is Argentina
2. Customers expect local payment methods
3. Lower fees for local transactions
4. Faster ARS settlements
5. Better customer trust in Argentina

---

## 🏗️ Architecture Design

### Payment Flow

```
Customer                  Frontend                Backend                 MercadoPago
   |                         |                       |                         |
   |-- Fill checkout ------->|                       |                         |
   |                         |-- Create order ------>|                         |
   |                         |                       |-- Create preference --->|
   |                         |                       |<---- Return init_point--|
   |                         |<-- Return payment URL-|                         |
   |-- Redirect to MP ------>|                       |                         |
   |                         |                       |                         |
   |<======================== MercadoPago Checkout ==========================>|
   |                         |                       |                         |
   |                         |                       |<----- Webhook (IPN) ----|
   |                         |                       |-- Verify payment ------>|
   |                         |                       |<---- Payment details ---|
   |                         |                       |-- Update order status ->|
   |                         |                       |                         |
   |<-- Redirect to success--|                       |                         |
   |                         |                       |                         |
```

### Database Schema Changes

```typescript
// Update Order model
interface Order {
  id: string
  tableId: string
  sessionId: string
  items: OrderItem[]
  customerName: string
  customerContact: string
  paymentMethod: 'cash' | 'card' | 'mercadopago' | 'transfer'
  paymentStatus: 'pending' | 'processing' | 'completed' | 'failed' | 'refunded' // NEW
  paymentId?: string // NEW - MercadoPago payment ID
  paymentUrl?: string // NEW - MercadoPago checkout URL
  totalCents: number
  status: 'pending' | 'confirmed' | 'preparing' | 'ready' | 'delivered' | 'cancelled'
  specialNotes?: string
  createdAt: string
  updatedAt: string
  paidAt?: string // NEW
}

// New Payment model
interface Payment {
  id: string // MercadoPago payment ID
  orderId: string
  amount: number
  currency: 'ARS'
  status: 'pending' | 'approved' | 'rejected' | 'cancelled' | 'refunded'
  paymentMethod: string // 'credit_card', 'debit_card', 'rapipago', etc.
  merchantOrderId: string
  preferenceId: string
  externalReference: string // Our order ID
  metadata: Record<string, any>
  createdAt: string
  updatedAt: string
}
```

---

## 📁 File Structure

```
app/api/
  payment/
    create/
      route.ts          # POST - Create MercadoPago preference
    webhook/
      route.ts          # POST - Handle MercadoPago IPN notifications
    verify/
      route.ts          # GET - Verify payment status
    refund/
      route.ts          # POST - Process refund (admin only)
    __tests__/
      payment-api.test.ts

lib/
  mercadopago.ts        # MercadoPago SDK wrapper
  payment-service.ts    # Payment business logic
  payment-types.ts      # Payment TypeScript types

components/
  payment-form.tsx      # Payment method selector
  payment-status.tsx    # Payment status display
  mercadopago-button.tsx # "Pagar con MercadoPago" button

app/(public)/qr/[tableId]/
  payment/
    page.tsx            # Payment processing page
    success/
      page.tsx          # Payment success page
    failure/
      page.tsx          # Payment failure page
```

---

## 🔧 Implementation Steps

### Day 16: Backend + MercadoPago Setup

#### Step 1: MercadoPago Account Setup (30 min)
- [ ] Sign up at https://www.mercadopago.com.ar/developers
- [ ] Create application
- [ ] Get test credentials (Access Token, Public Key)
- [ ] Configure webhook URL (ngrok for local testing)
- [ ] Test credentials in Postman

#### Step 2: Install Dependencies (5 min)
```bash
npm install mercadopago
npm install -D @types/mercadopago
```

#### Step 3: Environment Variables (5 min)
```env
# .env.local
MERCADOPAGO_ACCESS_TOKEN=TEST-1234567890-XXXXXX-XXXXXXXXXXXXXX
MERCADOPAGO_PUBLIC_KEY=TEST-xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx
MERCADOPAGO_WEBHOOK_SECRET=your_webhook_secret
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

#### Step 4: MercadoPago SDK Wrapper (30 min)
**File**: `lib/mercadopago.ts`

```typescript
import mercadopago from 'mercadopago'

// Configure MercadoPago
mercadopago.configure({
  access_token: process.env.MERCADOPAGO_ACCESS_TOKEN!,
})

export interface CreatePreferenceInput {
  orderId: string
  items: Array<{
    title: string
    quantity: number
    unit_price: number
    currency_id: 'ARS'
  }>
  payer: {
    name: string
    email?: string
    phone?: string
  }
  back_urls: {
    success: string
    failure: string
    pending: string
  }
  notification_url: string
  external_reference: string
  metadata: Record<string, any>
}

export async function createPaymentPreference(input: CreatePreferenceInput) {
  const preference = await mercadopago.preferences.create({
    items: input.items,
    payer: input.payer,
    back_urls: input.back_urls,
    notification_url: input.notification_url,
    external_reference: input.external_reference,
    metadata: input.metadata,
    auto_return: 'approved',
    binary_mode: true, // Only approved or rejected (no pending)
  })

  return preference.body
}

export async function getPayment(paymentId: string) {
  const payment = await mercadopago.payment.get(paymentId)
  return payment.body
}

export async function refundPayment(paymentId: string) {
  const refund = await mercadopago.payment.refund(paymentId)
  return refund.body
}

export default mercadopago
```

#### Step 5: Payment Service (45 min)
**File**: `lib/payment-service.ts`

```typescript
import { createPaymentPreference, getPayment } from './mercadopago'
import { Order, Payment } from './payment-types'

export class PaymentService {
  private baseUrl: string

  constructor() {
    this.baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
  }

  async createOrderPayment(order: Order): Promise<{
    preferenceId: string
    initPoint: string
  }> {
    // Convert order to MercadoPago format
    const items = order.items.map(item => ({
      title: `${item.name} x${item.quantity}`,
      quantity: 1,
      unit_price: order.totalCents / 100, // Convert cents to ARS
      currency_id: 'ARS' as const,
    }))

    // Create preference
    const preference = await createPaymentPreference({
      orderId: order.id,
      items,
      payer: {
        name: order.customerName,
        email: order.customerContact.includes('@') 
          ? order.customerContact 
          : undefined,
        phone: !order.customerContact.includes('@') 
          ? order.customerContact 
          : undefined,
      },
      back_urls: {
        success: `${this.baseUrl}/qr/${order.tableId}/payment/success`,
        failure: `${this.baseUrl}/qr/${order.tableId}/payment/failure`,
        pending: `${this.baseUrl}/qr/${order.tableId}/payment/pending`,
      },
      notification_url: `${this.baseUrl}/api/payment/webhook`,
      external_reference: order.id,
      metadata: {
        orderId: order.id,
        tableId: order.tableId,
        sessionId: order.sessionId,
      },
    })

    return {
      preferenceId: preference.id,
      initPoint: preference.init_point,
    }
  }

  async verifyPayment(paymentId: string): Promise<Payment> {
    const payment = await getPayment(paymentId)

    return {
      id: payment.id.toString(),
      orderId: payment.external_reference,
      amount: payment.transaction_amount,
      currency: payment.currency_id,
      status: this.mapPaymentStatus(payment.status),
      paymentMethod: payment.payment_type_id,
      merchantOrderId: payment.merchant_order_id?.toString() || '',
      preferenceId: payment.preference_id || '',
      externalReference: payment.external_reference,
      metadata: payment.metadata,
      createdAt: payment.date_created,
      updatedAt: payment.date_last_updated,
    }
  }

  private mapPaymentStatus(mpStatus: string): Payment['status'] {
    const statusMap: Record<string, Payment['status']> = {
      'pending': 'pending',
      'approved': 'approved',
      'authorized': 'approved',
      'in_process': 'pending',
      'in_mediation': 'pending',
      'rejected': 'rejected',
      'cancelled': 'cancelled',
      'refunded': 'refunded',
      'charged_back': 'refunded',
    }

    return statusMap[mpStatus] || 'pending'
  }
}

export const paymentService = new PaymentService()
```

#### Step 6: Payment Types (15 min)
**File**: `lib/payment-types.ts`

```typescript
export interface Payment {
  id: string
  orderId: string
  amount: number
  currency: 'ARS' | 'USD'
  status: 'pending' | 'approved' | 'rejected' | 'cancelled' | 'refunded'
  paymentMethod: string
  merchantOrderId: string
  preferenceId: string
  externalReference: string
  metadata: Record<string, any>
  createdAt: string
  updatedAt: string
}

export interface PaymentWebhook {
  action: string
  api_version: string
  data: {
    id: string
  }
  date_created: string
  id: number
  live_mode: boolean
  type: 'payment' | 'merchant_order'
  user_id: string
}

export type PaymentStatus = Payment['status']
```

#### Step 7: Create Payment Endpoint (30 min)
**File**: `app/api/payment/create/route.ts`

```typescript
import { NextRequest, NextResponse } from 'next/server'
import { paymentService } from '@/lib/payment-service'
import { getOrderById } from '@/lib/order-service'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { orderId } = body

    if (!orderId) {
      return NextResponse.json(
        { error: 'Order ID is required' },
        { status: 400 }
      )
    }

    // Get order
    const order = await getOrderById(orderId)
    if (!order) {
      return NextResponse.json(
        { error: 'Order not found' },
        { status: 404 }
      )
    }

    // Create payment preference
    const payment = await paymentService.createOrderPayment(order)

    // Update order with payment info
    order.paymentUrl = payment.initPoint
    order.paymentStatus = 'pending'
    // Save order... (implement based on your storage)

    return NextResponse.json({
      success: true,
      data: {
        orderId: order.id,
        preferenceId: payment.preferenceId,
        initPoint: payment.initPoint,
      },
    })
  } catch (error) {
    console.error('Payment creation error:', error)
    return NextResponse.json(
      { error: 'Failed to create payment' },
      { status: 500 }
    )
  }
}
```

#### Step 8: Webhook Handler (45 min)
**File**: `app/api/payment/webhook/route.ts`

```typescript
import { NextRequest, NextResponse } from 'next/server'
import { paymentService } from '@/lib/payment-service'
import { getOrderById, updateOrderStatus } from '@/lib/order-service'
import { PaymentWebhook } from '@/lib/payment-types'

export async function POST(request: NextRequest) {
  try {
    const webhook: PaymentWebhook = await request.json()

    console.log('MercadoPago Webhook received:', webhook)

    // Only process payment notifications
    if (webhook.type !== 'payment') {
      return NextResponse.json({ received: true })
    }

    // Get payment details
    const paymentId = webhook.data.id
    const payment = await paymentService.verifyPayment(paymentId)

    // Get associated order
    const order = await getOrderById(payment.orderId)
    if (!order) {
      console.error('Order not found for payment:', payment.orderId)
      return NextResponse.json({ error: 'Order not found' }, { status: 404 })
    }

    // Update order based on payment status
    switch (payment.status) {
      case 'approved':
        order.paymentStatus = 'completed'
        order.paymentId = payment.id
        order.paidAt = new Date().toISOString()
        order.status = 'confirmed' // Auto-confirm paid orders
        break

      case 'rejected':
        order.paymentStatus = 'failed'
        order.paymentId = payment.id
        break

      case 'pending':
        order.paymentStatus = 'processing'
        order.paymentId = payment.id
        break

      case 'refunded':
        order.paymentStatus = 'refunded'
        order.status = 'cancelled'
        break
    }

    // Save updated order
    await updateOrderStatus(order)

    console.log(`Order ${order.id} payment status: ${payment.status}`)

    return NextResponse.json({ received: true })
  } catch (error) {
    console.error('Webhook processing error:', error)
    return NextResponse.json(
      { error: 'Webhook processing failed' },
      { status: 500 }
    )
  }
}
```

---

### Day 17: Frontend Integration

#### Step 9: Payment Button Component (30 min)
**File**: `components/mercadopago-button.tsx`

```typescript
'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { CreditCard, Loader2 } from 'lucide-react'

interface MercadoPagoButtonProps {
  orderId: string
  amount: number
  onSuccess?: () => void
  onError?: (error: Error) => void
}

export function MercadoPagoButton({
  orderId,
  amount,
  onSuccess,
  onError,
}: MercadoPagoButtonProps) {
  const [isLoading, setIsLoading] = useState(false)

  const handlePayment = async () => {
    try {
      setIsLoading(true)

      // Create payment preference
      const response = await fetch('/api/payment/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderId }),
      })

      if (!response.ok) {
        throw new Error('Failed to create payment')
      }

      const { data } = await response.json()

      // Redirect to MercadoPago checkout
      window.location.href = data.initPoint
    } catch (error) {
      console.error('Payment error:', error)
      onError?.(error as Error)
      setIsLoading(false)
    }
  }

  return (
    <Button
      onClick={handlePayment}
      disabled={isLoading}
      className="w-full bg-[#00B1EA] hover:bg-[#009DD1] text-white"
      size="lg"
    >
      {isLoading ? (
        <>
          <Loader2 className="mr-2 h-5 w-5 animate-spin" />
          Procesando...
        </>
      ) : (
        <>
          <CreditCard className="mr-2 h-5 w-5" />
          Pagar con MercadoPago (${(amount / 100).toFixed(2)})
        </>
      )}
    </Button>
  )
}
```

#### Step 10: Payment Success Page (20 min)
**File**: `app/(public)/qr/[tableId]/payment/success/page.tsx`

```typescript
import { CheckCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import Link from 'next/link'

export default function PaymentSuccessPage({
  params,
  searchParams,
}: {
  params: { tableId: string }
  searchParams: { payment_id?: string; external_reference?: string }
}) {
  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="max-w-md w-full text-center space-y-6">
        <CheckCircle className="w-20 h-20 text-green-500 mx-auto" />
        
        <h1 className="text-3xl font-bold">¡Pago exitoso!</h1>
        
        <p className="text-muted-foreground">
          Tu pago ha sido procesado correctamente. 
          Tu pedido será preparado pronto.
        </p>

        {searchParams.external_reference && (
          <div className="bg-muted p-4 rounded-lg">
            <p className="text-sm text-muted-foreground">Número de orden</p>
            <p className="font-mono font-bold">
              #{searchParams.external_reference.slice(0, 8).toUpperCase()}
            </p>
          </div>
        )}

        <div className="space-y-2">
          <Button asChild className="w-full" size="lg">
            <Link href={`/qr/${params.tableId}`}>
              Volver al menú
            </Link>
          </Button>
        </div>
      </div>
    </div>
  )
}
```

#### Step 11: Payment Failure Page (20 min)
**File**: `app/(public)/qr/[tableId]/payment/failure/page.tsx`

```typescript
import { XCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import Link from 'next/link'

export default function PaymentFailurePage({
  params,
}: {
  params: { tableId: string }
}) {
  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="max-w-md w-full text-center space-y-6">
        <XCircle className="w-20 h-20 text-red-500 mx-auto" />
        
        <h1 className="text-3xl font-bold">Pago rechazado</h1>
        
        <p className="text-muted-foreground">
          Tu pago no pudo ser procesado. 
          Por favor intenta nuevamente o elige otro método de pago.
        </p>

        <div className="space-y-2">
          <Button asChild className="w-full" size="lg" variant="default">
            <Link href={`/qr/${params.tableId}`}>
              Intentar de nuevo
            </Link>
          </Button>
          
          <Button asChild className="w-full" size="lg" variant="outline">
            <Link href={`/qr/${params.tableId}`}>
              Volver al menú
            </Link>
          </Button>
        </div>
      </div>
    </div>
  )
}
```

#### Step 12: Integrate Payment in Checkout (30 min)

Update `QrOrderConfirmation` to show payment option:

```typescript
// Add to qr-order-confirmation.tsx

<div className="space-y-4">
  <div className="flex items-center gap-2 text-green-600">
    <CheckCircle className="h-8 w-8" />
    <span className="text-xl font-semibold">¡Pedido confirmado!</span>
  </div>

  {/* Existing content... */}

  {/* NEW: Payment section */}
  {order.paymentMethod === 'mercadopago' && order.paymentStatus === 'pending' && (
    <div className="border-t pt-4 space-y-3">
      <p className="text-sm text-muted-foreground">
        Completa tu pago para confirmar el pedido:
      </p>
      <MercadoPagoButton
        orderId={order.id}
        amount={order.totalCents}
      />
    </div>
  )}

  {order.paymentStatus === 'completed' && (
    <div className="bg-green-50 border border-green-200 rounded-lg p-3">
      <p className="text-sm text-green-800 font-medium">
        ✓ Pago completado
      </p>
    </div>
  )}
</div>
```

---

## 🧪 Testing Checklist

### Unit Tests
- [ ] Payment service createOrderPayment
- [ ] Payment service verifyPayment
- [ ] Status mapping function
- [ ] Payment validation

### Integration Tests
- [ ] Create payment endpoint
- [ ] Webhook handler
- [ ] Payment verification endpoint
- [ ] Order status updates after payment

### Manual Tests
- [ ] Create payment preference
- [ ] Complete payment with test card
- [ ] Webhook delivery and processing
- [ ] Success page redirect
- [ ] Failure page redirect
- [ ] Pending payment handling
- [ ] Refund process (admin)

### Test Cards (MercadoPago Sandbox)
- **Approved**: 4509 9535 6623 3704
- **Rejected**: 4000 0000 0000 0002
- **Pending**: 4000 0000 0000 0010

---

## 🔒 Security Considerations

1. **Webhook Verification**: Validate webhook signatures
2. **HTTPS Only**: Enforce HTTPS in production
3. **Environment Variables**: Never commit API keys
4. **Input Validation**: Validate all payment data
5. **Rate Limiting**: Limit payment creation attempts
6. **Idempotency**: Prevent duplicate payments
7. **Audit Logs**: Log all payment events

---

## 📊 Success Metrics

- [ ] Payment creation success rate > 95%
- [ ] Webhook delivery success rate > 98%
- [ ] Average payment time < 2 minutes
- [ ] Failed payment recovery rate > 30%
- [ ] Zero security incidents

---

## 🚀 Next Steps After Payment

After completing payment integration:
1. Move to **Week 4 Day 18-20**: Admin Analytics Dashboard
2. Build sales metrics and reporting
3. Create admin interface for payment management
4. Set up database for analytics

---

*Plan created: October 11, 2025*  
*Part of M6 Week 4 - Payment & Admin Analytics*
