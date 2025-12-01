"use client"

import { useMemo, useState } from "react"
import { useTranslations } from 'next-intl'
import { Search, CreditCard } from "lucide-react"

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
import { useTables } from "@/hooks/use-tables"
import type { Database } from "@/lib/supabase/database.types"
import {
  ORDER_STATUS_BADGE_VARIANT,
  ORDER_STATUS_GROUPS,
  PAYMENT_STATUS_BADGE_VARIANT,
  type OrdersPanelOrder,
} from "@/lib/order-service"
import type { OrderStatus, PaymentStatus } from "@/lib/server/order-types"

type Table = Database['public']['Tables']['tables']['Row']

const STATUS_SEQUENCE: OrderStatus[] = ["abierto", "preparando", "listo", "entregado", "cerrado"]
const ITEMS_PREVIEW_LIMIT = 3

function useTablesIndex() {
  const { tables } = useTables()
  
  const tablesById = useMemo(() => {
    return new Map(tables.map((table) => [table.id, table]))
  }, [tables])

  return tablesById
}

function getTableLabel(order: OrdersPanelOrder, tablesById: Map<string, Table>, t: (key: string) => string) {
  const table = tablesById.get(order.tableId)
  return table ? `${t('table')} ${table.number}` : `${t('table')} ${order.tableId}`
}

function getItemTotal(item: OrdersPanelOrder["items"][number]) {
  return typeof item.totalCents === "number" ? item.totalCents : item.price * item.quantity
}

export function OrdersPanel() {
  const t = useTranslations('dashboard')
  const tCommon = useTranslations('common')
  const tErrors = useTranslations('errors')
  const {
    filteredOrders,
    summary,
    isLoading,
    isRefreshing,
    error,
    statusFilters,
    paymentFilter,
    search,
    setStatusFilters,
    setPaymentFilter,
    setSearch,
    refetch,
  } = useOrdersPanelContext()

  // Formato de tiempo relativo con traducciones
  const formatRelativeTime = (date: Date): string => {
    const diff = Date.now() - date.getTime()

    if (diff < 60_000) {
      return tCommon('lessThanMinute')
    }

    const minutes = Math.round(diff / 60_000)
    if (minutes < 60) {
      return tCommon('minutesAgo', { minutes })
    }

    const hours = Math.round(diff / 3_600_000)
    if (hours < 24) {
      return tCommon('hoursAgo', { hours })
    }

    const days = Math.round(diff / 86_400_000)
    return tCommon('daysAgo', { days })
  }
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
    : tCommon('noRecords')

  const emptyState = !isLoading && filteredOrders.length === 0

  return (
    <div className="space-y-4">
      {error ? (
        <Alert variant="destructive">
          <AlertTitle>{tErrors('fetchOrdersError')}</AlertTitle>
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
              {tCommon('retry')}
            </Button>
          </AlertDescription>
        </Alert>
      ) : null}

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4" aria-live="polite">
        <Card className="border-2 border-border shadow-lg hover:shadow-xl transition-all dark:border-zinc-700 dark:bg-zinc-900 dark:shadow-2xl dark:hover:shadow-zinc-900/50 dark:hover:border-zinc-600">
          <CardHeader className="pb-2">
            <CardDescription className="font-light dark:text-zinc-400">{tCommon('ordersSupervisedTitle')}</CardDescription>
            <CardTitle className="text-3xl font-light tracking-tight dark:text-zinc-100">{activeOrders}</CardTitle>
          </CardHeader>
          <CardContent className="text-xs text-muted-foreground font-light dark:text-zinc-400">
            {tCommon('ordersSupervisedDesc')}
          </CardContent>
        </Card>
        <Card className="border-2 border-border shadow-lg hover:shadow-xl transition-all dark:border-zinc-700 dark:bg-zinc-900 dark:shadow-2xl dark:hover:shadow-zinc-900/50 dark:hover:border-zinc-600">
          <CardHeader className="pb-2">
            <CardDescription className="font-light dark:text-zinc-400">{tCommon('pendingPaymentTitle')}</CardDescription>
            <CardTitle className="text-3xl font-light tracking-tight dark:text-zinc-100">{summary?.pendingPayment ?? 0}</CardTitle>
          </CardHeader>
          <CardContent className="text-xs text-muted-foreground font-light dark:text-zinc-400">
            {tCommon('pendingPaymentDesc')}
          </CardContent>
        </Card>
        <Card className="border-2 border-border shadow-lg hover:shadow-xl transition-all dark:border-zinc-700 dark:bg-zinc-900 dark:shadow-2xl dark:hover:shadow-zinc-900/50 dark:hover:border-zinc-600">
          <CardHeader className="pb-2">
            <CardDescription className="font-light dark:text-zinc-400">{tCommon('mostRecentOrderTitle')}</CardDescription>
            <CardTitle className="text-lg font-light dark:text-zinc-100">{latestOrderDisplay}</CardTitle>
          </CardHeader>
          <CardContent className="text-xs text-muted-foreground font-light dark:text-zinc-400">
            {tCommon('mostRecentOrderDesc')}
          </CardContent>
        </Card>
        <Card className="border-2 border-border shadow-lg hover:shadow-xl transition-all dark:border-zinc-700 dark:bg-zinc-900 dark:shadow-2xl dark:hover:shadow-zinc-900/50 dark:hover:border-zinc-600">
          <CardHeader className="pb-2">
            <CardDescription className="font-light dark:text-zinc-400">{tCommon('closedOrdersTitle')}</CardDescription>
            <CardTitle className="text-3xl font-light tracking-tight dark:text-zinc-100">{summary?.byStatus.cerrado ?? 0}</CardTitle>
          </CardHeader>
          <CardContent className="text-xs text-muted-foreground font-light dark:text-zinc-400">
            {tCommon('closedOrdersDesc')}
          </CardContent>
        </Card>
      </section>

      <div className="grid gap-6 lg:grid-cols-[320px,1fr]">
        <aside className="space-y-4">
          <Card className="border-2 border-border shadow-lg dark:border-zinc-700 dark:bg-zinc-900 dark:shadow-2xl">
            <CardHeader className="border-b dark:border-zinc-800 dark:bg-zinc-900/50">
              <CardTitle className="font-light dark:text-zinc-100">{tCommon('filters')}</CardTitle>
              <CardDescription className="font-light dark:text-zinc-400">{tCommon('searchPlaceholder')}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="orders-search" className="sr-only">
                  {tCommon('searchOrders')}
                </Label>
                <div className="relative">
                  <Search className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="orders-search"
                    value={search}
                    onChange={(event) => setSearch(event.target.value)}
                    placeholder={tCommon('searchPlaceholder')}
                    className="pl-9"
                    autoComplete="off"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <p className="text-sm font-light dark:text-zinc-300">{tCommon('states')}</p>
                <ToggleGroup
                  type="multiple"
                  value={statusFilters}
                  onValueChange={(value) => setStatusFilters(value as OrderStatus[])}
                  className="flex flex-wrap gap-2"
                >
                  {STATUS_SEQUENCE.map((status) => (
                    <ToggleGroupItem key={status} value={status} className="px-3 py-1 text-xs capitalize font-light">
                      {t(`orderStatus.${status}`)}
                    </ToggleGroupItem>
                  ))}
                </ToggleGroup>
              </div>

              <div className="space-y-2">
                <p className="text-sm font-light dark:text-zinc-300">{tCommon('payment')}</p>
                <Select
                  value={paymentFilter}
                  onValueChange={(value) => setPaymentFilter(value as PaymentStatus | "todos")}
                >
                  <SelectTrigger>
                    <SelectValue placeholder={tCommon('paymentStatusLabel')} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="todos">{tCommon('allPayments')}</SelectItem>
                    {(["pendiente", "pagado", "cancelado"] as PaymentStatus[]).map((value) => (
                      <SelectItem key={value} value={value}>
                        {t(`paymentStatus.${value}`)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          <Card className="border-2 border-border shadow-lg dark:border-zinc-700 dark:bg-zinc-900 dark:shadow-2xl">
            <CardHeader className="border-b dark:border-zinc-800 dark:bg-zinc-900/50">
              <CardTitle className="font-light dark:text-zinc-100">{tCommon('groupSummaryTitle')}</CardTitle>
              <CardDescription className="font-light dark:text-zinc-400">{tCommon('groupSummaryDesc')}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3 text-sm font-light dark:text-zinc-300">
              {(Object.entries(ORDER_STATUS_GROUPS) as Array<[string, OrderStatus[]]>).map(([groupKey, statuses]) => {
                const total = statuses.reduce((acc, status) => acc + (summary?.byStatus[status] ?? 0), 0)
                return (
                  <div key={groupKey} className="flex items-center justify-between rounded border border-border/50 bg-accent/30 px-3 py-2 dark:border-transparent dark:bg-zinc-800/30">
                    <span className="capitalize text-muted-foreground font-light dark:text-zinc-400">{groupKey.split("_").join(" ")}</span>
                    <span className="font-light dark:text-zinc-200">{total}</span>
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
            <Card className="border-2 border-border shadow-lg dark:border-zinc-700 dark:bg-zinc-900 dark:shadow-2xl">
              <CardContent className="py-12 text-center text-sm text-muted-foreground font-light dark:text-zinc-400">
                {tCommon('noMatchingOrders')}
              </CardContent>
            </Card>
          ) : null}

          {!emptyState &&
            groupedByStatus.map(({ status, orders }) => (
              <Card key={status} aria-live="polite" className="border-2 border-border shadow-lg dark:border-zinc-700 dark:bg-zinc-900 dark:shadow-2xl">
                <CardHeader className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between border-b dark:border-zinc-800 dark:bg-zinc-900/50">
                  <div className="flex items-center gap-2">
                    <CardTitle className="text-lg font-light capitalize dark:text-zinc-100">
                      {t(`orderStatus.${status}`)}
                    </CardTitle>
                    <Badge variant={orders.length > 0 ? "secondary" : "outline"} className="font-light">{orders.length}</Badge>
                  </div>
                  <CardDescription className="font-light dark:text-zinc-400">
                    {tCommon('trackingStatus', { status: t(`orderStatus.${status}`).toLowerCase() })}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {orders.length === 0 ? (
                    <p className="text-sm text-muted-foreground font-light dark:text-zinc-400">{tCommon('noOrdersInStatus')}</p>
                  ) : (
                    <ScrollArea className="max-h-[480px] pr-3">
                      <div className="space-y-3">
                        {orders.map((order) => {
                          const tableLabel = getTableLabel(order, tablesById, tCommon)
                          const itemsCount = order.items.reduce((acc, item) => acc + item.quantity, 0)

                          return (
                            <article
                              key={order.id}
                              tabIndex={0}
                              aria-label={`Pedido ${order.id} ${tableLabel}`}
                              className="rounded-lg border-2 border-border p-4 shadow-md hover:shadow-lg transition-all dark:border-zinc-700 dark:bg-zinc-800/50 dark:hover:border-zinc-600"
                            >
                              <header className="flex flex-wrap items-center gap-3">
                                <div className="flex flex-col">
                                  <span className="text-xs font-light uppercase tracking-wide text-muted-foreground dark:text-zinc-400">
                                    {tCommon('order')} #{order.id}
                                  </span>
                                  <div className="flex items-center gap-2 text-sm font-light dark:text-zinc-100">
                                    <span>{tableLabel}</span>
                                    <Badge
                                      variant={ORDER_STATUS_BADGE_VARIANT[order.status]}
                                      className="capitalize font-light"
                                    >
                                      {t(`orderStatus.${order.status}`)}
                                    </Badge>
                                  </div>
                                </div>
                                <Badge
                                  variant={PAYMENT_STATUS_BADGE_VARIANT[order.paymentStatus]}
                                  className="capitalize"
                                >
                                  {t(`paymentStatus.${order.paymentStatus}`)}
                                </Badge>
                                <span className="ml-auto text-xs text-muted-foreground">
                                  {tCommon('created')} {formatRelativeTime(order.createdAt)}
                                </span>
                              </header>

                              <dl className="mt-3 flex flex-wrap gap-x-4 gap-y-2 text-sm text-muted-foreground">
                                <div>
                                  <dt className="sr-only">{tCommon('items')}</dt>
                                  <dd>{itemsCount} {tCommon('items')}</dd>
                                </div>
                                <div>
                                  <dt className="sr-only">{tCommon('total')}</dt>
                                  <dd>{tCommon('total')} {currencyFormatter.format(order.total / 100)}</dd>
                                </div>
                                {order.payment?.amountCents ? (
                                  <div>
                                    <dt className="sr-only">{tCommon('paid')}</dt>
                                    <dd>{tCommon('paid')} {currencyFormatter.format(order.payment.amountCents / 100)}</dd>
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
                                    {tCommon('additionalItems', { count: order.items.length - ITEMS_PREVIEW_LIMIT })}
                                  </li>
                                ) : null}
                              </ul>

                              {order.notes ? (
                                <p className="mt-3 rounded-md bg-muted px-3 py-2 text-xs text-muted-foreground">
                                  {tCommon('customerNote')}: {order.notes}
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
                                  {order.paymentStatus === 'pagado' ? tCommon('paid') : tCommon('pay')}
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
            tableId: getTableLabel(selectedOrder, tablesById, tCommon),
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
