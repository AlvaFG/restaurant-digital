/**
 * Zones Store - Server Side
 * 
 * Funciones para gestionar zonas/áreas del restaurante en Supabase
 */

import { createServerClient } from "@/lib/supabase/server"
import { createLogger } from "@/lib/logger"
import type { Zone } from "@/lib/mock-data"

const logger = createLogger('zones-store')

/**
 * Lista todas las zonas de un tenant
 */
export async function listZones(tenantId: string): Promise<Zone[]> {
  const supabase = createServerClient()

  const { data, error } = await supabase
    .from('zones')
    .select(`
      *,
      tables:tables(count)
    `)
    .eq('tenant_id', tenantId)
    .order('sort_order', { ascending: true })

  if (error) {
    logger.error('Error al listar zonas', error, { tenantId })
    throw new Error('No se pudieron cargar las zonas')
  }

  // Transformar al formato Zone con table_count
  const zones: Zone[] = (data as any[]).map((zone: any) => ({
    id: zone.id,
    tenant_id: zone.tenant_id,
    name: zone.name,
    description: zone.description,
    sort_order: zone.sort_order,
    active: zone.active,
    created_at: zone.created_at,
    updated_at: zone.updated_at,
    table_count: zone.tables?.[0]?.count || 0,
  }))

  logger.info('Zonas listadas', { tenantId, count: zones.length })
  return zones
}

/**
 * Obtiene una zona por ID
 */
export async function getZoneById(zoneId: string, tenantId: string): Promise<Zone | null> {
  const supabase = createServerClient()

  const { data, error } = await supabase
    .from('zones')
    .select(`
      *,
      tables:tables(count)
    `)
    .eq('id', zoneId)
    .eq('tenant_id', tenantId)
    .single()

  if (error) {
    if (error.code === 'PGRST116') {
      return null // Not found
    }
    logger.error('Error al obtener zona', error, { zoneId, tenantId })
    throw new Error('No se pudo cargar la zona')
  }

  const zoneData = data as any

  const zone: Zone = {
    id: zoneData.id,
    tenant_id: zoneData.tenant_id,
    name: zoneData.name,
    description: zoneData.description,
    sort_order: zoneData.sort_order,
    active: zoneData.active,
    created_at: zoneData.created_at,
    updated_at: zoneData.updated_at,
    table_count: zoneData.tables?.[0]?.count || 0,
  }

  return zone
}

/**
 * Crea una nueva zona
 */
export async function createZone(data: {
  name: string
  description?: string
  sort_order?: number
  active?: boolean
  tenantId: string
}): Promise<Zone> {
  const supabase = createServerClient()

  // Verificar que el nombre no exista para este tenant
  const { data: existing } = await supabase
    .from('zones')
    .select('id')
    .eq('tenant_id', data.tenantId)
    .eq('name', data.name)
    .single()

  if (existing) {
    throw new Error(`Ya existe una zona con el nombre "${data.name}"`)
  }

  // Crear la zona
  const { data: newZone, error } = await supabase
    .from('zones')
    .insert({
      tenant_id: data.tenantId,
      name: data.name,
      description: data.description || null,
      sort_order: data.sort_order ?? 0,
      active: data.active ?? true,
    } as any)
    .select()
    .single()

  if (error || !newZone) {
    logger.error('Error al crear zona', error, {
      tenantId: data.tenantId,
      name: data.name,
    })
    throw new Error('No se pudo crear la zona')
  }

  const zoneData = newZone as any

  logger.info('Zona creada', {
    zoneId: zoneData.id,
    name: zoneData.name,
    tenantId: data.tenantId,
  })

  return {
    id: zoneData.id,
    tenant_id: zoneData.tenant_id,
    name: zoneData.name,
    description: zoneData.description,
    sort_order: zoneData.sort_order,
    active: zoneData.active,
    created_at: zoneData.created_at,
    updated_at: zoneData.updated_at,
    table_count: 0,
  }
}

/**
 * Actualiza una zona existente
 */
export async function updateZone(
  zoneId: string,
  tenantId: string,
  updates: Partial<Pick<Zone, 'name' | 'description' | 'sort_order' | 'active'>>
): Promise<Zone> {
  const supabase = createServerClient()

  // Verificar que la zona existe y pertenece al tenant
  const existing = await getZoneById(zoneId, tenantId)
  if (!existing) {
    throw new Error('Zona no encontrada')
  }

  // Si se está actualizando el nombre, verificar unicidad
  if (updates.name && updates.name !== existing.name) {
    const { data: duplicate } = await supabase
      .from('zones')
      .select('id')
      .eq('tenant_id', tenantId)
      .eq('name', updates.name)
      .neq('id', zoneId)
      .single()

    if (duplicate) {
      throw new Error(`Ya existe una zona con el nombre "${updates.name}"`)
    }
  }

  // Actualizar la zona
  const updatePayload: Record<string, any> = {}
  if (updates.name !== undefined) updatePayload.name = updates.name
  if (updates.description !== undefined) updatePayload.description = updates.description
  if (updates.sort_order !== undefined) updatePayload.sort_order = updates.sort_order
  if (updates.active !== undefined) updatePayload.active = updates.active
  updatePayload.updated_at = new Date().toISOString()

  const { data: updated, error } = await (supabase
    .from('zones')
    .update(updatePayload) as any)
    .eq('id', zoneId)
    .eq('tenant_id', tenantId)
    .select()
    .single()

  if (error || !updated) {
    logger.error('Error al actualizar zona', error, { zoneId, tenantId })
    throw new Error('No se pudo actualizar la zona')
  }

  const zoneData = updated as any

  logger.info('Zona actualizada', {
    zoneId,
    tenantId,
    updates: Object.keys(updates),
  })

  return {
    id: zoneData.id,
    tenant_id: zoneData.tenant_id,
    name: zoneData.name,
    description: zoneData.description,
    sort_order: zoneData.sort_order,
    active: zoneData.active,
    created_at: zoneData.created_at,
    updated_at: zoneData.updated_at,
    table_count: existing.table_count,
  }
}

/**
 * Elimina una zona
 */
export async function deleteZone(zoneId: string, tenantId: string): Promise<void> {
  const supabase = createServerClient()

  // Verificar que la zona existe y pertenece al tenant
  const zone = await getZoneById(zoneId, tenantId)
  if (!zone) {
    throw new Error('Zona no encontrada')
  }

  // Verificar que no tenga mesas asignadas
  if (zone.table_count && zone.table_count > 0) {
    throw new Error(
      `No se puede eliminar la zona "${zone.name}" porque tiene ${zone.table_count} mesa(s) asignada(s). ` +
      'Por favor, reasigna o elimina las mesas primero.'
    )
  }

  // Eliminar la zona
  const { error } = await supabase
    .from('zones')
    .delete()
    .eq('id', zoneId)
    .eq('tenant_id', tenantId)

  if (error) {
    logger.error('Error al eliminar zona', error, { zoneId, tenantId })
    throw new Error('No se pudo eliminar la zona')
  }

  logger.info('Zona eliminada', {
    zoneId,
    name: zone.name,
    tenantId,
  })
}
