import { NextResponse } from "next/server"

import {
  getStoreMetadata,
  listTables,
} from "@/lib/server/table-store"
import { logRequest, logResponse, manejarError } from '@/lib/api-helpers'
import { logger } from '@/lib/logger'
import { MENSAJES } from '@/lib/i18n/mensajes'

export async function GET() {
  const startTime = Date.now()
  
  try {
    logRequest('GET', '/api/tables')
    
    const [tables, metadata] = await Promise.all([
      listTables(),
      getStoreMetadata(),
    ])

    const duration = Date.now() - startTime
    logResponse('GET', '/api/tables', 200, duration)
    
    logger.info('Mesas obtenidas', { 
      count: tables.length,
      duration: `${duration}ms`
    })

    return NextResponse.json({
      data: tables,
      metadata,
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
    
    const metadata = await getStoreMetadata()
    
    return new NextResponse(null, {
      headers: {
        "x-table-store-version": String(metadata.version),
        "x-table-store-updated-at": metadata.updatedAt,
      },
    })
  } catch (error) {
    logger.error('Error al leer metadata de mesas', error as Error)
    return new NextResponse(null, { status: 500 })
  }
}

export async function OPTIONS() {
  return NextResponse.json({
    actions: ["GET", "HEAD"],
    description: "Listado de mesas y metadatos de versionado",
  })
}
