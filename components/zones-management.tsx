"use client"

import React, { useState, useEffect, useCallback } from 'react'
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
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import { Badge } from "@/components/ui/badge"
import { useToast } from "@/hooks/use-toast"
import { Plus, Edit, Trash2, GripVertical } from 'lucide-react'
import { fetchZones, createZone, updateZone, deleteZone } from '@/lib/zones-service'
import type { Zone } from '@/lib/mock-data'

interface ZoneFormData {
  name: string
  description: string
  sort_order: number
  active: boolean
}

export function ZonesManagement() {
  const { toast } = useToast()
  const [zones, setZones] = useState<Zone[]>([])
  const [loading, setLoading] = useState(true)
  const [showAddDialog, setShowAddDialog] = useState(false)
  const [showEditDialog, setShowEditDialog] = useState(false)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [selectedZone, setSelectedZone] = useState<Zone | null>(null)
  const [formData, setFormData] = useState<ZoneFormData>({
    name: '',
    description: '',
    sort_order: 0,
    active: true
  })

  const loadZones = useCallback(async () => {
    try {
      setLoading(true)
      const data = await fetchZones()
      setZones(data.sort((a, b) => a.sort_order - b.sort_order))
    } catch (_error) {
      toast({
        title: "Error",
        description: "No se pudieron cargar las zonas",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }, [toast])

  useEffect(() => {
    loadZones()
  }, [loadZones])

  function resetForm() {
    setFormData({
      name: '',
      description: '',
      sort_order: zones.length,
      active: true
    })
  }

  function openAddDialog() {
    resetForm()
    setShowAddDialog(true)
  }

  function openEditDialog(zone: Zone) {
    setSelectedZone(zone)
    setFormData({
      name: zone.name,
      description: zone.description || '',
      sort_order: zone.sort_order,
      active: zone.active
    })
    setShowEditDialog(true)
  }

  function openDeleteDialog(zone: Zone) {
    setSelectedZone(zone)
    setShowDeleteDialog(true)
  }

  async function handleCreate() {
    if (!formData.name.trim()) {
      toast({
        title: "Error",
        description: "El nombre de la zona es requerido",
        variant: "destructive",
      })
      return
    }

    try {
      await createZone({
        name: formData.name.trim(),
        description: formData.description.trim() || undefined,
        sort_order: formData.sort_order,
        active: formData.active
      })
      
      toast({
        title: "Zona creada",
        description: `La zona "${formData.name}" ha sido creada exitosamente`,
      })
      
      setShowAddDialog(false)
      resetForm()
      await loadZones()
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "No se pudo crear la zona",
        variant: "destructive",
      })
    }
  }

  async function handleUpdate() {
    if (!selectedZone) return
    
    if (!formData.name.trim()) {
      toast({
        title: "Error",
        description: "El nombre de la zona es requerido",
        variant: "destructive",
      })
      return
    }

    try {
      await updateZone(selectedZone.id, {
        name: formData.name.trim(),
        description: formData.description.trim() || undefined,
        sort_order: formData.sort_order,
        active: formData.active
      })
      
      toast({
        title: "Zona actualizada",
        description: `La zona "${formData.name}" ha sido actualizada exitosamente`,
      })
      
      setShowEditDialog(false)
      setSelectedZone(null)
      resetForm()
      await loadZones()
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "No se pudo actualizar la zona",
        variant: "destructive",
      })
    }
  }

  async function handleDelete() {
    if (!selectedZone) return

    try {
      await deleteZone(selectedZone.id)
      
      toast({
        title: "Zona eliminada",
        description: `La zona "${selectedZone.name}" ha sido eliminada exitosamente`,
      })
      
      setShowDeleteDialog(false)
      setSelectedZone(null)
      await loadZones()
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "No se pudo eliminar la zona",
        variant: "destructive",
      })
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center p-8">
        <div className="text-muted-foreground">Cargando zonas...</div>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Gestión de Zonas</h2>
          <p className="text-muted-foreground text-sm">
            Administra las zonas de tu restaurante
          </p>
        </div>
        <Button onClick={openAddDialog}>
          <Plus className="h-4 w-4 mr-2" />
          Agregar Zona
        </Button>
      </div>

      <div className="border rounded-lg">
        <div className="grid grid-cols-[40px_1fr_auto_100px_100px] gap-4 p-4 border-b bg-muted/50 font-medium text-sm">
          <div></div>
          <div>Nombre</div>
          <div>Descripción</div>
          <div className="text-center">Mesas</div>
          <div className="text-right">Acciones</div>
        </div>
        
        {zones.length === 0 ? (
          <div className="p-8 text-center text-muted-foreground">
            No hay zonas configuradas
          </div>
        ) : (
          zones.map((zone) => (
            <div
              key={zone.id}
              className="grid grid-cols-[40px_1fr_auto_100px_100px] gap-4 p-4 border-b last:border-b-0 hover:bg-muted/50 transition-colors"
            >
              <div className="flex items-center">
                <GripVertical className="h-4 w-4 text-muted-foreground" />
              </div>
              
              <div className="flex items-center gap-2">
                <span className="font-medium">{zone.name}</span>
                {!zone.active && (
                  <Badge variant="secondary" className="text-xs">
                    Inactiva
                  </Badge>
                )}
              </div>
              
              <div className="flex items-center text-sm text-muted-foreground">
                {zone.description || '—'}
              </div>
              
              <div className="flex items-center justify-center">
                <Badge variant="outline">
                  {zone.table_count || 0}
                </Badge>
              </div>
              
              <div className="flex items-center justify-end gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => openEditDialog(zone)}
                >
                  <Edit className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => openDeleteDialog(zone)}
                  disabled={(zone.table_count || 0) > 0}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Add Dialog */}
      <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Agregar Nueva Zona</DialogTitle>
            <DialogDescription>
              Crea una nueva zona para organizar las mesas de tu restaurante
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div>
              <Label htmlFor="add-name">Nombre *</Label>
              <Input
                id="add-name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Ej: Salón Principal"
                maxLength={50}
              />
            </div>
            
            <div>
              <Label htmlFor="add-description">Descripción</Label>
              <Textarea
                id="add-description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Descripción opcional de la zona"
                rows={3}
              />
            </div>
            
            <div>
              <Label htmlFor="add-sort-order">Orden</Label>
              <Input
                id="add-sort-order"
                type="number"
                value={formData.sort_order}
                onChange={(e) => setFormData({ ...formData, sort_order: parseInt(e.target.value) || 0 })}
                min={0}
              />
            </div>
            
            <div className="flex items-center space-x-2">
              <Switch
                id="add-active"
                checked={formData.active}
                onCheckedChange={(checked) => setFormData({ ...formData, active: checked })}
              />
              <Label htmlFor="add-active">Zona activa</Label>
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAddDialog(false)}>
              Cancelar
            </Button>
            <Button onClick={handleCreate}>
              Crear Zona
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Editar Zona</DialogTitle>
            <DialogDescription>
              Modifica los detalles de la zona
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div>
              <Label htmlFor="edit-name">Nombre *</Label>
              <Input
                id="edit-name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Ej: Salón Principal"
                maxLength={50}
              />
            </div>
            
            <div>
              <Label htmlFor="edit-description">Descripción</Label>
              <Textarea
                id="edit-description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Descripción opcional de la zona"
                rows={3}
              />
            </div>
            
            <div>
              <Label htmlFor="edit-sort-order">Orden</Label>
              <Input
                id="edit-sort-order"
                type="number"
                value={formData.sort_order}
                onChange={(e) => setFormData({ ...formData, sort_order: parseInt(e.target.value) || 0 })}
                min={0}
              />
            </div>
            
            <div className="flex items-center space-x-2">
              <Switch
                id="edit-active"
                checked={formData.active}
                onCheckedChange={(checked) => setFormData({ ...formData, active: checked })}
              />
              <Label htmlFor="edit-active">Zona activa</Label>
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowEditDialog(false)}>
              Cancelar
            </Button>
            <Button onClick={handleUpdate}>
              Guardar Cambios
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar zona?</AlertDialogTitle>
            <AlertDialogDescription>
              ¿Estás seguro que deseas eliminar la zona &quot;{selectedZone?.name}&quot;?
              {(selectedZone?.table_count || 0) > 0 && (
                <span className="block mt-2 text-destructive font-medium">
                  Esta zona tiene {selectedZone?.table_count} mesa(s) asignada(s) y no puede ser eliminada.
                  Reasigna las mesas a otra zona primero.
                </span>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={(selectedZone?.table_count || 0) > 0}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
