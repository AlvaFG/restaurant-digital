/**
 * Payments Service - Supabase Integration
 * 
 * Servicio completo de pagos usando Supabase como única fuente de datos.
 * Reemplaza completamente a lib/server/payment-store.ts
 */

import { createBrowserClient } from "@/lib/supabase/client"
import type { Database } from "@/lib/supabase/database.types"
import { createLogger } from "@/lib/logger"
import { handleServiceError, type ServiceResult } from '@/lib/error-handler'

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
    return handleServiceError('createPayment', error, { orderId: input.orderId, tenantId })
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
    return handleServiceError('getPayments', error, { tenantId, filters })
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
    return handleServiceError('getPaymentById', error, { paymentId, tenantId })
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
    return handleServiceError('getPaymentByExternalId', error, { externalId, tenantId })
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
    return handleServiceError('updatePaymentStatus', error, { paymentId, status, tenantId })
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
    return handleServiceError('updatePayment', error, { paymentId, tenantId })
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
    return handleServiceError('getPaymentsStats', error, { tenantId, filters })
  }
}

/**
 * Crea un pago de cortesía (invitar la casa)
 * Crea una orden automática con el total de la mesa y marca el pago como completado
 */
export async function createCourtesyPayment(
  tableId: string,
  tenantId: string,
  reason?: string
) {
  const supabase = createBrowserClient()

  try {
    // 1. Obtener orders pendientes de la mesa
    const { data: orders, error: ordersError } = await supabase
      .from('orders')
      .select('*')
      .eq('table_id', tableId)
      .eq('tenant_id', tenantId)
      .in('status', ['abierto', 'en-preparacion', 'listo', 'servido'])
      .in('payment_status', ['pendiente', 'parcial'])

    if (ordersError) throw ordersError

    if (!orders || orders.length === 0) {
      throw new Error('No hay órdenes pendientes en esta mesa')
    }

    // 2. Crear pagos de cortesía para cada orden
    const courtesyPayments = []
    for (const order of orders) {
      // Generar número de pago
      const { count } = await supabase
        .from('payments')
        .select('*', { count: 'exact', head: true })
        .eq('tenant_id', tenantId)

      const paymentNumber = `PAY-${String((count || 0) + 1).padStart(6, '0')}`

      const { data: payment, error: paymentError } = await supabase
        .from('payments')
        .insert({
          tenant_id: tenantId,
          order_id: order.id,
          table_id: tableId,
          payment_number: paymentNumber,
          provider: 'cash',
          status: 'completed',
          method: 'courtesy',
          amount_cents: order.total_cents,
          currency: 'ARS',
          type: 'courtesy',
          completed_at: new Date().toISOString(),
          metadata: {
            reason: reason || 'Cortesía de la casa',
            original_order_number: order.order_number,
          },
        } as any) // Using any because type field might not be in generated types yet
        .select()
        .single()

      if (paymentError) throw paymentError
      courtesyPayments.push(payment)

      // 3. Actualizar el estado de la orden
      const { error: updateOrderError } = await supabase
        .from('orders')
        .update({
          payment_status: 'pagado',
          status: 'pagado',
          updated_at: new Date().toISOString(),
        })
        .eq('id', order.id)

      if (updateOrderError) throw updateOrderError

      logger.info('Pago de cortesía creado', {
        paymentId: payment.id,
        orderId: order.id,
        tableId,
        amount: order.total_cents,
      })
    }

    // 4. Actualizar el estado de la mesa a 'libre'
    const { error: updateTableError } = await supabase
      .from('tables')
      .update({
        status: 'libre',
        updated_at: new Date().toISOString(),
      })
      .eq('id', tableId)
      .eq('tenant_id', tenantId)

    if (updateTableError) throw updateTableError

    logger.info('Cortesía aplicada exitosamente', {
      tableId,
      paymentsCreated: courtesyPayments.length,
      totalAmount: courtesyPayments.reduce((sum, p) => sum + p.amount_cents, 0),
    })

    return { data: courtesyPayments, error: null }
  } catch (error) {
    return handleServiceError('createCourtesyPayment', error, { tableId, tenantId })
  }
}
