"use client"

import React, { useState } from 'react'
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import { useToast } from "@/hooks/use-toast"
import { createZone } from '@/lib/zones-service'

interface CreateZoneDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onZoneCreated?: () => void
}

export function CreateZoneDialog({ open, onOpenChange, onZoneCreated }: CreateZoneDialogProps) {
  const { toast } = useToast()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    sort_order: 0,
    active: true
  })

  function resetForm() {
    setFormData({
      name: '',
      description: '',
      sort_order: 0,
      active: true
    })
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

    setIsSubmitting(true)

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
      
      resetForm()
      onOpenChange(false)
      
      // Notificar al componente padre para recargar
      if (onZoneCreated) {
        onZoneCreated()
      }
    } catch (error) {
      console.error('Error al crear zona:', error)
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "No se pudo crear la zona",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Agregar Nueva Zona</DialogTitle>
          <DialogDescription>
            Crea una nueva zona para organizar las mesas de tu restaurante
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4">
          <div>
            <Label htmlFor="name">Nombre *</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="Ej: Salón Principal"
              maxLength={50}
              disabled={isSubmitting}
            />
          </div>
          
          <div>
            <Label htmlFor="description">Descripción</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Descripción opcional de la zona"
              rows={3}
              disabled={isSubmitting}
            />
          </div>
          
          <div>
            <Label htmlFor="sort-order">Orden</Label>
            <Input
              id="sort-order"
              type="number"
              value={formData.sort_order}
              onChange={(e) => setFormData({ ...formData, sort_order: parseInt(e.target.value) || 0 })}
              min={0}
              disabled={isSubmitting}
            />
          </div>
          
          <div className="flex items-center space-x-2">
            <Switch
              id="active"
              checked={formData.active}
              onCheckedChange={(checked) => setFormData({ ...formData, active: checked })}
              disabled={isSubmitting}
            />
            <Label htmlFor="active">Zona activa</Label>
          </div>
        </div>
        
        <DialogFooter>
          <Button 
            variant="outline" 
            onClick={() => onOpenChange(false)}
            disabled={isSubmitting}
          >
            Cancelar
          </Button>
          <Button 
            onClick={handleCreate}
            disabled={isSubmitting}
          >
            {isSubmitting ? "Creando..." : "Crear Zona"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
