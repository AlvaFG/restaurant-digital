import { NextResponse } from "next/server"
import { z } from "zod"

import { OrderService } from "@/lib/mock-data"
import { getMenuMetadata } from "@/lib/server/menu-store"

import { buildMenuHeaders } from "../utils"

const orderItemSchema = z
  .object({
    menuItemId: z.string().trim().min(1, "El identificador del plato es obligatorio"),
    quantity: z.coerce.number().int("La cantidad debe ser un entero").min(1, "La cantidad debe ser al menos 1"),
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
    const order = await OrderService.createOrder(payload.tableId, payload.items)
    const metadata = await getMenuMetadata()

    return NextResponse.json(
      { data: order },
      {
        status: 201,
        headers: buildMenuHeaders(metadata),
      },
    )
  } catch (error) {
    if (error instanceof Error && error.message.startsWith("Menu item not found")) {
      return NextResponse.json({ error: error.message }, { status: 404 })
    }

    console.error("[api/menu/orders]", error)
    return NextResponse.json(
      { error: "No se pudo crear la orden" },
      { status: 500 },
    )
  }
}

export async function OPTIONS() {
  return NextResponse.json({ actions: ["POST"] })
}
