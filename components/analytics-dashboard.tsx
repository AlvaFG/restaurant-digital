"use client"

import { MOCK_ANALYTICS } from "@/lib/mock-data"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { DollarSign, Users, TrendingUp, Star } from "lucide-react"
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  Title,
  Tooltip,
  Legend,
} from "chart.js"
import { Bar, Line } from "react-chartjs-2"

ChartJS.register(CategoryScale, LinearScale, BarElement, LineElement, PointElement, Title, Tooltip, Legend)

export function AnalyticsDashboard() {
  // Top dishes chart data
  const topDishesData = {
    labels: MOCK_ANALYTICS.topDishes.map((dish) => dish.name),
    datasets: [
      {
        label: "Pedidos",
        data: MOCK_ANALYTICS.topDishes.map((dish) => dish.orders),
        backgroundColor: "rgba(59, 130, 246, 0.8)",
        borderColor: "rgba(59, 130, 246, 1)",
        borderWidth: 1,
      },
    ],
  }

  // Preparation times chart data
  const preparationTimesData = {
    labels: MOCK_ANALYTICS.preparationTimes.map((time) => time.time),
    datasets: [
      {
        label: "Tiempo Promedio (min)",
        data: MOCK_ANALYTICS.preparationTimes.map((time) => time.avgMinutes),
        borderColor: "rgba(16, 185, 129, 1)",
        backgroundColor: "rgba(16, 185, 129, 0.1)",
        tension: 0.4,
      },
    ],
  }

  const chartOptions = {
    responsive: true,
    plugins: {
      legend: {
        position: "top" as const,
      },
    },
    scales: {
      y: {
        beginAtZero: true,
      },
    },
  }

  return (
    <div className="space-y-6">
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
            <p className="text-xs text-muted-foreground">Promedio del día</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">NPS Score</CardTitle>
            <Star className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{MOCK_ANALYTICS.npsScore}/10</div>
            <p className="text-xs text-muted-foreground">Satisfacción del cliente</p>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Top 5 Platos Más Pedidos</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-80">
              <Bar data={topDishesData} options={chartOptions} />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Tiempo Promedio de Preparación</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-80">
              <Line data={preparationTimesData} options={chartOptions} />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Additional Stats */}
      <div className="grid gap-6 md:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Resumen de Ventas</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex justify-between">
              <span className="text-sm">Pedidos completados:</span>
              <Badge variant="secondary">47</Badge>
            </div>
            <div className="flex justify-between">
              <span className="text-sm">Pedidos cancelados:</span>
              <Badge variant="destructive">3</Badge>
            </div>
            <div className="flex justify-between">
              <span className="text-sm">Tiempo promedio total:</span>
              <Badge variant="outline">22 min</Badge>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Horarios Pico</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex justify-between">
              <span className="text-sm">Almuerzo:</span>
              <span className="text-sm font-medium">12:00 - 14:30</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm">Cena:</span>
              <span className="text-sm font-medium">20:00 - 22:30</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm">Mayor ocupación:</span>
              <span className="text-sm font-medium">21:15</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Feedback Reciente</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center gap-2">
              <div className="flex">
                {[1, 2, 3, 4, 5].map((star) => (
                  <Star
                    key={star}
                    className={`h-4 w-4 ${star <= 4 ? "fill-yellow-400 text-yellow-400" : "text-gray-300"}`}
                  />
                ))}
              </div>
              <span className="text-sm">Excelente servicio</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="flex">
                {[1, 2, 3, 4, 5].map((star) => (
                  <Star
                    key={star}
                    className={`h-4 w-4 ${star <= 5 ? "fill-yellow-400 text-yellow-400" : "text-gray-300"}`}
                  />
                ))}
              </div>
              <span className="text-sm">Comida deliciosa</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="flex">
                {[1, 2, 3, 4, 5].map((star) => (
                  <Star
                    key={star}
                    className={`h-4 w-4 ${star <= 3 ? "fill-yellow-400 text-yellow-400" : "text-gray-300"}`}
                  />
                ))}
              </div>
              <span className="text-sm">Tiempo de espera</span>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
