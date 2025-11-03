import { ZonesManagement } from "@/components/zones-management"
import { DashboardLayout } from "@/components/dashboard-layout"

export default function ZonasConfigPage() {
  return (
    <DashboardLayout requiredRole="admin">
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-light tracking-tight">Gestión de Zonas</h1>
          <p className="text-muted-foreground font-light">
            Administra las zonas y áreas de tu restaurante
          </p>
        </div>
        <ZonesManagement />
      </div>
    </DashboardLayout>
  )
}
