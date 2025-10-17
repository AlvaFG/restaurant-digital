/**
 * Payments Service - Supabase Integration
 * 
 * Servicio completo de pagos usando Supabase como única fuente de datos.
 * Reemplaza completamente a lib/server/payment-store.ts
 */

import { createBrowserClient } from "@/lib/supabase/client"
import type { Database } from "@/lib/supabase/database.types"
import { createLogger } from "@/lib/logger"

const logger = createLogger('payments-service')

type Payment = Database['public']['Tables']['payments']['Row']
type PaymentInsert = Database['public']['Tables']['payments']['Insert']
type PaymentUpdate = Database['public']['Tables']['payments']['Update']

/**
 * Crea un nuevo pago
 */
export async function createPayment(
  input: {
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
  },
  tenantId: string
) {
  const supabase = createBrowserClient()

  try {
    // Generar número de pago
    const { count } = await supabase
      .from('payments')
      .select('*', { count: 'exact', head: true })
      .eq('tenant_id', tenantId)

    const paymentNumber = `PAY-${String((count || 0) + 1).padStart(6, '0')}`

    const { data, error } = await supabase
      .from('payments')
      .insert({
        tenant_id: tenantId,
        order_id: input.orderId,
        table_id: input.tableId || null,
        payment_number: paymentNumber,
        provider: input.provider,
        status: 'pending',
        method: input.method || null,
        amount_cents: input.amountCents,
        currency: input.currency || 'ARS',
        external_id: input.externalId || null,
        checkout_url: input.checkoutUrl || null,
        expires_at: input.expiresAt || null,
        metadata: input.metadata || null,
      } as PaymentInsert)
      .select()
      .single()

    if (error) throw error

    logger.info('Pago creado', { paymentId: data?.id, paymentNumber })

    return { data, error: null }
  } catch (error) {
    logger.error('Error al crear pago', error as Error)
    return { data: null, error: error as Error }
  }
}

/**
 * Obtiene todos los pagos
 */
export async function getPayments(tenantId: string, filters?: {
  orderId?: string
  status?: string
  provider?: string
  limit?: number
}) {
  const supabase = createBrowserClient()

  try {
    let query = supabase
      .from('payments')
      .select(`
        *,
        order:orders (
          id,
          order_number,
          total_cents,
          status
        )
      `)
      .eq('tenant_id', tenantId)
      .order('created_at', { ascending: false })

    if (filters?.orderId) {
      query = query.eq('order_id', filters.orderId)
    }

    if (filters?.status) {
      query = query.eq('status', filters.status)
    }

    if (filters?.provider) {
      query = query.eq('provider', filters.provider)
    }

    if (filters?.limit) {
      query = query.limit(filters.limit)
    }

    const { data, error } = await query

    if (error) throw error

    return { data, error: null }
  } catch (error) {
    logger.error('Error al obtener pagos', error as Error)
    return { data: null, error: error as Error }
  }
}

/**
 * Obtiene un pago por ID
 */
export async function getPaymentById(paymentId: string, tenantId: string) {
  const supabase = createBrowserClient()

  try {
    const { data, error } = await supabase
      .from('payments')
      .select(`
        *,
        order:orders (
          id,
          order_number,
          total_cents,
          status
        )
      `)
      .eq('id', paymentId)
      .eq('tenant_id', tenantId)
      .single()

    if (error) throw error

    return { data, error: null }
  } catch (error) {
    logger.error('Error al obtener pago', error as Error, { paymentId })
    return { data: null, error: error as Error }
  }
}

/**
 * Obtiene un pago por ID externo
 */
export async function getPaymentByExternalId(externalId: string, tenantId: string) {
  const supabase = createBrowserClient()

  try {
    const { data, error } = await supabase
      .from('payments')
      .select('*')
      .eq('external_id', externalId)
      .eq('tenant_id', tenantId)
      .single()

    if (error) throw error

    return { data, error: null }
  } catch (error) {
    logger.error('Error al obtener pago por ID externo', error as Error, { externalId })
    return { data: null, error: error as Error }
  }
}

/**
 * Actualiza el estado de un pago
 */
export async function updatePaymentStatus(
  paymentId: string,
  status: 'pending' | 'processing' | 'completed' | 'failed' | 'refunded' | 'cancelled' | 'expired',
  tenantId: string,
  updates?: {
    completedAt?: string
    failureReason?: string
    failureCode?: string
    metadata?: Record<string, unknown>
  }
) {
  const supabase = createBrowserClient()

  try {
    const updateData: PaymentUpdate = { status }

    if (updates?.completedAt) updateData.completed_at = updates.completedAt
    if (updates?.failureReason) updateData.failure_reason = updates.failureReason
    if (updates?.failureCode) updateData.failure_code = updates.failureCode
    if (updates?.metadata) updateData.metadata = updates.metadata as any

    const { data, error } = await supabase
      .from('payments')
      .update(updateData)
      .eq('id', paymentId)
      .eq('tenant_id', tenantId)
      .select()
      .single()

    if (error) throw error

    logger.info('Estado de pago actualizado', { paymentId, status })

    // Si el pago se completó, actualizar el estado de la orden
    if (status === 'completed') {
      const { error: orderError } = await supabase
        .from('orders')
        .update({ payment_status: 'pagado' })
        .eq('id', data.order_id)
        .eq('tenant_id', tenantId)

      if (orderError) {
        logger.error('Error al actualizar estado de orden', orderError)
      }
    }

    return { data, error: null }
  } catch (error) {
    logger.error('Error al actualizar estado de pago', error as Error, { paymentId })
    return { data: null, error: error as Error }
  }
}

/**
 * Actualiza un pago
 */
export async function updatePayment(
  paymentId: string,
  updates: {
    method?: string
    externalId?: string
    checkoutUrl?: string
    metadata?: Record<string, unknown>
  },
  tenantId: string
) {
  const supabase = createBrowserClient()

  try {
    const updateData: PaymentUpdate = {}

    if (updates.method !== undefined) updateData.method = updates.method
    if (updates.externalId !== undefined) updateData.external_id = updates.externalId
    if (updates.checkoutUrl !== undefined) updateData.checkout_url = updates.checkoutUrl
    if (updates.metadata !== undefined) updateData.metadata = updates.metadata as any

    const { data, error } = await supabase
      .from('payments')
      .update(updateData)
      .eq('id', paymentId)
      .eq('tenant_id', tenantId)
      .select()
      .single()

    if (error) throw error

    logger.info('Pago actualizado', { paymentId })

    return { data, error: null }
  } catch (error) {
    logger.error('Error al actualizar pago', error as Error, { paymentId })
    return { data: null, error: error as Error }
  }
}

/**
 * Obtiene estadísticas de pagos
 */
export async function getPaymentsStats(tenantId: string, filters?: {
  startDate?: string
  endDate?: string
}) {
  const supabase = createBrowserClient()

  try {
    let query = supabase
      .from('payments')
      .select('status, provider, amount_cents, created_at')
      .eq('tenant_id', tenantId)

    if (filters?.startDate) {
      query = query.gte('created_at', filters.startDate)
    }

    if (filters?.endDate) {
      query = query.lte('created_at', filters.endDate)
    }

    const { data, error } = await query

    if (error) throw error

    // Calcular estadísticas
    const stats = {
      total: data?.length || 0,
      byStatus: {} as Record<string, number>,
      byProvider: {} as Record<string, number>,
      totalAmount: 0,
      completedAmount: 0,
    }

    data?.forEach(payment => {
      stats.byStatus[payment.status] = (stats.byStatus[payment.status] || 0) + 1
      stats.byProvider[payment.provider] = (stats.byProvider[payment.provider] || 0) + 1
      stats.totalAmount += payment.amount_cents
      if (payment.status === 'completed') {
        stats.completedAmount += payment.amount_cents
      }
    })

    return { data: stats, error: null }
  } catch (error) {
    logger.error('Error al obtener estadísticas de pagos', error as Error)
    return { data: null, error: error as Error }
  }
}
