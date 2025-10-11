import { DashboardLayout } from "@/components/dashboard-layout"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { MOCK_ALERTS } from "@/lib/mock-data"
import { Bell, DollarSign, Users, TrendingUp, AlertCircle, UtensilsCrossed } from "lucide-react"
import { cn } from "@/lib/utils"
import { getDashboardMetrics } from "@/lib/dashboard-service"
import { getCurrentUser } from "@/lib/supabase/server"
import { redirect } from "next/navigation"

export default async function DashboardPage() {
  // Obtener usuario actual
  const user = await getCurrentUser()
  if (!user) {
    redirect("/login")
  }

  // Obtener tenant_id del usuario
  const tenantId = user.user_metadata?.tenant_id || "default-tenant"

  // Obtener métricas reales de Supabase
  const metrics = await getDashboardMetrics(tenantId)

  // Alertas (todavía desde mock, hasta implementar tabla de alerts)
  const activeAlerts = MOCK_ALERTS.filter((alert) => !alert.acknowledged)

  // Calcular métricas de crecimiento (por ahora hardcoded, se puede mejorar con comparación histórica)
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
              <div className="text-3xl font-bold">${metrics.dailySales.toLocaleString()}</div>
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
              <div className="text-3xl font-bold">${metrics.averageTicket}</div>
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
              <div className="text-3xl font-bold">{metrics.occupancyRate}%</div>
              <p className="text-xs text-muted-foreground mt-1">
                {metrics.occupiedTables} de {metrics.totalTables} mesas
              </p>
            </CardContent>
          </Card>

          {/* Cubiertos del Día - NUEVA MÉTRICA */}
          <Card className="border-border/40">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Cubiertos del Día
              </CardTitle>
              <div className="rounded-full bg-chart-4/10 p-2">
                <UtensilsCrossed className="h-4 w-4 text-chart-4" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{metrics.totalCovers}</div>
              <p className="text-xs text-muted-foreground mt-1">Personas atendidas hoy</p>
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
                          <p className="font-semibold">Mesa {alert.tableId}</p>
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
                {Object.entries(metrics.tablesByStatus).map(([status, count]) => (
                  <div key={status} className="flex justify-between items-center">
                    <span className="capitalize text-sm font-medium">
                      {status === "libre"
                        ? "Libre"
                        : status === "ocupada"
                          ? "Ocupada"
                          : status === "reservada"
                            ? "Reservada"
                            : status.replace("_", " ")}
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
              <CardDescription>Top 5 del día</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {metrics.topDishes.map((dish, index) => (
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
