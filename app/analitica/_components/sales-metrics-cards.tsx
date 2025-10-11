/**
 * Sales Metrics Cards Component
 * 
 * Displays key sales metrics in card format
 */

'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { DollarSign, ShoppingCart, TrendingUp, CheckCircle } from 'lucide-react'
import type { SalesMetrics } from '@/lib/analytics-types'

interface SalesMetricsCardsProps {
  metrics: SalesMetrics
}

export function SalesMetricsCards({ metrics }: SalesMetricsCardsProps) {
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
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      {/* Total Revenue */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">
            Ingresos Totales
          </CardTitle>
          <DollarSign className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">
            {formatCurrency(metrics.totalRevenue)}
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            {metrics.orderCount} pedidos completados
          </p>
        </CardContent>
      </Card>
      
      {/* Order Count */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">
            Total de Pedidos
          </CardTitle>
          <ShoppingCart className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">
            {metrics.orderCount}
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            {metrics.ordersByStatus.preparing} en preparación
          </p>
        </CardContent>
      </Card>
      
      {/* Average Order Value */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">
            Ticket Promedio
          </CardTitle>
          <TrendingUp className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">
            {formatCurrency(metrics.avgOrderValue)}
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            Por pedido completado
          </p>
        </CardContent>
      </Card>
      
      {/* Completion Rate */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">
            Tasa de Completitud
          </CardTitle>
          <CheckCircle className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">
            {formatPercentage(metrics.completionRate)}
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            Pedidos entregados
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
