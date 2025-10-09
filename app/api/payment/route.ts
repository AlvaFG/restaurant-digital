import { NextRequest, NextResponse } from 'next/server'
import { paymentStore } from '@/lib/server/payment-store'
import { listOrders } from '@/lib/server/order-store'
import { MercadoPagoProvider } from '@/lib/server/providers/mercadopago-provider'
import { getMercadoPagoConfig, getPaymentConfig } from '@/lib/server/payment-config'
import { 
  PaymentError, 
  PAYMENT_ERROR_CODES,
  type CreatePaymentPayload,
  serializePayment,
} from '@/lib/server/payment-types'

/**
 * POST /api/payment
 * Crear nuevo payment para una orden
 */
export async function POST(request: NextRequest) {
  try {
    const payload: CreatePaymentPayload = await request.json()

    // Validar payload
    if (!payload.orderId) {
      throw new PaymentError(
        'orderId is required',
        PAYMENT_ERROR_CODES.INVALID_PAYLOAD,
        400
      )
    }

    // Verificar que orden existe - buscar por search que incluye el ID
    const orders = await listOrders({ search: payload.orderId, limit: 1 })
    const order = orders.find(o => o.id === payload.orderId)
    
    if (!order) {
      throw new PaymentError(
        `Order not found: ${payload.orderId}`,
        PAYMENT_ERROR_CODES.ORDER_NOT_FOUND,
        404
      )
    }

    // Verificar que orden no tenga payment activo
    const hasActive = await paymentStore.hasActivePayment(payload.orderId)
    if (hasActive) {
      throw new PaymentError(
        'Order already has an active payment',
        PAYMENT_ERROR_CODES.PAYMENT_IN_PROGRESS,
        409
      )
    }

    // Crear payment en Mercado Pago
    const config = getMercadoPagoConfig()
    const paymentConfig = getPaymentConfig()
    const provider = new MercadoPagoProvider(config, paymentConfig.webhookUrl)

    const result = await provider.createPayment({
      amount: order.total,
      currency: 'ARS',
      orderId: order.id,
      description: `Pedido #${order.id} - Mesa ${order.tableId}`,
      customerEmail: payload.metadata?.customerEmail,
      customerName: payload.metadata?.customerName,
      returnUrl: payload.returnUrl || paymentConfig.returnUrl,
      failureUrl: payload.failureUrl || paymentConfig.failureUrl,
      metadata: {
        tableId: order.tableId,
        ...payload.metadata?.custom,
      },
    })

    // Guardar payment en store
    const payment = await paymentStore.create({
      orderId: order.id,
      tableId: order.tableId,
      provider: 'mercadopago',
      amount: order.total,
      currency: 'ARS',
      externalId: result.externalId,
      checkoutUrl: result.checkoutUrl,
      expiresAt: result.expiresAt,
      metadata: {
        customerEmail: payload.metadata?.customerEmail,
        customerName: payload.metadata?.customerName,
        reference: payload.metadata?.reference,
        returnUrl: payload.returnUrl,
        failureUrl: payload.failureUrl,
      },
    })

    console.log(`[API] Payment created: ${payment.id} for order ${order.id}`)

    return NextResponse.json(
      {
        data: {
          paymentId: payment.id,
          checkoutUrl: payment.checkoutUrl!,
          status: payment.status,
          expiresAt: payment.expiresAt?.toISOString(),
        },
        metadata: {
          provider: payment.provider,
          createdAt: payment.createdAt.toISOString(),
        },
      },
      { status: 201 }
    )
  } catch (error) {
    console.error('[API] Payment creation error:', error)

    if (error instanceof PaymentError) {
      return NextResponse.json(
        {
          error: {
            message: error.message,
            code: error.code,
          },
        },
        { status: error.status }
      )
    }

    return NextResponse.json(
      {
        error: {
          message: 'Internal server error',
          code: PAYMENT_ERROR_CODES.INTERNAL_ERROR,
        },
      },
      { status: 500 }
    )
  }
}

/**
 * GET /api/payment
 * Listar payments con filtros
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)

    const filters = {
      orderId: searchParams.get('orderId') || undefined,
      tableId: searchParams.get('tableId') || undefined,
      status: (searchParams.get('status') as unknown) as import('@/lib/server/payment-types').PaymentStatus || undefined,
      provider: (searchParams.get('provider') as unknown) as import('@/lib/server/payment-types').PaymentProvider || undefined,
      search: searchParams.get('search') || undefined,
      limit: parseInt(searchParams.get('limit') || '50', 10),
      sort: (searchParams.get('sort') || 'newest') as 'newest' | 'oldest',
    }

    const payments = await paymentStore.list(filters)
    const summary = await paymentStore.getSummary()

    return NextResponse.json({
      data: payments.map(serializePayment),
      metadata: {
        total: payments.length,
        summary,
      },
    })
  } catch (error) {
    console.error('[API] Payment list error:', error)

    return NextResponse.json(
      {
        error: {
          message: 'Failed to fetch payments',
          code: PAYMENT_ERROR_CODES.INTERNAL_ERROR,
        },
      },
      { status: 500 }
    )
  }
}
