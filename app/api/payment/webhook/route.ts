/**
 * MercadoPago Webhook Handler
 * POST /api/payment/webhook
 * Receives IPN notifications from MercadoPago
 */

import { NextRequest, NextResponse } from 'next/server'
import { paymentService } from '@/lib/payment-service'
import { MOCK_ORDERS } from '@/lib/mock-data'
import type { PaymentWebhook } from '@/lib/payment-types'

export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  try {
    const webhook: PaymentWebhook = await request.json()

    console.log('🔔 MercadoPago Webhook received:', {
      type: webhook.type,
      action: webhook.action,
      data: webhook.data,
    })

    // Only process payment notifications
    if (webhook.type !== 'payment') {
      console.log('ℹ️ Skipping non-payment webhook')
      return NextResponse.json({ received: true })
    }

    // Get payment details from MercadoPago
    const paymentId = webhook.data.id
    const payment = await paymentService.verifyPayment(paymentId)

    console.log('💳 Payment verified:', {
      id: payment.id,
      orderId: payment.orderId,
      status: payment.status,
      amount: payment.amount,
    })

    // Get associated order
    const order = MOCK_ORDERS.find((o: any) => o.id === payment.orderId)
    if (!order) {
      console.error('❌ Order not found for payment:', payment.orderId)
      return NextResponse.json({ error: 'Order not found' }, { status: 404 })
    }

    // Update order based on payment status
    const updatedOrder: any = { ...order }

    switch (payment.status) {
      case 'approved':
        updatedOrder.paymentStatus = 'completed'
        updatedOrder.paymentId = payment.id
        updatedOrder.paidAt = new Date().toISOString()
        updatedOrder.status = 'confirmed' // Auto-confirm paid orders
        console.log('✅ Payment approved, order confirmed')
        break

      case 'rejected':
        updatedOrder.paymentStatus = 'failed'
        updatedOrder.paymentId = payment.id
        console.log('❌ Payment rejected')
        break

      case 'pending':
        updatedOrder.paymentStatus = 'processing'
        updatedOrder.paymentId = payment.id
        console.log('⏳ Payment pending')
        break

      case 'refunded':
        updatedOrder.paymentStatus = 'refunded'
        updatedOrder.status = 'cancelled'
        console.log('💸 Payment refunded')
        break
    }

    // Save updated order (in production, save to database)
    const orderIndex = MOCK_ORDERS.findIndex((o: any) => o.id === order.id)
    if (orderIndex !== -1) {
      (MOCK_ORDERS as any)[orderIndex] = updatedOrder
    }

    console.log(`✓ Order ${order.id} payment status: ${payment.status}`)

    return NextResponse.json({ received: true })
  } catch (error) {
    console.error('❌ Webhook processing error:', error)
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : 'Webhook processing failed',
      },
      { status: 500 }
    )
  }
}

// Handle GET requests (MercadoPago sometimes sends GET for webhook validation)
export async function GET(request: NextRequest) {
  return NextResponse.json({ message: 'Webhook endpoint active' })
}
