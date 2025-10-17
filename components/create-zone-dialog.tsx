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
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useToast } from "@/hooks/use-toast"
import { useZones } from '@/hooks/use-zones'

interface CreateZoneDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onZoneCreated?: () => void
}

export function CreateZoneDialog({ open, onOpenChange, onZoneCreated }: CreateZoneDialogProps) {
  const { toast } = useToast()
  const { createZone } = useZones()
  const [name, setName] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  const resetForm = () => {
    setName('')
  }

  const handleOpenChange = (value: boolean) => {
    if (!value) {
      resetForm()
    }
    onOpenChange(value)
  }

  const handleCreate = async () => {
    const trimmedName = name.trim()

    if (!trimmedName) {
      toast({
        title: 'Nombre requerido',
        description: 'Ingresa un nombre para la zona antes de guardarla.',
        variant: 'destructive',
      })
      return
    }

    setIsSubmitting(true)

    try {
      await createZone({ name: trimmedName })

      toast({
        title: 'Zona guardada',
        description: `Guardada con exito la nueva zona "${trimmedName}".`,
        className: 'border border-emerald-500 bg-emerald-50 text-emerald-900',
      })

      resetForm()
      onOpenChange(false)
      onZoneCreated?.()
    } catch (error) {
      toast({
        title: 'Error al crear la zona',
        description: error instanceof Error ? error.message : 'Intenta nuevamente mas tarde.',
        variant: 'destructive',
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Crear zona</DialogTitle>
          <DialogDescription>
            Defini un nombre para identificar la nueva zona del restaurante.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="zone-name">
              Nombre de la zona <span className="text-destructive">*</span>
            </Label>
            <Input
              id="zone-name"
              value={name}
              onChange={(event) => setName(event.target.value)}
              placeholder="Ejemplo: Salon principal"
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
            onClick={() => onOpenChange(false)}
            disabled={isSubmitting}
          >
            Cancelar
          </Button>
          <Button onClick={handleCreate} disabled={isSubmitting}>
            {isSubmitting ? 'Guardando...' : 'Guardar zona'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

