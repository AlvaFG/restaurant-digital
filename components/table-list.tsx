"use client"

import { useCallback, useEffect, useMemo, useState, useImperativeHandle, forwardRef } from "react"
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
import { logger } from "@/lib/logger"
import { MENSAJES } from "@/lib/i18n/mensajes"

export interface TableListRef {
  reload: () => Promise<void>
}

export const TableList = forwardRef<TableListRef>((props, ref) => {
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
      logger.debug('Cargando lista de mesas')
      const response = await fetchTables()
      setTables(response.data)
      logger.info('Lista de mesas cargada', { count: response.data.length })
    } catch (loadError) {
      logger.error('Error al cargar lista de mesas', loadError as Error)
      setError("No se pudieron cargar las mesas. Intenta nuevamente.")
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    void loadTables()
  }, [loadTables])

  // Expose reload method to parent via ref
  useImperativeHandle(ref, () => ({
    reload: loadTables
  }))

  const handleInviteHouse = async () => {
    if (!selectedTable) return

    setIsProcessingAction(true)
    try {
      logger.info('Invitando la casa', { 
        tableId: selectedTable.id,
        tableNumber: selectedTable.number,
        userId: user?.id
      })
      
      await inviteHouse(selectedTable.id)
      
      logger.info('Casa invitada exitosamente', {
        tableId: selectedTable.id,
        tableNumber: selectedTable.number
      })
      
      setShowInviteDialog(false)
      setSelectedTableId(null)
      await loadTables()
    } catch (actionError) {
      logger.error('Error al invitar la casa', actionError as Error, {
        tableId: selectedTable.id,
        tableNumber: selectedTable.number
      })
    } finally {
      setIsProcessingAction(false)
    }
  }

  const handleResetTable = async () => {
    if (!selectedTable) return

    setIsProcessingAction(true)
    try {
      logger.info('Reseteando mesa', { 
        tableId: selectedTable.id,
        tableNumber: selectedTable.number,
        previousState: selectedTable.status,
        userId: user?.id
      })
      
      await resetTable(selectedTable.id)
      
      logger.info('Mesa reseteada exitosamente', {
        tableId: selectedTable.id,
        tableNumber: selectedTable.number
      })
      
      setShowResetDialog(false)
      setSelectedTableId(null)
      await loadTables()
    } catch (actionError) {
      logger.error('Error al resetear mesa', actionError as Error, {
        tableId: selectedTable.id,
        tableNumber: selectedTable.number
      })
    } finally {
      setIsProcessingAction(false)
    }
  }

  const getStatusBadgeVariant = (status: Table["status"]) => TABLE_STATE_BADGE_VARIANT[status] ?? "outline"

  return (
    <div className="space-y-6">
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
            <Card key={table.id} className="cursor-pointer border-2 border-border shadow-lg hover:shadow-xl transition-all dark:border-zinc-700 dark:bg-zinc-900 dark:shadow-2xl dark:hover:shadow-zinc-900/50 dark:hover:border-zinc-600">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg font-light dark:text-zinc-100">Mesa {table.number}</CardTitle>
                  <Badge
                    variant={getStatusBadgeVariant(table.status)}
                    style={{ backgroundColor: TABLE_STATE_COLORS[table.status], color: "white" }}
                  >
                    {TABLE_STATE_LABELS[table.status]}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3 text-sm text-muted-foreground font-light dark:text-zinc-400">
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
                      className="flex-1 dark:border-zinc-600 dark:hover:bg-zinc-800"
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
})

TableList.displayName = 'TableList'
