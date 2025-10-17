"use client"

import dynamic from "next/dynamic"
import { DashboardLayout } from "@/components/dashboard-layout"
import { LoadingSpinner } from "@/components/loading-spinner"

const TableMap = dynamic(
  () => import("@/components/table-map").then(mod => ({ default: mod.TableMap })),
  { 
    ssr: false,
    loading: () => <div className="flex h-[600px] items-center justify-center"><LoadingSpinner /></div>
  }
)

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
