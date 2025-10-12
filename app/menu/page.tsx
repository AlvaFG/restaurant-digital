import { DashboardLayout } from "@/components/dashboard-layout"

export default function MenuPage() {
  return (
    <DashboardLayout requiredRole="admin">
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-light tracking-tight">Menú</h1>
          <p className="text-muted-foreground font-light">Gestión del menú del restaurante</p>
        </div>

        <div className="flex items-center justify-center h-96 border-2 border-dashed border-muted-foreground/25 rounded-lg">
          <div className="text-center">
            <p className="text-lg font-medium text-muted-foreground">Gestión de Menú</p>
            <p className="text-sm text-muted-foreground">Solo disponible para administradores</p>
          </div>
        </div>
      </div>
    </DashboardLayout>
  )
}
