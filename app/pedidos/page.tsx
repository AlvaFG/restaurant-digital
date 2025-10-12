import { OrdersPanelProvider } from "@/app/pedidos/_providers/orders-panel-provider"
import { DashboardLayout } from "@/components/dashboard-layout"
import { OrderForm } from "@/components/order-form"
import { OrdersPanel } from "@/components/orders-panel"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

export default function PedidosPage() {
  return (
    <DashboardLayout>
      <OrdersPanelProvider>
        <Tabs defaultValue="panel" className="space-y-6">
          <div className="flex items-center justify-between">
            <h1 className="text-3xl font-light tracking-tight">Pedidos</h1>
            <TabsList>
              <TabsTrigger value="panel">Panel</TabsTrigger>
              <TabsTrigger value="nuevo">Nuevo pedido</TabsTrigger>
            </TabsList>
          </div>

          <TabsContent value="panel" className="space-y-6">
            <OrdersPanel />
          </TabsContent>

          <TabsContent value="nuevo" className="space-y-6">
            <OrderForm />
          </TabsContent>
        </Tabs>
      </OrdersPanelProvider>
    </DashboardLayout>
  )
}
