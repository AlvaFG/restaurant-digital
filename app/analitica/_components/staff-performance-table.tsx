'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { TrendingUp, TrendingDown, Minus, Trophy } from 'lucide-react'
import type { StaffMetrics, AnalyticsAPIResponse } from '@/lib/types/analytics-extended'
import { Skeleton } from '@/components/ui/skeleton'
import { Progress } from '@/components/ui/progress'

interface StaffPerformanceTableProps {
  dateRange?: {
    from: Date
    to: Date
  }
}

export function StaffPerformanceTable({ dateRange }: StaffPerformanceTableProps) {
  const [data, setData] = useState<StaffMetrics | null>(null)
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

        const url = `/api/analytics/staff-performance${params.toString() ? `?${params.toString()}` : ''}`
        
        const response = await fetch(url)
        
        if (!response.ok) {
          throw new Error('Error al cargar datos de staff')
        }

        const result: AnalyticsAPIResponse<StaffMetrics> = await response.json()
        
        if (result.success && result.data) {
          setData(result.data)
        } else {
          throw new Error(result.error?.message || 'Error desconocido')
        }
      } catch (err) {
        console.error('Error fetching staff performance:', err)
        setError(err instanceof Error ? err.message : 'Error al cargar datos')
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [dateRange])

  const getTrendIcon = (trend: 'improving' | 'stable' | 'declining') => {
    switch (trend) {
      case 'improving':
        return <TrendingUp className="h-4 w-4 text-green-600" />
      case 'declining':
        return <TrendingDown className="h-4 w-4 text-red-600" />
      case 'stable':
        return <Minus className="h-4 w-4 text-gray-600" />
    }
  }

  const getEfficiencyColor = (efficiency: number) => {
    if (efficiency >= 80) return 'text-green-600'
    if (efficiency >= 60) return 'text-yellow-600'
    if (efficiency >= 40) return 'text-orange-600'
    return 'text-red-600'
  }

  const getRoleLabel = (role: string) => {
    const roles: Record<string, string> = {
      waiter: 'Mesero',
      bartender: 'Bartender',
      chef: 'Cocina',
      manager: 'Manager'
    }
    return roles[role] || role
  }

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-48" />
          <Skeleton className="h-4 w-64 mt-2" />
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[1, 2, 3, 4, 5].map((i) => (
              <Skeleton key={i} className="h-16 w-full" />
            ))}
          </div>
        </CardContent>
      </Card>
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

  if (!data || data.performance.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Rendimiento del Staff</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">No hay datos de staff disponibles</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Rendimiento del Staff</CardTitle>
        <CardDescription>
          Métricas de eficiencia, ventas y servicio del equipo
        </CardDescription>
        <div className="flex items-center gap-4 text-sm mt-4">
          <div>
            <span className="text-muted-foreground">Total Staff: </span>
            <span className="font-semibold">{data.summary.totalStaff}</span>
          </div>
          <div>
            <span className="text-muted-foreground">Eficiencia Promedio: </span>
            <span className="font-semibold">{data.summary.averageEfficiency}%</span>
          </div>
          <div className="flex items-center gap-2">
            <Trophy className="h-4 w-4 text-yellow-600" />
            <span className="text-muted-foreground">Top: </span>
            <span className="font-semibold">{data.summary.topPerformer.name}</span>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-12">#</TableHead>
                <TableHead>Staff</TableHead>
                <TableHead>Rol</TableHead>
                <TableHead className="text-right">Pedidos</TableHead>
                <TableHead className="text-right">Tiempo Servicio</TableHead>
                <TableHead className="text-right">Ventas</TableHead>
                <TableHead className="text-right">Ticket Prom.</TableHead>
                <TableHead className="text-right">Propinas</TableHead>
                <TableHead className="text-right">Eficiencia</TableHead>
                <TableHead className="text-center">Tendencia</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.performance.map((staff) => {
                const initials = staff.name
                  .split(' ')
                  .map(n => n[0])
                  .join('')
                  .substring(0, 2)
                  .toUpperCase()

                return (
                  <TableRow key={staff.staffId}>
                    <TableCell className="font-medium">
                      {staff.ranking === 1 && (
                        <Trophy className="h-4 w-4 text-yellow-600" />
                      )}
                      {staff.ranking !== 1 && staff.ranking}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Avatar className="h-8 w-8">
                          <AvatarImage src={staff.avatar} alt={staff.name} />
                          <AvatarFallback>{initials}</AvatarFallback>
                        </Avatar>
                        <span className="font-medium">{staff.name}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">
                        {getRoleLabel(staff.role)}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      {staff.metrics.ordersCompleted}
                      <div className="text-xs text-muted-foreground">
                        {staff.metrics.ordersPerHour}/hora
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      {staff.metrics.averageServiceTime} min
                    </TableCell>
                    <TableCell className="text-right">
                      ${staff.metrics.totalRevenue.toLocaleString()}
                    </TableCell>
                    <TableCell className="text-right">
                      ${staff.metrics.averageTicket}
                    </TableCell>
                    <TableCell className="text-right">
                      ${staff.metrics.totalTips.toLocaleString()}
                      <div className="text-xs text-muted-foreground">
                        {staff.metrics.averageTipPercentage}%
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center gap-2 justify-end">
                        <Progress 
                          value={staff.metrics.efficiency} 
                          className="w-16 h-2"
                        />
                        <span className={`font-semibold ${getEfficiencyColor(staff.metrics.efficiency)}`}>
                          {staff.metrics.efficiency}%
                        </span>
                      </div>
                    </TableCell>
                    <TableCell className="text-center">
                      {getTrendIcon(staff.trend)}
                    </TableCell>
                  </TableRow>
                )
              })}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  )
}
