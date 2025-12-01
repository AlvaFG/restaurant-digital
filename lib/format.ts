/**
 * Centralized formatting utilities for dates, currency, and numbers
 * Respects the current locale for proper regional formatting
 */

export type Locale = 'en' | 'es';

/**
 * Format a date according to locale
 * @param date - Date to format
 * @param locale - Current locale
 * @param options - Intl.DateTimeFormatOptions
 */
export function formatDate(
  date: Date | string | number,
  locale: Locale = 'es',
  options?: Intl.DateTimeFormatOptions
): string {
  const dateObj = typeof date === 'string' || typeof date === 'number' ? new Date(date) : date;
  
  const defaultOptions: Intl.DateTimeFormatOptions = {
    dateStyle: 'medium',
    timeStyle: 'short',
    timeZone: 'America/Argentina/Buenos_Aires',
  };

  return new Intl.DateTimeFormat(
    locale === 'es' ? 'es-AR' : 'en-US',
    { ...defaultOptions, ...options }
  ).format(dateObj);
}

/**
 * Format a date as a short date (no time)
 */
export function formatDateShort(date: Date | string | number, locale: Locale = 'es'): string {
  return formatDate(date, locale, { dateStyle: 'short', timeStyle: undefined });
}

/**
 * Format a date as a long date
 */
export function formatDateLong(date: Date | string | number, locale: Locale = 'es'): string {
  return formatDate(date, locale, { dateStyle: 'long', timeStyle: undefined });
}

/**
 * Format time only
 */
export function formatTime(date: Date | string | number, locale: Locale = 'es'): string {
  return formatDate(date, locale, { dateStyle: undefined, timeStyle: 'short' });
}

/**
 * Format currency (cents to formatted string)
 * @param cents - Amount in cents (e.g., 1050 = $10.50)
 * @param locale - Current locale
 */
export function formatCurrency(cents: number, locale: Locale = 'es'): string {
  const currency = locale === 'es' ? 'ARS' : 'USD';
  const amount = cents / 100;

  return new Intl.NumberFormat(
    locale === 'es' ? 'es-AR' : 'en-US',
    {
      style: 'currency',
      currency,
    }
  ).format(amount);
}

/**
 * Format a number with locale-specific formatting
 */
export function formatNumber(value: number, locale: Locale = 'es'): string {
  return new Intl.NumberFormat(
    locale === 'es' ? 'es-AR' : 'en-US'
  ).format(value);
}

/**
 * Format a number in compact notation (1K, 1M, etc.)
 */
export function formatCompactNumber(value: number, locale: Locale = 'es'): string {
  return new Intl.NumberFormat(
    locale === 'es' ? 'es-AR' : 'en-US',
    {
      notation: 'compact',
      compactDisplay: 'short',
    }
  ).format(value);
}

/**
 * Format a percentage
 */
export function formatPercent(value: number, locale: Locale = 'es', decimals: number = 0): string {
  return new Intl.NumberFormat(
    locale === 'es' ? 'es-AR' : 'en-US',
    {
      style: 'percent',
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals,
    }
  ).format(value);
}

/**
 * Format relative time (e.g., "2 hours ago", "in 3 days")
 */
export function formatRelativeTime(
  date: Date | string | number,
  locale: Locale = 'es'
): string {
  const dateObj = typeof date === 'string' || typeof date === 'number' ? new Date(date) : date;
  const now = new Date();
  const diffMs = dateObj.getTime() - now.getTime();
  const diffSec = Math.round(diffMs / 1000);
  const diffMin = Math.round(diffSec / 60);
  const diffHour = Math.round(diffMin / 60);
  const diffDay = Math.round(diffHour / 24);

  const rtf = new Intl.RelativeTimeFormat(
    locale === 'es' ? 'es-AR' : 'en-US',
    { numeric: 'auto' }
  );

  if (Math.abs(diffSec) < 60) {
    return rtf.format(diffSec, 'second');
  } else if (Math.abs(diffMin) < 60) {
    return rtf.format(diffMin, 'minute');
  } else if (Math.abs(diffHour) < 24) {
    return rtf.format(diffHour, 'hour');
  } else {
    return rtf.format(diffDay, 'day');
  }
}

/**
 * Locale-aware string comparison for sorting
 */
export function localeCompare(a: string, b: string, locale: Locale = 'es'): number {
  return a.localeCompare(b, locale === 'es' ? 'es-AR' : 'en-US');
}

/**
 * Sort array of objects by a string property using locale-aware comparison
 */
export function sortByProperty<T>(
  array: T[],
  property: keyof T,
  locale: Locale = 'es',
  direction: 'asc' | 'desc' = 'asc'
): T[] {
  return [...array].sort((a, b) => {
    const aVal = String(a[property]);
    const bVal = String(b[property]);
    const comparison = localeCompare(aVal, bVal, locale);
    return direction === 'asc' ? comparison : -comparison;
  });
}
