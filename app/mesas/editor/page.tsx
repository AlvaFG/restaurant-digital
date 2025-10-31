"use client"

import { useState } from "react"
import { DashboardLayout } from "@/components/dashboard-layout"
import { UnifiedSalonView } from "@/components/unified-salon-view"
import { AddTableDialog } from "@/components/add-table-dialog"
import { ZonesManagerDialog } from "@/components/zones-manager-dialog"
import { Card, CardContent } from "@/components/ui/card"
import { Info } from "lucide-react"

export default function TableEditorPage() {
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
                  <li>Los cambios se guardan automáticamente al presionar "Guardar"</li>
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
