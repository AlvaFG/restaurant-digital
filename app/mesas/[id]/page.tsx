"use client"

import { DashboardLayout } from "@/components/dashboard-layout"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { MOCK_TABLES, TABLE_STATUS_COLORS, TABLE_STATUS_LABELS } from "@/lib/mock-data"
import { ArrowLeft, Users, MapPin } from "lucide-react"
import Link from "next/link"
import { useParams } from "next/navigation"

export default function TableDetailPage() {
  const params = useParams()
  const tableId = params.id as string
  const table = MOCK_TABLES.find((t) => t.id === tableId)

  if (!table) {
    return (
      <DashboardLayout>
        <div className="space-y-6">
          <div className="flex items-center gap-4">
            <Link href="/mesas">
              <Button variant="outline" size="sm">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Volver
              </Button>
            </Link>
            <h1 className="text-3xl font-bold tracking-tight">Mesa no encontrada</h1>
          </div>
        </div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Link href="/mesas">
            <Button variant="outline" size="sm">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Volver
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Mesa {table.number}</h1>
            <p className="text-muted-foreground">Detalles y gestión de la mesa</p>
          </div>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Información de la Mesa</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="font-medium">Estado:</span>
                <Badge
                  style={{
                    backgroundColor: TABLE_STATUS_COLORS[table.status],
                    color: "white",
                  }}
                >
                  {TABLE_STATUS_LABELS[table.status]}
                </Badge>
              </div>

              <div className="flex items-center justify-between">
                <span className="font-medium">Zona:</span>
                <div className="flex items-center gap-2">
                  <MapPin className="h-4 w-4 text-muted-foreground" />
                  <span>{table.zone || "Sin zona"}</span>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <span className="font-medium">Capacidad:</span>
                <div className="flex items-center gap-2">
                  <Users className="h-4 w-4 text-muted-foreground" />
                  <span>{table.seats || "No especificado"} asientos</span>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Pedido Actual</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8 text-muted-foreground">
                <p>No hay pedidos activos</p>
                <p className="text-sm">Los pedidos se mostrarán en la siguiente tarea</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  )
}
