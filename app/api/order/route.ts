import { NextResponse } from "next/server"
import { z } from "zod"

import {
  createOrder,
  getOrderStoreMetadata,
  getOrdersSummary,
  listOrders,
  OrderStoreError,
  type ListOrdersOptions,
  type OrdersSummary,
} from "@/lib/server/order-store"
import {
  ORDER_STATUS,
  PAYMENT_STATUS,
  type OrderStatus,
  type PaymentStatus,
  type StoredOrder,
} from "@/lib/server/order-types"

const discountSchema = z
  .object({
    code: z.string().trim().max(50).optional(),
    type: z.enum(["percentage", "fixed"]),
    value: z
      .number({ invalid_type_error: "El valor del descuento debe ser numAcrico" })
      .positive("El valor de descuento debe ser mayor a 0"),
    reason: z.string().trim().max(120).optional(),
    scope: z.enum(["order", "item"]).optional(),
  })
  .strict()

const modifierSchema = z
  .object({
    id: z.string().trim().max(60).optional(),
    name: z.string().trim().min(1, "El nombre del modificador es obligatorio"),
    priceCents: z
      .number({ invalid_type_error: "El precio del modificador debe ser numAcrico" })
      .int("El precio del modificador debe ser un entero")
      .min(0, "El precio del modificador no puede ser negativo"),
  })
  .strict()

const taxSchema = z
  .object({
    code: z.string().trim().min(1, "El cA3digo de impuesto es obligatorio"),
    name: z.string().trim().max(80).optional(),
    rate: z
      .number({ invalid_type_error: "La tasa de impuesto debe ser numAcrica" })
      .min(0, "La tasa de impuesto no puede ser negativa")
      .max(1, "La tasa de impuesto debe expresarse entre 0 y 1")
      .optional(),
    amountCents: z
      .number({ invalid_type_error: "El monto de impuesto debe ser numAcrico" })
      .int("El monto de impuesto debe ser un entero")
      .min(0, "El monto de impuesto no puede ser negativo")
      .optional(),
  })
  .strict()
  .refine((value) => typeof value.rate === "number" || typeof value.amountCents === "number", {
    message: "Cada impuesto debe indicar 'rate' o 'amountCents'",
    path: ["rate"],
  })

const paymentSchema = z
  .object({
    method: z.enum(["efectivo", "tarjeta", "qr", "transferencia", "mixto", "cortesia"]),
    amountCents: z
      .number({ invalid_type_error: "El monto pagado debe ser numAcrico" })
      .int("El monto pagado debe ser un entero")
      .min(0, "El monto pagado no puede ser negativo")
      .optional(),
    status: z
      .enum([PAYMENT_STATUS.PENDING, PAYMENT_STATUS.PAID, PAYMENT_STATUS.CANCELLED])
      .optional(),
    reference: z.string().trim().max(80).optional(),
  })
  .strict()

const customerSchema = z
  .object({
    id: z.string().trim().max(100).optional(),
    name: z.string().trim().max(120).optional(),
    email: z.string().email("Email invA?lido").optional(),
    loyaltyId: z.string().trim().max(120).optional(),
  })
  .strict()

const orderItemSchema = z
  .object({
    menuItemId: z.string().trim().min(1, "El identificador del producto es obligatorio"),
    quantity: z
      .coerce.number({ invalid_type_error: "La cantidad debe ser numAcrica" })
      .int("La cantidad debe ser un entero")
      .min(1, "La cantidad debe ser al menos 1"),
    note: z.string().trim().max(500).optional(),
    modifiers: z.array(modifierSchema).max(10, "Los modificadores por item no pueden exceder 10").optional(),
    discount: discountSchema.optional(),
  })
  .strict()

const createOrderSchema = z
  .object({
    tableId: z.string().trim().min(1, "El identificador de mesa es obligatorio"),
    items: z.array(orderItemSchema).min(1, "Se requiere al menos un item"),
    tipCents: z
      .number({ invalid_type_error: "La propina debe ser numAcrica" })
      .int("La propina debe ser un entero")
      .min(0, "La propina no puede ser negativa")
      .optional(),
    serviceChargeCents: z
      .number({ invalid_type_error: "El cargo por servicio debe ser numAcrico" })
      .int("El cargo por servicio debe ser un entero")
      .min(0, "El cargo por servicio no puede ser negativo")
      .optional(),
    discounts: z.array(discountSchema).max(5, "MA?ximo 5 descuentos por orden").optional(),
    taxes: z.array(taxSchema).max(5, "MA?ximo 5 impuestos por orden").optional(),
    payment: paymentSchema.optional(),
    notes: z.string().trim().max(1000).optional(),
    source: z.enum(["staff", "qr", "pos", "integracion"]).optional(),
    customer: customerSchema.optional(),
    metadata: z.record(z.unknown()).optional(),
  })
  .strict()

const ORDER_STATUS_ENUM_VALUES = [
  ORDER_STATUS.OPEN,
  ORDER_STATUS.PREPARING,
  ORDER_STATUS.READY,
  ORDER_STATUS.DELIVERED,
  ORDER_STATUS.CLOSED,
] as const

const PAYMENT_STATUS_ENUM_VALUES = [
  PAYMENT_STATUS.PENDING,
  PAYMENT_STATUS.PAID,
  PAYMENT_STATUS.CANCELLED,
] as const

const ORDER_SORT_VALUES = ["newest", "oldest"] as const

const ordersQuerySchema = z
  .object({
    status: z.array(z.enum(ORDER_STATUS_ENUM_VALUES)).optional(),
    paymentStatus: z.enum(PAYMENT_STATUS_ENUM_VALUES).optional(),
    tableId: z.string().trim().min(1).optional(),
    search: z.string().trim().max(120).optional(),
    limit: z.coerce.number().int().min(1).max(200).optional(),
    sort: z.enum(ORDER_SORT_VALUES).optional(),
  })
  .strict()

type OrdersQuery = z.infer<typeof ordersQuerySchema>

type OrdersIndexMetadata = {
  store: Awaited<ReturnType<typeof getOrderStoreMetadata>>
  summary: OrdersSummary
}

interface SerializedOrder {
  id: string
  tableId: string
  items: StoredOrder["items"]
  subtotal: number
  total: number
  status: StoredOrder["status"]
  paymentStatus: StoredOrder["paymentStatus"]
  createdAt: string
  updatedAt: string
  discounts: StoredOrder["discounts"]
  taxes: StoredOrder["taxes"]
  tipCents: number
  serviceChargeCents: number
  discountTotalCents: number
  taxTotalCents: number
  payment?: StoredOrder["payment"]
  notes?: string
  source?: StoredOrder["source"]
  customer?: StoredOrder["customer"]
  metadata?: StoredOrder["metadata"]
}

export type CreateOrderRequest = z.infer<typeof createOrderSchema>
export interface CreateOrderResponse {
  data: Awaited<ReturnType<typeof createOrder>>
  metadata: Awaited<ReturnType<typeof getOrderStoreMetadata>>
}

export interface OrdersIndexResponse {
  data: SerializedOrder[]
  metadata: OrdersIndexMetadata
}

function sanitizeParam(value: string | null) {
  if (value === null) {
    return undefined
  }

  const trimmed = value.trim()
  return trimmed.length > 0 ? trimmed : undefined
}

function serializeOrder(order: StoredOrder): SerializedOrder {
  return {
    ...order,
    items: order.items.map((item) => ({ ...item })),
    discounts: order.discounts.map((discount) => ({ ...discount })),
    taxes: order.taxes.map((tax) => ({ ...tax })),
    payment: order.payment ? { ...order.payment } : undefined,
    customer: order.customer ? { ...order.customer } : undefined,
    metadata: order.metadata ? { ...order.metadata } : undefined,
    createdAt: order.createdAt.toISOString(),
    updatedAt: order.updatedAt.toISOString(),
  }
}

function buildOrdersQuery(url: URL): { parsed: OrdersQuery | null; error?: z.ZodError<OrdersQuery> } {
  const rawStatus = url
    .searchParams
    .getAll("status")
    .flatMap((value) => value.split(","))
    .map((value) => value.trim())
    .filter((value) => value.length > 0)

  const raw = {
    status: rawStatus.length > 0 ? rawStatus : undefined,
    paymentStatus: sanitizeParam(url.searchParams.get("paymentStatus")),
    tableId: sanitizeParam(url.searchParams.get("tableId")),
    search: sanitizeParam(url.searchParams.get("search")),
    limit: sanitizeParam(url.searchParams.get("limit")),
    sort: sanitizeParam(url.searchParams.get("sort")),
  }

  const result = ordersQuerySchema.safeParse(raw)

  if (!result.success) {
    return { parsed: null, error: result.error }
  }

  return { parsed: result.data }
}

export async function GET(request: Request) {
  const url = new URL(request.url)
  const { parsed, error } = buildOrdersQuery(url)

  if (!parsed) {
    const issue = error?.issues[0]
    const message = issue?.message ?? "Parametros invalidos"

    return NextResponse.json(
      {
        error: {
          code: "INVALID_QUERY",
          message,
          details: issue?.path?.length ? { path: issue.path } : undefined,
        },
      },
      { status: 400 },
    )
  }

  const listOptions: ListOrdersOptions = {
    status: parsed.status as OrderStatus[] | undefined,
    paymentStatus: parsed.paymentStatus as PaymentStatus | undefined,
    tableId: parsed.tableId,
    search: parsed.search,
    limit: parsed.limit,
    sort: parsed.sort,
  }

  const summaryFilters: ListOrdersOptions = { ...listOptions, limit: undefined }

  try {
    const [orders, storeMetadata, summary] = await Promise.all([
      listOrders(listOptions),
      getOrderStoreMetadata(),
      getOrdersSummary(summaryFilters),
    ])

    return NextResponse.json<OrdersIndexResponse>({
      data: orders.map(serializeOrder),
      metadata: {
        store: storeMetadata,
        summary,
      },
    })
  } catch (error) {
    console.error("[api/order] Error obteniendo pedidos", error)
    return NextResponse.json(
      { error: { code: "INTERNAL_ERROR", message: "No se pudieron obtener los pedidos" } },
      { status: 500 },
    )
  }
}

export async function POST(request: Request) {
  let rawBody: unknown

  try {
    rawBody = await request.json()
  } catch {
    console.warn("[api/order] Payload JSON invA?lido")
    return NextResponse.json(
      { error: { code: "INVALID_JSON", message: "Cuerpo JSON invA?lido" } },
      { status: 400 },
    )
  }

  const parsed = createOrderSchema.safeParse(rawBody)

  if (!parsed.success) {
    const issue = parsed.error.issues[0]
    const message = issue?.message ?? "Datos invA?lidos"
    console.warn("[api/order] Payload invA?lido", { message, path: issue?.path })

    return NextResponse.json(
      {
        error: {
          code: "INVALID_PAYLOAD",
          message,
          details: issue?.path?.length ? { path: issue.path } : undefined,
        },
      },
      { status: 400 },
    )
  }

  try {
    const order = await createOrder(parsed.data)
    const metadata = await getOrderStoreMetadata()

    console.info("[api/order] Pedido creado", { orderId: order.id, tableId: order.tableId, total: order.total })

    return NextResponse.json<CreateOrderResponse>(
      {
        data: order,
        metadata,
      },
      { status: 201 },
    )
  } catch (error) {
    if (error instanceof OrderStoreError) {
      console.warn("[api/order] Orden rechazada", {
        code: error.code,
        status: error.status,
        meta: error.meta,
      })

      return NextResponse.json(
        {
          error: {
            code: error.code,
            message: error.message,
            details: error.meta,
          },
        },
        { status: error.status },
      )
    }

    console.error("[api/order] Error inesperado", error)
    return NextResponse.json(
      { error: { code: "INTERNAL_ERROR", message: "No se pudo crear la orden" } },
      { status: 500 },
    )
  }
}

export async function OPTIONS() {
  return NextResponse.json({ actions: ["GET", "POST"], description: "Alta y listado de pedidos para mesas" })
}