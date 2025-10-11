import { NextResponse } from "next/server"

import {
  getTableById,
  updateTableState,
} from "@/lib/server/table-store"
import { isTableState } from "@/lib/table-states"
import { logRequest, logResponse, obtenerIdDeParams, validarBody } from '@/lib/api-helpers'
import { logger } from '@/lib/logger'
import { MENSAJES } from '@/lib/i18n/mensajes'
import { ValidationError, NotFoundError } from '@/lib/errors'

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
    
    const table = await getTableById(tableId)
    if (!table) {
      logger.warn('Mesa no encontrada al cambiar estado', { tableId })
      throw new NotFoundError(MENSAJES.ERRORES.MESA_NO_ENCONTRADA)
    }

    const payload = await validarBody<UpdateStateRequest>(request)

    if (!payload?.status || !isTableState(payload.status)) {
      logger.warn('Estado de mesa inválido', { 
        tableId, 
        receivedStatus: payload?.status 
      })
      throw new ValidationError('Estado invalido')
    }

    logger.info('Cambiando estado de mesa', { 
      tableId,
      oldState: table.status,
      newState: payload.status,
      actor: payload.actor?.name || 'Sistema',
      reason: payload.reason
    })

    const updated = await updateTableState(tableId, payload.status, {
      actor: payload.actor,
      reason: payload.reason,
    })

    const duration = Date.now() - startTime
    logResponse('PATCH', `/api/tables/${tableId}/state`, 200, duration)
    
    logger.info('Estado de mesa actualizado exitosamente', { 
      tableId,
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
