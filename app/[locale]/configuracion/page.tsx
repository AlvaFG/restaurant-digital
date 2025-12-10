"use client"

import dynamic from "next/dynamic"
import { DashboardLayout } from "@/components/dashboard-layout"
import { LoadingSpinner } from "@/components/loading-spinner"
import { ConfigurationErrorBoundary } from "@/components/configuration-panel-wrapper"
import { Suspense } from "react"

const ConfigurationPanel = dynamic(
  () => import("@/components/configuration-panel")
    .then(mod => {
      // The module has a default export
      if (!mod.default && !mod.ConfigurationPanel) {
        console.error('ConfigurationPanel not found in module')
        throw new Error('ConfigurationPanel export not found')
      }
      // Return the module as-is, it already has default export
      return mod
    })
    .catch(err => {
      console.error('Failed to load ConfigurationPanel:', err)
      return {
        default: () => (
          <div className="container mx-auto max-w-2xl py-8">
            <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-6">
              <h2 className="text-lg font-semibold text-destructive mb-2">Error al cargar la configuración</h2>
              <p className="text-sm text-muted-foreground mb-4">
                No se pudo cargar el panel de configuración. Por favor, recarga la página.
              </p>
              <button 
                onClick={() => window.location.reload()} 
                className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90"
              >
                Recargar
              </button>
            </div>
          </div>
        )
      }
    }),
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
