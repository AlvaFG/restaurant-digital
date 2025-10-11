/**
 * Revenue Chart Component
 * 
 * Line chart showing revenue over time
 */

'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import type { RevenueDataPoint } from '@/lib/analytics-types'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'

interface RevenueChartProps {
  data: RevenueDataPoint[]
  title?: string
  description?: string
}

export function RevenueChart({ data, title, description }: RevenueChartProps) {
  // Format currency
  const formatCurrency = (cents: number) => {
    return new Intl.NumberFormat('es-AR', {
      style: 'currency',
      currency: 'ARS',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(cents / 100)
  }
  
  // Format date for x-axis
  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString)
      return format(date, 'd MMM', { locale: es })
    } catch {
      return dateString
    }
  }
  
  // Prepare chart data
  const chartData = data.map(point => ({
    date: point.date,
    dateLabel: formatDate(point.date),
    revenue: point.revenue / 100, // Convert to ARS
    orderCount: point.orderCount,
  }))
  
  return (
    <Card>
      <CardHeader>
        <CardTitle>{title || 'Ingresos en el tiempo'}</CardTitle>
        {description && <CardDescription>{description}</CardDescription>}
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={350}>
          <LineChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis
              dataKey="dateLabel"
              tick={{ fontSize: 12 }}
              tickLine={false}
            />
            <YAxis
              tick={{ fontSize: 12 }}
              tickLine={false}
              tickFormatter={(value) => `$${value.toLocaleString('es-AR')}`}
            />
            <Tooltip
              content={({ active, payload }) => {
                if (!active || !payload || payload.length === 0) {
                  return null
                }
                
                const data = payload[0].payload
                
                return (
                  <div className="rounded-lg border bg-background p-2 shadow-sm">
                    <div className="grid gap-2">
                      <div className="flex flex-col">
                        <span className="text-[0.70rem] uppercase text-muted-foreground">
                          Fecha
                        </span>
                        <span className="font-bold text-muted-foreground">
                          {formatDate(data.date)}
                        </span>
                      </div>
                      <div className="flex flex-col">
                        <span className="text-[0.70rem] uppercase text-muted-foreground">
                          Ingresos
                        </span>
                        <span className="font-bold">
                          {formatCurrency(data.revenue * 100)}
                        </span>
                      </div>
                      <div className="flex flex-col">
                        <span className="text-[0.70rem] uppercase text-muted-foreground">
                          Pedidos
                        </span>
                        <span className="font-bold">
                          {data.orderCount}
                        </span>
                      </div>
                    </div>
                  </div>
                )
              }}
            />
            <Line
              type="monotone"
              dataKey="revenue"
              stroke="hsl(var(--primary))"
              strokeWidth={2}
              dot={{ r: 4 }}
              activeDot={{ r: 6 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  )
}
