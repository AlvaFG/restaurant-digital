/**
 * Botón de pago que inicia el flujo de checkout
 * Props:
 * - orderId: ID del pedido a pagar
 * - amount: Monto total
 * - disabled: Deshabilitar botón
 * - onSuccess: Callback al crear pago exitosamente
 * - onError: Callback en caso de error
 * 
 * Behavior:
 * - Muestra loading state durante la creación
 * - Abre checkoutUrl en nueva ventana al completar
 * - Maneja errores con toast notifications
 */

'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { usePayment } from '@/hooks/use-payment';
import { useToast } from '@/hooks/use-toast';
import { formatCurrency } from '@/lib/payment-client-utils';
import { CreditCard, Loader2 } from 'lucide-react';

interface Payment {
  id: string;
  orderId: string;
  amount: number;
  status: string;
  provider: string;
  externalId?: string;
  checkoutUrl?: string;
  createdAt: string;
  updatedAt: string;
}

interface CheckoutButtonProps {
  orderId: string;
  amount: number;
  disabled?: boolean;
  onSuccess?: (payment: Payment) => void;
  onError?: (error: string) => void;
}

export function CheckoutButton({
  orderId,
  amount,
  disabled = false,
  onSuccess,
  onError,
}: CheckoutButtonProps) {
  const { createPayment, isLoading } = usePayment();
  const { toast } = useToast();
  const [isProcessing, setIsProcessing] = useState(false);

  const handleCheckout = async () => {
    setIsProcessing(true);

    try {
      const payment = await createPayment(orderId, amount);

      if (!payment) {
        throw new Error('No se pudo crear el pago');
      }

      if (!payment.checkoutUrl) {
        throw new Error('URL de checkout no disponible');
      }

      // Abrir Checkout Pro en nueva ventana
      const checkoutWindow = window.open(
        payment.checkoutUrl,
        '_blank',
        'width=800,height=600'
      );

      if (!checkoutWindow) {
        toast({
          title: 'Ventana bloqueada',
          description: 'Por favor, habilita ventanas emergentes para continuar',
          variant: 'destructive',
        });
        return;
      }

      toast({
        title: 'Redirigiendo a MercadoPago',
        description: 'Completa el pago en la ventana emergente',
      });

      onSuccess?.(payment);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Error al procesar el pago';
      toast({
        title: 'Error',
        description: message,
        variant: 'destructive',
      });
      onError?.(message);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <Button
      onClick={handleCheckout}
      disabled={disabled || isLoading || isProcessing}
      className="w-full"
      size="lg"
    >
      {isLoading || isProcessing ? (
        <>
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          Procesando...
        </>
      ) : (
        <>
          <CreditCard className="mr-2 h-4 w-4" />
          Pagar {formatCurrency(amount)}
        </>
      )}
    </Button>
  );
}
