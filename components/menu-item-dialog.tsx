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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { Badge } from "@/components/ui/badge"
import { useToast } from "@/hooks/use-toast"
import { X, Loader2 } from 'lucide-react'

interface MenuItem {
  id: string
  name: string
  description: string
  priceCents: number
  categoryId: string
  available: boolean
  tags?: string[]
}

interface MenuCategory {
  id: string
  name: string
}

interface MenuItemDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  item?: MenuItem | null
  categories: MenuCategory[]
  onSave: (data: {
    name: string
    description: string
    priceCents: number
    categoryId: string
    available: boolean
    tags: string[]
  }) => Promise<void>
}

export function MenuItemDialog({
  open,
  onOpenChange,
  item,
  categories,
  onSave,
}: MenuItemDialogProps) {
  const { toast } = useToast()
  const [isSubmitting, setIsSubmitting] = useState(false)
  
  // Form state
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [price, setPrice] = useState('')
  const [categoryId, setCategoryId] = useState('')
  const [available, setAvailable] = useState(true)
  const [tags, setTags] = useState<string[]>([])
  const [currentTag, setCurrentTag] = useState('')

  // Reset form when dialog opens/closes or item changes
  useEffect(() => {
    if (open) {
      if (item) {
        // Editing existing item
        setName(item.name)
        setDescription(item.description || '')
        setPrice((item.priceCents / 100).toFixed(2))
        setCategoryId(item.categoryId)
        setAvailable(item.available)
        setTags(item.tags || [])
      } else {
        // Creating new item
        resetForm()
      }
    }
  }, [open, item])

  const resetForm = () => {
    setName('')
    setDescription('')
    setPrice('')
    setCategoryId(categories[0]?.id || '')
    setAvailable(true)
    setTags([])
    setCurrentTag('')
  }

  const handleAddTag = () => {
    const trimmedTag = currentTag.trim()
    if (trimmedTag && !tags.includes(trimmedTag)) {
      setTags([...tags, trimmedTag])
      setCurrentTag('')
    }
  }

  const handleRemoveTag = (tagToRemove: string) => {
    setTags(tags.filter(tag => tag !== tagToRemove))
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      handleAddTag()
    }
  }

  const validateForm = (): boolean => {
    const trimmedName = name.trim()
    if (!trimmedName) {
      toast({
        title: 'Nombre requerido',
        description: 'Ingresa un nombre para el item.',
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

    const priceValue = parseFloat(price)
    if (isNaN(priceValue) || priceValue < 0) {
      toast({
        title: 'Precio inválido',
        description: 'Ingresa un precio válido mayor o igual a 0.',
        variant: 'destructive',
      })
      return false
    }

    if (!categoryId) {
      toast({
        title: 'Categoría requerida',
        description: 'Selecciona una categoría para el item.',
        variant: 'destructive',
      })
      return false
    }

    if (description.length > 500) {
      toast({
        title: 'Descripción muy larga',
        description: 'La descripción no puede exceder 500 caracteres.',
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
        description: description.trim(),
        priceCents: Math.round(parseFloat(price) * 100),
        categoryId,
        available,
        tags,
      })

      toast({
        title: item ? 'Item actualizado' : 'Item creado',
        description: item
          ? `"${name}" fue actualizado exitosamente.`
          : `"${name}" fue creado exitosamente.`,
      })

      onOpenChange(false)
    } catch (error) {
      toast({
        title: item ? 'Error al actualizar item' : 'Error al crear item',
        description: error instanceof Error ? error.message : 'Intenta nuevamente.',
        variant: 'destructive',
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{item ? 'Editar Item del Menú' : 'Nuevo Item del Menú'}</DialogTitle>
          <DialogDescription>
            {item
              ? 'Modifica los datos del item del menú.'
              : 'Completa los datos para agregar un nuevo item al menú.'}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Nombre */}
          <div className="space-y-2">
            <Label htmlFor="name">
              Nombre <span className="text-destructive">*</span>
            </Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ej: Pizza Margherita"
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
            <Label htmlFor="description">Descripción</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe el item..."
              maxLength={500}
              rows={3}
              disabled={isSubmitting}
            />
            <p className="text-xs text-muted-foreground">
              {description.length}/500 caracteres
            </p>
          </div>

          {/* Precio y Categoría */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="price">
                Precio (ARS) <span className="text-destructive">*</span>
              </Label>
              <Input
                id="price"
                type="number"
                step="0.01"
                min="0"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                placeholder="0.00"
                disabled={isSubmitting}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="category">
                Categoría <span className="text-destructive">*</span>
              </Label>
              <Select
                value={categoryId}
                onValueChange={setCategoryId}
                disabled={isSubmitting || categories.length === 0}
              >
                <SelectTrigger id="category">
                  <SelectValue placeholder="Selecciona categoría" />
                </SelectTrigger>
                <SelectContent>
                  {categories.map((category) => (
                    <SelectItem key={category.id} value={category.id}>
                      {category.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Tags */}
          <div className="space-y-2">
            <Label htmlFor="tags">Etiquetas (opcional)</Label>
            <div className="flex gap-2">
              <Input
                id="tags"
                value={currentTag}
                onChange={(e) => setCurrentTag(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Ej: Vegetariano, Picante..."
                disabled={isSubmitting}
              />
              <Button
                type="button"
                variant="outline"
                onClick={handleAddTag}
                disabled={isSubmitting || !currentTag.trim()}
              >
                Agregar
              </Button>
            </div>
            {tags.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-2">
                {tags.map((tag) => (
                  <Badge key={tag} variant="secondary" className="gap-1">
                    {tag}
                    <button
                      type="button"
                      onClick={() => handleRemoveTag(tag)}
                      disabled={isSubmitting}
                      className="ml-1 hover:text-destructive"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                ))}
              </div>
            )}
          </div>

          {/* Disponibilidad */}
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="available">Disponible</Label>
              <p className="text-sm text-muted-foreground">
                El item estará visible para los clientes
              </p>
            </div>
            <Switch
              id="available"
              checked={available}
              onCheckedChange={setAvailable}
              disabled={isSubmitting}
            />
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
            {item ? 'Actualizar' : 'Crear'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
