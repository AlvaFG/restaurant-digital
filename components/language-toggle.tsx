"use client"

import React from "react"
import { useLocale } from "next-intl"
import { useRouter, usePathname } from "next/navigation"

export function LanguageToggle() {
  const locale = useLocale()
  const router = useRouter()
  const pathname = usePathname()

  const toggleLocale = () => {
    const newLocale = locale === "es" ? "en" : "es"
    // Get current path without locale prefix
    const pathWithoutLocale = pathname.replace(/^\/[a-z]{2}/, '') || '/'
    // Navigate to the same path with new locale
    router.push(`/${newLocale}${pathWithoutLocale}`)
  }

  return (
    <div className="fixed top-4 right-4 z-50">
      <button
        aria-label={locale === "es" ? "Cambiar a inglés" : "Switch to Spanish"}
        onClick={toggleLocale}
        className="rounded-full border px-3 py-1 bg-white/90 dark:bg-slate-900/80 shadow-sm"
      >
        {locale === "es" ? "ES" : "EN"}
      </button>
    </div>
  )
}
