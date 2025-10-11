/**
 * Analytics Service
 * 
 * Servicio para calcular análisis y métricas de datos de pedidos
 */

import { Order } from '@/lib/mock-data'
import {
  SalesMetrics,
  RevenueAnalytics,
  RevenueDataPoint,
  RevenueByCategory,
  RevenueByPaymentMethod,
  RevenueByHour,
  PopularItemsAnalytics,
  PopularItem,
  CategoryPerformance,
  QrUsageMetrics,
  DashboardAnalytics,
  DateRange,
} from '@/lib/analytics-types'
import { logger } from './logger'

// ============================================================================
// Funciones Utilitarias
// ============================================================================

/**
 * Calcular el total del pedido (Order ya tiene el campo total)
 */
function calculateOrderTotal(order: Order): number {
  return order.total * 100 // Convertir a centavos para consistencia
}

/**
 * Filtrar pedidos por rango de fechas
 */
function filterOrdersByDateRange(orders: Order[], dateRange: DateRange): Order[] {
  return orders.filter(order => {
    const orderDate = new Date(order.createdAt)
    return orderDate >= dateRange.from && orderDate <= dateRange.to
  })
}

/**
 * Agrupar pedidos por fecha
 */
function groupOrdersByDate(orders: Order[]): Map<string, Order[]> {
  const grouped = new Map<string, Order[]>()
  
  orders.forEach(order => {
    const date = new Date(order.createdAt).toISOString().split('T')[0]
    if (!grouped.has(date)) {
      grouped.set(date, [])
    }
    grouped.get(date)!.push(order)
  })
  
  return grouped
}

// ============================================================================
// Métricas de Ventas
// ============================================================================

export function calculateSalesMetrics(
  orders: Order[],
  dateRange: DateRange
): SalesMetrics {
  const startTime = Date.now();
  
  try {
    logger.debug('Calculando métricas de ventas', { 
      totalOrders: orders.length,
      dateRange: { from: dateRange.from.toISOString(), to: dateRange.to.toISOString() }
    });

    const filteredOrders = filterOrdersByDateRange(orders, dateRange)
  
    const completedOrders = filteredOrders.filter(
      o => o.status === 'entregado' || o.paymentStatus === 'pagado'
    )
  
    const totalRevenue = completedOrders.reduce(
      (sum, order) => sum + calculateOrderTotal(order),
      0
    )
  
    const orderCount = completedOrders.length
    const avgOrderValue = orderCount > 0 ? totalRevenue / orderCount : 0
    const completionRate = filteredOrders.length > 0
      ? (completedOrders.length / filteredOrders.length) * 100
      : 0
  
    // Pedidos por estado (claves en español del tipo Order)
    const ordersByStatus = {
      pending: filteredOrders.filter(o => o.status === 'abierto').length,
      confirmed: filteredOrders.filter(o => o.status === 'abierto').length,
      preparing: filteredOrders.filter(o => o.status === 'preparando').length,
      ready: filteredOrders.filter(o => o.status === 'listo').length,
      delivered: filteredOrders.filter(o => o.status === 'entregado').length,
      cancelled: filteredOrders.filter(o => o.status === 'cerrado').length,
    }
  
    // Pedidos por método de pago
    const ordersByPaymentMethod = {
      mercadopago: filteredOrders.filter(o => o.paymentStatus === 'pagado').length,
      cash: 0, // TODO: Agregar campo método de pago a Order
      card: 0,
      other: filteredOrders.filter(o => o.paymentStatus === 'pendiente').length,
    }
  
    // Pedidos por estado de pago
    const ordersByPaymentStatus = {
      pending: filteredOrders.filter(o => o.paymentStatus === 'pendiente').length,
      processing: 0,
      completed: filteredOrders.filter(o => o.paymentStatus === 'pagado').length,
      failed: 0,
      refunded: filteredOrders.filter(o => o.paymentStatus === 'cancelado').length,
    }

    const duration = Date.now() - startTime;
    logger.info('Métricas de ventas calculadas', {
      filteredOrders: filteredOrders.length,
      completedOrders: completedOrders.length,
      totalRevenue,
      duration: `${duration}ms`
    });
  
    return {
      totalRevenue,
      orderCount,
      avgOrderValue,
      completionRate,
      ordersByStatus,
      ordersByPaymentMethod,
      ordersByPaymentStatus,
    }
  } catch (error) {
    const duration = Date.now() - startTime;
    logger.error('Error al calcular métricas de ventas', error as Error, { duration: `${duration}ms` });
    throw error;
  }
}

// ============================================================================
// Revenue Analytics
// ============================================================================

export function calculateRevenueAnalytics(
  orders: Order[],
  dateRange: DateRange
): RevenueAnalytics {
  const filteredOrders = filterOrdersByDateRange(orders, dateRange)
  const completedOrders = filteredOrders.filter(
    o => o.status === 'entregado' || o.paymentStatus === 'pagado'
  )
  
  // Daily revenue
  const dailyMap = groupOrdersByDate(completedOrders)
  const dailyRevenue: RevenueDataPoint[] = Array.from(dailyMap.entries()).map(
    ([date, dayOrders]) => {
      const revenue = dayOrders.reduce((sum, o) => sum + calculateOrderTotal(o), 0)
      return {
        date,
        revenue,
        orderCount: dayOrders.length,
        avgOrderValue: revenue / dayOrders.length,
      }
    }
  ).sort((a, b) => a.date.localeCompare(b.date))
  
  // Revenue by category - simplified for MVP (Order items don't have category)
  const categoryMap = new Map<string, { revenue: number; count: number }>()
  completedOrders.forEach(order => {
    const category = 'General' // TODO: Add category tracking to Order items
    if (!categoryMap.has(category)) {
      categoryMap.set(category, { revenue: 0, count: 0 })
    }
    const stats = categoryMap.get(category)!
    stats.revenue += calculateOrderTotal(order)
    stats.count++
  })
  
  const totalCategoryRevenue = Array.from(categoryMap.values()).reduce(
    (sum, stats) => sum + stats.revenue,
    0
  )
  
  const revenueByCategory: RevenueByCategory[] = Array.from(categoryMap.entries()).map(
    ([category, stats]) => ({
      category,
      revenue: stats.revenue,
      orderCount: stats.count,
      percentage: totalCategoryRevenue > 0 ? (stats.revenue / totalCategoryRevenue) * 100 : 0,
    })
  ).sort((a, b) => b.revenue - a.revenue)
  
  // Revenue by payment method - simplified for MVP
  const paidOrders = completedOrders.filter(o => o.paymentStatus === 'pagado')
  const revenueByPaymentMethod: RevenueByPaymentMethod[] = [
    {
      method: 'MercadoPago',
      revenue: paidOrders.reduce((sum, o) => sum + calculateOrderTotal(o), 0),
      orderCount: paidOrders.length,
      percentage: 0,
    },
    {
      method: 'Efectivo',
      revenue: completedOrders
        .filter(o => o.paymentStatus === 'pendiente')
        .reduce((sum, o) => sum + calculateOrderTotal(o), 0),
      orderCount: completedOrders.filter(o => o.paymentStatus === 'pendiente').length,
      percentage: 0,
    },
  ]
  
  const totalPaymentRevenue = revenueByPaymentMethod.reduce(
    (sum, method) => sum + method.revenue,
    0
  )
  revenueByPaymentMethod.forEach(method => {
    method.percentage = totalPaymentRevenue > 0
      ? (method.revenue / totalPaymentRevenue) * 100
      : 0
  })
  
  // Revenue by hour
  const hourMap = new Map<number, { revenue: number; count: number }>()
  completedOrders.forEach(order => {
    const hour = new Date(order.createdAt).getHours()
    if (!hourMap.has(hour)) {
      hourMap.set(hour, { revenue: 0, count: 0 })
    }
    const stats = hourMap.get(hour)!
    stats.revenue += calculateOrderTotal(order)
    stats.count++
  })
  
  const revenueByHour: RevenueByHour[] = Array.from(hourMap.entries()).map(
    ([hour, stats]) => ({
      hour,
      revenue: stats.revenue,
      orderCount: stats.count,
    })
  ).sort((a, b) => a.hour - b.hour)
  
  // Peak calculations
  const peakHour = revenueByHour.length > 0
    ? revenueByHour.reduce((prev, curr) => prev.revenue > curr.revenue ? prev : curr).hour
    : 12
  
  const peakDay = dailyRevenue.length > 0
    ? dailyRevenue.reduce((prev, curr) => prev.revenue > curr.revenue ? prev : curr).date
    : new Date().toISOString().split('T')[0]
  
  return {
    dailyRevenue,
    weeklyRevenue: [], // TODO: Implement weekly grouping
    monthlyRevenue: [], // TODO: Implement monthly grouping
    revenueByCategory,
    revenueByPaymentMethod,
    revenueByHour,
    peakHour,
    peakDay,
    peakWeek: '',
  }
}

// ============================================================================
// Popular Items Analytics
// ============================================================================

export function calculatePopularItemsAnalytics(
  orders: Order[],
  dateRange: DateRange
): PopularItemsAnalytics {
  const filteredOrders = filterOrdersByDateRange(orders, dateRange)
  const completedOrders = filteredOrders.filter(
    o => o.status === 'entregado' || o.paymentStatus === 'pagado'
  )
  
  // Map: itemId -> stats
  const itemMap = new Map<string, {
    name: string
    category: string
    quantity: number
    revenue: number
    orderCount: number
  }>()
  
  completedOrders.forEach(order => {
    order.items.forEach(item => {
      const itemId = item.id
      if (!itemMap.has(itemId)) {
        itemMap.set(itemId, {
          name: item.name,
          category: 'General', // TODO: Add category to Order items
          quantity: 0,
          revenue: 0,
          orderCount: 0,
        })
      }
      const stats = itemMap.get(itemId)!
      stats.quantity += item.quantity
      const itemRevenue = item.price * item.quantity * 100 // Convert to cents
      stats.revenue += itemRevenue
      stats.orderCount++
    })
  })
  
  // Convert to PopularItem array
  const allItems: PopularItem[] = Array.from(itemMap.entries()).map(
    ([itemId, stats]) => ({
      itemId,
      itemName: stats.name,
      category: stats.category,
      quantitySold: stats.quantity,
      revenue: stats.revenue,
      avgPrice: stats.revenue / stats.quantity,
      orderCount: stats.orderCount,
    })
  )
  
  // Top items by quantity
  const topItemsByQuantity = [...allItems]
    .sort((a, b) => b.quantitySold - a.quantitySold)
    .slice(0, 10)
  
  // Top items by revenue
  const topItemsByRevenue = [...allItems]
    .sort((a, b) => b.revenue - a.revenue)
    .slice(0, 10)
  
  // Category performance
  const categoryMap = new Map<string, {
    itemCount: number
    quantity: number
    revenue: number
  }>()
  
  allItems.forEach(item => {
    if (!categoryMap.has(item.category)) {
      categoryMap.set(item.category, {
        itemCount: 0,
        quantity: 0,
        revenue: 0,
      })
    }
    const stats = categoryMap.get(item.category)!
    stats.itemCount++
    stats.quantity += item.quantitySold
    stats.revenue += item.revenue
  })
  
  const categoryPerformance: CategoryPerformance[] = Array.from(categoryMap.entries()).map(
    ([category, stats]) => ({
      category,
      itemCount: stats.itemCount,
      quantitySold: stats.quantity,
      revenue: stats.revenue,
      avgOrderValue: stats.revenue / stats.itemCount,
    })
  ).sort((a, b) => b.revenue - a.revenue)
  
  return {
    topItemsByQuantity,
    topItemsByRevenue,
    categoryPerformance,
  }
}

// ============================================================================
// QR Usage Analytics
// ============================================================================

export function calculateQrUsageMetrics(
  orders: Order[],
  dateRange: DateRange
): QrUsageMetrics {
  const filteredOrders = filterOrdersByDateRange(orders, dateRange)
  
  // For MVP: Estimate sessions based on orders
  // In production, track actual QR scans and sessions
  const totalOrders = filteredOrders.length
  const totalSessions = Math.ceil(totalOrders * 1.3) // Estimate 30% abandonment
  const totalScans = Math.ceil(totalSessions * 1.2) // Some users scan multiple times
  
  const conversionRate = totalSessions > 0 ? (totalOrders / totalSessions) * 100 : 0
  const avgSessionDuration = 240 // 4 minutes (placeholder)
  
  // Scans by table
  const tableMap = new Map<string, {
    name: string
    scans: number
    sessions: number
    orders: number
  }>()
  
  filteredOrders.forEach(order => {
    const tableId = order.tableId
    if (!tableMap.has(tableId)) {
      tableMap.set(tableId, {
        name: `Mesa ${tableId}`,
        scans: 0,
        sessions: 0,
        orders: 0,
      })
    }
    const stats = tableMap.get(tableId)!
    stats.orders++
    stats.sessions = Math.ceil(stats.orders * 1.3)
    stats.scans = Math.ceil(stats.sessions * 1.2)
  })
  
  const scansByTable = Array.from(tableMap.entries()).map(
    ([tableId, stats]) => ({
      tableId,
      tableName: stats.name,
      scans: stats.scans,
      sessions: stats.sessions,
      orders: stats.orders,
      conversionRate: stats.sessions > 0 ? (stats.orders / stats.sessions) * 100 : 0,
    })
  ).sort((a, b) => b.scans - a.scans)
  
  // Scans by hour
  const hourMap = new Map<number, number>()
  filteredOrders.forEach(order => {
    const hour = new Date(order.createdAt).getHours()
    hourMap.set(hour, (hourMap.get(hour) || 0) + 1)
  })
  
  const scansByHour = Array.from(hourMap.entries()).map(
    ([hour, count]) => ({
      hour,
      scans: Math.ceil(count * 1.2), // Estimate scans from orders
    })
  ).sort((a, b) => a.hour - b.hour)
  
  // Scans by day
  const dayMap = groupOrdersByDate(filteredOrders)
  const scansByDay = Array.from(dayMap.entries()).map(
    ([date, dayOrders]) => ({
      date,
      scans: Math.ceil(dayOrders.length * 1.2),
    })
  ).sort((a, b) => a.date.localeCompare(b.date))
  
  return {
    totalScans,
    totalSessions,
    totalOrders,
    conversionRate,
    avgSessionDuration,
    scansByTable,
    scansByHour,
    scansByDay,
  }
}

// ============================================================================
// Análisis Completo del Dashboard
// ============================================================================

export function calculateDashboardAnalytics(
  orders: Order[],
  dateRange: DateRange
): DashboardAnalytics {
  const startTime = Date.now();
  
  try {
    logger.info('Calculando análisis completo del dashboard', {
      totalOrders: orders.length,
      dateRange: {
        from: dateRange.from.toISOString(),
        to: dateRange.to.toISOString()
      }
    });

    const result = {
      salesMetrics: calculateSalesMetrics(orders, dateRange),
      revenueAnalytics: calculateRevenueAnalytics(orders, dateRange),
      popularItems: calculatePopularItemsAnalytics(orders, dateRange),
      qrUsage: calculateQrUsageMetrics(orders, dateRange),
      dateRange,
      lastUpdated: new Date().toISOString(),
    };

    const duration = Date.now() - startTime;
    logger.info('Análisis del dashboard completado', {
      duration: `${duration}ms`,
      metrics: {
        totalRevenue: result.salesMetrics.totalRevenue,
        orderCount: result.salesMetrics.orderCount,
        topItemsCount: result.popularItems.topItemsByRevenue.length
      }
    });

    return result;
  } catch (error) {
    const duration = Date.now() - startTime;
    logger.error('Error al calcular análisis del dashboard', error as Error, {
      duration: `${duration}ms`
    });
    throw error;
  }
}

// ============================================================================
// Helpers de Rangos de Fecha
// ============================================================================

export function getDateRangePreset(preset: string): DateRange {
  const now = new Date()
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  
  switch (preset) {
    case 'today':
      return {
        from: today,
        to: new Date(today.getTime() + 24 * 60 * 60 * 1000 - 1),
      }
    
    case 'yesterday':
      const yesterday = new Date(today)
      yesterday.setDate(yesterday.getDate() - 1)
      return {
        from: yesterday,
        to: new Date(yesterday.getTime() + 24 * 60 * 60 * 1000 - 1),
      }
    
    case 'last7days':
      const last7 = new Date(today)
      last7.setDate(last7.getDate() - 7)
      return {
        from: last7,
        to: now,
      }
    
    case 'last30days':
      const last30 = new Date(today)
      last30.setDate(last30.getDate() - 30)
      return {
        from: last30,
        to: now,
      }
    
    case 'thisMonth':
      return {
        from: new Date(now.getFullYear(), now.getMonth(), 1),
        to: now,
      }
    
    case 'lastMonth':
      const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1)
      const lastMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59)
      return {
        from: lastMonthStart,
        to: lastMonthEnd,
      }
    
    default:
      return getDateRangePreset('last30days')
  }
}
