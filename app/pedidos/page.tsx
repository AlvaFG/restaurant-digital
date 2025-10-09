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
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <h1 className="text-3xl font-bold tracking-tight">Pedidos</h1>
              <p className="text-muted-foreground">
                Crea pedidos manuales y monitorea los que estan en curso desde un solo lugar.
              </p>
            </div>
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
