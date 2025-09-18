"use client"

import { useState, useEffect } from "react"
import {
  MOCK_ALERTS,
  MOCK_TABLES,
  ALERT_TYPE_LABELS,
  ALERT_TYPE_COLORS,
  ALERT_PRIORITIES,
  AlertService,
  type Alert,
} from "@/lib/mock-data"
import type { SocketEventPayload } from "@/lib/socket"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Bell, Check, Clock, Filter, RefreshCw } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { useSocket } from "@/hooks/use-socket"
import { LoadingSpinner } from "@/components/loading-spinner"

export function AlertsCenter() {
  const [alerts, setAlerts] = useState<Alert[]>(MOCK_ALERTS)
  const [filter, setFilter] = useState<"all" | Alert["type"]>("all")
  const [isLoading, setIsLoading] = useState(false)
  const { toast } = useToast()
  const { on, off, emit } = useSocket()

  useEffect(() => {
    const handleNewAlert = (data: SocketEventPayload<"alert.created">) => {
      const newAlert: Alert = {
        id: `alert-${Date.now()}`,
        type: data.type,
        tableId: data.tableId,
        message: data.message,
        createdAt: new Date(),
        acknowledged: false,
      }

      setAlerts((prev) => [newAlert, ...prev])

      toast({
        title: "Nueva alerta",
        description: newAlert.message,
        variant: "destructive",
      })
    }

    const handleAlertUpdate = (data: SocketEventPayload<"alert.updated">) => {
      setAlerts((prev) =>
        prev.map((alert) => (alert.id === data.alertId ? { ...alert, acknowledged: data.acknowledged } : alert)),
      )
    }

    on("alert.created", handleNewAlert)
    on("alert.updated", handleAlertUpdate)

    return () => {
      off("alert.created", handleNewAlert)
      off("alert.updated", handleAlertUpdate)
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

      setAlerts((prev) => prev.map((alert) => (alert.id === alertId ? { ...alert, acknowledged: true } : alert)))

      emit("alert.acknowledged", { alertId, acknowledged: true })

      toast({
        title: "Alerta confirmada",
        description: "La alerta ha sido marcada como atendida",
      })
    } catch (error) {
      console.error("[v0] Error acknowledging alert", error)
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
      await new Promise((resolve) => setTimeout(resolve, 1000))

      toast({
        title: "Alertas actualizadas",
        description: "Se han sincronizado las alertas más recientes",
      })
    } catch (error) {
      console.error("[v0] Error refreshing alerts", error)
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
    if (minutes < 60) return `${minutes}m`
    const hours = Math.floor(minutes / 60)
    if (hours < 24) return `${hours}h`
    return `${Math.floor(hours / 24)}d`
  }

  const AlertCard = ({ alert, showAcknowledge = true }: { alert: Alert; showAcknowledge?: boolean }) => {
    const table = MOCK_TABLES.find((table) => table.id === alert.tableId)

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
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-medium">Mesa {table?.number}</span>
                  <Badge variant="outline" className="text-xs">
                    {ALERT_TYPE_LABELS[alert.type]}
                  </Badge>
                </div>
                <p className="text-sm text-muted-foreground mb-2">{alert.message}</p>
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <Clock className="h-3 w-3" />
                  <span>{getTimeAgo(alert.createdAt)}</span>
                </div>
              </div>
            </div>
            {showAcknowledge && !alert.acknowledged && (
              <Button variant="outline" size="sm" onClick={() => handleAcknowledge(alert.id)} disabled={isLoading}>
                {isLoading ? <LoadingSpinner size="sm" className="mr-2" /> : <Check className="h-4 w-4 mr-2" />}
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
          <Button variant="outline" size="sm" onClick={handleRefresh} disabled={isLoading}>
            {isLoading ? <LoadingSpinner size="sm" className="mr-2" /> : <RefreshCw className="h-4 w-4 mr-2" />}
            Actualizar
          </Button>
          <Badge variant="destructive" className="text-sm">
            <Bell className="h-4 w-4 mr-2" />
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
              <CardTitle className="text-sm flex items-center gap-2">
                <Filter className="h-4 w-4" />
                Filtros
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                <Button variant={filter === "all" ? "default" : "outline"} size="sm" onClick={() => setFilter("all")}>
                  Todas ({activeAlerts.length})
                </Button>
                {Object.entries(ALERT_TYPE_LABELS).map(([type, label]) => {
                  const count = activeAlerts.filter((a) => a.type === type).length
                  return (
                    <Button
                      key={type}
                      variant={filter === type ? "default" : "outline"}
                      size="sm"
                      onClick={() => setFilter(type as Alert["type"])}
                      disabled={count === 0}
                    >
                      {label} ({count})
                    </Button>
                  )
                })}
              </div>
            </CardContent>
          </Card>

          <ScrollArea className="h-96">
            {sortedActiveAlerts.length === 0 ? (
              <Card>
                <CardContent className="p-8 text-center">
                  <Bell className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <p className="text-muted-foreground">
                    {filter === "all"
                      ? "No hay alertas activas"
                      : `No hay alertas de tipo "${ALERT_TYPE_LABELS[filter as Alert["type"]]}"`}
                  </p>
                </CardContent>
              </Card>
            ) : (
              <div>
                {sortedActiveAlerts.map((alert) => (
                  <AlertCard key={alert.id} alert={alert} />
                ))}
              </div>
            )}
          </ScrollArea>
        </TabsContent>

        <TabsContent value="history" className="space-y-4">
          <ScrollArea className="h-96">
            {acknowledgedAlerts.length === 0 ? (
              <Card>
                <CardContent className="p-8 text-center">
                  <Check className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <p className="text-muted-foreground">No hay alertas en el historial</p>
                </CardContent>
              </Card>
            ) : (
              <div>
                {acknowledgedAlerts.map((alert) => (
                  <AlertCard key={alert.id} alert={alert} showAcknowledge={false} />
                ))}
              </div>
            )}
          </ScrollArea>
        </TabsContent>
      </Tabs>
    </div>
  )
}


