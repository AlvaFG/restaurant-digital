import { NextResponse } from "next/server"
import { getCurrentUser } from "@/lib/supabase/server"
import { getZoneById, updateZone, deleteZone } from "@/lib/server/zones-store"
import { logger } from "@/lib/logger"
import type { User } from "@supabase/supabase-js"

/**
 * Extract tenantId from Supabase Auth User
 */
function getTenantIdFromUser(user: User): string | undefined {
  const metadata = user.user_metadata as Record<string, unknown> | undefined
  const tenantId = metadata?.tenant_id
  
  if (typeof tenantId === 'string') {
    return tenantId
  }
  
  const rootTenantId = (user as unknown as Record<string, unknown>).tenant_id
  return typeof rootTenantId === 'string' ? rootTenantId : undefined
}

export async function GET(
  _request: Request,
  context: { params: { id: string } }
) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 })
    }

    const tenantId = getTenantIdFromUser(user)
    if (!tenantId) {
      return NextResponse.json({ error: 'Usuario sin tenant asignado' }, { status: 403 })
    }

    const zoneId = context.params.id
    const zone = await getZoneById(zoneId, tenantId)

    if (!zone) {
      return NextResponse.json({ error: 'Zona no encontrada' }, { status: 404 })
    }

    return NextResponse.json({ data: zone })
  } catch (error) {
    logger.error('Error al obtener zona', error as Error)
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 })
  }
}

export async function PATCH(
  request: Request,
  context: { params: { id: string } }
) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 })
    }

    const tenantId = getTenantIdFromUser(user)
    if (!tenantId) {
      return NextResponse.json({ error: 'Usuario sin tenant asignado' }, { status: 403 })
    }

    const zoneId = context.params.id
    const body = await request.json()
    const { name, description, sort_order, active } = body

    // Validaciones
    type ZoneUpdates = {
      name?: string
      description?: string
      sort_order?: number
      active?: boolean
    }
    
    const updates: ZoneUpdates = {}
    if (name !== undefined) {
      if (typeof name !== 'string' || name.trim().length === 0) {
        return NextResponse.json({ error: 'El nombre no puede estar vacío' }, { status: 400 })
      }
      updates.name = name.trim()
    }
    if (description !== undefined) updates.description = description
    if (sort_order !== undefined) updates.sort_order = parseInt(sort_order)
    if (active !== undefined) updates.active = active

    const zone = await updateZone(zoneId, tenantId, updates)

    logger.info('Zona actualizada', { zoneId, tenantId })

    return NextResponse.json({ data: zone })
  } catch (error) {
    logger.error('Error al actualizar zona', error as Error)
    const errorMessage = error instanceof Error ? error.message : 'Error interno del servidor'
    return NextResponse.json({ error: errorMessage }, { status: 500 })
  }
}

export async function DELETE(
  _request: Request,
  context: { params: { id: string } }
) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 })
    }

    const tenantId = getTenantIdFromUser(user)
    if (!tenantId) {
      return NextResponse.json({ error: 'Usuario sin tenant asignado' }, { status: 403 })
    }

    const zoneId = context.params.id
    await deleteZone(zoneId, tenantId)

    logger.info('Zona eliminada', { zoneId, tenantId })

    return NextResponse.json({ 
      success: true,
      message: 'Zona eliminada exitosamente'
    })
  } catch (error) {
    logger.error('Error al eliminar zona', error as Error)
    const errorMessage = error instanceof Error ? error.message : 'Error interno del servidor'
    return NextResponse.json({ error: errorMessage }, { status: 500 })
  }
}

export async function OPTIONS() {
  return NextResponse.json({
    actions: ["GET", "PATCH", "DELETE"],
  })
}
