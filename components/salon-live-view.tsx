"use client"

import { memo, useEffect, useMemo, useState } from "react"
import { Bell, ShoppingCart } from "lucide-react"

import { TableMap } from "@/components/table-map"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { LoadingSpinner } from "@/components/loading-spinner"
import { ScrollArea } from "@/components/ui/scroll-area"
import { useTables } from "@/hooks/use-tables"
import { useOrders } from "@/hooks/use-orders"
import { logger } from "@/lib/logger"
import { AlertService, type Alert, type Order } from "@/lib/mock-data"
import { deserializeAlert, deserializeOrderToMock, getReadyAlerts } from "@/lib/socket-client-utils"
import { useSocket } from "@/hooks/use-socket"
import type { SocketEventPayload } from "@/lib/socket"

export function SalonLiveView() {
  return (
    <div className="grid gap-6 lg:grid-cols-4">
      <div className="space-y-4 lg:col-span-3">
        <TableMap editable={false} />
      </div>
      <div className="space-y-4">
        <LiveAlertsPanel />
        <ActiveOrdersPanel />
      </div>
    </div>
  )
}

const LiveAlertsPanel = memo(function LiveAlertsPanel() {
  const { on, off, lastReadyPayload, isConnected, isReconnecting } = useSocket()
  const [alerts, setAlerts] = useState<Alert[]>(() => {
    const snapshot = getReadyAlerts(lastReadyPayload)
    return snapshot ?? []
  })
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    let cancelled = false
    const loadAlerts = async () => {
      try {
        const data = await AlertService.getActiveAlerts()
        if (!cancelled) {
          setAlerts(data)
        }
      } catch (error) {
        logger.error("[SalonLiveView] Failed to load alerts", error instanceof Error ? error : new Error(String(error)))
      } finally {
        if (!cancelled) {
          setIsLoading(false)
        }
      }
    }

    void loadAlerts()

    return () => {
      cancelled = true
    }
  }, [])

  useEffect(() => {
    const snapshot = getReadyAlerts(lastReadyPayload)
    if (snapshot) {
      setAlerts(snapshot)
    }
  }, [lastReadyPayload])

  useEffect(() => {
    const handleCreated = (payload: SocketEventPayload<"alert.created">) => {
      const alert = deserializeAlert(payload.alert)
      setAlerts((previous) => [alert, ...previous])
    }

    const handleUpdated = (payload: SocketEventPayload<"alert.updated">) => {
      setAlerts((previous) =>
        previous
          .map((alert) =>
            alert.id === payload.alertId ? { ...alert, acknowledged: payload.acknowledged } : alert,
          )
          .filter((alert) => !alert.acknowledged),
      )
    }

    on("alert.created", handleCreated)
    on("alert.updated", handleUpdated)

    return () => {
      off("alert.created", handleCreated)
      off("alert.updated", handleUpdated)
    }
  }, [off, on])

  const activeAlerts = alerts.filter((alert) => !alert.acknowledged)

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <Bell className="h-4 w-4" />
          Alertas activas
          <Badge variant={isConnected ? "secondary" : "outline"} className={isReconnecting ? "animate-pulse" : undefined}>
            {isConnected ? "En vivo" : isReconnecting ? "Reconectando" : "Sin conexión"}
          </Badge>
          <Badge variant={activeAlerts.length > 0 ? "destructive" : "outline"} className="ml-auto">
            {activeAlerts.length}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex h-32 items-center justify-center">
            <LoadingSpinner />
          </div>
        ) : activeAlerts.length === 0 ? (
          <p className="text-sm text-muted-foreground">No hay alertas activas en este momento.</p>
        ) : (
          <ScrollArea className="max-h-64 pr-3">
            <div className="space-y-3">
              {activeAlerts.map((alert) => {
                const minutesAgo = Math.max(0, Math.floor((Date.now() - alert.createdAt.getTime()) / 60000))
                const subtitle = minutesAgo + " min"

                return (
                  <div key={alert.id} className="rounded-lg border p-3 text-sm">
                    <div className="flex items-center justify-between">
                      <span className="font-medium">Mesa {alert.tableId}</span>
                      <Badge variant="secondary">{subtitle}</Badge>
                    </div>
                    <p className="text-muted-foreground">{alert.message}</p>
                  </div>
                )
              })}
            </div>
          </ScrollArea>
        )}
      </CardContent>
    </Card>
  )
})

const ActiveOrdersPanel = memo(function ActiveOrdersPanel() {
  const { on, off } = useSocket()
  const { orders: initialOrders } = useOrders()
  const { tables } = useTables()
  
  const [orders, setOrders] = useState<Order[]>(() => 
    (initialOrders as any).filter((order: any) => order.status !== "cerrado")
  )

  const tablesById = useMemo(() => {
    return new Map(tables.map((table) => [table.id, table]))
  }, [tables])

  useEffect(() => {
    const handleOrderEvent = (payload: SocketEventPayload<"order.updated">) => {
      const normalized = deserializeOrderToMock(payload.order)
      setOrders((previous) => {
        const existing = previous.findIndex((order) => order.id === normalized.id)
        let next: Order[]
        if (existing === -1) {
          next = [normalized, ...previous]
        } else {
          next = previous.map((order) => (order.id === normalized.id ? normalized : order))
        }
        return next.filter((order) => order.status !== "cerrado")
      })
    }

    const handleOrderCreated = (payload: SocketEventPayload<"order.created">) => {
      const normalized = deserializeOrderToMock(payload.order)
      setOrders((previous) => [normalized, ...previous])
    }

    on("order.updated", handleOrderEvent)
    on("order.created", handleOrderCreated)

    return () => {
      off("order.updated", handleOrderEvent)
      off("order.created", handleOrderCreated)
    }
  }, [off, on])

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <ShoppingCart className="h-4 w-4" />
          Pedidos activos
          <Badge variant="outline" className="ml-auto">
            {orders.length}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent>
        {orders.length === 0 ? (
          <p className="text-sm text-muted-foreground">No hay pedidos activos.</p>
        ) : (
          <ScrollArea className="max-h-64 pr-3">
            <div className="space-y-3">
              {orders.map((order) => {
                const table = tablesById.get(order.tableId)
                const label = table ? "Mesa " + table.number : "Mesa " + order.tableId
                return (
                  <div key={order.id} className="rounded border p-3 text-sm">
                    <div className="flex items-center justify-between">
                      <span className="font-medium">{label}</span>
                      <Badge variant="secondary">{order.status}</Badge>
                    </div>
                    <p className="text-xs text-muted-foreground">Pedido {order.id}</p>
                  </div>
                )
              })}
            </div>
          </ScrollArea>
        )}
      </CardContent>
    </Card>
  )
})
