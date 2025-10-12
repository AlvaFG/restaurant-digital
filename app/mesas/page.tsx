"use client"

import { useRef, useState } from "react"
import { DashboardLayout } from "@/components/dashboard-layout"
import { TableList, type TableListRef } from "@/components/table-list"
import { AddTableDialog } from "@/components/add-table-dialog"
import { CreateZoneDialog } from "@/components/create-zone-dialog"
import { Button } from "@/components/ui/button"
import { RefreshCw, Plus, MapPinned } from "lucide-react"

export default function MesasPage() {
  const tableListRef = useRef<TableListRef>(null)
  const [showAddDialog, setShowAddDialog] = useState(false)
  const [showZoneDialog, setShowZoneDialog] = useState(false)

  const handleRefresh = () => {
    tableListRef.current?.reload()
  }

  const handleTableCreated = () => {
    // Recargar la lista después de crear una mesa
    tableListRef.current?.reload()
  }

  const handleZoneCreated = () => {
    // Recargar la lista después de crear una zona (para actualizar el filtro)
    tableListRef.current?.reload()
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-3xl font-light tracking-tight">Mesas</h1>
            <p className="text-muted-foreground font-light">Lista y gestión de mesas</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={handleRefresh}>
              <RefreshCw className="mr-2 h-4 w-4" />
              Actualizar
            </Button>
            <Button variant="outline" size="sm" onClick={() => setShowZoneDialog(true)}>
              <MapPinned className="mr-2 h-4 w-4" />
              Crear Zona
            </Button>
            <Button size="sm" onClick={() => setShowAddDialog(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Agregar Mesa
            </Button>
          </div>
        </div>

        <TableList ref={tableListRef} />

        <AddTableDialog
          open={showAddDialog}
          onOpenChange={setShowAddDialog}
          onTableCreated={handleTableCreated}
        />

        <CreateZoneDialog
          open={showZoneDialog}
          onOpenChange={setShowZoneDialog}
          onZoneCreated={handleZoneCreated}
        />
      </div>
    </DashboardLayout>
  )
}
