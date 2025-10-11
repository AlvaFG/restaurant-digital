import { NextResponse } from "next/server"

import {
  getStoreMetadata,
  getTableById,
  listTableHistory,
  updateTableMetadata,
} from "@/lib/server/table-store"
import { logRequest, logResponse, obtenerIdDeParams, validarBody } from '@/lib/api-helpers'
import { logger } from '@/lib/logger'
import { MENSAJES } from '@/lib/i18n/mensajes'
import { NotFoundError } from '@/lib/errors'

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
    
    const table = await getTableById(tableId)
    
    if (!table) {
      logger.warn('Mesa no encontrada', { tableId })
      return notFound()
    }

    const [metadata, history] = await Promise.all([
      getStoreMetadata(),
      listTableHistory(tableId),
    ])

    const duration = Date.now() - startTime
    logResponse('GET', `/api/tables/${tableId}`, 200, duration)
    
    logger.info('Mesa obtenida', { 
      tableId,
      duration: `${duration}ms`
    })

    return NextResponse.json({
      data: table,
      history,
      metadata,
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
    
    const payload = await validarBody<{
      number?: number
      seats?: number
      zone?: string
    }>(request)

    logger.info('Actualizando metadata de mesa', { 
      tableId, 
      updates: Object.keys(payload) 
    })

    const updated = await updateTableMetadata(tableId, payload)

    const duration = Date.now() - startTime
    logResponse('PATCH', `/api/tables/${tableId}`, 200, duration)
    
    logger.info('Mesa actualizada', { 
      tableId,
      duration: `${duration}ms`
    })

    return NextResponse.json({ data: updated })
  } catch (error) {
    const duration = Date.now() - startTime
    
    if (error instanceof Error && error.message === "Table not found") {
      logResponse('PATCH', `/api/tables/${context.params.id}`, 404, duration)
      logger.warn('Mesa no encontrada al actualizar', { tableId: context.params.id })
      return notFound()
    }

    logResponse('PATCH', `/api/tables/${context.params.id}`, 500, duration)
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
    actions: ["GET", "PATCH"],
  })
}
