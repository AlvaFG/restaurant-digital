import { NextResponse } from "next/server"
import { createLogger } from "@/lib/logger"

import {
  getTableLayout,
  getStoreMetadata,
  listTables,
  updateTableLayout,
} from "@/lib/server/table-store"
import type { Table, TableMapLayout } from "@/lib/mock-data"

const logger = createLogger('api-table-layout')

interface PersistLayoutRequest {
  layout: TableMapLayout
  tables: Table[]
}

export async function GET() {
  try {
    const [layout, tables, metadata] = await Promise.all([
      getTableLayout(),
      listTables(),
      getStoreMetadata(),
    ])

    logger.info('Table layout obtenido exitosamente', {
      tablesCount: tables.length,
      zonesCount: layout?.zones?.length || 0
    })

    return NextResponse.json({
      layout,
      tables,
      metadata,
    })
  } catch (error) {
    logger.error('Error al cargar table layout', error as Error)
    return NextResponse.json(
      { error: "No se pudo cargar el layout de mesas" },
      { status: 500 },
    )
  }
}

export async function PUT(request: Request) {
  try {
    const body = (await request.json()) as Partial<PersistLayoutRequest>

    if (!body?.layout || !body?.tables) {
      logger.warn('PUT /api/table-layout - Datos incompletos', {
        hasLayout: !!body?.layout,
        hasTables: !!body?.tables
      })
      return NextResponse.json(
        { error: "Se requiere 'layout' y 'tables'" },
        { status: 400 },
      )
    }

    await updateTableLayout(body.layout, body.tables)

    logger.info('Table layout actualizado exitosamente', {
      tablesCount: body.tables.length,
      zonesCount: body.layout.zones?.length || 0
    })

    return NextResponse.json({ ok: true })
  } catch (error) {
    logger.error('Error al persistir table layout', error as Error)
    return NextResponse.json(
      { error: "No se pudo guardar el layout" },
      { status: 500 },
    )
  }
}

export async function POST(request: Request) {
  return PUT(request)
}

