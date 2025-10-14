"use client"

import { useState, useEffect } from "react"
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Plus } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { fetchZones } from "@/lib/zones-service"
import type { Zone } from "@/lib/mock-data"
import { logger } from "@/lib/logger"

interface AddTableDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onTableCreated: () => void
}

interface FormData {
  number: string
  zone_id: string
}

interface FormErrors {
  number?: string
  zone_id?: string
}

export function AddTableDialog({ open, onOpenChange, onTableCreated }: AddTableDialogProps) {
  const { toast } = useToast()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [zones, setZones] = useState<Zone[]>([])
  const [loadingZones, setLoadingZones] = useState(false)
  const [formData, setFormData] = useState<FormData>({ number: '', zone_id: '' })
  const [errors, setErrors] = useState<FormErrors>({})

  useEffect(() => {
    if (!open) {
      return
    }

    const loadZones = async () => {
      try {
        setLoadingZones(true)
        const data = await fetchZones()
        const enabledZones = data.filter((zone) => zone.active !== false)
        setZones(
          enabledZones.sort((a, b) => a.name.localeCompare(b.name, 'es', { sensitivity: 'base' })),
        )
      } catch (error) {
        logger.error('No se pudieron cargar las zonas disponibles', error as Error)
        toast({
          title: 'No se pudieron cargar las zonas',
          description: 'OcurriA3 un problema al conectar con Supabase. IntentA nuevamente.',
          variant: 'destructive',
        })
      } finally {
        setLoadingZones(false)
      }
    }

    void loadZones()
  }, [open, toast])

  const validateForm = () => {
    const newErrors: FormErrors = {}

    if (!formData.number.trim()) {
      newErrors.number = 'IngresA un identificador para la mesa'
    }

    if (!formData.zone_id) {
      newErrors.zone_id = 'SeleccionA una zona'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    if (!validateForm()) {
      return
    }

    setIsSubmitting(true)

    try {
      const response = await fetch('/api/tables', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          number: formData.number.trim(),
          zone_id: formData.zone_id,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error ?? 'No se pudo crear la mesa')
      }

      toast({
        title: 'Mesa registrada',
        description: `La mesa ${formData.number.trim()} se creA3 correctamente.`,
      })

      setFormData({ number: '', zone_id: '' })
      setErrors({})
      onOpenChange(false)
      onTableCreated()
    } catch (error) {
      logger.error('Error al crear mesa', error as Error)
      toast({
        title: 'No se pudo crear la mesa',
        description: error instanceof Error ? error.message : 'IntentA nuevamente mAs tarde.',
        variant: 'destructive',
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleNumberChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const value = event.target.value
    setFormData((prev) => ({ ...prev, number: value }))
    if (errors.number) {
      setErrors((prev) => ({ ...prev, number: undefined }))
    }
  }

  const handleZoneChange = (value: string) => {
    setFormData((prev) => ({ ...prev, zone_id: value }))
    if (errors.zone_id) {
      setErrors((prev) => ({ ...prev, zone_id: undefined }))
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Plus className="h-5 w-5" />
            Agregar mesa
          </DialogTitle>
          <DialogDescription>
            IndicA el identificador y la zona a la que pertenece la nueva mesa.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="table-number">
                Identificador de mesa <span className="text-destructive">*</span>
              </Label>
              <Input
                id="table-number"
                type="text"
                placeholder="Ejemplo: Mesa 1, Terraza 3 o M1"
                value={formData.number}
                onChange={handleNumberChange}
                maxLength={20}
                className={errors.number ? 'border-destructive' : ''}
                disabled={isSubmitting}
              />
              {errors.number && (
                <p className="text-sm text-destructive">{errors.number}</p>
              )}
              <p className="text-xs text-muted-foreground">
                PodAs usar nAomeros, letras o combinaciones (por ejemplo: 1, Mesa 1 o M1).
              </p>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="table-zone">
                Zona <span className="text-destructive">*</span>
              </Label>
              <Select
                value={formData.zone_id}
                onValueChange={handleZoneChange}
                disabled={isSubmitting || loadingZones}
              >
                <SelectTrigger className={errors.zone_id ? 'border-destructive' : ''}>
                  <SelectValue placeholder="SeleccionA una zona" />
                </SelectTrigger>
                <SelectContent>
                  {loadingZones ? (
                    <div className="p-2 text-center text-sm text-muted-foreground">
                      Cargando zonas...
                    </div>
                  ) : zones.length === 0 ? (
                    <div className="p-2 text-center text-sm text-muted-foreground">
                      No hay zonas creadas. CreA una antes de agregar mesas.
                    </div>
                  ) : (
                    zones.map((zone) => (
                      <SelectItem key={zone.id} value={zone.id}>
                        {zone.name}
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
              {errors.zone_id && (
                <p className="text-sm text-destructive">{errors.zone_id}</p>
              )}
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
            <Button type="submit" disabled={isSubmitting || zones.length === 0}>
              {isSubmitting ? 'Guardando...' : 'Guardar mesa'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}


