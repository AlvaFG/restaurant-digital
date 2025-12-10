"use client"

import dynamic from "next/dynamic"
import { DashboardLayout } from "@/components/dashboard-layout"
import { LoadingSpinner } from "@/components/loading-spinner"
import { ConfigurationErrorBoundary } from "@/components/configuration-panel-wrapper"
import { Suspense } from "react"

const ConfigurationPanel = dynamic(
  () => import("@/components/configuration-panel"),
  { 
    loading: () => <div className="flex h-[400px] items-center justify-center"><LoadingSpinner /></div>,
    ssr: false 
  }
)

export default function ConfiguracionPage() {
  return (
    <DashboardLayout requiredRole="admin">
      <ConfigurationErrorBoundary>
        <Suspense fallback={<div className="flex h-[400px] items-center justify-center"><LoadingSpinner /></div>}>
          <ConfigurationPanel />
        </Suspense>
      </ConfigurationErrorBoundary>
    </DashboardLayout>
  )
}
