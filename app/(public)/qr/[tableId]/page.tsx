"use client"

import { useEffect, useMemo, useState } from "react"
import type { ReactNode } from "react"
import { useRouter } from "next/navigation"
import { useTranslations } from "next-intl"

import { useMenuCatalog } from "@/app/[locale]/menu/_hooks/use-menu-catalog"
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
import { QrSearchBar } from "../_components/qr-search-bar"
import { useQrCart } from "../_hooks/use-qr-cart"
import { useQrSession } from "../_hooks/use-qr-session"
import { useQrTable } from "../_hooks/use-qr-table"
import type { CartItemModifier } from "../_types/modifiers"

interface PageParams {
  params: {
    tableId: string
  }
}

export default function QrTablePage({ params }: PageParams) {
  const tableId = params.tableId
  const router = useRouter()
  const { toast } = useToast()
  const t = useTranslations('customer')
  const tCommon = useTranslations('common')

  // Validate QR session first
  const { 
    session, 
    isValidating: isSessionValidating, 
    isExpired, 
    isTableMismatch,
    error: sessionError 
  } = useQrSession(tableId)

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
  const [searchQuery, setSearchQuery] = useState("")

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
    hasUnavailableItems: _hasUnavailableItems,
    addOrIncrement,
    increment,
    decrement,
    remove,
    clear,
  } = useQrCart(tableId, session?.sessionId, items)

  const isInitialLoading = isMenuLoading || isTableLoading

  // Handle session validation errors
  useEffect(() => {
    if (isExpired) {
      toast({
        title: t('sessionExpired'),
        description: t('sessionExpiredDesc'),
        variant: "destructive",
      })
      setTimeout(() => {
        router.push("/qr/validate")
      }, 2000)
    }

    if (isTableMismatch && session) {
      toast({
        title: t('incorrectTable'),
        description: t('incorrectTableDesc', { tableNumber: session.table?.number || session.tableId }),
        variant: "destructive",
      })
      setTimeout(() => {
        router.push(`/qr/${session.tableId}`)
      }, 2000)
    }

    if (sessionError && !session) {
      toast({
        title: t('invalidSession'),
        description: t('invalidSessionDesc'),
        variant: "destructive",
      })
      setTimeout(() => {
        router.push("/qr/validate")
      }, 2000)
    }
  }, [isExpired, isTableMismatch, session, sessionError, router, toast, t])

  useEffect(() => {
    if (selectedCategoryId && !categories.some((category) => category.id === selectedCategoryId)) {
      setSelectedCategoryId(null)
    }
  }, [categories, selectedCategoryId])



  const filteredItems = useMemo(() => {
    let result = items.filter((item) => 
      selectedCategoryId ? item.categoryId === selectedCategoryId : true
    )

    // Apply search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase().trim()
      result = result.filter((item) => {
        // Search in name
        if (item.name.toLowerCase().includes(query)) return true
        // Search in description
        if (item.description?.toLowerCase().includes(query)) return true
        return false
      })
    }

    return result.sort((a, b) => a.name.localeCompare(b.name, "es"))
  }, [items, selectedCategoryId, searchQuery])

  const handleAddItem = (menuItem: MenuItem, modifiers?: CartItemModifier[], notes?: string) => {
    if (menuItem.available === false) {
      toast({
        title: t('dishNotAvailable'),
        description: t('dishNotAvailableDesc'),
        variant: "destructive",
      })
      return
    }
    addOrIncrement(menuItem.id, modifiers, notes)
  }

  const handleCategoryChange = (categoryId: string | null) => {
    setSelectedCategoryId(categoryId)
  }

  const refetchAll = () => {
    void Promise.all([refetchMenu(), refetchTable()]).catch(() => undefined)
  }

  // Show loading while validating session
  if (isSessionValidating) {
    return (
      <div className="flex min-h-screen flex-col bg-background">
        <div className="mx-auto w-full max-w-screen-sm px-4 pt-20 text-center">
          <Loader2 className="mx-auto size-12 animate-spin text-primary" aria-hidden="true" />
          <p className="mt-4 text-sm text-muted-foreground">{t('validatingSession')}</p>
        </div>
      </div>
    )
  }

  // Don't render anything if redirecting due to session errors
  if (isExpired || isTableMismatch || (sessionError && !session)) {
    return (
      <div className="flex min-h-screen flex-col bg-background">
        <div className="mx-auto w-full max-w-screen-sm px-4 pt-20 text-center">
          <AlertCircle className="mx-auto size-12 text-destructive" aria-hidden="true" />
          <p className="mt-4 text-sm text-muted-foreground">{t('redirecting')}</p>
        </div>
      </div>
    )
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
            <h2 className="text-xl font-semibold">{t('tableNotFound')}</h2>
            <p className="text-sm text-muted-foreground">
              {t('tableNotFoundDesc')}
            </p>
          </div>
          <Button type="button" onClick={refetchTable} className="gap-2">
            <RefreshCw className={cn("size-4", isTableRefetching && "animate-spin")} aria-hidden="true" />
            {t('retry')}
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
                title={t('couldNotLoadInfo')}
                description={tableError ?? menuError ?? t('tryAgain')}
                actionLabel={t('retry')}
                onAction={refetchAll}
                loading={isMenuRefetching || isTableRefetching}
              />
            ) : null}

            <QrCategoryTabs
              categories={categories}
              selectedCategoryId={selectedCategoryId}
              onSelect={handleCategoryChange}
            />

            <QrSearchBar 
              onSearchChange={setSearchQuery}
              className="mb-2"
            />

            <section className="space-y-4" aria-live="polite">
              {filteredItems.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-border/60 bg-muted/30 px-6 py-12 text-center text-sm text-muted-foreground">
                  {searchQuery.trim() 
                    ? t('noDishesForSearch', { query: searchQuery })
                    : t('noDishesFound')
                  }
                </div>
              ) : (
                <div className="grid gap-4">
                  {filteredItems.map((item) => {
                    // For items with modifiers, show total quantity across all customizations
                    const totalQuantity = detailedItems
                      .filter((entry) => entry.item.id === item.id)
                      .reduce((sum, entry) => sum + entry.quantity, 0)

                    return (
                      <QrMenuItemCard
                        key={item.id}
                        item={item}
                        quantity={totalQuantity}
                        currencyFormatter={currencyFormatter}
                        allergenMap={allergenMap}
                        onAdd={(modifiers, notes) => handleAddItem(item, modifiers, notes)}
                        onIncrement={() => addOrIncrement(item.id)}
                        onDecrement={() => {
                          // For items with modifiers, decrement the most recent customization
                          const lastEntry = detailedItems
                            .filter((entry) => entry.item.id === item.id)
                            .pop()
                          if (lastEntry) {
                            decrement(lastEntry.customizationId)
                          }
                        }}
                      />
                    )
                  })}
                </div>
              )}
            </section>
          </div>
        )}
      </main>

      <QrCartSheet
        items={detailedItems}
        itemCount={itemCount}
        totalCents={totalCents}
        currencyFormatter={currencyFormatter}
        tableNumber={table?.number ?? null}
        tableId={tableId}
        sessionId={session?.sessionId}
        onIncrement={(customizationId: string) => increment(customizationId)}
        onDecrement={(customizationId: string) => decrement(customizationId)}
        onRemove={(customizationId: string) => remove(customizationId)}
        onClear={clear}
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
