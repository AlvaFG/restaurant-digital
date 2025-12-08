import type React from "next"
import type { Viewport } from "next"
import { Inter, JetBrains_Mono } from "next/font/google"
import { Analytics } from "@vercel/analytics/next"
import { AuthProvider } from "@/contexts/auth-context"
import { QueryProvider } from "@/contexts/query-provider"
import { ThemeProvider } from "@/components/theme-provider"
import { ErrorBoundary } from "@/components/error-boundary"
import { PWAProvider } from "@/components/pwa-provider"
import { ConnectionStatus } from "@/components/connection-status"
import { InstallPrompt } from "@/components/install-prompt"
import { Suspense } from "react"
import { NextIntlClientProvider } from 'next-intl';
import { getMessages } from 'next-intl/server';
import { notFound } from 'next/navigation';
import { locales } from '@/i18n';
import "../globals.css"

const inter = Inter({
  subsets: ["latin", "latin-ext"],
  variable: "--font-sans",
})

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin", "latin-ext"],
  variable: "--font-mono",
})

export function generateStaticParams() {
  return locales.map((locale) => ({ locale }));
}

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  return {
    title: locale === 'en' 
      ? "Restaurant Demo - Management System" 
      : "Restaurante Demo - Sistema de Gestión",
    description: locale === 'en'
      ? "Restaurant management system with staff and admin roles"
      : "Sistema de gestión para restaurantes con roles de staff y administrador",
    generator: "v0.app",
    manifest: "/manifest.json",
    appleWebApp: {
      capable: true,
      statusBarStyle: "black-translucent",
      title: "Restaurant QR",
      startupImage: [
        {
          url: "/apple-splash-2048-2732.png",
          media: "(device-width: 1024px) and (device-height: 1366px) and (-webkit-device-pixel-ratio: 2) and (orientation: portrait)",
        },
        {
          url: "/apple-splash-1668-2388.png",
          media: "(device-width: 834px) and (device-height: 1194px) and (-webkit-device-pixel-ratio: 2) and (orientation: portrait)",
        },
        {
          url: "/apple-splash-1536-2048.png",
          media: "(device-width: 768px) and (device-height: 1024px) and (-webkit-device-pixel-ratio: 2) and (orientation: portrait)",
        },
        {
          url: "/apple-splash-1125-2436.png",
          media: "(device-width: 375px) and (device-height: 812px) and (-webkit-device-pixel-ratio: 3) and (orientation: portrait)",
        },
        {
          url: "/apple-splash-1242-2688.png",
          media: "(device-width: 414px) and (device-height: 896px) and (-webkit-device-pixel-ratio: 3) and (orientation: portrait)",
        },
        {
          url: "/apple-splash-828-1792.png",
          media: "(device-width: 414px) and (device-height: 896px) and (-webkit-device-pixel-ratio: 2) and (orientation: portrait)",
        },
        {
          url: "/apple-splash-1242-2208.png",
          media: "(device-width: 414px) and (device-height: 736px) and (-webkit-device-pixel-ratio: 3) and (orientation: portrait)",
        },
        {
          url: "/apple-splash-750-1334.png",
          media: "(device-width: 375px) and (device-height: 667px) and (-webkit-device-pixel-ratio: 2) and (orientation: portrait)",
        },
        {
          url: "/apple-splash-640-1136.png",
          media: "(device-width: 320px) and (device-height: 568px) and (-webkit-device-pixel-ratio: 2) and (orientation: portrait)",
        },
      ],
    },
    formatDetection: {
      telephone: false,
    },
    icons: {
      apple: [
        { url: "/apple-touch-icon.png", sizes: "180x180", type: "image/png" },
        { url: "/apple-touch-icon-152x152.png", sizes: "152x152", type: "image/png" },
        { url: "/apple-touch-icon-167x167.png", sizes: "167x167", type: "image/png" },
        { url: "/apple-touch-icon-120x120.png", sizes: "120x120", type: "image/png" },
      ],
    },
  };
}

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  userScalable: true,
  viewportFit: "cover",
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#ffffff" },
    { media: "(prefers-color-scheme: dark)", color: "#000000" },
  ],
}

export default async function LocaleLayout({
  children,
  params
}: Readonly<{
  children: React.ReactNode
  params: Promise<{ locale: string }>
}>) {
  // Validate that the incoming `locale` parameter is valid
  const { locale } = await params;
  if (!locales.includes(locale as any)) {
    notFound();
  }

  // Providing all messages to the client side is the easiest way to get started
  const messages = await getMessages();

  return (
    <html lang={locale} suppressHydrationWarning>
      <body className={`font-sans ${inter.variable} ${jetbrainsMono.variable}`}>
        <NextIntlClientProvider messages={messages}>
          <ErrorBoundary>
            <QueryProvider>
              <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
                <PWAProvider>
                  <ConnectionStatus />
                  <InstallPrompt />
                  <Suspense fallback={null}>
                    <AuthProvider>{children}</AuthProvider>
                  </Suspense>
                </PWAProvider>
              </ThemeProvider>
            </QueryProvider>
          </ErrorBoundary>
        </NextIntlClientProvider>
        <Analytics />
      </body>
    </html>
  )
}
