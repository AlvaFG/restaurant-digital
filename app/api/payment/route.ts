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
import { logRequest, logResponse, validarBody } from '@/lib/api-helpers'
import { logger } from '@/lib/logger'
import { MENSAJES } from '@/lib/i18n/mensajes'

/**
 * POST /api/payment
 * Crear nuevo payment para una orden
 */
export async function POST(request: NextRequest) {
  const startTime = Date.now()
  
  try {
    logRequest('POST', '/api/payment')
    
    const payload = await validarBody<CreatePaymentPayload>(request)

    // Validar payload
    if (!payload.orderId) {
      logger.warn('orderId faltante en creación de pago')
      throw new PaymentError(
        'orderId is required',
        PAYMENT_ERROR_CODES.INVALID_PAYLOAD,
        400
      )
    }

    // Verificar que orden existe - buscar por search que incluye el ID
    logger.debug('Verificando existencia de orden', { orderId: payload.orderId })
    const orders = await listOrders({ search: payload.orderId, limit: 1 })
    const order = orders.find(o => o.id === payload.orderId)
    
    if (!order) {
      logger.warn('Orden no encontrada para pago', { orderId: payload.orderId })
      throw new PaymentError(
        `Order not found: ${payload.orderId}`,
        PAYMENT_ERROR_CODES.ORDER_NOT_FOUND,
        404
      )
    }

    // Verificar que orden no tenga payment activo
    const hasActive = await paymentStore.hasActivePayment(payload.orderId)
    if (hasActive) {
      logger.warn('La orden ya tiene un pago activo', { orderId: payload.orderId })
      throw new PaymentError(
        'Order already has an active payment',
        PAYMENT_ERROR_CODES.PAYMENT_IN_PROGRESS,
        409
      )
    }

    // Crear payment en Mercado Pago
    logger.info('Creando pago en Mercado Pago', { 
      orderId: order.id,
      amount: order.total,
      tableId: order.tableId
    })
    
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

    const duration = Date.now() - startTime
    logResponse('POST', '/api/payment', 201, duration)
    
    // Log de auditoría SIN datos sensibles
    logger.info('Pago creado exitosamente', { 
      paymentId: payment.id,
      orderId: order.id,
      amount: order.total,
      provider: 'mercadopago',
      duration: `${duration}ms`
    })

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
    const duration = Date.now() - startTime
    
    if (error instanceof PaymentError) {
      logResponse('POST', '/api/payment', error.status, duration)
      logger.error('Error de pago', error, { code: error.code })
      
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

    logResponse('POST', '/api/payment', 500, duration)
    logger.error('Error interno al crear pago', error as Error)

    return NextResponse.json(
      {
        error: {
          message: MENSAJES.ERRORES.GENERICO,
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
  const startTime = Date.now()
  
  try {
    const { searchParams } = new URL(request.url)
    logRequest('GET', '/api/payment', Object.fromEntries(searchParams))

    const filters = {
      orderId: searchParams.get('orderId') || undefined,
      tableId: searchParams.get('tableId') || undefined,
      status: (searchParams.get('status') as unknown) as import('@/lib/server/payment-types').PaymentStatus || undefined,
      provider: (searchParams.get('provider') as unknown) as import('@/lib/server/payment-types').PaymentProvider || undefined,
      search: searchParams.get('search') || undefined,
      limit: parseInt(searchParams.get('limit') || '50', 10),
      sort: (searchParams.get('sort') || 'newest') as 'newest' | 'oldest',
    }

    logger.debug('Obteniendo lista de pagos', { filters })
    
    const payments = await paymentStore.list(filters)
    const summary = await paymentStore.getSummary()

    const duration = Date.now() - startTime
    logResponse('GET', '/api/payment', 200, duration)
    
    logger.info('Pagos obtenidos', { 
      count: payments.length,
      duration: `${duration}ms`
    })

    return NextResponse.json({
      data: payments.map(serializePayment),
      metadata: {
        total: payments.length,
        summary,
      },
    })
  } catch (error) {
    const duration = Date.now() - startTime
    logResponse('GET', '/api/payment', 500, duration)
    
    logger.error('Error al obtener pagos', error as Error)

    return NextResponse.json(
      {
        error: {
          message: MENSAJES.ERRORES.GENERICO,
          code: PAYMENT_ERROR_CODES.INTERNAL_ERROR,
        },
      },
      { status: 500 }
    )
  }
}
