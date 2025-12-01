/**
 * Sync Manager
 * Handles synchronization queue and conflict resolution
 */

import Dexie, { Table } from 'dexie';
import { createBrowserClient } from '@/lib/supabase/client';

// Types
export interface SyncQueueItem {
  id?: number;
  operation: 'create' | 'update' | 'delete';
  table: 'orders' | 'tables' | 'menu';
  data: any;
  timestamp: number;
  retries: number;
  priority: 'high' | 'medium' | 'low';
  status: 'pending' | 'syncing' | 'failed' | 'completed';
  lastRetryAt?: number;
  error?: string;
}

export interface ConflictLog {
  id?: number;
  table: string;
  record_id: string;
  local_data: any;
  server_data: any;
  timestamp: number;
  status: 'pending' | 'resolved' | 'ignored';
  resolution_strategy?: 'last-write-wins' | 'server-wins' | 'client-wins' | 'manual';
}

export interface QueueStats {
  total: number;
  pending: number;
  failed: number;
  completed: number;
  byPriority: {
    high: number;
    medium: number;
    low: number;
  };
  oldestPendingAge?: number;
}

// Database Schema
class SyncDatabase extends Dexie {
  sync_queue!: Table<SyncQueueItem, number>;
  conflict_log!: Table<ConflictLog, number>;

  constructor() {
    super('RestaurantSyncDB');
    
    this.version(1).stores({
      sync_queue: '++id, status, priority, timestamp, table',
      conflict_log: '++id, status, timestamp, table, record_id',
    });
  }
}

export const db = new SyncDatabase();

// Priority weights for sorting
const PRIORITY_WEIGHTS = {
  high: 3,
  medium: 2,
  low: 1,
};

const MAX_RETRIES = 5;
const BASE_RETRY_DELAY = 1000; // 1 second
const MAX_RETRY_DELAY = 60000; // 60 seconds

export class SyncManager {
  private supabase = createBrowserClient();

  /**
   * Add item to sync queue
   */
  async addToQueue(item: Omit<SyncQueueItem, 'id' | 'timestamp' | 'retries' | 'status'>): Promise<number> {
    const queueItem: SyncQueueItem = {
      ...item,
      timestamp: Date.now(),
      retries: 0,
      status: 'pending',
    };

    return await db.sync_queue.add(queueItem);
  }

  /**
   * Get pending items sorted by priority and timestamp
   */
  async getPendingItems(): Promise<SyncQueueItem[]> {
    const items = await db.sync_queue
      .where('status')
      .anyOf(['pending', 'failed'])
      .filter(item => item.retries < MAX_RETRIES)
      .toArray();

    // Sort by priority (high to low) then by timestamp (old to new)
    return items.sort((a, b) => {
      const priorityDiff = PRIORITY_WEIGHTS[b.priority] - PRIORITY_WEIGHTS[a.priority];
      if (priorityDiff !== 0) return priorityDiff;
      return a.timestamp - b.timestamp;
    });
  }

  /**
   * Sync single item
   */
  async syncItem(item: SyncQueueItem): Promise<boolean> {
    try {
      // Update status to syncing
      await db.sync_queue.update(item.id!, { status: 'syncing' });

      let result: any;

      switch (item.operation) {
        case 'create':
          result = await this.supabase
            .from(item.table)
            .insert(item.data);
          break;

        case 'update':
          result = await this.supabase
            .from(item.table)
            .update(item.data)
            .eq('id', item.data.id);
          break;

        case 'delete':
          result = await this.supabase
            .from(item.table)
            .delete()
            .eq('id', item.data.id);
          break;
      }

      if (result.error) {
        throw result.error;
      }

      // Success - remove from queue
      await db.sync_queue.delete(item.id!);
      return true;

    } catch (error) {
      // Failure - increment retries
      const retries = item.retries + 1;
      const status = retries >= MAX_RETRIES ? 'failed' : 'failed';

      await db.sync_queue.update(item.id!, {
        retries,
        status,
        lastRetryAt: Date.now(),
        error: error instanceof Error ? error.message : String(error),
      });

      return false;
    }
  }

  /**
   * Sync all pending items
   */
  async syncAll(): Promise<{ success: number; failed: number; total: number }> {
    const items = await this.getPendingItems();
    let success = 0;
    let failed = 0;

    for (const item of items) {
      // Check if enough time has passed for retry
      if (item.status === 'failed' && item.lastRetryAt) {
        const canRetry = await this.canRetry(item);
        if (!canRetry) continue;
      }

      const result = await this.syncItem(item);
      if (result) {
        success++;
      } else {
        failed++;
      }
    }

    return { success, failed, total: items.length };
  }

  /**
   * Check if item can be retried based on exponential backoff
   */
  async canRetry(item: SyncQueueItem): Promise<boolean> {
    if (!item.lastRetryAt) return true;

    const delay = this.getRetryDelay(item.retries);
    const timeSinceLastRetry = Date.now() - item.lastRetryAt;

    return timeSinceLastRetry >= delay;
  }

  /**
   * Get retry delay based on exponential backoff
   */
  getRetryDelay(retries: number): number {
    const delay = BASE_RETRY_DELAY * Math.pow(2, retries);
    return Math.min(delay, MAX_RETRY_DELAY);
  }

  /**
   * Detect if there's a conflict between local and server data
   */
  detectConflict(localData: any, serverData: any): boolean {
    // Simple conflict detection: compare updated_at timestamps
    if (localData.updated_at && serverData.updated_at) {
      return localData.updated_at !== serverData.updated_at;
    }

    // If no timestamps, compare data (exclude metadata fields)
    const localCopy = { ...localData };
    const serverCopy = { ...serverData };
    
    delete localCopy.updated_at;
    delete localCopy.created_at;
    delete serverCopy.updated_at;
    delete serverCopy.created_at;

    return JSON.stringify(localCopy) !== JSON.stringify(serverCopy);
  }

  /**
   * Log conflict for manual resolution
   */
  async logConflict(
    table: string,
    recordId: string,
    localData: any,
    serverData: any
  ): Promise<number> {
    return await db.conflict_log.add({
      table,
      record_id: recordId,
      local_data: localData,
      server_data: serverData,
      timestamp: Date.now(),
      status: 'pending',
    });
  }

  /**
   * Get queue statistics
   */
  async getQueueStats(): Promise<QueueStats> {
    const allItems = await db.sync_queue.toArray();

    const stats: QueueStats = {
      total: allItems.length,
      pending: 0,
      failed: 0,
      completed: 0,
      byPriority: {
        high: 0,
        medium: 0,
        low: 0,
      },
    };

    let oldestPendingTimestamp: number | undefined;

    for (const item of allItems) {
      // Count by status
      if (item.status === 'pending') {
        stats.pending++;
        if (!oldestPendingTimestamp || item.timestamp < oldestPendingTimestamp) {
          oldestPendingTimestamp = item.timestamp;
        }
      } else if (item.status === 'failed') {
        stats.failed++;
      } else if (item.status === 'completed') {
        stats.completed++;
      }

      // Count by priority
      stats.byPriority[item.priority]++;
    }

    if (oldestPendingTimestamp) {
      stats.oldestPendingAge = Date.now() - oldestPendingTimestamp;
    }

    return stats;
  }

  /**
   * Clean up old completed items
   */
  async cleanupQueue(daysOld: number = 7): Promise<number> {
    const threshold = Date.now() - (daysOld * 24 * 60 * 60 * 1000);

    const itemsToDelete = await db.sync_queue
      .where('status')
      .equals('completed')
      .and(item => item.timestamp < threshold)
      .toArray();

    if (itemsToDelete.length > 0) {
      const ids = itemsToDelete.map(item => item.id!);
      await db.sync_queue.bulkDelete(ids);
    }

    return itemsToDelete.length;
  }

  /**
   * Get pending conflicts
   */
  async getPendingConflicts(): Promise<ConflictLog[]> {
    return await db.conflict_log
      .where('status')
      .equals('pending')
      .toArray();
  }

  /**
   * Resolve conflict
   */
  async resolveConflict(
    conflictId: number,
    strategy: 'last-write-wins' | 'server-wins' | 'client-wins' | 'manual',
    resolvedData?: any
  ): Promise<void> {
    const conflict = await db.conflict_log.get(conflictId);
    if (!conflict) throw new Error('Conflict not found');

    let dataToSync: any;

    switch (strategy) {
      case 'server-wins':
        dataToSync = conflict.server_data;
        break;

      case 'client-wins':
        dataToSync = conflict.local_data;
        break;

      case 'last-write-wins':
        const localTime = new Date(conflict.local_data.updated_at).getTime();
        const serverTime = new Date(conflict.server_data.updated_at).getTime();
        dataToSync = localTime > serverTime ? conflict.local_data : conflict.server_data;
        break;

      case 'manual':
        if (!resolvedData) throw new Error('Manual resolution requires resolved data');
        dataToSync = resolvedData;
        break;
    }

    // Update server with resolved data
    await this.supabase
      .from(conflict.table)
      .update(dataToSync)
      .eq('id', conflict.record_id);

    // Mark conflict as resolved
    await db.conflict_log.update(conflictId, {
      status: 'resolved',
      resolution_strategy: strategy,
    });
  }

  /**
   * Clear all sync data (for testing/reset)
   */
  async clearAll(): Promise<void> {
    await db.sync_queue.clear();
    await db.conflict_log.clear();
  }
}

// Singleton instance
export const syncManager = new SyncManager();
