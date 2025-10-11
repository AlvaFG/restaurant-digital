import { DashboardLayout } from "@/components/dashboard-layout"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { MOCK_TABLES, MOCK_ALERTS, MOCK_ANALYTICS } from "@/lib/mock-data"
import { TABLE_STATE } from "@/lib/table-states"
import { Bell, DollarSign, Users, TrendingUp, AlertCircle } from "lucide-react"
import { cn } from "@/lib/utils"

export default function DashboardPage() {
  const activeAlerts = MOCK_ALERTS.filter((alert) => !alert.acknowledged)
  const occupiedTables = MOCK_TABLES.filter((table) => table.status !== TABLE_STATE.FREE)

  // Calcular métricas
  const salesGrowth = "+12%"
  const ticketGrowth = "+5%"

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-muted-foreground">Resumen del estado actual del restaurante</p>
        </div>

        {/* KPI Cards - Diseño moderno con iconos destacados */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {/* Ventas del Día */}
          <Card className="border-border/40">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Ventas del Día
              </CardTitle>
              <div className="rounded-full bg-primary/10 p-2">
                <DollarSign className="h-4 w-4 text-primary" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">${MOCK_ANALYTICS.dailySales.toLocaleString()}</div>
              <p className="text-xs text-emerald-500 font-medium mt-1">
                {salesGrowth} desde ayer
              </p>
            </CardContent>
          </Card>

          {/* Ticket Promedio */}
          <Card className="border-border/40">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Ticket Promedio
              </CardTitle>
              <div className="rounded-full bg-chart-2/10 p-2">
                <TrendingUp className="h-4 w-4 text-chart-2" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">${MOCK_ANALYTICS.averageTicket}</div>
              <p className="text-xs text-emerald-500 font-medium mt-1">
                {ticketGrowth} desde ayer
              </p>
            </CardContent>
          </Card>

          {/* Ocupación */}
          <Card className="border-border/40">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Ocupación
              </CardTitle>
              <div className="rounded-full bg-chart-3/10 p-2">
                <Users className="h-4 w-4 text-chart-3" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{MOCK_ANALYTICS.occupancyRate}%</div>
              <p className="text-xs text-muted-foreground mt-1">
                {occupiedTables.length} de {MOCK_TABLES.length} mesas
              </p>
            </CardContent>
          </Card>

          {/* Alertas Activas */}
          <Card className="border-border/40">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Alertas Activas
              </CardTitle>
              <div className="rounded-full bg-destructive/10 p-2">
                <Bell className="h-4 w-4 text-destructive" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{activeAlerts.length}</div>
              <p className="text-xs text-muted-foreground mt-1">Requieren atención</p>
            </CardContent>
          </Card>
        </div>

        {/* Alertas Pendientes - Estilo mejorado */}
        {activeAlerts.length > 0 && (
          <Card className="border-border/40">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <AlertCircle className="h-5 w-5" />
                    Alertas Pendientes
                  </CardTitle>
                  <CardDescription>Alertas que requieren atención inmediata</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {activeAlerts.map((alert) => {
                  const table = MOCK_TABLES.find((t) => t.id === alert.tableId)
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
                      className="flex items-center justify-between p-4 border border-border/40 rounded-lg hover:bg-accent/50 transition-colors"
                    >
                      <div className="flex items-center gap-4">
                        <div className={cn("w-2 h-2 rounded-full animate-pulse", config.color)} />
                        <div>
                          <p className="font-semibold">Mesa {table?.number}</p>
                          <p className="text-sm text-muted-foreground">{alert.message}</p>
                        </div>
                      </div>
                      <Badge variant="outline" className="text-xs font-mono">
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
          <Card className="border-border/40">
            <CardHeader>
              <CardTitle>Estado de Mesas</CardTitle>
              <CardDescription>Distribución actual por estado</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {Object.entries(
                  MOCK_TABLES.reduce(
                    (acc, table) => {
                      acc[table.status] = (acc[table.status] || 0) + 1
                      return acc
                    },
                    {} as Record<string, number>,
                  ),
                ).map(([status, count]) => (
                  <div key={status} className="flex justify-between items-center">
                    <span className="capitalize text-sm font-medium">
                      {status === "free" ? "Libre" : status === "occupied" ? "Ocupada" : status.replace("_", " ")}
                    </span>
                    <Badge variant="secondary" className="font-semibold">
                      {count}
                    </Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Platos Más Pedidos */}
          <Card className="border-border/40">
            <CardHeader>
              <CardTitle>Platos Más Pedidos</CardTitle>
              <CardDescription>Top 3 del día</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {MOCK_ANALYTICS.topDishes.slice(0, 3).map((dish, index) => (
                  <div key={dish.name} className="flex justify-between items-center">
                    <div className="flex items-center gap-3">
                      <Badge
                        variant="outline"
                        className={cn(
                          "h-6 w-6 rounded-full p-0 flex items-center justify-center font-bold",
                          index === 0 && "bg-yellow-500/10 text-yellow-500 border-yellow-500/20",
                          index === 1 && "bg-slate-400/10 text-slate-400 border-slate-400/20",
                          index === 2 && "bg-orange-600/10 text-orange-600 border-orange-600/20",
                        )}
                      >
                        #{index + 1}
                      </Badge>
                      <span className="text-sm font-medium">{dish.name}</span>
                    </div>
                    <Badge variant="secondary" className="font-semibold">
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
  )
}
