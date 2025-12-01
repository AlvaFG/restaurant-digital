/**
 * API Cache Configuration
 * Handles caching strategies for Supabase API calls
 */

import { CACHE_NAMES, CACHE_EXPIRATION, NETWORK_TIMEOUT_SECONDS } from './cache-config';

export interface CacheOptions {
  cacheName: string;
  maxEntries: number;
  maxAgeSeconds: number;
  networkTimeoutSeconds?: number;
}

/**
 * Get cache configuration for Supabase API
 */
export function getSupabaseAPICacheConfig(): CacheOptions {
  return {
    cacheName: CACHE_NAMES.API_CACHE,
    maxEntries: CACHE_EXPIRATION.API_CACHE.maxEntries,
    maxAgeSeconds: CACHE_EXPIRATION.API_CACHE.maxAgeSeconds,
    networkTimeoutSeconds: NETWORK_TIMEOUT_SECONDS,
  };
}

/**
 * Check if a request is to Supabase API
 */
export function isSupabaseAPIRequest(url: string): boolean {
  return url.includes('.supabase.co');
}

/**
 * Check if an API request should be cached
 * Some requests like auth tokens should never be cached
 */
export function shouldCacheAPIRequest(url: string, method: string = 'GET'): boolean {
  // Only cache GET requests
  if (method !== 'GET') return false;

  // Don't cache auth endpoints
  if (url.includes('/auth/')) return false;

  // Don't cache real-time subscriptions
  if (url.includes('/realtime/')) return false;

  return true;
}

/**
 * Get cache key for an API request
 */
export function getAPICacheKey(url: string, params?: Record<string, any>): string {
  const urlObj = new URL(url);
  const baseKey = urlObj.pathname;
  
  if (params) {
    const sortedParams = Object.keys(params)
      .sort()
      .map(key => `${key}=${params[key]}`)
      .join('&');
    return `${baseKey}?${sortedParams}`;
  }
  
  return baseKey;
}

/**
 * Invalidate API cache for a specific pattern
 */
export async function invalidateAPICache(pattern: string): Promise<void> {
  if (!('caches' in window)) return;

  const cache = await caches.open(CACHE_NAMES.API_CACHE);
  const requests = await cache.keys();

  const deletePromises = requests
    .filter(request => request.url.includes(pattern))
    .map(request => cache.delete(request));

  await Promise.all(deletePromises);
  console.log(`🗑️ Invalidated API cache for pattern: ${pattern}`);
}

/**
 * Clear all API cache
 */
export async function clearAPICache(): Promise<void> {
  if (!('caches' in window)) return;

  try {
    await caches.delete(CACHE_NAMES.API_CACHE);
    console.log('🗑️ API cache cleared');
  } catch (error) {
    console.error('Error clearing API cache:', error);
  }
}

/**
 * Get cache statistics
 */
export async function getCacheStats(): Promise<{
  name: string;
  entries: number;
  size: number;
} | null> {
  if (!('caches' in window)) return null;

  try {
    const cache = await caches.open(CACHE_NAMES.API_CACHE);
    const requests = await cache.keys();
    
    let totalSize = 0;
    for (const request of requests) {
      const response = await cache.match(request);
      if (response) {
        const blob = await response.blob();
        totalSize += blob.size;
      }
    }

    return {
      name: CACHE_NAMES.API_CACHE,
      entries: requests.length,
      size: totalSize,
    };
  } catch (error) {
    console.error('Error getting cache stats:', error);
    return null;
  }
}
