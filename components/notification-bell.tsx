"use client"

import { useState, useEffect } from "react"
import { MOCK_ALERTS, MOCK_TABLES } from "@/lib/mock-data"
import type { SocketEventPayload } from "@/lib/socket"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Bell } from "lucide-react"
import Link from "next/link"
import { useSocket } from "@/hooks/use-socket"

export function NotificationBell() {
  const [alerts, setAlerts] = useState(MOCK_ALERTS)
  const { on, off } = useSocket()

  useEffect(() => {
    const handleNewAlert = (data: SocketEventPayload<"alert.created">) => {
      const newAlert = {
        id: `alert-${Date.now()}`,
        type: data.type,
        tableId: data.tableId,
        message: data.message,
        createdAt: new Date(),
        acknowledged: false,
      }

      setAlerts((prev) => [newAlert, ...prev])
    }

    const handleAlertUpdate = (data: SocketEventPayload<"alert.updated">) => {
      setAlerts((prev) =>
        prev.map((alert) => (alert.id === data.alertId ? { ...alert, acknowledged: data.acknowledged } : alert)),
      )
    }

    on("alert.created", handleNewAlert)
    on("alert.updated", handleAlertUpdate)
    on("alert.acknowledged", handleAlertUpdate)

    return () => {
      off("alert.created", handleNewAlert)
      off("alert.updated", handleAlertUpdate)
      off("alert.acknowledged", handleAlertUpdate)
    }
  }, [off, on])

  const activeAlerts = alerts.filter((alert) => !alert.acknowledged)
  const recentAlerts = activeAlerts.slice(0, 5)

  const getTimeAgo = (date: Date) => {
    const minutes = Math.floor((Date.now() - date.getTime()) / 60000)
    if (minutes < 1) return "Ahora"
    if (minutes < 60) return `${minutes}m`
    return `${Math.floor(minutes / 60)}h`
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="sm" className="relative">
          <Bell className="h-5 w-5" />
          {activeAlerts.length > 0 && (
            <Badge
              variant="destructive"
              className="absolute -top-1 -right-1 h-5 w-5 rounded-full p-0 flex items-center justify-center text-xs animate-pulse"
            >
              {activeAlerts.length > 9 ? "9+" : activeAlerts.length}
            </Badge>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-80">
        <DropdownMenuLabel>Notificaciones ({activeAlerts.length})</DropdownMenuLabel>
        <DropdownMenuSeparator />

        {recentAlerts.length === 0 ? (
          <div className="p-4 text-center text-muted-foreground">No hay alertas activas</div>
        ) : (
          <>
            {recentAlerts.map((alert) => {
              const table = MOCK_TABLES.find((t) => t.id === alert.tableId)
              return (
                <DropdownMenuItem key={alert.id} className="flex flex-col items-start p-3 hover:bg-muted/50">
                  <div className="flex items-center justify-between w-full">
                    <span className="font-medium text-sm">Mesa {table?.number || alert.tableId}</span>
                    <span className="text-xs text-muted-foreground">{getTimeAgo(alert.createdAt)}</span>
                  </div>
                  <span className="text-sm text-muted-foreground">{alert.message}</span>
                </DropdownMenuItem>
              )
            })}

            <DropdownMenuSeparator />
            <DropdownMenuItem asChild>
              <Link href="/alertas" className="w-full text-center">
                Ver todas las alertas
              </Link>
            </DropdownMenuItem>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
