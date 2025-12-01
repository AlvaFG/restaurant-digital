/**
 * PWA Cache Configuration
 * Defines caching strategies and settings for Service Worker
 */

export const CACHE_NAMES = {
  STATIC_ASSETS: 'static-assets-v1',
  IMAGES: 'images-v1',
  API_CACHE: 'supabase-api-v1',
  PAGES: 'pages-v1',
} as const;

export const CACHE_EXPIRATION = {
  STATIC_ASSETS: {
    maxEntries: 60,
    maxAgeSeconds: 60 * 60 * 24 * 30, // 30 days
  },
  IMAGES: {
    maxEntries: 100,
    maxAgeSeconds: 60 * 60 * 24 * 30, // 30 days
  },
  API_CACHE: {
    maxEntries: 200,
    maxAgeSeconds: 60 * 60, // 1 hour
  },
  PAGES: {
    maxEntries: 50,
    maxAgeSeconds: 60 * 60 * 24, // 1 day
  },
} as const;

export const CACHE_STRATEGIES = {
  STATIC_ASSETS: 'CacheFirst',
  IMAGES: 'CacheFirst',
  API: 'NetworkFirst',
  PAGES: 'NetworkFirst',
} as const;

export const NETWORK_TIMEOUT_SECONDS = 3;

/**
 * URLs that should never be cached
 */
export const CACHE_BLACKLIST = [
  '/api/auth/',
  '/api/admin/',
  '/api/webhook/',
] as const;

/**
 * Check if a URL should be cached
 */
export function shouldCache(url: string): boolean {
  return !CACHE_BLACKLIST.some((pattern) => url.includes(pattern));
}

/**
 * Get cache name for a given resource type
 */
export function getCacheName(type: keyof typeof CACHE_NAMES): string {
  return CACHE_NAMES[type];
}

/**
 * Get expiration settings for a given cache
 */
export function getCacheExpiration(type: keyof typeof CACHE_EXPIRATION) {
  return CACHE_EXPIRATION[type];
}
