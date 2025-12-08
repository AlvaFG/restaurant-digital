"use client"

import { useEffect, useMemo, useState } from "react"
import Link from "next/link"
import { useParams } from "next/navigation"
import { DashboardLayout } from "@/components/dashboard-layout"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { LoadingSpinner } from "@/components/loading-spinner"
import { TABLE_STATE_COLORS, TABLE_STATE_LABELS } from "@/lib/table-states"
import { useTables } from "@/hooks/use-tables"
import type { Database } from "@/lib/supabase/database.types"
import { getZoneName } from "@/lib/type-guards"
import { ArrowLeft, Users, MapPin } from "lucide-react"

type Table = Database['public']['Tables']['tables']['Row']

export default function TableDetailPage() {
  const params = useParams()
  const tableId = params.id as string
  const { tables, loading, error: tablesError } = useTables()
  const [error, setError] = useState<string | null>(null)

  const table = useMemo(() => {
    return tables.find(t => t.id === tableId) || null
  }, [tables, tableId])

  useEffect(() => {
    if (!loading && !table && tables.length > 0) {
      setError("No encontramos la mesa solicitada.")
    } else if (tablesError) {
      setError("No se pudo cargar la mesa. Intenta nuevamente.")
    } else {
      setError(null)
    }
  }, [loading, table, tables.length, tablesError])

  const renderHeader = () => (
    <div className="flex items-center gap-4">
      <Link href="/mesas">
        <Button variant="outline" size="sm">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Volver
        </Button>
      </Link>
      <div>
        <h1 className="text-3xl font-bold tracking-tight">
          Mesa {table ? table.number : ""}
        </h1>
        <p className="text-muted-foreground">Detalles y gestion de la mesa</p>
      </div>
    </div>
  )

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {renderHeader()}

        {loading ? (
          <div className="flex h-64 items-center justify-center">
            <LoadingSpinner />
          </div>
        ) : error ? (
          <div className="rounded-md border border-destructive/20 bg-destructive/10 px-4 py-3 text-sm text-destructive">
            {error}
          </div>
        ) : table ? (
          <div className="grid gap-6 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Informacion de la mesa</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="font-medium">Estado:</span>
                  <Badge style={{ backgroundColor: TABLE_STATE_COLORS[table.status as keyof typeof TABLE_STATE_COLORS], color: "white" }}>
                    {TABLE_STATE_LABELS[table.status as keyof typeof TABLE_STATE_LABELS]}
                  </Badge>
                </div>

                <div className="flex items-center justify-between">
                  <span className="font-medium">Zona:</span>
                  <div className="flex items-center gap-2">
                    <MapPin className="h-4 w-4 text-muted-foreground" />
                    <span>{getZoneName(table as any) || "Sin zona"}</span>
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <span className="font-medium">Capacidad:</span>
                  <div className="flex items-center gap-2">
                    <Users className="h-4 w-4 text-muted-foreground" />
                    <span>{table.capacity || "No especificado"} asientos</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Pedido actual</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="py-8 text-center text-muted-foreground">
                  <p>No hay pedidos activos</p>
                  <p className="text-sm">Se mostrara la informacion cuando este disponible</p>
                </div>
              </CardContent>
            </Card>
          </div>
        ) : (
          <div className="rounded-md border border-muted px-4 py-3 text-sm text-muted-foreground">
            No encontramos la mesa solicitada.
          </div>
        )}
      </div>
    </DashboardLayout>
  )
}
