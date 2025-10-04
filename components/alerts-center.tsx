"use client"

import { useEffect, useMemo, useState } from "react"

import {
  ALERT_PRIORITIES,
  ALERT_TYPE_COLORS,
  ALERT_TYPE_LABELS,
  AlertService,
  MOCK_ALERTS,
  MOCK_TABLES,
  type Alert,
} from "@/lib/mock-data"
import { deserializeAlert, getReadyAlerts, getReadyTables } from "@/lib/socket-client-utils"
import { cn } from "@/lib/utils"
import { useSocket } from "@/hooks/use-socket"
import { useToast } from "@/hooks/use-toast"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { LoadingSpinner } from "@/components/loading-spinner"
import { Bell, Check, Clock, Filter, RefreshCw } from "lucide-react"
import type { SocketEventPayload } from "@/lib/socket"

type TableMeta = { number?: number }

function cloneAlerts(source: Alert[]): Alert[] {
  return source.map((alert) => ({ ...alert, createdAt: new Date(alert.createdAt) }))
}

export function AlertsCenter() {
  const { on, off, emit, state, lastReadyPayload, isConnected, isReconnecting } = useSocket()
  const { toast } = useToast()

  const [alerts, setAlerts] = useState<Alert[]>(() => {
    const snapshot = getReadyAlerts(lastReadyPayload)
    return snapshot ?? cloneAlerts(MOCK_ALERTS)
  })
  const [filter, setFilter] = useState<"all" | Alert["type"]>("all")
  const [isLoading, setIsLoading] = useState(false)

  const readyAlerts = useMemo(() => getReadyAlerts(lastReadyPayload), [lastReadyPayload])
  const readyTables = useMemo(() => getReadyTables(lastReadyPayload), [lastReadyPayload])

  const tablesIndex = useMemo(() => {
    const lookup = new Map<string, TableMeta>()
    readyTables?.tables.forEach((table) => {
      lookup.set(table.id, { number: table.number })
    })
    if (lookup.size === 0) {
      for (const table of MOCK_TABLES) {
        lookup.set(table.id, { number: table.number })
      }
    }
    return lookup
  }, [readyTables])

  useEffect(() => {
    if (!state.isReady || !readyAlerts) {
      return
    }
    setAlerts(readyAlerts)
  }, [readyAlerts, state.isReady])

  useEffect(() => {
    const handleReady = (payload: SocketEventPayload<"socket.ready">) => {
      const snapshot = getReadyAlerts(payload)
      if (snapshot) {
        setAlerts(snapshot)
      }
    }

    const handleCreated = (payload: SocketEventPayload<"alert.created">) => {
      const alert = deserializeAlert(payload.alert)
      setAlerts((previous) => [alert, ...previous])
      toast({
        title: "Nueva alerta",
        description: alert.message,
        variant: "destructive",
      })
    }

    const handleUpdated = (payload: SocketEventPayload<"alert.updated">) => {
      setAlerts((previous) =>
        previous.map((alert) =>
          alert.id === payload.alertId ? { ...alert, acknowledged: payload.acknowledged } : alert,
        ),
      )
    }

    const handleAcknowledged = (payload: SocketEventPayload<"alert.acknowledged">) => {
      setAlerts((previous) => previous.filter((alert) => alert.id !== payload.alertId))
    }

    on("socket.ready", handleReady)
    on("alert.created", handleCreated)
    on("alert.updated", handleUpdated)
    on("alert.acknowledged", handleAcknowledged)

    return () => {
      off("socket.ready", handleReady)
      off("alert.created", handleCreated)
      off("alert.updated", handleUpdated)
      off("alert.acknowledged", handleAcknowledged)
    }
  }, [off, on, toast])

  const activeAlerts = alerts.filter((alert) => !alert.acknowledged)
  const acknowledgedAlerts = alerts.filter((alert) => alert.acknowledged)

  const filteredActiveAlerts = filter === "all" ? activeAlerts : activeAlerts.filter((alert) => alert.type === filter)
  const sortedActiveAlerts = [...filteredActiveAlerts].sort(
    (a, b) => ALERT_PRIORITIES[a.type] - ALERT_PRIORITIES[b.type],
  )

  const handleAcknowledge = async (alertId: string) => {
    setIsLoading(true)
    try {
      await AlertService.acknowledgeAlert(alertId)
      emit("alert.acknowledged", { alertId, acknowledged: true })
      toast({
        title: "Alerta confirmada",
        description: "La alerta ha sido marcada como atendida",
      })
    } catch (error) {
      console.error("[alerts-center] Error acknowledging alert", error)
      toast({
        title: "Error",
        description: "No se pudo confirmar la alerta",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleRefresh = async () => {
    setIsLoading(true)
    try {
      const data = await AlertService.getActiveAlerts()
      setAlerts(cloneAlerts(data))
      toast({
        title: "Alertas sincronizadas",
        description: "Se actualizaron las alertas activas",
      })
    } catch (error) {
      console.error("[alerts-center] Error refreshing alerts", error)
      toast({
        title: "Error",
        description: "No se pudieron actualizar las alertas",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const getTimeAgo = (date: Date) => {
    const minutes = Math.floor((Date.now() - date.getTime()) / 60000)
    if (minutes < 1) return "Ahora"
    if (minutes < 60) return minutes.toString() + "m"
    const hours = Math.floor(minutes / 60)
    if (hours < 24) return hours.toString() + "h"
    const days = Math.floor(hours / 24)
    return days.toString() + "d"
  }

  const AlertCard = ({ alert, showAcknowledge = true }: { alert: Alert; showAcknowledge?: boolean }) => {
    const tableMeta = tablesIndex.get(alert.tableId)
    const label = tableMeta?.number ? "Mesa " + tableMeta.number : "Mesa " + alert.tableId

    return (
      <Card className="mb-3 border-l-4" style={{ borderLeftColor: ALERT_TYPE_COLORS[alert.type] }}>
        <CardContent className="p-4">
          <div className="flex items-center justify-between gap-4">
            <div className="flex gap-3">
              <div
                className="flex h-10 w-10 items-center justify-center rounded bg-muted"
                style={{ color: ALERT_TYPE_COLORS[alert.type] }}
              >
                <Bell className="h-5 w-5" />
              </div>
              <div>
                <div className="mb-1 flex items-center gap-2">
                  <span className="font-medium">{label}</span>
                  <Badge variant="outline" className="text-xs">
                    {ALERT_TYPE_LABELS[alert.type]}
                  </Badge>
                </div>
                <p className="mb-2 text-sm text-muted-foreground">{alert.message}</p>
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <Clock className="h-3 w-3" />
                  <span>{getTimeAgo(alert.createdAt)}</span>
                </div>
              </div>
            </div>
            {showAcknowledge && !alert.acknowledged && (
              <Button variant="outline" size="sm" onClick={() => handleAcknowledge(alert.id)} disabled={isLoading}>
                {isLoading ? <LoadingSpinner size="sm" className="mr-2" /> : <Check className="mr-2 h-4 w-4" />}
                Atender
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Centro de Alertas</h1>
          <p className="text-muted-foreground">{activeAlerts.length} alertas activas requieren atención</p>
        </div>
        <div className="flex items-center gap-2">
          <Badge
            variant={isConnected ? "secondary" : "outline"}
            className={cn("flex items-center gap-2", isReconnecting && "animate-pulse")}
          >
            <span
              className={cn("h-2 w-2 rounded-full", {
                "bg-emerald-500": isConnected,
                "bg-amber-500": !isConnected && isReconnecting,
                "bg-muted-foreground": !isConnected && !isReconnecting,
              })}
            />
            {isConnected ? "En vivo" : isReconnecting ? "Reconectando" : "Sin conexión"}
          </Badge>
          <Button variant="outline" size="sm" onClick={handleRefresh} disabled={isLoading}>
            {isLoading ? <LoadingSpinner size="sm" className="mr-2" /> : <RefreshCw className="mr-2 h-4 w-4" />}
            Actualizar
          </Button>
          <Badge variant="destructive" className="text-sm">
            <Bell className="mr-2 h-4 w-4" />
            {activeAlerts.length}
          </Badge>
        </div>
      </div>

      <Tabs defaultValue="active" className="space-y-4">
        <TabsList>
          <TabsTrigger value="active">Activas ({activeAlerts.length})</TabsTrigger>
          <TabsTrigger value="history">Historial ({acknowledgedAlerts.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="active" className="space-y-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-sm">
                <Filter className="h-4 w-4" />
                Filtros
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                <Badge
                  variant={filter === "all" ? "secondary" : "outline"}
                  className="cursor-pointer"
                  onClick={() => setFilter("all")}
                >
                  Todas
                </Badge>
                {Object.keys(ALERT_TYPE_LABELS).map((type) => (
                  <Badge
                    key={type}
                    variant={filter === type ? "secondary" : "outline"}
                    className="cursor-pointer capitalize"
                    onClick={() => setFilter(type as Alert["type"])}
                  >
                    {ALERT_TYPE_LABELS[type as Alert["type"]]}
                  </Badge>
                ))}
              </div>
            </CardContent>
          </Card>

          <ScrollArea className="max-h-[480px] pr-3">
            {sortedActiveAlerts.length === 0 ? (
              <Card className="border-dashed">
                <CardContent className="py-8 text-center text-muted-foreground">
                  No hay alertas activas para el filtro seleccionado.
                </CardContent>
              </Card>
            ) : (
              sortedActiveAlerts.map((alert) => <AlertCard key={alert.id} alert={alert} />)
            )}
          </ScrollArea>
        </TabsContent>

        <TabsContent value="history">
          {acknowledgedAlerts.length === 0 ? (
            <Card className="border-dashed">
              <CardContent className="py-8 text-center text-muted-foreground">
                No hay alertas históricas.
              </CardContent>
            </Card>
          ) : (
            <ScrollArea className="max-h-[480px] pr-3">
              {acknowledgedAlerts.map((alert) => (
                <AlertCard key={alert.id} alert={alert} showAcknowledge={false} />
              ))}
            </ScrollArea>
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}
