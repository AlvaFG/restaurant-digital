"use client"

import { useCallback, useEffect, useMemo, useState, useImperativeHandle, forwardRef } from "react"
import type { Database } from "@/lib/supabase/database.types"
import { TABLE_STATE, TABLE_STATE_BADGE_VARIANT, TABLE_STATE_COLORS, TABLE_STATE_LABELS } from "@/lib/table-states"
import { useTables } from "@/hooks/use-tables"
import { useZones } from "@/hooks/use-zones"
import { useAuth } from "@/contexts/auth-context"
import { useTranslations } from 'next-intl'
import { getZoneName as getZoneNameHelper } from "@/lib/type-guards"

type Table = Database['public']['Tables']['tables']['Row'] & {
  zone?: Database['public']['Tables']['zones']['Row'] | { id: string; name: string; description: string | null }
}
type Zone = Database['public']['Tables']['zones']['Row'] & {
  table_count?: number
}
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
import { ZoneFilter } from "@/components/zone-filter"
import { Gift, RotateCcw, Eye, Users, MapPin, Trash2, QrCode } from "lucide-react"
import { logger } from "@/lib/logger"
import { useToast } from "@/hooks/use-toast"

export interface TableListRef {
  reload: () => Promise<void>
}

export const TableList = forwardRef<TableListRef>((props, ref) => {
  const { user } = useAuth()
  const { toast } = useToast()
  const tCommon = useTranslations('common')
  const tErrors = useTranslations('errors')
  
  // Use hooks for data fetching and mutations
  const { tables, loading: tablesLoading, error: tablesError, updateStatus, deleteTable: deleteTableMutation, inviteHouse } = useTables()
  const { zones, loading: zonesLoading } = useZones()
  
  const [selectedTableId, setSelectedTableId] = useState<string | null>(null)
  const [selectedZoneIds, setSelectedZoneIds] = useState<string[]>([]) // Cambiado a array para selección múltiple
  const [showInviteDialog, setShowInviteDialog] = useState(false)
  const [showResetDialog, setShowResetDialog] = useState(false)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [isProcessingAction, setIsProcessingAction] = useState(false)
  const [isDownloadingQR, setIsDownloadingQR] = useState<string | null>(null) // ID de la mesa cuyo QR se está descargando

  const isLoading = tablesLoading || zonesLoading
  const error = tablesError ? tablesError.message : null

  const selectedTable = useMemo(
    () => tables.find((table) => table.id === selectedTableId) ?? null,
    [tables, selectedTableId],
  )

  // Contar mesas por zona para el contador
  const tableCountByZone = useMemo(() => {
    const counts: Record<string, number> = {}
    tables.forEach(table => {
      if (table.zone_id) {
        counts[table.zone_id] = (counts[table.zone_id] || 0) + 1
      }
    })
    return counts
  }, [tables])

  // Helper function to get zone name from a table
  const getZoneName = useCallback((table: Table | any): string => {
    if (typeof table.zone === 'string') {
      return table.zone
    }
    if (typeof table.zone === 'object' && table.zone?.name) {
      return table.zone.name
    }
    if (table.zone_id) {
      const zone = zones.find(z => z.id === table.zone_id)
      return zone?.name || 'Sin zona'
    }
    return 'Sin zona'
  }, [zones])

  // Filter tables by multiple selected zones
  const filteredTables = useMemo(() => {
    // Si no hay zonas seleccionadas, mostrar todas
    if (selectedZoneIds.length === 0) {
      return tables
    }
    // Filtrar por las zonas seleccionadas
    return tables.filter(t => t.zone_id && selectedZoneIds.includes(t.zone_id))
  }, [tables, selectedZoneIds])

  // Group tables by zone
  const tablesByZone = useMemo(() => {
    const grouped = new Map<string, any[]>()
    
    filteredTables.forEach(table => {
      const zoneName = getZoneName(table)
      if (!grouped.has(zoneName)) {
        grouped.set(zoneName, [])
      }
      grouped.get(zoneName)!.push(table)
    })
    
    return Array.from(grouped.entries()).sort((a, b) => {
      if (a[0] === 'Sin zona') return 1
      if (b[0] === 'Sin zona') return -1
      return a[0].localeCompare(b[0])
    })
  }, [filteredTables, getZoneName])

  // Expose reload method to parent via ref (data auto-refreshes via hooks)
  useImperativeHandle(ref, () => ({
    reload: async () => {
      // The hooks automatically refetch data when mutations occur
      logger.info('Reload requested - data automatically refreshes via hooks')
    }
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
      
      // Use the new inviteHouse function from hook
      await inviteHouse(selectedTable.id, 'Cortesía del restaurante')
      
      logger.info('Casa invitada exitosamente', {
        tableId: selectedTable.id,
        tableNumber: selectedTable.number
      })

      toast({
        title: "Cortesía aplicada",
        description: `La mesa ${selectedTable.number} fue marcada como cortesía.`,
      })
      
      setShowInviteDialog(false)
      setSelectedTableId(null)
    } catch (actionError) {
      logger.error('Error al invitar la casa', actionError as Error, {
        tableId: selectedTable.id,
        tableNumber: selectedTable.number
      })
      toast({
        variant: "destructive",
        title: tCommon('error'),
        description: "No se pudo aplicar la cortesía. Intenta nuevamente.",
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
      
      await updateStatus(selectedTable.id, 'libre')
      
      logger.info('Mesa reseteada exitosamente', {
        tableId: selectedTable.id,
        tableNumber: selectedTable.number
      })

      toast({
        title: "Mesa reseteada",
        description: `La mesa ${selectedTable.number} ha sido reseteada exitosamente.`,
      })
      
      setShowResetDialog(false)
      setSelectedTableId(null)
    } catch (actionError) {
      logger.error('Error al resetear mesa', actionError as Error, {
        tableId: selectedTable.id,
        tableNumber: selectedTable.number
      })
      toast({
        title: tCommon('error'),
        description: "No se pudo resetear la mesa. Intenta nuevamente.",
        variant: "destructive",
      })
    } finally {
      setIsProcessingAction(false)
    }
  }

  const handleDeleteTable = async () => {
    if (!selectedTable) return

    setIsProcessingAction(true)
    try {
      logger.info('Eliminando mesa', { 
        tableId: selectedTable.id,
        tableNumber: selectedTable.number,
        userId: user?.id
      })
      
      await deleteTableMutation(selectedTable.id)
      
      logger.info('Mesa eliminada exitosamente', {
        tableId: selectedTable.id,
        tableNumber: selectedTable.number
      })

      toast({
        title: "Mesa eliminada",
        description: `La mesa ${selectedTable.number} ha sido eliminada exitosamente.`,
      })
      
      setShowDeleteDialog(false)
      setSelectedTableId(null)
    } catch (actionError) {
      logger.error(tErrors('deleteTableError'), actionError as Error, {
        tableId: selectedTable.id,
        tableNumber: selectedTable.number
      })
      
      const errorMessage = actionError instanceof Error 
        ? actionError.message 
        : tErrors('deleteTableFailed')
      
      toast({
        title: tCommon('error'),
        description: errorMessage,
        variant: "destructive",
      })
    } finally {
      setIsProcessingAction(false)
    }
  }

  // Función auxiliar para obtener los datos del QR (token + URL)
  const getQRData = async (tableId: string, tableNumber: string | number) => {
    logger.info('Obteniendo datos QR para mesa', { 
      tableId,
      tableNumber,
      userId: user?.id
    })

    // Llamar a la API para generar el QR
    const response = await fetch('/api/qr/generate', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        tableId,
        options: {
          size: 512,
          errorCorrectionLevel: 'M',
        }
      }),
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      logger.error('Error en respuesta de API QR', new Error(`API error: ${response.status}`), { 
        status: response.status, 
        statusText: response.statusText,
        errorData 
      })
      throw new Error(errorData.error || 'Error al generar el código QR')
    }

    const result = await response.json()
    logger.info('Respuesta de API QR recibida', { 
      success: result.success, 
      hasData: !!result.data,
      hasQrCodeDataURL: !!result.data?.qrCodeDataURL,
      hasAccessUrl: !!result.data?.accessUrl
    })
    
    if (!result.success || !result.data) {
      logger.error('Respuesta inválida del servidor', new Error('Invalid server response'), { result })
      throw new Error('Respuesta inválida del servidor')
    }

    return result.data
  }

  const handleDownloadQR = async (tableId: string, tableNumber: string | number, event: React.MouseEvent) => {
    event.stopPropagation() // Prevenir que se abra el dialog de detalles
    
    setIsDownloadingQR(tableId)
    try {
      const qrData = await getQRData(tableId, tableNumber)
      
      if (!qrData.qrCodeDataURL) {
        throw new Error('No se recibió el código QR')
      }

      // Convertir data URL a blob para mejor compatibilidad
      const base64Data = qrData.qrCodeDataURL.split(',')[1]
      const byteCharacters = atob(base64Data)
      const byteNumbers = new Array(byteCharacters.length)
      for (let i = 0; i < byteCharacters.length; i++) {
        byteNumbers[i] = byteCharacters.charCodeAt(i)
      }
      const byteArray = new Uint8Array(byteNumbers)
      const blob = new Blob([byteArray], { type: 'image/png' })
      
      // Crear URL temporal del blob
      const blobUrl = window.URL.createObjectURL(blob)
      
      // Descargar la imagen
      const link = document.createElement('a')
      link.href = blobUrl
      link.download = `mesa-${tableNumber}-qr.png`
      document.body.appendChild(link)
      link.click()
      
      // Limpiar
      setTimeout(() => {
        document.body.removeChild(link)
        window.URL.revokeObjectURL(blobUrl)
      }, 100)

      logger.info('QR descargado exitosamente', {
        tableId,
        tableNumber
      })

      toast({
        title: "QR descargado",
        description: `El código QR de la mesa ${tableNumber} se descargó correctamente.`,
      })

    } catch (error) {
      logger.error('Error al descargar QR', error as Error, {
        tableId,
        tableNumber
      })
      
      toast({
        title: "Error al descargar QR",
        description: error instanceof Error ? error.message : "No se pudo descargar el código QR. Intenta nuevamente.",
        variant: "destructive",
      })
    } finally {
      setIsDownloadingQR(null)
    }
  }

  const handleOpenClientView = async (tableId: string, tableNumber: string | number, event: React.MouseEvent) => {
    event.stopPropagation() // Prevenir que se abra el dialog de detalles
    
    try {
      logger.info('Abriendo vista del cliente para mesa', { 
        tableId,
        tableNumber,
        userId: user?.id
      })

      // Obtener los datos del QR (incluye el token y la URL)
      const qrData = await getQRData(tableId, tableNumber)
      
      if (!qrData.accessUrl) {
        throw new Error('No se pudo generar la URL de acceso')
      }

      // Abrir la URL del cliente en una nueva pestaña
      logger.info('Abriendo URL del cliente', { 
        accessUrl: qrData.accessUrl,
        tableId,
        tableNumber
      })
      
      window.open(qrData.accessUrl, '_blank')

      toast({
        title: "Vista del cliente abierta",
        description: `Se abrió la vista del cliente para la mesa ${tableNumber}.`,
      })

    } catch (error) {
      logger.error('Error al abrir vista del cliente', error as Error, {
        tableId,
        tableNumber
      })
      
      toast({
        title: "Error al abrir vista del cliente",
        description: error instanceof Error ? error.message : "No se pudo abrir la vista del cliente. Intenta nuevamente.",
        variant: "destructive",
      })
    }
  }

  const getStatusBadgeVariant = (status: string) => TABLE_STATE_BADGE_VARIANT[status as keyof typeof TABLE_STATE_BADGE_VARIANT] ?? "outline"

  return (
    <div className="space-y-6">
      {/* Filter by zone - Nuevo componente con selección múltiple */}
      {!isLoading && !error && (
        <ZoneFilter
          zones={zones}
          selectedZones={selectedZoneIds}
          onZonesChange={setSelectedZoneIds}
          tableCountByZone={tableCountByZone}
        />
      )}
      
      {/* Mostrar contador de mesas filtradas */}
      {!isLoading && !error && selectedZoneIds.length > 0 && (
        <div className="text-sm text-muted-foreground">
          Mostrando {filteredTables.length} de {tables.length} mesas
        </div>
      )}
      
      {isLoading ? (
        <div className="flex h-48 items-center justify-center">
          <LoadingSpinner />
        </div>
      ) : error ? (
        <div className="rounded-md border border-destructive/20 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          {error}
        </div>
      ) : (
        <>
          {tablesByZone.map(([zoneName, zoneTables]) => (
            <div key={zoneName} className="space-y-3">
              <h3 className="text-lg font-semibold border-b pb-2">{zoneName}</h3>
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {zoneTables.map((table) => (
                  <Card key={table.id} className="cursor-pointer border-2 border-border shadow-lg hover:shadow-xl transition-all dark:border-zinc-700 dark:bg-zinc-900 dark:shadow-2xl dark:hover:shadow-zinc-900/50 dark:hover:border-zinc-600">
                    <CardHeader className="pb-3">
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-lg font-light dark:text-zinc-100">Mesa {table.number}</CardTitle>
                        <Badge
                          variant={getStatusBadgeVariant(table.status)}
                          style={{ backgroundColor: TABLE_STATE_COLORS[table.status as keyof typeof TABLE_STATE_COLORS], color: "white" }}
                        >
                          {TABLE_STATE_LABELS[table.status as keyof typeof TABLE_STATE_LABELS]}
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3 text-sm text-muted-foreground font-light dark:text-zinc-400">
                        <div className="flex items-center gap-2">
                          <MapPin className="h-4 w-4" />
                          {getZoneName(table)}
                        </div>
                        {table.capacity ? (
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <Users className="h-4 w-4" />
                              {table.capacity} asientos
                            </div>
                            <div className="flex gap-1">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={(e) => handleDownloadQR(table.id, table.number, e)}
                                disabled={isDownloadingQR === table.id}
                                className="dark:border-zinc-600 dark:hover:bg-zinc-800"
                                title="Descargar código QR"
                              >
                                <QrCode className="h-4 w-4" />
                                {isDownloadingQR === table.id && (
                                  <span className="ml-2 text-xs">Descargando...</span>
                                )}
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={(e) => handleOpenClientView(table.id, table.number, e)}
                                className="dark:border-zinc-600 dark:hover:bg-zinc-800"
                                title="Ver como cliente"
                              >
                                <Eye className="h-4 w-4" />
                              </Button>
                            </div>
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
            </div>
          ))}
        </>
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
                    style={{ backgroundColor: TABLE_STATE_COLORS[selectedTable.status as keyof typeof TABLE_STATE_COLORS], color: "white" }}
                  >
                    {TABLE_STATE_LABELS[selectedTable.status as keyof typeof TABLE_STATE_LABELS]}
                  </Badge>
                </div>
                <div>
                  <span className="font-medium">Zona:</span>
                  <span className="ml-2">{getZoneName(selectedTable)}</span>
                </div>
                <div>
                  <span className="font-medium">Asientos:</span>
                  <span className="ml-2">{selectedTable.capacity || "No especificado"}</span>
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

          <DialogFooter className="flex-row gap-2 sm:justify-between">
            {user?.role === "admin" ? (
              <Button 
                variant="destructive" 
                onClick={() => setShowDeleteDialog(true)}
                className="flex items-center gap-2"
                size="icon"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            ) : (
              <div />
            )}
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
              {isProcessingAction ? tCommon('loading') : tCommon('confirm')}
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
              {isProcessingAction ? tCommon('loading') : tCommon('confirm')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{tCommon('confirmDeleteTable')}</AlertDialogTitle>
            <AlertDialogDescription>
              {tCommon('deleteTableWarning', { number: selectedTable?.number ?? '' })} 
              Esta operación no se puede deshacer.
              {selectedTable?.status && selectedTable.status !== TABLE_STATE.FREE && (
                <span className="block mt-2 text-destructive font-medium">
                  Advertencia: La mesa está actualmente {TABLE_STATE_LABELS[selectedTable.status as keyof typeof TABLE_STATE_LABELS].toLowerCase()}.
                </span>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isProcessingAction}>Cancelar</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleDeleteTable} 
              disabled={isProcessingAction}
              className="bg-destructive text-white hover:bg-destructive/90"
            >
              {isProcessingAction ? tCommon('deleting') : tCommon('deleteTable')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
})

TableList.displayName = 'TableList'
