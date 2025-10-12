/**
 * QR Usage Stats Component
 * 
 * Displays QR code usage statistics
 */

'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { QrCode, Users, ShoppingCart, TrendingUp } from 'lucide-react'
import type { QrUsageMetrics } from '@/lib/analytics-types'

interface QrUsageStatsProps {
  metrics: QrUsageMetrics
}

export function QrUsageStats({ metrics }: QrUsageStatsProps) {
  // Format duration (seconds to minutes)
  const formatDuration = (seconds: number) => {
    const minutes = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${minutes}m ${secs}s`
  }
  
  // Format percentage
  const formatPercentage = (value: number) => {
    return `${value.toFixed(1)}%`
  }
  
  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      {/* Total Scans */}
      <Card className="border-2 border-border shadow-lg hover:shadow-xl transition-all dark:border-zinc-700 dark:bg-zinc-900 dark:shadow-2xl dark:hover:shadow-zinc-900/50 dark:hover:border-zinc-600">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-light text-muted-foreground dark:text-zinc-400">
            Escaneos Totales
          </CardTitle>
          <div className="rounded-full bg-primary/10 p-2 border-2 border-primary/30 dark:bg-zinc-800 dark:border-zinc-600">
            <QrCode className="h-4 w-4 text-primary dark:text-emerald-400" />
          </div>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-light tracking-tight dark:text-zinc-100">
            {metrics.totalScans}
          </div>
          <p className="text-xs text-muted-foreground font-light mt-1 dark:text-zinc-400">
            Códigos QR escaneados
          </p>
        </CardContent>
      </Card>
      
      {/* Total Sessions */}
      <Card className="border-2 border-border shadow-lg hover:shadow-xl transition-all dark:border-zinc-700 dark:bg-zinc-900 dark:shadow-2xl dark:hover:shadow-zinc-900/50 dark:hover:border-zinc-600">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-light text-muted-foreground dark:text-zinc-400">
            Sesiones Creadas
          </CardTitle>
          <div className="rounded-full bg-chart-2/10 p-2 border-2 border-chart-2/30 dark:bg-zinc-800 dark:border-zinc-600">
            <Users className="h-4 w-4 text-chart-2 dark:text-cyan-400" />
          </div>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-light tracking-tight dark:text-zinc-100">
            {metrics.totalSessions}
          </div>
          <p className="text-xs text-muted-foreground font-light mt-1 dark:text-zinc-400">
            Clientes únicos
          </p>
        </CardContent>
      </Card>
      
      {/* Conversion Rate */}
      <Card className="border-2 border-border shadow-lg hover:shadow-xl transition-all dark:border-zinc-700 dark:bg-zinc-900 dark:shadow-2xl dark:hover:shadow-zinc-900/50 dark:hover:border-zinc-600">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-light text-muted-foreground dark:text-zinc-400">
            Tasa de Conversión
          </CardTitle>
          <div className="rounded-full bg-chart-3/10 p-2 border-2 border-chart-3/30 dark:bg-zinc-800 dark:border-zinc-600">
            <TrendingUp className="h-4 w-4 text-chart-3 dark:text-purple-400" />
          </div>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-light tracking-tight dark:text-zinc-100">
            {formatPercentage(metrics.conversionRate)}
          </div>
          <p className="text-xs text-muted-foreground font-light mt-1 dark:text-zinc-400">
            {metrics.totalOrders} pedidos realizados
          </p>
        </CardContent>
      </Card>
      
      {/* Average Session Duration */}
      <Card className="border-2 border-border shadow-lg hover:shadow-xl transition-all dark:border-zinc-700 dark:bg-zinc-900 dark:shadow-2xl dark:hover:shadow-zinc-900/50 dark:hover:border-zinc-600">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-light text-muted-foreground dark:text-zinc-400">
            Duración Promedio
          </CardTitle>
          <div className="rounded-full bg-chart-4/10 p-2 border-2 border-chart-4/30 dark:bg-zinc-800 dark:border-zinc-600">
            <ShoppingCart className="h-4 w-4 text-chart-4 dark:text-orange-400" />
          </div>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-light tracking-tight dark:text-zinc-100">
            {formatDuration(metrics.avgSessionDuration)}
          </div>
          <p className="text-xs text-muted-foreground font-light mt-1 dark:text-zinc-400">
            Por sesión
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
