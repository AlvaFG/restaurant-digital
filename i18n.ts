import { getRequestConfig } from 'next-intl/server';
import { notFound } from 'next/navigation';

// Can be imported from a shared config
export const locales = ['en', 'es'] as const;
export type Locale = (typeof locales)[number];

export default getRequestConfig(async ({ locale }) => {
  const resolvedLocale = (locale ?? 'es') as Locale;
  if (!locales.includes(resolvedLocale)) notFound();

  return {
    locale: resolvedLocale,
    messages: {
      common: (await import(`./messages/${resolvedLocale}/common.json`)).default,
      customer: (await import(`./messages/${resolvedLocale}/customer.json`)).default,
      config: (await import(`./messages/${resolvedLocale}/config.json`)).default,
      dashboard: (await import(`./messages/${resolvedLocale}/dashboard.json`)).default,
      auth: (await import(`./messages/${resolvedLocale}/auth.json`)).default,
      errors: (await import(`./messages/${resolvedLocale}/errors.json`)).default,
      validations: (await import(`./messages/${resolvedLocale}/validations.json`)).default,
      analytics: (await import(`./messages/${resolvedLocale}/analytics.json`)).default,
      landing: (await import(`./messages/${resolvedLocale}/landing.json`)).default,
    },
    timeZone: 'America/Argentina/Buenos_Aires',
    now: new Date(),
  };
});
