import { DashboardLayout } from "@/components/dashboard-layout"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { BrandAwareBadge } from "@/components/brand-aware-badge"
import { MOCK_TABLES, MOCK_ALERTS, MOCK_ANALYTICS } from "@/lib/mock-data"
import { TABLE_STATE } from "@/lib/table-states"
import { Bell, DollarSign, Users, TrendingUp } from "lucide-react"

export default function DashboardPage() {
  const activeAlerts = MOCK_ALERTS.filter((alert) => !alert.acknowledged)
  const occupiedTables = MOCK_TABLES.filter((table) => table.status !== TABLE_STATE.FREE)

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-muted-foreground">Resumen del estado actual del restaurante</p>
        </div>

        {/* KPI Cards */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Ventas del Día</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">${MOCK_ANALYTICS.dailySales.toLocaleString()}</div>
              <p className="text-xs text-muted-foreground">+12% desde ayer</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Ticket Promedio</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">${MOCK_ANALYTICS.averageTicket}</div>
              <p className="text-xs text-muted-foreground">+5% desde ayer</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Ocupación</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{MOCK_ANALYTICS.occupancyRate}%</div>
              <p className="text-xs text-muted-foreground">
                {occupiedTables.length} de {MOCK_TABLES.length} mesas
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Alertas Activas</CardTitle>
              <Bell className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{activeAlerts.length}</div>
              <p className="text-xs text-muted-foreground">Requieren atención</p>
            </CardContent>
          </Card>
        </div>

        {/* Active Alerts */}
        {activeAlerts.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Alertas Pendientes</CardTitle>
              <CardDescription>Alertas que requieren atención inmediata</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {activeAlerts.map((alert) => {
                  const table = MOCK_TABLES.find((t) => t.id === alert.tableId)
                  const priorityColors = {
                    quiere_pagar_efectivo: "bg-red-500",
                    llamar_mozo: "bg-yellow-500",
                    pedido_entrante: "bg-blue-500",
                    pago_aprobado: "bg-green-500",
                  }

                  return (
                    <div key={alert.id} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex items-center gap-3">
                        <div className={`w-3 h-3 rounded-full ${priorityColors[alert.type]}`} />
                        <div>
                          <p className="font-medium">Mesa {table?.number}</p>
                          <p className="text-sm text-muted-foreground">{alert.message}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <BrandAwareBadge variant="outline" className="text-xs" useBrandColor>
                          {Math.floor((Date.now() - alert.createdAt.getTime()) / 60000)}m
                        </BrandAwareBadge>
                      </div>
                    </div>
                  )
                })}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Quick Stats */}
        <div className="grid gap-4 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Estado de Mesas</CardTitle>
              <CardDescription>Distribución actual por estado</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
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
                    <span className="capitalize text-sm">{status.replace("_", " ")}</span>
                    <BrandAwareBadge variant="secondary" useBrandColor>
                      {count}
                    </BrandAwareBadge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Platos Más Pedidos</CardTitle>
              <CardDescription>Top 3 del día</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {MOCK_ANALYTICS.topDishes.slice(0, 3).map((dish, index) => (
                  <div key={dish.name} className="flex justify-between items-center">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium">#{index + 1}</span>
                      <span className="text-sm">{dish.name}</span>
                    </div>
                    <BrandAwareBadge variant="secondary" useBrandColor>
                      {dish.orders}
                    </BrandAwareBadge>
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
