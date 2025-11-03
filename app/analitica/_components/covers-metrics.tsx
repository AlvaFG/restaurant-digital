'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Users, TrendingUp, TrendingDown, Minus } from 'lucide-react'
import type { CoversServed, AnalyticsAPIResponse } from '@/lib/types/analytics-extended'
import { Skeleton } from '@/components/ui/skeleton'

interface CoversMetricsProps {
  tenantId?: string
  dateRange?: {
    from: Date
    to: Date
  }
}

export function CoversMetrics({ tenantId, dateRange }: CoversMetricsProps) {
  const [data, setData] = useState<CoversServed | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function fetchData() {
      setLoading(true)
      setError(null)

      try {
        // Construir URL con parámetros
        const params = new URLSearchParams()
        if (dateRange?.from) {
          params.set('from', dateRange.from.toISOString())
        }
        if (dateRange?.to) {
          params.set('to', dateRange.to.toISOString())
        }

        const url = `/api/analytics/covers${params.toString() ? `?${params.toString()}` : ''}`
        
        const response = await fetch(url)
        
        if (!response.ok) {
          throw new Error('Error al cargar datos de cubiertos')
        }

        const result: AnalyticsAPIResponse<CoversServed> = await response.json()
        
        if (result.success && result.data) {
          setData(result.data)
        } else {
          throw new Error(result.error?.message || 'Error desconocido')
        }
      } catch (err) {
        console.error('Error fetching covers:', err)
        setError(err instanceof Error ? err.message : 'Error al cargar datos')
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [dateRange])

  const getTrendIcon = (trend: 'up' | 'down' | 'stable') => {
    switch (trend) {
      case 'up':
        return <TrendingUp className="h-4 w-4 text-green-600" />
      case 'down':
        return <TrendingDown className="h-4 w-4 text-red-600" />
      case 'stable':
        return <Minus className="h-4 w-4 text-gray-600" />
    }
  }

  const getTrendColor = (trend: 'up' | 'down' | 'stable') => {
    switch (trend) {
      case 'up':
        return 'text-green-600'
      case 'down':
        return 'text-red-600'
      case 'stable':
        return 'text-gray-600'
    }
  }

  if (loading) {
    return (
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {[1, 2, 3, 4].map((i) => (
          <Card key={i}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-4 w-4 rounded-full" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-8 w-16 mb-2" />
              <Skeleton className="h-4 w-20" />
            </CardContent>
          </Card>
        ))}
      </div>
    )
  }

  if (error) {
    return (
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="border-red-200 bg-red-50">
          <CardHeader>
            <CardTitle className="text-sm text-red-800">Error</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-red-600">{error}</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (!data) {
    return (
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-muted-foreground">No hay datos disponibles</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  const metrics = [
    {
      title: 'Hoy',
      value: data.today,
      icon: Users,
      description: 'Cubiertos hoy'
    },
    {
      title: 'Esta Semana',
      value: data.thisWeek,
      icon: Users,
      description: 'Cubiertos esta semana'
    },
    {
      title: 'Este Mes',
      value: data.thisMonth,
      icon: Users,
      description: 'Cubiertos este mes',
      trend: data.trend,
      change: data.percentageChange
    },
    {
      title: 'Este Año',
      value: data.thisYear,
      icon: Users,
      description: 'Cubiertos este año'
    }
  ]

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      {metrics.map((metric) => {
        const Icon = metric.icon
        
        return (
          <Card key={metric.title}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                {metric.title}
              </CardTitle>
              <Icon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{metric.value.toLocaleString()}</div>
              <div className="flex items-center gap-2 mt-1">
                <p className="text-xs text-muted-foreground">
                  {metric.description}
                </p>
                {metric.trend && metric.change !== undefined && (
                  <div className={`flex items-center gap-1 ${getTrendColor(metric.trend)}`}>
                    {getTrendIcon(metric.trend)}
                    <span className="text-xs font-medium">
                      {metric.change > 0 ? '+' : ''}{metric.change.toFixed(1)}%
                    </span>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        )
      })}
    </div>
  )
}
