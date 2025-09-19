import { NextResponse } from "next/server"

import {
  getStoreMetadata,
  getTableById,
  listTableHistory,
  updateTableMetadata,
} from "@/lib/server/table-store"

function notFound() {
  return NextResponse.json({ error: "Mesa no encontrada" }, { status: 404 })
}

export async function GET(
  _request: Request,
  context: { params: { id: string } },
) {
  try {
    const table = await getTableById(context.params.id)
    if (!table) {
      return notFound()
    }

    const [metadata, history] = await Promise.all([
      getStoreMetadata(),
      listTableHistory(context.params.id),
    ])

    return NextResponse.json({
      data: table,
      history,
      metadata,
    })
  } catch (error) {
    console.error("[api/tables/:id] Failed to load table", error)
    return NextResponse.json(
      { error: "No se pudo obtener la mesa" },
      { status: 500 },
    )
  }
}

export async function PATCH(
  request: Request,
  context: { params: { id: string } },
) {
  try {
    const payload = (await request.json()) as {
      number?: number
      seats?: number
      zone?: string
    }

    const updated = await updateTableMetadata(context.params.id, payload)

    return NextResponse.json({ data: updated })
  } catch (error) {
    if (error instanceof Error && error.message === "Table not found") {
      return notFound()
    }

    console.error("[api/tables/:id] Failed to update table", error)
    return NextResponse.json(
      { error: "No se pudo actualizar la mesa" },
      { status: 500 },
    )
  }
}

export async function OPTIONS() {
  return NextResponse.json({
    actions: ["GET", "PATCH"],
  })
}
