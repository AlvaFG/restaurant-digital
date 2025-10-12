/**
 * Custom Hook: useModifierCalculations
 * 
 * Maneja la lógica de cálculo de modificadores para items del menú.
 * Centraliza la lógica de useMemo para evitar warnings de dependencias.
 * 
 * @module hooks/useModifierCalculations
 */

import { useMemo } from 'react'
import type { MenuItem } from '@/lib/mock-data'
import type { CartItemModifier, ModifierGroup, ModifierSelection, ModifierValidationResult } from '../_types/modifiers'
import { useCartItem } from '../_hooks/use-cart-item'

interface UseModifierCalculationsResult {
  modifierGroups: ModifierGroup[]
  validation: ModifierValidationResult
  cartModifiers: CartItemModifier[]
  totalPrice: number
}

/**
 * Hook para calcular y validar modificadores de un item del menú
 * 
 * @param item - Item del menú con sus grupos de modificadores
 * @param selections - Selecciones actuales del usuario
 * @returns Datos calculados y validados de modificadores
 * 
 * @example
 * ```tsx
 * const { validation, cartModifiers, totalPrice } = useModifierCalculations(item, selections)
 * 
 * if (!validation.valid) {
 *   console.log(validation.errors)
 * }
 * ```
 */
export function useModifierCalculations(
  item: MenuItem | null,
  selections: ModifierSelection[]
): UseModifierCalculationsResult {
  const { calculateItemTotal, validateModifiers, selectionsToModifiers } = useCartItem()

  // Memoizar modifierGroups para evitar recreación en cada render
  const modifierGroups = useMemo(
    () => item?.modifierGroups ?? [],
    [item]
  )

  // Validar selecciones actuales contra los grupos de modificadores
  const validation = useMemo(
    () => validateModifiers(modifierGroups, selections),
    [modifierGroups, selections, validateModifiers]
  )

  // Convertir selecciones a formato de carrito
  const cartModifiers = useMemo(
    () => selectionsToModifiers(modifierGroups, selections),
    [modifierGroups, selections, selectionsToModifiers]
  )

  // Calcular precio total incluyendo modificadores
  const totalPrice = useMemo(() => {
    if (!item) return 0
    return calculateItemTotal(item.priceCents, cartModifiers)
  }, [item, cartModifiers, calculateItemTotal])

  return {
    modifierGroups,
    validation,
    cartModifiers,
    totalPrice,
  }
}
