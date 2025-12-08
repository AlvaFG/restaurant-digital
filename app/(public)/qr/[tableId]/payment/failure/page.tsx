/**
 * Payment Failure Page
 * Shown when payment is rejected by MercadoPago
 */

import { XCircle, ArrowLeft, RefreshCw } from 'lucide-react'
import { Button } from '@/components/ui/button'
import Link from 'next/link'

interface PageProps {
  params: Promise<{ tableId: string }>
  searchParams: Promise<{
    payment_id?: string
    external_reference?: string
    order_id?: string
  }>
}

export default async function PaymentFailurePage({ params, searchParams }: PageProps) {
  const { tableId } = await params;
  const search = await searchParams;
  const orderId = search.external_reference || search.order_id

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-b from-red-50 to-background">
      <div className="max-w-md w-full space-y-8">
        {/* Error Icon */}
        <div className="flex justify-center">
          <div className="relative">
            <div className="absolute inset-0 bg-red-500/20 rounded-full blur-2xl" />
            <XCircle className="relative w-24 h-24 text-red-500 animate-in zoom-in duration-500" />
          </div>
        </div>

        {/* Error Message */}
        <div className="text-center space-y-3">
          <h1 className="text-3xl font-bold text-red-600 animate-in fade-in slide-in-from-bottom-4 duration-500 delay-100">
            Pago rechazado
          </h1>
          <p className="text-muted-foreground animate-in fade-in slide-in-from-bottom-4 duration-500 delay-200">
            Tu pago no pudo ser procesado.
            <br />
            Por favor intenta nuevamente o elige otro método de pago.
          </p>
        </div>

        {/* Possible Reasons */}
        <div className="bg-muted/50 border border-red-200 p-6 rounded-lg space-y-3 animate-in fade-in slide-in-from-bottom-4 duration-500 delay-300">
          <p className="font-semibold text-sm">Posibles causas:</p>
          <ul className="text-sm text-muted-foreground space-y-2 list-disc list-inside">
            <li>Fondos insuficientes</li>
            <li>Datos de tarjeta incorrectos</li>
            <li>Límite de compra excedido</li>
            <li>Tarjeta bloqueada o vencida</li>
          </ul>
        </div>

        {/* Actions */}
        <div className="space-y-3 animate-in fade-in slide-in-from-bottom-4 duration-500 delay-400">
          {orderId && (
            <Button asChild className="w-full" size="lg" variant="default">
              <Link href={`/qr/${tableId}`}>
                <RefreshCw className="mr-2 h-4 w-4" />
                Intentar nuevamente
              </Link>
            </Button>
          )}

          <Button asChild className="w-full" size="lg" variant="outline">
            <Link href={`/qr/${tableId}`}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              Volver al menú
            </Link>
          </Button>

          <p className="text-xs text-center text-muted-foreground">
            También puedes pagar en efectivo al recibir tu pedido
          </p>
        </div>
      </div>
    </div>
  )
}
