import { DashboardLayout } from "@/components/dashboard-layout"
import { ConfigurationPanel } from "@/components/configuration-panel"

export default function ConfiguracionPage() {
  return (
    <DashboardLayout requiredRole="admin">
      <ConfigurationPanel />
    </DashboardLayout>
  )
}
