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
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">
            Escaneos Totales
          </CardTitle>
          <QrCode className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">
            {metrics.totalScans}
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            Códigos QR escaneados
          </p>
        </CardContent>
      </Card>
      
      {/* Total Sessions */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">
            Sesiones Creadas
          </CardTitle>
          <Users className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">
            {metrics.totalSessions}
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            Clientes únicos
          </p>
        </CardContent>
      </Card>
      
      {/* Conversion Rate */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">
            Tasa de Conversión
          </CardTitle>
          <TrendingUp className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">
            {formatPercentage(metrics.conversionRate)}
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            {metrics.totalOrders} pedidos realizados
          </p>
        </CardContent>
      </Card>
      
      {/* Average Session Duration */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">
            Duración Promedio
          </CardTitle>
          <ShoppingCart className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">
            {formatDuration(metrics.avgSessionDuration)}
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            Por sesión
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
