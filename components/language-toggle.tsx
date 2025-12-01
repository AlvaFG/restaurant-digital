"use client"

import React from "react"
import { useI18n } from "@/contexts/i18n-context"

export function LanguageToggle() {
  const { locale, setLocale } = useI18n()

  return (
    <div className="fixed top-4 right-4 z-50">
      <button
        aria-label={locale === "es" ? "Cambiar a inglés" : "Switch to Spanish"}
        onClick={() => setLocale(locale === "es" ? "en" : "es")}
        className="rounded-full border px-3 py-1 bg-white/90 dark:bg-slate-900/80 shadow-sm"
      >
        {locale === "es" ? "ES" : "EN"}
      </button>
    </div>
  )
}
