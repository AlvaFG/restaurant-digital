import { NextRequest, NextResponse } from 'next/server'
import { getPaymentByExternalId, updatePaymentStatus } from '@/lib/services/payments-service'
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

    // Buscar payment por externalId en todos los tenants
    // El webhook de MercadoPago no incluye tenant_id, así que buscamos globalmente
    // y luego obtenemos el tenant_id del payment encontrado
    logger.debug('Buscando pago por externalId', { externalId: result.externalId })
    
    // Primero intentamos buscar sin tenant (global search)
    // TODO: Esto requiere una función especial en el servicio o buscar en todos los tenants
    // Por ahora, usamos un tenant placeholder para demostrar el patrón
    const { data: payment, error: paymentError } = await getPaymentByExternalId(
      result.externalId,
      'system' // Placeholder - debería ser una búsqueda global
    )

    if (paymentError || !payment) {
      const duration = Date.now() - startTime
      logResponse('POST', '/api/webhook/mercadopago', 200, duration)
      
      logger.warn('Pago no encontrado para externalId en webhook', { 
        externalId: result.externalId 
      })
      return NextResponse.json({ status: 'payment_not_found' })
    }

    // Ahora que tenemos el payment con su tenant_id, actualizamos el estado
    const { data: updated, error: updateError } = await updatePaymentStatus(
      payment.id,
      result.status,
      payment.tenant_id,
      {
        metadata: {
          method: result.method,
          failureReason: result.failureReason,
          failureCode: result.failureCode,
        }
      }
    )

    if (updateError || !updated) {
      logger.error('Error al actualizar estado de pago desde webhook', new Error(`Update failed: ${updateError}`))
      return NextResponse.json({ status: 'update_failed' }, { status: 500 })
    }

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
