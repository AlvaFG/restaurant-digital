import { NextRequest, NextResponse } from 'next/server'
import { paymentStore } from '@/lib/server/payment-store'
import { MercadoPagoProvider } from '@/lib/server/providers/mercadopago-provider'
import { getMercadoPagoConfig } from '@/lib/server/payment-config'

/**
 * POST /api/webhook/mercadopago
 * Recibir notificaciones de Mercado Pago
 */
export async function POST(request: NextRequest) {
  try {
    const payload = await request.json()
    const signature = request.headers.get('x-signature')
    const requestId = request.headers.get('x-request-id')

    console.log('[WEBHOOK] Received notification', {
      type: payload.type,
      requestId,
      hasSignature: !!signature,
    })

    // Inicializar provider
    const config = getMercadoPagoConfig()
    const provider = new MercadoPagoProvider(config)

    // Procesar webhook
    const result = await provider.processWebhook({
      provider: 'mercadopago',
      event: payload.type,
      data: payload.data,
      signature: signature || undefined,
      timestamp: new Date().toISOString(),
    })

    // Si no se procesó, retornar OK sin hacer nada
    if (!result.processed) {
      console.log('[WEBHOOK] Event ignored:', payload.type)
      return NextResponse.json({ status: 'ignored' })
    }

    // Buscar payment por externalId
    const payment = await paymentStore.getByExternalId(result.externalId)

    if (!payment) {
      console.warn('[WEBHOOK] Payment not found for externalId:', result.externalId)
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

    console.log('[WEBHOOK] Payment updated', {
      paymentId: updated.id,
      status: updated.status,
      method: updated.method,
    })

    return NextResponse.json({ status: 'ok' })
  } catch (error) {
    console.error('[WEBHOOK] Processing error:', error)

    // Siempre retornar 200 para evitar reintentos infinitos
    return NextResponse.json(
      { status: 'error', message: error instanceof Error ? error.message : 'Unknown error' },
      { status: 200 }
    )
  }
}

// Desactivar body parsing de Next.js para webhooks
export const dynamic = 'force-dynamic'
