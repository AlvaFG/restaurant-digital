/**
 * useOrders Hook - Supabase Integration with React Query
 * 
 * Hook para gestionar órdenes desde componentes React con caché y optimistic updates
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useAuth } from '@/contexts/auth-context'
import { 
  createOrder as createOrderService,
  getOrders as getOrdersService,
  getOrderById as getOrderByIdService,
  updateOrderStatus as updateOrderStatusService,
  updateOrderPaymentStatus as updateOrderPaymentStatusService,
  cancelOrder as cancelOrderService,
  getOrdersSummary as getOrdersSummaryService,
  type CreateOrderInput
} from '@/lib/services/orders-service'

export function useOrders(filters?: {
  tableId?: string
  status?: string
  paymentStatus?: string
  source?: string
  limit?: number
}) {
  const { tenant } = useAuth()
  const queryClient = useQueryClient()

  const queryKey = ['orders', tenant?.id, filters]

  const {
    data: orders = [],
    isLoading: loading,
    error,
  } = useQuery({
    queryKey,
    queryFn: async () => {
      if (!tenant?.id) return []
      const { data, error: fetchError } = await getOrdersService(tenant.id, filters)
      if (fetchError) throw fetchError
      return data || []
    },
    enabled: !!tenant?.id,
  })

  const createOrderMutation = useMutation({
    mutationFn: async (input: CreateOrderInput) => {
      if (!tenant?.id) throw new Error('No tenant ID available')
      const { data, error: createError } = await createOrderService(input, tenant.id)
      if (createError) throw createError
      return data
    },
    onMutate: async (newOrder) => {
      await queryClient.cancelQueries({ queryKey })
      const previousOrders = queryClient.getQueryData(queryKey)
      
      queryClient.setQueryData(queryKey, (old: any[] = []) => [
        { ...newOrder, id: 'temp-' + Date.now(), createdAt: new Date().toISOString() },
        ...old,
      ])
      
      return { previousOrders }
    },
    onError: (err, newOrder, context) => {
      queryClient.setQueryData(queryKey, context?.previousOrders)
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey })
    },
  })

  const updateStatusMutation = useMutation({
    mutationFn: async ({ orderId, status }: { orderId: string; status: string }) => {
      if (!tenant?.id) throw new Error('No tenant ID available')
      const { data, error: updateError } = await updateOrderStatusService(orderId, status, tenant.id)
      if (updateError) throw updateError
      return data
    },
    onMutate: async ({ orderId, status }) => {
      await queryClient.cancelQueries({ queryKey })
      const previousOrders = queryClient.getQueryData(queryKey)
      
      queryClient.setQueryData(queryKey, (old: any[] = []) =>
        old.map((order) => (order.id === orderId ? { ...order, status } : order))
      )
      
      return { previousOrders }
    },
    onError: (err, variables, context) => {
      queryClient.setQueryData(queryKey, context?.previousOrders)
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey })
    },
  })

  const updatePaymentStatusMutation = useMutation({
    mutationFn: async ({ orderId, paymentStatus }: { orderId: string; paymentStatus: string }) => {
      if (!tenant?.id) throw new Error('No tenant ID available')
      const { data, error: updateError } = await updateOrderPaymentStatusService(orderId, paymentStatus, tenant.id)
      if (updateError) throw updateError
      return data
    },
    onMutate: async ({ orderId, paymentStatus }) => {
      await queryClient.cancelQueries({ queryKey })
      const previousOrders = queryClient.getQueryData(queryKey)
      
      queryClient.setQueryData(queryKey, (old: any[] = []) =>
        old.map((order) => (order.id === orderId ? { ...order, paymentStatus } : order))
      )
      
      return { previousOrders }
    },
    onError: (err, variables, context) => {
      queryClient.setQueryData(queryKey, context?.previousOrders)
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey })
    },
  })

  const cancelOrderMutation = useMutation({
    mutationFn: async (orderId: string) => {
      if (!tenant?.id) throw new Error('No tenant ID available')
      const { data, error: cancelError } = await cancelOrderService(orderId, tenant.id)
      if (cancelError) throw cancelError
      return data
    },
    onMutate: async (orderId) => {
      await queryClient.cancelQueries({ queryKey })
      const previousOrders = queryClient.getQueryData(queryKey)
      
      queryClient.setQueryData(queryKey, (old: any[] = []) =>
        old.map((order) => (order.id === orderId ? { ...order, status: 'cancelado' } : order))
      )
      
      return { previousOrders }
    },
    onError: (err, orderId, context) => {
      queryClient.setQueryData(queryKey, context?.previousOrders)
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey })
    },
  })

  return {
    orders,
    loading,
    error: error as Error | null,
    createOrder: (input: CreateOrderInput) => createOrderMutation.mutateAsync(input),
    updateStatus: (orderId: string, status: string) =>
      updateStatusMutation.mutateAsync({ orderId, status }),
    updatePaymentStatus: (orderId: string, paymentStatus: string) =>
      updatePaymentStatusMutation.mutateAsync({ orderId, paymentStatus }),
    cancelOrder: (orderId: string) => cancelOrderMutation.mutateAsync(orderId),
    refresh: () => queryClient.invalidateQueries({ queryKey }),
  }
}

export function useOrder(orderId?: string) {
  const { tenant } = useAuth()

  const { data: order = null, isLoading: loading, error } = useQuery({
    queryKey: ['order', tenant?.id, orderId],
    queryFn: async () => {
      if (!tenant?.id || !orderId) return null
      const { data, error: fetchError } = await getOrderByIdService(orderId, tenant.id)
      if (fetchError) throw fetchError
      return data
    },
    enabled: !!(tenant?.id && orderId),
  })

  return {
    order,
    loading,
    error: error as Error | null,
    refresh: () => {
      // Query will automatically refetch
    },
  }
}

export function useOrdersSummary(filters?: {
  startDate?: string
  endDate?: string
}) {
  const { tenant } = useAuth()

  const { data: summary = null, isLoading: loading, error } = useQuery({
    queryKey: ['orders', 'summary', tenant?.id, filters],
    queryFn: async () => {
      if (!tenant?.id) return null
      const { data, error: fetchError } = await getOrdersSummaryService(tenant.id, filters)
      if (fetchError) throw fetchError
      return data
    },
    enabled: !!tenant?.id,
  })

  return {
    summary,
    loading,
    error: error as Error | null,
    refresh: () => {
      // Query will automatically refetch
    },
  }
}
