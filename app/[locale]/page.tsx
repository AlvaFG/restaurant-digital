"use client"

import Link from "next/link"
import { useRouter } from "next/navigation"
import { useLocale, useTranslations } from "next-intl"
import { 
  QrCode, 
  LayoutGrid, 
  Bell, 
  BarChart3, 
  Wifi, 
  UtensilsCrossed,
  Clock,
  Users,
  CheckCircle2,
  ArrowRight,
  Sparkles,
  Globe
} from "lucide-react"
import { Button } from "@/components/ui/button"

export default function HomePage() {
  const t = useTranslations('landing')
  const locale = useLocale()
  const router = useRouter()

  const toggleLocale = () => {
    const newLocale = locale === 'es' ? 'en' : 'es'
    router.push(`/${newLocale}`)
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Navigation Bar */}
      <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto flex h-16 items-center justify-between px-4 md:px-6">
          <Link href="/" className="flex items-center gap-2 transition-opacity hover:opacity-80">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary">
              <UtensilsCrossed className="h-5 w-5 text-primary-foreground" />
            </div>
            <span className="text-lg font-bold">{t('brandName')}</span>
          </Link>
          <nav className="flex items-center gap-4">
            <Link
              href="#features"
              className="hidden text-sm font-medium text-muted-foreground transition-colors hover:text-foreground md:inline-block"
            >
              {t('nav.features')}
            </Link>
            <Link
              href="#benefits"
              className="hidden text-sm font-medium text-muted-foreground transition-colors hover:text-foreground md:inline-block"
            >
              {t('nav.benefits')}
            </Link>
            
            {/* Language Selector */}
            <Button
              variant="ghost"
              size="icon"
              onClick={toggleLocale}
              className="h-9 w-9"
              aria-label="Toggle language"
            >
              <Globe className="h-4 w-4" />
            </Button>

            <Link href={`/${locale}/login`} prefetch={true}>
              <Button className="touch-manipulation">
                {t('nav.login')}
              </Button>
            </Link>
          </nav>
        </div>
      </header>

      {/* Hero Section */}
      <section className="container mx-auto px-4 py-20 md:px-6 md:py-32">
        <div className="mx-auto max-w-4xl text-center">
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border bg-muted px-4 py-1.5 text-sm font-medium">
            <Sparkles className="h-4 w-4" />
            {t('hero.badge')}
          </div>
          <h1 className="mb-6 text-4xl font-bold tracking-tight sm:text-5xl md:text-6xl">
            {t('hero.title')}
          </h1>
          <p className="mb-10 text-lg text-muted-foreground md:text-xl">
            {t('hero.subtitle')}
          </p>
          <div className="flex flex-col items-center justify-center gap-4 sm:flex-row">
            <Link href={`/${locale}/login`} prefetch={true}>
              <Button size="lg" className="gap-2 touch-manipulation">
                {t('hero.cta')}
                <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="border-t bg-muted/50 py-20 md:py-32">
        <div className="container mx-auto px-4 md:px-6">
          <div className="mb-16 text-center">
            <h2 className="mb-4 text-3xl font-bold tracking-tight sm:text-4xl">
              {t('features.title')}
            </h2>
            <p className="mx-auto max-w-2xl text-lg text-muted-foreground">
              {t('features.subtitle')}
            </p>
          </div>
          <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
            {/* Feature 1: QR Management */}
            <div className="group relative rounded-lg border bg-background p-6 shadow-sm transition-all hover:shadow-md">
              <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10 text-primary">
                <QrCode className="h-6 w-6" />
              </div>
              <h3 className="mb-2 text-xl font-semibold">{t('features.qr.title')}</h3>
              <p className="text-muted-foreground">
                {t('features.qr.description')}
              </p>
            </div>

            {/* Feature 2: Table Management */}
            <div className="group relative rounded-lg border bg-background p-6 shadow-sm transition-all hover:shadow-md">
              <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10 text-primary">
                <LayoutGrid className="h-6 w-6" />
              </div>
              <h3 className="mb-2 text-xl font-semibold">{t('features.tables.title')}</h3>
              <p className="text-muted-foreground">
                {t('features.tables.description')}
              </p>
            </div>

            {/* Feature 3: Real-time Alerts */}
            <div className="group relative rounded-lg border bg-background p-6 shadow-sm transition-all hover:shadow-md">
              <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10 text-primary">
                <Bell className="h-6 w-6" />
              </div>
              <h3 className="mb-2 text-xl font-semibold">{t('features.alerts.title')}</h3>
              <p className="text-muted-foreground">
                {t('features.alerts.description')}
              </p>
            </div>

            {/* Feature 4: Analytics */}
            <div className="group relative rounded-lg border bg-background p-6 shadow-sm transition-all hover:shadow-md">
              <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10 text-primary">
                <BarChart3 className="h-6 w-6" />
              </div>
              <h3 className="mb-2 text-xl font-semibold">{t('features.analytics.title')}</h3>
              <p className="text-muted-foreground">
                {t('features.analytics.description')}
              </p>
            </div>

            {/* Feature 5: Offline Mode */}
            <div className="group relative rounded-lg border bg-background p-6 shadow-sm transition-all hover:shadow-md">
              <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10 text-primary">
                <Wifi className="h-6 w-6" />
              </div>
              <h3 className="mb-2 text-xl font-semibold">{t('features.offline.title')}</h3>
              <p className="text-muted-foreground">
                {t('features.offline.description')}
              </p>
            </div>

            {/* Feature 6: Menu Management */}
            <div className="group relative rounded-lg border bg-background p-6 shadow-sm transition-all hover:shadow-md">
              <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10 text-primary">
                <UtensilsCrossed className="h-6 w-6" />
              </div>
              <h3 className="mb-2 text-xl font-semibold">{t('features.menu.title')}</h3>
              <p className="text-muted-foreground">
                {t('features.menu.description')}
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section id="benefits" className="border-t py-20 md:py-32">
        <div className="container mx-auto px-4 md:px-6">
          <div className="grid gap-12 lg:grid-cols-2 lg:gap-16">
            <div>
              <h2 className="mb-6 text-3xl font-bold tracking-tight sm:text-4xl">
                {t('benefits.title')}
              </h2>
              <p className="mb-8 text-lg text-muted-foreground">
                {t('benefits.subtitle')}
              </p>
              <div className="space-y-6">
                <div className="flex gap-4">
                  <div className="flex-shrink-0">
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-green-100 text-green-600 dark:bg-green-900/30">
                      <CheckCircle2 className="h-5 w-5" />
                    </div>
                  </div>
                  <div>
                    <h3 className="mb-1 font-semibold">{t('benefits.efficiency.title')}</h3>
                    <p className="text-muted-foreground">
                      {t('benefits.efficiency.description')}
                    </p>
                  </div>
                </div>
                <div className="flex gap-4">
                  <div className="flex-shrink-0">
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-green-100 text-green-600 dark:bg-green-900/30">
                      <Clock className="h-5 w-5" />
                    </div>
                  </div>
                  <div>
                    <h3 className="mb-1 font-semibold">{t('benefits.time.title')}</h3>
                    <p className="text-muted-foreground">
                      {t('benefits.time.description')}
                    </p>
                  </div>
                </div>
                <div className="flex gap-4">
                  <div className="flex-shrink-0">
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-green-100 text-green-600 dark:bg-green-900/30">
                      <Users className="h-5 w-5" />
                    </div>
                  </div>
                  <div>
                    <h3 className="mb-1 font-semibold">{t('benefits.experience.title')}</h3>
                    <p className="text-muted-foreground">
                      {t('benefits.experience.description')}
                    </p>
                  </div>
                </div>
              </div>
            </div>
            <div className="flex items-center justify-center rounded-lg border bg-muted/50 p-8">
              <div className="text-center">
                <UtensilsCrossed className="mx-auto mb-4 h-32 w-32 text-muted-foreground/20" />
                <p className="text-sm text-muted-foreground">{t('benefits.imageAlt')}</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="border-t bg-primary py-20 text-primary-foreground">
        <div className="container mx-auto px-4 text-center md:px-6">
          <h2 className="mb-4 text-3xl font-bold tracking-tight sm:text-4xl">
            {t('cta.title')}
          </h2>
          <p className="mb-8 text-lg opacity-90">
            {t('cta.subtitle')}
          </p>
          <Link href="/login" prefetch={true}>
            <Button size="lg" variant="secondary" className="gap-2 touch-manipulation">
              {t('cta.button')}
              <ArrowRight className="h-4 w-4" />
            </Button>
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t py-8">
        <div className="container mx-auto px-4 text-center text-sm text-muted-foreground md:px-6">
          <p>{t('footer.copyright')}</p>
          <p className="mt-2">{t('footer.rights')}</p>
        </div>
      </footer>
    </div>
  )
}
