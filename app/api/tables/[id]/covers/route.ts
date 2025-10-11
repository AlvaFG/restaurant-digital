import { NextResponse } from "next/server"

import type { Table } from "@/lib/mock-data"
import {
  MAX_COVERS,
  getStoreMetadata,
  getTableById,
  setTableCurrentCovers,
} from "@/lib/server/table-store"
import { logRequest, logResponse, obtenerIdDeParams } from '@/lib/api-helpers'
import { logger } from '@/lib/logger'
import { MENSAJES } from '@/lib/i18n/mensajes'
import { ValidationError, NotFoundError } from '@/lib/errors'

function serializeTable(table: Table) {
  return {
    id: table.id,
    number: table.number,
    zone: table.zone ?? null,
    seats: table.seats ?? null,
    status: table.status,
    covers: {
      current: table.covers.current,
      total: table.covers.total,
      sessions: table.covers.sessions,
      lastUpdatedAt: table.covers.lastUpdatedAt ?? null,
      lastSessionAt: table.covers.lastSessionAt ?? null,
    },
  }
}

function buildMetadata(metadata: Awaited<ReturnType<typeof getStoreMetadata>>) {
  return {
    version: metadata.version,
    updatedAt: metadata.updatedAt,
    totals: metadata.coverTotals,
    limits: {
      maxCurrent: MAX_COVERS,
    },
  }
}

export async function PATCH(request: Request, context: { params: { id: string } }) {
  const startTime = Date.now()
  
  try {
    const tableId = obtenerIdDeParams(context.params)
    logRequest('PATCH', `/api/tables/${tableId}/covers`)

    let payload: unknown
    try {
      payload = await request.json()
    } catch {
      logger.warn('Cuerpo de solicitud inválido (no JSON)', { tableId })
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
        receivedValue: currentRaw,
        maxAllowed: MAX_COVERS 
      })
      throw new ValidationError(`El campo 'current' debe ser un entero entre 0 y ${MAX_COVERS}`)
    }

    logger.info('Actualizando cubiertos de mesa', { 
      tableId,
      newCovers: currentRaw
    })

    const table = await setTableCurrentCovers(tableId, currentRaw)
    const storeMetadata = await getStoreMetadata()

    const body = {
      data: serializeTable(table),
      metadata: buildMetadata(storeMetadata),
    }

    const duration = Date.now() - startTime
    logResponse('PATCH', `/api/tables/${tableId}/covers`, 200, duration)
    
    logger.info('Cubiertos actualizados exitosamente', { 
      tableId,
      covers: currentRaw,
      duration: `${duration}ms`
    })

    return NextResponse.json(body, {
      headers: {
        "x-table-store-version": String(storeMetadata.version),
        "x-table-store-updated-at": storeMetadata.updatedAt,
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
    const tableId = obtenerIdDeParams(context.params)
    logRequest('GET', `/api/tables/${tableId}/covers`)

    const [table, storeMetadata] = await Promise.all([
      getTableById(tableId),
      getStoreMetadata(),
    ])

    if (!table) {
      logger.warn('Mesa no encontrada al obtener cubiertos', { tableId })
      throw new NotFoundError(MENSAJES.ERRORES.MESA_NO_ENCONTRADA)
    }

    const body = {
      data: serializeTable(table),
      metadata: buildMetadata(storeMetadata),
    }

    const duration = Date.now() - startTime
    logResponse('GET', `/api/tables/${tableId}/covers`, 200, duration)
    
    logger.info('Cubiertos obtenidos', { 
      tableId,
      currentCovers: table.covers.current,
      duration: `${duration}ms`
    })

    return NextResponse.json(body, {
      headers: {
        "x-table-store-version": String(storeMetadata.version),
        "x-table-store-updated-at": storeMetadata.updatedAt,
      },
    })
  } catch (error) {
    const duration = Date.now() - startTime
    const tableId = context.params.id

    if (error instanceof NotFoundError) {
      logResponse('GET', `/api/tables/${tableId}/covers`, 404, duration)
      return NextResponse.json({ error: { message: error.message } }, { status: 404 })
    }

    logResponse('GET', `/api/tables/${tableId}/covers`, 500, duration)
    logger.error('Error al obtener cubiertos', error as Error, { tableId })
    
    return NextResponse.json(
      { error: { message: MENSAJES.ERRORES.GENERICO } },
      { status: 500 },
    )
  }
}