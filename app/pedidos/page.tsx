import { DashboardLayout } from "@/components/dashboard-layout"
import { OrderForm } from "@/components/order-form"

export default function PedidosPage() {
  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Pedidos</h1>
          <p className="text-muted-foreground">Crear y gestionar pedidos del restaurante</p>
        </div>

        <OrderForm />
      </div>
    </DashboardLayout>
  )
}
