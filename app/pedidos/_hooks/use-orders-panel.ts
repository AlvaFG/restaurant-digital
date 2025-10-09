"use client"

import { useCallback, useEffect, useMemo, useRef, useState } from "react"

import { useSocket } from "@/hooks/use-socket"
import {
  fetchOrders,
  toOrdersPanelOrder,
  toSummaryClient,
  type FetchOrdersParams,
  type OrdersPanelOrder,
  type OrdersQueryResult,
  type OrdersSummaryClient,
  type SerializedOrder,
} from "@/lib/order-service"
import type { OrderStatus, PaymentStatus } from "@/lib/server/order-types"
import type { OrdersSummary } from "@/lib/server/order-store"
import type { OrderEventPayload, OrderSummaryEventPayload } from "@/lib/socket-events"
import type { SocketConnectionState } from "@/lib/socket"

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
  const { on, off, lastReadyPayload, state: socketState } = useSocket()

  const state: SocketConnectionState = socketState ?? {
    isReady: false,
    isConnected: false,
    isReconnecting: false,
    connectionId: null,
    lastReadyAt: null,
    lastHeartbeatAt: null,
  }

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
  const ordersVersionRef = useRef<number>(0)

  const applyOrderEvent = useCallback((payload: OrderEventPayload | Partial<OrderEventPayload>) => {
    if (!payload?.order) {
      return false
    }

    const version = payload.metadata?.version ?? 0
    if (version < ordersVersionRef.current) {
      return false
    }

    const normalized = toOrdersPanelOrder(payload.order as SerializedOrder)

    setOrders((previous) => {
      const index = previous.findIndex((order) => order.id === normalized.id)
      if (index === -1) {
        const next = [normalized, ...previous]
        return next.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
      }

      const next = previous.map((order) => (order.id === normalized.id ? normalized : order))
      return next.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
    })

    ordersVersionRef.current = version
    if (payload.metadata?.updatedAt) {
      setLastUpdated(new Date(payload.metadata.updatedAt))
    }

    return true
  }, [])

  const applySummaryEvent = useCallback((payload: OrderSummaryEventPayload | Partial<OrderSummaryEventPayload>) => {
    if (!payload?.summary) {
      return false
    }

    const version = payload.metadata?.version ?? 0
    if (version < ordersVersionRef.current) {
      return false
    }

    setSummary(toSummaryClient(payload.summary as OrdersSummary))
    ordersVersionRef.current = version
    if (payload.metadata?.updatedAt) {
      setLastUpdated(new Date(payload.metadata.updatedAt))
    }

    return true
  }, [])

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
        ordersVersionRef.current = result.storeMetadata.version
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
    const handleCreated = (payload: OrderEventPayload) => {
      const applied = applyOrderEvent(payload)
      if (!applied) {
        void loadOrders({ silent: true })
      }
    }

    const handleUpdated = (payload: OrderEventPayload) => {
      const applied = applyOrderEvent(payload)
      if (!applied) {
        void loadOrders({ silent: true })
      }
    }

    const handleSummary = (payload: OrderSummaryEventPayload) => {
      const applied = applySummaryEvent(payload)
      if (!applied) {
        void loadOrders({ silent: true })
      }
    }

    on("order.created", handleCreated)
    on("order.updated", handleUpdated)
    on("order.summary.updated", handleSummary)

    return () => {
      off("order.created", handleCreated)
      off("order.updated", handleUpdated)
      off("order.summary.updated", handleSummary)
    }
  }, [applyOrderEvent, applySummaryEvent, loadOrders, off, on])

  useEffect(() => {
    void loadOrders()

    return () => {
      abortRef.current?.abort()
    }
  }, [loadOrders])

  useEffect(() => {
    const snapshot = lastReadyPayload?.orders
    if (!state.isReady || !snapshot?.summary) {
      return
    }

    const version = snapshot.metadata?.version ?? 0
    if (version < ordersVersionRef.current) {
      return
    }

    setSummary(toSummaryClient(snapshot.summary as OrdersSummary))
    ordersVersionRef.current = version
    if (snapshot.metadata?.updatedAt) {
      setLastUpdated(new Date(snapshot.metadata.updatedAt))
    }
  }, [lastReadyPayload, state.isReady])

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
