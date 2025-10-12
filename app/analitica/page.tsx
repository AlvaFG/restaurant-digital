import { DashboardLayout } from "@/components/dashboard-layout"
import { AnalyticsDashboard } from "@/components/analytics-dashboard"

export default function AnaliticaPage() {
  return (
    <DashboardLayout requiredRole="admin">
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-light tracking-tight">Analítica</h1>
          <p className="text-muted-foreground font-light">Reportes y análisis del restaurante</p>
        </div>

        <AnalyticsDashboard />
      </div>
    </DashboardLayout>
  )
}
