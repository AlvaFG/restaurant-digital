import { beforeEach, describe, expect, it, vi } from "vitest"
import { promises as fs } from "node:fs"
import path from "node:path"

const dataDir = path.join(process.cwd(), "data")

async function resetStore() {
  await fs.rm(dataDir, { recursive: true, force: true }).catch(() => undefined)
  vi.resetModules()
}

describe("tables API", () => {
  beforeEach(async () => {
    await resetStore()
  })

  it("GET /api/tables returns list with metadata", async () => {
    const { GET } = await import("@/app/api/tables/route")

    const response = await GET()
    expect(response.status).toBe(200)

    const body = await response.json()
    expect(body.data).toHaveLength(6)
    expect(body.metadata.version).toBeGreaterThan(0)
  })

  it("GET /api/table-layout returns layout and tables", async () => {
    const { GET } = await import("@/app/api/table-layout/route")

    const response = await GET()
    expect(response.status).toBe(200)

    const body = await response.json()
    expect(body.layout.nodes.length).toBeGreaterThan(0)
    expect(body.tables.length).toBeGreaterThan(0)
  })

  it("PATCH /api/tables/[id]/state updates table status", async () => {
    const { GET: getTable } = await import("@/app/api/tables/[id]/route")
    const { PATCH } = await import("@/app/api/tables/[id]/state/route")

    let response = await getTable(new Request("http://localhost"), { params: { id: "1" } })
    let body = await response.json()
    expect(body.data.status).toBe("libre")

    const patchResponse = await PATCH(
      new Request("http://localhost", {
        method: "PATCH",
        body: JSON.stringify({ status: "ocupada", actor: { id: "tester" } }),
      }),
      { params: { id: "1" } },
    )

    expect(patchResponse.status).toBe(200)

    response = await getTable(new Request("http://localhost"), { params: { id: "1" } })
    body = await response.json()
    expect(body.data.status).toBe("ocupada")
    expect(body.history[0].from).toBe("libre")
    expect(body.history[0].to).toBe("ocupada")
  })

  it("PATCH /api/tables/[id]/state rejects invalid transition", async () => {
    const { PATCH } = await import("@/app/api/tables/[id]/state/route")

    const response = await PATCH(
      new Request("http://localhost", {
        method: "PATCH",
        body: JSON.stringify({ status: "libre" }),
      }),
      { params: { id: "2" } },
    )

    expect(response.status).toBe(409)
  })
})
