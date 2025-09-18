import { DashboardLayout } from "@/components/dashboard-layout"
import { IntegrationsPanel } from "@/components/integrations-panel"

export default function IntegracionesPage() {
  return (
    <DashboardLayout requiredRole="admin">
      <IntegrationsPanel />
    </DashboardLayout>
  )
}
