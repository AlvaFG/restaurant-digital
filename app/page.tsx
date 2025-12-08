"use client"

import Link from "next/link"
import { useTranslations } from "next-intl"
import { useI18n } from "@/contexts/i18n-context"
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
  const { locale, setLocale } = useI18n()

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
              size="sm"
              onClick={() => setLocale(locale === 'es' ? 'en' : 'es')}
              className="hidden gap-2 md:inline-flex"
            >
              <Globe className="h-4 w-4" />
              <span className="text-sm font-medium">{locale === 'es' ? 'ES' : 'EN'}</span>
            </Button>
            
            <Link
              href="/login"
              className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
            >
              {t('nav.login')}
            </Link>
          </nav>
        </div>
      </header>

      <main>
        {/* Hero Section */}
        <section className="w-full px-4 py-20 md:py-32 lg:py-40">
          <div className="container mx-auto">
            <div className="mx-auto max-w-4xl text-center">
              <div className="mb-6 inline-flex items-center gap-2 rounded-full border bg-muted px-4 py-1.5 text-sm">
                <Sparkles className="h-4 w-4 text-primary" />
                <span className="font-medium">{t('hero.badge')}</span>
              </div>
              <h1 className="mb-6 text-4xl font-bold tracking-tight sm:text-5xl md:text-6xl lg:text-7xl">
                {t('hero.title')}
              </h1>
              <p className="mx-auto mb-10 max-w-2xl text-base text-muted-foreground md:text-lg lg:text-xl">
                {t('hero.subtitle')}
              </p>
              <div className="flex flex-col items-center justify-center gap-4 sm:flex-row">
                <Link
                  href="/login"
                  className="inline-flex h-12 items-center justify-center gap-2 rounded-lg bg-primary px-8 text-base font-medium text-primary-foreground transition-colors hover:bg-primary/90 shadow-lg shadow-primary/25"
                >
                  {t('hero.ctaPrimary')}
                  <ArrowRight className="h-5 w-5" />
                </Link>
                <Link
                  href="#features"
                  className="inline-flex h-12 items-center justify-center rounded-lg border border-input bg-background px-8 text-base font-medium transition-colors hover:bg-accent hover:text-accent-foreground"
                >
                  {t('hero.ctaSecondary')}
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section id="features" className="w-full border-t bg-muted/30 py-20 md:py-32">
          <div className="container mx-auto px-4 md:px-6">
            <div className="mb-16 text-center">
              <h2 className="mb-4 text-3xl font-bold tracking-tight sm:text-4xl md:text-5xl">
                {t('features.title')}
              </h2>
              <p className="mx-auto max-w-2xl text-base text-muted-foreground md:text-lg">
                {t('features.subtitle')}
              </p>
            </div>
            <div className="mx-auto grid max-w-6xl gap-8 sm:grid-cols-2 lg:grid-cols-3">
              {/* QR Management */}
              <div className="group relative overflow-hidden rounded-xl border bg-background p-8 transition-all hover:shadow-xl hover:shadow-primary/5">
                <div className="mb-4 inline-flex h-14 w-14 items-center justify-center rounded-xl bg-primary/10">
                  <QrCode className="h-7 w-7 text-primary" />
                </div>
                <h3 className="mb-3 text-xl font-semibold">{t('features.qr.title')}</h3>
                <p className="text-sm leading-relaxed text-muted-foreground">
                  {t('features.qr.description')}
                </p>
              </div>

              {/* Table Map */}
              <div className="group relative overflow-hidden rounded-xl border bg-background p-8 transition-all hover:shadow-xl hover:shadow-primary/5">
                <div className="mb-4 inline-flex h-14 w-14 items-center justify-center rounded-xl bg-primary/10">
                  <LayoutGrid className="h-7 w-7 text-primary" />
                </div>
                <h3 className="mb-3 text-xl font-semibold">{t('features.tables.title')}</h3>
                <p className="text-sm leading-relaxed text-muted-foreground">
                  {t('features.tables.description')}
                </p>
              </div>

              {/* Kitchen Display */}
              <div className="group relative overflow-hidden rounded-xl border bg-background p-8 transition-all hover:shadow-xl hover:shadow-primary/5">
                <div className="mb-4 inline-flex h-14 w-14 items-center justify-center rounded-xl bg-primary/10">
                  <Bell className="h-7 w-7 text-primary" />
                </div>
                <h3 className="mb-3 text-xl font-semibold">{t('features.notifications.title')}</h3>
                <p className="text-sm leading-relaxed text-muted-foreground">
                  {t('features.notifications.description')}
                </p>
              </div>

              {/* Analytics */}
              <div className="group relative overflow-hidden rounded-xl border bg-background p-8 transition-all hover:shadow-xl hover:shadow-primary/5">
                <div className="mb-4 inline-flex h-14 w-14 items-center justify-center rounded-xl bg-primary/10">
                  <BarChart3 className="h-7 w-7 text-primary" />
                </div>
                <h3 className="mb-3 text-xl font-semibold">{t('features.analytics.title')}</h3>
                <p className="text-sm leading-relaxed text-muted-foreground">
                  {t('features.analytics.description')}
                </p>
              </div>

              {/* Offline Mode */}
              <div className="group relative overflow-hidden rounded-xl border bg-background p-8 transition-all hover:shadow-xl hover:shadow-primary/5">
                <div className="mb-4 inline-flex h-14 w-14 items-center justify-center rounded-xl bg-primary/10">
                  <Wifi className="h-7 w-7 text-primary" />
                </div>
                <h3 className="mb-3 text-xl font-semibold">{t('features.offline.title')}</h3>
                <p className="text-sm leading-relaxed text-muted-foreground">
                  {t('features.offline.description')}
                </p>
              </div>

              {/* Staff Management */}
              <div className="group relative overflow-hidden rounded-xl border bg-background p-8 transition-all hover:shadow-xl hover:shadow-primary/5">
                <div className="mb-4 inline-flex h-14 w-14 items-center justify-center rounded-xl bg-primary/10">
                  <Users className="h-7 w-7 text-primary" />
                </div>
                <h3 className="mb-3 text-xl font-semibold">{t('features.staff.title')}</h3>
                <p className="text-sm leading-relaxed text-muted-foreground">
                  {t('features.staff.description')}
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Benefits Section */}
        <section id="benefits" className="w-full py-20 md:py-32">
          <div className="container mx-auto px-4 md:px-6">
            <div className="mx-auto grid max-w-6xl gap-12 lg:grid-cols-2 lg:gap-16">
              <div className="flex flex-col justify-center">
                <h2 className="mb-8 text-3xl font-bold tracking-tight sm:text-4xl md:text-5xl">
                  {t('benefits.title')}
                </h2>
                <div className="space-y-6">
                  <div className="flex gap-4">
                    <CheckCircle2 className="h-6 w-6 shrink-0 text-primary mt-0.5" />
                    <div>
                      <h3 className="mb-2 text-lg font-semibold">{t('benefits.items.saveTime.title')}</h3>
                      <p className="text-sm leading-relaxed text-muted-foreground">
                        {t('benefits.items.saveTime.description')}
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-4">
                    <CheckCircle2 className="h-6 w-6 shrink-0 text-primary mt-0.5" />
                    <div>
                      <h3 className="mb-2 text-lg font-semibold">{t('benefits.items.increaseSales.title')}</h3>
                      <p className="text-sm leading-relaxed text-muted-foreground">
                        {t('benefits.items.increaseSales.description')}
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-4">
                    <CheckCircle2 className="h-6 w-6 shrink-0 text-primary mt-0.5" />
                    <div>
                      <h3 className="mb-2 text-lg font-semibold">{t('benefits.items.improveExperience.title')}</h3>
                      <p className="text-sm leading-relaxed text-muted-foreground">
                        {t('benefits.items.improveExperience.description')}
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-4">
                    <CheckCircle2 className="h-6 w-6 shrink-0 text-primary mt-0.5" />
                    <div>
                      <h3 className="mb-2 text-lg font-semibold">{t('benefits.items.realTimeControl.title')}</h3>
                      <p className="text-sm leading-relaxed text-muted-foreground">
                        {t('benefits.items.realTimeControl.description')}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
              <div className="flex items-center justify-center lg:justify-end">
                <div className="relative w-full max-w-md">
                  <div className="absolute -inset-4 rounded-2xl bg-primary/5 blur-3xl" />
                  <div className="relative space-y-6 rounded-2xl border bg-background p-10 shadow-xl">
                    <div className="flex items-center gap-4">
                      <div className="flex h-16 w-16 items-center justify-center rounded-xl bg-primary/10">
                        <Clock className="h-8 w-8 text-primary" />
                      </div>
                      <div>
                        <div className="text-3xl font-bold">-40%</div>
                        <div className="text-sm text-muted-foreground">{t('benefits.stats.waitTime')}</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="flex h-16 w-16 items-center justify-center rounded-xl bg-primary/10">
                        <BarChart3 className="h-8 w-8 text-primary" />
                      </div>
                      <div>
                        <div className="text-3xl font-bold">+25%</div>
                        <div className="text-sm text-muted-foreground">{t('benefits.stats.efficiency')}</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="flex h-16 w-16 items-center justify-center rounded-xl bg-primary/10">
                        <Users className="h-8 w-8 text-primary" />
                      </div>
                      <div>
                        <div className="text-3xl font-bold">100%</div>
                        <div className="text-sm text-muted-foreground">{t('benefits.stats.satisfaction')}</div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="w-full border-t bg-muted/30 py-20 md:py-32">
          <div className="container mx-auto px-4 md:px-6">
            <div className="mx-auto max-w-3xl text-center">
              <h2 className="mb-6 text-3xl font-bold tracking-tight sm:text-4xl md:text-5xl">
                {t('cta.title')}
              </h2>
              <p className="mb-10 text-base text-muted-foreground md:text-lg">
                {t('cta.subtitle')}
              </p>
              <Link
                href="/login"
                className="inline-flex h-14 items-center justify-center gap-2 rounded-lg bg-primary px-10 text-base font-medium text-primary-foreground transition-colors hover:bg-primary/90 shadow-lg shadow-primary/25"
              >
                {t('cta.button')}
                <ArrowRight className="h-5 w-5" />
              </Link>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t py-10">
        <div className="container mx-auto px-4 md:px-6">
          <div className="flex flex-col items-center justify-between gap-4 md:flex-row">
            <div className="flex items-center gap-2">
              <UtensilsCrossed className="h-5 w-5 text-primary" />
              <span className="font-semibold">{t('brandName')}</span>
            </div>
            <p className="text-sm text-muted-foreground">
              © {new Date().getFullYear()} {t('brandName')}. {t('footer.rights')}.
            </p>
          </div>
        </div>
      </footer>
    </div>
  )
}
