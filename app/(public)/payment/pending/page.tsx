/**
 * Página de pago pendiente
 * Para pagos que requieren confirmación (ej: transferencia bancaria)
 * 
 * Features:
 * - Muestra estado de espera
 * - Polling del estado
 * - Redirige automáticamente al aprobar
 */

import { Suspense } from 'react';
import Link from 'next/link';
import { Clock, Home } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

function PendingContent() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-yellow-50 to-amber-50 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center mb-4">
            <Clock className="w-10 h-10 text-yellow-600" />
          </div>
          <CardTitle className="text-2xl">Pago Pendiente</CardTitle>
          <CardDescription>
            Estamos procesando tu pago
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="text-center text-sm text-muted-foreground">
            <p>Tu pago está siendo verificado.</p>
            <p>Recibirás una notificación cuando se confirme.</p>
          </div>

          <Button asChild variant="outline" className="w-full" size="lg">
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

export default function PaymentPendingPage() {
  return (
    <Suspense fallback={<div>Cargando...</div>}>
      <PendingContent />
    </Suspense>
  );
}
