/**
 * Orders Service - Supabase Integration
 * 
 * Servicio completo de órdenes usando Supabase como única fuente de datos.
 * Reemplaza completamente a lib/server/order-store.ts
 */

import { createBrowserClient } from "@/lib/supabase/client"
import type { Database } from "@/lib/supabase/database.types"
import { createLogger } from "@/lib/logger"

const logger = createLogger('orders-service')

type Order = Database['public']['Tables']['orders']['Row']
type OrderInsert = Database['public']['Tables']['orders']['Insert']
type OrderUpdate = Database['public']['Tables']['orders']['Update']
type OrderItem = Database['public']['Tables']['order_items']['Row']
type OrderItemInsert = Database['public']['Tables']['order_items']['Insert']
type OrderDiscount = Database['public']['Tables']['order_discounts']['Row']
type OrderTax = Database['public']['Tables']['order_taxes']['Row']

export interface CreateOrderInput {
  tableId?: string
  items: {
    menuItemId: string
    quantity: number
    notes?: string
    modifiers?: Array<{ name: string; priceCents: number }>
    discount?: {
      type: 'percentage' | 'fixed'
      value: number
      code?: string
      reason?: string
    }
  }[]
  discounts?: Array<{
    type: 'percentage' | 'fixed'
    value: number
    code?: string
    reason?: string
  }>
  taxes?: Array<{
    code: string
    name: string
    rate?: number
    amountCents?: number
  }>
  tipCents?: number
  serviceChargeCents?: number
  notes?: string
  customerData?: Record<string, unknown>
  source?: 'staff' | 'qr' | 'kiosk'
}

/**
 * Crea una nueva orden en Supabase
 */
export async function createOrder(input: CreateOrderInput, tenantId: string) {
  const supabase = createBrowserClient()

  try {
    // 1. Obtener información de los items del menú
    const menuItemIds = input.items.map(item => item.menuItemId)
    const { data: menuItems, error: menuError } = await supabase
      .from('menu_items')
      .select('id, name, price_cents')
      .in('id', menuItemIds)
      .eq('tenant_id', tenantId)

    if (menuError) throw menuError
    if (!menuItems || menuItems.length === 0) {
      throw new Error('No se encontraron items del menú')
    }

    // 2. Calcular totales
    const menuItemsMap = new Map(menuItems.map(item => [item.id, item]))
    let subtotalCents = 0
    const orderItems: OrderItemInsert[] = []

    for (const item of input.items) {
      const menuItem = menuItemsMap.get(item.menuItemId)
      if (!menuItem) continue

      const unitPrice = menuItem.price_cents
      const modifiersTotal = item.modifiers?.reduce((sum, mod) => sum + mod.priceCents, 0) || 0
      const totalPrice = (unitPrice + modifiersTotal) * item.quantity

      subtotalCents += totalPrice

      orderItems.push({
        menu_item_id: item.menuItemId,
        name: menuItem.name,
        quantity: item.quantity,
        unit_price_cents: unitPrice,
        total_cents: totalPrice,
        notes: item.notes || null,
        modifiers: item.modifiers || null,
        discount: item.discount || null,
      } as OrderItemInsert)
    }

    // 3. Aplicar descuentos
    let discountTotalCents = 0
    const orderDiscounts: Array<{
      type: 'percentage' | 'fixed'
      value: number
      amount_cents: number
      code?: string
      reason?: string
    }> = []

    for (const discount of input.discounts || []) {
      let discountAmount = 0
      if (discount.type === 'percentage') {
        discountAmount = Math.round(subtotalCents * (discount.value / 100))
      } else {
        discountAmount = discount.value
      }
      discountTotalCents += discountAmount
      orderDiscounts.push({
        ...discount,
        amount_cents: discountAmount,
      })
    }

    // 4. Aplicar impuestos
    let taxTotalCents = 0
    const orderTaxes: Array<{
      code: string
      name: string
      rate?: number
      amount_cents: number
    }> = []

    for (const tax of input.taxes || []) {
      const taxAmount = tax.amountCents || Math.round((subtotalCents - discountTotalCents) * (tax.rate || 0))
      taxTotalCents += taxAmount
      orderTaxes.push({
        code: tax.code,
        name: tax.name,
        rate: tax.rate,
        amount_cents: taxAmount,
      })
    }

    // 5. Calcular total final
    const totalCents = subtotalCents - discountTotalCents + taxTotalCents + (input.tipCents || 0) + (input.serviceChargeCents || 0)

    // 6. Generar número de orden
    const { count } = await supabase
      .from('orders')
      .select('*', { count: 'exact', head: true })
      .eq('tenant_id', tenantId)

    const orderNumber = `ORD-${String((count || 0) + 1).padStart(6, '0')}`

    // 7. Crear orden
    const { data: order, error: orderError } = await supabase
      .from('orders')
      .insert({
        tenant_id: tenantId,
        table_id: input.tableId || null,
        order_number: orderNumber,
        status: 'abierto',
        payment_status: 'pendiente',
        source: input.source || 'staff',
        subtotal_cents: subtotalCents,
        discount_total_cents: discountTotalCents,
        tax_total_cents: taxTotalCents,
        tip_cents: input.tipCents || 0,
        service_charge_cents: input.serviceChargeCents || 0,
        total_cents: totalCents,
        notes: input.notes || null,
        customer_data: input.customerData || null,
      } as OrderInsert)
      .select()
      .single()

    if (orderError) throw orderError
    if (!order) throw new Error('Error al crear la orden')

    // 8. Crear items de la orden
    const itemsWithOrderId = orderItems.map(item => ({
      ...item,
      order_id: order.id,
    }))

    const { error: itemsError } = await supabase
      .from('order_items')
      .insert(itemsWithOrderId)

    if (itemsError) throw itemsError

    // 9. Crear descuentos si existen
    if (orderDiscounts.length > 0) {
      const discountsWithOrderId = orderDiscounts.map(discount => ({
        order_id: order.id,
        ...discount,
      }))

      const { error: discountsError } = await supabase
        .from('order_discounts')
        .insert(discountsWithOrderId)

      if (discountsError) throw discountsError
    }

    // 10. Crear impuestos si existen
    if (orderTaxes.length > 0) {
      const taxesWithOrderId = orderTaxes.map(tax => ({
        order_id: order.id,
        ...tax,
      }))

      const { error: taxesError } = await supabase
        .from('order_taxes')
        .insert(taxesWithOrderId)

      if (taxesError) throw taxesError
    }

    logger.info('Orden creada exitosamente', { orderId: order.id, orderNumber })

    return { data: order, error: null }
  } catch (error) {
    logger.error('Error al crear orden', error as Error)
    return { data: null, error: error as Error }
  }
}

/**
 * Obtiene todas las órdenes con filtros opcionales
 */
export async function getOrders(tenantId: string, filters?: {
  tableId?: string
  status?: string
  paymentStatus?: string
  source?: string
  limit?: number
}) {
  const supabase = createBrowserClient()

  try {
    let query = supabase
      .from('orders')
      .select(`
        *,
        order_items (*),
        order_discounts (*),
        order_taxes (*)
      `)
      .eq('tenant_id', tenantId)
      .order('created_at', { ascending: false })

    if (filters?.tableId) {
      query = query.eq('table_id', filters.tableId)
    }

    if (filters?.status) {
      query = query.eq('status', filters.status)
    }

    if (filters?.paymentStatus) {
      query = query.eq('payment_status', filters.paymentStatus)
    }

    if (filters?.source) {
      query = query.eq('source', filters.source)
    }

    if (filters?.limit) {
      query = query.limit(filters.limit)
    }

    const { data, error } = await query

    if (error) throw error

    return { data, error: null }
  } catch (error) {
    logger.error('Error al obtener órdenes', error as Error)
    return { data: null, error: error as Error }
  }
}

/**
 * Obtiene una orden por ID
 */
export async function getOrderById(orderId: string, tenantId: string) {
  const supabase = createBrowserClient()

  try {
    const { data, error } = await supabase
      .from('orders')
      .select(`
        *,
        order_items (*),
        order_discounts (*),
        order_taxes (*)
      `)
      .eq('id', orderId)
      .eq('tenant_id', tenantId)
      .single()

    if (error) throw error

    return { data, error: null }
  } catch (error) {
    logger.error('Error al obtener orden', error as Error, { orderId })
    return { data: null, error: error as Error }
  }
}

/**
 * Actualiza el estado de una orden
 */
export async function updateOrderStatus(
  orderId: string,
  status: string,
  tenantId: string
) {
  const supabase = createBrowserClient()

  try {
    const { data, error } = await supabase
      .from('orders')
      .update({ status })
      .eq('id', orderId)
      .eq('tenant_id', tenantId)
      .select()
      .single()

    if (error) throw error

    logger.info('Estado de orden actualizado', { orderId, status })

    return { data, error: null }
  } catch (error) {
    logger.error('Error al actualizar estado de orden', error as Error, { orderId })
    return { data: null, error: error as Error }
  }
}

/**
 * Actualiza el estado de pago de una orden
 */
export async function updateOrderPaymentStatus(
  orderId: string,
  paymentStatus: string,
  tenantId: string
) {
  const supabase = createBrowserClient()

  try {
    const { data, error } = await supabase
      .from('orders')
      .update({ payment_status: paymentStatus })
      .eq('id', orderId)
      .eq('tenant_id', tenantId)
      .select()
      .single()

    if (error) throw error

    logger.info('Estado de pago actualizado', { orderId, paymentStatus })

    return { data, error: null }
  } catch (error) {
    logger.error('Error al actualizar estado de pago', error as Error, { orderId })
    return { data: null, error: error as Error }
  }
}

/**
 * Elimina una orden (soft delete cambiando estado a cancelado)
 */
export async function cancelOrder(orderId: string, tenantId: string) {
  const supabase = createBrowserClient()

  try {
    const { data, error } = await supabase
      .from('orders')
      .update({ status: 'cancelado' })
      .eq('id', orderId)
      .eq('tenant_id', tenantId)
      .select()
      .single()

    if (error) throw error

    logger.info('Orden cancelada', { orderId })

    return { data, error: null }
  } catch (error) {
    logger.error('Error al cancelar orden', error as Error, { orderId })
    return { data: null, error: error as Error }
  }
}

/**
 * Obtiene resumen de órdenes (estadísticas)
 */
export async function getOrdersSummary(tenantId: string, filters?: {
  startDate?: string
  endDate?: string
}) {
  const supabase = createBrowserClient()

  try {
    let query = supabase
      .from('orders')
      .select('status, payment_status, total_cents, created_at')
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
    const summary = {
      total: data?.length || 0,
      byStatus: {} as Record<string, number>,
      byPaymentStatus: {} as Record<string, number>,
      totalRevenue: 0,
    }

    data?.forEach(order => {
      summary.byStatus[order.status] = (summary.byStatus[order.status] || 0) + 1
      summary.byPaymentStatus[order.payment_status] = (summary.byPaymentStatus[order.payment_status] || 0) + 1
      if (order.payment_status === 'pagado') {
        summary.totalRevenue += order.total_cents
      }
    })

    return { data: summary, error: null }
  } catch (error) {
    logger.error('Error al obtener resumen de órdenes', error as Error)
    return { data: null, error: error as Error }
  }
}
