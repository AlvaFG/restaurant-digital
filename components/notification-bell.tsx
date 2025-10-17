"use client"

import { useEffect, useMemo, useState } from "react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { deserializeAlert, getReadyAlerts, getReadyTables } from "@/lib/socket-client-utils"
import { useSocket } from "@/hooks/use-socket"
import { useAlerts } from "@/hooks/use-alerts"
import { useTables } from "@/hooks/use-tables"
import type { SocketEventPayload } from "@/lib/socket"
import { Bell } from "lucide-react"
import Link from "next/link"

type TableMeta = { number?: number }

export function NotificationBell() {
  const { on, off, emit, isConnected, isReconnecting } = useSocket()
  
  // Use useAlerts hook with activeOnly option
  const { 
    activeAlerts,
    acknowledgeAlert: acknowledgeAlertMutation,
    refresh
  } = useAlerts({ activeOnly: true })
  
  // Use useTables hook for table lookups
  const { tables } = useTables()

  const readyTables = useMemo(() => getReadyTables(undefined), [])

  const tablesIndex = useMemo(() => {
    const lookup = new Map<string, TableMeta>()
    
    // Priority 1: Use socket data if available
    readyTables?.tables.forEach((table) => {
      lookup.set(table.id, { number: Number(table.number) })
    })
    
    // Priority 2: Use useTables data
    if (lookup.size === 0) {
      tables.forEach((table) => {
        lookup.set(table.id, { number: Number(table.number) })
      })
    }
    
    return lookup
  }, [readyTables, tables])

  // Socket integration for real-time updates
  useEffect(() => {
    const handleCreated = (payload: SocketEventPayload<"alert.created">) => {
      refresh()
    }

    const handleAcknowledged = (payload: SocketEventPayload<"alert.acknowledged">) => {
      refresh()
    }

    on("alert.created", handleCreated)
    on("alert.acknowledged", handleAcknowledged)

    return () => {
      off("alert.created", handleCreated)
      off("alert.acknowledged", handleAcknowledged)
    }
  }, [off, on, refresh])

  const handleAcknowledge = async (alertId: string) => {
    try {
      await acknowledgeAlertMutation(alertId)
      emit("alert.acknowledged", { alertId, acknowledged: true })
    } catch (error) {
      console.error("[notification-bell] Error acknowledging alert", error)
    }
  }

  const getTimeAgo = (dateString: string) => {
    const date = new Date(dateString)
    const minutes = Math.floor((Date.now() - date.getTime()) / 60000)
    if (minutes < 1) return "Ahora"
    if (minutes < 60) return minutes.toString() + "m"
    const hours = Math.floor(minutes / 60)
    if (hours < 24) return hours.toString() + "h"
    const days = Math.floor(hours / 24)
    return days.toString() + "d"
  }

  const recentAlerts = activeAlerts.slice(0, 5)

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="sm" className="relative">
          <Bell className="h-5 w-5" />
          <span
            className={
              "absolute -top-1 -right-1 h-2 w-2 rounded-full " +
              (isConnected ? "bg-emerald-500" : isReconnecting ? "bg-amber-500" : "bg-muted-foreground") +
              (isReconnecting ? " animate-pulse" : "")
            }
          />
          {activeAlerts.length > 0 && (
            <Badge
              variant="destructive"
              className="absolute -top-1 -right-1 mt-4 h-5 w-5 rounded-full p-0 text-xs"
            >
              {activeAlerts.length > 9 ? "9+" : activeAlerts.length}
            </Badge>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-80">
        <DropdownMenuLabel className="flex items-center justify-between">
          <span>Notificaciones ({activeAlerts.length})</span>
          <Badge variant={isConnected ? "secondary" : "outline"} className={isReconnecting ? "animate-pulse" : undefined}>
            {isConnected ? "En vivo" : isReconnecting ? "Reconectando" : "Sin conexión"}
          </Badge>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />

        {recentAlerts.length === 0 ? (
          <div className="p-4 text-center text-muted-foreground">No hay alertas activas</div>
        ) : (
          <>
            {recentAlerts.map((alert: any) => {
              const tableMeta = tablesIndex.get(alert.table_id || alert.tableId)
              const label = tableMeta?.number ? "Mesa " + tableMeta.number : "Mesa " + (alert.table_id || alert.tableId)
              return (
                <DropdownMenuItem key={alert.id} className="flex flex-col items-start gap-1 p-3">
                  <div className="flex w-full items-center justify-between text-sm font-medium">
                    <span>{label}</span>
                    <span className="text-xs text-muted-foreground">{getTimeAgo(alert.created_at || alert.createdAt)}</span>
                  </div>
                  <span className="text-sm text-muted-foreground">{alert.message}</span>
                  <button
                    type="button"
                    className="text-xs text-primary hover:underline"
                    onClick={() => handleAcknowledge(alert.id)}
                  >
                    Marcar como atendida
                  </button>
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
