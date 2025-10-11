/**
 * Analytics Dashboard Component
 * 
 * Main dashboard showing sales metrics, revenue analytics, popular items, and QR usage
 */

"use client"

import { useState, useEffect } from 'react'
import { SalesMetricsCards } from '@/app/analitica/_components/sales-metrics-cards'
import { RevenueChart } from '@/app/analitica/_components/revenue-chart'
import { CategoryChart } from '@/app/analitica/_components/category-chart'
import { PopularItemsList } from '@/app/analitica/_components/popular-items-list'
import { QrUsageStats } from '@/app/analitica/_components/qr-usage-stats'
import { DateRangePicker } from '@/app/analitica/_components/date-range-picker'
import type { DateRangePreset, DashboardAnalytics } from '@/lib/analytics-types'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Skeleton } from '@/components/ui/skeleton'
import { RefreshCw } from 'lucide-react'
import { Button } from '@/components/ui/button'

export function AnalyticsDashboard() {
  const [datePreset, setDatePreset] = useState<DateRangePreset>('last30days')
  const [analytics, setAnalytics] = useState<DashboardAnalytics | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  
  // Fetch analytics data
  const fetchAnalytics = async () => {
    setLoading(true)
    setError(null)
    
    try {
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
    } catch (err) {
      console.error('Error fetching analytics:', err)
      setError('Error al cargar los datos de analítica. Por favor, intenta nuevamente.')
    } finally {
      setLoading(false)
    }
  }
  
  // Fetch on mount and when date preset changes
  useEffect(() => {
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
    <div className="space-y-6">
      {/* Header with date picker and refresh */}
      <div className="flex items-center justify-between">
        <DateRangePicker value={datePreset} onChange={setDatePreset} />
        <Button
          variant="outline"
          size="sm"
          onClick={fetchAnalytics}
          disabled={loading}
        >
          <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
          Actualizar
        </Button>
      </div>
      
      {/* Sales Metrics Cards */}
      <SalesMetricsCards metrics={analytics.salesMetrics} />
      
      {/* Revenue Chart */}
      <RevenueChart
        data={analytics.revenueAnalytics.dailyRevenue}
        title="Ingresos Diarios"
        description="Evolución de ingresos en el período seleccionado"
      />
      
      {/* Category Chart and Popular Items */}
      <div className="grid gap-6 md:grid-cols-2">
        <CategoryChart
          data={analytics.revenueAnalytics.revenueByCategory}
          title="Distribución por Categoría"
          description="Porcentaje de ingresos por categoría"
        />
        
        <PopularItemsList
          items={analytics.popularItems.topItemsByRevenue}
          title="Top 10 Productos por Ingresos"
          sortBy="revenue"
        />
      </div>
      
      {/* QR Usage Stats */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold">Estadísticas de Uso QR</h3>
        <QrUsageStats metrics={analytics.qrUsage} />
      </div>
      
      {/* Last Updated */}
      <p className="text-xs text-muted-foreground text-right">
        Última actualización: {new Date(analytics.lastUpdated).toLocaleString('es-AR')}
      </p>
    </div>
  )
}
