"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { useTranslations } from "next-intl"
import { DashboardLayout } from "@/components/dashboard-layout"
import { AddTableDialog } from "@/components/add-table-dialog"
import { ErrorBoundary } from "@/components/error-boundary"
import type { Table } from "@/lib/mock-data"

// Import UnifiedSalonView only on client side
let UnifiedSalonView: any = null

export default function SalonPage() {
  const router = useRouter()
  const t = useTranslations('common')
  const [showAddDialog, setShowAddDialog] = useState(false)
  const [isClient, setIsClient] = useState(false)
  const [Component, setComponent] = useState<any>(null)

  useEffect(() => {
    setIsClient(true)
    // Dynamically import the component on client side only
    import('@/components/unified-salon-view').then((mod) => {
      setComponent(() => mod.UnifiedSalonView)
    }).catch(err => {
      console.error('Error loading UnifiedSalonView:', err)
    })
  }, [])

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

          {!isClient || !Component ? (
            <div className="flex h-[400px] items-center justify-center">
              <div className="text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
                <p className="text-muted-foreground">Cargando salón...</p>
              </div>
            </div>
          ) : (
            <Component
              defaultView="map"
              allowEditing={true}
              showManagement={true}
              onTableClick={handleTableClick}
              onAddTable={() => setShowAddDialog(true)}
            />
          )}

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
