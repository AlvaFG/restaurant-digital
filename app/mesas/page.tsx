import { DashboardLayout } from "@/components/dashboard-layout"
import { TableList } from "@/components/table-list"

export default function MesasPage() {
  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Mesas</h1>
          <p className="text-muted-foreground">Lista y gestión de mesas</p>
        </div>

        <TableList />
      </div>
    </DashboardLayout>
  )
}
