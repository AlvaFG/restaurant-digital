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

interface QrTableClientProps {
  tableId: string
}

export default function QrTableClient({ tableId }: QrTableClientProps) {
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
    reset,
  } = useQrCart()

  // Auto-select first category if none selected
  useEffect(() => {
    if (
      !selectedCategoryId &&
      categories.length > 0 &&
      !isMenuLoading &&
      !searchQuery
    ) {
      setSelectedCategoryId(categories[0].id)
    }
  }, [categories, isMenuLoading, selectedCategoryId, searchQuery])

  // --- Session validation effects ---
  useEffect(() => {
    if (isExpired) {
      toast({
        title: t('session_expired'),
        description: t('please_scan_qr_again'),
        variant: "destructive",
      })
      // Clear local session storage
      if (typeof window !== 'undefined') {
        localStorage.removeItem('qr_session')
      }
      // Redirect to validate with table info
      setTimeout(() => {
        router.push(`/qr/validate?table=${tableId}`)
      }, 2000)
    }
  }, [isExpired, tableId, router, toast, t])

  useEffect(() => {
    if (isTableMismatch && table) {
      toast({
        title: t('wrong_table'),
        description: t('session_for_different_table', { table: table.name }),
        variant: "destructive",
      })
      setTimeout(() => {
        router.push(`/qr/validate?table=${tableId}`)
      }, 2000)
    }
  }, [isTableMismatch, table, tableId, router, toast, t])

  useEffect(() => {
    if (sessionError && !isSessionValidating) {
      toast({
        title: t('session_error'),
        description: t('unable_to_validate_session'),
        variant: "destructive",
      })
    }
  }, [sessionError, isSessionValidating, toast, t])

  // --- Filter logic ---
  const filteredItems = useMemo(() => {
    let result = items

    // Filter by category
    if (selectedCategoryId) {
      result = result.filter((item) => item.categoryId === selectedCategoryId)
    }

    // Filter by search
    if (searchQuery.trim()) {
      const lowerQuery = searchQuery.toLowerCase()
      result = result.filter(
        (item) =>
          item.name.toLowerCase().includes(lowerQuery) ||
          item.description?.toLowerCase().includes(lowerQuery) ||
          item.allergens?.some((code) =>
            allergenMap.get(code)?.name.toLowerCase().includes(lowerQuery),
          ),
      )
    }

    return result
  }, [items, selectedCategoryId, searchQuery, allergenMap])

  const hasSearchResults = searchQuery.trim() && filteredItems.length > 0
  const hasNoSearchResults = searchQuery.trim() && filteredItems.length === 0

  // --- Cart handlers ---
  function handleAddToCart(
    itemId: string,
    selectedModifiers: CartItemModifier[],
  ) {
    const item = items.find((i) => i.id === itemId)
    if (!item) {
      console.error(`Item ${itemId} not found in menu`)
      return
    }

    const existingCartItem = detailedItems.find((ci) => {
      if (ci.menuItemId !== itemId) return false
      if (ci.modifiers.length !== selectedModifiers.length) return false
      return ci.modifiers.every((m, idx) => {
        const sm = selectedModifiers[idx]
        return (
          m.type === sm.type &&
          m.label === sm.label &&
          m.priceCents === sm.priceCents
        )
      })
    })

    if (existingCartItem) {
      increment(existingCartItem.id)
      toast({
        title: t('item_added'),
        description: t('quantity_increased', { name: item.name }),
      })
    } else {
      addOrIncrement({
        menuItemId: itemId,
        name: item.name,
        priceCents: item.priceCents,
        modifiers: selectedModifiers,
      })
      toast({
        title: t('item_added'),
        description: t('item_added_to_cart', { name: item.name }),
      })
    }
  }

  // --- Loading states ---
  if (isSessionValidating || isTableLoading || isMenuLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-background to-muted/20">
        <div className="text-center space-y-4">
          <Loader2 className="h-12 w-12 animate-spin mx-auto text-primary" />
          <p className="text-muted-foreground">
            {isSessionValidating
              ? t('validating_session')
              : isTableLoading
                ? t('loading_table')
                : t('loading_menu')}
          </p>
        </div>
      </div>
    )
  }

  // --- Error states ---
  if (isExpired || isTableMismatch || sessionError) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-background to-muted/20 p-4">
        <div className="bg-card rounded-lg shadow-lg p-8 max-w-md w-full text-center space-y-4">
          <AlertCircle className="h-16 w-16 text-destructive mx-auto" />
          <h2 className="text-2xl font-bold">
            {isExpired
              ? t('session_expired')
              : isTableMismatch
                ? t('wrong_table')
                : t('session_error')}
          </h2>
          <p className="text-muted-foreground">
            {t('redirecting_to_validation')}
          </p>
          <Loader2 className="h-8 w-8 animate-spin mx-auto text-primary" />
        </div>
      </div>
    )
  }

  if (isTableNotFound) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-background to-muted/20 p-4">
        <div className="bg-card rounded-lg shadow-lg p-8 max-w-md w-full text-center space-y-4">
          <Frown className="h-16 w-16 text-muted-foreground mx-auto" />
          <h2 className="text-2xl font-bold">{t('table_not_found')}</h2>
          <p className="text-muted-foreground">
            {t('table_not_found_description', { tableId })}
          </p>
          <Button
            onClick={() => router.push('/qr/validate')}
            className="w-full"
          >
            {t('scan_qr_again')}
          </Button>
        </div>
      </div>
    )
  }

  if (isMenuError || isTableError) {
    const errorMessage =
      menuError?.message || tableError?.message || t('unknown_error')
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-background to-muted/20 p-4">
        <div className="bg-card rounded-lg shadow-lg p-8 max-w-md w-full text-center space-y-4">
          <WifiOff className="h-16 w-16 text-destructive mx-auto" />
          <h2 className="text-2xl font-bold">{t('loading_error')}</h2>
          <p className="text-sm text-muted-foreground">{errorMessage}</p>
          <Button
            onClick={() => {
              refetchMenu()
              refetchTable()
            }}
            variant="outline"
            className="w-full"
          >
            <RefreshCw className="mr-2 h-4 w-4" />
            {tCommon('retry')}
          </Button>
        </div>
      </div>
    )
  }

  // --- Main render ---
  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/20">
      {/* Header */}
      <QrMenuHeader
        table={table}
        metadata={tableMetadata}
        isRefetching={isTableRefetching || isMenuRefetching}
        onRefetch={() => {
          refetchTable()
          refetchMenu()
        }}
      />

      {/* Main content */}
      <div className="container mx-auto px-4 py-6 space-y-6">
        {/* Search */}
        <QrSearchBar value={searchQuery} onChange={setSearchQuery} />

        {/* Category Tabs */}
        {!searchQuery && (
          <QrCategoryTabs
            categories={categories}
            selectedCategoryId={selectedCategoryId}
            onSelectCategory={setSelectedCategoryId}
          />
        )}

        {/* Items Grid */}
        <div className="space-y-4">
          {hasSearchResults && (
            <p className="text-sm text-muted-foreground">
              {t('search_results', { count: filteredItems.length })}
            </p>
          )}

          {hasNoSearchResults && (
            <div className="text-center py-12 space-y-4">
              <Frown className="h-16 w-16 text-muted-foreground mx-auto" />
              <h3 className="text-lg font-medium">{t('no_results')}</h3>
              <p className="text-sm text-muted-foreground">
                {t('try_different_search')}
              </p>
            </div>
          )}

          {!hasNoSearchResults && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredItems.map((item) => (
                <QrMenuItemCard
                  key={item.id}
                  item={item}
                  allergenMap={allergenMap}
                  currencyFormatter={currencyFormatter}
                  onAddToCart={handleAddToCart}
                />
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Cart Sheet */}
      <QrCartSheet
        detailedItems={detailedItems}
        itemCount={itemCount}
        totalCents={totalCents}
        currencyFormatter={currencyFormatter}
        onIncrement={increment}
        onDecrement={decrement}
        onRemove={remove}
        tableId={tableId}
      />
    </div>
  )
}
