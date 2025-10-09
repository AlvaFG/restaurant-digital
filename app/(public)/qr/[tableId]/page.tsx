"use client"

import { useEffect, useMemo, useState } from "react"
import type { ReactNode } from "react"

import { useMenuCatalog } from "@/app/menu/_hooks/use-menu-catalog"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { useToast } from "@/hooks/use-toast"
import type { MenuAllergen, MenuItem } from "@/lib/mock-data"
import { cn } from "@/lib/utils"
import { AlertCircle, Frown, Loader2, RefreshCw, WifiOff } from "lucide-react"

import { QrCartSheet } from "../_components/qr-cart-sheet"
import { QrCategoryTabs } from "../_components/qr-category-tabs"
import { QrMenuHeader } from "../_components/qr-menu-header"
import { QrMenuItemCard } from "../_components/qr-menu-item-card"
import { useQrCart } from "../_hooks/use-qr-cart"
import { useQrTable } from "../_hooks/use-qr-table"

interface PageParams {
  params: {
    tableId: string
  }
}

export default function QrTablePage({ params }: PageParams) {
  const tableId = params.tableId
  const { toast } = useToast()

  const {
    categories,
    items,
    allergens,
    metadata: menuMetadata,
    headers,
    isLoading: isMenuLoading,
    isRefetching: isMenuRefetching,
    isError: isMenuError,
    error: menuError,
    refetch: refetchMenu,
  } = useMenuCatalog()

  const {
    table,
    metadata: tableMetadata,
    isLoading: isTableLoading,
    isNotFound: isTableNotFound,
    isError: isTableError,
    error: tableError,
    isRefetching: isTableRefetching,
    refetch: refetchTable,
  } = useQrTable(tableId)

  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(null)
  const [isSubmittingOrder, setIsSubmittingOrder] = useState(false)
  const [lastOrderId, setLastOrderId] = useState<string | null>(null)

  const allergenMap = useMemo(() => {
    const map = new Map<MenuAllergen["code"], MenuAllergen>()
    for (const allergen of allergens) {
      map.set(allergen.code, allergen)
    }
    return map
  }, [allergens])

  const currencyCode = menuMetadata?.currency ?? "ARS"
  const currencyFormatter = useMemo(
    () =>
      new Intl.NumberFormat("es-AR", {
        style: "currency",
        currency: currencyCode,
        maximumFractionDigits: 2,
      }),
    [currencyCode],
  )

  const {
    detailedItems,
    itemCount,
    totalCents,
    hasUnavailableItems,
    addOrIncrement,
    increment,
    decrement,
    clear,
  } = useQrCart(tableId, items)

  const isInitialLoading = isMenuLoading || isTableLoading

  useEffect(() => {
    if (selectedCategoryId && !categories.some((category) => category.id === selectedCategoryId)) {
      setSelectedCategoryId(null)
    }
  }, [categories, selectedCategoryId])

  useEffect(() => {
    setLastOrderId(null)
  }, [tableId])

  const filteredItems = useMemo(() => {
    return items
      .filter((item) => (selectedCategoryId ? item.categoryId === selectedCategoryId : true))
      .sort((a, b) => a.name.localeCompare(b.name, "es"))
  }, [items, selectedCategoryId])

  const handleAddItem = (menuItem: MenuItem) => {
    if (menuItem.available === false) {
      toast({
        title: "Plato no disponible",
        description: "Este plato no se puede agregar en este momento.",
        variant: "destructive",
      })
      return
    }
    addOrIncrement(menuItem.id)
  }

  const handleSubmitOrder = async () => {
    if (detailedItems.length === 0 || hasUnavailableItems || isSubmittingOrder) {
      return
    }

    setIsSubmittingOrder(true)
    setLastOrderId(null)

    try {
      const response = await fetch("/api/menu/orders", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          tableId,
          items: detailedItems.map((entry) => ({
            menuItemId: entry.item.id,
            quantity: entry.quantity,
          })),
        }),
      })

      if (!response.ok) {
        let message = `No pudimos enviar el pedido (codigo ${response.status})`
        try {
          const payload = (await response.json()) as { error?: string }
          if (payload?.error) {
            message = payload.error
          }
        } catch {
          // ignore JSON issues
        }

        toast({
          title: "No se envio el pedido",
          description: message,
          variant: "destructive",
        })
        return
      }

      const payload = (await response.json()) as { data?: { id?: string } }
      const orderId = payload?.data?.id ?? `orden-${Date.now()}`
      setLastOrderId(orderId)
      clear()

      toast({
        title: "Pedido enviado",
        description: "Avisaremos al staff para continuar.",
      })
    } catch (error) {
      const message = error instanceof Error ? error.message : "Error desconocido"
      toast({
        title: "Sin conexion",
        description: message,
        variant: "destructive",
      })
    } finally {
      setIsSubmittingOrder(false)
    }
  }

  const handleCategoryChange = (categoryId: string | null) => {
    setSelectedCategoryId(categoryId)
  }

  const handleCloseSuccess = () => {
    setLastOrderId(null)
  }

  const refetchAll = () => {
    void Promise.all([refetchMenu(), refetchTable()]).catch(() => undefined)
  }

  if (isTableNotFound) {
    return (
      <div className="flex min-h-screen flex-col bg-background">
        <QrMenuHeader
          tableId={tableId}
          tableNumber={null}
          zone={null}
          menuVersion={headers.version ?? menuMetadata?.version ?? "-"}
          updatedAt={headers.updatedAt ?? menuMetadata?.updatedAt ?? null}
          isLoading={false}
          onRefresh={refetchTable}
          isRefreshing={isTableRefetching}
        />
        <main className="mx-auto flex w-full max-w-screen-sm flex-1 flex-col items-center justify-center gap-6 px-4 text-center">
          <Frown className="size-16 text-muted-foreground" aria-hidden="true" />
          <div className="space-y-2">
            <h2 className="text-xl font-semibold">No encontramos la mesa</h2>
            <p className="text-sm text-muted-foreground">
              Verifica el QR o solicita ayuda al staff para escanear nuevamente.
            </p>
          </div>
          <Button type="button" onClick={refetchTable} className="gap-2">
            <RefreshCw className={cn("size-4", isTableRefetching && "animate-spin")} aria-hidden="true" />
            Reintentar
          </Button>
        </main>
      </div>
    )
  }

  return (
    <div className="flex min-h-screen flex-col bg-background pb-32">
      <QrMenuHeader
        tableId={table?.id ?? tableId}
        tableNumber={table?.number ?? null}
        zone={table?.zone ?? null}
        menuVersion={headers.version ?? menuMetadata?.version ?? "-"}
        updatedAt={headers.updatedAt ?? menuMetadata?.updatedAt ?? tableMetadata?.updatedAt ?? null}
        isLoading={isInitialLoading}
        isRefreshing={isMenuRefetching || isTableRefetching}
        onRefresh={refetchAll}
      />

      <main className="mx-auto w-full max-w-screen-sm flex-1 px-4 pb-10 pt-6">
        {isInitialLoading ? (
          <MenuSkeleton />
        ) : (
          <div className="space-y-6">
            {isTableError || isMenuError ? (
              <ErrorCallout
                icon={
                  isTableError ? (
                    <WifiOff className="size-5" aria-hidden="true" />
                  ) : (
                    <AlertCircle className="size-5" aria-hidden="true" />
                  )
                }
                title="No pudimos cargar la informacion"
                description={tableError ?? menuError ?? "Intenta nuevamente."}
                actionLabel="Reintentar"
                onAction={refetchAll}
                loading={isMenuRefetching || isTableRefetching}
              />
            ) : null}

            <QrCategoryTabs
              categories={categories}
              selectedCategoryId={selectedCategoryId}
              onSelect={handleCategoryChange}
            />

            <section className="space-y-4" aria-live="polite">
              {filteredItems.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-border/60 bg-muted/30 px-6 py-12 text-center text-sm text-muted-foreground">
                  No encontramos platos para esta categoria.
                </div>
              ) : (
                <div className="grid gap-4">
                  {filteredItems.map((item) => (
                    <QrMenuItemCard
                      key={item.id}
                      item={item}
                      quantity={detailedItems.find((entry) => entry.item.id === item.id)?.quantity ?? 0}
                      currencyFormatter={currencyFormatter}
                      allergenMap={allergenMap}
                      onAdd={() => handleAddItem(item)}
                      onIncrement={() => increment(item.id)}
                      onDecrement={() => decrement(item.id)}
                    />
                  ))}
                </div>
              )}
            </section>
          </div>
        )}
      </main>

      <QrCartSheet
        items={detailedItems}
        totalCents={totalCents}
        currencyFormatter={currencyFormatter}
        itemCount={itemCount}
        hasUnavailableItems={hasUnavailableItems}
        isSubmitting={isSubmittingOrder}
        onIncrement={(menuItemId) => increment(menuItemId)}
        onDecrement={(menuItemId) => decrement(menuItemId)}
        onClear={clear}
        onSubmit={handleSubmitOrder}
        successOrderId={lastOrderId}
        onCloseSuccess={handleCloseSuccess}
      />
    </div>
  )
}

function MenuSkeleton() {
  return (
    <div className="space-y-6">
      <div className="flex gap-2 overflow-hidden">
        {Array.from({ length: 4 }).map((_, index) => (
          <Skeleton key={`tab-skeleton-${index}`} className="h-10 flex-1 rounded-full" />
        ))}
      </div>
      <div className="grid gap-4">
        {Array.from({ length: 4 }).map((_, index) => (
          <Skeleton key={`card-skeleton-${index}`} className="h-40 rounded-2xl" />
        ))}
      </div>
    </div>
  )
}

interface ErrorCalloutProps {
  icon: ReactNode
  title: string
  description: string
  actionLabel: string
  onAction: () => void
  loading?: boolean
}

function ErrorCallout({ icon, title, description, actionLabel, onAction, loading }: ErrorCalloutProps) {
  return (
    <div className="flex items-start gap-3 rounded-2xl border border-destructive/40 bg-destructive/5 px-4 py-4 text-sm text-destructive">
      <div className="mt-0.5 text-destructive">{icon}</div>
      <div className="flex-1 space-y-1">
        <p className="font-semibold text-destructive">{title}</p>
        <p className="text-destructive/80">{description}</p>
        <Button
          type="button"
          size="sm"
          variant="outline"
          className="mt-2 gap-2"
          onClick={onAction}
          disabled={loading}
        >
          {loading ? (
            <Loader2 className="size-4 animate-spin" aria-hidden="true" />
          ) : (
            <RefreshCw className="size-4" aria-hidden="true" />
          )}
          {actionLabel}
        </Button>
      </div>
    </div>
  )
}
