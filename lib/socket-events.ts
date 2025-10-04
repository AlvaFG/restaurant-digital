import type { TableState } from "@/lib/table-states"

export interface SocketStoreMetadata {
  version: number
  updatedAt: string
}

export interface SerializedOrderItemModifier {
  id?: string
  name: string
  priceCents: number
}

export interface SerializedAppliedDiscount {
  code?: string
  type: "percentage" | "fixed"
  value: number
  reason?: string
  scope: "order" | "item"
  amountCents: number
}

export interface SerializedAppliedTax {
  code: string
  name: string
  rate?: number
  amountCents: number
}

export interface SerializedPaymentBreakdown {
  method: "efectivo" | "tarjeta" | "qr" | "transferencia" | "mixto" | "cortesia"
  amountCents: number
  status: "pendiente" | "pagado" | "cancelado"
  reference?: string
}

export interface SerializedOrderItem {
  id: string
  name: string
  quantity: number
  price: number
  totalCents: number
  note?: string
  modifiers?: SerializedOrderItemModifier[]
  discount?: SerializedAppliedDiscount
}

export interface SerializedCustomerReference {
  id?: string
  name?: string
  email?: string
  loyaltyId?: string
}

export interface SerializedOrder {
  id: string
  tableId: string
  status: "abierto" | "preparando" | "listo" | "entregado" | "cerrado"
  paymentStatus: "pendiente" | "pagado" | "cancelado"
  subtotal: number
  total: number
  discountTotalCents: number
  taxTotalCents: number
  tipCents: number
  serviceChargeCents: number
  createdAt: string
  updatedAt: string
  items: SerializedOrderItem[]
  discounts: SerializedAppliedDiscount[]
  taxes: SerializedAppliedTax[]
  payment?: SerializedPaymentBreakdown
  notes?: string
  source?: "staff" | "qr" | "pos" | "integracion"
  customer?: SerializedCustomerReference
  metadata?: Record<string, unknown>
}

export interface SerializedOrdersSummary {
  total: number
  byStatus: Record<SerializedOrder["status"], number>
  byPaymentStatus: Record<SerializedOrder["paymentStatus"], number>
  oldestOrderAt: string | null
  latestOrderAt: string | null
  pendingPayment: number
}

export interface SerializedAlert {
  id: string
  tableId: string
  type: "llamar_mozo" | "pedido_entrante" | "quiere_pagar_efectivo" | "pago_aprobado"
  message: string
  createdAt: string
  acknowledged: boolean
}

export interface SerializedTableCovers {
  current: number
  total: number
  sessions: number
  lastUpdatedAt: string | null
  lastSessionAt: string | null
}

export interface SerializedTable {
  id: string
  number: number
  status: TableState
  zone?: string
  seats?: number
  covers: SerializedTableCovers
  qrcodeUrl?: string
}

export interface SerializedTableLayout {
  zones: Array<{ id: string; name: string; color: string }>
  nodes: Array<{
    id: string
    tableId: string
    x: number
    y: number
    width: number
    height: number
    shape: "rectangle" | "circle"
    zone: string
  }>
}

export interface SocketReadyPayload {
  connectionId: string
  issuedAt: string
  orders?: {
    metadata: SocketStoreMetadata
    summary: SerializedOrdersSummary | null
  }
  tables?: {
    metadata: SocketStoreMetadata & {
      coverTotals: {
        current: number
        total: number
        sessions: number
      }
    }
    layout?: SerializedTableLayout
    tables?: SerializedTable[]
  }
  alerts?: {
    active: SerializedAlert[]
  }
}

export interface SocketHeartbeatPayload {
  connectionId: string
  ts: string
}

export interface OrderEventPayload {
  order: SerializedOrder
  metadata: SocketStoreMetadata
}

export interface OrderSummaryEventPayload {
  summary: SerializedOrdersSummary
  metadata: SocketStoreMetadata
}

export interface TableUpdatedPayload {
  table: SerializedTable
  metadata: SocketStoreMetadata & {
    coverTotals: {
      current: number
      total: number
      sessions: number
    }
  }
}

export interface TableLayoutUpdatedPayload {
  layout: SerializedTableLayout
  tables: SerializedTable[]
  metadata: SocketStoreMetadata & {
    coverTotals: {
      current: number
      total: number
      sessions: number
    }
  }
}

export interface AlertCreatedPayload {
  alert: SerializedAlert
}

export interface AlertUpdatedPayload {
  alertId: string
  acknowledged: boolean
}

export interface AlertAcknowledgedPayload {
  alertId: string
  acknowledged: boolean
}

export interface SocketEventMap {
  "socket.ready": SocketReadyPayload
  "socket.heartbeat": SocketHeartbeatPayload
  "order.created": OrderEventPayload
  "order.updated": OrderEventPayload
  "order.summary.updated": OrderSummaryEventPayload
  "table.updated": TableUpdatedPayload
  "table.layout.updated": TableLayoutUpdatedPayload
  "alert.created": AlertCreatedPayload
  "alert.updated": AlertUpdatedPayload
  "alert.acknowledged": AlertAcknowledgedPayload
}

export type SocketEventName = keyof SocketEventMap
export type SocketEventPayload<TEvent extends SocketEventName> = SocketEventMap[TEvent]

export interface SocketEnvelope<TEvent extends SocketEventName = SocketEventName> {
  event: TEvent
  payload: SocketEventPayload<TEvent>
  ts: string
}
