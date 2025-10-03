import { MOCK_ORDERS } from "@/lib/mock-data"
import type { OrdersSummary } from "@/lib/server/order-store"
import type { PaymentStatus, StoredOrder } from "@/lib/server/order-types"
import type { OrderStatus } from "@/lib/server/order-types"

export type OrdersSortOption = "newest" | "oldest"

export interface FetchOrdersParams {
  status?: OrderStatus[]
  paymentStatus?: PaymentStatus
  tableId?: string
  search?: string
  limit?: number
  sort?: OrdersSortOption
  signal?: AbortSignal
}

export type OrdersPanelItem = StoredOrder["items"][number] & {
  totalCents?: number
}

export interface OrdersPanelOrder {
  id: string
  tableId: string
  status: OrderStatus
  paymentStatus: PaymentStatus
  subtotal: number
  total: number
  discountTotalCents: number
  taxTotalCents: number
  tipCents: number
  serviceChargeCents: number
  createdAt: Date
  updatedAt: Date
  items: OrdersPanelItem[]
  notes?: string
  source?: StoredOrder["source"]
  customer?: StoredOrder["customer"]
  metadata?: StoredOrder["metadata"]
  payment?: StoredOrder["payment"]
}

export interface OrdersSummaryClient {
  total: number
  byStatus: Record<OrderStatus, number>
  byPaymentStatus: Record<PaymentStatus, number>
  oldestOrderAt: Date | null
  latestOrderAt: Date | null
  pendingPayment: number
}

export interface OrdersQueryResult {
  orders: OrdersPanelOrder[]
  summary: OrdersSummaryClient
  storeMetadata: {
    version: number
    updatedAt: string
  }
  receivedAt: Date
}

interface OrdersApiResponse {
  data: SerializedOrder[]
  metadata: {
    store: {
      version: number
      updatedAt: string
    }
    summary: OrdersSummary
  }
}

interface SerializedOrder extends Omit<StoredOrder, "createdAt" | "updatedAt" | "items" | "discounts" | "taxes" | "payment" | "customer" | "metadata"> {
  createdAt: string
  updatedAt: string
  items: StoredOrder["items"]
  discounts: StoredOrder["discounts"]
  taxes: StoredOrder["taxes"]
  payment?: StoredOrder["payment"]
  customer?: StoredOrder["customer"]
  metadata?: StoredOrder["metadata"]
}

const API_TIMEOUT_MESSAGE = "No se pudieron obtener los pedidos"

function buildSearchParams(params: FetchOrdersParams) {
  const searchParams = new URLSearchParams()

  if (params.status?.length) {
    for (const status of params.status) {
      searchParams.append("status", status)
    }
  }

  if (params.paymentStatus) {
    searchParams.set("paymentStatus", params.paymentStatus)
  }

  if (params.tableId) {
    searchParams.set("tableId", params.tableId)
  }

  if (params.search) {
    searchParams.set("search", params.search)
  }

  if (typeof params.limit === "number") {
    searchParams.set("limit", String(params.limit))
  }

  if (params.sort) {
    searchParams.set("sort", params.sort)
  }

  return searchParams
}

function toOrdersPanelOrder(order: SerializedOrder): OrdersPanelOrder {
  return {
    id: order.id,
    tableId: order.tableId,
    status: order.status,
    paymentStatus: order.paymentStatus,
    subtotal: order.subtotal,
    total: order.total,
    discountTotalCents: order.discountTotalCents,
    taxTotalCents: order.taxTotalCents,
    tipCents: order.tipCents,
    serviceChargeCents: order.serviceChargeCents,
    items: order.items.map((item) => ({ ...item })),
    notes: order.notes,
    source: order.source,
    customer: order.customer ? { ...order.customer } : undefined,
    metadata: order.metadata ? { ...order.metadata } : undefined,
    payment: order.payment ? { ...order.payment } : undefined,
    createdAt: new Date(order.createdAt),
    updatedAt: new Date(order.updatedAt),
  }
}

function toSummaryClient(summary: OrdersSummary): OrdersSummaryClient {
  const byStatus = { ...summary.byStatus }
  const byPaymentStatus = { ...summary.byPaymentStatus }

  return {
    total: summary.total,
    byStatus,
    byPaymentStatus,
    oldestOrderAt: summary.oldestOrderAt ? new Date(summary.oldestOrderAt) : null,
    latestOrderAt: summary.latestOrderAt ? new Date(summary.latestOrderAt) : null,
    pendingPayment: summary.pendingPayment,
  }
}

function fallbackOrdersResult(): OrdersQueryResult {
  const now = new Date()
  const byStatus: Record<OrderStatus, number> = {
    abierto: 0,
    preparando: 0,
    listo: 0,
    entregado: 0,
    cerrado: 0,
  }

  const byPaymentStatus: Record<PaymentStatus, number> = {
    pendiente: 0,
    pagado: 0,
    cancelado: 0,
  }

  const orders: OrdersPanelOrder[] = MOCK_ORDERS.map((order) => {
    byStatus[order.status] += 1
    byPaymentStatus[order.paymentStatus] += 1

    return {
      id: order.id,
      tableId: order.tableId,
      status: order.status,
      paymentStatus: order.paymentStatus,
      subtotal: order.subtotal,
      total: order.total,
      discountTotalCents: 0,
      taxTotalCents: 0,
      tipCents: 0,
      serviceChargeCents: 0,
      items: order.items.map((item) => ({
        ...item,
        totalCents: item.price * item.quantity,
      })),
      createdAt: new Date(order.createdAt),
      updatedAt: new Date(order.createdAt),
    }
  })

  const createdAtTimes = orders.map((order) => order.createdAt.getTime())
  const oldest = createdAtTimes.length ? new Date(Math.min(...createdAtTimes)) : null
  const latest = createdAtTimes.length ? new Date(Math.max(...createdAtTimes)) : null

  return {
    orders,
    summary: {
      total: orders.length,
      byStatus,
      byPaymentStatus,
      oldestOrderAt: oldest,
      latestOrderAt: latest,
      pendingPayment: byPaymentStatus.pendiente,
    },
    storeMetadata: {
      version: 0,
      updatedAt: now.toISOString(),
    },
    receivedAt: now,
  }
}

export async function fetchOrders(params: FetchOrdersParams = {}): Promise<OrdersQueryResult> {
  const searchParams = buildSearchParams(params)
  const queryString = searchParams.toString()
  const endpoint = queryString ? `/api/order?${queryString}` : "/api/order"

  try {
    const response = await fetch(endpoint, {
      method: "GET",
      cache: "no-store",
      signal: params.signal,
      headers: {
        "Content-Type": "application/json",
      },
    })

    if (!response.ok) {
      throw new Error(`Request failed with status ${response.status}`)
    }

    const payload = (await response.json()) as OrdersApiResponse

    return {
      orders: payload.data.map(toOrdersPanelOrder),
      summary: toSummaryClient(payload.metadata.summary),
      storeMetadata: payload.metadata.store,
      receivedAt: new Date(),
    }
  } catch (error) {
    console.warn("[order-service]", API_TIMEOUT_MESSAGE, error)
    return fallbackOrdersResult()
  }
}

export type OrderBadgeVariant = "default" | "secondary" | "outline" | "destructive"

export const ORDER_STATUS_BADGE_VARIANT: Record<OrderStatus, OrderBadgeVariant> = {
  abierto: "outline",
  preparando: "secondary",
  listo: "default",
  entregado: "default",
  cerrado: "outline",
}

export const PAYMENT_STATUS_BADGE_VARIANT: Record<PaymentStatus, OrderBadgeVariant> = {
  pendiente: "destructive",
  pagado: "default",
  cancelado: "outline",
}

export const ORDER_STATUS_LABELS: Record<OrderStatus, string> = {
  abierto: "Abierto",
  preparando: "Preparando",
  listo: "Listo",
  entregado: "Entregado",
  cerrado: "Cerrado",
}

export const PAYMENT_STATUS_LABELS: Record<PaymentStatus, string> = {
  pendiente: "Pendiente",
  pagado: "Pagado",
  cancelado: "Cancelado",
}

export const ORDER_STATUS_GROUPS: Record<"en_curso" | "terminados" | "cerrados", OrderStatus[]> = {
  en_curso: ["abierto", "preparando"],
  terminados: ["listo", "entregado"],
  cerrados: ["cerrado"],
}
