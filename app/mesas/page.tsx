"use client"

import { useRef, useState } from "react"
import { DashboardLayout } from "@/components/dashboard-layout"
import { TableList, type TableListRef } from "@/components/table-list"
import { AddTableDialog } from "@/components/add-table-dialog"
import { ZonesManagerDialog } from "@/components/zones-manager-dialog"
import { Button } from "@/components/ui/button"
import { RefreshCw, Plus, Settings2 } from "lucide-react"

export default function MesasPage() {
  const tableListRef = useRef<TableListRef>(null)
  const [showAddDialog, setShowAddDialog] = useState(false)
  const [showZonesManager, setShowZonesManager] = useState(false)

  const handleRefresh = () => {
    tableListRef.current?.reload()
  }

  const handleTableCreated = () => {
    tableListRef.current?.reload()
  }

  const handleZonesUpdated = () => {
    tableListRef.current?.reload()
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-3xl font-light tracking-tight">Mesas</h1>
            <p className="text-muted-foreground font-light">
              Gestiona las mesas y organizalas por zonas.
            </p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={handleRefresh}>
              <RefreshCw className="mr-2 h-4 w-4" />
              Actualizar
            </Button>
            <Button variant="outline" size="sm" onClick={() => setShowZonesManager(true)}>
              <Settings2 className="mr-2 h-4 w-4" />
              Editar zonas
            </Button>
            <Button size="sm" onClick={() => setShowAddDialog(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Agregar mesa
            </Button>
          </div>
        </div>

        <TableList ref={tableListRef} />

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
