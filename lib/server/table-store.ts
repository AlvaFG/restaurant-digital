import { promises as fs } from "node:fs"
import { access } from "node:fs/promises"
import { constants as fsConstants } from "node:fs"
import { getDataDir, getDataFile } from "./data-path"
import { createLogger } from "@/lib/logger"
import { createServerClient } from "@/lib/supabase/server"
import { randomBytes } from "crypto"

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

const logger = createLogger('table-store')

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
  // Asegurar que number sea string (backward compatibility)
  if (typeof table.number === 'number') {
    table.number = String(table.number)
  }
  
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
    logger.warn('Failed to read store data, using defaults', { 
      error: error instanceof Error ? error.message : String(error),
      dataFile: DATA_FILE,
    })
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
      logger.error('Store mutation failed', error as Error)
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
    logger.error('Failed to broadcast table update', error as Error, {
      tableId: table.id,
    })
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
    logger.error('Failed to broadcast layout update', error as Error)
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
  try {
    const supabase = createServerClient()
    
    const { data: tables, error } = await supabase
      .from('tables')
      .select('*')
      .order('number', { ascending: true })
    
    if (error) {
      logger.error('Error al listar mesas desde Supabase', error)
      logger.info('Usando fallback a store JSON')
      // Fallback al store si Supabase falla
      const store = await loadStore()
      return store.tables.map((table) => prepareTable(deepClone(table)))
    }
    
    if (!tables || tables.length === 0) {
      logger.info('No hay mesas en Supabase, usando fallback a store JSON')
      // Si Supabase está vacío, usar el store JSON
      const store = await loadStore()
      return store.tables.map((table) => prepareTable(deepClone(table)))
    }
    
    logger.info('Mesas obtenidas desde Supabase', { count: tables.length })
    
    // Convertir datos de Supabase al formato Table
    return tables.map((t: any) => ({
      id: t.id,
      number: String(t.number), // Asegurar que sea string
      zone_id: t.zone_id || undefined,
      zone: t.zone || undefined,
      status: t.status || 'libre',
      seats: t.capacity || 4,
      covers: {
        current: 0,
        total: 0,
        sessions: 0,
        lastUpdatedAt: null,
        lastSessionAt: null,
      },
      qrcodeUrl: t.qrcode_url || '',
      qrToken: t.qr_token || '',
      qrTokenExpiry: t.qr_expires_at ? new Date(t.qr_expires_at) : undefined,
    }))
  } catch (error) {
    logger.error('Error inesperado al listar mesas', error as Error)
    logger.info('Usando fallback a store JSON')
    // Fallback al store
    const store = await loadStore()
    return store.tables.map((table) => prepareTable(deepClone(table)))
  }
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
      // Ahora number es string, no hacemos Math operations
      table.number = String(updates.number)
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

/**
 * Actualiza el token QR de una mesa
 */
export async function updateTableQR(
  tableId: string,
  token: string,
  expiry: Date
): Promise<void> {
  await withStoreMutation((store) => {
    const table = store.tables.find((t) => t.id === tableId)
    if (!table) {
      throw new Error(`Table ${tableId} not found`)
    }

    table.qrToken = token
    table.qrTokenExpiry = expiry

    logger.info('Table QR updated', {
      tableId,
      expiresAt: expiry.toISOString(),
    })
  })
}

/**
 * Obtiene una mesa por su token QR
 */
export async function getTableByQRToken(token: string): Promise<Table | null> {
  const store = await loadStore()
  const table = store.tables.find((t) => t.qrToken === token)
  return table ? prepareTable(deepClone(table)) : null
}

export const DEFAULT_STATE = TABLE_STATE.FREE

/**
 * Genera un token QR único
 */
function generateQRToken(): string {
  return randomBytes(32).toString('base64url')
}

/**
 * Crea una nueva mesa en Supabase
 */
export async function createTable(data: {
  number: string
  zone_id?: string
  tenantId: string
}): Promise<Table> {
  const supabase = createServerClient()

  // Verificar que el número de mesa no exista para este tenant
  const { data: existing } = await supabase
    .from('tables')
    .select('id')
    .eq('tenant_id', data.tenantId)
    .eq('number', data.number)
    .single()

  if (existing) {
    throw new Error(`Ya existe una mesa con el identificador "${data.number}"`)
  }

  // Si se proporciona zone_id, verificar que exista y pertenezca al tenant
  if (data.zone_id) {
    const { data: zone } = await supabase
      .from('zones')
      .select('id')
      .eq('id', data.zone_id)
      .eq('tenant_id', data.tenantId)
      .single()

    if (!zone) {
      throw new Error('La zona seleccionada no existe o no pertenece a este tenant')
    }
  }

  // Generar token QR único
  const qrToken = generateQRToken()
  const qrExpiresAt = new Date()
  qrExpiresAt.setFullYear(qrExpiresAt.getFullYear() + 1) // Expira en 1 año

  // Crear la mesa (capacity por defecto es 4 según schema)
  const { data: newTable, error } = await supabase
    .from('tables')
    .insert({
      tenant_id: data.tenantId,
      number: data.number,
      zone_id: data.zone_id || null,
      status: 'libre',
      qr_token: qrToken,
      qr_expires_at: qrExpiresAt.toISOString(),
      qrcode_url: '', // Se generará en el cliente
      metadata: {},
    } as any)
    .select()
    .single()

  if (error || !newTable) {
    logger.error('Error al crear mesa', error, {
      tenantId: data.tenantId,
      number: data.number,
    })
    throw new Error('No se pudo crear la mesa')
  }

  const tableData = newTable as any

  logger.info('Mesa creada', {
    tableId: tableData.id,
    number: tableData.number,
    tenantId: data.tenantId,
  })

  // Transformar al formato Table
  const table: Table = {
    id: tableData.id,
    number: tableData.number,
    zone: tableData.zone || undefined,
    seats: tableData.capacity,
    status: tableData.status as TableState,
    qrcodeUrl: getQrUrl(tableData.id),
    qrToken: tableData.qr_token || undefined,
    qrTokenExpiry: tableData.qr_expires_at ? new Date(tableData.qr_expires_at) : undefined,
    covers: {
      current: 0,
      total: 0,
      sessions: 0,
      lastUpdatedAt: null,
      lastSessionAt: null,
    },
  }

  // Emitir evento de actualización
  void emitTableLayoutEvent()

  return table
}

/**
 * Elimina una mesa de Supabase
 */
export async function deleteTable(tableId: string, tenantId: string): Promise<void> {
  const supabase = createServerClient()

  // Verificar que la mesa existe y pertenece al tenant
  const { data: tableData, error: fetchError } = await supabase
    .from('tables')
    .select('id, number, status, tenant_id')
    .eq('id', tableId)
    .eq('tenant_id', tenantId)
    .single()

  if (fetchError || !tableData) {
    throw new Error('Mesa no encontrada')
  }

  const table = tableData as any

  // No permitir eliminar mesas ocupadas o con pedidos en curso
  const restrictedStates = ['ocupada', 'pedido-en-curso', 'cuenta-pedida']
  if (restrictedStates.includes(table.status)) {
    throw new Error(
      `No se puede eliminar la mesa ${table.number} porque está ${table.status}. ` +
      'Por favor, finaliza la sesión primero.'
    )
  }

  // Eliminar la mesa
  const { error: deleteError } = await supabase
    .from('tables')
    .delete()
    .eq('id', tableId)
    .eq('tenant_id', tenantId)

  if (deleteError) {
    logger.error('Error al eliminar mesa', deleteError, {
      tableId,
      tenantId,
    })
    throw new Error('No se pudo eliminar la mesa')
  }

  logger.info('Mesa eliminada', {
    tableId,
    number: table.number,
    tenantId,
  })

  // Emitir evento de actualización
  void emitTableLayoutEvent()
}


