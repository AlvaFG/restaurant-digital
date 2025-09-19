import { promises as fs } from "node:fs"
import { access } from "node:fs/promises"
import { constants as fsConstants } from "node:fs"
import path from "node:path"

import {
  MOCK_TABLES,
  MOCK_TABLE_LAYOUT,
  type Table,
  type TableMapLayout,
} from "@/lib/mock-data"
import {
  TABLE_STATE,
  TABLE_STATE_TRANSITIONS,
  type TableState,
} from "@/lib/table-states"

const DATA_DIR = path.join(process.cwd(), "data")
const DATA_FILE = path.join(DATA_DIR, "table-store.json")

interface TableStateHistoryEntry {
  id: string
  tableId: string
  from: TableState
  to: TableState
  actor?: {
    id?: string
    name?: string
    role?: string
  }
  reason?: string
  at: string
}

interface TableStoreData {
  layout: TableMapLayout
  tables: Table[]
  history: TableStateHistoryEntry[]
  updatedAt: string
  version: number
}

interface UpdateOptions {
  actor?: {
    id?: string
    name?: string
    role?: string
  }
  reason?: string
}

type StoreMutation<T> = (draft: TableStoreData) => T

type AsyncStoreMutation<T> = (draft: TableStoreData) => Promise<T>

type MaybeAsyncStoreMutation<T> = StoreMutation<T> | AsyncStoreMutation<T>

const defaultStore = (): TableStoreData => ({
  layout: structuredClone(MOCK_TABLE_LAYOUT),
  tables: structuredClone(MOCK_TABLES),
  history: [],
  updatedAt: new Date().toISOString(),
  version: 1,
})

let cache: TableStoreData | null = null
let writeQueue: Promise<unknown> = Promise.resolve()

function deepClone<T>(value: T): T {
  return structuredClone(value)
}

async function ensureDataFile() {
  try {
    await access(DATA_FILE, fsConstants.F_OK)
  } catch {
    await fs.mkdir(DATA_DIR, { recursive: true })
    await fs.writeFile(DATA_FILE, JSON.stringify(defaultStore(), null, 2), "utf-8")
  }
}

async function loadStore(): Promise<TableStoreData> {
  if (cache) {
    return deepClone(cache)
  }

  await ensureDataFile()

  try {
    const raw = await fs.readFile(DATA_FILE, "utf-8")
    const data = JSON.parse(raw) as TableStoreData

    cache = {
      ...data,
      layout: deepClone(data.layout),
      tables: deepClone(data.tables),
      history: deepClone(data.history),
    }

    return deepClone(cache)
  } catch (error) {
    console.error("[table-store] Failed to read data, using defaults", error)
    const fallback = defaultStore()
    cache = fallback
    return deepClone(fallback)
  }
}

async function persistStore(data: TableStoreData) {
  cache = deepClone(data)
  await fs.mkdir(DATA_DIR, { recursive: true })
  await fs.writeFile(DATA_FILE, JSON.stringify(cache, null, 2), "utf-8")
}

async function withStoreMutation<T>(mutation: MaybeAsyncStoreMutation<T>): Promise<T> {
  const runner = async () => {
    const current = await loadStore()
    const draft = deepClone(current)

    const result = await mutation(draft)

    draft.updatedAt = new Date().toISOString()
    draft.version = draft.version + 1

    await persistStore(draft)

    return result
  }

  const next = writeQueue.then(runner)
  writeQueue = next.then(
    () => undefined,
    (error) => {
      console.error("[table-store] Mutation failed", error)
      return undefined
    },
  )

  return next
}

function assertValidStateTransition(current: TableState, next: TableState) {
  if (current === next) {
    return
  }

  const allowed = TABLE_STATE_TRANSITIONS[current] ?? []
  if (!allowed.includes(next)) {
    throw new Error(`Invalid transition from ${current} to ${next}`)
  }
}

export async function listTables(): Promise<Table[]> {
  const store = await loadStore()
  return deepClone(store.tables)
}

export async function getTableById(tableId: string): Promise<Table | null> {
  const store = await loadStore()
  return deepClone(store.tables.find((table) => table.id === tableId) ?? null)
}

export async function getTableLayout(): Promise<TableMapLayout> {
  const store = await loadStore()
  return deepClone(store.layout)
}

export async function getStoreMetadata() {
  const store = await loadStore()
  return {
    updatedAt: store.updatedAt,
    version: store.version,
  }
}

export async function updateTableLayout(layout: TableMapLayout, tables: Table[]) {
  return withStoreMutation((draft) => {
    draft.layout = deepClone(layout)
    draft.tables = deepClone(tables)
  })
}

export async function updateTableState(
  tableId: string,
  nextState: TableState,
  options: UpdateOptions = {},
): Promise<Table> {
  return withStoreMutation((draft) => {
    const table = draft.tables.find((item) => item.id === tableId)
    if (!table) {
      throw new Error("Table not found")
    }

    const fromState = table.status
    assertValidStateTransition(fromState, nextState)

    table.status = nextState

    const entry: TableStateHistoryEntry = {
      id: generateHistoryId(),
      tableId,
      from: fromState,
      to: nextState,
      actor: options.actor,
      reason: options.reason,
      at: new Date().toISOString(),
    }

    draft.history.unshift(entry)

    return deepClone(table)
  })
}

export async function updateTableMetadata(
  tableId: string,
  updates: Partial<Pick<Table, "number" | "seats" | "zone">>,
): Promise<Table> {
  return withStoreMutation((draft) => {
    const table = draft.tables.find((item) => item.id === tableId)
    if (!table) {
      throw new Error("Table not found")
    }

    if (typeof updates.number !== "undefined") {
      table.number = Math.max(1, Math.floor(updates.number))
    }

    if (typeof updates.seats !== "undefined") {
      table.seats = updates.seats ? Math.max(1, Math.floor(updates.seats)) : undefined
    }

    if (typeof updates.zone !== "undefined") {
      table.zone = updates.zone || undefined
    }

    return deepClone(table)
  })
}

export async function listTableHistory(tableId?: string): Promise<TableStateHistoryEntry[]> {
  const store = await loadStore()
  const history = tableId
    ? store.history.filter((entry) => entry.tableId === tableId)
    : store.history

  return deepClone(history)
}

function generateHistoryId() {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID()
  }

  return `hst-${Math.random().toString(36).slice(2, 10)}`
}

export const DEFAULT_STATE = TABLE_STATE.FREE
