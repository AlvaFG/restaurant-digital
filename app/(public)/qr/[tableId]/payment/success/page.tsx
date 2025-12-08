/**
 * Payment Success Page
 * Shown after successful payment via MercadoPago
 */

import { CheckCircle, ArrowLeft } from 'lucide-react'
import { Button } from '@/components/ui/button'
import Link from 'next/link'

interface PageProps {
  params: Promise<{ tableId: string }>
  searchParams: Promise<{
    payment_id?: string
    external_reference?: string
    order_id?: string
    collection_id?: string
    collection_status?: string
    preference_id?: string
  }>
}

export default async function PaymentSuccessPage({ params, searchParams }: PageProps) {
  const { tableId } = await params;
  const search = await searchParams;
  const orderId = search.external_reference || search.order_id
  const displayOrderId = orderId?.slice(0, 8).toUpperCase()

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-b from-green-50 to-background">
      <div className="max-w-md w-full space-y-8">
        {/* Success Icon */}
        <div className="flex justify-center">
          <div className="relative">
            <div className="absolute inset-0 bg-green-500/20 rounded-full blur-2xl" />
            <CheckCircle className="relative w-24 h-24 text-green-500 animate-in zoom-in duration-500" />
          </div>
        </div>

        {/* Success Message */}
        <div className="text-center space-y-3">
          <h1 className="text-3xl font-bold text-green-600 animate-in fade-in slide-in-from-bottom-4 duration-500 delay-100">
            ¡Pago exitoso!
          </h1>
          <p className="text-muted-foreground animate-in fade-in slide-in-from-bottom-4 duration-500 delay-200">
            Tu pago ha sido procesado correctamente.
            <br />
            Tu pedido será preparado en breve.
          </p>
        </div>

        {/* Order ID Card */}
        {displayOrderId && (
          <div className="bg-muted/50 border border-green-200 p-6 rounded-lg space-y-2 animate-in fade-in slide-in-from-bottom-4 duration-500 delay-300">
            <p className="text-sm text-muted-foreground text-center">
              Número de orden
            </p>
            <p className="font-mono font-bold text-2xl text-center tracking-wider">
              #{displayOrderId}
            </p>
            <p className="text-xs text-muted-foreground text-center">
              Guarda este número para seguimiento
            </p>
          </div>
        )}

        {/* Payment Details (if available) */}
        {search.payment_id && (
          <div className="bg-muted/30 p-4 rounded-lg space-y-2 text-sm animate-in fade-in slide-in-from-bottom-4 duration-500 delay-400">
            <div className="flex justify-between">
              <span className="text-muted-foreground">ID de pago:</span>
              <span className="font-mono">{search.payment_id}</span>
            </div>
            {search.collection_status && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">Estado:</span>
                <span className="font-medium text-green-600 capitalize">
                  {search.collection_status}
                </span>
              </div>
            )}
          </div>
        )}

        {/* Actions */}
        <div className="space-y-3 animate-in fade-in slide-in-from-bottom-4 duration-500 delay-500">
          <Button asChild className="w-full" size="lg">
            <Link href={`/qr/${tableId}`}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              Volver al menú
            </Link>
          </Button>

          <p className="text-xs text-center text-muted-foreground">
            Recibirás una notificación cuando tu pedido esté listo
          </p>
        </div>
      </div>
    </div>
  )
}
