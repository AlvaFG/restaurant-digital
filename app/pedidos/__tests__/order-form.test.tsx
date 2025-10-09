import "@testing-library/jest-dom/vitest"
import { render, screen, waitFor } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"

import { OrderForm } from "@/components/order-form"

const mockToast = vi.fn()
const mockRefetch = vi.fn(async () => undefined)
const tableServiceMock = vi.hoisted(() => ({
  mockFetchTables: vi.fn(),
}))

vi.mock("@/hooks/use-toast", () => ({
  useToast: () => ({ toast: mockToast }),
}))

vi.mock("@/lib/table-service", () => ({
  fetchTables: tableServiceMock.mockFetchTables,
}))

vi.mock("@/app/pedidos/_providers/orders-panel-provider", () => ({
  useOrdersPanelContext: () => ({
    refetch: mockRefetch,
  }),
}))

const mockFetchTables = tableServiceMock.mockFetchTables

type User = ReturnType<typeof userEvent.setup>

describe("<OrderForm />", () => {
  const originalFetch = global.fetch
  const originalEnv = process.env.NEXT_PUBLIC_DISABLE_SOCKET

  beforeEach(() => {
    mockFetchTables.mockReset()
    mockToast.mockReset()
    mockRefetch.mockClear()
    process.env.NEXT_PUBLIC_DISABLE_SOCKET = originalEnv
  })

  afterEach(() => {
    global.fetch = originalFetch
    process.env.NEXT_PUBLIC_DISABLE_SOCKET = originalEnv
  })

  async function setupForm() {
    mockFetchTables.mockResolvedValue({
      data: [
        {
          id: "table-1",
          number: 5,
          zone: "Salon",
          status: "libre",
          covers: { current: 0, total: 0, sessions: 0, lastUpdatedAt: null, lastSessionAt: null },
        },
      ],
    })

    const utils = render(<OrderForm />)
    await waitFor(() => expect(mockFetchTables).toHaveBeenCalled())
    return utils
  }

  async function selectTable(user: User) {
    const triggers = await screen.findAllByRole("combobox")
    // Use the first combobox (the table selector)
    const trigger = triggers[0]!
    await user.click(trigger)
    const option = await screen.findByRole("option", { name: /mesa 5/i })
    await user.click(option)
  }

  async function addFirstMenuItem(user: User) {
    const addButtons = await screen.findAllByRole("button", { name: /^Agregar /i })
    await user.click(addButtons[0]!)
  }

  it("muestra toast de exito, resetea formulario y respeta spinner", async () => {
    const user = userEvent.setup()
    const apiResponse = {
      data: {
        id: "order-1",
        tableId: "table-1",
        status: "abierto",
        paymentStatus: "pendiente",
        subtotal: 1800,
        total: 1800,
        discountTotalCents: 0,
        taxTotalCents: 0,
        tipCents: 0,
        serviceChargeCents: 0,
        items: [
          { id: "item-1", name: "Cafe", price: 900, quantity: 2, totalCents: 1800 },
        ],
        discounts: [],
        taxes: [],
        createdAt: "2025-10-03T10:00:00Z",
        updatedAt: "2025-10-03T10:00:00Z",
      },
      metadata: {
        version: 2,
        updatedAt: "2025-10-03T10:05:00Z",
      },
    }

    global.fetch = vi.fn().mockResolvedValue(
      new Response(JSON.stringify(apiResponse), {
        status: 201,
        headers: { "Content-Type": "application/json" },
      }),
    )

    await setupForm()
    await selectTable(user)
    await addFirstMenuItem(user)

    const createButton = screen.getByRole("button", { name: /crear pedido/i })
    await user.click(createButton)

    // Button should show loading state immediately
    await waitFor(() => {
      expect(createButton).toHaveTextContent(/creando/i)
      expect(createButton).toBeDisabled()
    })

    // Wait for success toast
    await waitFor(() =>
      expect(mockToast).toHaveBeenCalledWith(
        expect.objectContaining({
          title: "Pedido creado",
        }),
      ),
    )

    // Form should eventually reset - check that table is back to placeholder
    await waitFor(() => {
      const comboboxes = screen.getAllByRole("combobox")
      expect(comboboxes[0]).toHaveTextContent(/Selecciona una mesa/i)
    })
    
    expect(screen.getByText(/No hay items en el pedido/)).toBeInTheDocument()
    expect(mockRefetch).not.toHaveBeenCalled()
  })

  it("muestra toast destructivo en errores 4xx y conserva datos", async () => {
    const user = userEvent.setup()

    global.fetch = vi.fn().mockResolvedValue(
      new Response(JSON.stringify({ error: { code: "STOCK", message: "Sin stock" } }), {
        status: 409,
        headers: { "Content-Type": "application/json" },
      }),
    )

    await setupForm()
    await selectTable(user)
    await addFirstMenuItem(user)

    const createButton = screen.getByRole("button", { name: /crear pedido/i })
    await user.click(createButton)

    await waitFor(() =>
      expect(mockToast).toHaveBeenCalledWith(
        expect.objectContaining({
          title: "No se pudo crear el pedido",
          description: "Sin stock",
          variant: "destructive",
        }),
      ),
    )

    expect(createButton).toHaveTextContent(/crear pedido/i)
    expect(screen.getAllByText(/Milanesa/i)[0]).toBeInTheDocument()
    expect(mockRefetch).not.toHaveBeenCalled()
  })

  it("refresca el panel cuando los sockets estan deshabilitados", async () => {
    const user = userEvent.setup()
    process.env.NEXT_PUBLIC_DISABLE_SOCKET = "1"

    const apiResponse = {
      data: {
        id: "order-1",
        tableId: "table-1",
        status: "abierto",
        paymentStatus: "pendiente",
        subtotal: 1800,
        total: 1800,
        discountTotalCents: 0,
        taxTotalCents: 0,
        tipCents: 0,
        serviceChargeCents: 0,
        items: [
          { id: "item-1", name: "Cafe", price: 900, quantity: 2, totalCents: 1800 },
        ],
        discounts: [],
        taxes: [],
        createdAt: "2025-10-03T10:00:00Z",
        updatedAt: "2025-10-03T10:00:00Z",
      },
      metadata: {
        version: 2,
        updatedAt: "2025-10-03T10:05:00Z",
      },
    }

    global.fetch = vi.fn().mockResolvedValue(
      new Response(JSON.stringify(apiResponse), {
        status: 201,
        headers: { "Content-Type": "application/json" },
      }),
    )

    await setupForm()
    await selectTable(user)
    await addFirstMenuItem(user)

    const createButton = screen.getByRole("button", { name: /crear pedido/i })
    await user.click(createButton)

    await waitFor(() => expect(mockRefetch).toHaveBeenCalledWith({ silent: false }))
  })
})
