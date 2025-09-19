"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import type { Table } from "@/lib/mock-data"
import { TABLE_STATE, TABLE_STATE_BADGE_VARIANT, TABLE_STATE_COLORS, TABLE_STATE_LABELS } from "@/lib/table-states"
import { fetchTables, inviteHouse, resetTable } from "@/lib/table-service"
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
import { LoadingSpinner } from "@/components/loading-spinner"
import { Gift, RotateCcw, Eye, Users, MapPin, RefreshCw } from "lucide-react"

export function TableList() {
  const { user } = useAuth()
  const [tables, setTables] = useState<Table[]>([])
  const [selectedTableId, setSelectedTableId] = useState<string | null>(null)
  const [showInviteDialog, setShowInviteDialog] = useState(false)
  const [showResetDialog, setShowResetDialog] = useState(false)
  const [isProcessingAction, setIsProcessingAction] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const selectedTable = useMemo(
    () => tables.find((table) => table.id === selectedTableId) ?? null,
    [tables, selectedTableId],
  )

  const loadTables = useCallback(async () => {
    setIsLoading(true)
    setError(null)
    try {
      const response = await fetchTables()
      setTables(response.data)
    } catch (loadError) {
      console.error("[TableList] Failed to load tables", loadError)
      setError("No se pudieron cargar las mesas. Intenta nuevamente.")
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    void loadTables()
  }, [loadTables])

  const handleInviteHouse = async () => {
    if (!selectedTable) return

    setIsProcessingAction(true)
    try {
      await inviteHouse(selectedTable.id)
      setShowInviteDialog(false)
      setSelectedTableId(null)
      await loadTables()
    } catch (actionError) {
      console.error("[TableList] Failed to invite house", actionError)
    } finally {
      setIsProcessingAction(false)
    }
  }

  const handleResetTable = async () => {
    if (!selectedTable) return

    setIsProcessingAction(true)
    try {
      await resetTable(selectedTable.id)
      setShowResetDialog(false)
      setSelectedTableId(null)
      await loadTables()
    } catch (actionError) {
      console.error("[TableList] Failed to reset table", actionError)
    } finally {
      setIsProcessingAction(false)
    }
  }

  const getStatusBadgeVariant = (status: Table["status"]) => TABLE_STATE_BADGE_VARIANT[status] ?? "outline"

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold">Mesas en el salon</h2>
          <p className="text-sm text-muted-foreground">Controla estados y acciones rapidas</p>
        </div>
        <Button variant="outline" size="sm" onClick={() => void loadTables()} disabled={isLoading}>
          <RefreshCw className="mr-2 h-4 w-4" />
          Actualizar
        </Button>
      </div>

      {isLoading ? (
        <div className="flex h-48 items-center justify-center">
          <LoadingSpinner />
        </div>
      ) : error ? (
        <div className="rounded-md border border-destructive/20 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          {error}
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {tables.map((table) => (
            <Card key={table.id} className="cursor-pointer transition-shadow hover:shadow-md">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg">Mesa {table.number}</CardTitle>
                  <Badge
                    variant={getStatusBadgeVariant(table.status)}
                    style={{ backgroundColor: TABLE_STATE_COLORS[table.status], color: "white" }}
                  >
                    {TABLE_STATE_LABELS[table.status]}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3 text-sm text-muted-foreground">
                  <div className="flex items-center gap-2">
                    <MapPin className="h-4 w-4" />
                    {table.zone || "Sin zona"}
                  </div>
                  {table.seats ? (
                    <div className="flex items-center gap-2">
                      <Users className="h-4 w-4" />
                      {table.seats} asientos
                    </div>
                  ) : null}

                  <div className="flex gap-2 pt-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setSelectedTableId(table.id)}
                      className="flex-1"
                    >
                      <Eye className="mr-2 h-4 w-4" />
                      Ver detalles
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={!!selectedTable} onOpenChange={() => setSelectedTableId(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Mesa {selectedTable?.number}</DialogTitle>
            <DialogDescription>Detalles y acciones disponibles</DialogDescription>
          </DialogHeader>

          {selectedTable ? (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="font-medium">Estado:</span>
                  <Badge
                    className="ml-2"
                    style={{ backgroundColor: TABLE_STATE_COLORS[selectedTable.status], color: "white" }}
                  >
                    {TABLE_STATE_LABELS[selectedTable.status]}
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

              {user?.role === "staff" && selectedTable.status !== TABLE_STATE.FREE ? (
                <div className="space-y-2 border-t pt-4">
                  <p className="text-sm font-medium">Acciones rapidas</p>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setShowInviteDialog(true)}
                      className="flex-1"
                    >
                      <Gift className="mr-2 h-4 w-4" />
                      Invita la casa
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setShowResetDialog(true)}
                      className="flex-1"
                    >
                      <RotateCcw className="mr-2 h-4 w-4" />
                      Resetear mesa
                    </Button>
                  </div>
                </div>
              ) : null}
            </div>
          ) : null}

          <DialogFooter>
            <Button variant="outline" onClick={() => setSelectedTableId(null)}>
              Cerrar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={showInviteDialog} onOpenChange={setShowInviteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Invitar la casa</AlertDialogTitle>
            <AlertDialogDescription>
              Quieres invitar la casa para la mesa {selectedTable?.number}? Se registrara el motivo como cortesia.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isProcessingAction}>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleInviteHouse} disabled={isProcessingAction}>
              {isProcessingAction ? "Procesando..." : "Confirmar"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={showResetDialog} onOpenChange={setShowResetDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Resetear mesa</AlertDialogTitle>
            <AlertDialogDescription>
              Quieres resetear la mesa {selectedTable?.number}? Se liberara la mesa y se notificara al salon.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isProcessingAction}>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleResetTable} disabled={isProcessingAction}>
              {isProcessingAction ? "Procesando..." : "Confirmar"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
