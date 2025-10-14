"use client"

import { RefreshCw } from "lucide-react"
import { OrdersPanelProvider, useOrdersPanelContext } from "@/app/pedidos/_providers/orders-panel-provider"
import { DashboardLayout } from "@/components/dashboard-layout"
import { OrderForm } from "@/components/order-form"
import { OrdersPanel } from "@/components/orders-panel"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"

function PedidosContent() {
  const { refetch, isRefreshing, isLoading } = useOrdersPanelContext()
  const refreshDisabled = isLoading || isRefreshing

  return (
    <Tabs defaultValue="panel" className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-light tracking-tight">Pedidos</h1>
        <div className="flex items-center gap-2">
          <TabsList>
            <TabsTrigger value="panel">Panel</TabsTrigger>
            <TabsTrigger value="nuevo">Nuevo pedido</TabsTrigger>
          </TabsList>
          <Button
            type="button"
            onClick={() => void refetch({ silent: true })}
            variant="outline"
            size="sm"
            aria-label="Actualizar pedidos"
            data-testid="orders-manual-refresh"
            disabled={refreshDisabled}
          >
            <RefreshCw className={`h-4 w-4 ${isRefreshing ? "animate-spin" : ""}`} />
            <span className="sr-only">Actualizar pedidos</span>
          </Button>
        </div>
      </div>

      <TabsContent value="panel" className="space-y-4">
        <OrdersPanel />
      </TabsContent>

      <TabsContent value="nuevo" className="space-y-4">
        <OrderForm />
      </TabsContent>
    </Tabs>
  )
}

export default function PedidosPage() {
  return (
    <DashboardLayout>
      <OrdersPanelProvider>
        <PedidosContent />
      </OrdersPanelProvider>
    </DashboardLayout>
  )
}
