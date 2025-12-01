/**
 * API Cache Tests
 * Tests for API caching utilities
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  getSupabaseAPICacheConfig,
  isSupabaseAPIRequest,
  shouldCacheAPIRequest,
  getAPICacheKey,
} from '@/lib/pwa/api-cache';

describe('API Cache Utilities', () => {
  describe('getSupabaseAPICacheConfig', () => {
    it('should return correct cache configuration', () => {
      const config = getSupabaseAPICacheConfig();
      
      expect(config.cacheName).toBe('supabase-api-v1');
      expect(config.maxEntries).toBe(200);
      expect(config.maxAgeSeconds).toBe(60 * 60);
      expect(config.networkTimeoutSeconds).toBe(3);
    });
  });

  describe('isSupabaseAPIRequest', () => {
    it('should identify Supabase API requests', () => {
      expect(isSupabaseAPIRequest('https://abc.supabase.co/rest/v1/orders')).toBe(true);
      expect(isSupabaseAPIRequest('https://xyz.supabase.co/auth/v1/token')).toBe(true);
    });

    it('should reject non-Supabase URLs', () => {
      expect(isSupabaseAPIRequest('https://example.com/api')).toBe(false);
      expect(isSupabaseAPIRequest('http://localhost:3000/api')).toBe(false);
    });
  });

  describe('shouldCacheAPIRequest', () => {
    it('should allow caching GET requests', () => {
      expect(shouldCacheAPIRequest('/rest/v1/orders', 'GET')).toBe(true);
      expect(shouldCacheAPIRequest('/rest/v1/menu', 'GET')).toBe(true);
    });

    it('should not cache non-GET requests', () => {
      expect(shouldCacheAPIRequest('/rest/v1/orders', 'POST')).toBe(false);
      expect(shouldCacheAPIRequest('/rest/v1/orders', 'PUT')).toBe(false);
      expect(shouldCacheAPIRequest('/rest/v1/orders', 'DELETE')).toBe(false);
    });

    it('should not cache auth endpoints', () => {
      expect(shouldCacheAPIRequest('/auth/v1/token', 'GET')).toBe(false);
      expect(shouldCacheAPIRequest('/auth/v1/user', 'GET')).toBe(false);
    });

    it('should not cache realtime subscriptions', () => {
      expect(shouldCacheAPIRequest('/realtime/v1/websocket', 'GET')).toBe(false);
    });
  });

  describe('getAPICacheKey', () => {
    it('should generate cache key from URL', () => {
      const url = 'https://example.supabase.co/rest/v1/orders';
      const key = getAPICacheKey(url);
      
      expect(key).toBe('/rest/v1/orders');
    });

    it('should include sorted parameters in cache key', () => {
      const url = 'https://example.supabase.co/rest/v1/orders';
      const params = { status: 'pending', limit: 10 };
      const key = getAPICacheKey(url, params);
      
      expect(key).toBe('/rest/v1/orders?limit=10&status=pending');
    });

    it('should sort parameters consistently', () => {
      const url = 'https://example.supabase.co/rest/v1/orders';
      const params1 = { z: 'last', a: 'first', m: 'middle' };
      const params2 = { a: 'first', m: 'middle', z: 'last' };
      
      const key1 = getAPICacheKey(url, params1);
      const key2 = getAPICacheKey(url, params2);
      
      expect(key1).toBe(key2);
    });
  });
});
