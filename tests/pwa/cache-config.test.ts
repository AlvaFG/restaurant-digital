/**
 * Cache Configuration Tests
 * Tests for PWA cache configuration and utilities
 */

import { describe, it, expect } from 'vitest';
import {
  CACHE_NAMES,
  CACHE_EXPIRATION,
  CACHE_STRATEGIES,
  NETWORK_TIMEOUT_SECONDS,
  CACHE_BLACKLIST,
  shouldCache,
  getCacheName,
  getCacheExpiration,
} from '@/lib/pwa/cache-config';

describe('Cache Configuration', () => {
  describe('Constants', () => {
    it('should have all cache names defined', () => {
      expect(CACHE_NAMES.STATIC_ASSETS).toBe('static-assets-v1');
      expect(CACHE_NAMES.IMAGES).toBe('images-v1');
      expect(CACHE_NAMES.API_CACHE).toBe('supabase-api-v1');
      expect(CACHE_NAMES.PAGES).toBe('pages-v1');
    });

    it('should have expiration settings for all caches', () => {
      expect(CACHE_EXPIRATION.STATIC_ASSETS).toEqual({
        maxEntries: 60,
        maxAgeSeconds: 60 * 60 * 24 * 30,
      });
      expect(CACHE_EXPIRATION.IMAGES).toEqual({
        maxEntries: 100,
        maxAgeSeconds: 60 * 60 * 24 * 30,
      });
      expect(CACHE_EXPIRATION.API_CACHE).toEqual({
        maxEntries: 200,
        maxAgeSeconds: 60 * 60,
      });
    });

    it('should have correct cache strategies', () => {
      expect(CACHE_STRATEGIES.STATIC_ASSETS).toBe('CacheFirst');
      expect(CACHE_STRATEGIES.IMAGES).toBe('CacheFirst');
      expect(CACHE_STRATEGIES.API).toBe('NetworkFirst');
    });

    it('should have network timeout configured', () => {
      expect(NETWORK_TIMEOUT_SECONDS).toBe(3);
    });

    it('should have cache blacklist defined', () => {
      expect(CACHE_BLACKLIST).toContain('/api/auth/');
      expect(CACHE_BLACKLIST).toContain('/api/admin/');
      expect(CACHE_BLACKLIST).toContain('/api/webhook/');
    });
  });

  describe('shouldCache', () => {
    it('should allow caching of regular URLs', () => {
      expect(shouldCache('/dashboard')).toBe(true);
      expect(shouldCache('/api/orders')).toBe(true);
      expect(shouldCache('/static/image.png')).toBe(true);
    });

    it('should block caching of blacklisted URLs', () => {
      expect(shouldCache('/api/auth/login')).toBe(false);
      expect(shouldCache('/api/admin/users')).toBe(false);
      expect(shouldCache('/api/webhook/payment')).toBe(false);
    });
  });

  describe('getCacheName', () => {
    it('should return correct cache name', () => {
      expect(getCacheName('STATIC_ASSETS')).toBe('static-assets-v1');
      expect(getCacheName('IMAGES')).toBe('images-v1');
      expect(getCacheName('API_CACHE')).toBe('supabase-api-v1');
    });
  });

  describe('getCacheExpiration', () => {
    it('should return correct expiration settings', () => {
      const staticExpiration = getCacheExpiration('STATIC_ASSETS');
      expect(staticExpiration.maxEntries).toBe(60);
      expect(staticExpiration.maxAgeSeconds).toBe(60 * 60 * 24 * 30);

      const apiExpiration = getCacheExpiration('API_CACHE');
      expect(apiExpiration.maxEntries).toBe(200);
      expect(apiExpiration.maxAgeSeconds).toBe(60 * 60);
    });
  });
});
