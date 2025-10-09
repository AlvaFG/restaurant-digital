import { NextResponse } from "next/server"
import { z } from "zod"

import {
  getMenuCatalog,
  getMenuItemById,
  updateMenuItem,
  type MenuItemUpdate,
} from "@/lib/server/menu-store"

import { buildMenuHeaders, handleMenuError } from "../../utils"

const allergenSchema = z
  .object({
    code: z.string().trim().min(1, "El código de alérgeno es obligatorio"),
    contains: z.boolean().optional(),
    traces: z.boolean().optional(),
    notes: z.string().trim().min(1).optional(),
  })
  .strict()

const menuItemUpdateSchema = z
  .object({
    name: z.string().trim().min(1, "El nombre del plato es obligatorio").optional(),
    description: z.string().trim().min(1, "La descripción del plato es obligatoria").optional(),
    priceCents: z.coerce.number().int("El precio debe ser un entero").min(0, "El precio no puede ser negativo").optional(),
    available: z.boolean().optional(),
    tags: z.array(z.string().trim().min(1)).optional(),
    imageUrl: z.union([z.string().trim().min(1), z.null()]).optional(),
    allergens: z.array(allergenSchema).optional(),
  })
  .strict()
  .refine((value) => Object.keys(value).length > 0, {
    message: "Se requiere al menos un campo para actualizar",
  })

type MenuItemUpdatePayload = z.infer<typeof menuItemUpdateSchema>

function notFound() {
  return NextResponse.json({ error: "Plato no encontrado" }, { status: 404 })
}

export async function GET(
  _request: Request,
  context: { params: { id: string } },
) {
  try {
    const { id } = context.params
    const [item, catalog] = await Promise.all([
      getMenuItemById(id),
      getMenuCatalog(),
    ])

    if (!item) {
      return notFound()
    }

    return NextResponse.json(
      { data: item },
      {
        headers: buildMenuHeaders(catalog.metadata),
      },
    )
  } catch (error) {
    return handleMenuError("items/" + context.params.id, error, "No se pudo obtener el plato")
  }
}

export async function PATCH(
  request: Request,
  context: { params: { id: string } },
) {
  let rawPayload: unknown
  try {
    rawPayload = await request.json()
  } catch {
    return NextResponse.json({ error: "Cuerpo JSON inválido" }, { status: 400 })
  }

  const parsed = menuItemUpdateSchema.safeParse(rawPayload)

  if (!parsed.success) {
    const message = parsed.error.issues[0]?.message ?? "Datos inválidos"
    return NextResponse.json({ error: message }, { status: 400 })
  }

  const updates: MenuItemUpdate = parsed.data as MenuItemUpdatePayload

  try {
    const updated = await updateMenuItem(context.params.id, updates)
    const catalog = await getMenuCatalog()

    return NextResponse.json(
      { data: updated },
      {
        headers: buildMenuHeaders(catalog.metadata),
      },
    )
  } catch (error) {
    if (error instanceof Error && error.message === "Menu item not found") {
      return notFound()
    }

    return handleMenuError("items/" + context.params.id, error, "No se pudo actualizar el plato")
  }
}

export async function OPTIONS() {
  return NextResponse.json({ actions: ["GET", "PATCH"] })
}
