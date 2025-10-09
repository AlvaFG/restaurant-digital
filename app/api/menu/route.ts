import { NextResponse } from "next/server"

import { getMenuCatalog } from "@/lib/server/menu-store"

import { buildMenuHeaders, handleMenuError, menuJsonResponse } from "./utils"

export async function GET() {
  try {
    const catalog = await getMenuCatalog()
    return menuJsonResponse(
      {
        categories: catalog.categories,
        items: catalog.items,
        allergens: catalog.allergens,
        metadata: catalog.metadata,
      },
      catalog.metadata,
    )
  } catch (error) {
    return handleMenuError("get", error, "No se pudo obtener el catálogo de menú")
  }
}

export async function HEAD() {
  try {
    const catalog = await getMenuCatalog()
    return new NextResponse(null, {
      headers: buildMenuHeaders(catalog.metadata),
    })
  } catch (error) {
    console.error("[api/menu/head]", error)
    return new NextResponse(null, { status: 500 })
  }
}

export async function OPTIONS() {
  return NextResponse.json({ actions: ["GET", "HEAD"] })
}
