import { DashboardLayout } from "@/components/dashboard-layout"
import { UsersManagement } from "@/components/users-management"

export default function UsuariosPage() {
  return (
    <DashboardLayout requiredRole="admin">
      <UsersManagement />
    </DashboardLayout>
  )
}
