/**
 * Payment Pending Page
 * Shown when payment is being processed
 */

import { Clock, ArrowLeft, Info } from 'lucide-react'
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

export default async function PaymentPendingPage({ params, searchParams }: PageProps) {
  const { tableId } = await params;
  const search = await searchParams;
  const orderId = search.external_reference || search.order_id
  const displayOrderId = orderId?.slice(0, 8).toUpperCase()

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-b from-yellow-50 to-background">
      <div className="max-w-md w-full space-y-8">
        {/* Pending Icon */}
        <div className="flex justify-center">
          <div className="relative">
            <div className="absolute inset-0 bg-yellow-500/20 rounded-full blur-2xl" />
            <Clock className="relative w-24 h-24 text-yellow-500 animate-pulse" />
          </div>
        </div>

        {/* Pending Message */}
        <div className="text-center space-y-3">
          <h1 className="text-3xl font-bold text-yellow-600 animate-in fade-in slide-in-from-bottom-4 duration-500 delay-100">
            Pago pendiente
          </h1>
          <p className="text-muted-foreground animate-in fade-in slide-in-from-bottom-4 duration-500 delay-200">
            Tu pago está siendo procesado.
            <br />
            Te notificaremos cuando se confirme.
          </p>
        </div>

        {/* Order ID Card */}
        {displayOrderId && (
          <div className="bg-muted/50 border border-yellow-200 p-6 rounded-lg space-y-2 animate-in fade-in slide-in-from-bottom-4 duration-500 delay-300">
            <p className="text-sm text-muted-foreground text-center">
              Número de orden
            </p>
            <p className="font-mono font-bold text-2xl text-center tracking-wider">
              #{displayOrderId}
            </p>
          </div>
        )}

        {/* Info Alert */}
        <div className="bg-yellow-50 border border-yellow-200 p-4 rounded-lg flex gap-3 animate-in fade-in slide-in-from-bottom-4 duration-500 delay-400">
          <Info className="h-5 w-5 text-yellow-600 flex-shrink-0 mt-0.5" />
          <div className="space-y-2">
            <p className="text-sm font-medium text-yellow-900">
              ¿Por qué está pendiente?
            </p>
            <p className="text-sm text-yellow-800">
              Algunos métodos de pago requieren verificación adicional. 
              Esto puede tomar algunos minutos o hasta 2 días hábiles.
            </p>
          </div>
        </div>

        {/* Payment Methods Info */}
        <div className="bg-muted/30 p-4 rounded-lg space-y-2 text-sm animate-in fade-in slide-in-from-bottom-4 duration-500 delay-500">
          <p className="font-medium">Métodos con tiempo de procesamiento:</p>
          <ul className="text-muted-foreground space-y-1 list-disc list-inside">
            <li>Rapipago: 1-2 días hábiles</li>
            <li>Pago Fácil: 1-2 días hábiles</li>
            <li>Transferencia bancaria: Hasta 24 horas</li>
          </ul>
        </div>

        {/* Actions */}
        <div className="space-y-3 animate-in fade-in slide-in-from-bottom-4 duration-500 delay-600">
          <Button asChild className="w-full" size="lg">
            <Link href={`/qr/${tableId}`}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              Volver al menú
            </Link>
          </Button>

          <p className="text-xs text-center text-muted-foreground">
            Recibirás un email cuando el pago se confirme
          </p>
        </div>
      </div>
    </div>
  )
}
