"use client"

import dynamic from "next/dynamic"
import { DashboardLayout } from "@/components/dashboard-layout"
import { LoadingSpinner } from "@/components/loading-spinner"

const AnalyticsDashboard = dynamic(
  () => import("@/components/analytics-dashboard").then(mod => ({ default: mod.AnalyticsDashboard })),
  { 
    loading: () => (
      <div className="flex h-[400px] items-center justify-center rounded-lg border">
        <LoadingSpinner />
      </div>
    )
  }
)

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
