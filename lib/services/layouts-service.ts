/**
 * Layouts Service
 * 
 * Handles CRUD operations for table map layouts (visual canvas positions)
 * Layouts are stored in tenant settings JSON field
 * 
 * Layout Structure:
 * - zones: Array of zone visual config (id, name, color)
 * - nodes: Array of table positions (id, tableId, x, y, width, height, shape, zone)
 */

import { createBrowserClient } from "@/lib/supabase/client"
import type { Database } from "@/lib/supabase/database.types"

// Layout types (from mock-data.ts, will be migrated later)
export interface TableMapLayout {
  zones: Array<{
    id: string
    name: string
    color: string
  }>
  nodes: Array<{
    id: string
    tableId: string
    x: number
    y: number
    width: number
    height: number
    shape: "rectangle" | "circle"
    zone: string
  }>
}

interface TenantSettings {
  tableMapLayout?: TableMapLayout
  [key: string]: any
}

/**
 * Fetch table map layout for a tenant
 * @param tenantId - Tenant UUID
 * @returns TableMapLayout or null if not found
 */
export async function getLayout(tenantId: string): Promise<TableMapLayout | null> {
  const supabase = createBrowserClient()
  
  const { data, error } = await supabase
    .from('tenants')
    .select('settings')
    .eq('id', tenantId)
    .single()
  
  if (error) {
    console.error('[layouts-service] Error fetching layout:', error)
    return null
  }
  
  if (!data || !data.settings) {
    return null
  }
  
  const settings = data.settings as TenantSettings
  return settings.tableMapLayout || null
}

/**
 * Save table map layout for a tenant
 * @param tenantId - Tenant UUID
 * @param layout - TableMapLayout to save
 * @returns True if successful, false otherwise
 */
export async function saveLayout(tenantId: string, layout: TableMapLayout): Promise<boolean> {
  const supabase = createBrowserClient()
  
  try {
    // First, get current settings
    const { data: currentData, error: fetchError } = await supabase
      .from('tenants')
      .select('settings')
      .eq('id', tenantId)
      .single()
    
    if (fetchError) {
      console.error('[layouts-service] Error fetching current settings:', fetchError)
      return false
    }
    
    // Merge new layout into settings
    const currentSettings = (currentData?.settings as TenantSettings) || {}
    const newSettings: TenantSettings = {
      ...currentSettings,
      tableMapLayout: layout,
    }
    
    // Update settings
    const { error: updateError } = await supabase
      .from('tenants')
      .update({ 
        settings: newSettings as any,
        updated_at: new Date().toISOString(),
      })
      .eq('id', tenantId)
    
    if (updateError) {
      console.error('[layouts-service] Error saving layout:', updateError)
      return false
    }
    
    console.log('[layouts-service] Layout saved successfully')
    return true
  } catch (err) {
    console.error('[layouts-service] Unexpected error saving layout:', err)
    return false
  }
}

/**
 * Delete table map layout for a tenant (reset to empty)
 * @param tenantId - Tenant UUID
 * @returns True if successful, false otherwise
 */
export async function deleteLayout(tenantId: string): Promise<boolean> {
  const supabase = createBrowserClient()
  
  try {
    // Get current settings
    const { data: currentData, error: fetchError } = await supabase
      .from('tenants')
      .select('settings')
      .eq('id', tenantId)
      .single()
    
    if (fetchError) {
      console.error('[layouts-service] Error fetching current settings:', fetchError)
      return false
    }
    
    // Remove layout from settings
    const currentSettings = (currentData?.settings as TenantSettings) || {}
    const { tableMapLayout, ...restSettings } = currentSettings
    
    // Update settings without layout
    const { error: updateError } = await supabase
      .from('tenants')
      .update({ 
        settings: restSettings as any,
        updated_at: new Date().toISOString(),
      })
      .eq('id', tenantId)
    
    if (updateError) {
      console.error('[layouts-service] Error deleting layout:', updateError)
      return false
    }
    
    console.log('[layouts-service] Layout deleted successfully')
    return true
  } catch (err) {
    console.error('[layouts-service] Unexpected error deleting layout:', err)
    return false
  }
}

/**
 * Create default layout from tables and zones
 * @param tables - Array of tables with zone info
 * @param zones - Array of zones
 * @returns Default TableMapLayout with basic grid positioning
 */
export function createDefaultLayout(
  tables: Array<{ id: string; zone_id?: string }>,
  zones: Array<{ id: string; name: string }>
): TableMapLayout {
  const DEFAULT_NODE_WIDTH = 80
  const DEFAULT_NODE_HEIGHT = 60
  const GRID_SPACING = 20
  const COLUMNS = 6
  
  // Create zone configs with default colors
  const zoneColors: Record<string, string> = {
    default: "#94a3b8",
    zone1: "#ef4444",
    zone2: "#3b82f6",
    zone3: "#10b981",
    zone4: "#f59e0b",
    zone5: "#8b5cf6",
  }
  
  const layoutZones = zones.map((zone, index) => ({
    id: zone.id,
    name: zone.name,
    color: zoneColors[`zone${index + 1}`] || zoneColors.default,
  }))
  
  // Create nodes with grid positioning
  const nodes = tables.map((table, index) => {
    const row = Math.floor(index / COLUMNS)
    const col = index % COLUMNS
    const x = 50 + col * (DEFAULT_NODE_WIDTH + GRID_SPACING)
    const y = 50 + row * (DEFAULT_NODE_HEIGHT + GRID_SPACING)
    
    const zone = zones.find(z => z.id === table.zone_id)
    
    return {
      id: `node-${table.id}`,
      tableId: table.id,
      x,
      y,
      width: DEFAULT_NODE_WIDTH,
      height: DEFAULT_NODE_HEIGHT,
      shape: "rectangle" as const,
      zone: zone?.name || "Sin Zona",
    }
  })
  
  return {
    zones: layoutZones,
    nodes,
  }
}
