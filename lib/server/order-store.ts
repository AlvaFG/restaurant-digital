/**
 * @deprecated Este archivo está deprecado y será eliminado.
 * Usar en su lugar: lib/services/orders-service.ts
 * 
 * Este store usa archivos JSON locales en vez de Supabase.
 * Ver docs/LEGACY_DEPRECATION.md para más información.
 */

import { promises as fs } from "node:fs"
import { access } from "node:fs/promises"
import { constants as fsConstants } from "node:fs"
import { getDataDir, getDataFile } from "./data-path"
import { createLogger } from "@/lib/logger"

import type { MenuItem } from "@/lib/mock-data"
import { TABLE_STATE } from "@/lib/table-states"

import {
  ORDER_STATUS,
  PAYMENT_STATUS,
  type AppliedDiscount,
  type AppliedTax,
  type CreateOrderItemInput,
  type CreateOrderPayload,
  type InventoryItem,
  type OrderDiscountInput,
  type OrdersStoreData,
  type OrdersStoreMetadata,
  type OrderStatus,
  type OrderTaxInput,
  type PaymentBreakdown,
  type PaymentBreakdownInput,
  type PaymentStatus,
  type StoredOrder,
  type StoredOrderItem,
} from "./order-types"
import { getMenuItemsSnapshot } from "./menu-store"
import { getTableById, updateTableState } from "./table-store"
import { getSocketBus } from "./socket-bus"
import { buildOrderEventPayload, buildOrderSummaryPayload } from "./socket-payloads"

const logger = createLogger('order-store')

const DATA_DIR = getDataDir()
const DATA_FILE = getDataFile("order-store.json")

const DEFAULT_INITIAL_STOCK = 40
const DEFAULT_MIN_STOCK = 3
const DEFAULT_TAX_RATE = 0.21
const DEFAULT_TAX_CODE = "iva"
const DEFAULT_TAX_NAME = "IVA"

// Actualizado para incluir todos los estados válidos de tabla
const ALLOWED_TABLE_STATES = new Set([
  TABLE_STATE.FREE,
  TABLE_STATE.OCCUPIED,
  TABLE_STATE.ORDER_IN_PROGRESS,
  'cuenta_solicitada' as const,
  'pago_confirmado' as const
])

export class OrderStoreError extends Error {
  readonly code: string
  readonly status: number
  readonly meta?: Record<string, unknown>

  constructor(message: string, options: { code: string; status: number; meta?: Record<string, unknown> }) {
    super(message)
    this.name = "OrderStoreError"
    this.code = options.code
    this.status = options.status
    this.meta = options.meta
  }
}

let cache: OrdersStoreData | null = null
let writeQueue: Promise<unknown> = Promise.resolve()

type PersistedOrder = Omit<StoredOrder, "createdAt" | "updatedAt"> & {
  createdAt: string
  updatedAt: string
}

type PersistedStore = {
  orders: PersistedOrder[]
  inventory: Record<string, InventoryItem>
  metadata: OrdersStoreMetadata
  sequence: number
}

function deepClone<T>(value: T): T {
  return structuredClone(value)
}

function defaultStore(): OrdersStoreData {
  return {
    orders: [],
    inventory: {},
    metadata: {
      version: 1,
      updatedAt: new Date().toISOString(),
    },
    sequence: 0,
  }
}

async function ensureDataFile() {
  try {
    await access(DATA_FILE, fsConstants.F_OK)
  } catch {
    await fs.mkdir(DATA_DIR, { recursive: true })
    await fs.writeFile(DATA_FILE, JSON.stringify(defaultStore(), null, 2), "utf-8")
  }
}

function reviveOrder(order: PersistedOrder): StoredOrder {
  return {
    ...order,
    createdAt: new Date(order.createdAt),
    updatedAt: new Date(order.updatedAt),
    items: order.items.map((item) => ({ ...item })),
    discounts: order.discounts.map((discount) => ({ ...discount })),
    taxes: order.taxes.map((tax) => ({ ...tax })),
    payment: order.payment ? { ...order.payment } : undefined,
    customer: order.customer ? { ...order.customer } : undefined,
    metadata: order.metadata ? { ...order.metadata } : undefined,
  }
}

function reviveStore(raw: PersistedStore): OrdersStoreData {
  return {
    orders: raw.orders.map(reviveOrder),
    inventory: deepClone(raw.inventory),
    metadata: deepClone(raw.metadata),
    sequence: typeof raw.sequence === "number" ? raw.sequence : 0,
  }
}

function prepareForPersist(store: OrdersStoreData): PersistedStore {
  return {
    orders: store.orders.map((order) => ({
      ...order,
      createdAt: order.createdAt.toISOString(),
      updatedAt: order.updatedAt.toISOString(),
      items: order.items.map((item) => ({ ...item })),
      discounts: order.discounts.map((discount) => ({ ...discount })),
      taxes: order.taxes.map((tax) => ({ ...tax })),
      payment: order.payment ? { ...order.payment } : undefined,
      customer: order.customer ? { ...order.customer } : undefined,
      metadata: order.metadata ? { ...order.metadata } : undefined,
    })),
    inventory: deepClone(store.inventory),
    metadata: deepClone(store.metadata),
    sequence: store.sequence,
  }
}

async function loadStore(): Promise<OrdersStoreData> {
  if (cache) {
    return deepClone(cache)
  }

  await ensureDataFile()

  try {
    const raw = await fs.readFile(DATA_FILE, "utf-8")
    const parsed = JSON.parse(raw) as PersistedStore
    cache = reviveStore(parsed)
    return deepClone(cache)
  } catch (error) {
    logger.warn('Failed to read order store, using defaults', {
      error: error instanceof Error ? error.message : String(error),
      dataFile: DATA_FILE,
    })
    const fallback = defaultStore()
    cache = reviveStore(prepareForPersist(fallback))
    return deepClone(cache)
  }
}

async function persistStore(data: OrdersStoreData) {
  cache = reviveStore(prepareForPersist(data))
  const payload = prepareForPersist(cache)
  await fs.mkdir(DATA_DIR, { recursive: true })
  await fs.writeFile(DATA_FILE, JSON.stringify(payload, null, 2), "utf-8")
}

async function emitOrderEvent(event: "order.created" | "order.updated", order: StoredOrder) {
  if (typeof window !== "undefined") {
    return
  }

  try {
    const [metadata, summary] = await Promise.all([
      getOrderStoreMetadata(),
      getOrdersSummary(),
    ])

    const bus = getSocketBus()
    bus.publish(event, buildOrderEventPayload(order, metadata))
    bus.publish("order.summary.updated", buildOrderSummaryPayload(summary, metadata))
  } catch (error) {
    logger.error('Failed to broadcast order event', error as Error, {
      event,
      orderId: order.id,
    })
  }
}

type StoreMutation<T> = (draft: OrdersStoreData) => T | Promise<T>

async function withStoreMutation<T>(mutation: StoreMutation<T>): Promise<T> {
  const runner = async () => {
    const current = await loadStore()
    const draft = deepClone(current)
    const result = await mutation(draft)

    draft.metadata = {
      version: draft.metadata.version + 1,
      updatedAt: new Date().toISOString(),
    }

    await persistStore(draft)

    return result
  }

  const next = writeQueue.then(runner)
  writeQueue = next.then(
    () => undefined,
    (error) => {
      logger.error('Order store mutation failed', error as Error)
      return undefined
    },
  )

  return next
}

function ensureInventoryRecord(inventory: Record<string, InventoryItem>, menuItemId: string) {
  const key = String(menuItemId)
  if (!inventory[key]) {
    inventory[key] = {
      menuItemId: key,
      stock: DEFAULT_INITIAL_STOCK,
      minStock: DEFAULT_MIN_STOCK,
      updatedAt: new Date().toISOString(),
    }
  }
}

function sanitizeDiscount(discount?: OrderDiscountInput): OrderDiscountInput | undefined {
  if (!discount) {
    return undefined
  }

  const value = Number(discount.value)
  if (!Number.isFinite(value) || value <= 0) {
    return undefined
  }

  const type = discount.type === "fixed" ? "fixed" : "percentage"
  const scope = discount.scope === "item" ? "item" : "order"

  return {
    ...discount,
    type,
    scope,
    value,
    code: discount.code?.trim() || undefined,
    reason: discount.reason?.trim() || undefined,
  }
}

function applyDiscount(amountCents: number, discount?: OrderDiscountInput): { total: number; applied?: AppliedDiscount } {
  if (!discount) {
    return { total: amountCents }
  }

  const sanitized = sanitizeDiscount(discount)
  if (!sanitized) {
    return { total: amountCents }
  }

  let discountValue = 0
  if (sanitized.type === "percentage") {
    const rate = Math.min(100, Math.max(0, sanitized.value)) / 100
    discountValue = Math.round(amountCents * rate)
  } else {
    discountValue = Math.round(Math.max(0, Math.min(amountCents, sanitized.value)))
  }

  const total = Math.max(0, amountCents - discountValue)

  const applied: AppliedDiscount = {
    code: sanitized.code,
    type: sanitized.type,
    value: sanitized.value,
    reason: sanitized.reason,
    scope: sanitized.scope ?? "order",
    amountCents: discountValue,
  }

  return { total, applied }
}

function applySequentialDiscounts(amountCents: number, discounts: OrderDiscountInput[]): {
  total: number
  applied: AppliedDiscount[]
  totalDiscountCents: number
} {
  let running = amountCents
  const applied: AppliedDiscount[] = []
  let totalDiscountCents = 0

  for (const discount of discounts) {
    const { total, applied: appliedDiscount } = applyDiscount(running, discount)
    if (appliedDiscount) {
      appliedDiscount.scope = "order"
      applied.push(appliedDiscount)
      totalDiscountCents += appliedDiscount.amountCents
      running = total
    }
  }

  return {
    total: running,
    applied,
    totalDiscountCents,
  }
}

function calculateItemTotal(item: CreateOrderItemInput, menuItem: MenuItem): {
  base: number
  total: number
  appliedDiscount?: AppliedDiscount
  normalizedModifiers?: Array<{ id?: string; name: string; priceCents: number }>
} {
  const quantity = Math.max(1, Math.floor(item.quantity))
  const modifierTotal = (item.modifiers ?? []).reduce((sum, modifier) => {
    const price = Number(modifier.priceCents)
    if (!Number.isFinite(price)) {
      return sum
    }
    return sum + Math.max(0, Math.round(price))
  }, 0)

  const baseUnit = menuItem.priceCents + modifierTotal
  const base = baseUnit * quantity
  const { total, applied } = applyDiscount(base, item.discount)

  if (applied) {
    applied.scope = "item"
  }

  const normalizedModifiers = (item.modifiers ?? [])
    .map((modifier) => ({
      id: modifier.id?.trim() || undefined,
      name: modifier.name.trim(),
      priceCents: Math.max(0, Math.round(modifier.priceCents)),
    }))
    .filter((modifier) => modifier.name.length > 0)

  return {
    base,
    total,
    appliedDiscount: applied,
    normalizedModifiers,
  }
}

function computeTaxTotals(amountCents: number, taxes?: OrderTaxInput[]): {
  total: number
  taxTotal: number
  applied: AppliedTax[]
} {
  if (!taxes || taxes.length === 0) {
    const fallback = Math.round(amountCents * DEFAULT_TAX_RATE)
    return {
      total: amountCents + fallback,
      taxTotal: fallback,
      applied: [
        {
          code: DEFAULT_TAX_CODE,
          name: DEFAULT_TAX_NAME,
          rate: DEFAULT_TAX_RATE,
          amountCents: fallback,
        },
      ],
    }
  }

  const applied: AppliedTax[] = []
  let taxTotal = 0

  for (const entry of taxes) {
    const code = entry.code?.trim()
    if (!code) {
      continue
    }

    const name = entry.name?.trim() || code.toUpperCase()

    let amount = 0
    if (typeof entry.amountCents === "number" && Number.isFinite(entry.amountCents)) {
      amount = Math.max(0, Math.round(entry.amountCents))
    } else if (typeof entry.rate === "number" && Number.isFinite(entry.rate)) {
      const rate = Math.max(0, entry.rate)
      amount = Math.round(amountCents * rate)
    } else {
      continue
    }

    applied.push({
      code,
      name,
      rate: typeof entry.rate === "number" ? entry.rate : undefined,
      amountCents: amount,
    })
    taxTotal += amount
  }

  if (applied.length === 0) {
    const fallback = Math.round(amountCents * DEFAULT_TAX_RATE)
    applied.push({
      code: DEFAULT_TAX_CODE,
      name: DEFAULT_TAX_NAME,
      rate: DEFAULT_TAX_RATE,
      amountCents: fallback,
    })
    taxTotal = fallback
  }

  return {
    total: amountCents + taxTotal,
    taxTotal,
    applied,
  }
}

function applyPaymentDefaults(payment?: PaymentBreakdownInput): PaymentBreakdown | undefined {
  if (!payment) {
    return undefined
  }

  const method = payment.method
  const amount = Math.round(Math.max(0, payment.amountCents ?? 0))
  const status = payment.status ?? "pendiente"

  return {
    method,
    amountCents: amount,
    status,
    reference: payment.reference?.trim() || undefined,
  }
}

function generateOrderId(sequence: number): string {
  const parts = ["ord", String(Date.now()), String(sequence), Math.random().toString(36).slice(2, 6)]
  return parts.join("-")
}

function reserveStock(draft: OrdersStoreData, items: Array<{ menuItemId: string; quantity: number }>) {
  const now = new Date().toISOString()

  for (const item of items) {
    ensureInventoryRecord(draft.inventory, item.menuItemId)
    const record = draft.inventory[item.menuItemId]
    if (record.stock < item.quantity) {
      throw new OrderStoreError("Stock insuficiente para el producto", {
        code: "STOCK_INSUFFICIENT",
        status: 409,
        meta: {
          menuItemId: item.menuItemId,
          available: record.stock,
          requested: item.quantity,
        },
      })
    }
  }

  for (const item of items) {
    const record = draft.inventory[item.menuItemId]
    record.stock -= item.quantity
    record.updatedAt = now

    if (record.stock < record.minStock) {
      logger.warn('Stock below minimum threshold', {
        menuItemId: item.menuItemId,
        stock: record.stock,
        minStock: record.minStock,
      })
    }
  }
}

async function assertTableAvailability(tableId: string) {
  const table = await getTableById(tableId)
  if (!table) {
    throw new OrderStoreError("Mesa no encontrada", {
      code: "TABLE_NOT_FOUND",
      status: 404,
    })
  }

  if (!ALLOWED_TABLE_STATES.has(table.status)) {
    throw new OrderStoreError("La mesa no admite nuevos pedidos en este estado", {
      code: "TABLE_STATE_CONFLICT",
      status: 409,
      meta: { status: table.status },
    })
  }

  return table
}

async function syncTableState(tableId: string, currentState: string) {
  try {
    if (currentState === TABLE_STATE.FREE) {
      await updateTableState(tableId, TABLE_STATE.OCCUPIED, { reason: "order_created" })
      await updateTableState(tableId, TABLE_STATE.ORDER_IN_PROGRESS, { reason: "order_created" })
      return
    }

    if (currentState === TABLE_STATE.OCCUPIED) {
      await updateTableState(tableId, TABLE_STATE.ORDER_IN_PROGRESS, { reason: "order_created" })
      return
    }

    if (currentState === TABLE_STATE.ORDER_IN_PROGRESS) {
      return
    }
  } catch (error) {
    logger.error('Failed to update table state', error as Error, {
      tableId,
    })
    throw new OrderStoreError("No se pudo actualizar el estado de la mesa", {
      code: "TABLE_UPDATE_FAILED",
      status: 500,
    })
  }
}

export async function createOrder(payload: CreateOrderPayload): Promise<StoredOrder> {
  const sanitizedItems = payload.items.map((item) => ({
    menuItemId: String(item.menuItemId).trim(),
    quantity: Math.max(1, Math.floor(item.quantity)),
    note: item.note?.trim() || undefined,
    modifiers: item.modifiers,
    discount: sanitizeDiscount(item.discount),
  }))

  if (sanitizedItems.length === 0) {
    throw new OrderStoreError("Se requiere al menos un item en la orden", {
      code: "EMPTY_ORDER",
      status: 400,
    })
  }

  const table = await assertTableAvailability(payload.tableId)

  const menuSnapshot = await getMenuItemsSnapshot(sanitizedItems.map((item) => item.menuItemId))
  const menuItemsMap = new Map<string, MenuItem>()
  for (const [id, menuItem] of menuSnapshot.items) {
    menuItemsMap.set(id, menuItem)
  }

  const missing: string[] = []
  for (const item of sanitizedItems) {
    if (!menuItemsMap.has(item.menuItemId)) {
      missing.push(item.menuItemId)
    }
  }

  if (missing.length > 0) {
    throw new OrderStoreError("Producto no encontrado: " + missing[0], {
      code: "MENU_ITEM_NOT_FOUND",
      status: 404,
      meta: { missing },
    })
  }

  const totals = sanitizedItems.map((item) => {
    const menuItem = menuItemsMap.get(item.menuItemId)!
    return {
      item,
      menuItem,
      ...calculateItemTotal(item, menuItem),
    }
  })

  const itemsForStock = sanitizedItems.map((item) => ({
    menuItemId: item.menuItemId,
    quantity: item.quantity,
  }))

  const order = await withStoreMutation((draft) => {
    reserveStock(draft, itemsForStock)

    const sequence = draft.sequence + 1
    draft.sequence = sequence

    const now = new Date()
    const orderId = generateOrderId(sequence)

    const orderItems: StoredOrderItem[] = totals.map((entry) => ({
      id: entry.menuItem.id,
      name: entry.menuItem.name,
      quantity: entry.item.quantity,
      price: entry.menuItem.priceCents,
      note: entry.item.note,
      modifiers: entry.normalizedModifiers,
      totalCents: entry.total,
      discount: entry.appliedDiscount,
    }))

    const subtotal = totals.reduce((sum, entry) => sum + entry.base, 0)
    const netAfterItemDiscounts = totals.reduce((sum, entry) => sum + entry.total, 0)

    const itemDiscountTotal = orderItems.reduce((sum, entry) => sum + (entry.discount?.amountCents ?? 0), 0)

    const orderLevelDiscounts = (payload.discounts ?? [])
      .map((discount) => sanitizeDiscount(discount))
      .filter((discount): discount is OrderDiscountInput => Boolean(discount))

    const orderDiscountResult = applySequentialDiscounts(netAfterItemDiscounts, orderLevelDiscounts)

    const taxComputation = computeTaxTotals(orderDiscountResult.total, payload.taxes)

    const tipCents = Math.max(0, Math.round(payload.tipCents ?? 0))
    const serviceChargeCents = Math.max(0, Math.round(payload.serviceChargeCents ?? 0))

    const payment = applyPaymentDefaults(payload.payment)

    const discounts: AppliedDiscount[] = []
    for (const entry of orderItems) {
      if (entry.discount) {
        discounts.push(entry.discount)
      }
    }
    for (const discount of orderDiscountResult.applied) {
      discounts.push(discount)
    }

    const discountTotalCents = itemDiscountTotal + orderDiscountResult.totalDiscountCents

    const storedOrder: StoredOrder = {
      id: orderId,
      tableId: payload.tableId,
      items: orderItems,
      subtotal,
      total: taxComputation.total + tipCents + serviceChargeCents,
      status: "abierto",
      paymentStatus: payment?.status ?? "pendiente",
      createdAt: now,
      updatedAt: now,
      discounts,
      taxes: taxComputation.applied,
      discountTotalCents,
      taxTotalCents: taxComputation.taxTotal,
      tipCents,
      serviceChargeCents,
      payment,
      notes: payload.notes?.trim() || undefined,
      source: payload.source,
      customer: payload.customer ? { ...payload.customer } : undefined,
      metadata: payload.metadata ? { ...payload.metadata } : undefined,
    }

    draft.orders.unshift(storedOrder)

    logger.info('Order created successfully', {
      orderId,
      tableId: payload.tableId,
      total: storedOrder.total,
      itemsCount: storedOrder.items.length,
    })

    return storedOrder
  })

  await syncTableState(payload.tableId, table.status)

  void emitOrderEvent("order.created", order)

  return order
}


export interface ListOrdersOptions {
  status?: OrderStatus[];
  paymentStatus?: PaymentStatus;
  tableId?: string;
  search?: string;
  limit?: number;
  sort?: "newest" | "oldest";
}

export interface OrdersSummary {
  total: number;
  byStatus: Record<OrderStatus, number>;
  byPaymentStatus: Record<PaymentStatus, number>;
  oldestOrderAt: string | null;
  latestOrderAt: string | null;
  pendingPayment: number;
}

const MAX_ORDERS_LIMIT = 200;

function normalizeSearchTerm(term?: string | null) {
  const value = term?.trim();
  return value ? value.toLowerCase() : "";
}

function applyOrderFilters(store: OrdersStoreData, options: ListOrdersOptions) {
  const statusSet = options.status && options.status.length > 0 ? new Set(options.status) : null;
  const payment = options.paymentStatus ?? null;
  const table = options.tableId?.trim() || null;
  const search = normalizeSearchTerm(options.search);

  return store.orders.filter((order) => {
    if (statusSet && !statusSet.has(order.status)) {
      return false;
    }
    if (payment && order.paymentStatus !== payment) {
      return false;
    }
    if (table && order.tableId !== table) {
      return false;
    }
    if (search) {
      const haystack = [
        order.id,
        order.tableId,
        order.customer?.name ?? "",
        order.customer?.email ?? "",
        ...order.items.map((item) => item.name),
      ]
        .join(" ")
        .toLowerCase();

      if (!haystack.includes(search)) {
        return false;
      }
    }
    return true;
  });
}

export async function listOrders(options: ListOrdersOptions = {}): Promise<StoredOrder[]> {
  const store = await loadStore();
  const filtered = applyOrderFilters(store, options);
  const direction = options.sort === "oldest" ? 1 : -1;
  const limit = typeof options.limit === "number" ? Math.max(1, Math.min(options.limit, MAX_ORDERS_LIMIT)) : null;

  const sorted = filtered
    .slice()
    .sort((a, b) => (a.createdAt.getTime() - b.createdAt.getTime()) * direction);

  const sliced = limit ? sorted.slice(0, limit) : sorted;

  return sliced.map((order) => deepClone(order));
}

export async function getOrdersSummary(options: ListOrdersOptions = {}): Promise<OrdersSummary> {
  const store = await loadStore();
  const filtered = applyOrderFilters(store, options);

  const byStatus = {} as Record<OrderStatus, number>;
  for (const status of Object.values(ORDER_STATUS)) {
    byStatus[status] = 0;
  }

  const byPaymentStatus = {} as Record<PaymentStatus, number>;
  for (const payment of Object.values(PAYMENT_STATUS)) {
    byPaymentStatus[payment] = 0;
  }

  let oldest: number | null = null;
  let latest: number | null = null;
  let pendingPayment = 0;

  for (const order of filtered) {
    byStatus[order.status] = (byStatus[order.status] ?? 0) + 1;
    byPaymentStatus[order.paymentStatus] = (byPaymentStatus[order.paymentStatus] ?? 0) + 1;

    const createdAt = order.createdAt.getTime();
    if (oldest === null || createdAt < oldest) {
      oldest = createdAt;
    }
    if (latest === null || createdAt > latest) {
      latest = createdAt;
    }
    if (order.paymentStatus === PAYMENT_STATUS.PENDING) {
      pendingPayment += 1;
    }
  }

  return {
    total: filtered.length,
    byStatus,
    byPaymentStatus,
    oldestOrderAt: oldest ? new Date(oldest).toISOString() : null,
    latestOrderAt: latest ? new Date(latest).toISOString() : null,
    pendingPayment,
  };
}
export async function getOrderStoreMetadata(): Promise<OrdersStoreMetadata> {
  const store = await loadStore()
  return deepClone(store.metadata)
}

export async function resetOrderStoreCache() {
  cache = null
}






