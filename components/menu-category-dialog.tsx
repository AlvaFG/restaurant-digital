"use client"

import { useState, useEffect } from 'react'
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
import { useToast } from "@/hooks/use-toast"
import { Loader2 } from 'lucide-react'

interface MenuCategory {
  id: string
  name: string
  description?: string | null
  sortOrder?: number | null
}

interface MenuCategoryDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  category?: MenuCategory | null
  onSave: (data: {
    name: string
    description?: string
    sortOrder?: number
  }) => Promise<void>
}

export function MenuCategoryDialog({
  open,
  onOpenChange,
  category,
  onSave,
}: MenuCategoryDialogProps) {
  const { toast } = useToast()
  const [isSubmitting, setIsSubmitting] = useState(false)
  
  // Form state
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [sortOrder, setSortOrder] = useState('')

  // Reset form when dialog opens/closes or category changes
  useEffect(() => {
    if (open) {
      if (category) {
        // Editing existing category
        setName(category.name)
        setDescription(category.description || '')
        setSortOrder(category.sortOrder?.toString() || '')
      } else {
        // Creating new category
        resetForm()
      }
    }
  }, [open, category])

  const resetForm = () => {
    setName('')
    setDescription('')
    setSortOrder('')
  }

  const validateForm = (): boolean => {
    const trimmedName = name.trim()
    if (!trimmedName) {
      toast({
        title: 'Nombre requerido',
        description: 'Ingresa un nombre para la categoría.',
        variant: 'destructive',
      })
      return false
    }

    if (trimmedName.length > 100) {
      toast({
        title: 'Nombre muy largo',
        description: 'El nombre no puede exceder 100 caracteres.',
        variant: 'destructive',
      })
      return false
    }

    if (description.length > 300) {
      toast({
        title: 'Descripción muy larga',
        description: 'La descripción no puede exceder 300 caracteres.',
        variant: 'destructive',
      })
      return false
    }

    if (sortOrder && (isNaN(Number(sortOrder)) || Number(sortOrder) < 0)) {
      toast({
        title: 'Orden inválido',
        description: 'El orden debe ser un número mayor o igual a 0.',
        variant: 'destructive',
      })
      return false
    }

    return true
  }

  const handleSubmit = async () => {
    if (!validateForm()) return
    if (isSubmitting) return

    setIsSubmitting(true)
    try {
      await onSave({
        name: name.trim(),
        description: description.trim() || undefined,
        sortOrder: sortOrder ? Number(sortOrder) : undefined,
      })

      toast({
        title: category ? 'Categoría actualizada' : 'Categoría creada',
        description: category
          ? `"${name}" fue actualizada exitosamente.`
          : `"${name}" fue creada exitosamente.`,
      })

      onOpenChange(false)
    } catch (error) {
      toast({
        title: category ? 'Error al actualizar categoría' : 'Error al crear categoría',
        description: error instanceof Error ? error.message : 'Intenta nuevamente.',
        variant: 'destructive',
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>
            {category ? 'Editar Categoría' : 'Nueva Categoría'}
          </DialogTitle>
          <DialogDescription>
            {category
              ? 'Modifica los datos de la categoría.'
              : 'Completa los datos para agregar una nueva categoría.'}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Nombre */}
          <div className="space-y-2">
            <Label htmlFor="category-name">
              Nombre <span className="text-destructive">*</span>
            </Label>
            <Input
              id="category-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ej: Entradas, Pizzas, Postres..."
              maxLength={100}
              disabled={isSubmitting}
              required
            />
            <p className="text-xs text-muted-foreground">
              {name.length}/100 caracteres
            </p>
          </div>

          {/* Descripción */}
          <div className="space-y-2">
            <Label htmlFor="category-description">Descripción (opcional)</Label>
            <Textarea
              id="category-description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe la categoría..."
              maxLength={300}
              rows={3}
              disabled={isSubmitting}
            />
            <p className="text-xs text-muted-foreground">
              {description.length}/300 caracteres
            </p>
          </div>

          {/* Orden */}
          <div className="space-y-2">
            <Label htmlFor="category-order">Orden de visualización (opcional)</Label>
            <Input
              id="category-order"
              type="number"
              min="0"
              value={sortOrder}
              onChange={(e) => setSortOrder(e.target.value)}
              placeholder="0"
              disabled={isSubmitting}
            />
            <p className="text-xs text-muted-foreground">
              Número menor aparece primero en el menú
            </p>
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
          <Button onClick={handleSubmit} disabled={isSubmitting}>
            {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {category ? 'Actualizar' : 'Crear'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
