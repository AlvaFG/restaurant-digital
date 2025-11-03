/**
 * Audit Service - Table Status Audit System
 * 
 * Servicio para registrar, consultar y analizar cambios de estado de mesas.
 * Proporciona trazabilidad completa y métricas de uso.
 */

import { createBrowserClient } from "@/lib/supabase/client"
import { createLogger } from "@/lib/logger"
import { handleServiceError, type ServiceResult } from '@/lib/error-handler'

const logger = createLogger('audit-service')

// =============================================
// Types
// =============================================

export interface TableStatusAuditRecord {
  id: string
  tenant_id: string
  table_id: string
  table_number: string
  previous_status: string
  new_status: string
  changed_by?: string
  changed_at: string
  reason?: string
  order_id?: string
  session_id?: string
  duration_seconds?: number
  metadata?: Record<string, unknown>
  created_at: string
  updated_at: string
}

export interface AuditRecordInput {
  tenantId: string
  tableId: string
  tableNumber: string
  previousStatus: string
  newStatus: string
  changedBy?: string
  reason?: string
  orderId?: string
  sessionId?: string
  metadata?: Record<string, unknown>
}

export interface TableStatusStatistics {
  table_id: string
  table_number: string
  total_changes: number
  days_with_changes: number
  avg_duration_seconds: number
  last_change_at: string
  status_distribution: Record<string, number>
  peak_hours: Record<number, number>
}

export interface AuditFilters {
  tableId?: string
  tableNumber?: string
  status?: string
  changedBy?: string
  orderId?: string
  startDate?: string
  endDate?: string
  limit?: number
  offset?: number
}

// =============================================
// Main Functions
// =============================================

/**
 * Registra un cambio de estado de mesa en la auditoría
 * Usa la función RPC log_table_status_change para cálculo automático de duración
 */
export async function logTableStatusChange(input: AuditRecordInput) {
  const supabase = createBrowserClient()

  try {
    logger.info('Registrando cambio de estado en auditoría', {
      tableId: input.tableId,
      previousStatus: input.previousStatus,
      newStatus: input.newStatus
    })

    const { data, error } = await supabase.rpc('log_table_status_change', {
      p_tenant_id: input.tenantId,
      p_table_id: input.tableId,
      p_table_number: input.tableNumber,
      p_previous_status: input.previousStatus,
      p_new_status: input.newStatus,
      p_changed_by: input.changedBy || null,
      p_reason: input.reason || null,
      p_order_id: input.orderId || null,
      p_metadata: input.metadata || {}
    })

    if (error) throw error

    logger.info('Cambio registrado en auditoría', { auditId: data })

    return { data, error: null }
  } catch (error) {
    return handleServiceError('logTableStatusChange', error, { tableId: input.tableId })
  }
}

/**
 * Obtiene el historial de cambios de una mesa específica
 */
export async function getTableAuditHistory(
  tableId: string,
  tenantId: string,
  options?: {
    limit?: number
    startDate?: string
    endDate?: string
  }
) {
  const supabase = createBrowserClient()

  try {
    let query = supabase
      .from('table_status_audit')
      .select(`
        *,
        changed_by_user:users!changed_by (
          id,
          email,
          full_name
        ),
        order:orders (
          id,
          order_number,
          status
        )
      `)
      .eq('table_id', tableId)
      .eq('tenant_id', tenantId)
      .order('changed_at', { ascending: false })

    if (options?.startDate) {
      query = query.gte('changed_at', options.startDate)
    }

    if (options?.endDate) {
      query = query.lte('changed_at', options.endDate)
    }

    if (options?.limit) {
      query = query.limit(options.limit)
    }

    const { data, error } = await query

    if (error) throw error

    logger.info('Historial de auditoría obtenido', {
      tableId,
      recordCount: data?.length || 0
    })

    return { data, error: null }
  } catch (error) {
    return handleServiceError('getTableAuditHistory', error, { tableId, tenantId })
  }
}

/**
 * Obtiene todos los cambios de estado con filtros
 */
export async function getAuditRecords(
  tenantId: string,
  filters?: AuditFilters
) {
  const supabase = createBrowserClient()

  try {
    let query = supabase
      .from('table_status_audit')
      .select(`
        *,
        table:tables (
          id,
          number,
          zone_id
        ),
        changed_by_user:users!changed_by (
          id,
          email,
          full_name
        ),
        order:orders (
          id,
          order_number,
          status
        )
      `)
      .eq('tenant_id', tenantId)
      .order('changed_at', { ascending: false })

    if (filters?.tableId) {
      query = query.eq('table_id', filters.tableId)
    }

    if (filters?.status) {
      query = query.or(`previous_status.eq.${filters.status},new_status.eq.${filters.status}`)
    }

    if (filters?.changedBy) {
      query = query.eq('changed_by', filters.changedBy)
    }

    if (filters?.orderId) {
      query = query.eq('order_id', filters.orderId)
    }

    if (filters?.startDate) {
      query = query.gte('changed_at', filters.startDate)
    }

    if (filters?.endDate) {
      query = query.lte('changed_at', filters.endDate)
    }

    if (filters?.limit) {
      query = query.limit(filters.limit)
    }

    if (filters?.offset) {
      query = query.range(filters.offset, filters.offset + (filters.limit || 10) - 1)
    }

    const { data, error } = await query

    if (error) throw error

    return { data, error: null }
  } catch (error) {
    return handleServiceError('getAuditRecords', error, { tenantId, filters })
  }
}

/**
 * Obtiene cambios recientes (últimas 24 horas)
 */
export async function getRecentChanges(tenantId: string, hours: number = 24) {
  const supabase = createBrowserClient()

  try {
    const since = new Date()
    since.setHours(since.getHours() - hours)

    const { data, error } = await supabase
      .from('recent_table_status_changes')
      .select('*')
      .eq('tenant_id', tenantId)
      .order('changed_at', { ascending: false })

    if (error) throw error

    return { data, error: null }
  } catch (error) {
    return handleServiceError('getRecentChanges', error, { tenantId, hours })
  }
}

/**
 * Obtiene estadísticas de uso por mesa
 */
export async function getTableStatistics(
  tableId: string,
  tenantId: string,
  options?: {
    startDate?: string
    endDate?: string
  }
): Promise<{ data: TableStatusStatistics | null; error: Error | null }> {
  const supabase = createBrowserClient()

  try {
    // Obtener datos de auditoría
    const { data: auditData, error: auditError } = await getTableAuditHistory(
      tableId,
      tenantId,
      options
    )

    if (auditError) throw auditError
    if (!auditData || auditData.length === 0) {
      return {
        data: null,
        error: new Error('No hay datos de auditoría para esta mesa')
      }
    }

    // Calcular estadísticas
    const statusDistribution: Record<string, number> = {}
    const peakHours: Record<number, number> = {}
    let totalDuration = 0
    let countDuration = 0

    const uniqueDays = new Set<string>()

    auditData.forEach((record: any) => {
      // Distribución de estados
      statusDistribution[record.new_status] = 
        (statusDistribution[record.new_status] || 0) + 1

      // Horas pico
      const hour = new Date(record.changed_at).getHours()
      peakHours[hour] = (peakHours[hour] || 0) + 1

      // Duración promedio
      if (record.duration_seconds) {
        totalDuration += record.duration_seconds
        countDuration++
      }

      // Días con cambios
      const day = new Date(record.changed_at).toISOString().split('T')[0]
      uniqueDays.add(day)
    })

    const statistics: TableStatusStatistics = {
      table_id: tableId,
      table_number: auditData[0].table_number,
      total_changes: auditData.length,
      days_with_changes: uniqueDays.size,
      avg_duration_seconds: countDuration > 0 ? Math.round(totalDuration / countDuration) : 0,
      last_change_at: auditData[0].changed_at,
      status_distribution: statusDistribution,
      peak_hours: peakHours
    }

    return { data: statistics, error: null }
  } catch (error) {
    return handleServiceError('getTableStatistics', error, { tableId, tenantId })
  }
}

/**
 * Obtiene resumen de cambios por tenant
 */
export async function getTenantAuditSummary(
  tenantId: string,
  options?: {
    startDate?: string
    endDate?: string
  }
) {
  const supabase = createBrowserClient()

  try {
    let query = supabase
      .from('table_status_audit')
      .select('previous_status, new_status, changed_at, duration_seconds')
      .eq('tenant_id', tenantId)

    if (options?.startDate) {
      query = query.gte('changed_at', options.startDate)
    }

    if (options?.endDate) {
      query = query.lte('changed_at', options.endDate)
    }

    const { data, error } = await query

    if (error) throw error

    // Calcular resumen
    const summary = {
      total_changes: data?.length || 0,
      status_transitions: {} as Record<string, number>,
      avg_duration_seconds: 0,
      changes_by_day: {} as Record<string, number>
    }

    let totalDuration = 0
    let countDuration = 0

    data?.forEach((record: any) => {
      // Transiciones
      const transition = `${record.previous_status} → ${record.new_status}`
      summary.status_transitions[transition] = 
        (summary.status_transitions[transition] || 0) + 1

      // Duración
      if (record.duration_seconds) {
        totalDuration += record.duration_seconds
        countDuration++
      }

      // Por día
      const day = new Date(record.changed_at).toISOString().split('T')[0]
      summary.changes_by_day[day] = (summary.changes_by_day[day] || 0) + 1
    })

    summary.avg_duration_seconds = countDuration > 0 
      ? Math.round(totalDuration / countDuration) 
      : 0

    return { data: summary, error: null }
  } catch (error) {
    return handleServiceError('getTenantAuditSummary', error, { tenantId })
  }
}

/**
 * Exporta historial de auditoría a CSV
 */
export async function exportAuditToCSV(
  tenantId: string,
  filters?: AuditFilters
): Promise<{ data: string | null; error: Error | null }> {
  try {
    const { data: records, error } = await getAuditRecords(tenantId, filters)

    if (error) throw error
    if (!records || records.length === 0) {
      throw new Error('No hay datos para exportar')
    }

    // Construir CSV
    const headers = [
      'Fecha',
      'Mesa',
      'Estado Anterior',
      'Estado Nuevo',
      'Duración (min)',
      'Usuario',
      'Razón',
      'Pedido'
    ]

    const rows = records.map((record: any) => [
      new Date(record.changed_at).toLocaleString(),
      record.table_number,
      record.previous_status,
      record.new_status,
      record.duration_seconds ? Math.round(record.duration_seconds / 60) : '',
      record.changed_by_user?.email || 'Sistema',
      record.reason || '',
      record.order?.order_number || ''
    ])

    const csv = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\n')

    return { data: csv, error: null }
  } catch (error) {
    return handleServiceError('exportAuditToCSV', error, { tenantId, filters })
  }
}

// =============================================
// Utility Functions
// =============================================

/**
 * Formatea duración en segundos a texto legible
 */
export function formatDuration(seconds: number): string {
  if (seconds < 60) {
    return `${seconds}s`
  }

  const minutes = Math.floor(seconds / 60)
  if (minutes < 60) {
    return `${minutes}min`
  }

  const hours = Math.floor(minutes / 60)
  const remainingMinutes = minutes % 60
  return `${hours}h ${remainingMinutes}min`
}

/**
 * Obtiene el color asociado a un estado
 */
export function getStatusColor(status: string): string {
  const colors: Record<string, string> = {
    'libre': '#10b981',
    'ocupada': '#f59e0b',
    'pedido_en_curso': '#3b82f6',
    'cuenta_solicitada': '#8b5cf6',
    'pago_confirmado': '#06b6d4'
  }

  return colors[status] || '#6b7280'
}

export default {
  logTableStatusChange,
  getTableAuditHistory,
  getAuditRecords,
  getRecentChanges,
  getTableStatistics,
  getTenantAuditSummary,
  exportAuditToCSV,
  formatDuration,
  getStatusColor
}
