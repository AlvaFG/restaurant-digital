"use client"

import { useCallback, useEffect, useState } from "react"

import type { MenuAllergen, MenuCategory, MenuItem, MenuMetadata, MenuResponse } from "@/lib/mock-data"

export interface MenuCatalogData extends MenuResponse {
  headers: {
    version: string | null
    updatedAt: string | null
  }
}

type FetchStatus = "idle" | "loading" | "success" | "error"

let cachedCatalog: MenuCatalogData | null = null
let cachedError: string | null = null
let inFlightRequest: Promise<MenuCatalogData> | null = null

async function requestMenuCatalog() {
  const response = await fetch("/api/menu", { cache: "no-store" })

  if (!response.ok) {
    let message = `Error ${response.status} al cargar el menú`
    try {
      const errorPayload = await response.json()
      if (errorPayload && typeof errorPayload.error === "string") {
        message = errorPayload.error
      }
    } catch {
      // ignore body parsing issues
    }
    throw new Error(message)
  }

  try {
    const payload = (await response.json()) as { data?: MenuResponse }
    const data = payload?.data

    if (!data) {
      throw new Error("Respuesta inválida del catálogo de menú")
    }

    const metadata: MenuMetadata = data.metadata ?? {
      currency: "ARS",
      version: 1,
      updatedAt: new Date().toISOString(),
    }

    return {
      categories: data.categories ?? [],
      items: data.items ?? [],
      allergens: data.allergens ?? [],
      metadata,
      headers: {
        version: response.headers.get("x-menu-version"),
        updatedAt: response.headers.get("x-menu-updated-at"),
      },
    }
  } catch (error) {
    throw new Error(error instanceof Error ? error.message : "Respuesta inválida del catálogo de menú")
  }
}

async function loadMenuCatalog(force = false) {
  if (cachedCatalog && !force) {
    return cachedCatalog
  }

  if (inFlightRequest && !force) {
    return inFlightRequest
  }

  const request = requestMenuCatalog()
  inFlightRequest = request

  try {
    const catalog = await request
    cachedCatalog = catalog
    cachedError = null
    return catalog
  } catch (error) {
    cachedError = error instanceof Error ? error.message : "No se pudo cargar el menú"
    throw error
  } finally {
    inFlightRequest = null
  }
}

function getReadableError(error: unknown) {
  if (error instanceof Error && error.message) {
    return error.message
  }
  return "No se pudo cargar el menú"
}

export function useMenuCatalog() {
  const [catalog, setCatalog] = useState<MenuCatalogData | null>(cachedCatalog)
  const [status, setStatus] = useState<FetchStatus>(cachedCatalog ? "success" : cachedError ? "error" : "idle")
  const [error, setError] = useState<string | null>(cachedError)
  const [isRefetching, setIsRefetching] = useState(false)

  const fetchCatalog = useCallback(
    async (options?: { force?: boolean }) => {
      const force = Boolean(options?.force)

      if (!force && cachedCatalog) {
        setCatalog(cachedCatalog)
        setStatus("success")
        setError(null)
        return cachedCatalog
      }

      if (!force && inFlightRequest) {
        setStatus((previous) => (previous === "success" ? previous : "loading"))
        setIsRefetching(Boolean(cachedCatalog))
        try {
          const catalogData = await inFlightRequest
          setCatalog(catalogData)
          setStatus("success")
          setError(null)
          return catalogData
        } catch (error) {
          const readableError = getReadableError(error)
          setStatus("error")
          setError(readableError)
          throw error
        } finally {
          setIsRefetching(false)
        }
      }

      setStatus((previous) => (previous === "success" && !force ? previous : "loading"))
      setIsRefetching(Boolean(cachedCatalog) && (force || Boolean(catalog)))
      setError(null)

      try {
        const catalogData = await loadMenuCatalog(force)
        setCatalog(catalogData)
        setStatus("success")
        setError(null)
        return catalogData
      } catch (error) {
        const readableError = getReadableError(error)
        setStatus("error")
        setError(readableError)
        if (!cachedCatalog) {
          setCatalog(null)
        }
        throw error
      } finally {
        setIsRefetching(false)
      }
    },
    [catalog],
  )

  useEffect(() => {
    if (!catalog && status === "idle") {
      void fetchCatalog().catch(() => undefined)
    }
  }, [catalog, fetchCatalog, status])

  return {
    catalog,
    categories: catalog?.categories ?? ([] as MenuCategory[]),
    items: catalog?.items ?? ([] as MenuItem[]),
    allergens: catalog?.allergens ?? ([] as MenuAllergen[]),
    metadata: catalog?.metadata ?? null,
    headers: catalog?.headers ?? { version: null, updatedAt: null },
    status,
    isLoading: status === "loading" && !catalog,
    isRefetching,
    isError: status === "error",
    error,
    refetch: () => fetchCatalog({ force: true }),
  }
}
