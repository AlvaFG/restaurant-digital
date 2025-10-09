"use client"

import { useEffect, useMemo, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { LoadingSpinner } from "@/components/loading-spinner"
import { fetchLayout } from "@/lib/table-service"
import {
  MOCK_TABLE_LAYOUT,
  MOCK_TABLES,
  type Table,
  type TableMapLayout,
} from "@/lib/mock-data"

interface ZoneSummary {
  id: string
  name: string
  color: string
  tableCount: number
  seatCount: number
  tables: Table[]
}

export function SalonZonesPanel() {
  const [layout, setLayout] = useState<TableMapLayout | null>(null)
  const [tables, setTables] = useState<Table[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false

    const load = async () => {
      setIsLoading(true)
      setErrorMessage(null)

      try {
        const response = await fetchLayout()
        if (cancelled) return

        setLayout(structuredClone(response.layout))
        setTables(structuredClone(response.tables))
      } catch (error) {
        console.error("[SalonZonesPanel] Failed to fetch layout", error)
        if (!cancelled) {
          setLayout(structuredClone(MOCK_TABLE_LAYOUT))
          setTables(structuredClone(MOCK_TABLES))
          setErrorMessage("No se pudo sincronizar el layout. Se muestran datos locales.")
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false)
        }
      }
    }

    void load()

    return () => {
      cancelled = true
    }
  }, [])

  const zoneSummaries = useMemo<ZoneSummary[]>(() => {
    if (!layout) return []

    return layout.zones.map((zone) => {
      const nodes = layout.nodes.filter((node) => node.zone === zone.id)
      const zoneTables = nodes
        .map((node) => tables.find((table) => table.id === node.tableId))
        .filter((table): table is Table => Boolean(table))

      const seatCount = zoneTables.reduce((total, table) => total + (table.seats ?? 0), 0)

      return {
        id: zone.id,
        name: zone.name,
        color: zone.color,
        tableCount: nodes.length,
        seatCount,
        tables: zoneTables,
      }
    })
  }, [layout, tables])

  if (isLoading) {
    return (
      <div className="flex h-64 items-center justify-center rounded-lg border">
        <LoadingSpinner />
      </div>
    )
  }

  if (!layout) {
    return <p className="text-sm text-muted-foreground">No se pudo cargar la configuracion de zonas.</p>
  }

  return (
    <div className="space-y-4">
      {errorMessage ? <p className="text-sm text-destructive">{errorMessage}</p> : null}

      <ScrollArea className="max-h-[32rem] pr-4">
        <div className="grid gap-4 md:grid-cols-2">
          {zoneSummaries.map((zone) => (
            <Card key={zone.id}>
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-base">
                  <span
                    className="inline-flex h-3 w-3 rounded-full"
                    style={{ backgroundColor: zone.color }}
                    aria-hidden
                  />
                  {zone.name}
                  <Badge variant="outline" className="ml-auto">
                    {zone.tableCount} mesas
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm">
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Capacidad estimada</span>
                  <Badge variant="secondary">{zone.seatCount} asientos</Badge>
                </div>

                {zone.tables.length > 0 ? (
                  <div className="space-y-1">
                    <p className="text-muted-foreground">Mesas asignadas</p>
                    <div className="flex flex-wrap gap-2">
                      {zone.tables.map((table) => (
                        <Badge key={table.id} variant="secondary">
                          Mesa {table.number}
                        </Badge>
                      ))}
                    </div>
                  </div>
                ) : (
                  <p className="text-muted-foreground">Sin mesas asignadas</p>
                )}

                <div className="rounded-md border border-dashed p-3 text-xs text-muted-foreground">
                  Para cambios persistentes coordinados con backend, notificar a Lib Logic Owner y Backend Architect.
                </div>

                <div className="flex justify-end">
                  <Button type="button" size="sm" variant="outline" disabled>
                    Configurar (proximo release)
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </ScrollArea>
    </div>
  )
}