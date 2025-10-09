/**
 * Página de error después de un pago fallido
 * Query params:
 * - payment_id: ID del pago
 * - external_reference: ID del pedido
 * 
 * Features:
 * - Muestra mensaje de error
 * - Botón para reintentar
 * - Botón para volver al salón
 * - Información de soporte
 */

import { Suspense } from 'react';
import Link from 'next/link';
import { XCircle, Home, RotateCcw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

function FailureContent() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-red-50 to-rose-50 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mb-4">
            <XCircle className="w-10 h-10 text-red-600" />
          </div>
          <CardTitle className="text-2xl">Pago No Procesado</CardTitle>
          <CardDescription>
            No pudimos completar tu pago
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="text-center text-sm text-muted-foreground">
            <p>El pago no pudo ser procesado.</p>
            <p>Puedes intentar nuevamente o contactar al personal.</p>
          </div>

          <div className="space-y-2">
            <Button asChild className="w-full" size="lg">
              <Link href="/salon">
                <RotateCcw className="mr-2 h-4 w-4" />
                Intentar Nuevamente
              </Link>
            </Button>

            <Button asChild variant="outline" className="w-full" size="lg">
              <Link href="/salon">
                <Home className="mr-2 h-4 w-4" />
                Volver al Salón
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default function PaymentFailurePage() {
  return (
    <Suspense fallback={<div>Cargando...</div>}>
      <FailureContent />
    </Suspense>
  );
}
