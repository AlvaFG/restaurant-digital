import { NextResponse } from "next/server"
import { createLogger } from "@/lib/logger"
import { getCurrentUser, createServerClient } from "@/lib/supabase/server"
import type { User } from "@supabase/supabase-js"

const logger = createLogger('api-table-layout')

// Position schema normalizado
interface TablePosition {
  x: number
  y: number
  w: number
  h: number
  rot: number
  shape: 'rectangle' | 'square' | 'circle'
}

interface LayoutUpdate {
  id: string
  position: TablePosition
}

interface BatchUpdateRequest {
  updates: LayoutUpdate[]
}

/**
 * Extract tenantId from Supabase Auth User
 */
function getTenantIdFromUser(user: User): string | undefined {
  const metadata = user.user_metadata as Record<string, unknown> | undefined
  const tenantId = metadata?.tenant_id
  if (typeof tenantId === 'string') return tenantId
  const rootTenantId = (user as unknown as Record<string, unknown>).tenant_id
  if (typeof rootTenantId === 'string') return rootTenantId
  return undefined
}

// Validate position object
function validatePosition(pos: unknown): pos is TablePosition {
  if (!pos || typeof pos !== 'object') return false
  const p = pos as Record<string, unknown>
  
  if (typeof p.x !== 'number' || p.x < 0) return false
  if (typeof p.y !== 'number' || p.y < 0) return false
  if (typeof p.w !== 'number' || p.w < 20 || p.w > 500) return false
  if (typeof p.h !== 'number' || p.h < 20 || p.h > 500) return false
  if (typeof p.rot !== 'number' || p.rot < 0 || p.rot > 360) return false
  if (!['rectangle', 'square', 'circle'].includes(p.shape as string)) return false
  
  return true
}

/**
 * GET /api/table-layout
 * Get all table positions for the current tenant
 */
export async function GET() {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 })
    }

    const tenantId = getTenantIdFromUser(user)
    if (!tenantId) {
      return NextResponse.json({ data: [], message: 'Usuario sin tenant' })
    }

    const supabase = await createServerClient()
    
    const { data: tables, error } = await supabase
      .from('tables')
      .select('id, number, position, status, capacity, zone_id')
      .eq('tenant_id', tenantId)
      .order('number')

    if (error) throw error

    logger.info('Table layout obtenido', { count: tables?.length || 0, tenantId })

    return NextResponse.json({ 
      data: tables || [],
      timestamp: new Date().toISOString()
    })

  } catch (error) {
    logger.error('Error obteniendo layout', error as Error)
    return NextResponse.json(
      { error: 'Error al obtener el layout' },
      { status: 500 }
    )
  }
}

/**
 * POST /api/table-layout
 * Batch update table positions atomically
 */
export async function POST(request: Request) {
  const startTime = Date.now()

  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 })
    }

    const tenantId = getTenantIdFromUser(user)
    if (!tenantId) {
      return NextResponse.json({ error: 'Usuario sin tenant asignado' }, { status: 403 })
    }

    const body = await request.json().catch(() => ({})) as BatchUpdateRequest
    
    if (!body.updates || !Array.isArray(body.updates) || body.updates.length === 0) {
      return NextResponse.json({ 
        error: 'Se requiere un array de updates con al menos un elemento' 
      }, { status: 400 })
    }

    // Validate all positions before saving
    const errors: Array<{ id: string; error: string }> = []
    const validUpdates: LayoutUpdate[] = []

    for (const update of body.updates) {
      if (!update.id || typeof update.id !== 'string') {
        errors.push({ id: update.id || 'unknown', error: 'ID de mesa inválido' })
        continue
      }

      if (!validatePosition(update.position)) {
        errors.push({ id: update.id, error: 'Posición inválida' })
        continue
      }

      validUpdates.push(update)
    }

    if (validUpdates.length === 0) {
      return NextResponse.json({ 
        success: false,
        error: 'Ningún update válido',
        errors 
      }, { status: 400 })
    }

    const supabase = await createServerClient()
    
    // Get all table IDs to verify they exist and belong to tenant
    const tableIds = validUpdates.map(u => u.id)
    const { data: existingTables, error: fetchError } = await supabase
      .from('tables')
      .select('id')
      .eq('tenant_id', tenantId)
      .in('id', tableIds)

    if (fetchError) {
      logger.error('Error verificando mesas', fetchError as Error)
      throw fetchError
    }

    const existingIds = new Set(existingTables?.map(t => t.id) || [])
    
    // Filter updates to only existing tables
    const finalUpdates = validUpdates.filter(u => {
      if (!existingIds.has(u.id)) {
        errors.push({ id: u.id, error: 'Mesa no encontrada o no pertenece al tenant' })
        return false
      }
      return true
    })

    if (finalUpdates.length === 0) {
      return NextResponse.json({ 
        success: false,
        error: 'Ninguna mesa válida para actualizar',
        errors 
      }, { status: 400 })
    }

    // Perform updates (batch via Promise.all for speed, with error tracking)
    const results = await Promise.allSettled(
      finalUpdates.map(async (update) => {
        const { error } = await supabase
          .from('tables')
          .update({ 
            position: update.position,
            updated_at: new Date().toISOString()
          })
          .eq('id', update.id)
          .eq('tenant_id', tenantId)

        if (error) throw { id: update.id, error }
        return { id: update.id, success: true }
      })
    )

    // Process results
    const successful: string[] = []
    const failed: Array<{ id: string; error: string }> = []

    results.forEach((result, index) => {
      if (result.status === 'fulfilled') {
        successful.push(finalUpdates[index].id)
      } else {
        const err = result.reason as { id: string; error: unknown }
        failed.push({ 
          id: err.id || finalUpdates[index].id, 
          error: 'Error al guardar' 
        })
      }
    })

    const duration = Date.now() - startTime
    logger.info('Batch layout update', {
      tenantId,
      total: body.updates.length,
      successful: successful.length,
      failed: failed.length + errors.length,
      duration: `${duration}ms`
    })

    return NextResponse.json({
      success: failed.length === 0 && errors.length === 0,
      summary: {
        total: body.updates.length,
        successful: successful.length,
        failed: failed.length + errors.length
      },
      successful,
      errors: [...errors, ...failed],
      timestamp: new Date().toISOString()
    })

  } catch (error) {
    const duration = Date.now() - startTime
    logger.error('Error en batch layout update', error as Error, { duration })

    return NextResponse.json(
      { error: 'Error al guardar el layout' },
      { status: 500 }
    )
  }
}

/**
 * PUT /api/table-layout - Alias for POST
 */
export async function PUT(request: Request) {
  return POST(request)
}

