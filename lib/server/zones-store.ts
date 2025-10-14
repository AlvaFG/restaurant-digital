/**
 * Zones Store - Server Side
 *
 * Funciones para gestionar zonas del restaurante en Supabase.
 */

import { createServerClient, createServiceRoleClient } from "@/lib/supabase/server"
import type { Database } from "@/lib/supabase/database.types"
import { createLogger } from "@/lib/logger"
import type { Zone } from "@/lib/mock-data"

const logger = createLogger('zones-store')
function getWritableSupabaseClient() {
  const hasServiceRoleKey = Boolean(process.env.SUPABASE_SERVICE_ROLE_KEY)

  if (hasServiceRoleKey) {
    try {
      return createServiceRoleClient()
    } catch (error) {
      logger.warn('Fallo al crear cliente service role, se usara el cliente autenticado por usuario', {
        error: error instanceof Error ? error.message : String(error)
      })
    }
  }

  return createServerClient()
}


type ZoneRow = Database['public']['Tables']['zones']['Row']
type ZoneInsert = Database['public']['Tables']['zones']['Insert']
type ZoneUpdate = Database['public']['Tables']['zones']['Update']
type ZoneRowWithCount = ZoneRow & { tables?: Array<{ count: number | null }> }

/**
 * Lista todas las zonas del tenant actual.
 */
export async function listZones(tenantId: string): Promise<Zone[]> {
  console.log('[listZones] Iniciando con tenant_id:', tenantId)
  const supabase = createServerClient()

  const { data, error } = await supabase
    .from('zones')
    .select(`
      *,
      tables:tables(count)
    `)
    .eq('tenant_id', tenantId)
    .order('created_at', { ascending: true })

  console.log('[listZones] Respuesta de Supabase:', {
    hasData: !!data,
    dataLength: data?.length || 0,
    hasError: !!error,
    error: error?.message,
  })

  if (error) {
    logger.error('Error al listar zonas', error, { tenantId })
    console.error('[listZones] ❌ Error:', error)
    throw new Error('No se pudieron cargar las zonas')
  }

  const rows = (data ?? []) as ZoneRowWithCount[]
  const zones = rows.map((zone) => ({
    id: zone.id,
    tenant_id: zone.tenant_id,
    name: zone.name,
    active: zone.active ?? true,
    created_at: zone.created_at ?? undefined,
    table_count: zone.tables?.[0]?.count ?? 0,
  }))
  
  console.log('[listZones] ✅ Zonas mapeadas:', zones.length)
  return zones
}

/**
 * Obtiene una zona por ID dentro del tenant indicado.
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
      return null
    }

    logger.error('Error al obtener zona', error, { zoneId, tenantId })
    throw new Error('No se pudo cargar la zona solicitada')
  }

  const zoneData = data as ZoneRowWithCount

  return {
    id: zoneData.id,
    tenant_id: zoneData.tenant_id,
    name: zoneData.name,
    active: zoneData.active ?? true,
    created_at: zoneData.created_at ?? undefined,
    table_count: zoneData.tables?.[0]?.count ?? 0,
  }
}

interface CreateZoneInput {
  name: string
  tenantId: string
  active?: boolean
}

/**
 * Crea una nueva zona para el tenant indicado.
 */
export async function createZone(data: CreateZoneInput): Promise<Zone> {
  const supabaseRead = createServerClient()

  const { data: existing } = await supabaseRead
    .from('zones')
    .select('id')
    .eq('tenant_id', data.tenantId)
    .eq('name', data.name.trim())
    .maybeSingle()

  if (existing) {
    throw new Error(`Ya existe una zona con el nombre "${data.name}"`)
  }

  const supabaseAdmin = getWritableSupabaseClient()

  const insertPayload: ZoneInsert = {
    tenant_id: data.tenantId,
    name: data.name.trim(),
    active: data.active ?? true,
    description: null,
    sort_order: 0,
  }

  const { data: created, error } = await supabaseAdmin
    .from('zones')
    .insert(insertPayload)
    .select(`
      *,
      tables:tables(count)
    `)
    .single<ZoneRowWithCount>()

  if (error || !created) {
    logger.error('Error al crear zona', error, {
      tenantId: data.tenantId,
      name: data.name,
    })
    throw new Error('No se pudo crear la zona')
  }

  const zoneData = created

  logger.info('Zona creada', {
    zoneId: zoneData.id,
    tenantId: zoneData.tenant_id,
  })

  return {
    id: zoneData.id,
    tenant_id: zoneData.tenant_id,
    name: zoneData.name,
    active: zoneData.active ?? true,
    created_at: zoneData.created_at ?? undefined,
    table_count: zoneData.tables?.[0]?.count ?? 0,
  }
}

interface UpdateZoneInput {
  name?: string
  active?: boolean
}

/**
 * Actualiza una zona existente.
 */
export async function updateZone(
  zoneId: string,
  tenantId: string,
  updates: UpdateZoneInput,
): Promise<Zone> {
  const supabaseRead = createServerClient()

  const existing = await getZoneById(zoneId, tenantId)
  if (!existing) {
    throw new Error('Zona no encontrada')
  }

  if (updates.name && updates.name.trim() !== existing.name) {
    const { data: duplicate } = await supabaseRead
      .from('zones')
      .select('id')
      .eq('tenant_id', tenantId)
      .eq('name', updates.name.trim())
      .neq('id', zoneId)
      .maybeSingle()

    if (duplicate) {
      throw new Error(`Ya existe una zona con el nombre "${updates.name}"`)
    }
  }

  const supabaseAdmin = getWritableSupabaseClient()

  const updatePayload: ZoneUpdate = {}
  if (typeof updates.name === 'string') {
    updatePayload.name = updates.name.trim()
  }
  if (typeof updates.active === 'boolean') {
    updatePayload.active = updates.active
  }
  updatePayload.updated_at = new Date().toISOString()

  const { data: updated, error } = await supabaseAdmin
    .from('zones')
    .update(updatePayload)
    .eq('id', zoneId)
    .eq('tenant_id', tenantId)
    .select(`
      *,
      tables:tables(count)
    `)
    .single<ZoneRowWithCount>()

  if (error || !updated) {
    logger.error('Error al actualizar zona', error, { zoneId, tenantId })
    throw new Error('No se pudo actualizar la zona')
  }

  const zoneData = updated

  logger.info('Zona actualizada', {
    zoneId,
    tenantId,
    fields: Object.keys(updates),
  })

  return {
    id: zoneData.id,
    tenant_id: zoneData.tenant_id,
    name: zoneData.name,
    active: zoneData.active ?? existing.active,
    created_at: zoneData.created_at ?? existing.created_at,
    table_count: zoneData.tables?.[0]?.count ?? existing.table_count ?? 0,
  }
}

/**
 * Elimina una zona perteneciente al tenant indicado.
 */
export async function deleteZone(zoneId: string, tenantId: string): Promise<void> {
  const zone = await getZoneById(zoneId, tenantId)
  if (!zone) {
    throw new Error('Zona no encontrada')
  }

  if (zone.table_count && zone.table_count > 0) {
    throw new Error(
      `No se puede eliminar la zona ${zone.name} porque tiene ${zone.table_count} mesa(s) asignada(s). ` +
        'Reasigna o elimina esas mesas antes de continuar.',
    )
  }

  const supabaseAdmin = getWritableSupabaseClient()

  const { error } = await supabaseAdmin
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


