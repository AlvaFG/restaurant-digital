/**
 * Tables Service - Supabase Integration
 * 
 * Servicio completo de mesas usando Supabase como única fuente de datos.
 * Reemplaza completamente a lib/server/table-store.ts
 */

import { createBrowserClient } from "@/lib/supabase/client"
import type { Database } from "@/lib/supabase/database.types"
import { createLogger } from "@/lib/logger"

const logger = createLogger('tables-service')

type Table = Database['public']['Tables']['tables']['Row']
type TableInsert = Database['public']['Tables']['tables']['Insert']
type TableUpdate = Database['public']['Tables']['tables']['Update']

/**
 * Obtiene todas las mesas
 */
export async function getTables(tenantId: string, filters?: {
  zoneId?: string
  status?: string
}) {
  const supabase = createBrowserClient()

  try {
    let query = supabase
      .from('tables')
      .select(`
        *,
        zone:zones (
          id,
          name,
          description
        )
      `)
      .eq('tenant_id', tenantId)
      .order('number', { ascending: true })

    if (filters?.zoneId) {
      query = query.eq('zone_id', filters.zoneId)
    }

    if (filters?.status) {
      query = query.eq('status', filters.status)
    }

    const { data, error } = await query

    if (error) throw error

    return { data, error: null }
  } catch (error) {
    logger.error('Error al obtener mesas', error as Error)
    return { data: null, error: error as Error }
  }
}

/**
 * Obtiene una mesa por ID
 */
export async function getTableById(tableId: string, tenantId: string) {
  const supabase = createBrowserClient()

  try {
    const { data, error } = await supabase
      .from('tables')
      .select(`
        *,
        zone:zones (
          id,
          name,
          description
        )
      `)
      .eq('id', tableId)
      .eq('tenant_id', tenantId)
      .single()

    if (error) throw error

    return { data, error: null }
  } catch (error) {
    logger.error('Error al obtener mesa', error as Error, { tableId })
    return { data: null, error: error as Error }
  }
}

/**
 * Crea una nueva mesa
 */
export async function createTable(
  input: {
    number: string
    capacity?: number
    zoneId?: string
    status?: string
    position?: { x: number; y: number }
    metadata?: Record<string, unknown>
  },
  tenantId: string
) {
  const supabase = createBrowserClient()

  try {
    const { data, error } = await supabase
      .from('tables')
      .insert({
        tenant_id: tenantId,
        number: input.number,
        capacity: input.capacity || 4,
        zone_id: input.zoneId || null,
        status: input.status || 'libre',
        position: input.position || null,
        metadata: input.metadata || null,
      } as TableInsert)
      .select()
      .single()

    if (error) throw error

    logger.info('Mesa creada', { tableId: data?.id, number: input.number })

    return { data, error: null }
  } catch (error) {
    logger.error('Error al crear mesa', error as Error)
    return { data: null, error: error as Error }
  }
}

/**
 * Actualiza una mesa
 */
export async function updateTable(
  tableId: string,
  updates: {
    number?: string
    capacity?: number
    zoneId?: string
    status?: string
    position?: { x: number; y: number }
    qrcodeUrl?: string
    qrToken?: string
    qrExpiresAt?: string
    metadata?: Record<string, unknown>
  },
  tenantId: string
) {
  const supabase = createBrowserClient()

  try {
    const updateData: TableUpdate = {}

    if (updates.number !== undefined) updateData.number = updates.number
    if (updates.capacity !== undefined) updateData.capacity = updates.capacity
    if (updates.zoneId !== undefined) updateData.zone_id = updates.zoneId
    if (updates.status !== undefined) updateData.status = updates.status
    if (updates.position !== undefined) updateData.position = updates.position as any
    if (updates.qrcodeUrl !== undefined) updateData.qrcode_url = updates.qrcodeUrl
    if (updates.qrToken !== undefined) updateData.qr_token = updates.qrToken
    if (updates.qrExpiresAt !== undefined) updateData.qr_expires_at = updates.qrExpiresAt
    if (updates.metadata !== undefined) updateData.metadata = updates.metadata as any

    const { data, error } = await supabase
      .from('tables')
      .update(updateData)
      .eq('id', tableId)
      .eq('tenant_id', tenantId)
      .select()
      .single()

    if (error) throw error

    logger.info('Mesa actualizada', { tableId })

    return { data, error: null }
  } catch (error) {
    logger.error('Error al actualizar mesa', error as Error, { tableId })
    return { data: null, error: error as Error }
  }
}

/**
 * Actualiza el estado de una mesa
 */
export async function updateTableStatus(
  tableId: string,
  status: string,
  tenantId: string
) {
  const supabase = createBrowserClient()

  try {
    const { data, error } = await supabase
      .from('tables')
      .update({ status })
      .eq('id', tableId)
      .eq('tenant_id', tenantId)
      .select()
      .single()

    if (error) throw error

    logger.info('Estado de mesa actualizado', { tableId, status })

    return { data, error: null }
  } catch (error) {
    logger.error('Error al actualizar estado de mesa', error as Error, { tableId })
    return { data: null, error: error as Error }
  }
}

/**
 * Elimina una mesa
 */
export async function deleteTable(tableId: string, tenantId: string) {
  const supabase = createBrowserClient()

  try {
    const { error } = await supabase
      .from('tables')
      .delete()
      .eq('id', tableId)
      .eq('tenant_id', tenantId)

    if (error) throw error

    logger.info('Mesa eliminada', { tableId })

    return { error: null }
  } catch (error) {
    logger.error('Error al eliminar mesa', error as Error, { tableId })
    return { error: error as Error }
  }
}

/**
 * Obtiene mesas por zona
 */
export async function getTablesByZone(zoneId: string, tenantId: string) {
  const supabase = createBrowserClient()

  try {
    const { data, error } = await supabase
      .from('tables')
      .select('*')
      .eq('tenant_id', tenantId)
      .eq('zone_id', zoneId)
      .order('number', { ascending: true })

    if (error) throw error

    return { data, error: null }
  } catch (error) {
    logger.error('Error al obtener mesas por zona', error as Error, { zoneId })
    return { data: null, error: error as Error }
  }
}

/**
 * Obtiene estadísticas de mesas
 */
export async function getTablesStats(tenantId: string) {
  const supabase = createBrowserClient()

  try {
    const { data, error } = await supabase
      .from('tables')
      .select('status')
      .eq('tenant_id', tenantId)

    if (error) throw error

    const stats = {
      total: data?.length || 0,
      byStatus: {} as Record<string, number>,
    }

    data?.forEach(table => {
      stats.byStatus[table.status] = (stats.byStatus[table.status] || 0) + 1
    })

    return { data: stats, error: null }
  } catch (error) {
    logger.error('Error al obtener estadísticas de mesas', error as Error)
    return { data: null, error: error as Error }
  }
}
