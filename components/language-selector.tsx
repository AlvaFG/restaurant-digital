"use client"

import { useLocale, useTranslations } from 'next-intl';
import { useRouter, usePathname } from 'next/navigation';
import { Label } from "@/components/ui/label"
import { useTransition } from 'react';
import { useI18n } from '@/contexts/i18n-context';

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
  const { setLocale } = useI18n();

  function onSelectChange(newLocale: string) {
    if (newLocale !== locale) {
      startTransition(() => {
        // 1. Update context (saves to localStorage and cookie)
        setLocale(newLocale as 'en' | 'es');
        
        // 2. Refresh to reload messages
        router.refresh();
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
