import { NextResponse } from "next/server"

import {
  getTableLayout,
  getStoreMetadata,
  listTables,
  updateTableLayout,
} from "@/lib/server/table-store"
import type { Table, TableMapLayout } from "@/lib/mock-data"

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

    return NextResponse.json({
      layout,
      tables,
      metadata,
    })
  } catch (error) {
    console.error("[api/table-layout] Failed to load layout", error)
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
      return NextResponse.json(
        { error: "Se requiere 'layout' y 'tables'" },
        { status: 400 },
      )
    }

    await updateTableLayout(body.layout, body.tables)

    return NextResponse.json({ ok: true })
  } catch (error) {
    console.error("[api/table-layout] Failed to persist layout", error)
    return NextResponse.json(
      { error: "No se pudo guardar el layout" },
      { status: 500 },
    )
  }
}

export async function POST(request: Request) {
  return PUT(request)
}

