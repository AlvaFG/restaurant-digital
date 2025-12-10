"use client"

import { useTranslations } from "next-intl"
import { useState } from "react"
import dynamic from 'next/dynamic'
import { DashboardLayout } from "@/components/dashboard-layout"
import { AddTableDialog } from "@/components/add-table-dialog"
import { ZonesManagerDialog } from "@/components/zones-manager-dialog"
import { Card, CardContent } from "@/components/ui/card"
import { Info } from "lucide-react"

// Dynamically import Konva-dependent component (no SSR)
const UnifiedSalonView = dynamic(
  () => import('@/components/unified-salon-view').then(mod => mod.UnifiedSalonView),
  { 
    ssr: false,
    loading: () => (
      <div className="flex h-[400px] items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    )
  }
);

export default function TableEditorPage() {
  const tCommon = useTranslations('common')
  const [showAddDialog, setShowAddDialog] = useState(false)
  const [showZonesManager, setShowZonesManager] = useState(false)

  const handleTableCreated = () => {
    // El componente se actualiza automáticamente con React Query
  }

  const handleZonesUpdated = () => {
    // El componente se actualiza automáticamente con React Query
  }

  return (
    <DashboardLayout requiredRole="admin">
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Editor de Layout de Mesas</h1>
          <p className="text-muted-foreground">
            Diseña y configura la disposición visual de las mesas del restaurante
          </p>
        </div>

        <Card className="border-blue-200 bg-blue-50 dark:border-blue-800 dark:bg-blue-950">
          <CardContent className="pt-6">
            <div className="flex gap-3">
              <Info className="h-5 w-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
              <div className="space-y-2 text-sm text-blue-700 dark:text-blue-300">
                <p className="font-medium">Instrucciones para editar el layout:</p>
                <ul className="list-disc list-inside space-y-1 text-blue-600 dark:text-blue-400">
                  <li>Activa el modo edición con el botón "Editar layout"</li>
                  <li>Arrastra las mesas para reposicionarlas en el mapa</li>
                  <li>Haz clic en una mesa para editar sus propiedades (tamaño, forma, capacidad)</li>
                  <li>Los cambios se guardan automáticamente al presionar "{tCommon('save')}"</li>
                  <li>Usa "Deshacer cambios" para revertir modificaciones antes de guardar</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>

        <UnifiedSalonView
          defaultView="map"
          allowEditing={true}
          showManagement={true}
          onAddTable={() => setShowAddDialog(true)}
          onManageZones={() => setShowZonesManager(true)}
        />

        <AddTableDialog
          open={showAddDialog}
          onOpenChange={setShowAddDialog}
          onTableCreated={handleTableCreated}
        />

        <ZonesManagerDialog
          open={showZonesManager}
          onOpenChange={setShowZonesManager}
          onZonesUpdated={handleZonesUpdated}
        />
      </div>
    </DashboardLayout>
  )
}
