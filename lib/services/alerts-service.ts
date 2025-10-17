/**
 * Alerts Service
 * 
 * Handles CRUD operations for restaurant alerts (notifications)
 * Includes functions for creating, fetching, acknowledging and deleting alerts
 * 
 * Alert Types:
 * - llamar_mozo: Customer requests waiter
 * - pedido_entrante: New order incoming
 * - quiere_pagar_efectivo: Customer wants to pay with cash
 * - pago_aprobado: Payment approved
 */

import { createBrowserClient } from "@/lib/supabase/client"
import type { Database } from "@/lib/supabase/database.types"

// Type definitions from Supabase generated types
type Alert = Database['public']['Tables']['alerts']['Row']
type AlertInsert = Database['public']['Tables']['alerts']['Insert']
type AlertUpdate = Database['public']['Tables']['alerts']['Update']

type CreateAlertPayload = Omit<AlertInsert, 'id' | 'tenant_id' | 'created_at' | 'updated_at' | 'acknowledged' | 'acknowledged_at' | 'acknowledged_by'>

/**
 * Fetch all alerts for a tenant
 * @param tenantId - Tenant UUID
 * @returns Array of alerts ordered by creation date (newest first)
 */
export async function fetchAlerts(tenantId: string): Promise<Alert[]> {
  const supabase = createBrowserClient()
  
  const { data, error } = await supabase
    .from('alerts')
    .select('*')
    .eq('tenant_id', tenantId)
    .order('created_at', { ascending: false })
  
  if (error) {
    console.error('[alerts-service] Error fetching alerts:', error)
    throw error
  }
  
  return data ?? []
}

/**
 * Fetch only active (unacknowledged) alerts for a tenant
 * @param tenantId - Tenant UUID
 * @returns Array of active alerts ordered by creation date (newest first)
 */
export async function fetchActiveAlerts(tenantId: string): Promise<Alert[]> {
  const supabase = createBrowserClient()
  
  const { data, error } = await supabase
    .from('alerts')
    .select('*')
    .eq('tenant_id', tenantId)
    .eq('acknowledged', false)
    .order('created_at', { ascending: false })
  
  if (error) {
    console.error('[alerts-service] Error fetching active alerts:', error)
    throw error
  }
  
  return data ?? []
}

/**
 * Fetch alerts for a specific table
 * @param tenantId - Tenant UUID
 * @param tableId - Table UUID
 * @returns Array of alerts for the table
 */
export async function fetchAlertsByTable(tenantId: string, tableId: string): Promise<Alert[]> {
  const supabase = createBrowserClient()
  
  const { data, error } = await supabase
    .from('alerts')
    .select('*')
    .eq('tenant_id', tenantId)
    .eq('table_id', tableId)
    .order('created_at', { ascending: false })
  
  if (error) {
    console.error('[alerts-service] Error fetching alerts by table:', error)
    throw error
  }
  
  return data ?? []
}

/**
 * Create a new alert
 * @param tenantId - Tenant UUID
 * @param payload - Alert data (table_id, type, message)
 * @returns Created alert
 */
export async function createAlert(
  tenantId: string,
  payload: CreateAlertPayload
): Promise<Alert> {
  const supabase = createBrowserClient()
  
  const { data, error } = await supabase
    .from('alerts')
    .insert({
      tenant_id: tenantId,
      table_id: payload.table_id,
      type: payload.type,
      message: payload.message,
    })
    .select()
    .single()
  
  if (error) {
    console.error('[alerts-service] Error creating alert:', error)
    throw error
  }
  
  return data
}

/**
 * Acknowledge (mark as attended) an alert
 * @param alertId - Alert UUID
 * @param userId - User UUID who acknowledged the alert
 * @returns Updated alert
 */
export async function acknowledgeAlert(
  alertId: string,
  userId: string
): Promise<Alert> {
  const supabase = createBrowserClient()
  
  const { data, error } = await supabase
    .from('alerts')
    .update({
      acknowledged: true,
      acknowledged_at: new Date().toISOString(),
      acknowledged_by: userId
    })
    .eq('id', alertId)
    .select()
    .single()
  
  if (error) {
    console.error('[alerts-service] Error acknowledging alert:', error)
    throw error
  }
  
  return data
}

/**
 * Update an alert
 * @param alertId - Alert UUID
 * @param payload - Fields to update
 * @returns Updated alert
 */
export async function updateAlert(
  alertId: string,
  payload: Partial<AlertUpdate>
): Promise<Alert> {
  const supabase = createBrowserClient()
  
  const { data, error } = await supabase
    .from('alerts')
    .update(payload)
    .eq('id', alertId)
    .select()
    .single()
  
  if (error) {
    console.error('[alerts-service] Error updating alert:', error)
    throw error
  }
  
  return data
}

/**
 * Delete an alert
 * @param alertId - Alert UUID
 */
export async function deleteAlert(alertId: string): Promise<void> {
  const supabase = createBrowserClient()
  
  const { error } = await supabase
    .from('alerts')
    .delete()
    .eq('id', alertId)
  
  if (error) {
    console.error('[alerts-service] Error deleting alert:', error)
    throw error
  }
}

/**
 * Delete all acknowledged alerts older than a certain date
 * Useful for cleanup/archival
 * @param tenantId - Tenant UUID
 * @param olderThan - Date threshold
 */
export async function deleteOldAcknowledgedAlerts(
  tenantId: string,
  olderThan: Date
): Promise<void> {
  const supabase = createBrowserClient()
  
  const { error } = await supabase
    .from('alerts')
    .delete()
    .eq('tenant_id', tenantId)
    .eq('acknowledged', true)
    .lt('acknowledged_at', olderThan.toISOString())
  
  if (error) {
    console.error('[alerts-service] Error deleting old alerts:', error)
    throw error
  }
}

/**
 * Get count of active alerts by type
 * @param tenantId - Tenant UUID
 * @returns Object with counts per alert type
 */
export async function getAlertCountsByType(tenantId: string): Promise<Record<string, number>> {
  const supabase = createBrowserClient()
  
  const { data, error } = await supabase
    .from('alerts')
    .select('type')
    .eq('tenant_id', tenantId)
    .eq('acknowledged', false)
  
  if (error) {
    console.error('[alerts-service] Error fetching alert counts:', error)
    throw error
  }
  
  // Count by type
  const counts: Record<string, number> = {}
  data?.forEach((alert: { type: string }) => {
    counts[alert.type] = (counts[alert.type] || 0) + 1
  })
  
  return counts
}
