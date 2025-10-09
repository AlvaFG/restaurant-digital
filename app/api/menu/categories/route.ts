import { NextResponse } from "next/server"

import { getMenuCatalog } from "@/lib/server/menu-store"

import { buildMenuHeaders, handleMenuError } from "../utils"

export async function GET() {
  try {
    const catalog = await getMenuCatalog()

    return NextResponse.json(
      { data: catalog.categories },
      {
        headers: buildMenuHeaders(catalog.metadata),
      },
    )
  } catch (error) {
    return handleMenuError("categories", error, "No se pudieron obtener las categorías")
  }
}

export async function OPTIONS() {
  return NextResponse.json({ actions: ["GET"] })
}
