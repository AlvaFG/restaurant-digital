/**
 * PWA Module Exports
 * Central export point for all PWA functionality
 */

// Service Worker registration
export {
  usePWA,
  isPWASupported,
  getSWRegistration,
  updateServiceWorker,
} from './sw-register';

// Cache configuration
export {
  CACHE_NAMES,
  CACHE_EXPIRATION,
  CACHE_STRATEGIES,
  NETWORK_TIMEOUT_SECONDS,
  CACHE_BLACKLIST,
  shouldCache,
  getCacheName,
  getCacheExpiration,
} from './cache-config';

// API Cache utilities
export {
  getSupabaseAPICacheConfig,
  isSupabaseAPIRequest,
  shouldCacheAPIRequest,
  getAPICacheKey,
  invalidateAPICache,
  clearAPICache,
  getCacheStats,
} from './api-cache';

export type { CacheOptions } from './api-cache';
