"use client"

import type React from "react"
import { SidebarNav } from "@/components/sidebar-nav"
import { ProtectedRoute } from "@/components/protected-route"
import { ErrorBoundary } from "@/components/error-boundary"
import { useSocket } from "@/hooks/use-socket"
import { useEffect } from "react"
import { toast } from "@/hooks/use-toast"
import type { SocketEventPayload } from "@/lib/socket"

interface DashboardLayoutProps {
  children: React.ReactNode
  requiredRole?: "admin" | "staff"
}

export function DashboardLayout({ children, requiredRole }: DashboardLayoutProps) {
  const { on, off } = useSocket()

  useEffect(() => {
    const handleTableUpdate = ({ tableId, status }: SocketEventPayload<"table.updated">) => {
      toast({
        title: "Mesa actualizada",
        description: `La mesa ${tableId} cambió a estado ${status}`,
      })
    }

    const handleOrderUpdate = ({ orderId, status }: SocketEventPayload<"order.updated">) => {
      toast({
        title: "Pedido actualizado",
        description: `El pedido ${orderId} ahora está ${status}`,
      })
    }

    const handleNewAlert = ({ message }: SocketEventPayload<"alert.created">) => {
      toast({
        title: "Nueva alerta",
        description: message,
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
  }, [off, on])

  return (
    <ProtectedRoute requiredRole={requiredRole}>
      <ErrorBoundary>
        <div className="flex h-screen bg-background">
          <SidebarNav />
          <main className="flex-1 overflow-auto">
            <div className="container mx-auto p-6 max-w-7xl">{children}</div>
          </main>
        </div>
      </ErrorBoundary>
    </ProtectedRoute>
  )
}
