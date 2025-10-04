import { describe, expect, it } from "vitest"

import {
  buildAlertCreatedPayload,
  buildOrderEventPayload,
  buildOrderSummaryPayload,
  buildTableLayoutUpdatedPayload,
  buildTableUpdatedPayload,
  serializeAlert,
  serializeOrder,
  serializeTable,
} from "@/lib/server/socket-payloads"
import type { OrdersSummary } from "@/lib/server/order-store"
import type { OrdersStoreMetadata, StoredOrder } from "@/lib/server/order-types"
import type { Table } from "@/lib/mock-data"
import { TABLE_STATE } from "@/lib/table-states"

const baseOrder: StoredOrder = {
  id: "order-1",
  tableId: "T1",
  status: "abierto",
  paymentStatus: "pendiente",
  subtotal: 1000,
  total: 1210,
  discountTotalCents: 0,
  taxTotalCents: 210,
  tipCents: 0,
  serviceChargeCents: 0,
  createdAt: new Date("2025-10-03T10:00:00Z"),
  updatedAt: new Date("2025-10-03T10:05:00Z"),
  items: [
    {
      id: "item-1",
      name: "Milanesa",
      quantity: 1,
      price: 1000,
      note: undefined,
      modifiers: undefined,
      totalCents: 1000,
      discount: undefined,
    },
  ],
  discounts: [],
  taxes: [],
  payment: undefined,
  notes: undefined,
  source: undefined,
  customer: undefined,
  metadata: undefined,
}

const baseMetadata: OrdersStoreMetadata = {
  version: 3,
  updatedAt: "2025-10-03T10:05:00Z",
}

describe("socket-payloads", () => {
  it("serializes orders to plain JSON", () => {
    const serialized = serializeOrder(baseOrder)
    expect(serialized.createdAt).toBe("2025-10-03T10:00:00.000Z")
    expect(serialized.items[0].totalCents).toBe(1000)
    expect(serialized.status).toBe("abierto")
  })

  it("builds order event payloads with metadata", () => {
    const payload = buildOrderEventPayload(baseOrder, baseMetadata)
    expect(payload.metadata.version).toBe(3)
    expect(payload.order.updatedAt).toBe("2025-10-03T10:05:00.000Z")
  })

  it("builds summary payloads", () => {
    const summary: OrdersSummary = {
      total: 1,
      byStatus: {
        abierto: 1,
        preparando: 0,
        listo: 0,
        entregado: 0,
        cerrado: 0,
      },
      byPaymentStatus: {
        pendiente: 1,
        pagado: 0,
        cancelado: 0,
      },
      oldestOrderAt: "2025-10-03T09:00:00Z",
      latestOrderAt: "2025-10-03T10:00:00Z",
      pendingPayment: 1,
    }

    const payload = buildOrderSummaryPayload(summary, baseMetadata)
    expect(payload.summary.total).toBe(1)
    expect(payload.metadata.updatedAt).toBe(baseMetadata.updatedAt)
  })

  it("serializes alerts", () => {
    const alertPayload = serializeAlert({
      id: "alert-1",
      tableId: "T1",
      type: "llamar_mozo",
      createdAt: new Date("2025-10-03T10:02:00Z"),
      acknowledged: false,
      message: "Mesa 1 solicita atención",
    })

    expect(alertPayload.createdAt).toBe("2025-10-03T10:02:00.000Z")
  })

  it("serializes table updates", () => {
    const table: Table = {
      id: "T1",
      number: 1,
      status: TABLE_STATE.OCCUPIED,
      zone: "Salon",
      seats: 4,
      qrcodeUrl: "https://example/qr/T1",
      covers: {
        current: 2,
        total: 10,
        sessions: 5,
        lastUpdatedAt: "2025-10-03T09:59:00Z",
        lastSessionAt: "2025-10-03T09:30:00Z",
      },
    }

    const serializedTable = serializeTable(table)
    expect(serializedTable.status).toBe(TABLE_STATE.OCCUPIED)

    const updatePayload = buildTableUpdatedPayload(table, {
      version: 4,
      updatedAt: "2025-10-03T10:00:00Z",
      coverTotals: { current: 12, total: 287, sessions: 143 },
    })
    expect(updatePayload.metadata.version).toBe(4)

    const layoutPayload = buildTableLayoutUpdatedPayload(
      {
        zones: [{ id: "z1", name: "Salon", color: "#fff" }],
        nodes: [{ id: "node-1", tableId: "T1", x: 10, y: 10, width: 50, height: 50, shape: "rectangle", zone: "z1" }],
      },
      [table],
      {
        version: 5,
        updatedAt: "2025-10-03T10:02:00Z",
        coverTotals: { current: 14, total: 300, sessions: 150 },
      },
    )
    expect(layoutPayload.tables[0].id).toBe("T1")
    expect(layoutPayload.metadata.version).toBe(5)
  })

  it("builds alert created events", () => {
    const payload = buildAlertCreatedPayload({
      id: "alert-1",
      tableId: "T1",
      type: "llamar_mozo",
      createdAt: new Date("2025-10-03T10:02:00Z"),
      acknowledged: false,
      message: "Mesa 1 solicita atención",
    })

    expect(payload.alert.id).toBe("alert-1")
  })
})
