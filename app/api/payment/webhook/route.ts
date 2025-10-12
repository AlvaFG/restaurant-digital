/**
 * MercadoPago Webhook Handler
 * POST /api/payment/webhook
 * Receives IPN notifications from MercadoPago
 */

import { NextRequest, NextResponse } from 'next/server'
import { paymentService } from '@/lib/payment-service'
import { MOCK_ORDERS, type Order } from '@/lib/mock-data'
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
    const order = MOCK_ORDERS.find((o: Order) => o.id === payment.orderId)
    if (!order) {
      console.error('❌ Order not found for payment:', payment.orderId)
      return NextResponse.json({ error: 'Order not found' }, { status: 404 })
    }

    // Update order based on payment status
    // Note: Order type doesn't have paymentId/paidAt fields, so we need to extend or use partial updates
    const updatedOrder: Partial<Order> & Pick<Order, 'id' | 'tableId' | 'items' | 'subtotal' | 'total' | 'status' | 'paymentStatus' | 'createdAt'> = { 
      ...order,
    }

    switch (payment.status) {
      case 'approved':
        updatedOrder.paymentStatus = 'pagado'
        updatedOrder.status = 'preparando' // Auto-confirm paid orders
        console.log('✅ Payment approved, order confirmed')
        break

      case 'rejected':
        updatedOrder.paymentStatus = 'cancelado'
        console.log('❌ Payment rejected')
        break

      case 'pending':
        updatedOrder.paymentStatus = 'pendiente'
        console.log('⏳ Payment pending')
        break

      case 'refunded':
        updatedOrder.paymentStatus = 'cancelado'
        updatedOrder.status = 'cerrado'
        console.log('💸 Payment refunded')
        break
    }

    // Save updated order (in production, save to database)
    const orderIndex = MOCK_ORDERS.findIndex((o: Order) => o.id === order.id)
    if (orderIndex !== -1) {
      MOCK_ORDERS[orderIndex] = updatedOrder as Order
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
export async function GET(_request: NextRequest) {
  return NextResponse.json({ message: 'Webhook endpoint active' })
}
