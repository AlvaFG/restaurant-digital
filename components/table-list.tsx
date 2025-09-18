"use client"

import { useState } from "react"
import { MOCK_TABLES, TABLE_STATUS_COLORS, TABLE_STATUS_LABELS, TableService, type Table } from "@/lib/mock-data"
import { useAuth } from "@/contexts/auth-context"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Gift, RotateCcw, Eye, Users, MapPin } from "lucide-react"

export function TableList() {
  const { user } = useAuth()
  const [selectedTable, setSelectedTable] = useState<Table | null>(null)
  const [showInviteDialog, setShowInviteDialog] = useState(false)
  const [showResetDialog, setShowResetDialog] = useState(false)
  const [isLoading, setIsLoading] = useState(false)

  const handleInvitarLaCasa = async () => {
    if (!selectedTable) return

    setIsLoading(true)
    try {
      await TableService.invitarLaCasa(selectedTable.id)
      setShowInviteDialog(false)
      setSelectedTable(null)
      // In real app: refresh table data
    } catch (error) {
      console.error("Error invitando la casa:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleResetearMesa = async () => {
    if (!selectedTable) return

    setIsLoading(true)
    try {
      await TableService.resetearMesa(selectedTable.id)
      setShowResetDialog(false)
      setSelectedTable(null)
      // In real app: refresh table data
    } catch (error) {
      console.error("Error reseteando mesa:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const getStatusBadgeVariant = (status: Table["status"]) => {
    switch (status) {
      case "libre":
        return "default"
      case "ocupada":
        return "secondary"
      case "pidió":
        return "default"
      case "cuenta_solicitada":
        return "destructive"
      case "pago_confirmado":
        return "default"
      default:
        return "outline"
    }
  }

  return (
    <div className="space-y-6">
      {/* Tables Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {MOCK_TABLES.map((table) => (
          <Card key={table.id} className="cursor-pointer hover:shadow-md transition-shadow">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg">Mesa {table.number}</CardTitle>
                <Badge
                  variant={getStatusBadgeVariant(table.status)}
                  style={{
                    backgroundColor: TABLE_STATUS_COLORS[table.status],
                    color: "white",
                  }}
                >
                  {TABLE_STATUS_LABELS[table.status]}
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <MapPin className="h-4 w-4" />
                  {table.zone || "Sin zona"}
                </div>
                {table.seats && (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Users className="h-4 w-4" />
                    {table.seats} asientos
                  </div>
                )}

                <div className="flex gap-2 pt-2">
                  <Button variant="outline" size="sm" onClick={() => setSelectedTable(table)} className="flex-1">
                    <Eye className="h-4 w-4 mr-2" />
                    Ver Detalles
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Table Details Dialog */}
      <Dialog open={!!selectedTable} onOpenChange={() => setSelectedTable(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Mesa {selectedTable?.number}</DialogTitle>
            <DialogDescription>Detalles y acciones disponibles</DialogDescription>
          </DialogHeader>

          {selectedTable && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="font-medium">Estado:</span>
                  <Badge
                    className="ml-2"
                    style={{
                      backgroundColor: TABLE_STATUS_COLORS[selectedTable.status],
                      color: "white",
                    }}
                  >
                    {TABLE_STATUS_LABELS[selectedTable.status]}
                  </Badge>
                </div>
                <div>
                  <span className="font-medium">Zona:</span>
                  <span className="ml-2">{selectedTable.zone || "Sin zona"}</span>
                </div>
                <div>
                  <span className="font-medium">Asientos:</span>
                  <span className="ml-2">{selectedTable.seats || "No especificado"}</span>
                </div>
              </div>

              {/* Staff Actions */}
              {user?.role === "staff" && selectedTable.status !== "libre" && (
                <div className="space-y-2 pt-4 border-t">
                  <p className="text-sm font-medium">Acciones Rápidas:</p>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" onClick={() => setShowInviteDialog(true)} className="flex-1">
                      <Gift className="h-4 w-4 mr-2" />
                      Invita la Casa
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => setShowResetDialog(true)} className="flex-1">
                      <RotateCcw className="h-4 w-4 mr-2" />
                      Resetear Mesa
                    </Button>
                  </div>
                </div>
              )}
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setSelectedTable(null)}>
              Cerrar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Invite House Dialog */}
      <AlertDialog open={showInviteDialog} onOpenChange={setShowInviteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Invitar la Casa</AlertDialogTitle>
            <AlertDialogDescription>
              ¿Estás seguro de que quieres invitar la casa para la Mesa {selectedTable?.number}? Esta acción cerrará el
              pedido con total $0 y marcará el motivo como cortesía de la casa.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isLoading}>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleInvitarLaCasa} disabled={isLoading}>
              {isLoading ? "Procesando..." : "Confirmar"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Reset Table Dialog */}
      <AlertDialog open={showResetDialog} onOpenChange={setShowResetDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Resetear Mesa</AlertDialogTitle>
            <AlertDialogDescription>
              ¿Estás seguro de que quieres resetear la Mesa {selectedTable?.number}? Esta acción cancelará cualquier
              pedido abierto y dejará la mesa libre.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isLoading}>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleResetearMesa} disabled={isLoading}>
              {isLoading ? "Procesando..." : "Confirmar"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
