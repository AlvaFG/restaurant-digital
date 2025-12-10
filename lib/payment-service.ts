/**
 * Payment Service
 * Business logic for payment processing
 */

import { createPaymentPreference, getPayment } from './mercadopago'
import type { 
  Payment, 
  PaymentPreferenceResponse, 
  OrderWithPayment, 
  OrderItemModifier 
} from './payment-types'
import { logger } from './logger'
import { AppError, ValidationError } from './errors'
import { MENSAJES } from './i18n/mensajes'

export class PaymentService {
  private baseUrl: string

  constructor() {
    this.baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
  }

  /**
   * Creates a payment preference for an order
   * Returns the MercadoPago checkout URL
   */
  async createOrderPayment(order: OrderWithPayment): Promise<PaymentPreferenceResponse> {
    const startTime = Date.now();
    
    try {
      logger.info('Creando preferencia de pago', { 
        orderId: order.id, 
        totalCents: order.totalCents,
        itemsCount: order.items.length 
      });

      // Validar antes de procesar
      const validation = this.canProcessPayment(order);
      if (!validation.valid) {
        throw new ValidationError(validation.error || MENSAJES.ERRORES.VALIDACION_FALLIDA, {
          orderId: order.id
        });
      }

      // Convert order items to MercadoPago format
      const items = order.items.map((item, index) => {
        const itemTotal = item.basePriceCents * item.quantity;
        const modifiersTotal = (
          item.selectedModifiers?.reduce((sum: number, mod: OrderItemModifier) => sum + mod.priceCents, 0) ?? 0
        );
        const totalPrice = (itemTotal + modifiersTotal) / 100; // Convert cents to ARS

        return {
          id: `item-${index + 1}`,
          title: `${item.name} x${item.quantity}`,
          quantity: 1,
          unit_price: totalPrice,
          currency_id: 'ARS' as const,
        };
      });

      // Determine payer info
      const isEmail = order.customerContact.includes('@');
      const payer = {
        name: order.customerName,
        email: isEmail ? order.customerContact : undefined,
        phone: !isEmail ? order.customerContact : undefined,
      };

      // Create preference
      const preference = await createPaymentPreference({
        orderId: order.id,
        items,
        payer,
        back_urls: {
          success: `${this.baseUrl}/qr/${order.tableId}/payment/success?order_id=${order.id}`,
          failure: `${this.baseUrl}/qr/${order.tableId}/payment/failure?order_id=${order.id}`,
          pending: `${this.baseUrl}/qr/${order.tableId}/payment/pending?order_id=${order.id}`,
        },
        notification_url: `${this.baseUrl}/api/payment/webhook`,
        external_reference: order.id,
        metadata: {
          orderId: order.id,
          tableId: order.tableId,
          tableName: order.tableId.replace('TABLE-', 'Mesa '),
          sessionId: order.sessionId,
          totalCents: order.totalCents,
        },
      });

      const duration = Date.now() - startTime;
      
      // Log de auditoría de creación de pago (SIN datos sensibles)
      logger.info('Preferencia de pago creada exitosamente', {
        orderId: order.id,
        preferenceId: preference.id,
        totalCents: order.totalCents,
        duration: `${duration}ms`
      });

      return {
        preferenceId: preference.id || '',
        initPoint: preference.init_point || '',
        sandboxInitPoint: preference.sandbox_init_point,
      };
    } catch (error) {
      const duration = Date.now() - startTime;
      
      // Log de error SIN exponer datos sensibles del cliente
      logger.error('Error al crear preferencia de pago', error as Error, {
        orderId: order.id,
        totalCents: order.totalCents,
        duration: `${duration}ms`
      });

      if (error instanceof ValidationError) {
        throw error;
      }

      throw new AppError(MENSAJES.ERRORES.PAGO_FALLIDO, 500, true, {
        orderId: order.id
      });
    }
  }

  /**
   * Verifies a payment status with MercadoPago
   * Converts MP payment data to our Payment type
   */
  async verifyPayment(paymentId: string | number): Promise<Payment> {
    const startTime = Date.now();
    
    try {
      logger.info('Verificando estado de pago', { paymentId });

      const payment = await getPayment(paymentId);
      
      const duration = Date.now() - startTime;

      // Log de auditoría de verificación de pago
      logger.info('Pago verificado', {
        paymentId,
        orderId: payment.external_reference,
        status: payment.status,
        amount: payment.transaction_amount,
        duration: `${duration}ms`
      });

      return {
        id: payment.id?.toString() || paymentId.toString(),
        orderId: payment.external_reference || '',
        amount: payment.transaction_amount || 0,
        currency: (payment.currency_id as 'ARS' | 'USD') || 'ARS',
        status: this.mapPaymentStatus(payment.status || 'pending'),
        paymentMethod: payment.payment_type_id || 'unknown',
        merchantOrderId: '',
        preferenceId: '',
        externalReference: payment.external_reference || '',
        metadata: payment.metadata || {},
        createdAt: payment.date_created || new Date().toISOString(),
        updatedAt: payment.date_last_updated || new Date().toISOString(),
      };
    } catch (error) {
      const duration = Date.now() - startTime;
      
      logger.error('Error al verificar pago', error as Error, {
        paymentId,
        duration: `${duration}ms`
      });

      throw new AppError(MENSAJES.ERRORES.PAGO_FALLIDO, 500, true, {
        paymentId
      });
    }
  }

  /**
   * Maps MercadoPago payment status to our internal status
   */
  private mapPaymentStatus(mpStatus: string): Payment['status'] {
    const statusMap: Record<string, Payment['status']> = {
      'pending': 'pending',
      'approved': 'approved',
      'authorized': 'approved',
      'in_process': 'pending',
      'in_mediation': 'pending',
      'rejected': 'rejected',
      'cancelled': 'cancelled',
      'refunded': 'refunded',
      'charged_back': 'refunded',
    }

    return statusMap[mpStatus] || 'pending'
  }

  /**
   * Formats amount in cents to ARS currency string
   */
  formatAmount(cents: number): string {
    return `$${(cents / 100).toFixed(2)}`
  }

  /**
   * Validates if payment can be processed
   */
  canProcessPayment(order: OrderWithPayment): { valid: boolean; error?: string } {
    if (!order.customerName || order.customerName.trim().length === 0) {
      return { valid: false, error: MENSAJES.VALIDACIONES.CAMPO_REQUERIDO };
    }

    if (!order.customerContact || order.customerContact.trim().length === 0) {
      return { valid: false, error: MENSAJES.VALIDACIONES.CAMPO_REQUERIDO };
    }

    if (order.totalCents <= 0) {
      return { valid: false, error: MENSAJES.ERRORES.PAGO_MONTO_INVALIDO };
    }

    if (!order.items || order.items.length === 0) {
      return { valid: false, error: MENSAJES.ERRORES.PEDIDO_ITEMS_VACIOS };
    }

    return { valid: true };
  }
}

// Export singleton instance
export const paymentService = new PaymentService()
