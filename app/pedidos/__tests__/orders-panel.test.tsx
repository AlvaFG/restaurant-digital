import "@testing-library/jest-dom/vitest"
import { render, waitFor, within } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { beforeEach, describe, expect, it, vi } from "vitest"

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
import type { OrdersPanelOrder, OrdersSummaryClient } from "@/lib/order-service"

const mockUseOrdersPanelContext = vi.fn()
const mockFetchTables = vi.fn().mockResolvedValue({
  data: [
    {
      id: "1",
      number: 7,
      zone: "Salon",
      status: "abierto",
      covers: { current: 0, total: 0, sessions: 0, lastUpdatedAt: null, lastSessionAt: null },
    },
  ],
})

vi.mock("@/app/pedidos/_providers/orders-panel-provider", () => ({
  useOrdersPanelContext: mockUseOrdersPanelContext,
}))

vi.mock("@/lib/table-service", () => ({
  fetchTables: mockFetchTables,
}))


describe("<OrdersPanel />", () => {
  let baseOrder: OrdersPanelOrder
  let baseSummary: OrdersSummaryClient
  let baseReturn: ReturnType<typeof mockUseOrdersPanelContext>

  beforeEach(() => {
    mockUseOrdersPanelContext.mockReset()
    mockFetchTables.mockClear()

    baseOrder = {
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
      items: [{ id: "1", name: "Milanesa", price: 1800, quantity: 2, totalCents: 3600 }],
      createdAt: new Date("2025-10-03T10:00:00Z"),
      updatedAt: new Date("2025-10-03T10:00:00Z"),
      notes: "Sin cebolla",
      payment: { method: "efectivo", amountCents: 2000, status: "pendiente" },
    }

    baseSummary = {
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
    }

    baseReturn = {
      orders: [baseOrder],
      filteredOrders: [baseOrder],
      summary: baseSummary,
      isLoading: false,
      isRefreshing: false,
      error: null,
      statusFilters: ["abierto", "preparando", "listo"],
      paymentFilter: "todos",
      search: "",
      lastUpdated: new Date("2025-10-03T10:05:00Z"),
      setStatusFilters: vi.fn(),
      setPaymentFilter: vi.fn(),
      setSearch: vi.fn(),
      refetch: vi.fn().mockResolvedValue(undefined),
    }

    mockUseOrdersPanelContext.mockReturnValue(baseReturn)
  })

  it("renderiza resumen y lista de pedidos", async () => {
    const { OrdersPanel } = await import("@/components/orders-panel")
    const { getByText } = render(<OrdersPanel />)

    await waitFor(() => expect(getByText("Mesa 7")).toBeInTheDocument())

    expect(getByText("Pedidos supervisados")).toBeInTheDocument()
    expect(getByText(/Panel de pedidos/)).toBeInTheDocument()
    expect(getByText(/Milanesa/)).toBeInTheDocument()
    expect(getByText(/Pedido #order-1/)).toBeInTheDocument()
    expect(getByText(/Nota del cliente: Sin cebolla/)).toBeInTheDocument()
  })

  it("permite cambiar filtros de estado", async () => {
    const setStatusFilters = vi.fn()
    mockUseOrdersPanelContext.mockReturnValue({
      ...baseReturn,
      setStatusFilters,
    })
    const { OrdersPanel } = await import("@/components/orders-panel")
    const { container } = render(<OrdersPanel />)

    const toggleGroup = container.querySelector('[data-slot="toggle-group"]') as HTMLElement | null
    expect(toggleGroup).not.toBeNull()

    const toggle = within(toggleGroup as HTMLElement).getByRole("button", { name: /abierto/i })
    await userEvent.click(toggle)

    expect(setStatusFilters).toHaveBeenCalled()
  })

  it("muestra estado de carga inicial", async () => {
    mockUseOrdersPanelContext.mockReturnValue({
      ...baseReturn,
      orders: [],
      filteredOrders: [],
      summary: null,
      isLoading: true,
    })

    const { OrdersPanel } = await import("@/components/orders-panel")
    const { container } = render(<OrdersPanel />)

    expect(container.querySelector(".animate-spin")).not.toBeNull()
  })

  it("renderiza alerta en caso de error y permite reintentar", async () => {
    const refetch = vi.fn().mockResolvedValue(undefined)
    mockUseOrdersPanelContext.mockReturnValue({
      ...baseReturn,
      orders: [],
      filteredOrders: [],
      summary: null,
      error: "Fallo al cargar",
      refetch,
    })

    const { OrdersPanel } = await import("@/components/orders-panel")
    const { findByText, container } = render(<OrdersPanel />)

    expect(await findByText(/Error al obtener pedidos/)).toBeInTheDocument()

    const retryButton = container.querySelector('[data-testid="orders-error-retry"]') as HTMLButtonElement | null
    expect(retryButton).not.toBeNull()
    await userEvent.click(retryButton!)

    expect(refetch).toHaveBeenCalledWith({ silent: false })
  })

  it("permite refrescar manualmente", async () => {
    const refetch = vi.fn().mockResolvedValue(undefined)
    mockUseOrdersPanelContext.mockReturnValue({
      ...baseReturn,
      refetch,
    })

    const { OrdersPanel } = await import("@/components/orders-panel")
    const { container } = render(<OrdersPanel />)

    const refreshButton = container.querySelector('button[aria-label="Actualizar pedidos"]') as HTMLButtonElement | null
    expect(refreshButton).not.toBeNull()
    await userEvent.click(refreshButton!)

    expect(refetch).toHaveBeenCalledWith({ silent: true })
  })
})

