/**
 * Analytics Dashboard Component
 * 
 * Main dashboard showing sales metrics, revenue analytics, popular items, QR usage,
 * covers served, table rotation, and staff performance
 * 
 * Sprint 5 Optimizations:
 * - Lazy loading for heavy chart components (Recharts)
 * - Suspense boundaries for better loading states
 * - Code splitting to reduce initial bundle size
 */

"use client"

import { useState, useEffect, lazy, Suspense } from 'react'
import { SalesMetricsCards } from '@/app/analitica/_components/sales-metrics-cards'
import { DateRangePicker } from '@/app/analitica/_components/date-range-picker'
import { FiltersSidebar } from '@/app/analitica/_components/filters-sidebar'
import { ExportButton } from '@/app/analitica/_components/export-button'
import type { DateRangePreset, DashboardAnalytics } from '@/lib/analytics-types'
import type { AnalyticsFilters } from '@/lib/types/analytics-extended'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Skeleton } from '@/components/ui/skeleton'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { RefreshCw } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { logger } from '@/lib/logger'

// Lazy load heavy chart components (Recharts adds ~100KB)
const RevenueChart = lazy(() => import('@/app/analitica/_components/revenue-chart').then(m => ({ default: m.RevenueChart })))
const CategoryChart = lazy(() => import('@/app/analitica/_components/category-chart').then(m => ({ default: m.CategoryChart })))
const PopularItemsList = lazy(() => import('@/app/analitica/_components/popular-items-list').then(m => ({ default: m.PopularItemsList })))
const QrUsageStats = lazy(() => import('@/app/analitica/_components/qr-usage-stats').then(m => ({ default: m.QrUsageStats })))
const CoversMetrics = lazy(() => import('@/app/analitica/_components/covers-metrics').then(m => ({ default: m.CoversMetrics })))
const TableRotationChart = lazy(() => import('@/app/analitica/_components/table-rotation-chart').then(m => ({ default: m.TableRotationChart })))
const StaffPerformanceTable = lazy(() => import('@/app/analitica/_components/staff-performance-table').then(m => ({ default: m.StaffPerformanceTable })))

// Chart loading skeleton
const ChartSkeleton = () => (
  <div className="space-y-3">
    <Skeleton className="h-[300px] w-full" />
    <div className="flex gap-2">
      <Skeleton className="h-4 w-20" />
      <Skeleton className="h-4 w-20" />
      <Skeleton className="h-4 w-20" />
    </div>
  </div>
)

export function AnalyticsDashboard() {
  const [datePreset, setDatePreset] = useState<DateRangePreset>('last30days')
  const [analytics, setAnalytics] = useState<DashboardAnalytics | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showFilters, setShowFilters] = useState(false)
  const [filters, setFilters] = useState<AnalyticsFilters>(() => {
    const now = new Date()
    return {
      dateRange: {
        from: new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000),
        to: now,
        preset: 'last7days'
      }
    }
  })
  
  // Fetch on mount and when date preset changes
  useEffect(() => {
    // Fetch analytics data
    const fetchAnalytics = async () => {
      const startTime = Date.now();
      setLoading(true)
      setError(null)
      
      try {
        logger.debug('Obteniendo datos de analítica', { preset: datePreset });
        
        // Fetch all analytics endpoints in parallel
        const [salesRes, revenueRes, popularItemsRes, qrUsageRes] = await Promise.all([
          fetch(`/api/analytics/sales?preset=${datePreset}`),
          fetch(`/api/analytics/revenue?preset=${datePreset}`),
          fetch(`/api/analytics/popular-items?preset=${datePreset}`),
          fetch(`/api/analytics/qr-usage?preset=${datePreset}`),
        ])
        
        if (!salesRes.ok || !revenueRes.ok || !popularItemsRes.ok || !qrUsageRes.ok) {
          throw new Error('Failed to fetch analytics data')
        }
        
        const [salesData, revenueData, popularItemsData, qrUsageData] = await Promise.all([
          salesRes.json(),
          revenueRes.json(),
          popularItemsRes.json(),
          qrUsageRes.json(),
        ])
        
        // Combine all data into DashboardAnalytics
        const combinedAnalytics: DashboardAnalytics = {
          salesMetrics: salesData.data,
          revenueAnalytics: revenueData.data,
          popularItems: popularItemsData.data,
          qrUsage: qrUsageData.data,
          dateRange: {
            from: new Date(salesData.data.dateRange.from),
            to: new Date(salesData.data.dateRange.to),
          },
          lastUpdated: new Date().toISOString(),
        }
        
        setAnalytics(combinedAnalytics)
        
        const duration = Date.now() - startTime;
        logger.info('Datos de analítica obtenidos exitosamente', { 
          preset: datePreset,
          duration: `${duration}ms`
        });
      } catch (err) {
        logger.error('Error al obtener datos de analítica', err as Error, { 
          preset: datePreset 
        });
        setError('Error al cargar los datos de analítica. Por favor, intenta nuevamente.')
      } finally {
        setLoading(false)
      }
    }
    
    fetchAnalytics()
  }, [datePreset])
  
  // Loading skeleton
  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <Skeleton className="h-10 w-[200px]" />
          <Skeleton className="h-10 w-[100px]" />
        </div>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-[120px]" />
          ))}
        </div>
        <Skeleton className="h-[400px]" />
        <div className="grid gap-6 md:grid-cols-2">
          <Skeleton className="h-[400px]" />
          <Skeleton className="h-[400px]" />
        </div>
      </div>
    )
  }
  
  // Error state
  if (error) {
    return (
      <Alert variant="destructive">
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    )
  }
  
  // No data
  if (!analytics) {
    return (
      <Alert>
        <AlertDescription>No hay datos de analítica disponibles</AlertDescription>
      </Alert>
    )
  }
  
  return (
    <div className="flex gap-6">
      {/* Main Content */}
      <div className="flex-1 space-y-6">
        {/* Header with date picker, filters toggle, export, and refresh */}
        <div className="flex items-center justify-between">
          <DateRangePicker value={datePreset} onChange={setDatePreset} />
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowFilters(!showFilters)}
            >
              {showFilters ? 'Ocultar Filtros' : 'Mostrar Filtros'}
            </Button>
            <ExportButton filters={filters} />
            <Button
              variant="outline"
              size="sm"
              onClick={() => window.location.reload()}
              disabled={loading}
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
              Actualizar
            </Button>
          </div>
        </div>
        
        {/* Tabs for different analytics sections */}
        <Tabs defaultValue="general" className="space-y-6">
          <TabsList>
            <TabsTrigger value="general">General</TabsTrigger>
            <TabsTrigger value="servicio">Servicio</TabsTrigger>
            <TabsTrigger value="staff">Staff</TabsTrigger>
          </TabsList>
          
          {/* General Tab: Sales, Revenue, Popular Items, QR */}
          <TabsContent value="general" className="space-y-6">
            {/* Sales Metrics Cards */}
            <SalesMetricsCards metrics={analytics.salesMetrics} />
            
            {/* Revenue Chart with lazy loading */}
            <Suspense fallback={<ChartSkeleton />}>
              <RevenueChart
                data={analytics.revenueAnalytics.dailyRevenue}
                title="Ingresos Diarios"
                description="Evolución de ingresos en el período seleccionado"
              />
            </Suspense>
            
            {/* Category Chart and Popular Items with lazy loading */}
            <div className="grid gap-6 md:grid-cols-2">
              <Suspense fallback={<ChartSkeleton />}>
                <CategoryChart
                  data={analytics.revenueAnalytics.revenueByCategory}
                  title="Distribución por Categoría"
                  description="Porcentaje de ingresos por categoría"
                />
              </Suspense>
              
              <Suspense fallback={<ChartSkeleton />}>
                <PopularItemsList
                  items={analytics.popularItems.topItemsByRevenue}
                  title="Top 10 Productos por Ingresos"
                  sortBy="revenue"
                />
              </Suspense>
            </div>
            
            {/* QR Usage Stats with lazy loading */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Estadísticas de Uso QR</h3>
              <Suspense fallback={<ChartSkeleton />}>
                <QrUsageStats metrics={analytics.qrUsage} />
              </Suspense>
            </div>
          </TabsContent>
          
          {/* Service Tab: Covers, Table Rotation with lazy loading */}
          <TabsContent value="servicio" className="space-y-6">
            {/* Covers Metrics */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Cubiertos Servidos</h3>
              <Suspense fallback={<ChartSkeleton />}>
                <CoversMetrics dateRange={filters.dateRange} />
              </Suspense>
            </div>
            
            {/* Table Rotation */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Rotación de Mesas</h3>
              <Suspense fallback={<ChartSkeleton />}>
                <TableRotationChart dateRange={filters.dateRange} />
              </Suspense>
            </div>
          </TabsContent>
          
          {/* Staff Tab: Performance with lazy loading */}
          <TabsContent value="staff" className="space-y-6">
            <Suspense fallback={<ChartSkeleton />}>
              <StaffPerformanceTable dateRange={filters.dateRange} />
            </Suspense>
          </TabsContent>
        </Tabs>
        
        {/* Last Updated */}
        <p className="text-xs text-muted-foreground text-right">
          Última actualización: {new Date(analytics.lastUpdated).toLocaleString('es-AR')}
        </p>
      </div>
      
      {/* Filters Sidebar */}
      {showFilters && (
        <FiltersSidebar
          filters={filters}
          onFiltersChange={setFilters}
          onApply={() => {
            // Refresh data with new filters
            window.location.reload()
          }}
        />
      )}
    </div>
  )
}
