import { promises as fs } from "node:fs"
import { access } from "node:fs/promises"
import { constants as fsConstants } from "node:fs"
import { getDataDir, getDataFile } from "./data-path"

import {
  MOCK_TABLES,
  MOCK_TABLE_LAYOUT,
  type Table,
  type TableCovers,
  type TableMapLayout,
} from "@/lib/mock-data"
import {
  TABLE_STATE,
  TABLE_STATE_TRANSITIONS,
  type TableState,
} from "@/lib/table-states"
import { MAX_COVERS } from "@/lib/constants"
import { getSocketBus } from "./socket-bus"
import { buildTableLayoutUpdatedPayload, buildTableUpdatedPayload } from "./socket-payloads"

export { MAX_COVERS }

const DATA_DIR = getDataDir()
const DATA_FILE = getDataFile("table-store.json")

const FALLBACK_QR_ORIGIN = "https://restaurant360.local"

const DEFAULT_COVERS: TableCovers = {
  current: 0,
  total: 0,
  sessions: 0,
  lastUpdatedAt: null,
  lastSessionAt: null,
}

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
  covers?: {
    from: number
    to: number
  }
  at: string
}

interface CoverTotals {
  current: number
  total: number
  sessions: number
}

interface TableStoreData {
  layout: TableMapLayout
  tables: Table[]
  history: TableStateHistoryEntry[]
  updatedAt: string
  version: number
  coverTotals: CoverTotals
}

interface UpdateOptions {
  actor?: {
    id?: string
    name?: string
    role?: string
  }
  reason?: string
  covers?: number
}

type StoreMutation<T> = (draft: TableStoreData) => T

type AsyncStoreMutation<T> = (draft: TableStoreData) => Promise<T>

type MaybeAsyncStoreMutation<T> = StoreMutation<T> | AsyncStoreMutation<T>

function resolveQrOrigin(candidate?: string) {
  if (!candidate) {
    return FALLBACK_QR_ORIGIN
  }

  let value = candidate.trim()
  if (!value) {
    return FALLBACK_QR_ORIGIN
  }

  if (!/^https?:\/\//i.test(value)) {
    value = `https://${value}`
  }

  try {
    const url = new URL(value)
    return `${url.protocol}//${url.host}`
  } catch {
    return FALLBACK_QR_ORIGIN
  }
}

export function getQrUrl(tableId: string, options?: { origin?: string }) {
  const cleanId = String(tableId ?? "").trim()
  if (!cleanId) {
    throw new Error("tableId is required to build QR url")
  }

  const originCandidate =
    options?.origin ??
    process.env.NEXT_PUBLIC_APP_URL ??
    process.env.NEXT_PUBLIC_SITE_URL ??
    process.env.APP_BASE_URL ??
    process.env.VERCEL_PROJECT_PRODUCTION_URL

  const base = resolveQrOrigin(originCandidate)

  return `${base}/qr/${encodeURIComponent(cleanId)}`
}

function deepClone<T>(value: T): T {
  return structuredClone(value)
}

function sanitizeNonNegativeInteger(value: number): number {
  if (!Number.isFinite(value)) {
    return 0
  }

  return Math.max(0, Math.floor(value))
}

function sanitizeCurrentCovers(value: number): number {
  const bounded = sanitizeNonNegativeInteger(value)
  return Math.min(MAX_COVERS, bounded)
}

function sanitizeTimestamp(value: unknown): string | null {
  if (!value) {
    return null
  }

  if (value instanceof Date) {
    const time = value.getTime()
    return Number.isNaN(time) ? null : value.toISOString()
  }

  if (typeof value === 'string') {
    const parsed = new Date(value)
    return Number.isNaN(parsed.getTime()) ? null : parsed.toISOString()
  }

  return null
}

function prepareTable(table: Table): Table {
  table.covers = {
    ...structuredClone(DEFAULT_COVERS),
    ...(table.covers ?? {}),
  }

  table.covers.current = sanitizeCurrentCovers(table.covers.current)
  table.covers.total = sanitizeNonNegativeInteger(table.covers.total)
  table.covers.sessions = sanitizeNonNegativeInteger(table.covers.sessions)
  table.covers.lastUpdatedAt = sanitizeTimestamp(table.covers.lastUpdatedAt)
  table.covers.lastSessionAt = sanitizeTimestamp(table.covers.lastSessionAt)

  if (!table.qrcodeUrl) {
    table.qrcodeUrl = getQrUrl(table.id)
  }

  return table
}

function calculateCoverTotals(tables: Table[]): CoverTotals {
  return tables.reduce(
    (acc, table) => {
      const normalized = prepareTable(deepClone(table))
      acc.current += normalized.covers.current
      acc.total += normalized.covers.total
      acc.sessions += normalized.covers.sessions
      return acc
    },
    { current: 0, total: 0, sessions: 0 } as CoverTotals,
  )
}

const defaultStore = (): TableStoreData => {
  const tables = MOCK_TABLES.map((table) => prepareTable(structuredClone(table)))

  return {
    layout: structuredClone(MOCK_TABLE_LAYOUT),
    tables,
    history: [],
    updatedAt: new Date().toISOString(),
    version: 1,
    coverTotals: calculateCoverTotals(tables),
  }
}

let cache: TableStoreData | null = null
let writeQueue: Promise<unknown> = Promise.resolve()

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
    const data = JSON.parse(raw) as Partial<TableStoreData>

    const layout = data.layout ? deepClone(data.layout) : structuredClone(MOCK_TABLE_LAYOUT)
    const sourceTables = Array.isArray(data.tables) ? data.tables : structuredClone(MOCK_TABLES)
    const tables = sourceTables.map((table) => prepareTable(deepClone(table)))
    const history = Array.isArray(data.history) ? deepClone(data.history) : []
    const updatedAt = sanitizeTimestamp(data.updatedAt) ?? new Date().toISOString()
    const version = typeof data.version === "number" ? data.version : 1

    cache = {
      layout,
      tables,
      history,
      updatedAt,
      version,
      coverTotals: calculateCoverTotals(tables),
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
  const normalized: TableStoreData = {
    ...data,
    tables: data.tables.map((table) => prepareTable(deepClone(table))),
  }

  normalized.coverTotals = calculateCoverTotals(normalized.tables)

  cache = deepClone(normalized)
  await fs.mkdir(DATA_DIR, { recursive: true })
  await fs.writeFile(DATA_FILE, JSON.stringify(cache, null, 2), "utf-8").catch(async (error: NodeJS.ErrnoException) => {
    if (error?.code !== "ENOENT") {
      throw error
    }
    await fs.mkdir(DATA_DIR, { recursive: true })
    await fs.writeFile(DATA_FILE, JSON.stringify(cache, null, 2), "utf-8")
  })
}

async function withStoreMutation<T>(mutation: MaybeAsyncStoreMutation<T>): Promise<T> {
  const runner = async () => {
    const current = await loadStore()
    const draft = deepClone(current)

    const result = await mutation(draft)

    draft.tables = draft.tables.map((table) => prepareTable(table))
    draft.coverTotals = calculateCoverTotals(draft.tables)
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

async function emitTableUpdatedEvent(table: Table) {
  if (typeof window !== "undefined") {
    return
  }

  try {
    const metadata = await getStoreMetadata()
    const bus = getSocketBus()
    bus.publish("table.updated", buildTableUpdatedPayload(table, metadata))
  } catch (error) {
    console.error("[table-store] Failed to broadcast table.update", table.id, error)
  }
}

async function emitTableLayoutEvent() {
  if (typeof window !== "undefined") {
    return
  }

  try {
    const [metadata, layout, tables] = await Promise.all([
      getStoreMetadata(),
      getTableLayout(),
      listTables(),
    ])
    const bus = getSocketBus()
    bus.publish("table.layout.updated", buildTableLayoutUpdatedPayload(layout, tables, metadata))
  } catch (error) {
    console.error("[table-store] Failed to broadcast layout update", error)
  }
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
  return store.tables.map((table) => prepareTable(deepClone(table)))
}

export async function getTableById(tableId: string): Promise<Table | null> {
  const store = await loadStore()
  const table = store.tables.find((item) => item.id === tableId)
  return table ? prepareTable(deepClone(table)) : null
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
    coverTotals: deepClone(store.coverTotals),
  }
}

export async function setTableCurrentCovers(
  tableId: string,
  covers: number,
  options: UpdateOptions = {},
): Promise<Table> {
  const table = await withStoreMutation((draft) => {
    const table = draft.tables.find((item) => item.id === tableId)
    if (!table) {
      throw new Error("Table not found")
    }

    prepareTable(table)

    const previous = table.covers.current
    const nextValue = sanitizeCurrentCovers(covers)
    const hasChanged = previous !== nextValue
    const now = new Date().toISOString()

    table.covers.current = nextValue
    table.covers.lastUpdatedAt = now

    if (typeof options.actor !== "undefined" || typeof options.reason !== "undefined") {
      draft.history.unshift({
        id: generateHistoryId(),
        tableId,
        from: table.status,
        to: table.status,
        actor: options.actor,
        reason: options.reason,
        covers: hasChanged ? { from: previous, to: nextValue } : undefined,
        at: now,
      })
    }

    return deepClone(prepareTable(table))
  })

  void emitTableUpdatedEvent(table)

  return table
}


export async function updateTableLayout(layout: TableMapLayout, tables: Table[]) {
  await withStoreMutation((draft) => {
    draft.layout = deepClone(layout)
    draft.tables = tables.map((table) => prepareTable(deepClone(table)))
  })

  void emitTableLayoutEvent()
}


export async function updateTableState(
  tableId: string,
  nextState: TableState,
  options: UpdateOptions = {},
): Promise<Table> {
  const table = await withStoreMutation((draft) => {
    const table = draft.tables.find((item) => item.id === tableId)
    if (!table) {
      throw new Error("Table not found")
    }

    prepareTable(table)

    const fromState = table.status
    const previousCovers = table.covers.current

    assertValidStateTransition(fromState, nextState)

    const now = new Date().toISOString()

    if (typeof options.covers === "number") {
      table.covers.current = sanitizeCurrentCovers(options.covers)
      table.covers.lastUpdatedAt = now
    }

    table.status = nextState

    if (nextState === TABLE_STATE.PAYMENT_CONFIRMED) {
      const currentCovers = sanitizeCurrentCovers(table.covers.current)
      if (currentCovers > 0) {
        table.covers.total += currentCovers
        table.covers.sessions += 1
        table.covers.lastSessionAt = now
      }
      table.covers.lastUpdatedAt = now
    }

    if (nextState === TABLE_STATE.FREE) {
      table.covers.current = 0
      table.covers.lastUpdatedAt = now
    }

    const coversChanged = previousCovers !== table.covers.current

    const entry: TableStateHistoryEntry = {
      id: generateHistoryId(),
      tableId,
      from: fromState,
      to: nextState,
      actor: options.actor,
      reason: options.reason,
      covers: coversChanged ? { from: previousCovers, to: table.covers.current } : undefined,
      at: now,
    }

    draft.history.unshift(entry)

    return deepClone(prepareTable(table))
  })

  void emitTableUpdatedEvent(table)

  return table
}


export async function updateTableMetadata(
  tableId: string,
  updates: Partial<Pick<Table, "number" | "seats" | "zone">>,
): Promise<Table> {
  const table = await withStoreMutation((draft) => {
    const table = draft.tables.find((item) => item.id === tableId)
    if (!table) {
      throw new Error("Table not found")
    }

    prepareTable(table)

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

  void emitTableUpdatedEvent(table)

  return table
}


export async function listTableHistory(tableId?: string): Promise<TableStateHistoryEntry[]> {
  const store = await loadStore()
  const history = tableId
    ? store.history.filter((entry) => entry.tableId === tableId)
    : store.history

  return deepClone(history)
}

export async function getCoverAnalytics() {
  const store = await loadStore()
  const tables = store.tables.map((table) => {
    const prepared = prepareTable(deepClone(table))
    return {
      id: prepared.id,
      number: prepared.number,
      zone: prepared.zone ?? null,
      seats: prepared.seats ?? null,
      current: prepared.covers.current,
      total: prepared.covers.total,
      sessions: prepared.covers.sessions,
      lastSessionAt: prepared.covers.lastSessionAt ?? null,
      lastUpdatedAt: prepared.covers.lastUpdatedAt ?? null,
      status: prepared.status,
    }
  })

  const metadata = {
    version: store.version,
    updatedAt: store.updatedAt,
    generatedAt: new Date().toISOString(),
    tableCount: tables.length,
    maxCurrentCovers: MAX_COVERS,
  }

  return {
    tables,
    totals: deepClone(store.coverTotals),
    metadata,
    updatedAt: store.updatedAt,
  }
}

function generateHistoryId() {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID()
  }

  return `hst-${Math.random().toString(36).slice(2, 10)}`
}

export const DEFAULT_STATE = TABLE_STATE.FREE

