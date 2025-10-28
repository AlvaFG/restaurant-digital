import { NextResponse } from "next/server"
import { createLogger } from "@/lib/logger"

import { getTables as getTablesService } from "@/lib/services/tables-service"
import { getCurrentUser } from '@/lib/supabase/server'
import type { User } from "@supabase/supabase-js"

const logger = createLogger('api-table-layout')

/**
 * Extract tenantId from Supabase Auth User
 */
function getTenantIdFromUser(user: User): string | null {
  return user.user_metadata?.tenant_id || null
}

interface PersistLayoutRequest {
  layout: unknown // TableMapLayout
  tables: unknown[] // Table[]
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

    const { data: tables, error } = await getTablesService(tenantId)

    if (error) {
      throw new Error('Error obteniendo mesas')
    }

    logger.info('Table layout obtenido exitosamente', {
      tablesCount: tables?.length || 0,
      tenantId
    })

    // TODO: Implementar tabla de layouts en Supabase
    return NextResponse.json({
      layout: null, // Por ahora sin layout
      tables: tables || [],
      metadata: {
        version: 1,
        updatedAt: new Date().toISOString(),
      },
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

    const body = (await request.json()) as Partial<PersistLayoutRequest>

    if (!body?.layout || !body?.tables) {
      logger.warn('PUT /api/table-layout - Datos incompletos', {
        hasLayout: !!body?.layout,
        hasTables: !!body?.tables,
        tenantId
      })
      return NextResponse.json(
        { error: "Se requiere 'layout' y 'tables'" },
        { status: 400 },
      )
    }

    // TODO: Implementar actualización de layout en Supabase
    logger.info('Table layout - actualización pendiente de implementar', {
      tablesCount: Array.isArray(body.tables) ? body.tables.length : 0,
      tenantId
    })

    return NextResponse.json({ ok: true, message: 'Layout update pending implementation' })
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

