"use client"

import { DashboardLayout } from "@/components/dashboard-layout"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { MOCK_ALERTS } from "@/lib/mock-data"
import { Bell, DollarSign, Users, TrendingUp, AlertCircle, UtensilsCrossed } from "lucide-react"
import { cn } from "@/lib/utils"
import { ProtectedRoute } from "@/components/protected-route"
import { useAuth } from "@/contexts/auth-context"
import { useEffect, useState } from "react"
import { Loader2 } from "lucide-react"

interface Metrics {
  totalOrders: number
  activeOrders: number
  revenue: number
  averageTicket: number
  occupiedTables: number
  totalTables: number
  dailySales: number
  occupancyRate: number
  totalCovers: number
  tablesByStatus: Record<string, number>
  topDishes: Array<{ name: string; orders: number }>
}

export default function DashboardPage() {
  const { user, tenant } = useAuth()
  const [metrics, setMetrics] = useState<Metrics>({
    totalOrders: 0,
    activeOrders: 0,
    revenue: 0,
    averageTicket: 0,
    occupiedTables: 0,
    totalTables: 0,
    dailySales: 5240,
    occupancyRate: 53,
    totalCovers: 128,
    tablesByStatus: {
      "Ocupadas": 8,
      "Libres": 7,
      "Reservadas": 0,
    },
    topDishes: [
      { name: "Pizza Margherita", orders: 23 },
      { name: "Pasta Carbonara", orders: 18 },
      { name: "Ensalada César", orders: 15 },
    ],
  })
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    // Cargar métricas reales desde la API
    const loadMetrics = async () => {
      try {
        if (!user?.tenant_id) {
          console.error('No se encontró tenant_id')
          setIsLoading(false)
          return
        }

        console.log('Cargando métricas para tenant:', user.tenant_id)
        
        const response = await fetch(`/api/dashboard/metrics?tenantId=${user.tenant_id}`)
        
        if (!response.ok) {
          throw new Error('Error al cargar métricas')
        }

        const data = await response.json()
        console.log('Métricas recibidas:', data)

        if (data.data) {
          setMetrics({
            totalOrders: data.data.totalOrdersToday || 0,
            activeOrders: data.data.activeOrders || 0,
            revenue: data.data.dailySales || 0,
            averageTicket: data.data.averageTicket || 0,
            occupiedTables: data.data.occupiedTables || 0,
            totalTables: data.data.totalTables || 0,
            dailySales: data.data.dailySales || 0,
            occupancyRate: data.data.occupancyRate || 0,
            totalCovers: data.data.totalCovers || 0,
            tablesByStatus: data.data.tablesByStatus || {
              occupied: 0,
              available: 0,
              reserved: 0,
            },
            topDishes: data.data.topDishes || [],
          })
        }
      } catch (error) {
        console.error('Error loading metrics:', error)
        // En caso de error, usar datos mock
        setMetrics({
          totalOrders: 0,
          activeOrders: 0,
          revenue: 0,
          averageTicket: 0,
          occupiedTables: 0,
          totalTables: 0,
          dailySales: 0,
          occupancyRate: 0,
          totalCovers: 0,
          tablesByStatus: {
            occupied: 0,
            available: 0,
            reserved: 0,
          },
          topDishes: [{ name: 'Sin datos', orders: 0 }],
        })
      } finally {
        setIsLoading(false)
      }
    }
    
    if (user) {
      loadMetrics()
      
      // Actualizar cada 30 segundos
      const interval = setInterval(loadMetrics, 30000)
      return () => clearInterval(interval)
    }
  }, [user])

  // Alertas (todavía desde mock, hasta implementar tabla de alerts)
  const activeAlerts = MOCK_ALERTS.filter((alert) => !alert.acknowledged)

  // Calcular métricas de crecimiento (por ahora hardcoded, se puede mejorar con comparación histórica)
  const salesGrowth = "+12%"
  const ticketGrowth = "+5%"

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    )
  }

  return (
    <ProtectedRoute>
      <DashboardLayout>
        <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-light tracking-tight">Dashboard</h1>
          <p className="text-muted-foreground font-light">Resumen del estado actual del restaurante</p>
        </div>

        {/* KPI Cards - Diseño moderno con iconos destacados */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {/* Ventas del Día */}
          <Card className="border-2 border-border shadow-lg hover:shadow-xl transition-all dark:border-zinc-700 dark:bg-zinc-900 dark:shadow-2xl dark:hover:shadow-zinc-900/50 dark:hover:border-zinc-600">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-light text-muted-foreground dark:text-zinc-400">
                Ventas del Día
              </CardTitle>
              <div className="rounded-full bg-primary/10 p-2 border-2 border-primary/30 dark:bg-zinc-800 dark:border-zinc-600">
                <DollarSign className="h-4 w-4 text-primary dark:text-emerald-400" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-4xl font-light tracking-tight dark:text-zinc-100">${metrics.dailySales.toLocaleString()}</div>
              <p className="text-xs text-emerald-500 font-light mt-1">
                {salesGrowth} desde ayer
              </p>
            </CardContent>
          </Card>

          {/* Ticket Promedio */}
          <Card className="border-2 border-border shadow-lg hover:shadow-xl transition-all dark:border-zinc-700 dark:bg-zinc-900 dark:shadow-2xl dark:hover:shadow-zinc-900/50 dark:hover:border-zinc-600">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-light text-muted-foreground dark:text-zinc-400">
                Ticket Promedio
              </CardTitle>
              <div className="rounded-full bg-chart-2/10 p-2 border-2 border-chart-2/30 dark:bg-zinc-800 dark:border-zinc-600">
                <TrendingUp className="h-4 w-4 text-chart-2 dark:text-cyan-400" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-4xl font-light tracking-tight dark:text-zinc-100">${metrics.averageTicket}</div>
              <p className="text-xs text-emerald-500 font-light mt-1">
                {ticketGrowth} desde ayer
              </p>
            </CardContent>
          </Card>

          {/* Ocupación */}
          <Card className="border-2 border-border shadow-lg hover:shadow-xl transition-all dark:border-zinc-700 dark:bg-zinc-900 dark:shadow-2xl dark:hover:shadow-zinc-900/50 dark:hover:border-zinc-600">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-light text-muted-foreground dark:text-zinc-400">
                Ocupación
              </CardTitle>
              <div className="rounded-full bg-chart-3/10 p-2 border-2 border-chart-3/30 dark:bg-zinc-800 dark:border-zinc-600">
                <Users className="h-4 w-4 text-chart-3 dark:text-purple-400" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-4xl font-light tracking-tight dark:text-zinc-100">{metrics.occupancyRate}%</div>
              <p className="text-xs text-muted-foreground font-light mt-1 dark:text-zinc-400">
                {metrics.occupiedTables} de {metrics.totalTables} mesas
              </p>
            </CardContent>
          </Card>

          {/* Cubiertos del Día - NUEVA MÉTRICA */}
          <Card className="border-2 border-border shadow-lg hover:shadow-xl transition-all dark:border-zinc-700 dark:bg-zinc-900 dark:shadow-2xl dark:hover:shadow-zinc-900/50 dark:hover:border-zinc-600">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-light text-muted-foreground dark:text-zinc-400">
                Cubiertos del Día
              </CardTitle>
              <div className="rounded-full bg-chart-4/10 p-2 border-2 border-chart-4/30 dark:bg-zinc-800 dark:border-zinc-600">
                <UtensilsCrossed className="h-4 w-4 text-chart-4 dark:text-orange-400" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-4xl font-light tracking-tight dark:text-zinc-100">{metrics.totalCovers}</div>
              <p className="text-xs text-muted-foreground font-light mt-1 dark:text-zinc-400">Personas atendidas hoy</p>
            </CardContent>
          </Card>
        </div>

        {/* Alertas Pendientes - Estilo mejorado */}
        {activeAlerts.length > 0 && (
          <Card className="border-2 border-border shadow-lg dark:border-zinc-700 dark:bg-zinc-900 dark:shadow-2xl">
            <CardHeader className="border-b dark:border-zinc-800 dark:bg-zinc-900/50">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2 font-light dark:text-zinc-100">
                    <AlertCircle className="h-5 w-5" />
                    Alertas Pendientes
                  </CardTitle>
                  <CardDescription className="font-light dark:text-zinc-400">Alertas que requieren atención inmediata</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {activeAlerts.map((alert) => {
                  const alertConfig = {
                    quiere_pagar_efectivo: {
                      color: "bg-red-500",
                      badge: "destructive" as const,
                      icon: "🔴",
                    },
                    llamar_mozo: {
                      color: "bg-yellow-500",
                      badge: "secondary" as const,
                      icon: "🟡",
                    },
                    pedido_entrante: {
                      color: "bg-blue-500",
                      badge: "default" as const,
                      icon: "🔵",
                    },
                    pago_aprobado: {
                      color: "bg-green-500",
                      badge: "secondary" as const,
                      icon: "🟢",
                    },
                  }

                  const config = alertConfig[alert.type] || alertConfig.llamar_mozo

                  return (
                    <div
                      key={alert.id}
                      className="flex items-center justify-between p-4 border-2 border-border rounded-lg shadow-md hover:shadow-lg hover:bg-accent/50 transition-all dark:border-zinc-700 dark:bg-zinc-800/50 dark:hover:bg-zinc-800 dark:hover:border-zinc-600"
                    >
                      <div className="flex items-center gap-4">
                        <div className={cn("w-2 h-2 rounded-full animate-pulse", config.color)} />
                        <div>
                          <p className="font-light dark:text-zinc-100">Mesa {alert.tableId}</p>
                          <p className="text-sm text-muted-foreground font-light dark:text-zinc-400">{alert.message}</p>
                        </div>
                      </div>
                      <Badge variant="outline" className="text-xs font-mono font-light dark:border-zinc-700 dark:text-zinc-400">
                        {Math.floor((Date.now() - alert.createdAt.getTime()) / 60000)}m
                      </Badge>
                    </div>
                  )
                })}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Sección inferior con estadísticas */}
        <div className="grid gap-4 md:grid-cols-2">
          {/* Estado de Mesas */}
          <Card className="border-2 border-border shadow-lg dark:border-zinc-700 dark:bg-zinc-900 dark:shadow-2xl">
            <CardHeader className="border-b dark:border-zinc-800 dark:bg-zinc-900/50">
              <CardTitle className="font-light dark:text-zinc-100">Estado de Mesas</CardTitle>
              <CardDescription className="font-light dark:text-zinc-400">Distribución actual por estado</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {Object.entries(metrics.tablesByStatus).map(([status, count]) => (
                  <div key={status} className="flex justify-between items-center p-2 rounded-lg bg-accent/30 border border-border/50 dark:bg-zinc-800/30 dark:border-transparent">
                    <span className="capitalize text-sm font-light dark:text-zinc-300">
                      {status === "libre"
                        ? "Libre"
                        : status === "ocupada"
                          ? "Ocupada"
                          : status === "reservada"
                            ? "Reservada"
                            : status.replace("_", " ")}
                    </span>
                    <Badge variant="secondary" className="font-light shadow-sm dark:bg-zinc-700 dark:text-zinc-100 dark:border dark:border-zinc-600">
                      {count}
                    </Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Platos Más Pedidos */}
          <Card className="border-2 border-border shadow-lg dark:border-zinc-700 dark:bg-zinc-900 dark:shadow-2xl">
            <CardHeader className="border-b dark:border-zinc-800 dark:bg-zinc-900/50">
              <CardTitle className="font-light dark:text-zinc-100">Platos Más Pedidos</CardTitle>
              <CardDescription className="font-light dark:text-zinc-400">Top 5 del día</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {metrics.topDishes.map((dish, index) => (
                  <div key={dish.name} className="flex justify-between items-center p-2 rounded-lg bg-accent/30 border border-border/50 dark:bg-zinc-800/30 dark:border-transparent">
                    <div className="flex items-center gap-3">
                      <Badge
                        variant="outline"
                        className={cn(
                          "h-6 w-6 rounded-full p-0 flex items-center justify-center font-light border-2",
                          index === 0 && "bg-yellow-500/10 text-yellow-500 border-yellow-500/30",
                          index === 1 && "bg-slate-400/10 text-slate-400 border-slate-400/30 dark:bg-zinc-400/10 dark:text-zinc-400 dark:border-zinc-400/30",
                          index === 2 && "bg-orange-600/10 text-orange-600 border-orange-600/30",
                          index > 2 && "dark:bg-zinc-700 dark:text-zinc-400 dark:border-zinc-600",
                        )}
                      >
                        #{index + 1}
                      </Badge>
                      <span className="text-sm font-light dark:text-zinc-300">{dish.name}</span>
                    </div>
                    <Badge variant="secondary" className="font-light shadow-sm dark:bg-zinc-700 dark:text-zinc-100 dark:border dark:border-zinc-600">
                      {dish.orders}
                    </Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
    </ProtectedRoute>
  )
}
