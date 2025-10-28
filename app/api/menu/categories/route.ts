import { NextResponse } from "next/server"

import { getMenuCategories } from "@/lib/services/menu-service"
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

    const { data: categories, error } = await getMenuCategories(tenantId)

    if (error || !categories) {
      throw new Error('Error obteniendo categorías')
    }

    return NextResponse.json({
      data: categories.map(cat => ({
        id: cat.id,
        name: cat.name,
        description: cat.description,
        active: cat.active,
        sortOrder: cat.sort_order,
      }))
    })
  } catch (error) {
    return handleMenuError("categories", error, "No se pudieron obtener las categorías")
  }
}

export async function OPTIONS() {
  return NextResponse.json({ actions: ["GET"] })
}
