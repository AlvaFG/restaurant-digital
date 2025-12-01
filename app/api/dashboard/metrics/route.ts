import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { manejarError, respuestaExitosa } from '@/lib/api-helpers'
import { logger } from '@/lib/logger'

interface Order {
  total_cents?: number
  metadata?: {
    guests?: number
    covers?: number
  } | null
}

interface Table {
  status: string
}

interface MenuItem {
  id: string
  name: string
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const tenantId = searchParams.get('tenantId')

    if (!tenantId) {
      return NextResponse.json(
        { error: 'tenant_id es requerido' },
        { status: 400 }
      )
    }

    const supabase = createAdminClient()

    // Obtener fecha de hoy (inicio del día)
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const todayISO = today.toISOString()

    // 1. Ventas del día - Sumar total de pedidos PAGADOS de hoy
    const { data: ordersToday, error: ordersError } = await supabase
      .from('orders')
      .select('total_cents, metadata')
      .eq('tenant_id', tenantId)
      .eq('payment_status', 'approved') // Pedidos pagados/aprobados
      .gte('created_at', todayISO)

    if (ordersError) {
      logger.error('Error al obtener pedidos del día', ordersError as Error)
    }

    // Convertir centavos a unidades monetarias y sumar
    const dailySales = (ordersToday as Order[] | null)?.reduce(
      (sum, order) => sum + ((order.total_cents || 0) / 100), 
      0
    ) || 0
    const totalOrdersToday = ordersToday?.length || 0

    // 2. Ticket Promedio - Promedio de ventas por pedido pagado de hoy
    const averageTicket = totalOrdersToday > 0 ? dailySales / totalOrdersToday : 0

    // 3. Ocupación - Mesas ocupadas vs total de mesas
    const { data: allTables, error: tablesError } = await supabase
      .from('tables')
      .select('status')
      .eq('tenant_id', tenantId)

    if (tablesError) {
      logger.error('Error al obtener mesas', tablesError as Error)
    }

    const totalTables = allTables?.length || 0
    const occupiedTables = (allTables as Table[] | null)?.filter(t => t.status === 'occupied').length || 0
    const occupancyRate = totalTables > 0 ? Math.round((occupiedTables / totalTables) * 100) : 0

    // 4. Cubiertos del día - Contar personas en pedidos pagados de hoy
    const { data: ordersWithCovers, error: coversError } = await supabase
      .from('orders')
      .select('metadata')
      .eq('tenant_id', tenantId)
      .eq('payment_status', 'approved')
      .gte('created_at', todayISO)

    if (coversError) {
      logger.error('Error al obtener cubiertos', coversError as Error)
    }

    // Extraer guests/covers de metadata
    const totalCovers = (ordersWithCovers as Order[] | null)?.reduce((sum, order) => {
      const guests = (order.metadata as any)?.guests || (order.metadata as any)?.covers || 0
      return sum + guests
    }, 0) || 0

    // 5. Pedidos activos - Pedidos que NO están pagados o cancelados
    const { data: activeOrders, error: activeError } = await supabase
      .from('orders')
      .select('id')
      .eq('tenant_id', tenantId)
      .in('status', ['pending', 'preparing', 'ready', 'served'])

    if (activeError) {
      logger.error('Error al obtener pedidos activos', activeError as Error)
    }

    const activeOrdersCount = activeOrders?.length || 0

    // 6. Estado de mesas
    const tablesByStatus = {
      occupied: (allTables as Table[] | null)?.filter(t => t.status === 'occupied').length || 0,
      available: (allTables as Table[] | null)?.filter(t => t.status === 'available').length || 0,
      reserved: (allTables as Table[] | null)?.filter(t => t.status === 'reserved').length || 0,
    }

    // 7. Platos más vendidos del día
    const { data: orderItems, error: itemsError } = await supabase
      .from('order_items')
      .select(`
        menu_item_id,
        quantity,
        orders!inner (
          status,
          created_at,
          tenant_id
        )
      `)
      .eq('orders.tenant_id', tenantId)
      .eq('orders.status', 'paid')
      .gte('orders.created_at', todayISO)

    if (itemsError) {
      logger.error('Error al obtener items de pedidos', itemsError as Error)
    }

    // Agrupar por plato y contar
    const dishCounts: Record<string, number> = {}
    const typedOrderItems = (orderItems ?? []) as Array<{ menu_item_id: string | null; quantity: number | null }>

    typedOrderItems.forEach((item) => {
      if (!item.menu_item_id) {
        return
      }

      const quantity = item.quantity ?? 1
      dishCounts[item.menu_item_id] = (dishCounts[item.menu_item_id] || 0) + quantity
    })

    // Obtener nombres de los platos más vendidos
    const topDishIds = Object.entries(dishCounts)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 5)
      .map(([id]) => id)

    let topDishes: Array<{ name: string; orders: number }> = []

    if (topDishIds.length > 0) {
      const { data: menuItems, error: menuError } = await supabase
        .from('menu_items')
        .select('id, name')
        .in('id', topDishIds)

      if (!menuError && menuItems) {
        topDishes = (menuItems as MenuItem[]).map(item => ({
          name: item.name,
          orders: dishCounts[item.id] || 0
        })).sort((a, b) => b.orders - a.orders)
      }
    }

    // 8. Crecimiento (comparar con ayer)
    const yesterday = new Date(today)
    yesterday.setDate(yesterday.getDate() - 1)
    const yesterdayISO = yesterday.toISOString()

    const { data: ordersYesterday, error: _yesterdayError } = await supabase
      .from('orders')
      .select('total_cents')
      .eq('tenant_id', tenantId)
      .eq('payment_status', 'approved')
      .gte('created_at', yesterdayISO)
      .lt('created_at', todayISO)

    const salesYesterday = (ordersYesterday as Order[] | null)?.reduce(
      (sum, order) => sum + ((order.total_cents || 0) / 100), 
      0
    ) || 0
    const salesGrowth = salesYesterday > 0 
      ? `${Math.round(((dailySales - salesYesterday) / salesYesterday) * 100) > 0 ? '+' : ''}${Math.round(((dailySales - salesYesterday) / salesYesterday) * 100)}%`
      : '+0%'

    const avgTicketYesterday = ordersYesterday?.length 
      ? salesYesterday / ordersYesterday.length 
      : 0
    const ticketGrowth = avgTicketYesterday > 0
      ? `${Math.round(((averageTicket - avgTicketYesterday) / avgTicketYesterday) * 100) > 0 ? '+' : ''}${Math.round(((averageTicket - avgTicketYesterday) / avgTicketYesterday) * 100)}%`
      : '+0%'

    const metrics = {
      dailySales: Math.round(dailySales),
      averageTicket: Math.round(averageTicket),
      occupancyRate,
      totalCovers,
      occupiedTables,
      totalTables,
      activeOrders: activeOrdersCount,
      totalOrdersToday,
      tablesByStatus,
      topDishes: topDishes.length > 0 ? topDishes : [],
      salesGrowth,
      ticketGrowth,
    }

    logger.info('Métricas del dashboard calculadas', { tenantId, metrics })

    return respuestaExitosa(metrics, 'Métricas obtenidas correctamente')
  } catch (error) {
    logger.error('Error al obtener métricas del dashboard', error as Error)
    return manejarError(error, 'dashboard-metrics')
  }
}

