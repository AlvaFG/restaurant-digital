import { NextResponse } from "next/server"

import {
  getTableById as getTableByIdService,
  updateTable as updateTableService,
  deleteTable as deleteTableService,
} from "@/lib/services/tables-service"
import { logRequest, logResponse, obtenerIdDeParams, validarBody } from '@/lib/api-helpers'
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

function notFound() {
  return NextResponse.json({ error: MENSAJES.ERRORES.MESA_NO_ENCONTRADA }, { status: 404 })
}

export async function GET(
  _request: Request,
  context: { params: { id: string } },
) {
  const startTime = Date.now()
  
  try {
    const tableId = obtenerIdDeParams(context.params)
    logRequest('GET', `/api/tables/${tableId}`)
    
    // Obtener usuario para tenant_id
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 })
    }

    const tenantId = getTenantIdFromUser(user)
    if (!tenantId) {
      return NextResponse.json({ error: 'Usuario sin tenant' }, { status: 403 })
    }

    // Obtener mesa desde Supabase
    const { data: table, error } = await getTableByIdService(tableId, tenantId)
    
    if (error || !table) {
      logger.warn('Mesa no encontrada', { tableId, tenantId })
      return notFound()
    }

    const _duration = Date.now() - startTime
    logResponse('GET', `/api/tables/${tableId}`, 200, _duration)
    
    logger.info('Mesa obtenida desde Supabase', { 
      tableId,
      tenantId,
      duration: `${_duration}ms`
    })

    return NextResponse.json({
      data: table,
      metadata: {
        version: 1,
        updatedAt: new Date().toISOString(),
        source: 'supabase'
      },
    })
  } catch (error) {
    const duration = Date.now() - startTime
    logResponse('GET', `/api/tables/${context.params.id}`, 500, duration)
    
    logger.error('Error al obtener mesa', error as Error, { 
      tableId: context.params.id 
    })
    
    return NextResponse.json(
      { error: MENSAJES.ERRORES.GENERICO },
      { status: 500 },
    )
  }
}

export async function PATCH(
  request: Request,
  context: { params: { id: string } },
) {
  const startTime = Date.now()
  
  try {
    const tableId = obtenerIdDeParams(context.params)
    logRequest('PATCH', `/api/tables/${tableId}`)
    
    // Obtener usuario para tenant_id
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 })
    }

    const tenantId = getTenantIdFromUser(user)
    if (!tenantId) {
      return NextResponse.json({ error: 'Usuario sin tenant' }, { status: 403 })
    }

    const payload = await validarBody<{
      number?: string
      capacity?: number
      zone_id?: string
      zoneId?: string
      status?: string
    }>(request)

    logger.info('Actualizando mesa', { 
      tableId,
      tenantId,
      updates: Object.keys(payload) 
    })

    // Normalizar zoneId vs zone_id
    const updates = {
      number: payload.number,
      capacity: payload.capacity,
      zoneId: payload.zone_id || payload.zoneId,
      status: payload.status,
    }

    // Remover undefined
    Object.keys(updates).forEach(key => 
      updates[key as keyof typeof updates] === undefined && delete updates[key as keyof typeof updates]
    )

    const { data: updated, error } = await updateTableService(tableId, updates, tenantId)

    if (error || !updated) {
      if (error?.message?.includes('not found')) {
        logger.warn('Mesa no encontrada al actualizar', { tableId, tenantId })
        return notFound()
      }
      throw error || new Error('No se pudo actualizar la mesa')
    }

    const duration = Date.now() - startTime
    logResponse('PATCH', `/api/tables/${tableId}`, 200, duration)
    
    logger.info('Mesa actualizada en Supabase', { 
      tableId,
      tenantId,
      duration: `${duration}ms`
    })

    return NextResponse.json({ data: updated })
  } catch (error) {
    const _duration2 = Date.now() - startTime
    
    logResponse('PATCH', `/api/tables/${context.params.id}`, 500, _duration2)
    logger.error('Error al actualizar mesa', error as Error, { 
      tableId: context.params.id 
    })
    
    return NextResponse.json(
      { error: MENSAJES.ERRORES.GENERICO },
      { status: 500 },
    )
  }
}

export async function OPTIONS() {
  return NextResponse.json({
    actions: ["GET", "PATCH", "DELETE"],
  })
}

export async function DELETE(
  _request: Request,
  context: { params: { id: string } },
) {
  const startTime = Date.now()
  
  try {
    const tableId = obtenerIdDeParams(context.params)
    logRequest('DELETE', `/api/tables/${tableId}`)

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

    logger.info('Eliminando mesa', { 
      tableId,
      tenantId,
      userId: user.id,
    })

    // Eliminar la mesa usando el servicio de Supabase
    const { error: deleteError } = await deleteTableService(tableId, tenantId)

    if (deleteError) {
      const duration = Date.now() - startTime
      logResponse('DELETE', `/api/tables/${tableId}`, 500, duration)
      
      logger.error('Error al eliminar mesa desde Supabase', new Error(`Delete failed: ${deleteError}`), { 
        tableId,
        tenantId,
        errorDetail: deleteError 
      })
      
      return NextResponse.json(
        { error: deleteError },
        { status: 500 }
      )
    }

    const duration = Date.now() - startTime
    logResponse('DELETE', `/api/tables/${tableId}`, 200, duration)
    
    logger.info('Mesa eliminada exitosamente', { 
      tableId,
      tenantId,
      duration: `${duration}ms`
    })

    return NextResponse.json({ 
      success: true,
      message: 'Mesa eliminada exitosamente' 
    })
  } catch (error) {
    const duration = Date.now() - startTime
    
    if (error instanceof Error && error.message === "Mesa no encontrada") {
      logResponse('DELETE', `/api/tables/${context.params.id}`, 404, duration)
      logger.warn('Mesa no encontrada al eliminar', { tableId: context.params.id })
      return notFound()
    }

    logResponse('DELETE', `/api/tables/${context.params.id}`, 500, duration)
    logger.error('Error al eliminar mesa', error as Error, { 
      tableId: context.params.id 
    })

    const errorMessage = error instanceof Error ? error.message : MENSAJES.ERRORES.GENERICO
    
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 },
    )
  }
}
