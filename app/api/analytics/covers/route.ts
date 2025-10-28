import { NextResponse } from "next/server"

import { getCurrentUser } from '@/lib/supabase/server'
import { getTables } from '@/lib/services/tables-service'

const ROUTE_TAG = "[api/analytics/covers]"

function getTenantIdFromUser(user: { user_metadata?: { tenant_id?: string } }) {
  return user.user_metadata?.tenant_id || null
}

export async function GET() {
  try {
    // Obtener usuario actual
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json(
        { error: 'No autenticado' },
        { status: 401 }
      )
    }

    // Obtener tenant_id del usuario
    const tenantId = getTenantIdFromUser(user)
    if (!tenantId) {
      return NextResponse.json(
        { error: 'Usuario sin tenant asignado' },
        { status: 403 }
      )
    }

    // Obtener todas las mesas del tenant para calcular analytics básicos
    const { data: tables, error } = await getTables(tenantId)

    if (error) {
      throw error
    }

    // Calcular métricas básicas de cubiertos
    const tablesWithCovers = (tables || []).map(table => {
      const covers = (table.metadata as { covers?: { current?: number } })?.covers?.current ?? 0
      return {
        id: table.id,
        number: table.number,
        covers,
      }
    })

    const totalCovers = tablesWithCovers.reduce((sum, t) => sum + t.covers, 0)
    const activeTables = tablesWithCovers.filter(t => t.covers > 0).length

    const body = {
      data: {
        tables: tablesWithCovers,
        totals: {
          covers: totalCovers,
          activeTables,
          totalTables: tablesWithCovers.length,
        },
      },
      metadata: {
        version: 1,
        updatedAt: new Date().toISOString(),
        generatedAt: new Date().toISOString(),
      },
    }

    return NextResponse.json(body)
  } catch (error) {
    console.error(`${ROUTE_TAG} failed to load analytics`, error)
    return NextResponse.json(
      { error: { message: "No se pudieron obtener las métricas de cubiertos" } },
      { status: 500 },
    )
  }
}