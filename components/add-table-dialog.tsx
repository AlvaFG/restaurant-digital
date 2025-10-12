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
  const [formData, setFormData] = useState<FormData>({
    number: "",
    zone_id: "",
  })
  const [errors, setErrors] = useState<FormErrors>({})

  // Cargar zonas cuando se abre el diálogo
  useEffect(() => {
    if (open) {
      const loadZones = async () => {
        try {
          setLoadingZones(true)
          const data = await fetchZones()
          setZones(data.filter(z => z.active).sort((a, b) => a.sort_order - b.sort_order))
        } catch (error) {
          console.error("Error loading zones:", error)
          toast({
            title: "Advertencia",
            description: "No se pudieron cargar las zonas",
            variant: "destructive",
          })
        } finally {
          setLoadingZones(false)
        }
      }
      
      loadZones()
    }
  }, [open, toast])

  const validateForm = (): boolean => {
    const newErrors: FormErrors = {}

    // Validar número de mesa (ahora acepta texto)
    if (!formData.number || formData.number.trim().length === 0) {
      newErrors.number = "El número/identificador de mesa es requerido"
    }

    // Validar zona
    if (!formData.zone_id) {
      newErrors.zone_id = "Debes seleccionar una zona"
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!validateForm()) {
      return
    }

    setIsSubmitting(true)

    try {
      const response = await fetch("/api/tables", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          number: formData.number.trim(),
          zone_id: formData.zone_id,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Error al crear la mesa")
      }

      toast({
        title: "Mesa creada",
        description: `La mesa ${formData.number} ha sido creada exitosamente.`,
      })

      // Reset form
      setFormData({ number: "", zone_id: "" })
      setErrors({})
      
      // Close dialog and notify parent
      onOpenChange(false)
      onTableCreated()
    } catch (error) {
      console.error("Error creating table:", error)
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "No se pudo crear la mesa",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const _handleInputChange = (field: keyof FormData) => (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    setFormData((prev) => ({ ...prev, [field]: e.target.value }))
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: undefined }))
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Plus className="h-5 w-5" />
            Agregar Nueva Mesa
          </DialogTitle>
          <DialogDescription>
            Completa los datos para crear una nueva mesa en el sistema.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            {/* Número de Mesa */}
            <div className="grid gap-2">
              <Label htmlFor="number">
                Identificador de Mesa <span className="text-destructive">*</span>
              </Label>
              <Input
                id="number"
                type="text"
                placeholder="Ej: Mesa 1, M1, 1, A1..."
                value={formData.number}
                onChange={(e) => {
                  setFormData(prev => ({ ...prev, number: e.target.value }))
                  if (errors.number) {
                    setErrors(prev => ({ ...prev, number: undefined }))
                  }
                }}
                maxLength={20}
                className={errors.number ? "border-destructive" : ""}
                disabled={isSubmitting}
              />
              {errors.number && (
                <p className="text-sm text-destructive">{errors.number}</p>
              )}
              <p className="text-xs text-muted-foreground">
                Puedes usar números, letras o combinaciones (ej: &quot;1&quot;, &quot;Mesa 1&quot;, &quot;M1&quot;, &quot;A1&quot;)
              </p>
            </div>

            {/* Zona */}
            <div className="grid gap-2">
              <Label htmlFor="zone_id">
                Zona <span className="text-destructive">*</span>
              </Label>
              <Select
                value={formData.zone_id}
                onValueChange={(value) => {
                  setFormData(prev => ({ ...prev, zone_id: value }))
                  if (errors.zone_id) {
                    setErrors(prev => ({ ...prev, zone_id: undefined }))
                  }
                }}
                disabled={isSubmitting || loadingZones}
              >
                <SelectTrigger className={errors.zone_id ? "border-destructive" : ""}>
                  <SelectValue placeholder="Selecciona una zona" />
                </SelectTrigger>
                <SelectContent>
                  {zones.length === 0 ? (
                    <div className="p-2 text-sm text-muted-foreground text-center">
                      {loadingZones ? "Cargando zonas..." : "No hay zonas disponibles"}
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
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Creando..." : "Crear Mesa"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
