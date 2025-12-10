import { NextResponse } from "next/server"
import { getCurrentUser, createServerClient } from "@/lib/supabase/server"
import { createLogger } from "@/lib/logger"
import type { User } from "@supabase/supabase-js"

const logger = createLogger('api-zones')

function getTenantIdFromUser(user: User): string | undefined {
  // Intentar desde user_metadata primero
  const metadata = user.user_metadata as Record<string, unknown> | undefined
  const tenantId = metadata?.tenant_id

  if (typeof tenantId === 'string') {
    return tenantId
  }

  // Intentar desde el root del objeto user (puede estar ahí en algunos casos)
  const rootTenantId = (user as unknown as Record<string, unknown>).tenant_id
  if (typeof rootTenantId === 'string') {
    return rootTenantId
  }

  // Si no se encuentra, retornar undefined
  // El flujo de autenticación debería actualizar user_metadata
  return undefined
}

export async function GET(request: Request) {
  const startTime = Date.now()

  try {
    logger.debug('GET /api/zones - Iniciando petición')
    const user = await getCurrentUser()
    if (!user) {
      logger.warn('GET /api/zones - Usuario no autenticado')
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 })
    }

    logger.debug('GET /api/zones - Usuario autenticado', { userId: user.id })
    const tenantId = getTenantIdFromUser(user)
    logger.debug('GET /api/zones - tenant_id extraído', { tenantId })
    
    if (!tenantId) {
      logger.warn('GET /api/zones - Usuario sin tenant asignado', {
        userId: user.id,
        metadata: user.user_metadata
      })
      // Return empty array instead of error for better UX when tenant is not yet assigned
      return NextResponse.json({ data: [] })
    }

    logger.debug('GET /api/zones - Consultando base de datos', { tenantId })
    
    // Parse query parameters
    const url = new URL(request.url)
    const includeInactive = url.searchParams.get('includeInactive') === 'true'
    
    // Usar createServerClient directamente (no zones-service que usa browser client)
    const supabase = createServerClient()
    
    let query = supabase
      .from('zones')
      .select('*')
      .eq('tenant_id', tenantId)
      .order('sort_order', { ascending: true })
    
    // Only filter by active if not including inactive
    if (!includeInactive) {
      query = query.eq('active', true)
    }
    
    const { data: zones, error } = await query
    
    if (error) {
      logger.error('GET /api/zones - Error al obtener zonas', error as Error, { tenantId })
      throw error
    }

    const duration = Date.now() - startTime
    logger.info('Zonas obtenidas', {
      count: zones?.length || 0,
      duration: `${duration}ms`,
      tenantId,
    })

    return NextResponse.json({ data: zones || [] })
  } catch (error) {
    const duration = Date.now() - startTime
    logger.error('Error al obtener zonas', error as Error, { duration })

    return NextResponse.json(
      { error: 'No se pudieron cargar las zonas' },
      { status: 500 },
    )
  }
}

export async function POST(request: Request) {
  const startTime = Date.now()

  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 })
    }

    const tenantId = getTenantIdFromUser(user)
    if (!tenantId) {
      return NextResponse.json({ error: 'Usuario sin tenant asignado' }, { status: 403 })
    }

    const body = await request.json().catch(() => ({})) as {
      name?: string
      description?: string
      sortOrder?: number
      active?: boolean
    }

    const name = body.name?.trim()
    if (!name) {
      return NextResponse.json({ error: 'El nombre de la zona es obligatorio' }, { status: 400 })
    }

    // Usar createServerClient directamente
    const supabase = createServerClient()
    
    const { data: zone, error } = await supabase
      .from('zones')
      .insert({
        tenant_id: tenantId,
        name,
        description: body.description || null,
        sort_order: body.sortOrder || 0,
        active: true,
      })
      .select()
      .single()

    if (error) {
      throw error
    }

    const duration = Date.now() - startTime
    logger.info('Zona creada exitosamente', {
      zoneId: zone?.id,
      name: zone?.name,
      tenantId,
      duration: `${duration}ms`,
    })

    return NextResponse.json({ data: zone }, { status: 201 })
  } catch (error) {
    const duration = Date.now() - startTime
    logger.error('Error al crear zona', error as Error, { duration })

    const message = error instanceof Error ? error.message : 'No se pudo crear la zona'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

export async function OPTIONS() {
  return NextResponse.json({
    actions: ['GET', 'POST'],
    description: 'Gestion de zonas del restaurante',
  })
}




