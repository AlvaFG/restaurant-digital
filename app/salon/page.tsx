"use client"

import { DashboardLayout } from "@/components/dashboard-layout"
import { TableMap } from "@/components/table-map"
import { useRouter } from "next/navigation"
import type { Table } from "@/lib/mock-data"

export default function SalonPage() {
  const router = useRouter()

  const handleTableClick = (table: Table) => {
    // Navigate to table details or orders
    router.push(`/mesas/${table.id}`)
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Salón</h1>
          <p className="text-muted-foreground">Mapa visual de mesas del restaurante</p>
        </div>

        <TableMap onTableClick={handleTableClick} />
      </div>
    </DashboardLayout>
  )
}
