"use client"

import { useState } from "react"
import { DashboardLayout } from "@/components/dashboard-layout"
import { TableMap } from "@/components/table-map"
import { AddTableDialog } from "@/components/add-table-dialog"
import { ZonesManagerDialog } from "@/components/zones-manager-dialog"
import { Button } from "@/components/ui/button"
import { useRouter } from "next/navigation"
import { Plus, Layout } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import type { Table } from "@/lib/mock-data"

export default function SalonPage() {
  const router = useRouter()
  const { toast } = useToast()
  const [showAddDialog, setShowAddDialog] = useState(false)
  const [showZonesManager, setShowZonesManager] = useState(false)
  const [refreshKey, setRefreshKey] = useState(0)

  const handleTableClick = (table: Table) => {
    router.push(`/mesas/${table.id}`)
  }

  const handleTableCreated = () => {
    toast({
      title: "Mesa creada",
      description: "La mesa se ha agregado exitosamente al salón.",
    })
    setRefreshKey(prev => prev + 1) // Trigger refresh
  }

  const handleZonesUpdated = () => {
    toast({
      title: "Zonas actualizadas",
      description: "Los cambios en las zonas se han guardado correctamente.",
    })
    setRefreshKey(prev => prev + 1) // Trigger refresh
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">
              Mapa Visual del Restaurante
            </h1>
            <p className="text-muted-foreground">
              Diseña el layout de tu restaurante visto desde arriba con zonas personalizadas
            </p>
          </div>
          <div className="flex gap-2">
            <Button onClick={() => setShowAddDialog(true)} variant="outline">
              <Plus className="mr-2 h-4 w-4" />
              Agregar Mesa
            </Button>
            <Button onClick={() => setShowZonesManager(true)} variant="outline">
              <Layout className="mr-2 h-4 w-4" />
              Gestionar Zonas
            </Button>
          </div>
        </div>

        <TableMap
          key={refreshKey}
          onTableClick={handleTableClick}
          editable={true}
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
