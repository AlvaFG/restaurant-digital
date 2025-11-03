/**
 * Payment related types
 * Used across the payment flow (payments, orders, integrations)
 */

export type PaymentMethod = 
  | 'cash' 
  | 'card' 
  | 'qr' 
  | 'mercadopago' 
  | 'transfer'

export type PaymentStatus = 
  | 'pending' 
  | 'completed' 
  | 'failed' 
  | 'refunded' 
  | 'cancelled'

export interface Payment {
  id: string
  order_id: string
  amount: number
  method: PaymentMethod
  status: PaymentStatus
  transaction_id?: string
  created_at: string
  updated_at: string
  metadata?: Record<string, unknown>
  error_message?: string
  refund_reason?: string
  refunded_at?: string
}

export interface PaymentStats {
  total_payments: number
  total_amount: number
  by_method: Record<PaymentMethod, number>
  by_status: Record<PaymentStatus, number>
  average_amount: number
  period_start?: string
  period_end?: string
}

export interface CreatePaymentInput {
  order_id: string
  amount: number
  method: PaymentMethod
  metadata?: Record<string, unknown>
}

export interface UpdatePaymentInput {
  status?: PaymentStatus
  transaction_id?: string
  error_message?: string
  metadata?: Record<string, unknown>
}

export interface RefundPaymentInput {
  reason: string
  amount?: number // Partial refund if specified
}

export interface PaymentIntegrationConfig {
  provider: 'mercadopago' | 'stripe' | 'paypal' | 'custom'
  public_key?: string
  enabled: boolean
  test_mode: boolean
}
