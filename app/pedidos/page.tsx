"use client"

import dynamic from "next/dynamic"
import { RefreshCw } from "lucide-react"
import { OrdersPanelProvider, useOrdersPanelContext } from "@/app/pedidos/_providers/orders-panel-provider"
import { DashboardLayout } from "@/components/dashboard-layout"
import { LoadingSpinner } from "@/components/loading-spinner"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"

const OrderForm = dynamic(
  () => import("@/components/order-form").then(mod => ({ default: mod.OrderForm })),
  { loading: () => <div className="flex h-[400px] items-center justify-center"><LoadingSpinner /></div> }
)

const OrdersPanel = dynamic(
  () => import("@/components/orders-panel").then(mod => ({ default: mod.OrdersPanel })),
  { loading: () => <div className="flex h-[400px] items-center justify-center"><LoadingSpinner /></div> }
)

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
