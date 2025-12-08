import { getRequestConfig } from 'next-intl/server';
import { notFound } from 'next/navigation';

// Can be imported from a shared config
export const locales = ['en', 'es'] as const;
export type Locale = (typeof locales)[number];

export default getRequestConfig(async ({ locale }) => {
  // Validate that the incoming `locale` parameter is valid
  if (!locales.includes(locale as Locale)) notFound();

  return {
    messages: {
      common: (await import(`./messages/${locale}/common.json`)).default,
      customer: (await import(`./messages/${locale}/customer.json`)).default,
      config: (await import(`./messages/${locale}/config.json`)).default,
      dashboard: (await import(`./messages/${locale}/dashboard.json`)).default,
      auth: (await import(`./messages/${locale}/auth.json`)).default,
      errors: (await import(`./messages/${locale}/errors.json`)).default,
      validations: (await import(`./messages/${locale}/validations.json`)).default,
      analytics: (await import(`./messages/${locale}/analytics.json`)).default,
      landing: (await import(`./messages/${locale}/landing.json`)).default,
    },
    timeZone: 'America/Argentina/Buenos_Aires',
    now: new Date(),
  };
});
