import { NextResponse } from "next/server"

import {
  getTableById as getTableByIdService,
  updateTable as updateTableService,
} from "@/lib/services/tables-service"
import { logRequest, logResponse, obtenerIdDeParams } from '@/lib/api-helpers'
import { logger } from '@/lib/logger'
import { MENSAJES } from '@/lib/i18n/mensajes'
import { ValidationError, NotFoundError } from '@/lib/errors'
import { getCurrentUser } from '@/lib/supabase/server'
import type { User } from "@supabase/supabase-js"

const MAX_COVERS = 20

/**
 * Extract tenantId from Supabase Auth User
 */
function getTenantIdFromUser(user: User): string | null {
  return user.user_metadata?.tenant_id || null
}

export async function PATCH(request: Request, context: { params: { id: string } }) {
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

    const tableId = obtenerIdDeParams(context.params)
    logRequest('PATCH', `/api/tables/${tableId}/covers`, { tenantId })

    let payload: unknown
    try {
      payload = await request.json()
    } catch {
      logger.warn('Cuerpo de solicitud inválido (no JSON)', { tableId, tenantId })
      throw new ValidationError("El cuerpo de la solicitud no es un JSON válido")
    }

    const currentRaw = (
      typeof payload === "object" && payload !== null
        ? (payload as { current?: unknown }).current
        : undefined
    )

    if (
      typeof currentRaw !== "number" ||
      !Number.isInteger(currentRaw) ||
      currentRaw < 0 ||
      currentRaw > MAX_COVERS
    ) {
      logger.warn('Valor de cubiertos inválido', { 
        tableId,
        tenantId,
        receivedValue: currentRaw,
        maxAllowed: MAX_COVERS 
      })
      throw new ValidationError(`El campo 'current' debe ser un entero entre 0 y ${MAX_COVERS}`)
    }

    logger.info('Actualizando cubiertos de mesa', { 
      tableId,
      tenantId,
      newCovers: currentRaw
    })

    // Actualizar metadata de la mesa con los covers
    const { data: updated, error } = await updateTableService(
      tableId,
      {
        metadata: {
          covers: {
            current: currentRaw,
            updatedAt: new Date().toISOString(),
          }
        }
      },
      tenantId
    )

    if (error || !updated) {
      throw new Error('Error al actualizar cubiertos')
    }

    const duration = Date.now() - startTime
    logResponse('PATCH', `/api/tables/${tableId}/covers`, 200, duration)
    
    logger.info('Cubiertos actualizados exitosamente', { 
      tableId,
      tenantId,
      covers: currentRaw,
      duration: `${duration}ms`
    })

    return NextResponse.json({
      data: {
        id: updated.id,
        number: updated.number,
        covers: currentRaw,
      },
      metadata: {
        version: 1,
        updatedAt: new Date().toISOString(),
      },
    })
  } catch (error) {
    const duration = Date.now() - startTime
    const tableId = context.params.id

    if (error instanceof ValidationError) {
      logResponse('PATCH', `/api/tables/${tableId}/covers`, 400, duration)
      return NextResponse.json({ error: { message: error.message } }, { status: 400 })
    }

    if (error instanceof Error && error.message === "Table not found") {
      logResponse('PATCH', `/api/tables/${tableId}/covers`, 404, duration)
      logger.warn('Mesa no encontrada al actualizar cubiertos', { tableId })
      return NextResponse.json({ error: { message: MENSAJES.ERRORES.MESA_NO_ENCONTRADA } }, { status: 404 })
    }

    logResponse('PATCH', `/api/tables/${tableId}/covers`, 500, duration)
    logger.error('Error al actualizar cubiertos', error as Error, { tableId })
    
    return NextResponse.json(
      { error: { message: MENSAJES.ERRORES.GENERICO } },
      { status: 500 },
    )
  }
}

export async function GET(_request: Request, context: { params: { id: string } }) {
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

    const tableId = obtenerIdDeParams(context.params)
    logRequest('GET', `/api/tables/${tableId}/covers`, { tenantId })

    logger.info('Consultando información de cubiertos', { tableId, tenantId })

    const { data: table, error } = await getTableByIdService(tableId, tenantId)

    if (error || !table) {
      const duration = Date.now() - startTime
      logResponse('GET', `/api/tables/${tableId}/covers`, 404, duration)
      logger.warn('Mesa no encontrada al consultar cubiertos', { tableId, tenantId })
      return NextResponse.json({ error: { message: MENSAJES.ERRORES.MESA_NO_ENCONTRADA } }, { status: 404 })
    }

    // Extraer covers de metadata (si existe)
    const covers = (table.metadata as { covers?: { current?: number } })?.covers?.current ?? 0

    const duration = Date.now() - startTime
    logResponse('GET', `/api/tables/${tableId}/covers`, 200, duration)
    
    logger.info('Información de cubiertos recuperada exitosamente', { 
      tableId,
      tenantId,
      covers,
      duration: `${duration}ms`
    })

    return NextResponse.json({
      data: {
        id: table.id,
        number: table.number,
        covers,
      },
      metadata: {
        version: 1,
        updatedAt: new Date().toISOString(),
        limits: {
          maxCurrent: MAX_COVERS,
        },
      },
    })
  } catch (error) {
    const duration = Date.now() - startTime
    const tableId = context.params.id
    logResponse('GET', `/api/tables/${tableId}/covers`, 500, duration)
    logger.error('Error al recuperar información de cubiertos', error as Error, { tableId })
    
    return NextResponse.json(
      { error: { message: MENSAJES.ERRORES.GENERICO } },
      { status: 500 },
    )
  }
}