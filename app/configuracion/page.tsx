"use client"

import dynamic from "next/dynamic"
import { DashboardLayout } from "@/components/dashboard-layout"
import { LoadingSpinner } from "@/components/loading-spinner"

const ConfigurationPanel = dynamic(
  () => import("@/components/configuration-panel").then(mod => ({ default: mod.ConfigurationPanel })),
  { loading: () => <div className="flex h-[400px] items-center justify-center"><LoadingSpinner /></div> }
)

export default function ConfiguracionPage() {
  return (
    <DashboardLayout requiredRole="admin">
      <ConfigurationPanel />
    </DashboardLayout>
  )
}
