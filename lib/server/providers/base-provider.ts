/**
 * Base Payment Provider Interface
 * 
 * Contrato que deben cumplir todos los providers de pago
 */

import type {
  CreatePaymentOptions,
  PaymentResult,
  PaymentStatus,
  WebhookPayload,
  WebhookResult,
} from '../payment-types'

export interface IPaymentProvider {
  /**
   * Crear intención de pago en el provider
   */
  createPayment(options: CreatePaymentOptions): Promise<PaymentResult>

  /**
   * Consultar estado de un pago
   */
  getPaymentStatus(externalId: string): Promise<PaymentStatus>

  /**
   * Procesar notificación webhook del provider
   */
  processWebhook(payload: WebhookPayload): Promise<WebhookResult>

  /**
   * Reembolsar pago (opcional)
   */
  refundPayment?(externalId: string, amount?: number): Promise<void>
}
