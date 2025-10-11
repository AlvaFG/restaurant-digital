/**
 * Modal completo de pago con detalles del pedido
 * Features:
 * - Muestra resumen del pedido
 * - Permite confirmar monto antes de pagar
 * - Integra CheckoutButton
 * - Polling del estado de pago después de redirección
 * - Cierra automáticamente al aprobar pago
 */

'use client';

import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { CheckoutButton } from './checkout-button';
import { formatCurrency, getPaymentStatusLabel, getPaymentStatusColor, type PaymentStatus } from '@/lib/payment-client-utils';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { usePayment } from '@/hooks/use-payment';
import { logger } from '@/lib/logger';

interface PaymentModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  order: {
    id: string;
    tableId: string;
    items: Array<{
      name: string;
      quantity: number;
      price: number;
    }>;
    total: number;
  };
}

export function PaymentModal({ open, onOpenChange, order }: PaymentModalProps) {
  const { payment, getPaymentStatus } = usePayment();
  const [pollInterval, setPollInterval] = useState<NodeJS.Timeout | null>(null);

  // Polling del estado de pago cada 3 segundos
  useEffect(() => {
    if (payment && payment.status === 'pending' && open) {
      logger.debug('Iniciando polling de estado de pago', { 
        paymentId: payment.id,
        orderId: order.id 
      });
      
      const interval = setInterval(async () => {
        try {
          await getPaymentStatus(payment.id);
        } catch (error) {
          logger.error('Error en polling de estado de pago', error as Error, { 
            paymentId: payment.id 
          });
        }
      }, 3000);

      setPollInterval(interval);

      return () => {
        logger.debug('Deteniendo polling de estado de pago', { paymentId: payment.id });
        clearInterval(interval);
      };
    }

    return () => {
      if (pollInterval) clearInterval(pollInterval);
    };
  }, [payment, open, getPaymentStatus, pollInterval]);

  // Cerrar modal automáticamente cuando el pago es aprobado
  useEffect(() => {
    if (payment?.status === 'approved') {
      logger.info('Pago aprobado, cerrando modal automáticamente', { 
        paymentId: payment.id,
        orderId: order.id 
      });
      
      if (pollInterval) clearInterval(pollInterval);
      
      setTimeout(() => {
        onOpenChange(false);
      }, 2000);
    }
  }, [payment?.status, pollInterval, onOpenChange, order.id, payment?.id]);

  const handleSuccess = () => {
    logger.info('Pago iniciado exitosamente', { 
      orderId: order.id,
      amount: order.total 
    });
    // El polling se encargará de actualizar el estado
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Pagar Pedido</DialogTitle>
          <DialogDescription>
            Mesa {order.tableId} - Pedido #{order.id.slice(0, 8)}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Resumen de items */}
          <div className="space-y-2">
            <h4 className="font-medium text-sm">Resumen del pedido</h4>
            <div className="space-y-1">
              {order.items.map((item, index) => (
                <div key={index} className="flex justify-between text-sm">
                  <span>
                    {item.quantity}x {item.name}
                  </span>
                  <span>{formatCurrency(item.price * item.quantity)}</span>
                </div>
              ))}
            </div>
          </div>

          <Separator />

          {/* Total */}
          <div className="flex justify-between items-center">
            <span className="font-semibold">Total</span>
            <span className="text-2xl font-bold">{formatCurrency(order.total)}</span>
          </div>

          {/* Estado de pago si existe */}
          {payment && (
            <div className="p-3 bg-muted rounded-lg space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Estado del pago:</span>
                <Badge className={getPaymentStatusColor(payment.status as PaymentStatus)}>
                  {getPaymentStatusLabel(payment.status as PaymentStatus)}
                </Badge>
              </div>
              {payment.externalId && (
                <p className="text-xs text-muted-foreground">
                  ID de transacción: {payment.externalId}
                </p>
              )}
            </div>
          )}
        </div>

        <DialogFooter className="flex-col space-y-2 sm:space-y-0">
          {!payment && (
            <CheckoutButton
              orderId={order.id}
              amount={order.total}
              onSuccess={handleSuccess}
            />
          )}
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            className="w-full"
          >
            {payment?.status === 'approved' ? 'Cerrar' : 'Cancelar'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
