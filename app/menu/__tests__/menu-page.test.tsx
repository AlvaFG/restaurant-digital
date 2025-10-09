// @vitest-environment jsdom

import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from "vitest"
import { cleanup, render, screen } from "@testing-library/react"
import "@testing-library/jest-dom/vitest"
import userEvent from "@testing-library/user-event"
import React, { type ReactNode } from "react"

beforeAll(() => {
  class ResizeObserverMock {
    observe() {}
    unobserve() {}
    disconnect() {}
  }

  global.ResizeObserver = ResizeObserverMock as unknown as typeof ResizeObserver
})

vi.mock("@/components/dashboard-layout", () => ({
  DashboardLayout: ({ children }: { children: ReactNode }) => <div data-testid="dashboard-layout">{children}</div>,
}))

async function renderMenuPage() {
  const menuModule = await import("../page")
  const MenuPage = menuModule.default
  return render(<MenuPage />)
}

describe("MenuPage", () => {
  let user: ReturnType<typeof userEvent.setup>

  beforeEach(() => {
    vi.resetModules()
    vi.clearAllMocks()
    user = userEvent.setup()
  })

  afterEach(() => {
    cleanup()
  })

  it("renderiza el placeholder de gestión de menú", async () => {
    await renderMenuPage()

    expect(await screen.findByRole("heading", { level: 1, name: "Menú" })).toBeInTheDocument()
    expect(screen.getByText("Gestión del menú del restaurante")).toBeInTheDocument()
    expect(screen.getByText("Gestión de Menú")).toBeInTheDocument()
    expect(screen.getByText("Solo disponible para administradores")).toBeInTheDocument()
  })

  it("utiliza el DashboardLayout con rol de admin requerido", async () => {
    await renderMenuPage()

    const dashboardLayout = await screen.findByTestId("dashboard-layout")
    expect(dashboardLayout).toBeInTheDocument()
  })

  it("muestra el contenedor placeholder con estilo centrado", async () => {
    await renderMenuPage()

    const placeholder = screen.getByText("Gestión de Menú").closest("div")
    expect(placeholder).toBeInTheDocument()
    expect(placeholder).toHaveClass("text-center")
  })

  it("renderiza correctamente el título y descripción", async () => {
    await renderMenuPage()

    expect(await screen.findByText("Menú")).toBeInTheDocument()
    expect(screen.getByText("Gestión del menú del restaurante")).toBeInTheDocument()
  })

  it("muestra el mensaje para administradores", async () => {
    await renderMenuPage()

    const adminMessage = await screen.findByText("Solo disponible para administradores")
    expect(adminMessage).toBeInTheDocument()
    expect(adminMessage.tagName).toBe("P")
  })
})
