"use client"

import { useCallback, useEffect, useMemo, useRef, useState } from "react"

import { useSocket } from "@/hooks/use-socket"
import {
  fetchOrders,
  type FetchOrdersParams,
  type OrdersPanelOrder,
  type OrdersQueryResult,
  type OrdersSummaryClient,
} from "@/lib/order-service"
import type { OrderStatus, PaymentStatus } from "@/lib/server/order-types"

const DEFAULT_STATUS_FILTERS: OrderStatus[] = ["abierto", "preparando", "listo"]
const POLLING_INTERVAL_MS = 30_000
const SEARCH_DEBOUNCE_MS = 300

export interface UseOrdersPanelResult {
  orders: OrdersPanelOrder[]
  filteredOrders: OrdersPanelOrder[]
  summary: OrdersSummaryClient | null
  isLoading: boolean
  isRefreshing: boolean
  error: string | null
  statusFilters: OrderStatus[]
  paymentFilter: PaymentStatus | "todos"
  search: string
  lastUpdated: Date | null
  setStatusFilters: (statuses: OrderStatus[]) => void
  setPaymentFilter: (status: PaymentStatus | "todos") => void
  setSearch: (value: string) => void
  refetch: (options?: { silent?: boolean }) => Promise<void>
}

export function useOrdersPanel(): UseOrdersPanelResult {
  const { on, off } = useSocket()

  const [orders, setOrders] = useState<OrdersPanelOrder[]>([])
  const [summary, setSummary] = useState<OrdersSummaryClient | null>(null)
  const [statusFilters, setStatusFiltersState] = useState<OrderStatus[]>(DEFAULT_STATUS_FILTERS)
  const [paymentFilter, setPaymentFilterState] = useState<PaymentStatus | "todos">("todos")
  const [search, setSearchState] = useState("")
  const [debouncedSearch, setDebouncedSearch] = useState("")
  const [isLoading, setIsLoading] = useState(true)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null)

  const abortRef = useRef<AbortController | null>(null)
  const pollingRef = useRef<ReturnType<typeof setInterval> | null>(null)

  useEffect(() => {
    const handle = setTimeout(() => {
      setDebouncedSearch((current) => {
        const normalized = search.trim()
        return current === normalized ? current : normalized
      })
    }, SEARCH_DEBOUNCE_MS)

    return () => {
      clearTimeout(handle)
    }
  }, [search])

  const loadOrders = useCallback(
    async (options?: { silent?: boolean }) => {
      abortRef.current?.abort()

      const controller = new AbortController()
      abortRef.current = controller

      if (options?.silent) {
        setIsRefreshing(true)
      } else {
        setIsLoading(true)
      }

      const fetchParams: FetchOrdersParams = {
        status: statusFilters.length > 0 ? statusFilters : undefined,
        paymentStatus: paymentFilter === "todos" ? undefined : paymentFilter,
        search: debouncedSearch || undefined,
        sort: "newest",
        signal: controller.signal,
      }

      try {
        const result: OrdersQueryResult = await fetchOrders(fetchParams)

        if (controller.signal.aborted) {
          return
        }

        setOrders(result.orders)
        setSummary(result.summary)
        setLastUpdated(result.receivedAt)
        setError(null)
      } catch (error) {
        if (controller.signal.aborted) {
          return
        }

        console.error("[useOrdersPanel]", error)
        setError("No se pudieron obtener los pedidos")
      } finally {
        if (!controller.signal.aborted) {
          setIsLoading(false)
          setIsRefreshing(false)
        }

        if (abortRef.current === controller) {
          abortRef.current = null
        }
      }
    },
    [statusFilters, paymentFilter, debouncedSearch],
  )

  useEffect(() => {
    void loadOrders()

    return () => {
      abortRef.current?.abort()
    }
  }, [loadOrders])

  useEffect(() => {
    if (pollingRef.current) {
      clearInterval(pollingRef.current)
    }

    pollingRef.current = setInterval(() => {
      void loadOrders({ silent: true })
    }, POLLING_INTERVAL_MS)

    return () => {
      if (pollingRef.current) {
        clearInterval(pollingRef.current)
        pollingRef.current = null
      }
    }
  }, [loadOrders])

  useEffect(() => {
    const handleOrderUpdated = (payload: { orderId: string; status: OrderStatus }) => {
      setOrders((previous) =>
        previous.map((order) =>
          order.id === payload.orderId
            ? {
                ...order,
                status: payload.status,
              }
            : order,
        ),
      )

      void loadOrders({ silent: true })
    }

    on("order.updated", handleOrderUpdated)

    return () => {
      off("order.updated", handleOrderUpdated)
    }
  }, [loadOrders, off, on])

  const setStatusFilters = useCallback((next: OrderStatus[]) => {
    setStatusFiltersState(Array.from(new Set(next)))
  }, [])

  const setPaymentFilter = useCallback((next: PaymentStatus | "todos") => {
    setPaymentFilterState(next)
  }, [])

  const setSearch = useCallback((value: string) => {
    setSearchState(value)
  }, [])

  const filteredOrders = useMemo(() => orders, [orders])

  const refetch = useCallback(async (options?: { silent?: boolean }) => {
    await loadOrders({ silent: options?.silent ?? true })
  }, [loadOrders])

  return {
    orders,
    filteredOrders,
    summary,
    isLoading,
    isRefreshing,
    error,
    statusFilters,
    paymentFilter,
    search,
    lastUpdated,
    setStatusFilters,
    setPaymentFilter,
    setSearch,
    refetch,
  }
}