import { NextResponse } from "next/server"

import {
  getTableById as getTableByIdService,
  updateTableStatus as updateTableStatusService,
} from "@/lib/services/tables-service"
import { isTableState } from "@/lib/table-states"
import { logRequest, logResponse, obtenerIdDeParams, validarBody } from '@/lib/api-helpers'
import { logger } from '@/lib/logger'
import { MENSAJES } from '@/lib/i18n/mensajes'
import { ValidationError, NotFoundError } from '@/lib/errors'
import { getCurrentUser } from '@/lib/supabase/server'
import type { User } from "@supabase/supabase-js"

/**
 * Extract tenantId from Supabase Auth User
 */
function getTenantIdFromUser(user: User): string | null {
  return user.user_metadata?.tenant_id || null
}

interface UpdateStateRequest {
  status: string
  reason?: string
  actor?: {
    id?: string
    name?: string
    role?: string
  }
}

export async function PATCH(
  request: Request,
  context: { params: { id: string } },
) {
  const startTime = Date.now()
  
  try {
    const tableId = obtenerIdDeParams(context.params)
    logRequest('PATCH', `/api/tables/${tableId}/state`)
    
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
    
    // Verificar que la mesa existe y pertenece al tenant
    const { data: table, error: getError } = await getTableByIdService(tableId, tenantId)
    if (getError || !table) {
      logger.warn('Mesa no encontrada al cambiar estado', { 
        tableId, 
        tenantId,
        error: getError 
      })
      throw new NotFoundError(MENSAJES.ERRORES.MESA_NO_ENCONTRADA)
    }

    const payload = await validarBody<UpdateStateRequest>(request)

    if (!payload?.status || !isTableState(payload.status)) {
      logger.warn('Estado de mesa inválido', { 
        tableId,
        tenantId,
        receivedStatus: payload?.status 
      })
      throw new ValidationError('Estado invalido')
    }

    logger.info('Cambiando estado de mesa', { 
      tableId,
      tenantId,
      oldState: table.status,
      newState: payload.status,
      actor: payload.actor?.name || 'Sistema',
      reason: payload.reason
    })

    // Actualizar estado en Supabase
    const { data: updated, error: updateError } = await updateTableStatusService(
      tableId, 
      payload.status,
      tenantId
    )

    if (updateError || !updated) {
      logger.error('Error al actualizar estado desde Supabase', new Error(`Update failed: ${updateError}`), { 
        tableId,
        tenantId,
        status: payload.status 
      })
      throw new Error('Error al actualizar estado de mesa')
    }

    const duration = Date.now() - startTime
    logResponse('PATCH', `/api/tables/${tableId}/state`, 200, duration)
    
    logger.info('Estado de mesa actualizado exitosamente', { 
      tableId,
      tenantId,
      newState: payload.status,
      duration: `${duration}ms`
    })

    return NextResponse.json({ data: updated })
  } catch (error) {
    const duration = Date.now() - startTime
    const tableId = context.params.id

    if (error instanceof NotFoundError) {
      logResponse('PATCH', `/api/tables/${tableId}/state`, 404, duration)
      return NextResponse.json({ error: error.message }, { status: 404 })
    }

    if (error instanceof ValidationError) {
      logResponse('PATCH', `/api/tables/${tableId}/state`, 400, duration)
      return NextResponse.json({ error: error.message }, { status: 400 })
    }

    if (error instanceof Error) {
      if (error.message === "Table not found") {
        logResponse('PATCH', `/api/tables/${tableId}/state`, 404, duration)
        return NextResponse.json({ error: MENSAJES.ERRORES.MESA_NO_ENCONTRADA }, { status: 404 })
      }

      if (error.message.startsWith("Invalid transition")) {
        logResponse('PATCH', `/api/tables/${tableId}/state`, 409, duration)
        logger.warn('Transición de estado inválida', { 
          tableId, 
          errorMessage: error.message 
        })
        return NextResponse.json({ error: error.message }, { status: 409 })
      }
    }

    logResponse('PATCH', `/api/tables/${tableId}/state`, 500, duration)
    logger.error('Error al actualizar estado de mesa', error as Error, { tableId })
    
    return NextResponse.json(
      { error: MENSAJES.ERRORES.GENERICO },
      { status: 500 },
    )
  }
}

export async function OPTIONS() {
  return NextResponse.json({ actions: ["PATCH"] })
}
