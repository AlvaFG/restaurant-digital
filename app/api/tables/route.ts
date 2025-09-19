import { NextResponse } from "next/server"

import {
  getStoreMetadata,
  listTables,
} from "@/lib/server/table-store"

export async function GET() {
  try {
    const [tables, metadata] = await Promise.all([
      listTables(),
      getStoreMetadata(),
    ])

    return NextResponse.json({
      data: tables,
      metadata,
    })
  } catch (error) {
    console.error("[api/tables] Failed to list tables", error)
    return NextResponse.json(
      { error: "No se pudieron obtener las mesas" },
      { status: 500 },
    )
  }
}

export async function HEAD() {
  try {
    const metadata = await getStoreMetadata()
    return new NextResponse(null, {
      headers: {
        "x-table-store-version": String(metadata.version),
        "x-table-store-updated-at": metadata.updatedAt,
      },
    })
  } catch (error) {
    console.error("[api/tables] Failed to read metadata", error)
    return new NextResponse(null, { status: 500 })
  }
}

export async function OPTIONS() {
  return NextResponse.json({
    actions: ["GET", "HEAD"],
    description: "Listado de mesas y metadatos de versionado",
  })
}
