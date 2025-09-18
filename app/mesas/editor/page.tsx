"use client"

import { DashboardLayout } from "@/components/dashboard-layout"
import { TableMap } from "@/components/table-map"

export default function TableEditorPage() {
  return (
    <DashboardLayout requiredRole="admin">
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Editor de Mesas</h1>
          <p className="text-muted-foreground">Diseña y configura el layout de mesas del restaurante</p>
        </div>

        <TableMap editable />
      </div>
    </DashboardLayout>
  )
}
