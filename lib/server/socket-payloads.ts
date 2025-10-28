import type { Alert, Table, TableMapLayout } from "@/lib/mock-data"
import type { OrdersSummary } from "@/lib/order-service"  // Moved from order-store
import type { OrdersStoreMetadata, StoredOrder } from "@/lib/server/order-types"
import type {
  AlertAcknowledgedPayload,
  AlertCreatedPayload,
  AlertUpdatedPayload,
  OrderEventPayload,
  OrderSummaryEventPayload,
  SerializedAlert,
  SerializedOrder,
  SerializedOrdersSummary,
  SerializedTable,
  SerializedTableLayout,
  SocketHeartbeatPayload,
  SocketReadyPayload,
  TableLayoutUpdatedPayload,
  TableUpdatedPayload,
} from "@/lib/socket-events"

interface TableStoreMetadataPayload {
  version: number
  updatedAt: string
  coverTotals: {
    current: number
    total: number
    sessions: number
  }
}

function toIsoString(value: Date | string | null | undefined): string | null {
  if (!value) {
    return null
  }

  if (value instanceof Date) {
    return value.toISOString()
  }

  const parsed = new Date(value)
  return Number.isNaN(parsed.getTime()) ? null : parsed.toISOString()
}

export function serializeOrder(order: StoredOrder): SerializedOrder {
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
    createdAt: order.createdAt.toISOString(),
    updatedAt: order.updatedAt.toISOString(),
    items: order.items.map((item) => ({
      id: item.id,
      name: item.name,
      quantity: item.quantity,
      price: item.price,
      totalCents: item.totalCents,
      note: item.note,
      modifiers: item.modifiers?.map((modifier) => ({
        id: modifier.id,
        name: modifier.name,
        priceCents: modifier.priceCents,
      })),
      discount: item.discount
        ? {
            code: item.discount.code,
            type: item.discount.type,
            value: item.discount.value,
            reason: item.discount.reason,
            scope: item.discount.scope,
            amountCents: item.discount.amountCents,
          }
        : undefined,
    })),
    discounts: order.discounts.map((discount) => ({
      code: discount.code,
      type: discount.type,
      value: discount.value,
      reason: discount.reason,
      scope: discount.scope,
      amountCents: discount.amountCents,
    })),
    taxes: order.taxes.map((tax) => ({
      code: tax.code,
      name: tax.name,
      rate: tax.rate,
      amountCents: tax.amountCents,
    })),
    payment: order.payment
      ? {
          method: order.payment.method,
          amountCents: order.payment.amountCents,
          status: order.payment.status,
          reference: order.payment.reference,
        }
      : undefined,
    notes: order.notes,
    source: order.source,
    customer: order.customer ? { ...order.customer } : undefined,
    metadata: order.metadata ? { ...order.metadata } : undefined,
  }
}

export function serializeOrdersSummary(summary: OrdersSummary): SerializedOrdersSummary {
  return {
    total: summary.total,
    byStatus: { ...summary.byStatus },
    byPaymentStatus: { ...summary.byPaymentStatus },
    oldestOrderAt: summary.oldestOrderAt ?? null,
    latestOrderAt: summary.latestOrderAt ?? null,
    pendingPayment: summary.pendingPayment,
  }
}

export function serializeAlert(alert: Alert): SerializedAlert {
  return {
    id: alert.id,
    tableId: alert.tableId,
    type: alert.type,
    message: alert.message,
    createdAt: toIsoString(alert.createdAt) ?? new Date().toISOString(),
    acknowledged: Boolean(alert.acknowledged),
  }
}

export function serializeTable(table: Table): SerializedTable {
  return {
    id: table.id,
    number: table.number,
    status: table.status,
    zone: table.zone,
    seats: table.seats,
    qrcodeUrl: table.qrcodeUrl,
    covers: {
      current: table.covers.current,
      total: table.covers.total,
      sessions: table.covers.sessions,
      lastUpdatedAt: toIsoString(table.covers.lastUpdatedAt),
      lastSessionAt: toIsoString(table.covers.lastSessionAt),
    },
  }
}

export function serializeTableLayout(layout: TableMapLayout): SerializedTableLayout {
  return {
    zones: layout.zones.map((zone) => ({ ...zone })),
    nodes: layout.nodes.map((node) => ({ ...node })),
  }
}

export function buildOrderEventPayload(
  order: StoredOrder,
  metadata: OrdersStoreMetadata,
): OrderEventPayload {
  return {
    order: serializeOrder(order),
    metadata: {
      version: metadata.version,
      updatedAt: metadata.updatedAt,
    },
  }
}

export function buildOrderSummaryPayload(
  summary: OrdersSummary,
  metadata: OrdersStoreMetadata,
): OrderSummaryEventPayload {
  return {
    summary: serializeOrdersSummary(summary),
    metadata: {
      version: metadata.version,
      updatedAt: metadata.updatedAt,
    },
  }
}

export function buildTableUpdatedPayload(
  table: Table,
  metadata: TableStoreMetadataPayload,
): TableUpdatedPayload {
  return {
    table: serializeTable(table),
    metadata,
  }
}

export function buildTableLayoutUpdatedPayload(
  layout: TableMapLayout,
  tables: Table[],
  metadata: TableStoreMetadataPayload,
): TableLayoutUpdatedPayload {
  return {
    layout: serializeTableLayout(layout),
    tables: tables.map((table) => serializeTable(table)),
    metadata,
  }
}

export function buildAlertCreatedPayload(alert: Alert): AlertCreatedPayload {
  return {
    alert: serializeAlert(alert),
  }
}

export function buildAlertUpdatedPayload(
  alertId: string,
  acknowledged: boolean,
): AlertUpdatedPayload {
  return {
    alertId,
    acknowledged,
  }
}

export function buildAlertAcknowledgedPayload(
  alertId: string,
  acknowledged: boolean,
): AlertAcknowledgedPayload {
  return {
    alertId,
    acknowledged,
  }
}

export function buildReadyPayload(input: {
  connectionId: string
  orders?: {
    metadata: OrdersStoreMetadata
    summary: OrdersSummary | null
  }
  tables?: {
    metadata: TableStoreMetadataPayload
    layout?: TableMapLayout
    tables?: Table[]
  }
  alerts?: {
    active: Alert[]
  }
}): SocketReadyPayload {
  return {
    connectionId: input.connectionId,
    issuedAt: new Date().toISOString(),
    orders: input.orders
      ? {
          metadata: {
            version: input.orders.metadata.version,
            updatedAt: input.orders.metadata.updatedAt,
          },
          summary: input.orders.summary ? serializeOrdersSummary(input.orders.summary) : null,
        }
      : undefined,
    tables: input.tables
      ? {
          metadata: {
            version: input.tables.metadata.version,
            updatedAt: input.tables.metadata.updatedAt,
            coverTotals: {
              current: input.tables.metadata.coverTotals.current,
              total: input.tables.metadata.coverTotals.total,
              sessions: input.tables.metadata.coverTotals.sessions,
            },
          },
          layout: input.tables.layout ? serializeTableLayout(input.tables.layout) : undefined,
          tables: input.tables.tables?.map((table) => serializeTable(table)),
        }
      : undefined,
    alerts: input.alerts
      ? {
          active: input.alerts.active.map((alert) => serializeAlert(alert)),
        }
      : undefined,
  }
}

export function buildHeartbeatPayload(connectionId: string): SocketHeartbeatPayload {
  return {
    connectionId,
    ts: new Date().toISOString(),
  }
}
