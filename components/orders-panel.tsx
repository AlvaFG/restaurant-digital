"use client"

import { useEffect, useMemo, useState } from "react"
import { RefreshCw, Search, CreditCard } from "lucide-react"

import { useOrdersPanelContext } from "@/app/pedidos/_providers/orders-panel-provider"
import { LoadingSpinner } from "@/components/loading-spinner"
import { PaymentModal } from "@/components/payment-modal"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group"
import { fetchTables } from "@/lib/table-service"
import type { Table } from "@/lib/mock-data"
import {
  ORDER_STATUS_BADGE_VARIANT,
  ORDER_STATUS_GROUPS,
  ORDER_STATUS_LABELS,
  PAYMENT_STATUS_BADGE_VARIANT,
  PAYMENT_STATUS_LABELS,
  type OrdersPanelOrder,
} from "@/lib/order-service"
import type { OrderStatus, PaymentStatus } from "@/lib/server/order-types"

const STATUS_SEQUENCE: OrderStatus[] = ["abierto", "preparando", "listo", "entregado", "cerrado"]
const ITEMS_PREVIEW_LIMIT = 3

function formatRelativeTime(date: Date): string {
  const diff = Date.now() - date.getTime()

  if (diff < 60_000) {
    return "Hace menos de un minuto"
  }

  const minutes = Math.round(diff / 60_000)
  if (minutes < 60) {
    return `Hace ${minutes} min`
  }

  const hours = Math.round(diff / 3_600_000)
  if (hours < 24) {
    return `Hace ${hours} h`
  }

  const days = Math.round(diff / 86_400_000)
  return `Hace ${days} d`
}

function useTablesIndex() {
  const [tablesById, setTablesById] = useState<Map<string, Table>>(new Map())

  useEffect(() => {
    let isCancelled = false

    const load = async () => {
      try {
        const response = await fetchTables()
        if (!isCancelled) {
          setTablesById(new Map(response.data.map((table) => [table.id, table])))
        }
      } catch (error) {
        console.warn("[OrdersPanel] No se pudieron cargar las mesas", error)
      }
    }

    void load()

    return () => {
      isCancelled = true
    }
  }, [])

  return tablesById
}

function getTableLabel(order: OrdersPanelOrder, tablesById: Map<string, Table>) {
  const table = tablesById.get(order.tableId)
  return table ? `Mesa ${table.number}` : `Mesa ${order.tableId}`
}

function getItemTotal(item: OrdersPanelOrder["items"][number]) {
  return typeof item.totalCents === "number" ? item.totalCents : item.price * item.quantity
}

export function OrdersPanel() {
  const {
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
  } = useOrdersPanelContext()
  const tablesById = useTablesIndex()

  // Estado para el modal de pago
  const [paymentModalOpen, setPaymentModalOpen] = useState(false)
  const [selectedOrder, setSelectedOrder] = useState<OrdersPanelOrder | null>(null)

  const currencyFormatter = useMemo(
    () =>
      new Intl.NumberFormat("es-AR", {
        style: "currency",
        currency: "ARS",
        minimumFractionDigits: 2,
      }),
    [],
  )

  const groupedByStatus = useMemo(() => {
    const buckets = new Map<OrderStatus, OrdersPanelOrder[]>(
      STATUS_SEQUENCE.map((status) => [status, [] as OrdersPanelOrder[]]),
    )

    for (const order of filteredOrders) {
      const bucket = buckets.get(order.status)
      bucket?.push(order)
    }

    return STATUS_SEQUENCE.map((status) => {
      const orders = buckets.get(status) ?? []
      return {
        status,
        orders: orders.slice().sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime()),
      }
    })
  }, [filteredOrders])

  const activeOrders = useMemo(() => {
    if (!summary) {
      return 0
    }
    return (
      summary.byStatus.abierto +
      summary.byStatus.preparando +
      summary.byStatus.listo +
      summary.byStatus.entregado
    )
  }, [summary])

  const latestOrderDisplay = summary?.latestOrderAt
    ? formatRelativeTime(summary.latestOrderAt)
    : "Sin registros"

  const emptyState = !isLoading && filteredOrders.length === 0
  const refreshDisabled = isLoading || isRefreshing

  return (
    <div className="space-y-6">
      <header className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h2 className="text-2xl font-semibold tracking-tight">Panel de pedidos</h2>
          <p className="text-sm text-muted-foreground">
            Monitorea pedidos activos, coordina con cocina y controla cobros sin salir del tablero.
          </p>
        </div>
        <div className="flex items-center gap-3">
          {lastUpdated ? (
            <span className="text-xs text-muted-foreground" aria-live="polite">
              Actualizado {formatRelativeTime(lastUpdated)}
            </span>
          ) : null}
          <Button
            type="button"
            onClick={() => void refetch({ silent: true })}
            variant="outline"
            size="sm"
            aria-label="Actualizar pedidos"
            data-testid="orders-manual-refresh"
            disabled={refreshDisabled}
          >
            <RefreshCw className={`h-4 w-4 ${isRefreshing ? "animate-spin" : ""}`} />
            <span className="sr-only">Actualizar pedidos</span>
          </Button>
        </div>
      </header>

      {error ? (
        <Alert variant="destructive">
          <AlertTitle>Error al obtener pedidos</AlertTitle>
          <AlertDescription className="flex flex-wrap items-center gap-x-2 gap-y-1">
            <span>{error}. </span>
            <Button
              type="button"
              variant="link"
              size="sm"
              className="h-auto p-0"
              data-testid="orders-error-retry"
              onClick={() => void refetch({ silent: false })}
            >
              Reintentar
            </Button>
          </AlertDescription>
        </Alert>
      ) : null}

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4" aria-live="polite">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Pedidos supervisados</CardDescription>
            <CardTitle className="text-3xl font-bold">{activeOrders}</CardTitle>
          </CardHeader>
          <CardContent className="text-xs text-muted-foreground">
            Incluye abiertos, preparando, listos y entregados.
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Pendientes de cobro</CardDescription>
            <CardTitle className="text-3xl font-bold">{summary?.pendingPayment ?? 0}</CardTitle>
          </CardHeader>
          <CardContent className="text-xs text-muted-foreground">
            Pedidos marcados con pago pendiente.
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Pedido mas reciente</CardDescription>
            <CardTitle className="text-lg font-semibold">{latestOrderDisplay}</CardTitle>
          </CardHeader>
          <CardContent className="text-xs text-muted-foreground">
            Tiempo relativo desde la ultima creacion.
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Pedidos cerrados</CardDescription>
            <CardTitle className="text-3xl font-bold">{summary?.byStatus.cerrado ?? 0}</CardTitle>
          </CardHeader>
          <CardContent className="text-xs text-muted-foreground">
            Total de pedidos marcados como cerrados.
          </CardContent>
        </Card>
      </section>

      <div className="grid gap-6 lg:grid-cols-[320px,1fr]">
        <aside className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Filtros</CardTitle>
              <CardDescription>Busqueda, estado operativo y cobro.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="orders-search" className="sr-only">
                  Buscar pedidos
                </Label>
                <div className="relative">
                  <Search className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="orders-search"
                    value={search}
                    onChange={(event) => setSearch(event.target.value)}
                    placeholder="Mesa, cliente o item"
                    className="pl-9"
                    autoComplete="off"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <p className="text-sm font-medium">Estados</p>
                <ToggleGroup
                  type="multiple"
                  value={statusFilters}
                  onValueChange={(value) => setStatusFilters(value as OrderStatus[])}
                  className="flex flex-wrap gap-2"
                >
                  {STATUS_SEQUENCE.map((status) => (
                    <ToggleGroupItem key={status} value={status} className="px-3 py-1 text-xs capitalize">
                      {ORDER_STATUS_LABELS[status]}
                    </ToggleGroupItem>
                  ))}
                </ToggleGroup>
              </div>

              <div className="space-y-2">
                <p className="text-sm font-medium">Pago</p>
                <Select
                  value={paymentFilter}
                  onValueChange={(value) => setPaymentFilter(value as PaymentStatus | "todos")}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Estado de pago" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="todos">Todos los pagos</SelectItem>
                    {(Object.entries(PAYMENT_STATUS_LABELS) as Array<[PaymentStatus, string]>).map(([value, label]) => (
                      <SelectItem key={value} value={value}>
                        {label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Resumen por grupo</CardTitle>
              <CardDescription>Distribucion de pedidos por etapa.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              {(Object.entries(ORDER_STATUS_GROUPS) as Array<[string, OrderStatus[]]>).map(([groupKey, statuses]) => {
                const total = statuses.reduce((acc, status) => acc + (summary?.byStatus[status] ?? 0), 0)
                return (
                  <div key={groupKey} className="flex items-center justify-between rounded border px-3 py-2">
                    <span className="capitalize text-muted-foreground">{groupKey.split("_").join(" ")}</span>
                    <span className="font-semibold">{total}</span>
                  </div>
                )
              })}
            </CardContent>
          </Card>
        </aside>

        <section className="space-y-4">
          {isLoading && filteredOrders.length === 0 ? (
            <div className="flex h-64 items-center justify-center rounded-lg border">
              <LoadingSpinner />
            </div>
          ) : null}

          {emptyState ? (
            <Card>
              <CardContent className="py-12 text-center text-sm text-muted-foreground">
                No hay pedidos que coincidan con los filtros.
              </CardContent>
            </Card>
          ) : null}

          {!emptyState &&
            groupedByStatus.map(({ status, orders }) => (
              <Card key={status} aria-live="polite">
                <CardHeader className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                  <div className="flex items-center gap-2">
                    <CardTitle className="text-lg font-semibold capitalize">
                      {ORDER_STATUS_LABELS[status]}
                    </CardTitle>
                    <Badge variant={orders.length > 0 ? "secondary" : "outline"}>{orders.length}</Badge>
                  </div>
                  <CardDescription>
                    Seguimiento de pedidos en estado {ORDER_STATUS_LABELS[status].toLowerCase()}.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {orders.length === 0 ? (
                    <p className="text-sm text-muted-foreground">Sin pedidos en este estado.</p>
                  ) : (
                    <ScrollArea className="max-h-[480px] pr-3">
                      <div className="space-y-3">
                        {orders.map((order) => {
                          const tableLabel = getTableLabel(order, tablesById)
                          const itemsCount = order.items.reduce((acc, item) => acc + item.quantity, 0)

                          return (
                            <article
                              key={order.id}
                              tabIndex={0}
                              aria-label={`Pedido ${order.id} ${tableLabel}`}
                              className="rounded-lg border p-4 shadow-xs transition hover:border-primary/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                            >
                              <header className="flex flex-wrap items-center gap-3">
                                <div className="flex flex-col">
                                  <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                                    Pedido #{order.id}
                                  </span>
                                  <div className="flex items-center gap-2 text-sm font-semibold">
                                    <span>{tableLabel}</span>
                                    <Badge
                                      variant={ORDER_STATUS_BADGE_VARIANT[order.status]}
                                      className="capitalize"
                                    >
                                      {ORDER_STATUS_LABELS[order.status]}
                                    </Badge>
                                  </div>
                                </div>
                                <Badge
                                  variant={PAYMENT_STATUS_BADGE_VARIANT[order.paymentStatus]}
                                  className="capitalize"
                                >
                                  {PAYMENT_STATUS_LABELS[order.paymentStatus]}
                                </Badge>
                                <span className="ml-auto text-xs text-muted-foreground">
                                  Creado {formatRelativeTime(order.createdAt)}
                                </span>
                              </header>

                              <dl className="mt-3 flex flex-wrap gap-x-4 gap-y-2 text-sm text-muted-foreground">
                                <div>
                                  <dt className="sr-only">Articulos</dt>
                                  <dd>{itemsCount} items</dd>
                                </div>
                                <div>
                                  <dt className="sr-only">Total</dt>
                                  <dd>Total {currencyFormatter.format(order.total / 100)}</dd>
                                </div>
                                {order.payment?.amountCents ? (
                                  <div>
                                    <dt className="sr-only">Pago registrado</dt>
                                    <dd>Pagado {currencyFormatter.format(order.payment.amountCents / 100)}</dd>
                                  </div>
                                ) : null}
                              </dl>

                              <ul className="mt-3 space-y-1 text-sm">
                                {order.items.slice(0, ITEMS_PREVIEW_LIMIT).map((item) => (
                                  <li key={`${order.id}-${item.id}`} className="flex items-center justify-between">
                                    <span className="text-muted-foreground">
                                      {item.quantity} x {item.name}
                                    </span>
                                    <span>{currencyFormatter.format(getItemTotal(item) / 100)}</span>
                                  </li>
                                ))}
                                {order.items.length > ITEMS_PREVIEW_LIMIT ? (
                                  <li className="text-xs text-muted-foreground">
                                    +{order.items.length - ITEMS_PREVIEW_LIMIT} items adicionales
                                  </li>
                                ) : null}
                              </ul>

                              {order.notes ? (
                                <p className="mt-3 rounded-md bg-muted px-3 py-2 text-xs text-muted-foreground">
                                  Nota del cliente: {order.notes}
                                </p>
                              ) : null}

                              <div className="mt-3 flex gap-2">
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => {
                                    setSelectedOrder(order)
                                    setPaymentModalOpen(true)
                                  }}
                                  disabled={order.paymentStatus === 'pagado'}
                                >
                                  <CreditCard className="mr-2 h-4 w-4" />
                                  {order.paymentStatus === 'pagado' ? 'Pagado' : 'Pagar'}
                                </Button>
                              </div>
                            </article>
                          )
                        })}
                      </div>
                    </ScrollArea>
                  )}
                </CardContent>
              </Card>
            ))}
        </section>
      </div>

      {selectedOrder && (
        <PaymentModal
          open={paymentModalOpen}
          onOpenChange={setPaymentModalOpen}
          order={{
            id: selectedOrder.id,
            tableId: getTableLabel(selectedOrder, tablesById),
            items: selectedOrder.items.map(item => ({
              name: item.name,
              quantity: item.quantity,
              price: item.price,
            })),
            total: selectedOrder.total,
          }}
        />
      )}
    </div>
  )
}
