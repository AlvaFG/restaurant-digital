import { act, renderHook, waitFor } from "@testing-library/react"
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"

import { JSDOM } from "jsdom"

type TestGlobal = typeof globalThis & {
  window?: Window
  document?: Document
  navigator?: Navigator
  HTMLElement?: typeof HTMLElement
  Node?: typeof Node
  DocumentFragment?: typeof DocumentFragment
}

const dom = typeof window === "undefined" ? new JSDOM("<!doctype html><html><body></body></html>") : null
if (dom) {
  const { window } = dom
  const globalObject = globalThis as TestGlobal

  if (!globalObject.window) {
    globalObject.window = window
  }
  if (!globalObject.document) {
    globalObject.document = window.document
  }
  if (!globalObject.navigator) {
    Object.defineProperty(globalObject, "navigator", { value: window.navigator, configurable: true })
  }
  if (!globalObject.HTMLElement) {
    globalObject.HTMLElement = window.HTMLElement
  }
  if (!globalObject.Node) {
    globalObject.Node = window.Node
  }
  if (!globalObject.DocumentFragment) {
    globalObject.DocumentFragment = window.DocumentFragment
  }
}



import type { OrdersQueryResult } from "@/lib/order-service"
import type { OrderStatus } from "@/lib/server/order-types"

const mockFetchOrders = vi.fn<(params?: unknown) => Promise<OrdersQueryResult>>()

type SocketPayload = Record<string, unknown>
type SocketHandler = (payload: SocketPayload) => void

const socketHandlers: Record<string, SocketHandler[]> = {}
const onMock = vi.fn((event: string, handler: SocketHandler) => {
  socketHandlers[event] = [...(socketHandlers[event] ?? []), handler]
})
const offMock = vi.fn((event: string, handler: SocketHandler) => {
  socketHandlers[event] = (socketHandlers[event] ?? []).filter((listener) => listener !== handler)
})

vi.mock("@/lib/order-service", async (original) => {
  const actual = await original()
  return {
    ...actual,
    fetchOrders: mockFetchOrders,
  }
})

vi.mock("@/hooks/use-socket", () => ({
  useSocket: () => ({
    on: onMock,
    off: offMock,
    emit: vi.fn(),
    socket: {},
  }),
}))

describe("useOrdersPanel", () => {
  let useOrdersPanel: typeof import("@/app/pedidos/_hooks/use-orders-panel")['useOrdersPanel']

  beforeEach(async () => {
    mockFetchOrders.mockReset()
    mockFetchOrders.mockResolvedValue({
      orders: [
        {
          id: "order-1",
          tableId: "1",
          status: "abierto",
          paymentStatus: "pendiente",
          subtotal: 3600,
          total: 4356,
          discountTotalCents: 0,
          taxTotalCents: 756,
          tipCents: 0,
          serviceChargeCents: 0,
          items: [
            { id: "1", name: "Milanesa", price: 1800, quantity: 2, totalCents: 3600 },
          ],
          createdAt: new Date("2025-10-03T10:00:00Z"),
          updatedAt: new Date("2025-10-03T10:00:00Z"),
        },
      ],
      summary: {
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
        oldestOrderAt: new Date("2025-10-03T10:00:00Z"),
        latestOrderAt: new Date("2025-10-03T10:00:00Z"),
        pendingPayment: 1,
      },
      storeMetadata: {
        version: 2,
        updatedAt: "2025-10-03T10:00:00Z",
      },
      receivedAt: new Date("2025-10-03T10:00:10Z"),
    })

    onMock.mockReset()
    offMock.mockReset()
    Object.keys(socketHandlers).forEach((key) => delete socketHandlers[key])

    const hookModule = await import("@/app/pedidos/_hooks/use-orders-panel")
    useOrdersPanel = hookModule.useOrdersPanel
  })

  afterEach(() => {
    vi.clearAllMocks()
  })

  it("carga pedidos y expone estado inicial", async () => {
    const { result } = renderHook(() => useOrdersPanel())

    expect(mockFetchOrders).toHaveBeenCalledTimes(1)

    await waitFor(() => expect(result.current.isLoading).toBe(false))

    expect(result.current.orders).toHaveLength(1)
    expect(result.current.summary?.total).toBe(1)
    expect(result.current.error).toBeNull()
    expect(onMock).toHaveBeenCalledWith("order.updated", expect.any(Function))
  })

  it("actualiza filtros de estado y dispara un refetch", async () => {
    const { result } = renderHook(() => useOrdersPanel())

    await waitFor(() => expect(result.current.isLoading).toBe(false))
    expect(mockFetchOrders).toHaveBeenCalledTimes(1)

    mockFetchOrders.mockResolvedValueOnce({
      orders: [],
      summary: {
        total: 0,
        byStatus: {
          abierto: 0,
          preparando: 0,
          listo: 0,
          entregado: 0,
          cerrado: 0,
        },
        byPaymentStatus: {
          pendiente: 0,
          pagado: 0,
          cancelado: 0,
        },
        oldestOrderAt: null,
        latestOrderAt: null,
        pendingPayment: 0,
      },
      storeMetadata: {
        version: 3,
        updatedAt: "2025-10-03T10:05:00Z",
      },
      receivedAt: new Date("2025-10-03T10:05:00Z"),
    })

    act(() => {
      result.current.setStatusFilters(["listo" as OrderStatus])
    })

    await waitFor(() => expect(mockFetchOrders).toHaveBeenCalledTimes(2))
    expect(result.current.statusFilters).toEqual(["listo"])
  })

  it("escucha eventos de socket y vuelve a cargar datos", async () => {
    const { result } = renderHook(() => useOrdersPanel())

    await waitFor(() => expect(result.current.isLoading).toBe(false))
    expect(mockFetchOrders).toHaveBeenCalledTimes(1)

    const handler = socketHandlers["order.updated"]?.[0]
    expect(handler).toBeDefined()

    mockFetchOrders.mockResolvedValueOnce({
      orders: [
        {
          id: "order-1",
          tableId: "1",
          status: "listo",
          paymentStatus: "pendiente",
          subtotal: 3600,
          total: 4356,
          discountTotalCents: 0,
          taxTotalCents: 756,
          tipCents: 0,
          serviceChargeCents: 0,
          items: [
            { id: "1", name: "Milanesa", price: 1800, quantity: 2, totalCents: 3600 },
          ],
          createdAt: new Date("2025-10-03T10:00:00Z"),
          updatedAt: new Date("2025-10-03T10:10:00Z"),
        },
      ],
      summary: {
        total: 1,
        byStatus: {
          abierto: 0,
          preparando: 0,
          listo: 1,
          entregado: 0,
          cerrado: 0,
        },
        byPaymentStatus: {
          pendiente: 1,
          pagado: 0,
          cancelado: 0,
        },
        oldestOrderAt: new Date("2025-10-03T10:00:00Z"),
        latestOrderAt: new Date("2025-10-03T10:10:00Z"),
        pendingPayment: 1,
      },
      storeMetadata: {
        version: 4,
        updatedAt: "2025-10-03T10:10:00Z",
      },
      receivedAt: new Date("2025-10-03T10:10:00Z"),
    })

    act(() => {
      handler?.({ orderId: "order-1", status: "listo" })
    })

    await waitFor(() => expect(mockFetchOrders).toHaveBeenCalledTimes(2))
    expect(result.current.orders[0].status).toBe("listo")
  })
})











