/**
 * Payment Types & Interfaces
 * Types for payment processing with MercadoPago
 */

export interface Payment {
  id: string // MercadoPago payment ID
  orderId: string // Our internal order ID
  amount: number
  currency: 'ARS' | 'USD'
  status: 'pending' | 'approved' | 'rejected' | 'cancelled' | 'refunded'
  paymentMethod: string // e.g., 'credit_card', 'debit_card', 'rapipago'
  merchantOrderId: string
  preferenceId: string
  externalReference: string // Our order ID reference
  metadata: Record<string, unknown>
  createdAt: string
  updatedAt: string
}

export interface PaymentWebhook {
  action: string
  api_version: string
  data: {
    id: string
  }
  date_created: string
  id: number
  live_mode: boolean
  type: 'payment' | 'merchant_order'
  user_id: string
}

export type PaymentStatus = Payment['status']

export interface CreatePreferenceInput {
  orderId: string
  items: Array<{
    id?: string
    title: string
    quantity: number
    unit_price: number
    currency_id: 'ARS'
  }>
  payer: {
    name: string
    email?: string
    phone?: string
  }
  back_urls: {
    success: string
    failure: string
    pending: string
  }
  notification_url: string
  external_reference: string
  metadata: Record<string, unknown>
}

export interface PaymentPreferenceResponse {
  preferenceId: string
  initPoint: string
  sandboxInitPoint?: string
}

// Extend Order type with payment fields
export interface OrderItemModifier {
  id: string
  name: string
  priceCents: number
}

export interface OrderItemForPayment {
  id?: string
  name: string
  basePriceCents: number
  quantity: number
  selectedModifiers?: OrderItemModifier[]
}

export interface OrderWithPayment {
  id: string
  tableId: string
  sessionId: string
  items: OrderItemForPayment[]
  customerName: string
  customerContact: string
  paymentMethod: 'cash' | 'card' | 'mercadopago' | 'transfer'
  paymentStatus?: 'pending' | 'processing' | 'completed' | 'failed' | 'refunded'
  paymentId?: string
  paymentUrl?: string
  totalCents: number
  status: 'pending' | 'confirmed' | 'preparing' | 'ready' | 'delivered' | 'cancelled'
  specialNotes?: string
  createdAt: string
  updatedAt: string
  paidAt?: string
}
