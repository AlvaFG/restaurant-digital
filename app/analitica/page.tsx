"use client"

import dynamic from "next/dynamic"
import { useTranslations } from "next-intl"
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
  const t = useTranslations('common')
  
  return (
    <DashboardLayout requiredRole="admin">
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-light tracking-tight">{t('analyticsTitle')}</h1>
          <p className="text-muted-foreground font-light">{t('analyticsDescription')}</p>
        </div>

        <AnalyticsDashboard />
      </div>
    </DashboardLayout>
  )
}
