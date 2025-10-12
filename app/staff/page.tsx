"use client"

import { DashboardLayout } from "@/components/dashboard-layout"
import { StaffManagementPanel } from "@/components/staff-management-panel"

export default function StaffManagementPage() {
  return (
    <DashboardLayout requiredRole="admin">
      <StaffManagementPanel />
    </DashboardLayout>
  )
}
