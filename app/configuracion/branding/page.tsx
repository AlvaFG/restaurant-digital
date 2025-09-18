import { DashboardLayout } from "@/components/dashboard-layout"
import { ThemeCustomizer } from "@/components/theme-customizer"

export default function BrandingPage() {
  return (
    <DashboardLayout requiredRole="admin">
      <ThemeCustomizer />
    </DashboardLayout>
  )
}
