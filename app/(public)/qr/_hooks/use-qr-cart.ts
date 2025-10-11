"use client"

import { useCallback, useEffect, useMemo, useState } from "react"

import type { MenuItem } from "@/lib/mock-data"
import type { CartItemModifier } from "../_types/modifiers"

interface CartEntry {
  menuItemId: string
  quantity: number
  modifiers: CartItemModifier[]
  notes?: string
  customizationId: string
}

export interface DetailedCartEntry {
  item: MenuItem
  quantity: number
  modifiers: CartItemModifier[]
  notes: string | undefined
  customizationId: string
}

const STORAGE_PREFIX = "restaurant-qr-cart:v1:"

/**
 * Generate storage key for cart data
 * If sessionId is provided, use it for session-based cart (future: multi-device sync)
 * Otherwise fall back to table-based cart for legacy support
 */
function getStorageKey(tableId: string, sessionId?: string) {
  if (sessionId) {
    return `${STORAGE_PREFIX}session:${sessionId}`
  }
  return `${STORAGE_PREFIX}table:${tableId}`
}

function sanitizeQuantity(value: number) {
  if (!Number.isFinite(value)) {
    return 0
  }
  return Math.max(0, Math.floor(value))
}

function readCart(tableId: string, sessionId?: string): CartEntry[] {
  if (typeof window === "undefined") {
    return []
  }

  try {
    const raw = window.localStorage.getItem(getStorageKey(tableId, sessionId))
    if (!raw) {
      return []
    }
    const parsed = JSON.parse(raw) as CartEntry[]
    if (!Array.isArray(parsed)) {
      return []
    }
    return parsed
      .map((entry) => ({
        menuItemId: String(entry.menuItemId),
        quantity: sanitizeQuantity(Number(entry.quantity)),
        modifiers: Array.isArray(entry.modifiers) ? entry.modifiers : [],
        notes: entry.notes ? String(entry.notes) : undefined,
        customizationId: String(entry.customizationId || entry.menuItemId),
      }))
      .filter((entry) => entry.menuItemId && entry.quantity > 0)
  } catch (error) {
    console.warn("[useQrCart] Failed to read persisted cart", error)
    return []
  }
}

function writeCart(tableId: string, sessionId: string | undefined, entries: CartEntry[]) {
  if (typeof window === "undefined") {
    return
  }

  try {
    if (entries.length === 0) {
      window.localStorage.removeItem(getStorageKey(tableId, sessionId))
      return
    }

    window.localStorage.setItem(getStorageKey(tableId, sessionId), JSON.stringify(entries))
  } catch (error) {
    console.warn("[useQrCart] Failed to persist cart", error)
  }
}

/**
 * Hook to manage QR cart state with localStorage persistence
 * 
 * @param tableId - The table identifier
 * @param sessionId - Optional session ID for session-based cart (enables multi-device sync in future)
 * @param menuItems - Available menu items to validate cart entries against
 */
export function useQrCart(tableId: string, sessionId: string | undefined, menuItems: MenuItem[]) {
  const [entries, setEntries] = useState<CartEntry[]>(() => readCart(tableId, sessionId))

  useEffect(() => {
    setEntries(readCart(tableId, sessionId))
  }, [tableId, sessionId])

  useEffect(() => {
    writeCart(tableId, sessionId, entries)
  }, [entries, tableId, sessionId])

  const itemsMap = useMemo(() => {
    const map = new Map<string, MenuItem>()
    for (const item of menuItems) {
      map.set(item.id, item)
    }
    return map
  }, [menuItems])

  useEffect(() => {
    setEntries((current) => {
      const filtered = current.filter((entry) => itemsMap.has(entry.menuItemId))
      return filtered.length === current.length ? current : filtered
    })
  }, [itemsMap])

  const detailedItems = useMemo(() => {
    return entries
      .map((entry) => {
        const item = itemsMap.get(entry.menuItemId)
        if (!item) {
          return null
        }
        return {
          item,
          quantity: entry.quantity,
          modifiers: entry.modifiers,
          notes: entry.notes,
          customizationId: entry.customizationId,
        }
      })
      .filter((value): value is DetailedCartEntry => Boolean(value))
  }, [entries, itemsMap])

  const itemCount = useMemo(
    () => detailedItems.reduce((acc, entry) => acc + entry.quantity, 0),
    [detailedItems],
  )

  const totalCents = useMemo(
    () =>
      detailedItems.reduce((acc, entry) => {
        const basePrice = entry.item.priceCents
        const modifiersPrice = entry.modifiers.reduce((sum, mod) => sum + mod.priceCents, 0)
        return acc + (basePrice + modifiersPrice) * entry.quantity
      }, 0),
    [detailedItems],
  )

  const addOrIncrement = useCallback(
    (menuItemId: string, modifiers: CartItemModifier[] = [], notes?: string) => {
      setEntries((current) => {
        // Generate customization ID
        const modifierIds = modifiers
          .map((m) => `${m.groupId}:${m.optionId}`)
          .sort()
          .join("|")
        const notesHash = notes?.trim() ? `:notes:${notes.trim()}` : ""
        const customizationId = `${menuItemId}:${modifierIds}${notesHash}`

        // Find existing entry with same customization
        const existing = current.find((entry) => entry.customizationId === customizationId)
        
        if (!existing) {
          return [...current, { menuItemId, quantity: 1, modifiers, notes, customizationId }]
        }

        return current.map((entry) =>
          entry.customizationId === customizationId
            ? { ...entry, quantity: entry.quantity + 1 }
            : entry,
        )
      })
    },
    [],
  )

  const increment = useCallback((customizationId: string) => {
    setEntries((current) =>
      current.map((entry) =>
        entry.customizationId === customizationId
          ? { ...entry, quantity: entry.quantity + 1 }
          : entry,
      ),
    )
  }, [])

  const decrement = useCallback((customizationId: string) => {
    setEntries((current) =>
      current
        .map((entry) =>
          entry.customizationId === customizationId
            ? { ...entry, quantity: entry.quantity - 1 }
            : entry,
        )
        .filter((entry) => entry.quantity > 0),
    )
  }, [])

  const remove = useCallback((customizationId: string) => {
    setEntries((current) => current.filter((entry) => entry.customizationId !== customizationId))
  }, [])

  const clear = useCallback(() => {
    setEntries([])
  }, [])

  const setQuantity = useCallback((customizationId: string, quantity: number) => {
    const nextQuantity = sanitizeQuantity(quantity)
    if (nextQuantity <= 0) {
      remove(customizationId)
      return
    }

    setEntries((current) =>
      current.map((entry) =>
        entry.customizationId === customizationId
          ? { ...entry, quantity: nextQuantity }
          : entry,
      ),
    )
  }, [remove])

  const hasUnavailableItems = useMemo(
    () => detailedItems.some((entry) => entry.item.available === false),
    [detailedItems],
  )

  return {
    entries,
    detailedItems,
    itemCount,
    totalCents,
    hasUnavailableItems,
    addOrIncrement,
    increment,
    decrement,
    remove,
    clear,
    setQuantity,
  }
}
