import type {
  SerializedAlert,
  SerializedOrder,
  SerializedTable,
  SerializedTableLayout,
  SocketEnvelope,
  SocketReadyPayload,
} from "@/lib/socket-events"
import type { Alert, Order, Table, TableMapLayout } from "@/lib/mock-data"

export function parseIsoDate(value: string | null | undefined): Date {
  if (!value) {
    return new Date()
  }
  const parsed = new Date(value)
  if (Number.isNaN(parsed.getTime())) {
    return new Date()
  }
  return parsed
}

export function deserializeAlert(serialized: SerializedAlert): Alert {
  return {
    id: serialized.id,
    tableId: serialized.tableId,
    type: serialized.type,
    message: serialized.message,
    createdAt: parseIsoDate(serialized.createdAt),
    acknowledged: Boolean(serialized.acknowledged),
  }
}

export function deserializeOrderToMock(serialized: SerializedOrder): Order {
  return {
    id: serialized.id,
    tableId: serialized.tableId,
    items: serialized.items.map((item) => ({
      id: item.id,
      name: item.name,
      quantity: item.quantity,
      price: item.price,
    })),
    subtotal: serialized.subtotal,
    total: serialized.total,
    status: serialized.status,
    paymentStatus: serialized.paymentStatus,
    createdAt: parseIsoDate(serialized.createdAt),
  }
}

export function deserializeTable(serialized: SerializedTable): Table {
  return {
    id: serialized.id,
    number: serialized.number,
    status: serialized.status,
    zone: serialized.zone,
    seats: serialized.seats,
    covers: {
      current: serialized.covers.current,
      total: serialized.covers.total,
      sessions: serialized.covers.sessions,
      lastUpdatedAt: serialized.covers.lastUpdatedAt,
      lastSessionAt: serialized.covers.lastSessionAt,
    },
    qrcodeUrl: serialized.qrcodeUrl,
  }
}

export function deserializeTableLayout(serialized: SerializedTableLayout): TableMapLayout {
  return {
    zones: serialized.zones.map((zone) => ({ ...zone })),
    nodes: serialized.nodes.map((node) => ({ ...node })),
  }
}

export function isSocketEnvelope<TEvent extends string = string>(value: unknown): value is SocketEnvelope<TEvent> {
  return Boolean(value && typeof value === "object" && "event" in (value as Record<string, unknown>))
}

export function getReadyAlerts(payload: SocketReadyPayload | null | undefined): Alert[] | null {
  if (!payload?.alerts?.active?.length) {
    return null
  }
  return payload.alerts.active.map(deserializeAlert)
}

export function getReadyTables(payload: SocketReadyPayload | null | undefined): {
  tables: Table[]
  layout: TableMapLayout | null
  updatedAt: string | null
  version: number | null
} | null {
  if (!payload?.tables) {
    return null
  }

  return {
    tables: payload.tables.tables ? payload.tables.tables.map(deserializeTable) : [],
    layout: payload.tables.layout ? deserializeTableLayout(payload.tables.layout) : null,
    updatedAt: payload.tables.metadata.updatedAt ?? null,
    version: payload.tables.metadata.version ?? null,
  }
}
