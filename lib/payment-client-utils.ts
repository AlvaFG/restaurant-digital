/**
 * Utilidades del lado del cliente para pagos
 * - Funciones para formatear montos
 * - Helpers para estados de pago
 * - Constantes de configuración del cliente
 */

export type PaymentStatus = 
  | 'pending'
  | 'approved'
  | 'rejected'
  | 'cancelled'
  | 'refunded'
  | 'in_process';

export interface PaymentClientConfig {
  publicKey: string;
  sandbox: boolean;
}

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('es-AR', {
    style: 'currency',
    currency: 'ARS',
  }).format(amount);
}

export function getPaymentStatusLabel(status: PaymentStatus): string {
  const labels: Record<PaymentStatus, string> = {
    pending: 'Pendiente',
    approved: 'Aprobado',
    rejected: 'Rechazado',
    cancelled: 'Cancelado',
    refunded: 'Reembolsado',
    in_process: 'En Proceso',
  };
  return labels[status] || 'Desconocido';
}

export function getPaymentStatusColor(status: PaymentStatus): string {
  const colors: Record<PaymentStatus, string> = {
    pending: 'bg-yellow-100 text-yellow-800',
    approved: 'bg-green-100 text-green-800',
    rejected: 'bg-red-100 text-red-800',
    cancelled: 'bg-gray-100 text-gray-800',
    refunded: 'bg-blue-100 text-blue-800',
    in_process: 'bg-blue-100 text-blue-800',
  };
  return colors[status] || 'bg-gray-100 text-gray-800';
}

export function getPaymentConfig(): PaymentClientConfig {
  return {
    publicKey: process.env.NEXT_PUBLIC_MERCADOPAGO_PUBLIC_KEY || '',
    sandbox: process.env.NEXT_PUBLIC_PAYMENT_SANDBOX === 'true',
  };
}
