import { NextResponse } from "next/server"
import { z } from "zod"

import {
  createOrder as createOrderService,
  getOrders as getOrdersService,
  getOrdersSummary as getOrdersSummaryService,
  type CreateOrderInput,
} from "@/lib/services/orders-service"
import {
  ORDER_STATUS,
  PAYMENT_STATUS,
  type OrderStatus,
  type PaymentStatus,
} from "@/lib/server/order-types"
import { logRequest, logResponse } from '@/lib/api-helpers'
import { logger } from '@/lib/logger'
import { MENSAJES } from '@/lib/i18n/mensajes'
import { getCurrentUser } from '@/lib/supabase/server'
import type { User } from "@supabase/supabase-js"

/**
 * Extract tenantId from Supabase Auth User
 */
function getTenantIdFromUser(user: User): string | null {
  return user.user_metadata?.tenant_id || null
}

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

export type CreateOrderRequest = z.infer<typeof createOrderSchema>

export interface CreateOrderResponse {
  data: {
    id: string
    tableId?: string
    status: string
    paymentStatus: string
    subtotalCents: number
    totalCents: number
    createdAt: string
  }
}

export interface OrdersIndexResponse {
  data: Array<{
    id: string
    tableId?: string
    status: string
    paymentStatus: string
    subtotalCents: number
    totalCents: number
    createdAt: string
    updatedAt: string
  }>
  metadata: {
    count: number
    totalOrders?: number
    totalRevenue?: number
  }
}

function sanitizeParam(value: string | null) {
  if (value === null) {
    return undefined
  }

  const trimmed = value.trim()
  return trimmed.length > 0 ? trimmed : undefined
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
  const startTime = Date.now()
  
  try {
    // Obtener usuario actual
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json(
        { error: 'No autenticado' },
        { status: 401 }
      )
    }

    // Obtener tenant_id del usuario
    const tenantId = getTenantIdFromUser(user)
    if (!tenantId) {
      return NextResponse.json(
        { error: 'Usuario sin tenant asignado' },
        { status: 403 }
      )
    }

    const url = new URL(request.url)
    logRequest('GET', '/api/order', { query: url.search, tenantId })
    
    const { parsed, error } = buildOrdersQuery(url)

    if (!parsed) {
      const issue = error?.issues[0]
      const message = issue?.message ?? MENSAJES.ERRORES.VALIDACION_FALLIDA

      logger.warn('Parámetros de query inválidos', {
        error: message,
        path: issue?.path,
        tenantId
      })

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

    const filters = {
      tableId: parsed.tableId,
      status: parsed.status?.[0], // Toma solo el primer status si hay array
      paymentStatus: parsed.paymentStatus,
      limit: parsed.limit,
    }

    logger.debug('Obteniendo pedidos desde Supabase', { filters, tenantId })

    const [ordersResult, summaryResult] = await Promise.all([
      getOrdersService(tenantId, filters),
      getOrdersSummaryService(tenantId, {}),
    ])

    if (ordersResult.error) {
      throw new Error(`Error obteniendo órdenes: ${ordersResult.error}`)
    }

    const duration = Date.now() - startTime
    logResponse('GET', '/api/order', 200, duration)
    
    logger.info('Pedidos obtenidos desde Supabase', {
      count: ordersResult.data?.length || 0,
      tenantId,
      duration: `${duration}ms`
    })

    return NextResponse.json<OrdersIndexResponse>({
      data: (ordersResult.data || []).map((order) => ({
        id: order.id,
        tableId: order.table_id || undefined,
        status: order.status,
        paymentStatus: order.payment_status,
        subtotalCents: order.subtotal_cents || 0,
        totalCents: order.total_cents,
        createdAt: order.created_at || new Date().toISOString(),
        updatedAt: order.updated_at || new Date().toISOString(),
      })),
      metadata: {
        count: ordersResult.data?.length || 0,
        totalOrders: summaryResult.data?.total,
        totalRevenue: summaryResult.data?.totalRevenue,
      },
    })
  } catch (error) {
    const duration = Date.now() - startTime
    logResponse('GET', '/api/order', 500, duration)
    
    logger.error('Error obteniendo pedidos', error as Error)
    
    return NextResponse.json(
      { error: { code: "INTERNAL_ERROR", message: MENSAJES.ERRORES.GENERICO } },
      { status: 500 },
    )
  }
}

export async function POST(request: Request) {
  const startTime = Date.now()
  let rawBody: unknown

  try {
    // Obtener usuario actual
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json(
        { error: 'No autenticado' },
        { status: 401 }
      )
    }

    // Obtener tenant_id del usuario
    const tenantId = getTenantIdFromUser(user)
    if (!tenantId) {
      return NextResponse.json(
        { error: 'Usuario sin tenant asignado' },
        { status: 403 }
      )
    }

    logRequest('POST', '/api/order', { tenantId })
    
    rawBody = await request.json()
  } catch {
    logger.warn('Payload JSON inválido en POST /api/order')
    return NextResponse.json(
      { error: { code: "INVALID_JSON", message: MENSAJES.ERRORES.VALIDACION_FALLIDA } },
      { status: 400 },
    )
  }

  const parsed = createOrderSchema.safeParse(rawBody)

  if (!parsed.success) {
    const issue = parsed.error.issues[0]
    const message = issue?.message ?? MENSAJES.ERRORES.VALIDACION_FALLIDA
    
    logger.warn('Payload de pedido inválido', { 
      message, 
      path: issue?.path 
    })

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
    // Obtener tenant_id nuevamente (para el scope correcto)
    const user = await getCurrentUser()
    const tenantId = getTenantIdFromUser(user!)

    if (!tenantId) {
      throw new Error('Tenant ID no disponible')
    }

    logger.info('Creando pedido en Supabase', { 
      tableId: parsed.data.tableId,
      itemsCount: parsed.data.items.length,
      tenantId
    })

    // Convertir el formato del esquema al formato del servicio
    const orderInput: CreateOrderInput = {
      tableId: parsed.data.tableId,
      items: parsed.data.items.map(item => ({
        menuItemId: item.menuItemId,
        quantity: item.quantity,
        notes: item.note,
        modifiers: item.modifiers?.map(m => ({
          name: m.name,
          priceCents: m.priceCents
        })),
        discount: item.discount,
      })),
      discounts: parsed.data.discounts,
      taxes: parsed.data.taxes?.map(t => ({
        code: t.code,
        name: t.name || t.code,
        rate: t.rate,
        amountCents: t.amountCents,
      })),
      tipCents: parsed.data.tipCents,
      serviceChargeCents: parsed.data.serviceChargeCents,
      notes: parsed.data.notes,
      customerData: parsed.data.customer,
      source: (parsed.data.source === 'pos' || parsed.data.source === 'integracion') 
        ? 'staff' 
        : parsed.data.source,
    }

    const { data: order, error: createError } = await createOrderService(orderInput, tenantId)

    if (createError || !order) {
      logger.error('Error al crear pedido en Supabase', new Error(`Create failed: ${createError}`), {
        tenantId,
        tableId: parsed.data.tableId
      })
      throw new Error('Error al crear pedido')
    }

    const duration = Date.now() - startTime
    logResponse('POST', '/api/order', 201, duration)
    
    logger.info('Pedido creado exitosamente en Supabase', { 
      orderId: order.id, 
      tableId: order.table_id, 
      total: order.total_cents,
      tenantId,
      duration: `${duration}ms`
    })

    return NextResponse.json<CreateOrderResponse>(
      {
        data: {
          id: order.id,
          tableId: order.table_id || undefined,
          status: order.status,
          paymentStatus: order.payment_status,
          subtotalCents: order.subtotal_cents || 0,
          totalCents: order.total_cents,
          createdAt: order.created_at || new Date().toISOString(),
        },
      },
      { status: 201 },
    )
  } catch (error) {
    const duration = Date.now() - startTime
    logResponse('POST', '/api/order', 500, duration)
    logger.error('Error inesperado al crear pedido', error as Error)
    
    return NextResponse.json(
      { error: { code: "INTERNAL_ERROR", message: MENSAJES.ERRORES.GENERICO } },
      { status: 500 },
    )
  }
}

export async function OPTIONS() {
  return NextResponse.json({ actions: ["GET", "POST"], description: "Alta y listado de pedidos para mesas" })
}