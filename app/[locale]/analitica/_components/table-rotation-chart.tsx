'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Line, ComposedChart } from 'recharts'
import type { TableRotation, AnalyticsAPIResponse } from '@/lib/types/analytics-extended'
import { Skeleton } from '@/components/ui/skeleton'
import { Clock, RefreshCw } from 'lucide-react'

interface TableRotationChartProps {
  dateRange?: {
    from: Date
    to: Date
  }
}

export function TableRotationChart({ dateRange }: TableRotationChartProps) {
  const [data, setData] = useState<TableRotation | null>(null)
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

        const url = `/api/analytics/table-rotation${params.toString() ? `?${params.toString()}` : ''}`
        
        const response = await fetch(url)
        
        if (!response.ok) {
          throw new Error('Error al cargar datos de rotación')
        }

        const result: AnalyticsAPIResponse<TableRotation> = await response.json()
        
        if (result.success && result.data) {
          setData(result.data)
        } else {
          throw new Error(result.error?.message || 'Error desconocido')
        }
      } catch (err) {
        console.error('Error fetching table rotation:', err)
        setError(err instanceof Error ? err.message : 'Error al cargar datos')
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [dateRange])

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="grid gap-4 md:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <Card key={i}>
              <CardHeader className="space-y-0 pb-2">
                <Skeleton className="h-4 w-32" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-8 w-20" />
              </CardContent>
            </Card>
          ))}
        </div>
        
        <Card>
          <CardHeader>
            <Skeleton className="h-6 w-48" />
          </CardHeader>
          <CardContent>
            <Skeleton className="h-80 w-full" />
          </CardContent>
        </Card>
      </div>
    )
  }

  if (error) {
    return (
      <Card className="border-red-200 bg-red-50">
        <CardHeader>
          <CardTitle className="text-sm text-red-800">Error</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-red-600">{error}</p>
        </CardContent>
      </Card>
    )
  }

  if (!data) {
    return (
      <Card>
        <CardContent className="pt-6">
          <p className="text-sm text-muted-foreground">No hay datos disponibles</p>
        </CardContent>
      </Card>
    )
  }

  // Formatear datos para el gráfico
  const chartData = data.peakHours.map(hour => ({
    name: hour.hour,
    ocupación: hour.occupancy,
    rotaciones: hour.rotations
  }))

  return (
    <div className="space-y-4">
      {/* Métricas Resumen */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Duración Promedio
            </CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.averageSessionDuration} min</div>
            <p className="text-xs text-muted-foreground">
              Tiempo promedio por mesa
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Rotaciones por Mesa
            </CardTitle>
            <RefreshCw className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.rotationsPerTable}</div>
            <p className="text-xs text-muted-foreground">
              Promedio en el período
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Total Rotaciones
            </CardTitle>
            <RefreshCw className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.totalRotations}</div>
            <p className="text-xs text-muted-foreground">
              Mesas servidas
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Gráfico de Horas Pico */}
      <Card>
        <CardHeader>
          <CardTitle>Ocupación y Rotaciones por Hora</CardTitle>
          <CardDescription>
            Porcentaje de ocupación y número de rotaciones durante el día
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={350}>
            <ComposedChart
              data={chartData}
              margin={{ top: 20, right: 30, left: 0, bottom: 5 }}
            >
              <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
              <XAxis 
                dataKey="name" 
                className="text-xs"
                tick={{ fill: 'hsl(var(--muted-foreground))' }}
              />
              <YAxis 
                yAxisId="left"
                className="text-xs"
                tick={{ fill: 'hsl(var(--muted-foreground))' }}
                label={{ value: 'Ocupación (%)', angle: -90, position: 'insideLeft' }}
              />
              <YAxis 
                yAxisId="right"
                orientation="right"
                className="text-xs"
                tick={{ fill: 'hsl(var(--muted-foreground))' }}
                label={{ value: 'Rotaciones', angle: 90, position: 'insideRight' }}
              />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: 'hsl(var(--card))',
                  border: '1px solid hsl(var(--border))',
                  borderRadius: '8px'
                }}
                labelStyle={{ color: 'hsl(var(--foreground))' }}
              />
              <Legend />
              <Bar 
                yAxisId="left"
                dataKey="ocupación" 
                fill="hsl(var(--primary))" 
                name="Ocupación (%)"
                radius={[4, 4, 0, 0]}
              />
              <Line 
                yAxisId="right"
                type="monotone" 
                dataKey="rotaciones" 
                stroke="hsl(var(--chart-2))" 
                strokeWidth={2}
                name="Rotaciones"
                dot={{ r: 4 }}
              />
            </ComposedChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  )
}
