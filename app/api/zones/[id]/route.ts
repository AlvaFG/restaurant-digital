import { NextResponse } from "next/server"
import { getCurrentUser } from "@/lib/supabase/server"
import { getZoneById, updateZone, deleteZone } from "@/lib/server/zones-store"
import { logger } from "@/lib/logger"
import type { User } from "@supabase/supabase-js"

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
  context: { params: { id: string } },
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
  context: { params: { id: string } },
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
    const body = await request.json().catch(() => ({})) as {
      name?: string
      active?: boolean
    }

    const updates: {
      name?: string
      active?: boolean
    } = {}

    if (body.name !== undefined) {
      if (typeof body.name !== 'string' || body.name.trim().length === 0) {
        return NextResponse.json({ error: 'El nombre no puede quedar vacío' }, { status: 400 })
      }
      updates.name = body.name.trim()
    }

    if (typeof body.active === 'boolean') {
      updates.active = body.active
    }

    if (Object.keys(updates).length === 0) {
      return NextResponse.json({ error: 'No se enviaron cambios validos' }, { status: 400 })
    }

    const zone = await updateZone(zoneId, tenantId, updates)

    logger.info('Zona actualizada', { zoneId, tenantId, fields: Object.keys(updates) })

    return NextResponse.json({ data: zone })
  } catch (error) {
    logger.error('Error al actualizar zona', error as Error)
    const message = error instanceof Error ? error.message : 'Error interno del servidor'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

export async function DELETE(
  _request: Request,
  context: { params: { id: string } },
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
      message: 'Zona eliminada correctamente',
    })
  } catch (error) {
    logger.error('Error al eliminar zona', error as Error)
    const message = error instanceof Error ? error.message : 'Error interno del servidor'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

export async function OPTIONS() {
  return NextResponse.json({
    actions: ['GET', 'PATCH', 'DELETE'],
  })
}
