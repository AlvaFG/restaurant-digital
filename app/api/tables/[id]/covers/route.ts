import { NextResponse } from "next/server"

import type { Table } from "@/lib/mock-data"
import {
  MAX_COVERS,
  getStoreMetadata,
  getTableById,
  setTableCurrentCovers,
} from "@/lib/server/table-store"

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
  const tableId = context.params.id

  let payload: unknown
  try {
    payload = await request.json()
  } catch {
    return NextResponse.json(
      { error: { message: "El cuerpo de la solicitud no es un JSON válido" } },
      { status: 400 },
    )
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
    return NextResponse.json(
      { error: { message: `El campo 'current' debe ser un entero entre 0 y ${MAX_COVERS}` } },
      { status: 400 },
    )
  }

  try {
    const table = await setTableCurrentCovers(tableId, currentRaw)
    const storeMetadata = await getStoreMetadata()

    const body = {
      data: serializeTable(table),
      metadata: buildMetadata(storeMetadata),
    }

    return NextResponse.json(body, {
      headers: {
        "x-table-store-version": String(storeMetadata.version),
        "x-table-store-updated-at": storeMetadata.updatedAt,
      },
    })
  } catch (error) {
    if (error instanceof Error && error.message === "Table not found") {
      return NextResponse.json({ error: { message: "Mesa no encontrada" } }, { status: 404 })
    }

    console.error(`[api/tables/${tableId}/covers] failed to update covers`, error)
    return NextResponse.json(
      { error: { message: "No se pudieron actualizar los cubiertos" } },
      { status: 500 },
    )
  }
}

export async function GET(_request: Request, context: { params: { id: string } }) {
  const tableId = context.params.id

  try {
    const [table, storeMetadata] = await Promise.all([
      getTableById(tableId),
      getStoreMetadata(),
    ])

    if (!table) {
      return NextResponse.json({ error: { message: "Mesa no encontrada" } }, { status: 404 })
    }

    const body = {
      data: serializeTable(table),
      metadata: buildMetadata(storeMetadata),
    }

    return NextResponse.json(body, {
      headers: {
        "x-table-store-version": String(storeMetadata.version),
        "x-table-store-updated-at": storeMetadata.updatedAt,
      },
    })
  } catch (error) {
    console.error(`[api/tables/${tableId}/covers] failed to retrieve covers`, error)
    return NextResponse.json(
      { error: { message: "No se pudieron obtener los cubiertos de la mesa" } },
      { status: 500 },
    )
  }
}