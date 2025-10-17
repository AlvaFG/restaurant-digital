"use client"

import { useState } from 'react'
import { Button } from "@/components/ui/button"
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
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { useToast } from "@/hooks/use-toast"
import { useZones } from "@/hooks/use-zones"
import { useTables } from "@/hooks/use-tables"
import { Plus, Pencil, Trash2 } from 'lucide-react'
import { logger } from '@/lib/logger'
import type { Database } from '@/lib/supabase/database.types'

type ZoneWithStats = Database['public']['Tables']['zones']['Row'] & {
  table_count?: number
}

interface ZoneFormState {
  id?: string
  name: string
}

type FormMode = 'create' | 'edit'

export function ZonesManagement() {
  const { toast } = useToast()
  const { zones, loading: isLoading, createZone, updateZone, deleteZone } = useZones()
  const { tables } = useTables()
  
  const [formMode, setFormMode] = useState<FormMode>('create')
  const [showForm, setShowForm] = useState(false)
  const [showDelete, setShowDelete] = useState(false)
  const [formState, setFormState] = useState<ZoneFormState>({ name: '' })
  const [zoneToDelete, setZoneToDelete] = useState<ZoneWithStats | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Helper para contar mesas por zona
  const getTableCount = (zoneId: string) => {
    return tables.filter(t => t.zone_id === zoneId).length
  }

  // Sort zones alphabetically
  const sortedZones = [...zones].sort((a, b) => 
    a.name.localeCompare(b.name, 'es', { sensitivity: 'base' })
  )

  const openCreateModal = () => {
    setFormMode('create')
    setFormState({ name: '' })
    setShowForm(true)
  }

  const openEditModal = (zone: ZoneWithStats) => {
    setFormMode('edit')
    setFormState({ id: zone.id, name: zone.name })
    setShowForm(true)
  }

  const handleFormClose = (open: boolean) => {
    if (!open) {
      setFormState({ name: '' })
    }
    setShowForm(open)
  }

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const trimmedName = formState.name.trim()

    if (!trimmedName) {
      toast({
        title: 'Nombre obligatorio',
        description: 'Ingresa un nombre valido antes de guardar la zona.',
        variant: 'destructive',
      })
      return
    }

    setIsSubmitting(true)

    try {
      if (formMode === 'create') {
        await createZone({ name: trimmedName })
        toast({
          title: 'Zona guardada',
          description: `Guardada con exito la nueva zona "${trimmedName}".`,
          className: 'border border-emerald-500 bg-emerald-50 text-emerald-900',
        })
      } else if (formState.id) {
        await updateZone(formState.id, { name: trimmedName })
        toast({
          title: 'Zona guardada',
          description: 'Los cambios se guardaron correctamente.',
          className: 'border border-emerald-500 bg-emerald-50 text-emerald-900',
        })
      }

      setShowForm(false)
      setFormState({ name: '' })
      // Zones auto-refresh via hook
    } catch (error) {
      toast({
        title: 'No se pudo guardar la zona',
        description: error instanceof Error ? error.message : 'Intenta nuevamente mas tarde.',
        variant: 'destructive',
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const openDeleteModal = (zone: ZoneWithStats) => {
    setZoneToDelete(zone)
    setShowDelete(true)
  }

  const handleDelete = async () => {
    if (!zoneToDelete) {
      return
    }

    setIsSubmitting(true)

    try {
      await deleteZone(zoneToDelete.id)
      toast({
        title: 'Zona eliminada',
        description: `La zona ${zoneToDelete.name} se elimino correctamente.`,
      })
      setShowDelete(false)
      setZoneToDelete(null)
      // Zones auto-refresh via hook
    } catch (error) {
      toast({
        title: 'No se pudo eliminar la zona',
        description: error instanceof Error ? error.message : 'Intenta nuevamente mas tarde.',
        variant: 'destructive',
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-semibold tracking-tight">Zonas del restaurante</h2>
          <p className="text-sm text-muted-foreground">
            Organiza tus mesas por zonas para encontrarlas mas rapido.
          </p>
        </div>
        <Button onClick={openCreateModal}>
          <Plus className="mr-2 h-4 w-4" />
          Crear zona
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Listado de zonas</CardTitle>
          <CardDescription>
            Agrega, edita o elimina zonas segun la disposicion de tu salon.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <p className="text-sm text-muted-foreground">Cargando zonas...</p>
          ) : zones.length === 0 ? (
            <div className="rounded-md border border-dashed p-6 text-center">
              <p className="font-medium">Todavia no creaste zonas.</p>
              <p className="mt-2 text-sm text-muted-foreground">
                Crea tu primera zona para empezar a organizar las mesas.
              </p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nombre</TableHead>
                  <TableHead className="hidden sm:table-cell">Mesas asignadas</TableHead>
                  <TableHead className="w-[140px] text-right">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sortedZones.map((zone) => (
                  <TableRow key={zone.id}>
                    <TableCell className="font-medium">
                      {zone.name}
                      {getTableCount(zone.id) === 0 && (
                        <Badge variant="secondary" className="ml-2">
                          Sin mesas
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell className="hidden sm:table-cell">
                      {getTableCount(zone.id)}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => openEditModal(zone)}
                        >
                          <Pencil className="mr-2 h-4 w-4" />
                          Editar
                        </Button>
                        <Button
                          type="button"
                          variant="destructive"
                          size="sm"
                          onClick={() => openDeleteModal(zone)}
                        >
                          <Trash2 className="mr-2 h-4 w-4" />
                          Eliminar
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Dialog open={showForm} onOpenChange={handleFormClose}>
        <DialogContent>
          <form onSubmit={handleSubmit}>
            <DialogHeader>
              <DialogTitle>
                {formMode === 'create' ? 'Crear nueva zona' : 'Editar zona'}
              </DialogTitle>
              <DialogDescription>
                {formMode === 'create'
                  ? 'Asigna un nombre descriptivo para ubicarla facilmente al crear mesas.'
                  : 'Actualiza el nombre de la zona para reflejar cambios en el salon.'}
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="zone-name-input">
                  Nombre de la zona <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="zone-name-input"
                  value={formState.name}
                  onChange={(event) => setFormState((prev) => ({
                    ...prev,
                    name: event.target.value,
                  }))}
                  placeholder="Ejemplo: Terraza"
                  maxLength={80}
                  disabled={isSubmitting}
                  autoFocus
                />
              </div>
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setShowForm(false)}
                disabled={isSubmitting}
              >
                Cancelar
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? 'Guardando...' : 'Guardar zona'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <AlertDialog open={showDelete} onOpenChange={setShowDelete}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Eliminar zona?</AlertDialogTitle>
            <AlertDialogDescription>
              {zoneToDelete?.table_count ? (
                <span>
                  No podes eliminar la zona {zoneToDelete.name} porque tiene {zoneToDelete.table_count} mesa(s)
                  asociada(s). Reasignalas antes de continuar.
                </span>
              ) : (
                <span>Esta accion no se puede deshacer. La zona {zoneToDelete?.name} sera eliminada.</span>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isSubmitting}>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={isSubmitting || (zoneToDelete?.table_count ?? 0) > 0}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Eliminar zona
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}







