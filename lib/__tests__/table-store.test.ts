import { beforeEach, describe, expect, it, vi } from "vitest"
import { promises as fs } from "node:fs"
import path from "node:path"

const dataDir = path.join(process.cwd(), "data")

async function resetStoreModule() {
  await fs.rm(dataDir, { recursive: true, force: true }).catch(() => undefined)
  vi.resetModules()
  return import("@/lib/server/table-store")
}

describe("table-store", () => {
  beforeEach(async () => {
    await fs.rm(dataDir, { recursive: true, force: true }).catch(() => undefined)
    vi.resetModules()
  })

  it("returns default tables and layout when no file exists", async () => {
    const { listTables, getTableLayout } = await resetStoreModule()

    const tables = await listTables()
    const layout = await getTableLayout()

    expect(tables).toHaveLength(6)
    expect(layout.nodes).not.toHaveLength(0)
  })

  it("persists layout updates and reloads them", async () => {
    const { updateTableLayout, getTableLayout, listTables } = await resetStoreModule()

    const initialTables = await listTables()
    const initialLayout = await getTableLayout()

    const updatedLayout = {
      ...initialLayout,
      nodes: initialLayout.nodes.map((node, index) => ({
        ...node,
        x: node.x + index * 5,
      })),
    }

    const updatedTables = initialTables.map((table, index) => ({
      ...table,
      seats: (table.seats ?? 4) + index,
    }))

    await updateTableLayout(updatedLayout, updatedTables)

    const reloadedLayout = await getTableLayout()
    const reloadedTables = await listTables()

    expect(reloadedLayout.nodes.map((node) => node.x)).toEqual(updatedLayout.nodes.map((node) => node.x))
    expect(reloadedTables.map((table) => table.seats)).toEqual(updatedTables.map((table) => table.seats))
  })

  it("enforces valid state transitions and records history", async () => {
    const {
      listTables,
      updateTableState,
      listTableHistory,
    } = await resetStoreModule()

    const tables = await listTables()
    const target = tables.find((table) => table.status === "libre") ?? tables[0]

    const updated = await updateTableState(target.id, "ocupada", {
      actor: { id: "tester", name: "Tester", role: "staff" },
      reason: "assign",
    })

    expect(updated.status).toBe("ocupada")

    const history = await listTableHistory(target.id)
    expect(history[0]).toMatchObject({
      tableId: target.id,
      from: "libre",
      to: "ocupada",
      actor: { id: "tester", name: "Tester", role: "staff" },
      reason: "assign",
    })

    await expect(updateTableState(target.id, "libre")).rejects.toThrow("Invalid transition")
  })
})
