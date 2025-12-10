"use client"

import { useLocale, useTranslations } from 'next-intl';
import { useRouter, usePathname } from 'next/navigation';
import { Label } from "@/components/ui/label"
import { useTransition } from 'react';

const LANGUAGE_OPTIONS = [
  { value: 'es', label: '🇪🇸 Español', flag: '🇪🇸' },
  { value: 'en', label: '🇺🇸 English', flag: '🇺🇸' },
]

export function LanguageSelector() {
  const locale = useLocale();
  const t = useTranslations('config');
  const router = useRouter();
  const pathname = usePathname();
  const [isPending, startTransition] = useTransition();

  function onSelectChange(newLocale: string) {
    if (newLocale !== locale) {
      startTransition(() => {
        // Get current path without locale prefix
        const pathWithoutLocale = pathname.replace(/^\/[a-z]{2}/, '') || '/';
        
        // Navigate to the same path with new locale
        router.push(`/${newLocale}${pathWithoutLocale}`);
      });
    }
  }

  return (
    <div className="flex items-center justify-between">
      <div>
        <Label>{t('language')}</Label>
        <p className="text-sm text-muted-foreground">
          {t('languageDescription')}
        </p>
      </div>
      <div>
        <select
          aria-label={t('selectLanguage')}
          value={locale}
          onChange={(e) => onSelectChange(e.target.value)}
          disabled={isPending}
          className="rounded border px-3 py-1.5 disabled:opacity-50 bg-background"
        >
          {LANGUAGE_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>{opt.label}</option>
          ))}
        </select>
      </div>
    </div>
  );
}
