/**
 * useSyncStatus Hook
 * React hook for managing sync queue state
 */

import { useState, useEffect, useCallback } from 'react';
import { syncManager, type QueueStats } from '@/lib/db/sync-manager';
import { useOnlineStatus } from './use-online-status';

export function useSyncStatus() {
  const isOnline = useOnlineStatus();
  const [stats, setStats] = useState<QueueStats>({
    total: 0,
    pending: 0,
    failed: 0,
    completed: 0,
    byPriority: { high: 0, medium: 0, low: 0 },
  });
  const [isSyncing, setIsSyncing] = useState(false);
  const [lastSyncAt, setLastSyncAt] = useState<Date | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Load stats
  const loadStats = useCallback(async () => {
    try {
      const newStats = await syncManager.getQueueStats();
      setStats(newStats);
    } catch (err) {
      console.error('Failed to load sync stats:', err);
    }
  }, []);

  // Manual sync trigger
  const sync = useCallback(async () => {
    if (!isOnline) {
      setError('Cannot sync while offline');
      return { success: 0, failed: 0, total: 0 };
    }

    setIsSyncing(true);
    setError(null);

    try {
      const result = await syncManager.syncAll();
      setLastSyncAt(new Date());
      await loadStats();
      return result;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Sync failed';
      setError(message);
      return { success: 0, failed: 0, total: 0 };
    } finally {
      setIsSyncing(false);
    }
  }, [isOnline, loadStats]);

  // Auto-sync when coming online
  useEffect(() => {
    if (isOnline && stats.pending > 0 && !isSyncing) {
      sync();
    }
  }, [isOnline]);

  // Load stats on mount and periodically
  useEffect(() => {
    loadStats();

    const interval = setInterval(loadStats, 30000); // Every 30 seconds
    return () => clearInterval(interval);
  }, [loadStats]);

  // Listen for visibility change to refresh stats
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        loadStats();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [loadStats]);

  return {
    stats,
    isSyncing,
    lastSyncAt,
    error,
    sync,
    refresh: loadStats,
  };
}
