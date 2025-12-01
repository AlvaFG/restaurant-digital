"use client"

import { useMemo } from "react"
import { useTranslations } from "next-intl"

import { Button } from "@/components/ui/button"
import type { MenuCategory } from "@/lib/mock-data"
import { cn } from "@/lib/utils"

interface QrCategoryTabsProps {
  categories: MenuCategory[]
  selectedCategoryId: string | null
  onSelect: (categoryId: string | null) => void
  className?: string
}

export function QrCategoryTabs({ categories, selectedCategoryId, onSelect, className }: QrCategoryTabsProps) {
  const t = useTranslations('customer')
  const orderedCategories = useMemo(
    () => [...categories].sort((a, b) => a.sort - b.sort),
    [categories],
  )

  return (
    <nav className={cn("px-4", className)} aria-label={t('categories')}>
      <div className="flex gap-2 overflow-x-auto pb-2" role="tablist">
        <CategoryPill
          label={t('allCategories')}
          isActive={selectedCategoryId === null}
          onClick={() => onSelect(null)}
        />
        {orderedCategories.map((category) => (
          <CategoryPill
            key={category.id}
            label={category.name}
            isActive={selectedCategoryId === category.id}
            onClick={() => onSelect(category.id)}
          />
        ))}
      </div>
    </nav>
  )
}

interface CategoryPillProps {
  label: string
  isActive: boolean
  onClick: () => void
}

function CategoryPill({ label, isActive, onClick }: CategoryPillProps) {
  return (
    <Button
      type="button"
      variant={isActive ? "default" : "secondary"}
      size="sm"
      className={cn(
        "min-h-[2.5rem] rounded-full px-4 text-sm font-medium",
        !isActive && "bg-muted text-muted-foreground",
      )}
      role="tab"
      aria-selected={isActive}
      onClick={onClick}
    >
      {label}
    </Button>
  )
}
