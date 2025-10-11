/**
 * Payment Creation Endpoint
 * POST /api/payment/create
 * Creates a MercadoPago payment preference for an order
 */

import { NextRequest, NextResponse } from 'next/server'
import { paymentService } from '@/lib/payment-service'
import { isConfigured } from '@/lib/mercadopago'
import { MOCK_ORDERS } from '@/lib/mock-data'

export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  try {
    // Check if MercadoPago is configured
    if (!isConfigured()) {
      return NextResponse.json(
        {
          success: false,
          error: 'Payment system not configured. Please set MERCADOPAGO_ACCESS_TOKEN.',
        },
        { status: 503 }
      )
    }

    const body = await request.json()
    const { orderId } = body

    if (!orderId) {
      return NextResponse.json(
        {
          success: false,
          error: 'Order ID is required',
        },
        { status: 400 }
      )
    }

    // Get order from mock data (in production, fetch from database)
    const order = MOCK_ORDERS.find((o: any) => o.id === orderId)

    if (!order) {
      return NextResponse.json(
        {
          success: false,
          error: 'Order not found',
        },
        { status: 404 }
      )
    }

    // Validate order can be paid
    const validation = paymentService.canProcessPayment(order as any)
    if (!validation.valid) {
      return NextResponse.json(
        {
          success: false,
          error: validation.error,
        },
        { status: 400 }
      )
    }

    // Create payment preference
    const payment = await paymentService.createOrderPayment(order as any)

    // Update order with payment info (in production, save to database)
    const updatedOrder = {
      ...order,
      paymentUrl: payment.initPoint,
      paymentStatus: 'pending' as const,
    }

    // In production: await saveOrder(updatedOrder)
    const orderIndex = MOCK_ORDERS.findIndex((o: any) => o.id === orderId)
    if (orderIndex !== -1) {
      (MOCK_ORDERS as any)[orderIndex] = updatedOrder
    }

    return NextResponse.json({
      success: true,
      data: {
        orderId: order.id,
        preferenceId: payment.preferenceId,
        initPoint: payment.initPoint,
        sandboxInitPoint: payment.sandboxInitPoint,
      },
    })
  } catch (error) {
    console.error('Payment creation error:', error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to create payment',
      },
      { status: 500 }
    )
  }
}
