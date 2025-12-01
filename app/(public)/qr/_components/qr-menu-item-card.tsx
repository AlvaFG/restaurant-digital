"use client"

import { useState } from "react"
import dynamic from "next/dynamic"
import { useTranslations } from "next-intl"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import type { MenuAllergen, MenuItem } from "@/lib/mock-data"
import type { CartItemModifier } from "../_types/modifiers"
import { cn } from "@/lib/utils"
import { AlertTriangle, Edit3, Minus, Plus } from "lucide-react"

// Dynamic import for modal - only loads when needed
const ItemCustomizationModal = dynamic(
  () => import("./item-customization-modal").then((mod) => mod.ItemCustomizationModal),
  {
    loading: () => <div className="animate-pulse">Loading...</div>,
    ssr: false,
  }
)

interface QrMenuItemCardProps {
  item: MenuItem
  quantity?: number
  currencyFormatter: Intl.NumberFormat
  allergenMap: Map<string, MenuAllergen>
  onAdd: (modifiers?: CartItemModifier[], notes?: string) => void
  onIncrement: () => void
  onDecrement: () => void
}

export function QrMenuItemCard({
  item,
  quantity = 0,
  currencyFormatter,
  allergenMap,
  onAdd,
  onIncrement,
  onDecrement,
}: QrMenuItemCardProps) {
  const t = useTranslations('customer')
  const [showCustomization, setShowCustomization] = useState(false)
  const price = currencyFormatter.format(item.priceCents / 100)
  const isUnavailable = item.available === false
  const hasModifiers = item.modifierGroups && item.modifierGroups.length > 0

  const handleAddClick = () => {
    if (hasModifiers) {
      setShowCustomization(true)
    } else {
      onAdd()
    }
  }

  const handleCustomizationComplete = (modifiers: CartItemModifier[], notes?: string) => {
    onAdd(modifiers, notes)
    setShowCustomization(false)
  }

  return (
    <article
      className="rounded-2xl border border-border/70 bg-card/80 p-4 shadow-sm"
      aria-label={item.name}
    >
      <div className="flex flex-col gap-3">
        <header className="flex items-start justify-between gap-3">
          <div className="space-y-1">
            <h3 className="text-lg font-semibold leading-tight text-foreground">{item.name}</h3>
            {item.description ? (
              <p className="text-sm leading-snug text-muted-foreground">{item.description}</p>
            ) : null}
          </div>
          <div className="shrink-0 text-right">
            <p className="text-base font-bold text-foreground">{price}</p>
            {isUnavailable ? (
              <Badge variant="destructive" className="mt-1 flex items-center gap-1">
                <AlertTriangle className="size-3" aria-hidden="true" />
                {t('notAvailable')}
              </Badge>
            ) : (
              <Badge variant="secondary" className="mt-1">{t('available')}</Badge>
            )}
          </div>
        </header>

        {item.allergens && item.allergens.length > 0 ? (
          <div className="flex flex-wrap gap-2" aria-label="Alergenos">
            {item.allergens.map((allergen) => {
              const definition = allergenMap.get(allergen.code)
              const severity = allergen.contains ? "contains" : allergen.traces ? "traces" : "info"
              const label = definition?.name ?? allergen.code
              const notes: string[] = []

              if (allergen.contains) {
                notes.push(t('contains'))
              } else if (allergen.traces) {
                notes.push(t('traces'))
              }

              if (definition?.description) {
                notes.push(definition.description)
              }

              return (
                <Badge
                  key={`${item.id}-allergen-${allergen.code}`}
                  variant={severity === "contains" ? "destructive" : "outline"}
                  className={cn(
                    "gap-1",
                    severity === "contains" && "border-destructive/80 bg-destructive/10 text-destructive",
                    severity === "traces" && "border-amber-500/40 text-amber-600",
                  )}
                >
                  <span className="text-xs font-medium uppercase">{label}</span>
                  {notes.length > 0 ? (
                    <span className="text-[10px] font-normal tracking-wide text-muted-foreground">
                      {notes.join(" ")}
                    </span>
                  ) : null}
                </Badge>
              )
            })}
          </div>
        ) : null}

        <div className="flex items-center justify-between">
          {quantity > 0 ? (
            <div className="flex items-center gap-2 rounded-full border border-border px-3 py-2">
              <Button
                type="button"
                size="icon"
                variant="ghost"
                className="size-8 rounded-full"
                onClick={onDecrement}
                aria-label={t('removeUnit', { item: item.name })}
              >
                <Minus className="size-4" aria-hidden="true" />
              </Button>
              <span className="min-w-[1.5rem] text-center text-sm font-semibold">{quantity}</span>
              <Button
                type="button"
                size="icon"
                variant="ghost"
                className="size-8 rounded-full"
                onClick={onIncrement}
                aria-label={t('addUnit', { item: item.name })}
                disabled={isUnavailable}
              >
                <Plus className="size-4" aria-hidden="true" />
              </Button>
            </div>
          ) : (
            <div aria-live="polite" className="text-sm text-muted-foreground">
              {isUnavailable ? t('dishNotAvailableNow') : t('addDishToOrder')}
            </div>
          )}

          <Button
            type="button"
            className="min-h-[3rem] min-w-[8rem] rounded-full font-semibold"
            onClick={handleAddClick}
            disabled={isUnavailable}
          >
            {hasModifiers ? (
              <>
                <Edit3 className="mr-2 size-4" aria-hidden="true" />
                {t('customize')}
              </>
            ) : (
              t('add')
            )}
          </Button>
        </div>
      </div>

      {/* Customization Modal */}
      <ItemCustomizationModal
        item={item}
        isOpen={showCustomization}
        onClose={() => setShowCustomization(false)}
        onAddToCart={handleCustomizationComplete}
        currencyFormatter={currencyFormatter}
      />
    </article>
  )
}
