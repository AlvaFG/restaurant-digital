import { NextResponse } from "next/server"

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

    // TODO: Implementar tabla de alergenos en Supabase
    // Por ahora retornamos array vacío
    return NextResponse.json({
      data: []
    })
  } catch (error) {
    return handleMenuError("allergens", error, "No se pudieron obtener los alérgenos")
  }
}

export async function OPTIONS() {
  return NextResponse.json({ actions: ["GET"] })
}
