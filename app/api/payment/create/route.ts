/**
 * Payment Creation Endpoint
 * POST /api/payment/create
 * Creates a MercadoPago payment preference for an order
 */

import { NextRequest, NextResponse } from 'next/server'
import { paymentService } from '@/lib/payment-service'
import { isConfigured } from '@/lib/mercadopago'
import { MOCK_ORDERS, type Order } from '@/lib/mock-data'
import { logRequest, logResponse, validarBody } from '@/lib/api-helpers'
import { logger } from '@/lib/logger'
import { MENSAJES } from '@/lib/i18n/mensajes'
import { ValidationError } from '@/lib/errors'

export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  const startTime = Date.now()
  
  try {
    logRequest('POST', '/api/payment/create')
    
    // Check if MercadoPago is configured
    if (!isConfigured()) {
      logger.error('Sistema de pagos no configurado', new Error('MERCADOPAGO_ACCESS_TOKEN no configurado'))
      
      const duration = Date.now() - startTime
      logResponse('POST', '/api/payment/create', 503, duration)
      
      return NextResponse.json(
        {
          success: false,
          error: 'Payment system not configured. Please set MERCADOPAGO_ACCESS_TOKEN.',
        },
        { status: 503 }
      )
    }

    const body = await validarBody<{ orderId: string }>(request)
    const { orderId } = body

    if (!orderId) {
      logger.warn('orderId faltante en creación de pago')
      throw new ValidationError('Order ID is required')
    }

    // Get order from mock data (in production, fetch from database)
    const order = MOCK_ORDERS.find((o: Order) => o.id === orderId)

    if (!order) {
      logger.warn('Orden no encontrada', { orderId })
      
      const duration = Date.now() - startTime
      logResponse('POST', '/api/payment/create', 404, duration)
      
      return NextResponse.json(
        {
          success: false,
          error: 'Order not found',
        },
        { status: 404 }
      )
    }

    // Validate order can be paid
    logger.debug('Validando si orden puede procesarse', { orderId })
    
    // Convert Order to OrderWithPayment-like structure for validation
    const orderForPayment = order as unknown as import('@/lib/payment-types').OrderWithPayment
    
    const validation = paymentService.canProcessPayment(orderForPayment)
    if (!validation.valid) {
      logger.warn('Orden no puede procesarse', { orderId, reason: validation.error })
      
      const duration = Date.now() - startTime
      logResponse('POST', '/api/payment/create', 400, duration)
      
      return NextResponse.json(
        {
          success: false,
          error: validation.error,
        },
        { status: 400 }
      )
    }

    // Create payment preference
    logger.info('Creando preferencia de pago', { 
      orderId,
      amount: order.total
    })
    
    const payment = await paymentService.createOrderPayment(orderForPayment)

    // Update order with payment info (in production, save to database)
    const updatedOrder: Order = {
      ...order,
      paymentStatus: 'pendiente' as const,
    }

    // In production: await saveOrder(updatedOrder)
    const orderIndex = MOCK_ORDERS.findIndex((o: Order) => o.id === orderId)
    if (orderIndex !== -1) {
      MOCK_ORDERS[orderIndex] = updatedOrder
    }

    const duration = Date.now() - startTime
    logResponse('POST', '/api/payment/create', 200, duration)
    
    // Log de auditoría SIN datos sensibles
    logger.info('Preferencia de pago creada', { 
      orderId,
      preferenceId: payment.preferenceId,
      duration: `${duration}ms`
    })

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
    const duration = Date.now() - startTime
    
    if (error instanceof ValidationError) {
      logResponse('POST', '/api/payment/create', 400, duration)
      logger.warn('Validación fallida en creación de pago', { error: error.message })
      
      return NextResponse.json(
        {
          success: false,
          error: error.message,
        },
        { status: 400 }
      )
    }
    
    logResponse('POST', '/api/payment/create', 500, duration)
    logger.error('Error al crear preferencia de pago', error as Error)
    
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : MENSAJES.ERRORES.GENERICO,
      },
      { status: 500 }
    )
  }
}
