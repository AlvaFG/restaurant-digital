/**
 * useZones Hook - API Integration with React Query
 * 
 * Hook para gestionar zonas desde componentes React con caché y optimistic updates.
 * Usa fetch al API en vez de llamar directamente a los servicios.
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useAuth } from '@/contexts/auth-context'

/**
 * Helper para hacer fetch al API y manejar errores
 */
async function fetchAPI<T = any>(endpoint: string, options?: RequestInit): Promise<T> {
  const response = await fetch(endpoint, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options?.headers,
    },
  })
  
  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: `HTTP ${response.status}` }))
    throw new Error(error.error || `Error: ${response.status}`)
  }
  
  const result = await response.json()
  return result.data
}

export function useZones(includeInactive = false) {
  const { tenant } = useAuth()
  const queryClient = useQueryClient()

  const queryKey = ['zones', tenant?.id, includeInactive]

  const {
    data: zones = [],
    isLoading: loading,
    error,
  } = useQuery({
    queryKey,
    queryFn: async () => {
      if (!tenant?.id) return []
      return await fetchAPI<any[]>(`/api/zones?includeInactive=${includeInactive}`)
    },
    enabled: !!tenant?.id,
  })

  const createZoneMutation = useMutation({
    mutationFn: async (input: {
      name: string
      description?: string
      sortOrder?: number
    }) => {
      if (!tenant?.id) throw new Error('No tenant ID available')
      return await fetchAPI('/api/zones', {
        method: 'POST',
        body: JSON.stringify(input),
      })
    },
    onMutate: async (newZone) => {
      await queryClient.cancelQueries({ queryKey })
      const previousZones = queryClient.getQueryData(queryKey)
      
      queryClient.setQueryData(queryKey, (old: any[] = []) => [
        ...old,
        { ...newZone, id: 'temp-' + Date.now(), createdAt: new Date().toISOString(), active: true },
      ])
      
      return { previousZones }
    },
    onError: (err, newZone, context) => {
      queryClient.setQueryData(queryKey, context?.previousZones)
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey })
    },
  })

  const updateZoneMutation = useMutation({
    mutationFn: async ({
      zoneId,
      updates,
    }: {
      zoneId: string
      updates: {
        name?: string
        description?: string
        sortOrder?: number
        active?: boolean
      }
    }) => {
      if (!tenant?.id) throw new Error('No tenant ID available')
      return await fetchAPI(`/api/zones/${zoneId}`, {
        method: 'PATCH',
        body: JSON.stringify(updates),
      })
    },
    onMutate: async ({ zoneId, updates }) => {
      await queryClient.cancelQueries({ queryKey })
      const previousZones = queryClient.getQueryData(queryKey)
      
      queryClient.setQueryData(queryKey, (old: any[] = []) =>
        old.map((zone) => (zone.id === zoneId ? { ...zone, ...updates } : zone))
      )
      
      return { previousZones }
    },
    onError: (err, variables, context) => {
      queryClient.setQueryData(queryKey, context?.previousZones)
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey })
    },
  })

  const deleteZoneMutation = useMutation({
    mutationFn: async (zoneId: string) => {
      if (!tenant?.id) throw new Error('No tenant ID available')
      return await fetchAPI(`/api/zones/${zoneId}`, {
        method: 'DELETE',
      })
    },
    onMutate: async (zoneId) => {
      await queryClient.cancelQueries({ queryKey })
      const previousZones = queryClient.getQueryData(queryKey)
      
      queryClient.setQueryData(queryKey, (old: any[] = []) =>
        old.map((zone) => (zone.id === zoneId ? { ...zone, active: false } : zone))
      )
      
      return { previousZones }
    },
    onError: (err, zoneId, context) => {
      queryClient.setQueryData(queryKey, context?.previousZones)
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey })
    },
  })

  const hardDeleteMutation = useMutation({
    mutationFn: async (zoneId: string) => {
      if (!tenant?.id) throw new Error('No tenant ID available')
      // Hard delete no implementado en API actual, usa DELETE que hace soft delete
      return await fetchAPI(`/api/zones/${zoneId}`, {
        method: 'DELETE',
      })
    },
    onMutate: async (zoneId) => {
      await queryClient.cancelQueries({ queryKey })
      const previousZones = queryClient.getQueryData(queryKey)
      
      queryClient.setQueryData(queryKey, (old: any[] = []) =>
        old.filter((zone) => zone.id !== zoneId)
      )
      
      return { previousZones }
    },
    onError: (err, zoneId, context) => {
      queryClient.setQueryData(queryKey, context?.previousZones)
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey })
    },
  })

  return {
    zones,
    loading,
    error: error as Error | null,
    createZone: (input: Parameters<typeof createZoneMutation.mutateAsync>[0]) =>
      createZoneMutation.mutateAsync(input),
    updateZone: (zoneId: string, updates: any) =>
      updateZoneMutation.mutateAsync({ zoneId, updates }),
    deleteZone: (zoneId: string) => deleteZoneMutation.mutateAsync(zoneId),
    hardDelete: (zoneId: string) => hardDeleteMutation.mutateAsync(zoneId),
    refresh: () => queryClient.invalidateQueries({ queryKey }),
  }
}

export function useZone(zoneId?: string) {
  const { tenant } = useAuth()

  const { data: zone = null, isLoading: loading, error } = useQuery({
    queryKey: ['zone', tenant?.id, zoneId],
    queryFn: async () => {
      if (!tenant?.id || !zoneId) return null
      return await fetchAPI(`/api/zones/${zoneId}`)
    },
    enabled: !!(tenant?.id && zoneId),
  })

  return {
    zone,
    loading,
    error: error as Error | null,
    refresh: () => {
      // Query will automatically refetch
    },
  }
}

export function useZonesWithStats() {
  const { tenant } = useAuth()

  const { data: zones = [], isLoading: loading, error } = useQuery({
    queryKey: ['zones', 'with-stats', tenant?.id],
    queryFn: async () => {
      if (!tenant?.id) return []
      // TODO: Crear endpoint /api/zones/stats en el futuro
      // Por ahora usa el endpoint base
      return await fetchAPI<any[]>('/api/zones')
    },
    enabled: !!tenant?.id,
  })

  return {
    zones,
    loading,
    error: error as Error | null,
    refresh: () => {
      // Query will automatically refetch
    },
  }
}
