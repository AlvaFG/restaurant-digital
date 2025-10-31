"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { DashboardLayout } from "@/components/dashboard-layout"
import { UnifiedSalonView } from "@/components/unified-salon-view"
import { AddTableDialog } from "@/components/add-table-dialog"
import { ZonesManagerDialog } from "@/components/zones-manager-dialog"
import type { Table } from "@/lib/mock-data"

export default function MesasPage() {
  const router = useRouter()
  const [showAddDialog, setShowAddDialog] = useState(false)
  const [showZonesManager, setShowZonesManager] = useState(false)

  const handleTableClick = (table: Table) => {
    router.push(`/mesas/${table.id}`)
  }

  const handleTableCreated = () => {
    // El componente se actualiza automáticamente con React Query
  }

  const handleZonesUpdated = () => {
    // El componente se actualiza automáticamente con React Query
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-light tracking-tight">Gestión de Mesas</h1>
          <p className="text-muted-foreground font-light">
            Administra las mesas y organízalas por zonas
          </p>
        </div>

        <UnifiedSalonView
          defaultView="list"
          allowEditing={true}
          showManagement={true}
          onTableClick={handleTableClick}
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
