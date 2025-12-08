"use client"

import React, { createContext, useContext, useEffect, useMemo, useState } from "react"
import { NextIntlClientProvider } from "next-intl"
import en from "@/locales/en.json"
import es from "@/locales/es.json"

// Import next-intl messages
import commonEn from "@/messages/en/common.json"
import commonEs from "@/messages/es/common.json"
import customerEn from "@/messages/en/customer.json"
import customerEs from "@/messages/es/customer.json"
import configEn from "@/messages/en/config.json"
import configEs from "@/messages/es/config.json"
import dashboardEn from "@/messages/en/dashboard.json"
import dashboardEs from "@/messages/es/dashboard.json"
import authEn from "@/messages/en/auth.json"
import authEs from "@/messages/es/auth.json"
import errorsEn from "@/messages/en/errors.json"
import errorsEs from "@/messages/es/errors.json"
import validationsEn from "@/messages/en/validations.json"
import validationsEs from "@/messages/es/validations.json"
import analyticsEn from "@/messages/en/analytics.json"
import analyticsEs from "@/messages/es/analytics.json"
import landingEn from "@/messages/en/landing.json"
import landingEs from "@/messages/es/landing.json"

type Locale = "en" | "es"

const translations: Record<Locale, any> = {
  en,
  es,
}

// Combine next-intl messages by namespace
const nextIntlMessages: Record<Locale, any> = {
  en: {
    common: commonEn,
    customer: customerEn,
    config: configEn,
    dashboard: dashboardEn,
    auth: authEn,
    errors: errorsEn,
    validations: validationsEn,
    analytics: analyticsEn,
    landing: landingEn,
  },
  es: {
    common: commonEs,
    customer: customerEs,
    config: configEs,
    dashboard: dashboardEs,
    auth: authEs,
    errors: errorsEs,
    validations: validationsEs,
    analytics: analyticsEs,
    landing: landingEs,
  },
}

interface I18nContextValue {
  locale: Locale
  setLocale: (l: Locale) => void
  t: (key: string, vars?: Record<string, string | number>) => string
}

const I18nContext = createContext<I18nContextValue | undefined>(undefined)

export function I18nProvider({ children }: { children: React.ReactNode }) {
  const [locale, setLocale] = useState<Locale>(() => {
    try {
      const stored = typeof window !== "undefined" ? localStorage.getItem("locale") : null
      if (stored === "en" || stored === "es") return stored
      if (typeof navigator !== "undefined") {
        return navigator.language?.startsWith("en") ? "en" : "es"
      }
      return "es"
    } catch {
      return "es"
    }
  })

  useEffect(() => {
    try {
      localStorage.setItem("locale", locale)
      if (typeof document !== "undefined") document.documentElement.lang = locale === "es" ? "es" : "en"
    } catch (e) {
      // ignore
    }
  }, [locale])

  const t = (key: string, vars?: Record<string, string | number>) => {
    const parts = key.split(".")
    let value: any = translations[locale]
    for (const p of parts) {
      value = value?.[p]
      if (value === undefined) break
    }
    let res = value ?? key
    if (vars && typeof res === "string") {
      for (const k of Object.keys(vars)) {
        res = res.replace(new RegExp(`{${k}}`, "g"), String(vars[k]))
      }
    }
    return res
  }

  const value = useMemo(() => ({ locale, setLocale, t }), [locale])

  return (
    <I18nContext.Provider value={value}>
      <NextIntlClientProvider locale={locale} messages={nextIntlMessages[locale]} timeZone="America/Argentina/Buenos_Aires">
        {children}
      </NextIntlClientProvider>
    </I18nContext.Provider>
  )
}

export function useI18n() {
  const ctx = useContext(I18nContext)
  if (!ctx) throw new Error("useI18n must be used within I18nProvider")
  return ctx
}
