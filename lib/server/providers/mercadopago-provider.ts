/**
 * Mercado Pago Provider
 * 
 * Integración con Mercado Pago API usando SDK oficial
 * Implementa IPaymentProvider para abstracción
 */

import { MercadoPagoConfig, Preference, Payment as MPPayment } from 'mercadopago'
import { createLogger } from '@/lib/logger'
import type { IPaymentProvider } from './base-provider'
import type {
  CreatePaymentOptions,
  PaymentResult,
  PaymentStatus,
  WebhookPayload,
  WebhookResult,
  MercadoPagoConfig as MPConfig,
} from '../payment-types'
import { PaymentError, PAYMENT_ERROR_CODES } from '../payment-types'

const logger = createLogger('mercadopago-provider')

// Mapeo de estados de Mercado Pago a nuestros PaymentStatus
const MP_STATUS_MAP: Record<string, PaymentStatus> = {
  'pending': 'pending',
  'approved': 'completed',
  'authorized': 'processing',
  'in_process': 'processing',
  'in_mediation': 'processing',
  'rejected': 'failed',
  'cancelled': 'cancelled',
  'refunded': 'refunded',
  'charged_back': 'refunded',
}

export class MercadoPagoProvider implements IPaymentProvider {
  private client: MercadoPagoConfig
  private preferenceClient: Preference
  private paymentClient: MPPayment
  private config: MPConfig
  private webhookUrl?: string

  constructor(config: MPConfig, webhookUrl?: string) {
    this.config = config
    this.webhookUrl = webhookUrl

    // Inicializar cliente de Mercado Pago
    this.client = new MercadoPagoConfig({
      accessToken: config.accessToken,
      options: {
        timeout: config.timeout || 10000,
        idempotencyKey: undefined, // Se configura por request
      },
    })

    this.preferenceClient = new Preference(this.client)
    this.paymentClient = new MPPayment(this.client)

    logger.info('Provider initialized', {
      sandbox: config.sandbox,
      timeout: config.timeout,
      hasWebhook: !!webhookUrl,
    })
  }

  /**
   * Crear preference en Mercado Pago
   */
  async createPayment(options: CreatePaymentOptions): Promise<PaymentResult> {
    try {
      logger.debug('Creating preference', {
        amount: options.amount,
        orderId: options.orderId,
        currency: options.currency,
      })

      // Crear preference
      const preference = await this.preferenceClient.create({
        body: {
          items: [
            {
              id: options.orderId,
              title: options.description || `Pedido ${options.orderId}`,
              quantity: 1,
              unit_price: options.amount / 100, // Convertir centavos a pesos
              currency_id: options.currency,
            },
          ],
          payer: options.customerEmail ? {
            email: options.customerEmail,
            name: options.customerName,
          } : undefined,
          back_urls: {
            success: options.returnUrl,
            failure: options.failureUrl,
            pending: options.returnUrl,
          },
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          auto_return: 'approved' as any,
          external_reference: options.orderId,
          notification_url: this.webhookUrl || undefined,
          expires: options.expiresAt ? true : undefined,
          expiration_date_from: options.expiresAt 
            ? new Date().toISOString()
            : undefined,
          expiration_date_to: options.expiresAt?.toISOString(),
          metadata: options.metadata,
        },
      })

      if (!preference.id) {
        throw new Error('No preference ID returned from Mercado Pago')
      }

      const checkoutUrl = this.config.sandbox
        ? preference.sandbox_init_point!
        : preference.init_point!

      logger.info('Preference created successfully', {
        preferenceId: preference.id,
        hasCheckoutUrl: !!checkoutUrl,
        orderId: options.orderId,
      })

      return {
        externalId: preference.id,
        checkoutUrl,
        status: 'pending',
        expiresAt: preference.expiration_date_to 
          ? new Date(preference.expiration_date_to)
          : undefined,
      }
    } catch (error) {
      logger.error('Failed to create preference', error as Error, {
        orderId: options.orderId,
        amount: options.amount,
      })
      throw this.handleError(error)
    }
  }

  /**
   * Consultar estado de pago en Mercado Pago
   */
  async getPaymentStatus(externalId: string): Promise<PaymentStatus> {
    try {
      // Buscar payment por preference_id (external_reference en MP)
      const searchResult = await this.paymentClient.search({
        options: {
          criteria: 'desc',
          external_reference: externalId,
        },
      })

      if (!searchResult.results || searchResult.results.length === 0) {
        return 'pending'
      }

      // Obtener el payment más reciente
      const latestPayment = searchResult.results[0]!
      const mpStatus = latestPayment.status || 'pending'

      return MP_STATUS_MAP[mpStatus] || 'pending'
    } catch (error) {
      logger.error('Failed to get payment status', error as Error, {
        externalId,
      })
      throw this.handleError(error)
    }
  }

  /**
   * Procesar webhook de Mercado Pago
   */
  async processWebhook(payload: WebhookPayload): Promise<WebhookResult> {
    try {
      logger.debug('Processing webhook', {
        event: payload.event,
        hasData: !!payload.data,
      })

      // Ignorar eventos que no sean de payment
      if (payload.event !== 'payment') {
        return {
          paymentId: '',
          status: 'pending',
          externalId: '',
          processed: false,
        }
      }

      // Extraer payment ID del payload
      const data = payload.data as { id?: string }
      const mpPaymentId = data?.id

      if (!mpPaymentId) {
        logger.warn('Webhook missing payment ID', { event: payload.event })
        return {
          paymentId: '',
          status: 'pending',
          externalId: '',
          processed: false,
        }
      }

      // Consultar payment en Mercado Pago
      const payment = await this.paymentClient.get({ id: mpPaymentId })

      if (!payment || !payment.status) {
        logger.warn('Payment not found in MercadoPago', { mpPaymentId })
        return {
          paymentId: '',
          status: 'pending',
          externalId: mpPaymentId,
          processed: false,
        }
      }

      const status = MP_STATUS_MAP[payment.status] || 'pending'
      const method = this.mapPaymentMethod(payment.payment_type_id || '')

      logger.info('Webhook processed successfully', {
        mpPaymentId,
        mpStatus: payment.status,
        mappedStatus: status,
        method,
        externalReference: payment.external_reference,
      })

      return {
        paymentId: payment.external_reference || '',
        status,
        externalId: payment.id!.toString(),
        processed: true,
        method,
        failureReason: payment.status_detail,
        failureCode: payment.status_detail,
      }
    } catch (error) {
      logger.error('Failed to process webhook', error as Error, {
        event: payload.event,
      })
      throw this.handleError(error)
    }
  }

  /**
   * Mapear tipo de pago de MP a nuestros métodos
   */
  private mapPaymentMethod(mpType: string): WebhookResult['method'] {
    const map: Record<string, NonNullable<WebhookResult['method']>> = {
      'credit_card': 'credit_card',
      'debit_card': 'debit_card',
      'ticket': 'cash',
      'bank_transfer': 'bank_transfer',
      'account_money': 'wallet',
      'digital_wallet': 'wallet',
    }

    return map[mpType]
  }

  /**
   * Convertir error a PaymentError
   */
  private handleError(error: unknown): PaymentError {
    if (error instanceof Error) {
      return new PaymentError(
        error.message,
        PAYMENT_ERROR_CODES.PROVIDER_ERROR,
        502,
        { originalError: error.message }
      )
    }

    return new PaymentError(
      'Unknown provider error',
      PAYMENT_ERROR_CODES.PROVIDER_ERROR,
      502
    )
  }
}
