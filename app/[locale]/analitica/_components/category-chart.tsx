/**
 * Category Chart Component
 * 
 * Pie chart showing revenue distribution by category
 */

'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts'
import type { PieLabelRenderProps, TooltipProps } from 'recharts'
import type { RevenueByCategory } from '@/lib/analytics-types'

interface CategoryChartProps {
  data: RevenueByCategory[]
  title?: string
  description?: string
}

interface ChartDatum {
  name: string
  value: number
  percentage: number
  orderCount: number
  color: string
}

const COLORS = [
  'hsl(var(--chart-1))',
  'hsl(var(--chart-2))',
  'hsl(var(--chart-3))',
  'hsl(var(--chart-4))',
  'hsl(var(--chart-5))',
]

export function CategoryChart({ data, title, description }: CategoryChartProps) {
  // Format currency
  const formatCurrency = (cents: number) => {
    return new Intl.NumberFormat('es-AR', {
      style: 'currency',
      currency: 'ARS',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(cents / 100)
  }
  
  // Prepare chart data
  const chartData: ChartDatum[] = data.map((item, index) => ({
    name: item.category,
    value: item.revenue / 100, // Convert to ARS
    percentage: item.percentage,
    orderCount: item.orderCount,
    color: COLORS[index % COLORS.length],
  }))
  
  return (
    <Card className="border-2 border-border shadow-lg dark:border-zinc-700 dark:bg-zinc-900 dark:shadow-2xl">
      <CardHeader className="border-b dark:border-zinc-800 dark:bg-zinc-900/50">
        <CardTitle className="font-light dark:text-zinc-100">{title || 'Ingresos por Categoría'}</CardTitle>
        {description && <CardDescription className="font-light dark:text-zinc-400">{description}</CardDescription>}
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={350}>
          <PieChart>
            <Pie
              data={chartData}
              cx="50%"
              cy="50%"
              labelLine={false}
              label={({ payload }: PieLabelRenderProps) => {
                const datum = payload as ChartDatum | undefined
                return `${(datum?.percentage ?? 0).toFixed(0)}%`
              }}
              outerRadius={100}
              fill="#8884d8"
              dataKey="value"
            >
              {chartData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} />
              ))}
            </Pie>
            <Tooltip
              content={(tooltipProps: TooltipProps<number, string>) => {
                const { active, payload } = tooltipProps
                if (!active || !payload || payload.length === 0) {
                  return null
                }

                const datum = payload[0]?.payload as ChartDatum | undefined

                if (!datum) {
                  return null
                }

                return (
                  <div className="rounded-lg border bg-background p-2 shadow-sm">
                    <div className="grid gap-2">
                      <div className="flex flex-col">
                        <span className="text-[0.70rem] uppercase text-muted-foreground">
                          Categoría
                        </span>
                        <span className="font-bold text-muted-foreground">
                          {datum.name}
                        </span>
                      </div>
                      <div className="flex flex-col">
                        <span className="text-[0.70rem] uppercase text-muted-foreground">
                          Ingresos
                        </span>
                        <span className="font-bold">
                          {formatCurrency(datum.value * 100)}
                        </span>
                      </div>
                      <div className="flex flex-col">
                        <span className="text-[0.70rem] uppercase text-muted-foreground">
                          Porcentaje
                        </span>
                        <span className="font-bold">
                          {datum.percentage.toFixed(1)}%
                        </span>
                      </div>
                      <div className="flex flex-col">
                        <span className="text-[0.70rem] uppercase text-muted-foreground">
                          Pedidos
                        </span>
                        <span className="font-bold">
                          {datum.orderCount}
                        </span>
                      </div>
                    </div>
                  </div>
                )
              }}
            />
            <Legend
              verticalAlign="bottom"
              height={36}
              formatter={(value) => <span className="text-sm">{value}</span>}
            />
          </PieChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  )
}
