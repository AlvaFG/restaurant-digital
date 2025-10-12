"use client"

import { useRef } from "react"
import { DashboardLayout } from "@/components/dashboard-layout"
import { TableList, type TableListRef } from "@/components/table-list"
import { Button } from "@/components/ui/button"
import { RefreshCw } from "lucide-react"

export default function MesasPage() {
  const tableListRef = useRef<TableListRef>(null)

  const handleRefresh = () => {
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
          <Button variant="outline" size="sm" onClick={handleRefresh}>
            <RefreshCw className="mr-2 h-4 w-4" />
            Actualizar
          </Button>
        </div>

        <TableList ref={tableListRef} />
      </div>
    </DashboardLayout>
  )
}
