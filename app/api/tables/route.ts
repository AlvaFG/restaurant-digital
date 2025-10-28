import { NextResponse } from "next/server"

import {
  getTables,
  createTable as createTableService,
} from "@/lib/services/tables-service"
import { logRequest, logResponse } from '@/lib/api-helpers'
import { logger } from '@/lib/logger'
import { MENSAJES } from '@/lib/i18n/mensajes'
import { getCurrentUser } from '@/lib/supabase/server'
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

export async function GET() {
  const startTime = Date.now()
  
  try {
    logRequest('GET', '/api/tables')
    
    // Obtener usuario actual para tenant_id
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json(
        { error: 'No autenticado' },
        { status: 401 }
      )
    }

    const tenantId = getTenantIdFromUser(user)
    if (!tenantId) {
      return NextResponse.json(
        { error: 'Usuario sin tenant asignado' },
        { status: 403 }
      )
    }

    // Obtener mesas desde Supabase
    const { data: tables, error } = await getTables(tenantId)

    if (error) {
      throw error
    }

    const duration = Date.now() - startTime
    logResponse('GET', '/api/tables', 200, duration)
    
    logger.info('Mesas obtenidas desde Supabase', { 
      count: tables?.length || 0,
      tenantId,
      duration: `${duration}ms`
    })

    return NextResponse.json({
      data: tables || [],
      metadata: {
        version: 1,
        updatedAt: new Date().toISOString(),
        source: 'supabase'
      },
    })
  } catch (error) {
    const duration = Date.now() - startTime
    logResponse('GET', '/api/tables', 500, duration)
    
    logger.error('Error al obtener mesas', error as Error)
    
    return NextResponse.json(
      { error: MENSAJES.ERRORES.GENERICO },
      { status: 500 },
    )
  }
}

export async function HEAD() {
  try {
    logger.debug('Obteniendo metadata de mesas')
    
    const user = await getCurrentUser()
    if (!user) {
      return new NextResponse(null, { status: 401 })
    }

    const tenantId = getTenantIdFromUser(user)
    if (!tenantId) {
      return new NextResponse(null, { status: 403 })
    }

    const { data: tables } = await getTables(tenantId)
    
    return new NextResponse(null, {
      headers: {
        "x-table-store-version": "1",
        "x-table-store-updated-at": new Date().toISOString(),
        "x-table-count": String(tables?.length || 0),
        "x-data-source": "supabase",
      },
    })
  } catch (error) {
    logger.error('Error al leer metadata de mesas', error as Error)
    return new NextResponse(null, { status: 500 })
  }
}

export async function OPTIONS() {
  return NextResponse.json({
    actions: ["GET", "HEAD", "POST"],
    description: "Listado de mesas, metadatos de versionado y creación de mesas",
  })
}

export async function POST(request: Request) {
  const startTime = Date.now()
  
  try {
    logRequest('POST', '/api/tables')

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
    const { number, zone_id } = body

    // Validaciones
    if (!number || typeof number !== 'string' || number.trim().length === 0) {
      return NextResponse.json(
        { error: 'El identificador de mesa es requerido' },
        { status: 400 }
      )
    }

    if (!zone_id || typeof zone_id !== 'string') {
      return NextResponse.json(
        { error: 'La zona es requerida' },
        { status: 400 }
      )
    }

    // Crear mesa en Supabase
    const { data: table, error: createError } = await createTableService({
      number: number.trim(),
      zoneId: zone_id,
      capacity: 4, // Valor por defecto
    }, tenantId)

    if (createError || !table) {
      throw createError || new Error('No se pudo crear la mesa')
    }

    const duration = Date.now() - startTime
    logResponse('POST', '/api/tables', 201, duration)

    logger.info('Mesa creada exitosamente en Supabase', {
      tableId: table.id,
      number: table.number,
      tenantId,
      duration: `${duration}ms`,
    })

    return NextResponse.json(
      { data: table },
      { status: 201 }
    )
  } catch (error) {
    const duration = Date.now() - startTime
    logResponse('POST', '/api/tables', 500, duration)

    logger.error('Error al crear mesa', error as Error)

    const errorMessage = error instanceof Error ? error.message : MENSAJES.ERRORES.GENERICO

    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    )
  }
}
