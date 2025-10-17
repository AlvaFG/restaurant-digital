/**
 * Zones Service - Supabase Integration
 * 
 * Servicio completo de zonas usando Supabase como única fuente de datos.
 * Reemplaza completamente a lib/server/zones-store.ts
 */

import { createBrowserClient } from "@/lib/supabase/client"
import type { Database } from "@/lib/supabase/database.types"
import { createLogger } from "@/lib/logger"

const logger = createLogger('zones-service')

type Zone = Database['public']['Tables']['zones']['Row']
type ZoneInsert = Database['public']['Tables']['zones']['Insert']
type ZoneUpdate = Database['public']['Tables']['zones']['Update']

/**
 * Obtiene todas las zonas
 */
export async function getZones(tenantId: string, includeInactive = false) {
  const supabase = createBrowserClient()

  try {
    let query = supabase
      .from('zones')
      .select('*')
      .eq('tenant_id', tenantId)
      .order('sort_order', { ascending: true })

    if (!includeInactive) {
      query = query.eq('active', true)
    }

    const { data, error } = await query

    if (error) throw error

    return { data, error: null }
  } catch (error) {
    logger.error('Error al obtener zonas', error as Error)
    return { data: null, error: error as Error }
  }
}

/**
 * Obtiene una zona por ID
 */
export async function getZoneById(zoneId: string, tenantId: string) {
  const supabase = createBrowserClient()

  try {
    const { data, error } = await supabase
      .from('zones')
      .select(`
        *,
        tables:tables (
          id,
          number,
          status,
          capacity
        )
      `)
      .eq('id', zoneId)
      .eq('tenant_id', tenantId)
      .single()

    if (error) throw error

    return { data, error: null }
  } catch (error) {
    logger.error('Error al obtener zona', error as Error, { zoneId })
    return { data: null, error: error as Error }
  }
}

/**
 * Crea una nueva zona
 */
export async function createZone(
  input: {
    name: string
    description?: string
    sortOrder?: number
  },
  tenantId: string
) {
  const supabase = createBrowserClient()

  try {
    const { data, error } = await supabase
      .from('zones')
      .insert({
        tenant_id: tenantId,
        name: input.name,
        description: input.description || null,
        sort_order: input.sortOrder || 0,
        active: true,
      } as ZoneInsert)
      .select()
      .single()

    if (error) throw error

    logger.info('Zona creada', { zoneId: data?.id, name: input.name })

    return { data, error: null }
  } catch (error) {
    logger.error('Error al crear zona', error as Error)
    return { data: null, error: error as Error }
  }
}

/**
 * Actualiza una zona
 */
export async function updateZone(
  zoneId: string,
  updates: {
    name?: string
    description?: string
    sortOrder?: number
    active?: boolean
  },
  tenantId: string
) {
  const supabase = createBrowserClient()

  try {
    const updateData: ZoneUpdate = {}

    if (updates.name !== undefined) updateData.name = updates.name
    if (updates.description !== undefined) updateData.description = updates.description
    if (updates.sortOrder !== undefined) updateData.sort_order = updates.sortOrder
    if (updates.active !== undefined) updateData.active = updates.active

    const { data, error } = await supabase
      .from('zones')
      .update(updateData)
      .eq('id', zoneId)
      .eq('tenant_id', tenantId)
      .select()
      .single()

    if (error) throw error

    logger.info('Zona actualizada', { zoneId })

    return { data, error: null }
  } catch (error) {
    logger.error('Error al actualizar zona', error as Error, { zoneId })
    return { data: null, error: error as Error }
  }
}

/**
 * Elimina una zona (soft delete)
 */
export async function deleteZone(zoneId: string, tenantId: string) {
  const supabase = createBrowserClient()

  try {
    // Soft delete: marcar como inactiva
    const { data, error } = await supabase
      .from('zones')
      .update({ active: false })
      .eq('id', zoneId)
      .eq('tenant_id', tenantId)
      .select()
      .single()

    if (error) throw error

    logger.info('Zona desactivada', { zoneId })

    return { data, error: null }
  } catch (error) {
    logger.error('Error al desactivar zona', error as Error, { zoneId })
    return { data: null, error: error as Error }
  }
}

/**
 * Elimina una zona permanentemente
 */
export async function hardDeleteZone(zoneId: string, tenantId: string) {
  const supabase = createBrowserClient()

  try {
    // Verificar que no tenga mesas asociadas
    const { data: tables, error: tablesError } = await supabase
      .from('tables')
      .select('id')
      .eq('zone_id', zoneId)
      .eq('tenant_id', tenantId)

    if (tablesError) throw tablesError

    if (tables && tables.length > 0) {
      throw new Error('No se puede eliminar una zona con mesas asociadas')
    }

    const { error } = await supabase
      .from('zones')
      .delete()
      .eq('id', zoneId)
      .eq('tenant_id', tenantId)

    if (error) throw error

    logger.info('Zona eliminada permanentemente', { zoneId })

    return { error: null }
  } catch (error) {
    logger.error('Error al eliminar zona', error as Error, { zoneId })
    return { error: error as Error }
  }
}

/**
 * Obtiene zonas con estadísticas de mesas
 */
export async function getZonesWithStats(tenantId: string) {
  const supabase = createBrowserClient()

  try {
    const { data: zones, error: zonesError } = await supabase
      .from('zones')
      .select(`
        *,
        tables:tables (
          id,
          status
        )
      `)
      .eq('tenant_id', tenantId)
      .eq('active', true)
      .order('sort_order', { ascending: true })

    if (zonesError) throw zonesError

    // Calcular estadísticas
    const zonesWithStats = zones?.map(zone => ({
      ...zone,
      stats: {
        total: zone.tables?.length || 0,
        available: zone.tables?.filter(t => t.status === 'libre').length || 0,
        occupied: zone.tables?.filter(t => t.status === 'ocupada').length || 0,
        reserved: zone.tables?.filter(t => t.status === 'reservada').length || 0,
      },
    }))

    return { data: zonesWithStats, error: null }
  } catch (error) {
    logger.error('Error al obtener zonas con estadísticas', error as Error)
    return { data: null, error: error as Error }
  }
}
