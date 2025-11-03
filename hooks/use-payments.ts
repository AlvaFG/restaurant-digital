/**
 * usePayments Hook - Supabase Integration
 * 
 * Hook para gestionar pagos desde componentes React
 */

import { useState, useEffect, useCallback } from 'react'
import { useAuth } from '@/contexts/auth-context'
import type { Database } from '@/lib/supabase/database.types'
import {
  createPayment as createPaymentService,
  getPayments as getPaymentsService,
  getPaymentById as getPaymentByIdService,
  getPaymentByExternalId as getPaymentByExternalIdService,
  updatePaymentStatus as updatePaymentStatusService,
  updatePayment as updatePaymentService,
  getPaymentsStats as getPaymentsStatsService,
} from '@/lib/services/payments-service'

type Payment = Database['public']['Tables']['payments']['Row']
type PaymentStats = {
  total: number
  byStatus: Record<string, number>
  byProvider: Record<string, number>
  totalAmount: number
  completedAmount: number
}

export function usePayments(filters?: {
  orderId?: string
  status?: string
  provider?: string
  limit?: number
}) {
  const { tenant } = useAuth()
  const [payments, setPayments] = useState<Payment[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  const fetchPayments = useCallback(async () => {
    if (!tenant?.id) return

    setLoading(true)
    setError(null)

    const { data, error: fetchError } = await getPaymentsService(tenant.id, filters)

    if (fetchError) {
      setError(fetchError)
    } else {
      setPayments(data || [])
    }

    setLoading(false)
  }, [tenant?.id, filters])

  useEffect(() => {
    fetchPayments()
  }, [fetchPayments])

  const createPayment = useCallback(async (input: {
    orderId: string
    tableId?: string
    provider: 'mercadopago' | 'stripe' | 'cash'
    amountCents: number
    currency?: string
    method?: string
    externalId?: string
    checkoutUrl?: string
    expiresAt?: string
    metadata?: Record<string, unknown>
  }) => {
    if (!tenant?.id) {
      throw new Error('No tenant ID available')
    }

    const { data, error: createError } = await createPaymentService(input, tenant.id)

    if (createError) {
      throw createError
    }

    await fetchPayments()
    return data
  }, [tenant?.id, fetchPayments])

  const updateStatus = useCallback(async (
    paymentId: string,
    status: 'pending' | 'processing' | 'completed' | 'failed' | 'refunded' | 'cancelled' | 'expired',
    updates?: {
      completedAt?: string
      failureReason?: string
      failureCode?: string
      metadata?: Record<string, unknown>
    }
  ) => {
    if (!tenant?.id) {
      throw new Error('No tenant ID available')
    }

    const { data, error: updateError } = await updatePaymentStatusService(
      paymentId,
      status,
      tenant.id,
      updates
    )

    if (updateError) {
      throw updateError
    }

    await fetchPayments()
    return data
  }, [tenant?.id, fetchPayments])

  const updatePayment = useCallback(async (
    paymentId: string,
    updates: {
      method?: string
      externalId?: string
      checkoutUrl?: string
      metadata?: Record<string, unknown>
    }
  ) => {
    if (!tenant?.id) {
      throw new Error('No tenant ID available')
    }

    const { data, error: updateError } = await updatePaymentService(paymentId, updates, tenant.id)

    if (updateError) {
      throw updateError
    }

    await fetchPayments()
    return data
  }, [tenant?.id, fetchPayments])

  return {
    payments,
    loading,
    error,
    createPayment,
    updateStatus,
    updatePayment,
    refresh: fetchPayments,
  }
}

export function usePayment(paymentId?: string) {
  const { tenant } = useAuth()
  const [payment, setPayment] = useState<Payment | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  const fetchPayment = useCallback(async () => {
    if (!tenant?.id || !paymentId) {
      setLoading(false)
      return
    }

    setLoading(true)
    setError(null)

    const { data, error: fetchError } = await getPaymentByIdService(paymentId, tenant.id)

    if (fetchError) {
      setError(fetchError)
    } else {
      setPayment(data)
    }

    setLoading(false)
  }, [tenant?.id, paymentId])

  useEffect(() => {
    fetchPayment()
  }, [fetchPayment])

  return {
    payment,
    loading,
    error,
    refresh: fetchPayment,
  }
}

export function usePaymentByExternalId(externalId?: string) {
  const { tenant } = useAuth()
  const [payment, setPayment] = useState<Payment | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  const fetchPayment = useCallback(async () => {
    if (!tenant?.id || !externalId) {
      setLoading(false)
      return
    }

    setLoading(true)
    setError(null)

    const { data, error: fetchError } = await getPaymentByExternalIdService(externalId, tenant.id)

    if (fetchError) {
      setError(fetchError)
    } else {
      setPayment(data)
    }

    setLoading(false)
  }, [tenant?.id, externalId])

  useEffect(() => {
    fetchPayment()
  }, [fetchPayment])

  return {
    payment,
    loading,
    error,
    refresh: fetchPayment,
  }
}

export function usePaymentsStats(filters?: {
  startDate?: string
  endDate?: string
}) {
  const { tenant } = useAuth()
  const [stats, setStats] = useState<PaymentStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  const fetchStats = useCallback(async () => {
    if (!tenant?.id) return

    setLoading(true)
    setError(null)

    const { data, error: fetchError } = await getPaymentsStatsService(tenant.id, filters)

    if (fetchError) {
      setError(fetchError)
    } else {
      setStats(data)
    }

    setLoading(false)
  }, [tenant?.id, filters])

  useEffect(() => {
    fetchStats()
  }, [fetchStats])

  return {
    stats,
    loading,
    error,
    refresh: fetchStats,
  }
}
