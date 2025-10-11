"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Checkbox } from "@/components/ui/checkbox"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import type { MenuItem } from "@/lib/mock-data"
import type { CartItemModifier, ModifierGroup, ModifierSelection } from "../_types/modifiers"
import { useCartItem } from "../_hooks/use-cart-item"
import { AlertCircle, Check, ShoppingCart } from "lucide-react"
import { cn } from "@/lib/utils"

interface ItemCustomizationModalProps {
  item: MenuItem | null
  isOpen: boolean
  onClose: () => void
  onAddToCart: (modifiers: CartItemModifier[], notes?: string) => void
  currencyFormatter: Intl.NumberFormat
}

export function ItemCustomizationModal({
  item,
  isOpen,
  onClose,
  onAddToCart,
  currencyFormatter,
}: ItemCustomizationModalProps) {
  const [selections, setSelections] = useState<ModifierSelection[]>([])
  const [notes, setNotes] = useState<string>("")
  const { calculateItemTotal, validateModifiers, selectionsToModifiers } = useCartItem()

  // Reset state when item changes
  useEffect(() => {
    if (item && isOpen) {
      // Initialize with empty selections
      setSelections([])
      setNotes("")
    }
  }, [item, isOpen])

  const modifierGroups = item?.modifierGroups ?? []

  // Validate current selections
  const validation = useMemo(
    () => validateModifiers(modifierGroups, selections),
    [modifierGroups, selections, validateModifiers],
  )

  // Calculate total price
  const cartModifiers = useMemo(
    () => selectionsToModifiers(modifierGroups, selections),
    [modifierGroups, selections, selectionsToModifiers],
  )

  const totalPrice = useMemo(() => {
    if (!item) return 0
    return calculateItemTotal(item.priceCents, cartModifiers)
  }, [item, cartModifiers, calculateItemTotal])

  const handleToggleOption = useCallback(
    (groupId: string, optionId: string, maxSelection: number) => {
      setSelections((prev) => {
        const existing = prev.find((s) => s.groupId === groupId)

        if (!existing) {
          return [...prev, { groupId, selectedOptionIds: [optionId] }]
        }

        const isSelected = existing.selectedOptionIds.includes(optionId)

        if (isSelected) {
          // Remove selection
          const newOptions = existing.selectedOptionIds.filter((id) => id !== optionId)
          if (newOptions.length === 0) {
            return prev.filter((s) => s.groupId !== groupId)
          }
          return prev.map((s) =>
            s.groupId === groupId ? { ...s, selectedOptionIds: newOptions } : s,
          )
        }

        // Add selection (respect maxSelection)
        if (maxSelection === 1) {
          // Single selection: replace existing
          return prev.map((s) =>
            s.groupId === groupId ? { ...s, selectedOptionIds: [optionId] } : s,
          )
        }

        // Multiple selection: add if under limit
        if (existing.selectedOptionIds.length >= maxSelection) {
          // Already at max, don't add
          return prev
        }

        return prev.map((s) =>
          s.groupId === groupId
            ? { ...s, selectedOptionIds: [...s.selectedOptionIds, optionId] }
            : s,
        )
      })
    },
    [],
  )

  const handleAddToCart = useCallback(() => {
    if (!validation.isValid || !item) return

    onAddToCart(cartModifiers, notes.trim() || undefined)
    onClose()
  }, [validation.isValid, item, cartModifiers, notes, onAddToCart, onClose])

  if (!item) return null

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-h-[90vh] max-w-lg overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl">{item.name}</DialogTitle>
          <DialogDescription className="text-sm">
            Personaliza tu pedido antes de agregarlo al carrito
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Modifier Groups */}
          {modifierGroups.map((group) => (
            <ModifierGroupSection
              key={group.id}
              group={group}
              selections={selections}
              onToggleOption={handleToggleOption}
              currencyFormatter={currencyFormatter}
              error={validation.errors[group.id]}
            />
          ))}

          {/* Special Notes */}
          <div className="space-y-2">
            <Label htmlFor="special-notes" className="text-sm font-medium">
              Instrucciones especiales (opcional)
            </Label>
            <Textarea
              id="special-notes"
              placeholder="Ej: Sin cebolla, bien cocido, etc."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
              maxLength={200}
              className="resize-none text-sm"
            />
            <p className="text-xs text-muted-foreground">{notes.length}/200 caracteres</p>
          </div>

          {/* Validation Warnings */}
          {validation.warnings && validation.warnings.length > 0 ? (
            <div className="rounded-lg border border-amber-500/40 bg-amber-50 px-3 py-2 text-xs text-amber-900 dark:bg-amber-950/40 dark:text-amber-200">
              <div className="flex items-start gap-2">
                <AlertCircle className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
                <div className="space-y-1">
                  {validation.warnings.map((warning, idx) => (
                    <p key={idx}>{warning}</p>
                  ))}
                </div>
              </div>
            </div>
          ) : null}
        </div>

        <DialogFooter className="flex-col gap-3 border-t border-border/60 pt-4">
          <div className="flex w-full items-center justify-between text-sm font-semibold">
            <span>Total</span>
            <span className="text-lg">{currencyFormatter.format(totalPrice / 100)}</span>
          </div>

          <Button
            type="button"
            className="w-full gap-2 rounded-full font-semibold"
            onClick={handleAddToCart}
            disabled={!validation.isValid}
          >
            <ShoppingCart className="size-4" aria-hidden="true" />
            <span>Agregar al carrito</span>
          </Button>

          {!validation.isValid && Object.keys(validation.errors).length > 0 ? (
            <p className="text-center text-xs text-destructive">
              Completa las opciones requeridas para continuar
            </p>
          ) : null}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

interface ModifierGroupSectionProps {
  group: ModifierGroup
  selections: ModifierSelection[]
  onToggleOption: (groupId: string, optionId: string, maxSelection: number) => void
  currencyFormatter: Intl.NumberFormat
  error?: string
}

function ModifierGroupSection({
  group,
  selections,
  onToggleOption,
  currencyFormatter,
  error,
}: ModifierGroupSectionProps) {
  const selectedIds =
    selections.find((s) => s.groupId === group.id)?.selectedOptionIds ?? []
  const isSingleSelection = group.maxSelection === 1

  return (
    <div className="space-y-3">
      <div className="flex items-start justify-between gap-2">
        <div className="space-y-0.5">
          <h3 className="text-sm font-semibold">
            {group.name}
            {group.required ? <span className="ml-1 text-destructive">*</span> : null}
          </h3>
          {group.description ? (
            <p className="text-xs text-muted-foreground">{group.description}</p>
          ) : null}
          <p className="text-xs text-muted-foreground">
            {group.maxSelection === 1
              ? "Elige una opción"
              : `Elige hasta ${group.maxSelection} opciones`}
          </p>
        </div>

        {selectedIds.length > 0 ? (
          <Badge variant="secondary" className="shrink-0">
            {selectedIds.length} seleccionada{selectedIds.length > 1 ? "s" : ""}
          </Badge>
        ) : null}
      </div>

      {error ? (
        <div className="flex items-center gap-1.5 text-xs text-destructive">
          <AlertCircle className="size-3" aria-hidden="true" />
          <span>{error}</span>
        </div>
      ) : null}

      <div className="space-y-2">
        {isSingleSelection ? (
          <RadioGroup value={selectedIds[0] ?? ""}>
            {group.options.map((option) => {
              const isSelected = selectedIds.includes(option.id)
              return (
                <div
                  key={option.id}
                  className={cn(
                    "flex items-center space-x-3 rounded-lg border border-border/60 p-3 transition-colors",
                    isSelected && "border-primary bg-primary/5",
                    !option.available && "opacity-50",
                  )}
                >
                  <RadioGroupItem
                    value={option.id}
                    id={`${group.id}-${option.id}`}
                    disabled={!option.available}
                    onClick={() => onToggleOption(group.id, option.id, group.maxSelection)}
                  />
                  <Label
                    htmlFor={`${group.id}-${option.id}`}
                    className="flex flex-1 cursor-pointer items-center justify-between"
                  >
                    <div className="space-y-0.5">
                      <p className="text-sm font-medium leading-none">{option.name}</p>
                      {option.description ? (
                        <p className="text-xs text-muted-foreground">{option.description}</p>
                      ) : null}
                      {!option.available ? (
                        <p className="text-xs text-destructive">No disponible</p>
                      ) : null}
                    </div>
                    {option.priceCents !== 0 ? (
                      <span className="ml-2 text-sm font-medium">
                        {option.priceCents > 0 ? "+" : ""}
                        {currencyFormatter.format(option.priceCents / 100)}
                      </span>
                    ) : null}
                  </Label>
                </div>
              )
            })}
          </RadioGroup>
        ) : (
          <div className="space-y-2">
            {group.options.map((option) => {
              const isSelected = selectedIds.includes(option.id)
              const isAtMax = selectedIds.length >= group.maxSelection
              const isDisabled = !option.available || (isAtMax && !isSelected)

              return (
                <div
                  key={option.id}
                  className={cn(
                    "flex items-center space-x-3 rounded-lg border border-border/60 p-3 transition-colors",
                    isSelected && "border-primary bg-primary/5",
                    isDisabled && "opacity-50",
                  )}
                >
                  <Checkbox
                    id={`${group.id}-${option.id}`}
                    checked={isSelected}
                    disabled={isDisabled}
                    onCheckedChange={() =>
                      onToggleOption(group.id, option.id, group.maxSelection)
                    }
                  />
                  <Label
                    htmlFor={`${group.id}-${option.id}`}
                    className="flex flex-1 cursor-pointer items-center justify-between"
                  >
                    <div className="flex items-center gap-2">
                      <div className="space-y-0.5">
                        <p className="text-sm font-medium leading-none">{option.name}</p>
                        {option.description ? (
                          <p className="text-xs text-muted-foreground">{option.description}</p>
                        ) : null}
                        {!option.available ? (
                          <p className="text-xs text-destructive">No disponible</p>
                        ) : null}
                      </div>
                      {isSelected ? (
                        <Check className="size-4 text-primary" aria-hidden="true" />
                      ) : null}
                    </div>
                    {option.priceCents !== 0 ? (
                      <span className="ml-2 text-sm font-medium">
                        {option.priceCents > 0 ? "+" : ""}
                        {currencyFormatter.format(option.priceCents / 100)}
                      </span>
                    ) : null}
                  </Label>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
