import { NextRequest, NextResponse } from 'next/server'
import { createPayment as createPaymentService, getPayments as getPaymentsService, getPaymentsStats } from '@/lib/services/payments-service'
import { getOrderById } from '@/lib/services/orders-service'
import { MercadoPagoProvider } from '@/lib/server/providers/mercadopago-provider'
import { getMercadoPagoConfig, getPaymentConfig } from '@/lib/server/payment-config'
import { 
  PaymentError, 
  PAYMENT_ERROR_CODES,
  type CreatePaymentPayload,
} from '@/lib/server/payment-types'
import { logRequest, logResponse, validarBody } from '@/lib/api-helpers'
import { logger } from '@/lib/logger'
import { MENSAJES } from '@/lib/i18n/mensajes'
import { getCurrentUser } from '@/lib/supabase/server'
import type { User } from "@supabase/supabase-js"

/**
 * Extract tenantId from Supabase Auth User
 */
function getTenantIdFromUser(user: User): string | null {
  return user.user_metadata?.tenant_id || null
}

export async function POST(request: NextRequest) {
  const startTime = Date.now()
  
  try {
    // Obtener usuario actual
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json(
        { error: 'No autenticado' },
        { status: 401 }
      )
    }

    // Obtener tenant_id del usuario
    const tenantId = getTenantIdFromUser(user)
    if (!tenantId) {
      return NextResponse.json(
        { error: 'Usuario sin tenant asignado' },
        { status: 403 }
      )
    }

    logRequest('POST', '/api/payment', { tenantId })
    
    const payload = await validarBody<CreatePaymentPayload>(request)

    // Validar payload
    if (!payload.orderId) {
      logger.warn('orderId faltante en creación de pago', { tenantId })
      throw new PaymentError(
        'orderId is required',
        PAYMENT_ERROR_CODES.INVALID_PAYLOAD,
        400
      )
    }

    // Verificar que orden existe usando Supabase
    logger.debug('Verificando existencia de orden', { orderId: payload.orderId, tenantId })
    const { data: order, error: orderError } = await getOrderById(payload.orderId, tenantId)
    
    if (orderError || !order) {
      logger.warn('Orden no encontrada para pago', { orderId: payload.orderId, tenantId })
      throw new PaymentError(
        `Order not found: ${payload.orderId}`,
        PAYMENT_ERROR_CODES.ORDER_NOT_FOUND,
        404
      )
    }

    // Verificar que orden no tenga payment activo
    const { data: existingPayments } = await getPaymentsService(tenantId, {
      orderId: payload.orderId,
      status: 'pending'
    })

    if (existingPayments && existingPayments.length > 0) {
      logger.warn('La orden ya tiene un pago activo', { orderId: payload.orderId, tenantId })
      throw new PaymentError(
        'Order already has an active payment',
        PAYMENT_ERROR_CODES.PAYMENT_IN_PROGRESS,
        409
      )
    }

    // Crear payment en Mercado Pago
    logger.info('Creando pago en Mercado Pago', { 
      orderId: order.id,
      amount: order.total_cents,
      tableId: order.table_id,
      tenantId
    })
    
    const config = getMercadoPagoConfig()
    const paymentConfig = getPaymentConfig()
    const provider = new MercadoPagoProvider(config, paymentConfig.webhookUrl)

    const result = await provider.createPayment({
      amount: order.total_cents / 100, // Convertir centavos a pesos
      currency: 'ARS',
      orderId: order.id,
      description: `Pedido #${order.order_number} - Mesa ${order.table_id}`,
      customerEmail: payload.metadata?.customerEmail,
      customerName: payload.metadata?.customerName,
      returnUrl: payload.returnUrl || paymentConfig.returnUrl,
      failureUrl: payload.failureUrl || paymentConfig.failureUrl,
      metadata: {
        tableId: order.table_id || 'unknown',
        ...payload.metadata?.custom,
      },
    })

    // Guardar payment en Supabase
    const { data: payment, error: paymentError } = await createPaymentService({
      orderId: order.id,
      tableId: order.table_id || undefined,
      provider: 'mercadopago',
      amountCents: order.total_cents,
      currency: 'ARS',
      externalId: result.externalId,
      checkoutUrl: result.checkoutUrl,
      expiresAt: result.expiresAt?.toISOString(),
      metadata: {
        customerEmail: payload.metadata?.customerEmail,
        customerName: payload.metadata?.customerName,
        reference: payload.metadata?.reference,
        returnUrl: payload.returnUrl,
        failureUrl: payload.failureUrl,
      },
    }, tenantId)

    if (paymentError || !payment) {
      logger.error('Error al guardar pago en Supabase', new Error(`Payment save failed: ${paymentError}`), {
        tenantId,
        orderId: order.id
      })
      throw new PaymentError(
        'Failed to save payment',
        PAYMENT_ERROR_CODES.INTERNAL_ERROR,
        500
      )
    }

    const duration = Date.now() - startTime
    logResponse('POST', '/api/payment', 201, duration)
    
    // Log de auditoría SIN datos sensibles
    logger.info('Pago creado exitosamente', { 
      paymentId: payment.id,
      orderId: order.id,
      amount: order.total_cents,
      provider: 'mercadopago',
      tenantId,
      duration: `${duration}ms`
    })

    return NextResponse.json(
      {
        data: {
          paymentId: payment.id,
          checkoutUrl: payment.checkout_url!,
          status: payment.status,
          expiresAt: payment.expires_at,
        },
        metadata: {
          provider: payment.provider,
          createdAt: payment.created_at,
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
    // Obtener usuario actual
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json(
        { error: 'No autenticado' },
        { status: 401 }
      )
    }

    // Obtener tenant_id del usuario
    const tenantId = getTenantIdFromUser(user)
    if (!tenantId) {
      return NextResponse.json(
        { error: 'Usuario sin tenant asignado' },
        { status: 403 }
      )
    }

    const { searchParams } = new URL(request.url)
    logRequest('GET', '/api/payment', { ...Object.fromEntries(searchParams), tenantId })

    const filters = {
      orderId: searchParams.get('orderId') || undefined,
      tableId: searchParams.get('tableId') || undefined,
      status: searchParams.get('status') as 'pending' | 'completed' | 'failed' | 'cancelled' | undefined,
      provider: searchParams.get('provider') as 'mercadopago' | 'stripe' | 'cash' | undefined,
      limit: parseInt(searchParams.get('limit') || '50', 10),
    }

    logger.debug('Obteniendo lista de pagos desde Supabase', { filters, tenantId })
    
    const [paymentsResult, statsResult] = await Promise.all([
      getPaymentsService(tenantId, filters),
      getPaymentsStats(tenantId)
    ])

    if (paymentsResult.error) {
      throw new Error('Error obteniendo pagos')
    }

    const duration = Date.now() - startTime
    logResponse('GET', '/api/payment', 200, duration)
    
    logger.info('Pagos obtenidos desde Supabase', { 
      count: paymentsResult.data?.length || 0,
      tenantId,
      duration: `${duration}ms`
    })

    return NextResponse.json({
      data: (paymentsResult.data || []).map(payment => ({
        id: payment.id,
        orderId: payment.order_id,
        tableId: payment.table_id,
        paymentNumber: payment.payment_number,
        provider: payment.provider,
        status: payment.status,
        method: payment.method,
        amountCents: payment.amount_cents,
        currency: payment.currency,
        externalId: payment.external_id,
        checkoutUrl: payment.checkout_url,
        createdAt: payment.created_at,
        updatedAt: payment.updated_at,
      })),
      metadata: {
        total: paymentsResult.data?.length || 0,
        stats: statsResult.data,
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
