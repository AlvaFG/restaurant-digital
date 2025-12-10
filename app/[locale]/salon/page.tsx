"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { useTranslations } from "next-intl"
import dynamicImport from 'next/dynamic'
import { DashboardLayout } from "@/components/dashboard-layout"
import { AddTableDialog } from "@/components/add-table-dialog"
import { ErrorBoundary } from "@/components/error-boundary"
import { useAuth } from "@/contexts/auth-context"
import type { Table } from "@/lib/mock-data"

// Dynamically import Konva-dependent component (no SSR)
const UnifiedSalonView = dynamicImport(
  () => import('@/components/unified-salon-view').then(mod => {
    console.log('✅ UnifiedSalonView module loaded successfully', Object.keys(mod))
    if (!mod.UnifiedSalonView) {
      console.error('❌ UnifiedSalonView not found in module. Available exports:', Object.keys(mod))
      throw new Error('UnifiedSalonView export not found')
    }
    return { default: mod.UnifiedSalonView }
  }).catch(err => {
    console.error('❌ Failed to load UnifiedSalonView:', err)
    console.error('Error details:', {
      message: err.message,
      stack: err.stack,
      name: err.name
    })
    // Return a proper default export component
    return {
      default: () => (
        <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-6">
          <h2 className="text-lg font-semibold text-destructive mb-2">Error al cargar el salón</h2>
          <p className="text-sm text-muted-foreground mb-4">
            No se pudo cargar la vista del salón.
          </p>
          <details className="mt-4 text-xs">
            <summary className="cursor-pointer font-medium mb-2">Detalles del error (para desarrolladores)</summary>
            <pre className="mt-2 p-3 bg-muted rounded overflow-auto text-left">
              {JSON.stringify({
                error: err.message,
                name: err.name,
                timestamp: new Date().toISOString()
              }, null, 2)}
            </pre>
          </details>
          <button 
            onClick={() => window.location.reload()} 
            className="mt-4 px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90"
          >
            Recargar
          </button>
        </div>
      )
    }
  }),
  { ssr: false }
);

export default function SalonPage() {
  const router = useRouter()
  const t = useTranslations('common')
  const [showAddDialog, setShowAddDialog] = useState(false)
  const { isHydrated } = useAuth()

  const handleTableClick = (table: Table) => {
    router.push(`/mesas/${table.id}`)
  }

  const handleTableCreated = () => {
    // El componente se actualiza automáticamente con React Query
  }

  // Wait for auth to hydrate before rendering
  if (!isHydrated) {
    return (
      <DashboardLayout>
        <div className="flex h-[400px] items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-muted-foreground">Cargando...</p>
          </div>
        </div>
      </DashboardLayout>
    )
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
