import type { Table, TableMapLayout } from "@/lib/mock-data"
import { MOCK_TABLES, MOCK_TABLE_LAYOUT } from "@/lib/mock-data"
import { TABLE_STATE } from "@/lib/table-states"

type TablesResponse = {
  data: Table[]
  metadata?: {
    version: number
    updatedAt: string
  }
}

type TableResponse = {
  data: Table
  history?: unknown
  metadata?: {
    version: number
    updatedAt: string
  }
}

type LayoutResponse = {
  layout: TableMapLayout
  tables: Table[]
  metadata?: {
    version: number
    updatedAt: string
  }
}

async function fetchJSON<T>(input: RequestInfo, init?: RequestInit): Promise<T> {
  const response = await fetch(input, {
    cache: "no-store",
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(init?.headers ?? {}),
    },
  })

  if (!response.ok) {
    throw new Error(`Request failed with status ${response.status}`)
  }

  return (await response.json()) as T
}

export async function fetchTables(): Promise<TablesResponse> {
  try {
    return await fetchJSON<TablesResponse>("/api/tables")
  } catch (error) {
    console.warn("[table-service] Falling back to mock tables", error)
    return { data: structuredClone(MOCK_TABLES) }
  }
}

export async function fetchTable(tableId: string): Promise<Table | null> {
  try {
    const result = await fetchJSON<TableResponse>(`/api/tables/${tableId}`)
    return result.data
  } catch (error) {
    console.warn(`[table-service] Falling back to mock table ${tableId}`, error)
    return structuredClone(MOCK_TABLES.find((table) => table.id === tableId) ?? null)
  }
}

export async function fetchLayout(): Promise<LayoutResponse> {
  try {
    return await fetchJSON<LayoutResponse>("/api/table-layout")
  } catch (error) {
    console.warn("[table-service] Falling back to mock layout", error)
    return {
      layout: structuredClone(MOCK_TABLE_LAYOUT),
      tables: structuredClone(MOCK_TABLES),
    }
  }
}

export async function persistLayout(layout: TableMapLayout, tables: Table[]): Promise<void> {
  try {
    await fetchJSON("/api/table-layout", {
      method: "PUT",
      body: JSON.stringify({ layout, tables }),
    })
  } catch (error) {
    console.error("[table-service] Failed to persist layout", error)
    throw error
  }
}

export async function updateTableMetadata(tableId: string, updates: Partial<Pick<Table, "number" | "seats" | "zone">>) {
  try {
    await fetchJSON(`/api/tables/${tableId}`, {
      method: "PATCH",
      body: JSON.stringify(updates),
    })
  } catch (error) {
    console.error("[table-service] Failed to update table metadata", error)
    throw error
  }
}

export async function updateTableState(tableId: string, status: Table["status"], opts?: {
  reason?: string
  actor?: {
    id?: string
    name?: string
    role?: string
  }
}) {
  try {
    await fetchJSON(`/api/tables/${tableId}/state`, {
      method: "PATCH",
      body: JSON.stringify({ status, ...opts }),
    })
  } catch (error) {
    console.error("[table-service] Failed to update table state", error)
    throw error
  }
}

export async function resetTable(tableId: string) {
  await updateTableState(tableId, TABLE_STATE.FREE, { reason: "reset" })
}

export async function inviteHouse(tableId: string) {
  await updateTableState(tableId, TABLE_STATE.PAYMENT_CONFIRMED, { reason: "invita_la_casa" })
}
