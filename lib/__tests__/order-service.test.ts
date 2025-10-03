import { afterEach, describe, expect, it, vi } from "vitest"

import {
  ORDER_STATUS_BADGE_VARIANT,
  PAYMENT_STATUS_BADGE_VARIANT,
  fetchOrders,
} from "@/lib/order-service"

const originalFetch = global.fetch

afterEach(() => {
  vi.restoreAllMocks()
  global.fetch = originalFetch
})

describe("fetchOrders", () => {
  it("construye la query y normaliza la respuesta", async () => {
    const payload = {
      data: [
        {
          id: "order-1",
          tableId: "7",
          status: "abierto",
          paymentStatus: "pagado",
          subtotal: 1000,
          total: 1500,
          discountTotalCents: 0,
          taxTotalCents: 200,
          tipCents: 0,
          serviceChargeCents: 0,
          items: [{ id: "item-1", name: "Cafe", price: 500, quantity: 2, totalCents: 1000 }],
          discounts: [],
          taxes: [],
          createdAt: "2025-10-03T10:00:00Z",
          updatedAt: "2025-10-03T10:05:00Z",
        },
      ],
      metadata: {
        store: { version: 1, updatedAt: "2025-10-03T10:05:00Z" },
        summary: {
          total: 1,
          byStatus: { abierto: 1, preparando: 0, listo: 0, entregado: 0, cerrado: 0 },
          byPaymentStatus: { pagado: 1, pendiente: 0, cancelado: 0 },
          oldestOrderAt: "2025-10-03T10:00:00Z",
          latestOrderAt: "2025-10-03T10:05:00Z",
          pendingPayment: 0,
        },
      },
    }

    const fetchMock = vi
      .spyOn(global, "fetch" as const)
      .mockResolvedValue(new Response(JSON.stringify(payload), { status: 200, headers: { "Content-Type": "application/json" } }))

    const result = await fetchOrders({
      status: ["abierto", "preparando"],
      paymentStatus: "pagado",
      tableId: "7",
      search: "mesa",
      limit: 20,
      sort: "oldest",
    })

    expect(fetchMock).toHaveBeenCalledTimes(1)
    expect(fetchMock.mock.calls[0]?.[0]).toBe("/api/order?status=abierto&status=preparando&paymentStatus=pagado&tableId=7&search=mesa&limit=20&sort=oldest")
    expect(fetchMock.mock.calls[0]?.[1]).toMatchObject({ cache: "no-store", method: "GET" })

    expect(result.orders[0].createdAt).toBeInstanceOf(Date)
    expect(result.summary.total).toBe(1)
  })

  it("usa fallback y registra advertencia si la peticion falla", async () => {
    vi.spyOn(console, "warn").mockImplementation(() => {})
    vi.spyOn(global, "fetch" as const).mockRejectedValue(new Error("network"))

    const result = await fetchOrders()

    expect(result.orders.length).toBeGreaterThan(0)
    expect(result.summary.total).toBe(result.orders.length)
    expect(console.warn).toHaveBeenCalled()
  })
})


describe("status badge tokens", () => {
  it("define variantes consistentes", () => {
    expect(ORDER_STATUS_BADGE_VARIANT.abierto).toBe("outline")
    expect(ORDER_STATUS_BADGE_VARIANT.preparando).toBe("secondary")
    expect(PAYMENT_STATUS_BADGE_VARIANT.pendiente).toBe("destructive")
  })
})
