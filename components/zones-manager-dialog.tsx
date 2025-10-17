"use client"

import { useState } from 'react'
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
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
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent } from "@/components/ui/card"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Separator } from "@/components/ui/separator"
import { useToast } from "@/hooks/use-toast"
import { useZones } from '@/hooks/use-zones'
import { useTables } from '@/hooks/use-tables'
import { Plus, Pencil, Trash2, Save, X } from 'lucide-react'
import { LoadingSpinner } from './loading-spinner'

interface ZonesManagerDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onZonesUpdated?: () => void
}

export function ZonesManagerDialog({ open, onOpenChange, onZonesUpdated }: ZonesManagerDialogProps) {
  const { toast } = useToast()
  const { zones, loading: zonesLoading, createZone, updateZone, deleteZone } = useZones()
  const { tables } = useTables()
  
  const [newZoneName, setNewZoneName] = useState('')
  const [editingZone, setEditingZone] = useState<{ id: string; name: string } | null>(null)
  const [zoneToDelete, setZoneToDelete] = useState<{ id: string; name: string } | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Contar mesas por zona
  const getTableCount = (zoneId: string) => {
    return tables.filter(t => t.zone_id === zoneId).length
  }

  const handleCreateZone = async () => {
    const trimmedName = newZoneName.trim()

    if (!trimmedName) {
      toast({
        title: 'Nombre requerido',
        description: 'Ingresa un nombre para la zona.',
        variant: 'destructive',
      })
      return
    }

    setIsSubmitting(true)

    try {
      await createZone({ name: trimmedName })
      
      toast({
        title: 'Zona creada',
        description: `La zona "${trimmedName}" fue creada exitosamente.`,
      })

      setNewZoneName('')
      onZonesUpdated?.()
    } catch (error) {
      toast({
        title: 'Error al crear zona',
        description: error instanceof Error ? error.message : 'Intenta nuevamente.',
        variant: 'destructive',
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleUpdateZone = async () => {
    if (!editingZone) return

    const trimmedName = editingZone.name.trim()

    if (!trimmedName) {
      toast({
        title: 'Nombre requerido',
        description: 'El nombre no puede estar vacío.',
        variant: 'destructive',
      })
      return
    }

    setIsSubmitting(true)

    try {
      await updateZone(editingZone.id, { name: trimmedName })
      
      toast({
        title: 'Zona actualizada',
        description: 'Los cambios se guardaron correctamente.',
      })

      setEditingZone(null)
      onZonesUpdated?.()
    } catch (error) {
      toast({
        title: 'Error al actualizar zona',
        description: error instanceof Error ? error.message : 'Intenta nuevamente.',
        variant: 'destructive',
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDeleteZone = async () => {
    if (!zoneToDelete) return

    const tableCount = getTableCount(zoneToDelete.id)
    
    if (tableCount > 0) {
      toast({
        title: 'No se puede eliminar',
        description: `La zona tiene ${tableCount} mesa(s) asignada(s). Reasígnalas primero.`,
        variant: 'destructive',
      })
      setZoneToDelete(null)
      return
    }

    setIsSubmitting(true)

    try {
      await deleteZone(zoneToDelete.id)
      
      toast({
        title: 'Zona eliminada',
        description: `La zona "${zoneToDelete.name}" fue eliminada.`,
      })

      setZoneToDelete(null)
      onZonesUpdated?.()
    } catch (error) {
      toast({
        title: 'Error al eliminar zona',
        description: error instanceof Error ? error.message : 'Intenta nuevamente.',
        variant: 'destructive',
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const sortedZones = [...zones].sort((a, b) => 
    a.name.localeCompare(b.name, 'es', { sensitivity: 'base' })
  )

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-2xl max-h-[85vh]">
          <DialogHeader>
            <DialogTitle>Gestión de Zonas</DialogTitle>
            <DialogDescription>
              Crea, edita y elimina zonas para organizar tu restaurante.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6">
            {/* Crear nueva zona */}
            <Card className="border-2 border-dashed">
              <CardContent className="pt-6">
                <div className="space-y-4">
                  <Label htmlFor="new-zone-name" className="text-base font-semibold">
                    Crear nueva zona
                  </Label>
                  <div className="flex gap-2">
                    <div className="flex-1">
                      <Input
                        id="new-zone-name"
                        value={newZoneName}
                        onChange={(e) => setNewZoneName(e.target.value)}
                        placeholder="Nombre de la zona (ej: Terraza, Bar, Salón)"
                        maxLength={80}
                        disabled={isSubmitting}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' && newZoneName.trim()) {
                            handleCreateZone()
                          }
                        }}
                      />
                    </div>
                    <Button 
                      onClick={handleCreateZone} 
                      disabled={isSubmitting || !newZoneName.trim()}
                    >
                      <Plus className="mr-2 h-4 w-4" />
                      Crear
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Separator />

            {/* Lista de zonas existentes */}
            <div className="space-y-3">
              <Label className="text-base font-semibold">
                Zonas existentes ({zones.length})
              </Label>
              
              {zonesLoading ? (
                <div className="flex justify-center py-8">
                  <LoadingSpinner />
                </div>
              ) : zones.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <p>No hay zonas creadas todavía.</p>
                  <p className="text-sm">Crea tu primera zona arriba.</p>
                </div>
              ) : (
                <ScrollArea className="h-[300px] pr-4">
                  <div className="space-y-2">
                    {sortedZones.map((zone) => (
                      <Card key={zone.id} className="border-2">
                        <CardContent className="p-4">
                          {editingZone?.id === zone.id && editingZone ? (
                            // Modo edición
                            <div className="flex gap-2 items-center">
                              <div className="flex-1">
                                <Input
                                  value={editingZone.name}
                                  onChange={(e) => setEditingZone({ id: editingZone.id, name: e.target.value })}
                                  maxLength={80}
                                  disabled={isSubmitting}
                                  autoFocus
                                  onKeyDown={(e) => {
                                    if (e.key === 'Enter') handleUpdateZone()
                                    if (e.key === 'Escape') setEditingZone(null)
                                  }}
                                />
                              </div>
                              <Button
                                size="sm"
                                onClick={handleUpdateZone}
                                disabled={isSubmitting}
                              >
                                <Save className="h-4 w-4" />
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => setEditingZone(null)}
                                disabled={isSubmitting}
                              >
                                <X className="h-4 w-4" />
                              </Button>
                            </div>
                          ) : (
                            // Modo vista
                            <div className="flex items-center justify-between">
                              <div className="flex-1">
                                <p className="font-medium">{zone.name}</p>
                                <p className="text-sm text-muted-foreground">
                                  {getTableCount(zone.id)} mesa(s) asignada(s)
                                </p>
                              </div>
                              <div className="flex gap-2">
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => setEditingZone({ id: zone.id, name: zone.name })}
                                >
                                  <Pencil className="h-4 w-4" />
                                </Button>
                                <Button
                                  size="sm"
                                  variant="destructive"
                                  onClick={() => setZoneToDelete({ id: zone.id, name: zone.name })}
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </div>
                            </div>
                          )}
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </ScrollArea>
              )}
            </div>
          </div>

          <div className="flex justify-end pt-4 border-t">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Cerrar
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Confirmación de eliminación */}
      <AlertDialog open={!!zoneToDelete} onOpenChange={(open) => !open && setZoneToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar zona "{zoneToDelete?.name}"?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción no se puede deshacer. La zona será eliminada permanentemente.
              {zoneToDelete && getTableCount(zoneToDelete.id) > 0 && (
                <span className="block mt-2 text-destructive font-medium">
                  Advertencia: Esta zona tiene {getTableCount(zoneToDelete.id)} mesa(s) asignada(s).
                </span>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isSubmitting}>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteZone}
              disabled={isSubmitting || (zoneToDelete ? getTableCount(zoneToDelete.id) > 0 : false)}
              className="bg-destructive text-white hover:bg-destructive/90"
            >
              {isSubmitting ? "Eliminando..." : "Eliminar zona"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
