import { NextResponse } from "next/server"

import { getCoverAnalytics } from "@/lib/server/table-store"

const ROUTE_TAG = "[api/analytics/covers]"

export async function GET() {
  try {
    const analytics = await getCoverAnalytics()

    const body = {
      data: {
        tables: analytics.tables,
        totals: analytics.totals,
      },
      metadata: analytics.metadata,
    }

    return NextResponse.json(body, {
      headers: {
        "x-table-store-version": String(analytics.metadata.version),
        "x-table-store-updated-at": analytics.metadata.updatedAt,
        "x-analytics-generated-at": analytics.metadata.generatedAt,
      },
    })
  } catch (error) {
    console.error(`${ROUTE_TAG} failed to load analytics`, error)
    return NextResponse.json(
      { error: { message: "No se pudieron obtener las métricas de cubiertos" } },
      { status: 500 },
    )
  }
}