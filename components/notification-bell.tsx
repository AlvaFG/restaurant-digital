"use client"

import { useEffect, useMemo, useState } from "react"
import { useTranslations } from "next-intl"

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
import { ScrollArea } from "@/components/ui/scroll-area"
import { Separator } from "@/components/ui/separator"
import { deserializeAlert, getReadyAlerts, getReadyTables } from "@/lib/socket-client-utils"
import { useSocket } from "@/hooks/use-socket"
import { useAlerts } from "@/hooks/use-alerts"
import { useTables } from "@/hooks/use-tables"
import type { SocketEventPayload } from "@/lib/socket"
import { Bell, AlertCircle, Clock, Info, CheckCircle2 } from "lucide-react"
import Link from "next/link"
import { cn } from "@/lib/utils"

type TableMeta = { number?: number }

// Priority levels for alerts (could be extended in the future)
type AlertPriority = 'critical' | 'high' | 'medium' | 'low'

interface EnhancedAlert {
  id: string
  table_id?: string
  tableId?: string
  message: string
  created_at?: string
  createdAt?: string
  priority: AlertPriority
  type: string
}

// Determine priority based on alert type or message (can be extended)
function getAlertPriority(alert: any): AlertPriority {
  const message = alert.message?.toLowerCase() || ''
  
  if (message.includes('urgente') || message.includes('emergency')) return 'critical'
  if (message.includes('importante') || message.includes('atención')) return 'high'
  if (message.includes('recordatorio')) return 'low'
  
  return 'medium'
}

// Get icon and color based on priority
function getPriorityDisplay(priority: AlertPriority) {
  switch (priority) {
    case 'critical':
      return { icon: AlertCircle, color: 'text-red-500', bgColor: 'bg-red-50 dark:bg-red-950', borderColor: 'border-l-red-500' }
    case 'high':
      return { icon: AlertCircle, color: 'text-orange-500', bgColor: 'bg-orange-50 dark:bg-orange-950', borderColor: 'border-l-orange-500' }
    case 'medium':
      return { icon: Info, color: 'text-blue-500', bgColor: 'bg-blue-50 dark:bg-blue-950', borderColor: 'border-l-blue-500' }
    case 'low':
      return { icon: Clock, color: 'text-gray-500', bgColor: 'bg-gray-50 dark:bg-gray-950', borderColor: 'border-l-gray-500' }
  }
}

export function NotificationBell() {
  const tCommon = useTranslations('common')
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
    if (minutes < 1) return tCommon('now')
    if (minutes < 60) return `${minutes}m`
    const hours = Math.floor(minutes / 60)
    if (hours < 24) return `${hours}h`
    const days = Math.floor(hours / 24)
    return `${days}d`
  }

  // Enhanced alerts with priority
  const enhancedAlerts: EnhancedAlert[] = useMemo(() => {
    return activeAlerts.map((alert: any) => ({
      ...alert,
      priority: getAlertPriority(alert),
      type: alert.type || 'general'
    }))
  }, [activeAlerts])

  // Group alerts by priority for better UX
  const groupedAlerts = useMemo(() => {
    const groups: Record<AlertPriority, EnhancedAlert[]> = {
      critical: [],
      high: [],
      medium: [],
      low: []
    }
    
    enhancedAlerts.forEach(alert => {
      groups[alert.priority].push(alert)
    })
    
    return groups
  }, [enhancedAlerts])

  // Count critical and high priority alerts
  const urgentCount = groupedAlerts.critical.length + groupedAlerts.high.length
  
  // Show up to 8 recent alerts (prioritized)
  const recentAlerts = useMemo(() => {
    return [
      ...groupedAlerts.critical,
      ...groupedAlerts.high,
      ...groupedAlerts.medium,
      ...groupedAlerts.low
    ].slice(0, 8)
  }, [groupedAlerts])

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button 
          variant="ghost" 
          size="sm" 
          className="relative"
          aria-label={`${tCommon('notifications')}: ${activeAlerts.length} ${tCommon('active').toLowerCase()}${urgentCount > 0 ? `, ${urgentCount} ${urgentCount > 1 ? tCommon('urgentPlural') : tCommon('urgent').toLowerCase()}` : ''}`}
        >
          <Bell className="h-5 w-5" />
          <span
            className={cn(
              "absolute -top-1 -right-1 h-2 w-2 rounded-full",
              isConnected ? "bg-emerald-500" : isReconnecting ? "bg-amber-500 animate-pulse" : "bg-muted-foreground"
            )}
            aria-label={isConnected ? tCommon('connected') : isReconnecting ? tCommon('reconnecting') : tCommon('noConnection')}
          />
          {activeAlerts.length > 0 && (
            <Badge
              variant={urgentCount > 0 ? "destructive" : "secondary"}
              className={cn(
                "absolute -top-1 -right-1 mt-4 h-5 w-5 rounded-full p-0 text-xs",
                urgentCount > 0 && "animate-pulse"
              )}
            >
              {activeAlerts.length > 9 ? "9+" : activeAlerts.length}
            </Badge>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-96" role="menu">
        <DropdownMenuLabel className="flex items-center justify-between">
          <span>{tCommon('notifications')} ({activeAlerts.length})</span>
          <div className="flex gap-2">
            {urgentCount > 0 && (
              <Badge variant="destructive" className="animate-pulse">
                {urgentCount} {urgentCount > 1 ? tCommon('urgentPlural') : tCommon('urgent').toLowerCase()}
              </Badge>
            )}
            <Badge variant={isConnected ? "secondary" : "outline"} className={isReconnecting ? "animate-pulse" : undefined}>
              {isConnected ? tCommon('live') : isReconnecting ? tCommon('reconnecting') : tCommon('noConnection')}
            </Badge>
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />

        {recentAlerts.length === 0 ? (
          <div className="p-8 text-center">
            <CheckCircle2 className="h-12 w-12 mx-auto mb-2 text-muted-foreground" />
            <p className="text-sm text-muted-foreground">{tCommon('noActiveAlerts')}</p>
            <p className="text-xs text-muted-foreground mt-1">{tCommon('allUnderControl')}</p>
          </div>
        ) : (
          <>
            <ScrollArea className="max-h-[400px]">
              {recentAlerts.map((alert) => {
                const tableMeta = tablesIndex.get(alert.table_id || alert.tableId || '')
                const label = tableMeta?.number ? `${tCommon('table')} ${tableMeta.number}` : `${tCommon('table')} ${alert.table_id || alert.tableId || 'N/A'}`
                const priorityDisplay = getPriorityDisplay(alert.priority)
                const Icon = priorityDisplay.icon
                
                return (
                  <DropdownMenuItem 
                    key={alert.id} 
                    className={cn(
                      "flex flex-col items-start gap-2 p-3 border-l-4 my-1",
                      priorityDisplay.bgColor,
                      priorityDisplay.borderColor
                    )}
                    role="menuitem"
                  >
                    <div className="flex w-full items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Icon className={cn("h-4 w-4", priorityDisplay.color)} aria-hidden="true" />
                        <span className="text-sm font-medium">{label}</span>
                        {alert.priority === 'critical' && (
                          <Badge variant="destructive" className="text-xs">{tCommon('urgent')}</Badge>
                        )}
                      </div>
                      <span className="text-xs text-muted-foreground">
                        {getTimeAgo(alert.created_at || alert.createdAt || new Date().toISOString())}
                      </span>
                    </div>
                    <p className="text-sm text-muted-foreground w-full">{alert.message}</p>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="text-xs h-7 w-full justify-start"
                      onClick={() => handleAcknowledge(alert.id)}
                    >
                      <CheckCircle2 className="h-3 w-3 mr-1" />
                      {tCommon('markAsAttended')}
                    </Button>
                  </DropdownMenuItem>
                )
              })}
            </ScrollArea>

            <DropdownMenuSeparator />
            <DropdownMenuItem asChild>
              <Link href="/alertas" className="w-full text-center justify-center font-medium">
                {tCommon('viewAllAlerts')} ({activeAlerts.length})
              </Link>
            </DropdownMenuItem>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
