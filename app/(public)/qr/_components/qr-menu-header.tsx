"use client"

import { useTranslations } from "next-intl"
import { BrandAwareBadge } from "@/components/brand-aware-badge"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { cn } from "@/lib/utils"
import { CalendarClock, RefreshCw } from "lucide-react"

interface QrMenuHeaderProps {
  tableNumber?: number | null
  tableId?: string | null
  zone?: string | null
  menuVersion?: string | number | null
  updatedAt?: string | null
  isLoading?: boolean
  isRefreshing?: boolean
  onRefresh?: () => void
  className?: string
}

function formatUpdatedAt(updatedAt?: string | null) {
  if (!updatedAt) {
    return null
  }

  const date = new Date(updatedAt)
  if (Number.isNaN(date.getTime())) {
    return updatedAt
  }

  return new Intl.DateTimeFormat("es-AR", {
    dateStyle: "short",
    timeStyle: "short",
  }).format(date)
}

export function QrMenuHeader({
  tableNumber,
  tableId,
  zone,
  menuVersion,
  updatedAt,
  isLoading = false,
  isRefreshing = false,
  onRefresh,
  className,
}: QrMenuHeaderProps) {
  const t = useTranslations('customer')
  const formattedUpdatedAt = formatUpdatedAt(updatedAt)

  return (
    <header
      className={cn(
        "sticky top-0 z-30 border-b border-border/60 bg-background/80 px-4 pb-4 pt-6",
        "backdrop-blur supports-[backdrop-filter]:bg-background/60",
        className,
      )}
    >
      <div className="mx-auto flex w-full max-w-screen-sm flex-col gap-4">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <BrandAwareBadge useBrandColor className="px-3 py-1 text-sm font-semibold uppercase tracking-tight">
              Restaurante 360
            </BrandAwareBadge>
            {tableId ? (
              <span className="rounded-full border border-dashed border-muted-foreground/50 px-3 py-1 text-xs uppercase text-muted-foreground">
                QR {tableId}
              </span>
            ) : null}
          </div>
          {onRefresh ? (
            <Button
              type="button"
              size="sm"
              variant="ghost"
              className="gap-2"
              onClick={onRefresh}
              disabled={isLoading || isRefreshing}
            >
              <RefreshCw className={cn("size-4", isRefreshing && "animate-spin")} aria-hidden="true" />
              {t('retry')}
            </Button>
          ) : null}
        </div>

        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <p className="text-xs uppercase tracking-wider text-muted-foreground">{t('table')}</p>
            {isLoading ? (
              <Skeleton className="mt-1 h-8 w-24 rounded-md" />
            ) : (
              <div className="flex items-baseline gap-2">
                <span className="text-4xl font-black tracking-tight">{tableNumber ?? "-"}</span>
                {zone ? <span className="text-sm text-muted-foreground">{zone}</span> : null}
              </div>
            )}
          </div>
          <div className="text-right text-sm text-muted-foreground">
            <p className="font-medium">{t('menu')} {t('version')} {menuVersion ?? "-"}</p>
            <div className="mt-1 flex items-center justify-end gap-1 text-xs">
              <CalendarClock className="size-4" aria-hidden="true" />
              <span>
                {formattedUpdatedAt ? `${t('lastUpdated')} ${formattedUpdatedAt}` : t('lastUpdated')}
              </span>
            </div>
          </div>
        </div>
      </div>
    </header>
  )
}
