/**
 * Orders Service - Supabase Integration
 * 
 * Servicio completo de órdenes usando Supabase como única fuente de datos.
 * Reemplaza completamente a lib/server/order-store.ts
 */

import { createBrowserClient } from "@/lib/supabase/client"
import type { Database } from "@/lib/supabase/database.types"
import { createLogger } from "@/lib/logger"
import { TableBusinessRules } from '@/lib/business-rules/table-rules'
import { logTableStatusChange } from '@/lib/services/audit-service'

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
 * Crea una nueva orden en Supabase usando transacción atómica
 * Integra validaciones de reglas de negocio y auditoría automática
 */
export async function createOrder(input: CreateOrderInput, tenantId: string) {
  const supabase = createBrowserClient()

  try {
    // 0. Validaciones iniciales
    if (!input.tableId) {
      throw new Error('Se requiere una mesa para crear el pedido')
    }

    if (!input.items || input.items.length === 0) {
      throw new Error('Se requiere al menos un item para crear el pedido')
    }

    // 1. Obtener datos de la mesa y usuario
    const { data: tableData, error: tableError } = await supabase
      .from('tables')
      .select('*')
      .eq('id', input.tableId)
      .eq('tenant_id', tenantId)
      .single()

    if (tableError || !tableData) {
      throw new Error('Mesa no encontrada')
    }

    const { data: { user } } = await supabase.auth.getUser()
    let userData = null
    if (user?.id) {
      const { data } = await supabase
        .from('users')
        .select('*')
        .eq('id', user.id)
        .single()
      userData = data
    }

    // 2. VALIDAR REGLAS DE NEGOCIO
    const validation = TableBusinessRules.validateOrderCreation(
      tableData,
      userData,
      {
        partySize: input.items.length,
        source: input.source
      }
    )

    if (!validation.valid) {
      logger.warn('Validación de reglas de negocio falló', {
        code: validation.code,
        error: validation.error,
        tableId: input.tableId
      })
      throw new Error(validation.error || 'Validación de pedido falló')
    }

    // 3. Obtener información de los items del menú
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

    // 4. Calcular totales
    const menuItemsMap = new Map(menuItems.map(item => [item.id, item]))
    let subtotalCents = 0
    const orderItemsArray: any[] = []

    for (const item of input.items) {
      const menuItem = menuItemsMap.get(item.menuItemId)
      if (!menuItem) continue

      const unitPrice = menuItem.price_cents
      const modifiersTotal = item.modifiers?.reduce((sum, mod) => sum + mod.priceCents, 0) || 0
      const totalPrice = (unitPrice + modifiersTotal) * item.quantity

      subtotalCents += totalPrice

      orderItemsArray.push({
        menu_item_id: item.menuItemId,
        name: menuItem.name,
        quantity: item.quantity,
        unit_price_cents: unitPrice,
        total_cents: totalPrice,
        notes: item.notes || null,
        modifiers: item.modifiers || null,
        discount: item.discount || null,
      })
    }

    // 5. Aplicar descuentos
    let discountTotalCents = 0
    const orderDiscounts: any[] = []

    for (const discount of input.discounts || []) {
      let discountAmount = 0
      if (discount.type === 'percentage') {
        discountAmount = Math.round(subtotalCents * (discount.value / 100))
      } else {
        discountAmount = discount.value
      }
      discountTotalCents += discountAmount
      orderDiscounts.push({
        type: discount.type,
        value: discount.value,
        amount_cents: discountAmount,
        code: discount.code,
        reason: discount.reason
      })
    }

    // 6. Aplicar impuestos
    let taxTotalCents = 0
    const orderTaxes: any[] = []

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

    // 7. Calcular total final
    const totalCents = subtotalCents - discountTotalCents + taxTotalCents + (input.tipCents || 0) + (input.serviceChargeCents || 0)

    // 8. VALIDAR LÍMITES DE PEDIDO
    const limitsValidation = TableBusinessRules.validateOrderLimits(
      input.items.length,
      totalCents
    )

    if (!limitsValidation.valid) {
      throw new Error(limitsValidation.error || 'Límites de pedido excedidos')
    }

    // 9. LLAMAR A FUNCIÓN RPC DE TRANSACCIÓN ATÓMICA
    const { data: rpcResult, error: rpcError } = await supabase.rpc(
      'create_order_with_table_update' as any,
      {
        p_tenant_id: tenantId,
        p_table_id: input.tableId,
        p_order_data: {
          status: 'abierto',
          payment_status: 'pendiente',
          source: input.source || 'staff',
          subtotal_cents: subtotalCents,
          discount_total_cents: discountTotalCents,
          tax_total_cents: taxTotalCents,
          tip_cents: input.tipCents || 0,
          service_charge_cents: input.serviceChargeCents || 0,
          total_cents: totalCents,
          notes: input.notes,
          customer_data: input.customerData
        },
        p_order_items: orderItemsArray,
        p_discounts: orderDiscounts,
        p_taxes: orderTaxes,
        p_user_id: user?.id || null
      }
    ) as any

    if (rpcError) {
      logger.error('Error en transacción atómica', rpcError as Error)
      throw rpcError
    }

    if (!rpcResult) {
      throw new Error('Error al crear pedido: respuesta vacía de RPC')
    }

    logger.info('Pedido creado con transacción atómica', {
      orderId: rpcResult.order_id,
      orderNumber: rpcResult.order_number,
      tableStatusChanged: rpcResult.table_status_changed,
      previousStatus: rpcResult.previous_table_status,
      newStatus: rpcResult.new_table_status
    })

    // 10. Retornar resultado con estructura compatible
    return {
      data: {
        id: rpcResult.order_id,
        order_number: rpcResult.order_number,
        table_id: input.tableId,
        tenant_id: tenantId,
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
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        // Información adicional del cambio de estado
        _table_status_changed: rpcResult.table_status_changed,
        _previous_table_status: rpcResult.previous_table_status,
        _new_table_status: rpcResult.new_table_status
      },
      error: null
    }

  } catch (error) {
    logger.error('Error al crear orden con transacción atómica', error as Error)
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
