/**
 * useTables Hook - Supabase Integration with React Query
 * 
 * Hook para gestionar mesas desde componentes React con caché y optimistic updates
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useAuth } from '@/contexts/auth-context'
import {
  getTables as getTablesService,
  getTableById as getTableByIdService,
  createTable as createTableService,
  updateTable as updateTableService,
  updateTableStatus as updateTableStatusService,
  deleteTable as deleteTableService,
  getTablesByZone as getTablesByZoneService,
  getTablesStats as getTablesStatsService,
} from '@/lib/services/tables-service'

export function useTables(filters?: {
  zoneId?: string
  status?: string
}) {
  const { tenant } = useAuth()
  const queryClient = useQueryClient()

  const queryKey = ['tables', tenant?.id, filters]

  const {
    data: tables = [],
    isLoading: loading,
    error,
  } = useQuery({
    queryKey,
    queryFn: async () => {
      if (!tenant?.id) return []
      const { data, error: fetchError } = await getTablesService(tenant.id, filters)
      if (fetchError) throw fetchError
      return data || []
    },
    enabled: !!tenant?.id,
  })

  const createTableMutation = useMutation({
    mutationFn: async (input: {
      number: string
      capacity?: number
      zoneId?: string
      status?: string
      position?: { x: number; y: number }
      metadata?: Record<string, unknown>
    }) => {
      if (!tenant?.id) throw new Error('No tenant ID available')
      const { data, error: createError } = await createTableService(input, tenant.id)
      if (createError) throw createError
      return data
    },
    onMutate: async (newTable) => {
      await queryClient.cancelQueries({ queryKey })
      const previousTables = queryClient.getQueryData(queryKey)
      
      queryClient.setQueryData(queryKey, (old: any[] = []) => [
        ...old,
        { ...newTable, id: 'temp-' + Date.now(), createdAt: new Date().toISOString() },
      ])
      
      return { previousTables }
    },
    onError: (err, newTable, context) => {
      queryClient.setQueryData(queryKey, context?.previousTables)
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey })
    },
  })

  const updateTableMutation = useMutation({
    mutationFn: async ({
      tableId,
      updates,
    }: {
      tableId: string
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
      }
    }) => {
      if (!tenant?.id) throw new Error('No tenant ID available')
      const { data, error: updateError } = await updateTableService(tableId, updates, tenant.id)
      if (updateError) throw updateError
      return data
    },
    onMutate: async ({ tableId, updates }) => {
      await queryClient.cancelQueries({ queryKey })
      const previousTables = queryClient.getQueryData(queryKey)
      
      queryClient.setQueryData(queryKey, (old: any[] = []) =>
        old.map((table) => (table.id === tableId ? { ...table, ...updates } : table))
      )
      
      return { previousTables }
    },
    onError: (err, variables, context) => {
      queryClient.setQueryData(queryKey, context?.previousTables)
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey })
    },
  })

  const updateStatusMutation = useMutation({
    mutationFn: async ({ tableId, status }: { tableId: string; status: string }) => {
      if (!tenant?.id) throw new Error('No tenant ID available')
      const { data, error: updateError } = await updateTableStatusService(tableId, status, tenant.id)
      if (updateError) throw updateError
      return data
    },
    onMutate: async ({ tableId, status }) => {
      await queryClient.cancelQueries({ queryKey })
      const previousTables = queryClient.getQueryData(queryKey)
      
      queryClient.setQueryData(queryKey, (old: any[] = []) =>
        old.map((table) => (table.id === tableId ? { ...table, status } : table))
      )
      
      return { previousTables }
    },
    onError: (err, variables, context) => {
      queryClient.setQueryData(queryKey, context?.previousTables)
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey })
    },
  })

  const deleteTableMutation = useMutation({
    mutationFn: async (tableId: string) => {
      if (!tenant?.id) throw new Error('No tenant ID available')
      const { error: deleteError } = await deleteTableService(tableId, tenant.id)
      if (deleteError) throw deleteError
    },
    onMutate: async (tableId) => {
      await queryClient.cancelQueries({ queryKey })
      const previousTables = queryClient.getQueryData(queryKey)
      
      queryClient.setQueryData(queryKey, (old: any[] = []) =>
        old.filter((table) => table.id !== tableId)
      )
      
      return { previousTables }
    },
    onError: (err, tableId, context) => {
      queryClient.setQueryData(queryKey, context?.previousTables)
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey })
    },
  })

  return {
    tables,
    loading,
    error: error as Error | null,
    createTable: (input: Parameters<typeof createTableMutation.mutateAsync>[0]) =>
      createTableMutation.mutateAsync(input),
    updateTable: (tableId: string, updates: any) =>
      updateTableMutation.mutateAsync({ tableId, updates }),
    updateStatus: (tableId: string, status: string) =>
      updateStatusMutation.mutateAsync({ tableId, status }),
    deleteTable: (tableId: string) => deleteTableMutation.mutateAsync(tableId),
    refresh: () => queryClient.invalidateQueries({ queryKey }),
  }
}

export function useTable(tableId?: string) {
  const { tenant } = useAuth()

  const { data: table = null, isLoading: loading, error } = useQuery({
    queryKey: ['table', tenant?.id, tableId],
    queryFn: async () => {
      if (!tenant?.id || !tableId) return null
      const { data, error: fetchError } = await getTableByIdService(tableId, tenant.id)
      if (fetchError) throw fetchError
      return data
    },
    enabled: !!(tenant?.id && tableId),
  })

  return {
    table,
    loading,
    error: error as Error | null,
    refresh: () => {
      // Query will automatically refetch
    },
  }
}

export function useTablesByZone(zoneId?: string) {
  const { tenant } = useAuth()

  const { data: tables = [], isLoading: loading, error } = useQuery({
    queryKey: ['tables', 'by-zone', tenant?.id, zoneId],
    queryFn: async () => {
      if (!tenant?.id || !zoneId) return []
      const { data, error: fetchError } = await getTablesByZoneService(zoneId, tenant.id)
      if (fetchError) throw fetchError
      return data || []
    },
    enabled: !!(tenant?.id && zoneId),
  })

  return {
    tables,
    loading,
    error: error as Error | null,
    refresh: () => {
      // Query will automatically refetch
    },
  }
}

export function useTablesStats() {
  const { tenant } = useAuth()

  const { data: stats = null, isLoading: loading, error } = useQuery({
    queryKey: ['tables', 'stats', tenant?.id],
    queryFn: async () => {
      if (!tenant?.id) return null
      const { data, error: fetchError } = await getTablesStatsService(tenant.id)
      if (fetchError) throw fetchError
      return data
    },
    enabled: !!tenant?.id,
  })

  return {
    stats,
    loading,
    error: error as Error | null,
    refresh: () => {
      // Query will automatically refetch
    },
  }
}
