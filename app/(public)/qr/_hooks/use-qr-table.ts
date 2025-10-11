"use client"

import { useCallback, useEffect, useRef, useState } from "react"

import type { Table } from "@/lib/mock-data"

interface TableMetadata {
  version: number
  updatedAt: string
}

interface TableApiResponse {
  data: Table
  metadata?: TableMetadata
  history?: unknown[]
}

type FetchStatus = "idle" | "loading" | "success" | "error" | "not-found"

export function useQrTable(tableId: string) {
  const controllerRef = useRef<AbortController | null>(null)
  const [table, setTable] = useState<Table | null>(null)
  const [metadata, setMetadata] = useState<TableMetadata | null>(null)
  const [status, setStatus] = useState<FetchStatus>("idle")
  const [error, setError] = useState<string | null>(null)
  const [isRefetching, setIsRefetching] = useState(false)

  const runFetch = useCallback(async () => {
    if (!tableId) {
      setStatus("error")
      setError("Identificador de mesa invalido")
      setTable(null)
      setMetadata(null)
      return null
    }

    controllerRef.current?.abort()
    const controller = new AbortController()
    controllerRef.current = controller

    setError(null)
    setIsRefetching(status === "success")
    setStatus((previous) => (previous === "success" ? previous : "loading"))

    try {
      const response = await fetch(`/api/tables/by-token/${encodeURIComponent(tableId)}`, {
        cache: "no-store",
        signal: controller.signal,
      })

      if (controller.signal.aborted) {
        return null
      }

      if (response.status === 404) {
        setTable(null)
        setMetadata(null)
        setStatus("not-found")
        return null
      }

      if (!response.ok) {
        let message = `No se pudo cargar la mesa (codigo ${response.status})`
        try {
          const payload = (await response.json()) as { error?: string }
          if (payload?.error) {
            message = payload.error
          }
        } catch {
          // ignore parse errors
        }
        throw new Error(message)
      }

      const payload = (await response.json()) as TableApiResponse

      if (!payload?.data) {
        throw new Error("Respuesta invalida del servicio de mesas")
      }

      setTable(payload.data)
      setMetadata(payload.metadata ?? null)
      setStatus("success")

      return payload
    } catch (error) {
      if (controller.signal.aborted) {
        return null
      }

      const message = error instanceof Error && error.message ? error.message : "No se pudo cargar la mesa"
      setError(message)
      setStatus("error")
      return null
    } finally {
      if (controllerRef.current === controller) {
        controllerRef.current = null
      }
      setIsRefetching(false)
    }
  }, [tableId, status])

  useEffect(() => {
    setTable(null)
    setMetadata(null)
    setStatus("loading")
    setError(null)
    runFetch().catch(() => undefined)

    return () => {
      controllerRef.current?.abort()
    }
  }, [runFetch])

  const refetch = useCallback(async () => {
    return runFetch()
  }, [runFetch])

  return {
    table,
    metadata,
    status,
    error,
    isLoading: status === "loading" && !table,
    isRefetching,
    isError: status === "error",
    isNotFound: status === "not-found",
    refetch,
  }
}
