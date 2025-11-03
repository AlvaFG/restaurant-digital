/**
 * Sales Metrics Cards Component
 * 
 * Displays key sales metrics in card format
 * Optimized with React.memo to prevent unnecessary re-renders
 */

'use client'

import { memo } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { DollarSign, ShoppingCart, TrendingUp, CheckCircle } from 'lucide-react'
import type { SalesMetrics } from '@/lib/analytics-types'

interface SalesMetricsCardsProps {
  metrics: SalesMetrics
}

function SalesMetricsCardsComponent({ metrics }: SalesMetricsCardsProps) {
  // Format currency
  const formatCurrency = (cents: number) => {
    return new Intl.NumberFormat('es-AR', {
      style: 'currency',
      currency: 'ARS',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(cents / 100)
  }
  
  // Format percentage
  const formatPercentage = (value: number) => {
    return `${value.toFixed(1)}%`
  }
  
  return (
    <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
      {/* Total Revenue */}
      <Card className="border-2 border-border shadow-lg hover:shadow-xl transition-all dark:border-zinc-700 dark:bg-zinc-900 dark:shadow-2xl dark:hover:shadow-zinc-900/50 dark:hover:border-zinc-600">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-light text-muted-foreground dark:text-zinc-400">
            Ingresos Totales
          </CardTitle>
          <div className="rounded-full bg-primary/10 p-2 border-2 border-primary/30 dark:bg-zinc-800 dark:border-zinc-600">
            <DollarSign className="h-4 w-4 text-primary dark:text-emerald-400" aria-hidden="true" />
          </div>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-light tracking-tight dark:text-zinc-100">
            {formatCurrency(metrics.totalRevenue)}
          </div>
          <p className="text-xs text-muted-foreground font-light mt-1 dark:text-zinc-400">
            {metrics.orderCount} pedidos completados
          </p>
        </CardContent>
      </Card>
      
      {/* Order Count */}
      <Card className="border-2 border-border shadow-lg hover:shadow-xl transition-all dark:border-zinc-700 dark:bg-zinc-900 dark:shadow-2xl dark:hover:shadow-zinc-900/50 dark:hover:border-zinc-600">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-light text-muted-foreground dark:text-zinc-400">
            Total de Pedidos
          </CardTitle>
          <div className="rounded-full bg-chart-2/10 p-2 border-2 border-chart-2/30 dark:bg-zinc-800 dark:border-zinc-600">
            <ShoppingCart className="h-4 w-4 text-chart-2 dark:text-cyan-400" aria-hidden="true" />
          </div>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-light tracking-tight dark:text-zinc-100">
            {metrics.orderCount}
          </div>
          <p className="text-xs text-muted-foreground font-light mt-1 dark:text-zinc-400">
            {metrics.ordersByStatus.preparing} en preparación
          </p>
        </CardContent>
      </Card>
      
      {/* Average Order Value */}
      <Card className="border-2 border-border shadow-lg hover:shadow-xl transition-all dark:border-zinc-700 dark:bg-zinc-900 dark:shadow-2xl dark:hover:shadow-zinc-900/50 dark:hover:border-zinc-600">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-light text-muted-foreground dark:text-zinc-400">
            Ticket Promedio
          </CardTitle>
          <div className="rounded-full bg-chart-3/10 p-2 border-2 border-chart-3/30 dark:bg-zinc-800 dark:border-zinc-600">
            <TrendingUp className="h-4 w-4 text-chart-3 dark:text-purple-400" aria-hidden="true" />
          </div>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-light tracking-tight dark:text-zinc-100">
            {formatCurrency(metrics.avgOrderValue)}
          </div>
          <p className="text-xs text-muted-foreground font-light mt-1 dark:text-zinc-400">
            Por pedido completado
          </p>
        </CardContent>
      </Card>
      
      {/* Completion Rate */}
      <Card className="border-2 border-border shadow-lg hover:shadow-xl transition-all dark:border-zinc-700 dark:bg-zinc-900 dark:shadow-2xl dark:hover:shadow-zinc-900/50 dark:hover:border-zinc-600">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-light text-muted-foreground dark:text-zinc-400">
            Tasa de Completitud
          </CardTitle>
          <div className="rounded-full bg-chart-4/10 p-2 border-2 border-chart-4/30 dark:bg-zinc-800 dark:border-zinc-600">
            <CheckCircle className="h-4 w-4 text-chart-4 dark:text-orange-400" aria-hidden="true" />
          </div>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-light tracking-tight dark:text-zinc-100">
            {formatPercentage(metrics.completionRate)}
          </div>
          <p className="text-xs text-muted-foreground font-light mt-1 dark:text-zinc-400">
            Pedidos entregados
          </p>
        </CardContent>
      </Card>
    </div>
  )
}

// Memoize component to prevent re-renders when metrics haven't changed
export const SalesMetricsCards = memo(SalesMetricsCardsComponent)
