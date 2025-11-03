/**
 * Extended Analytics Types
 * 
 * Tipos TypeScript para métricas avanzadas de analítica del restaurante
 */

// ============================================
// Service Metrics (Cubiertos y Operaciones)
// ============================================

export interface CoversServed {
  today: number
  thisWeek: number
  thisMonth: number
  thisYear: number
  trend: 'up' | 'down' | 'stable'
  percentageChange: number
  byDay: Array<{
    date: string  // ISO date
    count: number
  }>
}

export interface TableRotation {
  averageSessionDuration: number  // minutos
  rotationsPerTable: number       // promedio
  totalRotations: number
  peakHours: Array<{
    hour: string  // "12:00", "13:00", etc.
    occupancy: number  // porcentaje 0-100
    rotations: number
  }>
}

export interface Occupancy {
  current: number    // porcentaje actual
  average: number    // promedio del período
  peak: number       // máximo alcanzado
  byTimeSlot: Array<{
    time: string     // "12:00-13:00"
    rate: number     // porcentaje 0-100
  }>
  byZone: Array<{
    zoneId: string
    zoneName: string
    rate: number     // porcentaje 0-100
    tables: number   // cantidad de mesas
  }>
}

export interface ServiceMetrics {
  coversServed: CoversServed
  tableRotation: TableRotation
  occupancy: Occupancy
  dateRange: {
    from: Date
    to: Date
  }
}

// ============================================
// Sales Metrics (Ventas Extendidas)
// ============================================

export interface ProductSales {
  productId: string
  name: string
  category: string
  quantity: number
  revenue: number
  averagePrice: number
  percentageOfTotal: number
}

export interface CategorySales {
  category: string
  quantity: number
  revenue: number
  percentage: number
  topProduct: {
    name: string
    quantity: number
  }
}

export interface WaiterSales {
  waiterId: string
  name: string
  ordersServed: number
  totalRevenue: number
  averageTicket: number
  averageServiceTime: number  // minutos
  tips: number
  efficiency: number  // pedidos por hora
}

export interface AverageTicket {
  current: number
  previous: number
  trend: 'up' | 'down' | 'stable'
  percentageChange: number
  byTimeOfDay: Array<{
    time: string  // "breakfast", "lunch", "dinner"
    amount: number
    count: number  // cantidad de tickets
  }>
  byDayOfWeek: Array<{
    day: string  // "monday", "tuesday", etc.
    amount: number
  }>
}

export interface ExtendedSalesMetrics {
  byProduct: ProductSales[]
  byCategory: CategorySales[]
  byWaiter: WaiterSales[]
  averageTicket: AverageTicket
  totalRevenue: number
  totalOrders: number
  dateRange: {
    from: Date
    to: Date
  }
}

// ============================================
// Staff Performance Metrics
// ============================================

export interface StaffPerformanceMetrics {
  staffId: string
  name: string
  role: string
  avatar?: string
  metrics: {
    // Eficiencia
    averageServiceTime: number      // minutos por pedido
    ordersCompleted: number
    ordersPerHour: number
    efficiency: number              // score 0-100
    
    // Ventas
    totalRevenue: number
    averageTicket: number
    
    // Satisfacción (futuro: de ratings)
    customerSatisfaction?: number   // 1-10
    
    // Propinas
    totalTips: number
    averageTipPercentage: number
    
    // Errores y cancelaciones
    errorRate: number              // porcentaje
    cancellationRate: number       // porcentaje
  }
  trend: 'improving' | 'stable' | 'declining'
  ranking: number  // posición en el ranking del período
}

export interface StaffMetrics {
  performance: StaffPerformanceMetrics[]
  dateRange: {
    from: Date
    to: Date
  }
  summary: {
    totalStaff: number
    averageEfficiency: number
    topPerformer: {
      staffId: string
      name: string
      efficiency: number
    }
  }
}

// ============================================
// Filters for Analytics
// ============================================

export interface AnalyticsFilters {
  dateRange: {
    from: Date
    to: Date
    preset?: 'today' | 'yesterday' | 'last7days' | 'last30days' | 'thisMonth' | 'lastMonth' | 'custom'
  }
  categories?: string[]      // filtrar por categorías de productos
  staff?: string[]           // filtrar por IDs de staff
  zones?: string[]           // filtrar por zonas del restaurante
  timeOfDay?: ('morning' | 'afternoon' | 'evening' | 'night')[]
  dayOfWeek?: ('monday' | 'tuesday' | 'wednesday' | 'thursday' | 'friday' | 'saturday' | 'sunday')[]
}

// ============================================
// Dashboard Analytics (Consolidado)
// ============================================

export interface DashboardAnalyticsExtended {
  // Métricas de servicio
  serviceMetrics: ServiceMetrics
  
  // Métricas de ventas
  salesMetrics: ExtendedSalesMetrics
  
  // Performance del staff
  staffMetrics: StaffMetrics
  
  // Metadatos
  dateRange: {
    from: Date
    to: Date
  }
  filters: AnalyticsFilters
  lastUpdated: string  // ISO timestamp
}

// ============================================
// Export Options
// ============================================

export type ExportFormat = 'csv' | 'pdf' | 'xlsx'

export interface ExportOptions {
  format: ExportFormat
  includeCharts: boolean  // solo para PDF
  sections: {
    covers: boolean
    sales: boolean
    staff: boolean
    rotation: boolean
    occupancy: boolean
  }
  filters: AnalyticsFilters
}

// ============================================
// API Response Types
// ============================================

export interface AnalyticsAPIResponse<T> {
  success: boolean
  data: T
  error?: {
    code: string
    message: string
  }
  metadata: {
    timestamp: string
    cached: boolean
    executionTime: number  // ms
  }
}

// ============================================
// Utility Types
// ============================================

export type TrendDirection = 'up' | 'down' | 'stable'

export interface TrendData {
  current: number
  previous: number
  direction: TrendDirection
  percentageChange: number
  absolute: number
}

export interface ChartDataPoint {
  label: string
  value: number
  metadata?: Record<string, unknown>
}
