import { NextResponse } from "next/server"
import { z } from "zod"

import { createOrder as createOrderService } from "@/lib/services/orders-service"
import { getCurrentUser } from '@/lib/supabase/server'
import type { User } from "@supabase/supabase-js"
import { createLogger } from "@/lib/logger"

const logger = createLogger("menu/orders")

/**
 * Extract tenantId from Supabase Auth User
 */
function getTenantIdFromUser(user: User): string | null {
  return user.user_metadata?.tenant_id || null
}

const modifierSchema = z.object({
  groupId: z.string(),
  groupName: z.string(),
  optionId: z.string(),
  optionName: z.string(),
  priceCents: z.number().int(),
})

const orderItemSchema = z
  .object({
    menuItemId: z.string().trim().min(1, "El identificador del plato es obligatorio"),
    quantity: z.coerce.number().int("La cantidad debe ser un entero").min(1, "La cantidad debe ser al menos 1"),
    modifiers: z.array(modifierSchema).optional(),
    notes: z.string().max(200, "Las notas no pueden exceder 200 caracteres").optional(),
  })
  .strict()

const createOrderSchema = z
  .object({
    tableId: z.string().trim().min(1, "El identificador de mesa es obligatorio"),
    items: z.array(orderItemSchema).min(1, "Se requiere al menos un plato en la orden"),
  })
  .strict()

type CreateOrderPayload = z.infer<typeof createOrderSchema>

export async function POST(request: Request) {
  let rawPayload: unknown
  try {
    rawPayload = await request.json()
  } catch {
    return NextResponse.json({ error: "Cuerpo JSON inválido" }, { status: 400 })
  }

  const parsed = createOrderSchema.safeParse(rawPayload)

  if (!parsed.success) {
    const message = parsed.error.issues[0]?.message ?? "Datos inválidos"
    return NextResponse.json({ error: message }, { status: 400 })
  }

  const payload: CreateOrderPayload = parsed.data

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

    // Convertir payload al formato del servicio
    const orderInput = {
      tableId: payload.tableId,
      items: payload.items.map(item => ({
        menuItemId: item.menuItemId,
        quantity: item.quantity,
        notes: item.notes,
        modifiers: item.modifiers?.map(m => ({
          name: m.optionName,
          priceCents: m.priceCents,
        })),
      })),
    }

    const { data: order, error } = await createOrderService(orderInput, tenantId)

    if (error || !order) {
      throw new Error('Error al crear orden')
    }

    return NextResponse.json(
      { 
        data: {
          id: order.id,
          tableId: order.table_id,
          status: order.status,
          totalCents: order.total_cents,
        } 
      },
      { status: 201 }
    )
  } catch (error) {
    if (error instanceof Error && error.message.startsWith("Menu item not found")) {
      return NextResponse.json({ error: error.message }, { status: 404 })
    }

    logger.error('Error creating order', error instanceof Error ? error : new Error(String(error)))
    return NextResponse.json(
      { error: "No se pudo crear la orden" },
      { status: 500 },
    )
  }
}

export async function OPTIONS() {
  return NextResponse.json({ actions: ["POST"] })
}
