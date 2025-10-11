/**
 * Analytics Types for Admin Dashboard
 * 
 * Defines TypeScript interfaces for analytics data structures
 */

// ============================================================================
// Sales Metrics
// ============================================================================

export interface SalesMetrics {
  totalRevenue: number
  orderCount: number
  avgOrderValue: number
  completionRate: number
  
  // Breakdown by status
  ordersByStatus: {
    pending: number
    confirmed: number
    preparing: number
    ready: number
    delivered: number
    cancelled: number
  }
  
  // Breakdown by payment method
  ordersByPaymentMethod: {
    mercadopago: number
    cash: number
    card: number
    other: number
  }
  
  // Breakdown by payment status
  ordersByPaymentStatus: {
    pending: number
    processing: number
    completed: number
    failed: number
    refunded: number
  }
}

// ============================================================================
// Revenue Analytics
// ============================================================================

export interface RevenueDataPoint {
  date: string // ISO date string
  revenue: number
  orderCount: number
  avgOrderValue: number
}

export interface RevenueByCategory {
  category: string
  revenue: number
  orderCount: number
  percentage: number
}

export interface RevenueByPaymentMethod {
  method: string
  revenue: number
  orderCount: number
  percentage: number
}

export interface RevenueByHour {
  hour: number // 0-23
  revenue: number
  orderCount: number
}

export interface RevenueAnalytics {
  dailyRevenue: RevenueDataPoint[]
  weeklyRevenue: RevenueDataPoint[]
  monthlyRevenue: RevenueDataPoint[]
  
  revenueByCategory: RevenueByCategory[]
  revenueByPaymentMethod: RevenueByPaymentMethod[]
  revenueByHour: RevenueByHour[]
  
  peakHour: number
  peakDay: string
  peakWeek: string
}

// ============================================================================
// Popular Items Analytics
// ============================================================================

export interface PopularItem {
  itemId: string
  itemName: string
  category: string
  quantitySold: number
  revenue: number
  avgPrice: number
  orderCount: number // Number of orders containing this item
}

export interface CategoryPerformance {
  category: string
  itemCount: number
  quantitySold: number
  revenue: number
  avgOrderValue: number
}

export interface PopularItemsAnalytics {
  topItemsByQuantity: PopularItem[]
  topItemsByRevenue: PopularItem[]
  categoryPerformance: CategoryPerformance[]
}

// ============================================================================
// QR Usage Analytics
// ============================================================================

export interface QrUsageMetrics {
  totalScans: number
  totalSessions: number
  totalOrders: number
  
  conversionRate: number // (orders / sessions) * 100
  avgSessionDuration: number // seconds
  
  // Breakdown by table
  scansByTable: Array<{
    tableId: string
    tableName: string
    scans: number
    sessions: number
    orders: number
    conversionRate: number
  }>
  
  // Time-based analytics
  scansByHour: Array<{
    hour: number
    scans: number
  }>
  
  scansByDay: Array<{
    date: string
    scans: number
  }>
}

// ============================================================================
// Date Range Filter
// ============================================================================

export interface DateRange {
  from: Date
  to: Date
}

export type DateRangePreset = 
  | 'today'
  | 'yesterday'
  | 'last7days'
  | 'last30days'
  | 'thisMonth'
  | 'lastMonth'
  | 'custom'

// ============================================================================
// Dashboard Analytics (combined)
// ============================================================================

export interface DashboardAnalytics {
  salesMetrics: SalesMetrics
  revenueAnalytics: RevenueAnalytics
  popularItems: PopularItemsAnalytics
  qrUsage: QrUsageMetrics
  
  dateRange: DateRange
  lastUpdated: string
}
