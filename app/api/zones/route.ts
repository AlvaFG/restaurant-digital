import { NextResponse } from "next/server"
import { getCurrentUser } from "@/lib/supabase/server"
import { listZones, createZone } from "@/lib/server/zones-store"
import { logger } from "@/lib/logger"
import type { User } from "@supabase/supabase-js"

/**
 * Extract tenantId from Supabase Auth User
 * Checks both user_metadata and root level for tenant_id
 */
function getTenantIdFromUser(user: User): string | undefined {
  const metadata = user.user_metadata as Record<string, unknown> | undefined
  const tenantId = metadata?.tenant_id
  
  if (typeof tenantId === 'string') {
    return tenantId
  }
  
  // Fallback to root level (custom JWT claims)
  const rootTenantId = (user as unknown as Record<string, unknown>).tenant_id
  return typeof rootTenantId === 'string' ? rootTenantId : undefined
}

export async function GET() {
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

    const zones = await listZones(tenantId)

    const duration = Date.now() - startTime
    logger.info('Zonas obtenidas', { 
      count: zones.length,
      duration: `${duration}ms`,
      tenantId
    })

    return NextResponse.json({
      data: zones,
    })
  } catch (error) {
    const _duration = Date.now() - startTime
    logger.error('Error al obtener zonas', error as Error)

    return NextResponse.json(
      { error: 'No se pudieron cargar las zonas' },
      { status: 500 }
    )
  }
}

export async function POST(request: Request) {
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

    // Parsear body
    const body = await request.json()
    const { name, description, sort_order, active } = body

    // Validaciones
    if (!name || typeof name !== 'string' || name.trim().length === 0) {
      return NextResponse.json(
        { error: 'El nombre de la zona es requerido' },
        { status: 400 }
      )
    }

    // Crear zona
    const zone = await createZone({
      name: name.trim(),
      description: description || undefined,
      sort_order: sort_order !== undefined ? parseInt(sort_order) : undefined,
      active: active !== undefined ? active : true,
      tenantId,
    })

    const duration = Date.now() - startTime
    logger.info('Zona creada exitosamente', {
      zoneId: zone.id,
      name: zone.name,
      tenantId,
      duration: `${duration}ms`,
    })

    return NextResponse.json(
      { data: zone },
      { status: 201 }
    )
  } catch (error) {
    const _duration = Date.now() - startTime
    logger.error('Error al crear zona', error as Error)

    const errorMessage = error instanceof Error ? error.message : 'No se pudo crear la zona'

    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    )
  }
}

export async function OPTIONS() {
  return NextResponse.json({
    actions: ["GET", "POST"],
    description: "Gestión de zonas del restaurante",
  })
}
