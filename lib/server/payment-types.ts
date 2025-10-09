/**
 * Payment System Types
 * 
 * Tipos e interfaces para el sistema de pagos digitales
 * Soporta múltiples providers (Mercado Pago, Stripe)
 * 
 * @module payment-types
 * @version 1.0.0
 */

// ============================================================================
// PAYMENT PROVIDER TYPES
// ============================================================================

/**
 * Providers de pago soportados
 */
export type PaymentProvider = 'mercadopago' | 'stripe'

/**
 * Estados posibles de un payment
 */
export type PaymentStatus = 
  | 'pending'      // Pago creado, esperando confirmación del usuario
  | 'processing'   // En proceso de validación por la pasarela
  | 'completed'    // Pago exitoso y confirmado
  | 'failed'       // Pago rechazado o fallido
  | 'refunded'     // Pago reembolsado
  | 'cancelled'    // Pago cancelado por usuario o sistema
  | 'expired'      // Pago expiró sin completarse

/**
 * Métodos de pago disponibles
 */
export type PaymentMethod = 
  | 'credit_card'       // Tarjeta de crédito
  | 'debit_card'        // Tarjeta de débito
  | 'qr'                // Código QR (Mercado Pago QR)
  | 'wallet'            // Wallet digital (Mercado Pago, Google Pay)
  | 'bank_transfer'     // Transferencia bancaria
  | 'cash'              // Efectivo (Rapipago, Pago Fácil)
  | 'financing'         // Financiación (Mercado Crédito)

/**
 * Monedas soportadas
 */
export type Currency = 'ARS' | 'USD' | 'EUR' | 'BRL' | 'CLP' | 'COP' | 'MXN' | 'PEN' | 'UYU'

// ============================================================================
// PAYMENT MODELS
// ============================================================================

/**
 * Modelo principal de Payment
 */
export interface Payment {
  /** ID interno del payment (pmt-{timestamp}-{sequence}-{random}) */
  id: string

  /** ID de la orden asociada */
  orderId: string

  /** ID de la mesa asociada */
  tableId: string

  /** Provider de pago utilizado */
  provider: PaymentProvider

  /** Estado actual del payment */
  status: PaymentStatus

  /** Monto en centavos */
  amount: number

  /** Moneda del pago */
  currency: Currency

  /** ID externo en la pasarela (preference_id de MP, payment_intent de Stripe) */
  externalId: string

  /** URL de checkout para que el usuario pague */
  checkoutUrl?: string

  /** Método de pago utilizado (disponible después de completar) */
  method?: PaymentMethod

  /** Metadata adicional del payment */
  metadata?: PaymentMetadata

  /** Fecha de creación */
  createdAt: Date

  /** Fecha de última actualización */
  updatedAt: Date

  /** Fecha de completado (cuando status = completed) */
  completedAt?: Date

  /** Fecha de expiración del checkout URL */
  expiresAt?: Date

  /** Razón del fallo (cuando status = failed) */
  failureReason?: string

  /** Código de error de la pasarela */
  failureCode?: string
}

/**
 * Metadata adicional del payment
 */
export interface PaymentMetadata {
  /** Email del cliente (opcional) */
  customerEmail?: string

  /** Teléfono del cliente (opcional) */
  customerPhone?: string

  /** Nombre del cliente (opcional) */
  customerName?: string

  /** Referencia externa (factura, ticket, etc.) */
  reference?: string

  /** Intentos de procesamiento de webhook */
  webhookAttempts?: number

  /** Timestamp del último intento de webhook */
  webhookLastAttempt?: string

  /** Número de reintentos de webhook */
  webhookRetries?: number

  /** URL de retorno después del pago */
  returnUrl?: string

  /** URL en caso de fallo */
  failureUrl?: string

  /** IP desde donde se creó el payment */
  ipAddress?: string

  /** User agent del cliente */
  userAgent?: string

  /** ID del staff que creó el payment (si aplica) */
  staffId?: string

  /** Terminal/POS que creó el payment (si aplica) */
  terminalId?: string

  /** Metadata adicional custom */
  custom?: Record<string, string | number | boolean>
}

// ============================================================================
// API REQUEST/RESPONSE TYPES
// ============================================================================

/**
 * Payload para crear un payment
 */
export interface CreatePaymentPayload {
  /** ID de la orden a pagar */
  orderId: string

  /** Provider a utilizar (opcional, usa default del config) */
  provider?: PaymentProvider

  /** URL de retorno después de pago exitoso */
  returnUrl?: string

  /** URL en caso de fallo */
  failureUrl?: string

  /** Metadata adicional */
  metadata?: {
    customerEmail?: string
    customerPhone?: string
    customerName?: string
    reference?: string
    custom?: Record<string, string | number | boolean>
  }
}

/**
 * Response al crear un payment
 */
export interface CreatePaymentResponse {
  data: {
    /** ID del payment creado */
    paymentId: string

    /** URL para que el usuario complete el pago */
    checkoutUrl: string

    /** Estado inicial (siempre pending) */
    status: PaymentStatus

    /** Fecha de expiración del checkout (opcional) */
    expiresAt?: string
  }
  metadata: {
    /** Provider utilizado */
    provider: PaymentProvider

    /** Timestamp de creación */
    createdAt: string
  }
}

/**
 * Response al consultar un payment
 */
export interface GetPaymentResponse {
  data: SerializedPayment
  metadata: {
    provider: PaymentProvider
  }
}

/**
 * Payment serializado (sin Date objects)
 */
export interface SerializedPayment {
  id: string
  orderId: string
  tableId: string
  provider: PaymentProvider
  status: PaymentStatus
  amount: number
  currency: Currency
  externalId: string
  checkoutUrl?: string
  method?: PaymentMethod
  metadata?: PaymentMetadata
  createdAt: string
  updatedAt: string
  completedAt?: string
  expiresAt?: string
  failureReason?: string
  failureCode?: string
}

/**
 * Filtros para listar payments
 */
export interface ListPaymentsFilters {
  /** Filtrar por estado */
  status?: PaymentStatus | PaymentStatus[]

  /** Filtrar por orden específica */
  orderId?: string

  /** Filtrar por mesa específica */
  tableId?: string

  /** Filtrar por provider */
  provider?: PaymentProvider

  /** Filtrar por método de pago */
  method?: PaymentMethod

  /** Buscar por referencia o email */
  search?: string

  /** Límite de resultados */
  limit?: number

  /** Ordenamiento */
  sort?: 'newest' | 'oldest'
}

// ============================================================================
// PAYMENT PROVIDER INTERFACE
// ============================================================================

/**
 * Configuración de un payment provider
 */
export interface PaymentProviderConfig {
  /** Access token / API key */
  accessToken: string

  /** Public key (para frontend) */
  publicKey?: string

  /** Secret para validar webhooks */
  webhookSecret?: string

  /** Modo sandbox/test */
  sandbox?: boolean

  /** Timeout para llamadas API (ms) */
  timeout?: number
}

/**
 * Opciones al crear un payment en el provider
 */
export interface CreatePaymentOptions {
  /** Monto en centavos */
  amount: number

  /** Moneda */
  currency: Currency

  /** ID de la orden */
  orderId: string

  /** Descripción del pago */
  description?: string

  /** Email del cliente */
  customerEmail?: string

  /** Nombre del cliente */
  customerName?: string

  /** URL de retorno */
  returnUrl?: string

  /** URL de fallo */
  failureUrl?: string

  /** Metadata custom */
  metadata?: Record<string, string>

  /** Fecha de expiración */
  expiresAt?: Date
}

/**
 * Resultado al crear payment en provider
 */
export interface PaymentResult {
  /** ID interno del provider */
  externalId: string

  /** URL para checkout */
  checkoutUrl: string

  /** Estado inicial */
  status: PaymentStatus

  /** Fecha de expiración */
  expiresAt?: Date
}

/**
 * Payload de webhook genérico
 */
export interface WebhookPayload {
  /** Provider que envía el webhook */
  provider: PaymentProvider

  /** Tipo de evento */
  event: string

  /** Data del webhook (estructura varía por provider) */
  data: unknown

  /** Firma del webhook (para validación) */
  signature?: string

  /** Timestamp del evento */
  timestamp?: string
}

/**
 * Resultado al procesar webhook
 */
export interface WebhookResult {
  /** ID del payment afectado */
  paymentId: string

  /** Nuevo estado del payment */
  status: PaymentStatus

  /** ID externo del provider */
  externalId: string

  /** Indica si el webhook fue procesado */
  processed: boolean

  /** Método de pago (si está disponible) */
  method?: PaymentMethod

  /** Razón de fallo (si aplica) */
  failureReason?: string

  /** Código de error (si aplica) */
  failureCode?: string
}

// ============================================================================
// PAYMENT STORE TYPES
// ============================================================================

/**
 * Estructura del payment store en disco
 */
export interface PaymentStoreData {
  /** Lista de payments */
  payments: Payment[]

  /** Metadata del store */
  metadata: PaymentStoreMetadata

  /** Secuencia para generar IDs */
  sequence: number
}

/**
 * Metadata del payment store
 */
export interface PaymentStoreMetadata {
  /** Versión del store (incrementa en cada write) */
  version: number

  /** Timestamp de última actualización */
  updatedAt: string
}

/**
 * Summary de payments
 */
export interface PaymentsSummary {
  /** Total de payments */
  total: number

  /** Payments por estado */
  byStatus: Record<PaymentStatus, number>

  /** Payments por provider */
  byProvider: Record<PaymentProvider, number>

  /** Payment más antiguo */
  oldestPaymentAt: string | null

  /** Payment más reciente */
  latestPaymentAt: string | null

  /** Monto total procesado (completed only) */
  totalProcessed: number

  /** Monto total pendiente */
  totalPending: number

  /** Tasa de éxito (%) */
  successRate: number
}

// ============================================================================
// ERROR TYPES
// ============================================================================

/**
 * Error específico del sistema de pagos
 */
export class PaymentError extends Error {
  readonly name = 'PaymentError'

  constructor(
    message: string,
    public readonly code: string,
    public readonly status: number,
    public readonly meta?: Record<string, unknown>
  ) {
    super(message)
    Object.setPrototypeOf(this, PaymentError.prototype)
  }
}

/**
 * Códigos de error del sistema de pagos
 */
export const PAYMENT_ERROR_CODES = {
  // Validation errors (400)
  INVALID_PAYLOAD: 'INVALID_PAYLOAD',
  INVALID_AMOUNT: 'INVALID_AMOUNT',
  INVALID_CURRENCY: 'INVALID_CURRENCY',
  
  // Not found errors (404)
  PAYMENT_NOT_FOUND: 'PAYMENT_NOT_FOUND',
  ORDER_NOT_FOUND: 'ORDER_NOT_FOUND',
  
  // Conflict errors (409)
  ORDER_ALREADY_PAID: 'ORDER_ALREADY_PAID',
  PAYMENT_IN_PROGRESS: 'PAYMENT_IN_PROGRESS',
  INVALID_PAYMENT_STATUS: 'INVALID_PAYMENT_STATUS',
  
  // Provider errors (502)
  PROVIDER_ERROR: 'PROVIDER_ERROR',
  PROVIDER_TIMEOUT: 'PROVIDER_TIMEOUT',
  PROVIDER_UNAVAILABLE: 'PROVIDER_UNAVAILABLE',
  
  // Webhook errors (400, 403)
  INVALID_WEBHOOK_SIGNATURE: 'INVALID_WEBHOOK_SIGNATURE',
  WEBHOOK_IP_NOT_ALLOWED: 'WEBHOOK_IP_NOT_ALLOWED',
  
  // Internal errors (500)
  INTERNAL_ERROR: 'INTERNAL_ERROR',
  PROCESSING_ERROR: 'PROCESSING_ERROR',
} as const

export type PaymentErrorCode = keyof typeof PAYMENT_ERROR_CODES

// ============================================================================
// WEBSOCKET EVENT TYPES
// ============================================================================

/**
 * Payload para evento payment.created
 */
export interface PaymentCreatedPayload {
  payment: SerializedPayment
  metadata: PaymentStoreMetadata
}

/**
 * Payload para evento payment.updated
 */
export interface PaymentUpdatedPayload {
  payment: SerializedPayment
  metadata: PaymentStoreMetadata
  previousStatus?: PaymentStatus
}

/**
 * Payload para evento payment.completed
 */
export interface PaymentCompletedPayload {
  payment: SerializedPayment
  order: {
    id: string
    tableId: string
    total: number
  }
  metadata: PaymentStoreMetadata
}

/**
 * Payload para evento payment.failed
 */
export interface PaymentFailedPayload {
  payment: SerializedPayment
  reason: string
  code?: string
  metadata: PaymentStoreMetadata
}

// ============================================================================
// MERCADO PAGO SPECIFIC TYPES
// ============================================================================

/**
 * Configuración específica de Mercado Pago
 */
export interface MercadoPagoConfig extends PaymentProviderConfig {
  /** Integrator ID (si aplica) */
  integratorId?: string

  /** Platform ID (si aplica) */
  platformId?: string
}

/**
 * Preference de Mercado Pago
 */
export interface MercadoPagoPreference {
  id: string
  init_point: string
  sandbox_init_point?: string
  date_created: string
  expiration_date_from?: string
  expiration_date_to?: string
}

// ============================================================================
// STRIPE SPECIFIC TYPES (para futuro)
// ============================================================================

/**
 * Configuración específica de Stripe
 */
export interface StripeConfig extends PaymentProviderConfig {
  /** API Version */
  apiVersion?: string

  /** Webhook endpoint secret */
  webhookEndpointSecret?: string
}

/**
 * Payment Intent de Stripe
 */
export interface StripePaymentIntent {
  id: string
  client_secret: string
  status: string
  amount: number
  currency: string
  created: number
}

// ============================================================================
// UTILITY TYPES
// ============================================================================

/**
 * Options para serializar Payment a formato de API
 */
export function serializePayment(payment: Payment): SerializedPayment {
  return {
    id: payment.id,
    orderId: payment.orderId,
    tableId: payment.tableId,
    provider: payment.provider,
    status: payment.status,
    amount: payment.amount,
    currency: payment.currency,
    externalId: payment.externalId,
    checkoutUrl: payment.checkoutUrl,
    method: payment.method,
    metadata: payment.metadata,
    createdAt: payment.createdAt.toISOString(),
    updatedAt: payment.updatedAt.toISOString(),
    completedAt: payment.completedAt?.toISOString(),
    expiresAt: payment.expiresAt?.toISOString(),
    failureReason: payment.failureReason,
    failureCode: payment.failureCode,
  }
}

/**
 * Validar transición de estado
 */
export function isValidStatusTransition(
  from: PaymentStatus,
  to: PaymentStatus
): boolean {
  const validTransitions: Record<PaymentStatus, PaymentStatus[]> = {
    pending: ['processing', 'failed', 'cancelled', 'expired'],
    processing: ['completed', 'failed'],
    completed: ['refunded'],
    failed: [],
    refunded: [],
    cancelled: [],
    expired: [],
  }

  return validTransitions[from]?.includes(to) ?? false
}

/**
 * Calcular tasa de éxito de payments
 */
export function calculateSuccessRate(payments: Payment[]): number {
  if (payments.length === 0) return 0

  const completed = payments.filter(p => p.status === 'completed').length
  return Math.round((completed / payments.length) * 100)
}
