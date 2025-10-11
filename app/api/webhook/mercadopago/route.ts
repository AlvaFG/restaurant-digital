import { NextRequest, NextResponse } from 'next/server'
import { paymentStore } from '@/lib/server/payment-store'
import { MercadoPagoProvider } from '@/lib/server/providers/mercadopago-provider'
import { getMercadoPagoConfig } from '@/lib/server/payment-config'
import { logRequest, logResponse } from '@/lib/api-helpers'
import { logger } from '@/lib/logger'

/**
 * POST /api/webhook/mercadopago
 * Recibir notificaciones de Mercado Pago
 */
export async function POST(request: NextRequest) {
  const startTime = Date.now()
  
  try {
    const payload = await request.json()
    const signature = request.headers.get('x-signature')
    const requestId = request.headers.get('x-request-id')

    logRequest('POST', '/api/webhook/mercadopago', { 
      type: payload.type, 
      requestId,
      hasSignature: !!signature
    })

    // Inicializar provider
    const config = getMercadoPagoConfig()
    const provider = new MercadoPagoProvider(config)

    // Procesar webhook
    logger.info('Procesando webhook de Mercado Pago', {
      type: payload.type,
      requestId,
    })
    
    const result = await provider.processWebhook({
      provider: 'mercadopago',
      event: payload.type,
      data: payload.data,
      signature: signature || undefined,
      timestamp: new Date().toISOString(),
    })

    // Si no se procesó, retornar OK sin hacer nada
    if (!result.processed) {
      const duration = Date.now() - startTime
      logResponse('POST', '/api/webhook/mercadopago', 200, duration)
      
      logger.debug('Evento de webhook ignorado', { type: payload.type })
      return NextResponse.json({ status: 'ignored' })
    }

    // Buscar payment por externalId - NO logear datos sensibles
    const payment = await paymentStore.getByExternalId(result.externalId)

    if (!payment) {
      const duration = Date.now() - startTime
      logResponse('POST', '/api/webhook/mercadopago', 200, duration)
      
      logger.warn('Pago no encontrado para externalId en webhook', { 
        externalId: result.externalId 
      })
      return NextResponse.json({ status: 'payment_not_found' })
    }

    // Actualizar estado del payment
    const updated = await paymentStore.updateStatus(
      payment.id,
      result.status,
      {
        method: result.method,
        failureReason: result.failureReason,
        failureCode: result.failureCode,
      }
    )

    const duration = Date.now() - startTime
    logResponse('POST', '/api/webhook/mercadopago', 200, duration)
    
    // Log de auditoría - solo IDs, estados, NO datos de pago sensibles
    logger.info('Pago actualizado desde webhook', {
      paymentId: updated.id,
      status: updated.status,
      method: updated.method,
      duration: `${duration}ms`
    })

    return NextResponse.json({ status: 'ok' })
  } catch (error) {
    const duration = Date.now() - startTime
    logResponse('POST', '/api/webhook/mercadopago', 200, duration)
    
    logger.error('Error procesando webhook de Mercado Pago', error as Error)

    // Siempre retornar 200 para evitar reintentos infinitos
    return NextResponse.json(
      { status: 'error', message: error instanceof Error ? error.message : 'Unknown error' },
      { status: 200 }
    )
  }
}

// Desactivar body parsing de Next.js para webhooks
export const dynamic = 'force-dynamic'
