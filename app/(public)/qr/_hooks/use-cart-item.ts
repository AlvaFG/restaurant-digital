"use client"

import { useMemo } from "react"
import type {
  CartItemModifier,
  ModifierGroup,
  ModifierSelection,
  ModifierValidationResult,
} from "../_types/modifiers"

/**
 * Hook for cart item calculations and modifier validations
 */
export function useCartItem() {
  /**
   * Calculate total price for an item including base price and modifiers
   */
  const calculateItemTotal = useMemo(
    () => (basePriceCents: number, modifiers: CartItemModifier[]): number => {
      const modifiersTotal = modifiers.reduce((sum, mod) => sum + mod.priceCents, 0)
      return basePriceCents + modifiersTotal
    },
    [],
  )

  /**
   * Validate modifier selections against group rules
   */
  const validateModifiers = useMemo(
    () =>
      (groups: ModifierGroup[], selections: ModifierSelection[]): ModifierValidationResult => {
        const errors: Record<string, string> = {}
        const warnings: string[] = []

        for (const group of groups) {
          const selection = selections.find((s) => s.groupId === group.id)
          const selectedCount = selection?.selectedOptionIds.length ?? 0

          // Check required groups
          if (group.required && selectedCount === 0) {
            errors[group.id] = `Debes seleccionar al menos ${group.minSelection} opción${group.minSelection > 1 ? "es" : ""} en "${group.name}"`
            continue
          }

          // Check minimum selections
          if (selectedCount > 0 && selectedCount < group.minSelection) {
            errors[group.id] = `Selecciona al menos ${group.minSelection} opción${group.minSelection > 1 ? "es" : ""} en "${group.name}"`
            continue
          }

          // Check maximum selections
          if (selectedCount > group.maxSelection) {
            errors[group.id] = `Puedes seleccionar máximo ${group.maxSelection} opción${group.maxSelection > 1 ? "es" : ""} en "${group.name}"`
            continue
          }

          // Check if selected options are available
          if (selection) {
            const unavailableOptions = selection.selectedOptionIds.filter((optionId) => {
              const option = group.options.find((o) => o.id === optionId)
              return option && !option.available
            })

            if (unavailableOptions.length > 0) {
              const unavailableNames = unavailableOptions
                .map((optionId) => {
                  const option = group.options.find((o) => o.id === optionId)
                  return option?.name ?? optionId
                })
                .join(", ")
              warnings.push(`Algunas opciones no están disponibles: ${unavailableNames}`)
            }
          }
        }

        return {
          isValid: Object.keys(errors).length === 0,
          errors,
          warnings: warnings.length > 0 ? warnings : undefined,
        }
      },
    [],
  )

  /**
   * Convert selections to cart item modifiers
   */
  const selectionsToModifiers = useMemo(
    () =>
      (groups: ModifierGroup[], selections: ModifierSelection[]): CartItemModifier[] => {
        const modifiers: CartItemModifier[] = []

        for (const selection of selections) {
          const group = groups.find((g) => g.id === selection.groupId)
          if (!group) continue

          for (const optionId of selection.selectedOptionIds) {
            const option = group.options.find((o) => o.id === optionId)
            if (!option) continue

            modifiers.push({
              groupId: group.id,
              groupName: group.name,
              optionId: option.id,
              optionName: option.name,
              priceCents: option.priceCents,
            })
          }
        }

        return modifiers
      },
    [],
  )

  /**
   * Generate a unique customization ID based on modifiers and notes
   * Items with the same modifiers can be grouped together
   */
  const generateCustomizationId = useMemo(
    () =>
      (menuItemId: string, modifiers: CartItemModifier[], notes?: string): string => {
        const modifierIds = modifiers
          .map((m) => `${m.groupId}:${m.optionId}`)
          .sort()
          .join("|")
        const notesHash = notes?.trim() ? `:notes:${notes.trim()}` : ""
        return `${menuItemId}:${modifierIds}${notesHash}`
      },
    [],
  )

  /**
   * Check if two customization configurations are identical
   */
  const areCustomizationsEqual = useMemo(
    () =>
      (
        modifiers1: CartItemModifier[],
        notes1: string | undefined,
        modifiers2: CartItemModifier[],
        notes2: string | undefined,
      ): boolean => {
        if ((notes1?.trim() ?? "") !== (notes2?.trim() ?? "")) {
          return false
        }

        if (modifiers1.length !== modifiers2.length) {
          return false
        }

        const sorted1 = [...modifiers1].sort((a, b) =>
          `${a.groupId}:${a.optionId}`.localeCompare(`${b.groupId}:${b.optionId}`),
        )
        const sorted2 = [...modifiers2].sort((a, b) =>
          `${a.groupId}:${a.optionId}`.localeCompare(`${b.groupId}:${b.optionId}`),
        )

        return sorted1.every(
          (m1, idx) =>
            m1.groupId === sorted2[idx].groupId && m1.optionId === sorted2[idx].optionId,
        )
      },
    [],
  )

  return {
    calculateItemTotal,
    validateModifiers,
    selectionsToModifiers,
    generateCustomizationId,
    areCustomizationsEqual,
  }
}
