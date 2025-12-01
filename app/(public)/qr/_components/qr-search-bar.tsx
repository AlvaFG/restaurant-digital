"use client"

import { useCallback, useEffect, useState } from "react"
import { useTranslations } from "next-intl"
import { Input } from "@/components/ui/input"
import { Search, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

interface QrSearchBarProps {
  onSearchChange: (query: string) => void
  placeholder?: string
  debounceMs?: number
  className?: string
}

export function QrSearchBar({
  onSearchChange,
  placeholder,
  debounceMs = 300,
  className,
}: QrSearchBarProps) {
  const t = useTranslations('customer')
  const [query, setQuery] = useState("")
  const [debouncedQuery, setDebouncedQuery] = useState("")

  // Use translation for placeholder if not provided
  const effectivePlaceholder = placeholder ?? t('searchMenu')

  // Debounce logic
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQuery(query)
    }, debounceMs)

    return () => clearTimeout(timer)
  }, [query, debounceMs])

  // Notify parent when debounced query changes
  useEffect(() => {
    onSearchChange(debouncedQuery)
  }, [debouncedQuery, onSearchChange])

  const handleClear = useCallback(() => {
    setQuery("")
    setDebouncedQuery("")
  }, [])

  return (
    <div className={cn("relative", className)}>
      <Search 
        className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground pointer-events-none" 
        aria-hidden="true"
      />
      <Input
        type="search"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder={effectivePlaceholder}
        className="h-12 pl-10 pr-10 text-base rounded-full border-2 focus-visible:ring-2 focus-visible:ring-primary/20"
        aria-label={t('searchMenu')}
      />
      {query && (
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="absolute right-1 top-1/2 size-8 -translate-y-1/2 rounded-full hover:bg-muted"
          onClick={handleClear}
          aria-label={t('cancel')}
        >
          <X className="size-4" aria-hidden="true" />
        </Button>
      )}
    </div>
  )
}
