"use client"

import { useEffect, type ReactNode } from "react"

import { ErrorBoundary } from "@/components/error-boundary"
import { ProtectedRoute } from "@/components/protected-route"
import { SidebarNav } from "@/components/sidebar-nav"
import { ThemeToggle } from "@/components/theme-toggle"
import { useToast } from "@/hooks/use-toast"
import { useSocket } from "@/hooks/use-socket"
import { deserializeAlert, deserializeTable } from "@/lib/socket-client-utils"
import { TABLE_STATE_LABELS } from "@/lib/table-states"
import type { SocketEventPayload } from "@/lib/socket"

interface DashboardLayoutProps {
  children: ReactNode
  requiredRole?: "admin" | "staff"
}

export function DashboardLayout({ children, requiredRole }: DashboardLayoutProps) {
  const { on, off } = useSocket()
  const { toast } = useToast()

  useEffect(() => {
    const handleTableUpdate = (payload: SocketEventPayload<"table.updated">) => {
      const table = deserializeTable(payload.table)
      const label = table.number ? "Mesa " + table.number : "Mesa " + table.id
      const statusLabel = TABLE_STATE_LABELS[table.status] ?? table.status
      toast({
        title: "Mesa actualizada",
        description: label + " ahora está " + statusLabel.toLowerCase(),
      })
    }

    const handleOrderUpdate = (payload: SocketEventPayload<"order.updated">) => {
      const order = payload.order
      toast({
        title: "Pedido actualizado",
        description: "Pedido " + order.id + " ahora está " + order.status,
      })
    }

    const handleNewAlert = (payload: SocketEventPayload<"alert.created">) => {
      const alert = deserializeAlert(payload.alert)
      toast({
        title: "Nueva alerta",
        description: alert.message,
        variant: "destructive",
      })
    }

    on("table.updated", handleTableUpdate)
    on("order.updated", handleOrderUpdate)
    on("alert.created", handleNewAlert)

    return () => {
      off("table.updated", handleTableUpdate)
      off("order.updated", handleOrderUpdate)
      off("alert.created", handleNewAlert)
    }
  }, [off, on, toast])

  return (
    <ProtectedRoute requiredRole={requiredRole}>
      <ErrorBoundary>
        <div className="flex h-screen bg-background dark:bg-black">
          <SidebarNav />
          <main className="flex-1 overflow-auto dark:bg-zinc-950">
            <div className="container mx-auto max-w-7xl p-6 space-y-4">
              {children}
            </div>
          </main>
        </div>
      </ErrorBoundary>
    </ProtectedRoute>
  )
}
