"use client"

import { useCallback, useEffect, useMemo, useState } from "react"

import type { MenuItem } from "@/lib/mock-data"

interface CartEntry {
  menuItemId: string
  quantity: number
}

export interface DetailedCartEntry {
  item: MenuItem
  quantity: number
}

const STORAGE_PREFIX = "restaurant-qr-cart:v1:"

function getStorageKey(tableId: string) {
  return STORAGE_PREFIX + tableId
}

function sanitizeQuantity(value: number) {
  if (!Number.isFinite(value)) {
    return 0
  }
  return Math.max(0, Math.floor(value))
}

function readCart(tableId: string): CartEntry[] {
  if (typeof window === "undefined") {
    return []
  }

  try {
    const raw = window.localStorage.getItem(getStorageKey(tableId))
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
      }))
      .filter((entry) => entry.menuItemId && entry.quantity > 0)
  } catch (error) {
    console.warn("[useQrCart] Failed to read persisted cart", error)
    return []
  }
}

function writeCart(tableId: string, entries: CartEntry[]) {
  if (typeof window === "undefined") {
    return
  }

  try {
    if (entries.length === 0) {
      window.localStorage.removeItem(getStorageKey(tableId))
      return
    }

    window.localStorage.setItem(getStorageKey(tableId), JSON.stringify(entries))
  } catch (error) {
    console.warn("[useQrCart] Failed to persist cart", error)
  }
}

export function useQrCart(tableId: string, menuItems: MenuItem[]) {
  const [entries, setEntries] = useState<CartEntry[]>(() => readCart(tableId))

  useEffect(() => {
    setEntries(readCart(tableId))
  }, [tableId])

  useEffect(() => {
    writeCart(tableId, entries)
  }, [entries, tableId])

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
        }
      })
      .filter((value): value is DetailedCartEntry => Boolean(value))
  }, [entries, itemsMap])

  const itemCount = useMemo(
    () => detailedItems.reduce((acc, entry) => acc + entry.quantity, 0),
    [detailedItems],
  )

  const totalCents = useMemo(
    () => detailedItems.reduce((acc, entry) => acc + entry.item.priceCents * entry.quantity, 0),
    [detailedItems],
  )

  const addOrIncrement = useCallback(
    (menuItemId: string) => {
      setEntries((current) => {
        const existing = current.find((entry) => entry.menuItemId === menuItemId)
        if (!existing) {
          return [...current, { menuItemId, quantity: 1 }]
        }

        return current.map((entry) =>
          entry.menuItemId === menuItemId
            ? { ...entry, quantity: entry.quantity + 1 }
            : entry,
        )
      })
    },
    [],
  )

  const increment = useCallback((menuItemId: string) => {
    setEntries((current) =>
      current.map((entry) =>
        entry.menuItemId === menuItemId
          ? { ...entry, quantity: entry.quantity + 1 }
          : entry,
      ),
    )
  }, [])

  const decrement = useCallback((menuItemId: string) => {
    setEntries((current) =>
      current
        .map((entry) =>
          entry.menuItemId === menuItemId
            ? { ...entry, quantity: entry.quantity - 1 }
            : entry,
        )
        .filter((entry) => entry.quantity > 0),
    )
  }, [])

  const remove = useCallback((menuItemId: string) => {
    setEntries((current) => current.filter((entry) => entry.menuItemId !== menuItemId))
  }, [])

  const clear = useCallback(() => {
    setEntries([])
  }, [])

  const setQuantity = useCallback((menuItemId: string, quantity: number) => {
    const nextQuantity = sanitizeQuantity(quantity)
    if (nextQuantity <= 0) {
      remove(menuItemId)
      return
    }

    setEntries((current) =>
      current.map((entry) =>
        entry.menuItemId === menuItemId
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
