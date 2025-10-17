"use client"

import dynamic from "next/dynamic"
import { DashboardLayout } from "@/components/dashboard-layout"
import { LoadingSpinner } from "@/components/loading-spinner"
import { useRouter } from "next/navigation"
import type { Table } from "@/lib/mock-data"

const TableMap = dynamic(
  () => import("@/components/table-map").then(mod => ({ default: mod.TableMap })),
  { 
    ssr: false, // Canvas rendering doesn't work in SSR
    loading: () => (
      <div className="flex h-[600px] items-center justify-center rounded-lg border">
        <LoadingSpinner />
      </div>
    )
  }
)

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
          <h1 className="text-3xl font-light tracking-tight">Salón</h1>
          <p className="text-muted-foreground font-light">Mapa visual de mesas del restaurante</p>
        </div>

        <TableMap onTableClick={handleTableClick} />
      </div>
    </DashboardLayout>
  )
}
