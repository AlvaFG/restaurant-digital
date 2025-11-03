import type { Order } from "@/lib/mock-data"

type BaseOrderItem = Order["items"][number]

export const ORDER_STATUS = {
  OPEN: "abierto",
  PREPARING: "preparando",
  READY: "listo",
  DELIVERED: "entregado",
  CLOSED: "cerrado",
} as const satisfies Record<string, Order["status"]>

export const PAYMENT_STATUS = {
  PENDING: "pendiente",
  PAID: "pagado",
  CANCELLED: "cancelado",
} as const satisfies Record<string, Order["paymentStatus"]>

export type OrderStatus = Order["status"]
export type PaymentStatus = Order["paymentStatus"]

export type PaymentMethod =
  | "efectivo"
  | "tarjeta"
  | "qr"
  | "transferencia"
  | "mixto"
  | "cortesia"

export interface OrderDiscountInput {
  code?: string
  type: "percentage" | "fixed"
  value: number
  reason?: string
  scope?: "order" | "item"
}

export interface OrderTaxInput {
  code: string
  name?: string
  rate?: number
  amountCents?: number
}

export interface OrderItemModifierInput {
  id?: string
  name: string
  priceCents: number
  groupId: string
  groupName: string
  optionId: string
  optionName: string
}

export interface CreateOrderItemInput {
  menuItemId: string
  quantity: number
  note?: string
  modifiers?: OrderItemModifierInput[]
  discount?: OrderDiscountInput
}

export interface CustomerReference {
  id?: string
  name?: string
  email?: string
  loyaltyId?: string
}

export interface PaymentBreakdownInput {
  method: PaymentMethod
  amountCents?: number
  status?: PaymentStatus
  reference?: string
}

export interface CreateOrderPayload {
  tableId: string
  items: CreateOrderItemInput[]
  tipCents?: number
  serviceChargeCents?: number
  discounts?: OrderDiscountInput[]
  taxes?: OrderTaxInput[]
  payment?: PaymentBreakdownInput
  notes?: string
  source?: "staff" | "qr" | "pos" | "integracion"
  customer?: CustomerReference
  metadata?: Record<string, unknown>
}

export interface AppliedDiscount {
  code?: string
  type: OrderDiscountInput["type"]
  value: number
  reason?: string
  scope: NonNullable<OrderDiscountInput["scope"]>
  amountCents: number
}

export interface AppliedTax {
  code: string
  name: string
  rate?: number
  amountCents: number
}

export interface OrderItemModifier {
  id?: string
  name: string
  priceCents: number
  // Propiedades para compatibilidad con CartItemModifier
  groupId: string
  groupName: string
  optionId: string
  optionName: string
}

export interface StoredOrderItem extends BaseOrderItem {
  note?: string
  modifiers?: OrderItemModifier[]
  totalCents: number
  discount?: AppliedDiscount
}

export interface PaymentBreakdown {
  method: PaymentMethod
  amountCents: number
  status: PaymentStatus
  reference?: string
}

export interface StoredOrder extends Order {
  items: StoredOrderItem[]
  discountTotalCents: number
  taxTotalCents: number
  tipCents: number
  serviceChargeCents: number
  discounts: AppliedDiscount[]
  taxes: AppliedTax[]
  payment?: PaymentBreakdown
  notes?: string
  source?: "staff" | "qr" | "pos" | "integracion"
  customer?: CustomerReference
  metadata?: Record<string, unknown>
  updatedAt: Date
}

export interface OrdersStoreMetadata {
  version: number
  updatedAt: string
}
export interface InventoryItem {
  menuItemId: string
  stock: number
  minStock: number
  updatedAt: string
}

export interface OrdersStoreData {
  orders: StoredOrder[]
  inventory: Record<string, InventoryItem>
  metadata: OrdersStoreMetadata
  sequence: number
}
