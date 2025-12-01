/**
 * Tests for Sync Manager
 * Tests sync queue, priorities, retries, and conflict resolution
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { SyncManager } from '@/lib/db/sync-manager';
import { db } from '@/lib/db';
import type { SyncQueueItem } from '@/lib/db';

// Mock Supabase client
vi.mock('@/lib/supabase/client', () => ({
  supabase: {
    from: vi.fn(() => ({
      insert: vi.fn().mockResolvedValue({ data: {}, error: null }),
      update: vi.fn().mockResolvedValue({ data: {}, error: null }),
      delete: vi.fn().mockResolvedValue({ data: {}, error: null }),
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({ data: {}, error: null }),
    })),
  },
}));

describe('SyncManager', () => {
  let syncManager: SyncManager;

  beforeEach(async () => {
    syncManager = new SyncManager();
    // Clear database before each test
    await db.sync_queue.clear();
    await db.conflict_log.clear();
  });

  afterEach(async () => {
    await db.sync_queue.clear();
    await db.conflict_log.clear();
  });

  describe('Queue Management', () => {
    it('should add item to sync queue', async () => {
      await syncManager.addToQueue({
        operation: 'create',
        table: 'orders',
        data: { id: '1', name: 'Test Order' },
        priority: 'high',
      });

      const items = await db.sync_queue.toArray();
      expect(items).toHaveLength(1);
      expect(items[0].operation).toBe('create');
      expect(items[0].priority).toBe('high');
      expect(items[0].status).toBe('pending');
    });

    it('should prioritize high priority items', async () => {
      await syncManager.addToQueue({
        operation: 'create',
        table: 'orders',
        data: { id: '1' },
        priority: 'low',
      });

      await syncManager.addToQueue({
        operation: 'create',
        table: 'orders',
        data: { id: '2' },
        priority: 'high',
      });

      await syncManager.addToQueue({
        operation: 'create',
        table: 'orders',
        data: { id: '3' },
        priority: 'medium',
      });

      const items = await syncManager.getPendingItems();
      expect(items[0].priority).toBe('high');
      expect(items[1].priority).toBe('medium');
      expect(items[2].priority).toBe('low');
    });

    it('should get pending items sorted by priority and timestamp', async () => {
      const now = Date.now();

      await db.sync_queue.add({
        operation: 'create',
        table: 'orders',
        data: { id: '1' },
        timestamp: now - 1000,
        retries: 0,
        priority: 'medium',
        status: 'pending',
      });

      await db.sync_queue.add({
        operation: 'create',
        table: 'orders',
        data: { id: '2' },
        timestamp: now,
        retries: 0,
        priority: 'high',
        status: 'pending',
      });

      const items = await syncManager.getPendingItems();
      expect(items[0].priority).toBe('high');
      expect(items[0].data.id).toBe('2');
    });

    it('should exclude failed items with max retries', async () => {
      await db.sync_queue.add({
        operation: 'create',
        table: 'orders',
        data: { id: '1' },
        timestamp: Date.now(),
        retries: 5, // max retries exceeded
        priority: 'high',
        status: 'failed',
      });

      const items = await syncManager.getPendingItems();
      expect(items).toHaveLength(0);
    });
  });

  describe('Sync Operations', () => {
    it('should sync create operation', async () => {
      const item: SyncQueueItem = {
        id: 1,
        operation: 'create',
        table: 'orders',
        data: { id: '1', name: 'Test', status: 'pending' },
        timestamp: Date.now(),
        retries: 0,
        priority: 'high',
        status: 'pending',
      };

      await db.sync_queue.add(item);

      const result = await syncManager.syncItem(item);
      expect(result).toBe(true);

      // Item should be removed from queue
      const remaining = await db.sync_queue.toArray();
      expect(remaining).toHaveLength(0);
    });

    it('should sync update operation', async () => {
      const item: SyncQueueItem = {
        id: 1,
        operation: 'update',
        table: 'orders',
        data: { id: '1', status: 'completed' },
        timestamp: Date.now(),
        retries: 0,
        priority: 'medium',
        status: 'pending',
      };

      await db.sync_queue.add(item);

      const result = await syncManager.syncItem(item);
      expect(result).toBe(true);
    });

    it('should sync delete operation', async () => {
      const item: SyncQueueItem = {
        id: 1,
        operation: 'delete',
        table: 'orders',
        data: { id: '1' },
        timestamp: Date.now(),
        retries: 0,
        priority: 'low',
        status: 'pending',
      };

      await db.sync_queue.add(item);

      const result = await syncManager.syncItem(item);
      expect(result).toBe(true);
    });

    it('should handle sync failure and increment retries', async () => {
      // Mock Supabase to fail
      const { supabase } = await import('@/lib/supabase/client');
      vi.mocked(supabase.from).mockReturnValue({
        insert: vi.fn().mockResolvedValue({ data: null, error: { message: 'Network error' } }),
      } as any);

      const item: SyncQueueItem = {
        id: 1,
        operation: 'create',
        table: 'orders',
        data: { id: '1' },
        timestamp: Date.now(),
        retries: 0,
        priority: 'high',
        status: 'pending',
      };

      await db.sync_queue.add(item);

      const result = await syncManager.syncItem(item);
      expect(result).toBe(false);

      // Check retries incremented
      const updated = await db.sync_queue.get(1);
      expect(updated?.retries).toBe(1);
      expect(updated?.status).toBe('failed');
    });

    it('should mark as permanently failed after max retries', async () => {
      const { supabase } = await import('@/lib/supabase/client');
      vi.mocked(supabase.from).mockReturnValue({
        insert: vi.fn().mockResolvedValue({ data: null, error: { message: 'Error' } }),
      } as any);

      const item: SyncQueueItem = {
        id: 1,
        operation: 'create',
        table: 'orders',
        data: { id: '1' },
        timestamp: Date.now(),
        retries: 4, // One more will hit max (5)
        priority: 'high',
        status: 'pending',
      };

      await db.sync_queue.add(item);

      const result = await syncManager.syncItem(item);
      expect(result).toBe(false);

      const updated = await db.sync_queue.get(1);
      expect(updated?.retries).toBe(5);
      expect(updated?.status).toBe('failed');
    });
  });

  describe('Batch Sync', () => {
    it('should sync all pending items', async () => {
      await db.sync_queue.bulkAdd([
        {
          operation: 'create',
          table: 'orders',
          data: { id: '1' },
          timestamp: Date.now(),
          retries: 0,
          priority: 'high',
          status: 'pending',
        },
        {
          operation: 'update',
          table: 'orders',
          data: { id: '2', status: 'completed' },
          timestamp: Date.now(),
          retries: 0,
          priority: 'medium',
          status: 'pending',
        },
        {
          operation: 'delete',
          table: 'orders',
          data: { id: '3' },
          timestamp: Date.now(),
          retries: 0,
          priority: 'low',
          status: 'pending',
        },
      ]);

      const result = await syncManager.syncAll();
      
      expect(result.success).toBeGreaterThanOrEqual(0);
      expect(result.failed).toBeGreaterThanOrEqual(0);
      expect(result.total).toBe(3);
    });

    it('should sync items in priority order', async () => {
      const syncedIds: string[] = [];

      // Mock to track order
      const { supabase } = await import('@/lib/supabase/client');
      vi.mocked(supabase.from).mockImplementation(() => ({
        insert: vi.fn().mockImplementation((data: any) => {
          syncedIds.push(data.id);
          return Promise.resolve({ data, error: null });
        }),
      } as any));

      await db.sync_queue.bulkAdd([
        {
          operation: 'create',
          table: 'orders',
          data: { id: 'low' },
          timestamp: Date.now() - 3000,
          retries: 0,
          priority: 'low',
          status: 'pending',
        },
        {
          operation: 'create',
          table: 'orders',
          data: { id: 'high' },
          timestamp: Date.now() - 2000,
          retries: 0,
          priority: 'high',
          status: 'pending',
        },
        {
          operation: 'create',
          table: 'orders',
          data: { id: 'medium' },
          timestamp: Date.now() - 1000,
          retries: 0,
          priority: 'medium',
          status: 'pending',
        },
      ]);

      await syncManager.syncAll();

      expect(syncedIds[0]).toBe('high');
      expect(syncedIds[1]).toBe('medium');
      expect(syncedIds[2]).toBe('low');
    });
  });

  describe('Conflict Detection', () => {
    it('should detect conflict when server data differs', async () => {
      const localData = {
        id: '1',
        name: 'Local Name',
        updated_at: '2024-11-03T10:00:00Z',
      };

      const serverData = {
        id: '1',
        name: 'Server Name',
        updated_at: '2024-11-03T11:00:00Z',
      };

      const hasConflict = syncManager.detectConflict(localData, serverData);
      expect(hasConflict).toBe(true);
    });

    it('should not detect conflict when data is same', async () => {
      const data = {
        id: '1',
        name: 'Same Name',
        updated_at: '2024-11-03T10:00:00Z',
      };

      const hasConflict = syncManager.detectConflict(data, data);
      expect(hasConflict).toBe(false);
    });

    it('should log conflict', async () => {
      await syncManager.logConflict(
        'orders',
        '1',
        { id: '1', name: 'Local' },
        { id: '1', name: 'Server' }
      );

      const conflicts = await db.conflict_log.toArray();
      expect(conflicts).toHaveLength(1);
      expect(conflicts[0].table).toBe('orders');
      expect(conflicts[0].record_id).toBe('1');
      expect(conflicts[0].status).toBe('pending');
    });
  });

  describe('Queue Statistics', () => {
    it('should get queue statistics', async () => {
      await db.sync_queue.bulkAdd([
        {
          operation: 'create',
          table: 'orders',
          data: { id: '1' },
          timestamp: Date.now(),
          retries: 0,
          priority: 'high',
          status: 'pending',
        },
        {
          operation: 'update',
          table: 'orders',
          data: { id: '2' },
          timestamp: Date.now(),
          retries: 2,
          priority: 'medium',
          status: 'failed',
        },
        {
          operation: 'create',
          table: 'orders',
          data: { id: '3' },
          timestamp: Date.now(),
          retries: 0,
          priority: 'low',
          status: 'completed',
        },
      ]);

      const stats = await syncManager.getQueueStats();

      expect(stats.total).toBe(3);
      expect(stats.pending).toBe(1);
      expect(stats.failed).toBe(1);
      expect(stats.completed).toBe(1);
      expect(stats.byPriority.high).toBe(1);
      expect(stats.byPriority.medium).toBe(1);
      expect(stats.byPriority.low).toBe(1);
    });

    it('should get oldest pending item age', async () => {
      const oldTimestamp = Date.now() - 60000; // 1 minute ago

      await db.sync_queue.add({
        operation: 'create',
        table: 'orders',
        data: { id: '1' },
        timestamp: oldTimestamp,
        retries: 0,
        priority: 'high',
        status: 'pending',
      });

      const stats = await syncManager.getQueueStats();
      expect(stats.oldestPendingAge).toBeGreaterThanOrEqual(59000);
      expect(stats.oldestPendingAge).toBeLessThanOrEqual(61000);
    });
  });

  describe('Queue Cleanup', () => {
    it('should remove completed items older than threshold', async () => {
      const oldTimestamp = Date.now() - (8 * 24 * 60 * 60 * 1000); // 8 days ago

      await db.sync_queue.bulkAdd([
        {
          operation: 'create',
          table: 'orders',
          data: { id: '1' },
          timestamp: oldTimestamp,
          retries: 0,
          priority: 'high',
          status: 'completed',
        },
        {
          operation: 'create',
          table: 'orders',
          data: { id: '2' },
          timestamp: Date.now(),
          retries: 0,
          priority: 'high',
          status: 'completed',
        },
      ]);

      await syncManager.cleanupQueue(7); // Remove older than 7 days

      const items = await db.sync_queue.toArray();
      expect(items).toHaveLength(1);
      expect(items[0].data.id).toBe('2');
    });

    it('should not remove pending or failed items', async () => {
      const oldTimestamp = Date.now() - (8 * 24 * 60 * 60 * 1000);

      await db.sync_queue.bulkAdd([
        {
          operation: 'create',
          table: 'orders',
          data: { id: '1' },
          timestamp: oldTimestamp,
          retries: 0,
          priority: 'high',
          status: 'pending',
        },
        {
          operation: 'create',
          table: 'orders',
          data: { id: '2' },
          timestamp: oldTimestamp,
          retries: 3,
          priority: 'high',
          status: 'failed',
        },
      ]);

      await syncManager.cleanupQueue(7);

      const items = await db.sync_queue.toArray();
      expect(items).toHaveLength(2);
    });
  });

  describe('Retry Logic', () => {
    it('should calculate exponential backoff delay', () => {
      expect(syncManager.getRetryDelay(0)).toBe(1000); // 1s
      expect(syncManager.getRetryDelay(1)).toBe(2000); // 2s
      expect(syncManager.getRetryDelay(2)).toBe(4000); // 4s
      expect(syncManager.getRetryDelay(3)).toBe(8000); // 8s
      expect(syncManager.getRetryDelay(4)).toBe(16000); // 16s
    });

    it('should cap retry delay at maximum', () => {
      expect(syncManager.getRetryDelay(10)).toBeLessThanOrEqual(60000); // Max 60s
    });

    it('should respect retry delay before next attempt', async () => {
      const item: SyncQueueItem = {
        id: 1,
        operation: 'create',
        table: 'orders',
        data: { id: '1' },
        timestamp: Date.now() - 500, // Recent failure
        retries: 1,
        priority: 'high',
        status: 'failed',
        lastRetryAt: Date.now() - 500,
      };

      await db.sync_queue.add(item);

      // Should not retry yet (needs 2000ms for retry 1)
      const canRetry = await syncManager.canRetry(item);
      expect(canRetry).toBe(false);
    });

    it('should allow retry after delay has passed', async () => {
      const item: SyncQueueItem = {
        id: 1,
        operation: 'create',
        table: 'orders',
        data: { id: '1' },
        timestamp: Date.now() - 3000,
        retries: 1,
        priority: 'high',
        status: 'failed',
        lastRetryAt: Date.now() - 3000, // 3s ago, delay is 2s
      };

      const canRetry = await syncManager.canRetry(item);
      expect(canRetry).toBe(true);
    });
  });
});
