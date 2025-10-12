import { MOCK_ORDERS } from "@/lib/mock-data"
import type { OrdersSummary } from "@/lib/server/order-store"
import type { CreateOrderPayload, PaymentStatus, StoredOrder } from "@/lib/server/order-types"
import type { OrderStatus } from "@/lib/server/order-types"
import { logger } from './logger'
import { AppError, ValidationError } from './errors'
import { MENSAJES } from './i18n/mensajes'

export type OrdersSortOption = "newest" | "oldest"

export interface FetchOrdersParams {
  status?: OrderStatus[]
  paymentStatus?: PaymentStatus
  tableId?: string
  search?: string
  limit?: number
  sort?: OrdersSortOption
  signal?: AbortSignal
}

export type OrdersPanelItem = StoredOrder["items"][number] & {
  totalCents?: number
}

export interface OrdersPanelOrder {
  id: string
  tableId: string
  status: OrderStatus
  paymentStatus: PaymentStatus
  subtotal: number
  total: number
  discountTotalCents: number
  taxTotalCents: number
  tipCents: number
  serviceChargeCents: number
  createdAt: Date
  updatedAt: Date
  items: OrdersPanelItem[]
  notes?: string
  source?: StoredOrder["source"]
  customer?: StoredOrder["customer"]
  metadata?: StoredOrder["metadata"]
  payment?: StoredOrder["payment"]
}

export interface OrdersSummaryClient {
  total: number
  byStatus: Record<OrderStatus, number>
  byPaymentStatus: Record<PaymentStatus, number>
  oldestOrderAt: Date | null
  latestOrderAt: Date | null
  pendingPayment: number
}

export interface OrdersQueryResult {
  orders: OrdersPanelOrder[]
  summary: OrdersSummaryClient
  storeMetadata: {
    version: number
    updatedAt: string
  }
  receivedAt: Date
}

interface OrdersApiResponse {
  data: SerializedOrder[]
  metadata: {
    store: {
      version: number
      updatedAt: string
    }
    summary: OrdersSummary
  }
}

interface CreateOrderApiResponse {
  data: SerializedOrder
  metadata: {
    version: number
    updatedAt: string
  }
}

export interface CreateOrderResult {
  order: OrdersPanelOrder
  metadata: {
    version: number
    updatedAt: string
  }
}

interface SerializedOrder extends Omit<StoredOrder, "createdAt" | "updatedAt" | "items" | "discounts" | "taxes" | "payment" | "customer" | "metadata"> {
  createdAt: string
  updatedAt: string
  items: StoredOrder["items"]
  discounts: StoredOrder["discounts"]
  taxes: StoredOrder["taxes"]
  payment?: StoredOrder["payment"]
  customer?: StoredOrder["customer"]
  metadata?: StoredOrder["metadata"]
}

// Constantes para posible uso futuro
const _API_TIMEOUT_MESSAGE = "No se pudieron obtener los pedidos"
const _CREATE_ORDER_GENERIC_ERROR_MESSAGE = "No se pudo crear el pedido"


export class OrderServiceError extends Error {
  code?: string
  status?: number

  constructor(message: string, options: { code?: string; status?: number } = {}) {
    super(message)
    this.name = "OrderServiceError"
    this.code = options.code
    this.status = options.status
  }
}

function buildSearchParams(params: FetchOrdersParams) {
  const searchParams = new URLSearchParams()

  if (params.status?.length) {
    for (const status of params.status) {
      searchParams.append("status", status)
    }
  }

  if (params.paymentStatus) {
    searchParams.set("paymentStatus", params.paymentStatus)
  }

  if (params.tableId) {
    searchParams.set("tableId", params.tableId)
  }

  if (params.search) {
    searchParams.set("search", params.search)
  }

  if (typeof params.limit === "number") {
    searchParams.set("limit", String(params.limit))
  }

  if (params.sort) {
    searchParams.set("sort", params.sort)
  }

  return searchParams
}

export function toOrdersPanelOrder(order: SerializedOrder): OrdersPanelOrder {
  return {
    id: order.id,
    tableId: order.tableId,
    status: order.status,
    paymentStatus: order.paymentStatus,
    subtotal: order.subtotal,
    total: order.total,
    discountTotalCents: order.discountTotalCents,
    taxTotalCents: order.taxTotalCents,
    tipCents: order.tipCents,
    serviceChargeCents: order.serviceChargeCents,
    items: order.items.map((item) => ({ ...item })),
    notes: order.notes,
    source: order.source,
    customer: order.customer ? { ...order.customer } : undefined,
    metadata: order.metadata ? { ...order.metadata } : undefined,
    payment: order.payment ? { ...order.payment } : undefined,
    createdAt: new Date(order.createdAt),
    updatedAt: new Date(order.updatedAt),
  }
}

export function toSummaryClient(summary: OrdersSummary): OrdersSummaryClient {
  const byStatus = { ...summary.byStatus }
  const byPaymentStatus = { ...summary.byPaymentStatus }

  return {
    total: summary.total,
    byStatus,
    byPaymentStatus,
    oldestOrderAt: summary.oldestOrderAt ? new Date(summary.oldestOrderAt) : null,
    latestOrderAt: summary.latestOrderAt ? new Date(summary.latestOrderAt) : null,
    pendingPayment: summary.pendingPayment,
  }
}

function fallbackOrdersResult(): OrdersQueryResult {
  const now = new Date()
  const byStatus: Record<OrderStatus, number> = {
    abierto: 0,
    preparando: 0,
    listo: 0,
    entregado: 0,
    cerrado: 0,
  }

  const byPaymentStatus: Record<PaymentStatus, number> = {
    pendiente: 0,
    pagado: 0,
    cancelado: 0,
  }

  const orders: OrdersPanelOrder[] = MOCK_ORDERS.map((order) => {
    byStatus[order.status] += 1
    byPaymentStatus[order.paymentStatus] += 1

    return {
      id: order.id,
      tableId: order.tableId,
      status: order.status,
      paymentStatus: order.paymentStatus,
      subtotal: order.subtotal,
      total: order.total,
      discountTotalCents: 0,
      taxTotalCents: 0,
      tipCents: 0,
      serviceChargeCents: 0,
      items: order.items.map((item) => ({
        ...item,
        totalCents: item.price * item.quantity,
      })),
      createdAt: new Date(order.createdAt),
      updatedAt: new Date(order.createdAt),
    }
  })

  const createdAtTimes = orders.map((order) => order.createdAt.getTime())
  const oldest = createdAtTimes.length ? new Date(Math.min(...createdAtTimes)) : null
  const latest = createdAtTimes.length ? new Date(Math.max(...createdAtTimes)) : null

  return {
    orders,
    summary: {
      total: orders.length,
      byStatus,
      byPaymentStatus,
      oldestOrderAt: oldest,
      latestOrderAt: latest,
      pendingPayment: byPaymentStatus.pendiente,
    },
    storeMetadata: {
      version: 0,
      updatedAt: now.toISOString(),
    },
    receivedAt: now,
  }
}

export async function createOrder(payload: CreateOrderPayload): Promise<CreateOrderResult> {
  const startTime = Date.now();
  
  try {
    logger.info('Creando pedido', { 
      tableId: payload.tableId, 
      itemsCount: payload.items.length 
    });

    // Validar payload
    if (!payload.tableId) {
      throw new ValidationError(MENSAJES.VALIDACIONES.CAMPO_REQUERIDO, { field: 'tableId' });
    }

    if (!payload.items || payload.items.length === 0) {
      throw new ValidationError(MENSAJES.ERRORES.PEDIDO_ITEMS_VACIOS);
    }

    const response = await fetch("/api/order", {
      method: "POST",
      cache: "no-store",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    if (response.status === 201) {
      const payloadBody = (await response.json()) as CreateOrderApiResponse;
      const duration = Date.now() - startTime;

      logger.info('Pedido creado exitosamente', { 
        orderId: payloadBody.data.id,
        duration: `${duration}ms`
      });

      return {
        order: toOrdersPanelOrder(payloadBody.data),
        metadata: payloadBody.metadata,
      };
    }

    if (response.status >= 400 && response.status < 500) {
      let errorCode: string | undefined;
      let errorMessage = MENSAJES.ERRORES.GENERICO;

      try {
        const errorBody = (await response.json()) as { error?: { code?: string; message?: string } };
        errorCode = errorBody.error?.code;
        errorMessage = errorBody.error?.message ?? errorMessage;
      } catch {
        // ignore parse errors for non-JSON responses
      }

      logger.error('Error al crear pedido (4xx)', undefined, { 
        status: response.status, 
        errorCode,
        errorMessage 
      });

      throw new OrderServiceError(errorMessage, { code: errorCode, status: response.status });
    }

    if (response.status >= 500) {
      logger.error('Error del servidor al crear pedido', undefined, { status: response.status });
      throw new OrderServiceError(MENSAJES.ERRORES.GENERICO, { status: response.status });
    }

    throw new OrderServiceError(MENSAJES.ERRORES.GENERICO, { status: response.status });
  } catch (error) {
    const duration = Date.now() - startTime;
    
    if (error instanceof OrderServiceError || error instanceof ValidationError) {
      throw error;
    }

    logger.error('Error inesperado al crear pedido', error as Error, { duration: `${duration}ms` });
    throw new OrderServiceError(MENSAJES.ERRORES.GENERICO);
  }
}

export async function fetchOrders(params: FetchOrdersParams = {}): Promise<OrdersQueryResult> {
  const startTime = Date.now();
  const searchParams = buildSearchParams(params);
  const queryString = searchParams.toString();
  const endpoint = queryString ? `/api/order?${queryString}` : "/api/order";

  try {
    logger.debug('Obteniendo pedidos', { params, endpoint });

    const response = await fetch(endpoint, {
      method: "GET",
      cache: "no-store",
      signal: params.signal,
      headers: {
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      throw new AppError(
        `Error al obtener pedidos: ${response.status}`,
        response.status
      );
    }

    const payload = (await response.json()) as OrdersApiResponse;
    const duration = Date.now() - startTime;

    logger.info('Pedidos obtenidos exitosamente', { 
      count: payload.data.length,
      duration: `${duration}ms`
    });

    return {
      orders: payload.data.map(toOrdersPanelOrder),
      summary: toSummaryClient(payload.metadata.summary),
      storeMetadata: payload.metadata.store,
      receivedAt: new Date(),
    };
  } catch (error) {
    const duration = Date.now() - startTime;
    
    logger.warn('Error al obtener pedidos, usando datos de respaldo', { 
      duration: `${duration}ms`,
      error: (error as Error).message
    });
    
    return fallbackOrdersResult();
  }
}

export type OrderBadgeVariant = "default" | "secondary" | "outline" | "destructive"

export const ORDER_STATUS_BADGE_VARIANT: Record<OrderStatus, OrderBadgeVariant> = {
  abierto: "outline",
  preparando: "secondary",
  listo: "default",
  entregado: "default",
  cerrado: "outline",
}

export const PAYMENT_STATUS_BADGE_VARIANT: Record<PaymentStatus, OrderBadgeVariant> = {
  pendiente: "destructive",
  pagado: "default",
  cancelado: "outline",
}

export const ORDER_STATUS_LABELS: Record<OrderStatus, string> = {
  abierto: "Abierto",
  preparando: "Preparando",
  listo: "Listo",
  entregado: "Entregado",
  cerrado: "Cerrado",
}

export const PAYMENT_STATUS_LABELS: Record<PaymentStatus, string> = {
  pendiente: "Pendiente",
  pagado: "Pagado",
  cancelado: "Cancelado",
}

export const ORDER_STATUS_GROUPS: Record<"en_curso" | "terminados" | "cerrados", OrderStatus[]> = {
  en_curso: ["abierto", "preparando"],
  terminados: ["listo", "entregado"],
  cerrados: ["cerrado"],
}

