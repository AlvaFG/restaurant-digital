/**
 * useTableLayout Hook - Supabase Integration with React Query
 * 
 * Hook para gestionar layouts de mapas de mesas (canvas visual) desde componentes React con caché.
 * Proporciona funciones para cargar, guardar y crear layouts por defecto.
 * 
 * Layout Structure:
 * - zones: Array de configuración visual de zonas
 * - nodes: Array de posiciones de mesas en el canvas
 * 
 * @example
 * ```tsx
 * function TableMapEditor() {
 *   const { layout, isLoading, saveLayout, refresh } = useTableLayout()
 *   
 *   const handleSave = async () => {
 *     const success = await saveLayout(modifiedLayout)
 *     if (success) toast.success('Layout guardado')
 *   }
 *   
 *   return <div>Layout nodes: {layout?.nodes.length}</div>
 * }
 * ```
 */

"use client"

import { useMemo } from "react"
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useAuth } from "@/contexts/auth-context"
import { useTables } from "@/hooks/use-tables"
import { useZones } from "@/hooks/use-zones"
import {
  getLayout as getLayoutService,
  saveLayout as saveLayoutService,
  deleteLayout as deleteLayoutService,
  createDefaultLayout,
  type TableMapLayout
} from "@/lib/services/layouts-service"

interface UseTableLayoutOptions {
  /**
   * Si true, crea un layout por defecto si no existe uno guardado
   * @default true
   */
  createDefaultIfMissing?: boolean
}

interface UseTableLayoutReturn {
  /**
   * Layout actual del mapa de mesas (null si no hay)
   */
  layout: TableMapLayout | null
  
  /**
   * Estado de carga
   */
  isLoading: boolean
  
  /**
   * Error si ocurrió alguno
   */
  error: Error | null
  
  /**
   * Guardar layout en Supabase
   * @param newLayout - Layout a guardar
   * @returns Promise<boolean> - true si éxito, false si error
   */
  saveLayout: (newLayout: TableMapLayout) => Promise<boolean>
  
  /**
   * Eliminar layout guardado (reset a vacío)
   * @returns Promise<boolean> - true si éxito, false si error
   */
  deleteLayout: () => Promise<boolean>
  
  /**
   * Recargar layout desde Supabase
   */
  refresh: () => void
  
  /**
   * Crear layout por defecto desde tablas y zonas actuales
   * @returns TableMapLayout - Layout generado
   */
  generateDefaultLayout: () => TableMapLayout | null
}

/**
 * Hook para gestionar layouts de mapas de mesas con React Query
 */
export function useTableLayout(
  options: UseTableLayoutOptions = {}
): UseTableLayoutReturn {
  const { createDefaultIfMissing = true } = options
  const { user } = useAuth()
  const { tables, loading: tablesLoading } = useTables()
  const { zones, loading: zonesLoading } = useZones()
  const queryClient = useQueryClient()
  
  const tenantId = user?.tenant_id
  const queryKey = ['table-layout', tenantId]
  
  /**
   * Query para cargar layout
   */
  const {
    data: layout = null,
    isLoading: layoutLoading,
    error,
  } = useQuery({
    queryKey,
    queryFn: async () => {
      if (!tenantId) return null
      
      const data = await getLayoutService(tenantId)
      
      // Si no hay layout y se debe crear uno por defecto
      if (!data && createDefaultIfMissing && tables.length > 0) {
        return createDefaultLayout(
          tables.map(t => ({ id: t.id, zone_id: t.zone_id || undefined })),
          zones.map(z => ({ id: z.id, name: z.name }))
        )
      }
      
      return data
    },
    enabled: !!tenantId && !tablesLoading && !zonesLoading,
  })
  
  /**
   * Mutation para guardar layout
   */
  const saveLayoutMutation = useMutation({
    mutationFn: async (newLayout: TableMapLayout) => {
      if (!tenantId) throw new Error('No tenant ID available')
      return await saveLayoutService(tenantId, newLayout)
    },
    onMutate: async (newLayout) => {
      await queryClient.cancelQueries({ queryKey })
      const previousLayout = queryClient.getQueryData(queryKey)
      
      queryClient.setQueryData(queryKey, newLayout)
      
      return { previousLayout }
    },
    onError: (err, newLayout, context) => {
      queryClient.setQueryData(queryKey, context?.previousLayout)
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey })
    },
  })
  
  /**
   * Mutation para eliminar layout
   */
  const deleteLayoutMutation = useMutation({
    mutationFn: async () => {
      if (!tenantId) throw new Error('No tenant ID available')
      return await deleteLayoutService(tenantId)
    },
    onMutate: async () => {
      await queryClient.cancelQueries({ queryKey })
      const previousLayout = queryClient.getQueryData(queryKey)
      
      queryClient.setQueryData(queryKey, null)
      
      return { previousLayout }
    },
    onError: (err, variables, context) => {
      queryClient.setQueryData(queryKey, context?.previousLayout)
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey })
    },
  })
  
  /**
   * Generar layout por defecto (memoized)
   */
  const generateDefaultLayout = useMemo(() => {
    return (): TableMapLayout | null => {
      if (tables.length === 0) return null
      
      return createDefaultLayout(
        tables.map(t => ({ id: t.id, zone_id: t.zone_id || undefined })),
        zones.map(z => ({ id: z.id, name: z.name }))
      )
    }
  }, [tables, zones])
  
  return {
    layout,
    isLoading: layoutLoading || tablesLoading || zonesLoading,
    error: error as Error | null,
    saveLayout: async (newLayout: TableMapLayout) => {
      try {
        await saveLayoutMutation.mutateAsync(newLayout)
        return true
      } catch (err) {
        console.error('[useTableLayout] Error saving layout:', err)
        return false
      }
    },
    deleteLayout: async () => {
      try {
        await deleteLayoutMutation.mutateAsync()
        return true
      } catch (err) {
        console.error('[useTableLayout] Error deleting layout:', err)
        return false
      }
    },
    refresh: () => queryClient.invalidateQueries({ queryKey }),
    generateDefaultLayout,
  }
}
