"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { useTranslations } from "next-intl"
import dynamicImport from 'next/dynamic'
import { DashboardLayout } from "@/components/dashboard-layout"
import { AddTableDialog } from "@/components/add-table-dialog"
import { ErrorBoundary } from "@/components/error-boundary"
import type { Table } from "@/lib/mock-data"

// Dynamically import Konva-dependent component (no SSR)
const UnifiedSalonView = dynamicImport(
  () => import('@/components/unified-salon-view').then(mod => mod.UnifiedSalonView),
  { ssr: false }
);

export default function SalonPage() {
  const router = useRouter()
  const t = useTranslations('common')
  const [showAddDialog, setShowAddDialog] = useState(false)

  const handleTableClick = (table: Table) => {
    router.push(`/mesas/${table.id}`)
  }

  const handleTableCreated = () => {
    // El componente se actualiza automáticamente con React Query
  }

  return (
    <DashboardLayout>
      <ErrorBoundary>
        <div className="space-y-6">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">{t('salonTitle')}</h1>
            <p className="text-muted-foreground">
              {t('salonDescription')}
            </p>
          </div>

          <UnifiedSalonView
            defaultView="map"
            allowEditing={true}
            showManagement={true}
            onTableClick={handleTableClick}
            onAddTable={() => setShowAddDialog(true)}
          />

          <AddTableDialog
            open={showAddDialog}
            onOpenChange={setShowAddDialog}
            onTableCreated={handleTableCreated}
          />
        </div>
      </ErrorBoundary>
    </DashboardLayout>
  )
}
