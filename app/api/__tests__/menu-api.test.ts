import { afterAll, beforeEach, describe, expect, it, vi } from "vitest"
import { promises as fs } from "node:fs"
import path from "node:path"

const menuDataDir = path.join(process.cwd(), ".tmp", "vitest-menu-api")

async function resetStores() {
  process.env.RESTAURANT_DATA_DIR = menuDataDir
  await fs.rm(menuDataDir, { recursive: true, force: true }).catch(() => undefined)
  await fs.mkdir(menuDataDir, { recursive: true })
  vi.resetModules()
}

describe("menu API", () => {
  beforeEach(async () => {
    await resetStores()
  })

  afterAll(async () => {
    await fs.rm(menuDataDir, { recursive: true, force: true }).catch(() => undefined)
    delete process.env.RESTAURANT_DATA_DIR
  })

  it("GET /api/menu returns catalog with headers", async () => {
    const { GET } = await import("@/app/api/menu/route")

    const response = await GET()
    expect(response.status).toBe(200)
    expect(response.headers.get("x-menu-version")).toBeTruthy()
    expect(response.headers.get("x-menu-updated-at")).toBeTruthy()

    const body = await response.json()
    expect(Array.isArray(body.data.categories)).toBe(true)
    expect(Array.isArray(body.data.items)).toBe(true)
    expect(Array.isArray(body.data.allergens)).toBe(true)
    expect(body.data.metadata).toBeDefined()
  })

  it("PATCH /api/menu/items/:id returns 404 for unknown item", async () => {
    const { PATCH } = await import("@/app/api/menu/items/[id]/route")

    const response = await PATCH(
      new Request("http://localhost", {
        method: "PATCH",
        body: JSON.stringify({ name: "Nuevo nombre" }),
      }),
      { params: { id: "nope" } },
    )

    expect(response.status).toBe(404)
  })

  it("POST /api/menu/orders returns 404 when item is missing", async () => {
    const { POST } = await import("@/app/api/menu/orders/route")

    const response = await POST(
      new Request("http://localhost", {
        method: "POST",
        body: JSON.stringify({
          tableId: "1",
          items: [{ menuItemId: "desconocido", quantity: 1 }],
        }),
      }),
    )

    expect(response.status).toBe(404)
    const body = await response.json()
    expect(body.error).toContain("Menu item not found")
  })

  it("POST /api/menu/orders rejects invalid payload", async () => {
    const { POST } = await import("@/app/api/menu/orders/route")

    const response = await POST(
      new Request("http://localhost", {
        method: "POST",
        body: JSON.stringify({ tableId: "", items: [] }),
      }),
    )

    expect(response.status).toBe(400)
    const body = await response.json()
    expect(body.error).toBeDefined()
  })
})



