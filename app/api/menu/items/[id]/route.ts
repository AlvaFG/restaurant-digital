import { NextResponse } from "next/server"
import { z } from "zod"

import {
  getMenuItemById as getMenuItemByIdService,
  updateMenuItem as updateMenuItemService,
} from "@/lib/services/menu-service"
import { getCurrentUser } from '@/lib/supabase/server'
import type { User } from "@supabase/supabase-js"

import { handleMenuError } from "../../utils"

/**
 * Extract tenantId from Supabase Auth User
 */
function getTenantIdFromUser(user: User): string | null {
  return user.user_metadata?.tenant_id || null
}

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

    const { id } = context.params
    const { data: item, error } = await getMenuItemByIdService(id, tenantId)

    if (error || !item) {
      return notFound()
    }

    return NextResponse.json({
      data: {
        id: item.id,
        categoryId: item.category_id,
        name: item.name,
        description: item.description,
        priceCents: item.price_cents,
        available: item.available,
        imageUrl: item.image_url,
      }
    })
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

    const updates = {
      name: parsed.data.name,
      description: parsed.data.description,
      price_cents: parsed.data.priceCents,
      available: parsed.data.available,
      image_url: parsed.data.imageUrl,
    }

    const { data: updated, error } = await updateMenuItemService(
      context.params.id, 
      updates,
      tenantId
    )

    if (error || !updated) {
      if (error && error.message.includes('not found')) {
        return notFound()
      }
      throw new Error('Error al actualizar item')
    }

    return NextResponse.json({
      data: {
        id: updated.id,
        categoryId: updated.category_id,
        name: updated.name,
        description: updated.description,
        priceCents: updated.price_cents,
        available: updated.available,
        imageUrl: updated.image_url,
      }
    })
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
