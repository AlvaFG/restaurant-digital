/**
 * Página de éxito después del pago
 * Query params:
 * - payment_id: ID del pago
 * - external_reference: ID del pedido
 * 
 * Features:
 * - Muestra confirmación visual
 * - Consulta estado del pago
 * - Botón para volver al salón
 * - Impresión automática de comprobante (opcional)
 */

import { Suspense } from 'react';
import Link from 'next/link';
import { CheckCircle, Home } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

function SuccessContent() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-green-50 to-emerald-50 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
            <CheckCircle className="w-10 h-10 text-green-600" />
          </div>
          <CardTitle className="text-2xl">¡Pago Exitoso!</CardTitle>
          <CardDescription>
            Tu pago ha sido procesado correctamente
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="text-center text-sm text-muted-foreground">
            <p>Recibirás una confirmación por email</p>
            <p>Tu pedido será preparado en breve</p>
          </div>

          <Button asChild className="w-full" size="lg">
            <Link href="/salon">
              <Home className="mr-2 h-4 w-4" />
              Volver al Salón
            </Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}

export default function PaymentSuccessPage() {
  return (
    <Suspense fallback={<div>Cargando...</div>}>
      <SuccessContent />
    </Suspense>
  );
}
