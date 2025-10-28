import { NextResponse } from "next/server"

import { getMenuItems } from "@/lib/services/menu-service"
import { getCurrentUser } from '@/lib/supabase/server'
import type { User } from "@supabase/supabase-js"

import { handleMenuError } from "../utils"

/**
 * Extract tenantId from Supabase Auth User
 */
function getTenantIdFromUser(user: User): string | null {
  return user.user_metadata?.tenant_id || null
}

export async function GET() {
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

    const { data: items, error } = await getMenuItems(tenantId)

    if (error || !items) {
      throw new Error('Error obteniendo items del menú')
    }

    return NextResponse.json({
      data: items.map(item => ({
        id: item.id,
        categoryId: item.category_id,
        name: item.name,
        description: item.description,
        priceCents: item.price_cents,
        available: item.available,
        imageUrl: item.image_url,
      }))
    })
  } catch (error) {
    return handleMenuError("items", error, "No se pudieron obtener los platos")
  }
}

export async function OPTIONS() {
  return NextResponse.json({ actions: ["GET"] })
}
