import { NextResponse } from "next/server"

import type { MenuMetadata } from "@/lib/mock-data"

export function buildMenuHeaders(metadata: MenuMetadata) {
  return {
    "x-menu-version": String(metadata.version),
    "x-menu-updated-at": metadata.updatedAt,
  }
}

export function menuJsonResponse<T>(data: T, metadata: MenuMetadata) {
  return NextResponse.json(
    { data },
    {
      headers: buildMenuHeaders(metadata),
    },
  )
}

export function handleMenuError(context: string, error: unknown, message: string) {
  console.error("[api/menu/" + context + "]", error)
  return NextResponse.json({ error: message }, { status: 500 })
}
