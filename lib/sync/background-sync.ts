/**
 * Background Sync API
 * Handles automatic synchronization in the background
 */

'use client';

import { processSyncQueue, getSyncQueueStats } from './sync-queue';

/**
 * Register background sync
 * This will be triggered automatically by the Service Worker when:
 * 1. User comes back online
 * 2. Browser has idle time
 * 3. On periodic intervals
 */
export async function registerBackgroundSync(): Promise<boolean> {
  if (!('serviceWorker' in navigator) || !('SyncManager' in window)) {
    console.warn('⚠️ Background Sync API not supported');
    return false;
  }

  try {
    const registration = await navigator.serviceWorker.ready;
    
    // @ts-ignore - SyncManager types might not be available
    await registration.sync.register('sync-operations');
    
    console.log('✅ Background sync registered');
    return true;
  } catch (error) {
    console.error('❌ Failed to register background sync:', error);
    return false;
  }
}

/**
 * Check if background sync is supported
 */
export function isBackgroundSyncSupported(): boolean {
  return (
    typeof window !== 'undefined' &&
    'serviceWorker' in navigator &&
    'SyncManager' in window
  );
}

/**
 * Manually trigger sync
 * Useful for "sync now" buttons
 */
export async function triggerManualSync(): Promise<{
  success: boolean;
  processed: number;
  succeeded: number;
  failed: number;
}> {
  console.log('🔄 Manually triggering sync...');
  
  try {
    const result = await processSyncQueue();
    console.log('✅ Manual sync completed:', result);
    
    return {
      success: true,
      ...result,
    };
  } catch (error) {
    console.error('❌ Manual sync failed:', error);
    return {
      success: false,
      processed: 0,
      succeeded: 0,
      failed: 0,
    };
  }
}

/**
 * Schedule periodic sync check
 * Checks sync queue status every X minutes
 */
export function startPeriodicSync(intervalMinutes: number = 5): NodeJS.Timeout {
  console.log(`⏰ Starting periodic sync every ${intervalMinutes} minutes`);
  
  const intervalMs = intervalMinutes * 60 * 1000;
  
  const intervalId = setInterval(async () => {
    console.log('⏰ Periodic sync check...');
    
    const stats = await getSyncQueueStats();
    
    if (stats.pending > 0) {
      console.log(`📊 ${stats.pending} operations pending, triggering sync...`);
      await processSyncQueue();
    } else {
      console.log('✅ No pending operations');
    }
  }, intervalMs);
  
  return intervalId;
}

/**
 * Stop periodic sync
 */
export function stopPeriodicSync(intervalId: NodeJS.Timeout): void {
  clearInterval(intervalId);
  console.log('⏸️ Periodic sync stopped');
}

/**
 * Listen for online events and trigger sync
 */
export function setupAutoSyncOnOnline(): void {
  if (typeof window === 'undefined') return;
  
  const handleOnline = async () => {
    console.log('🟢 Back online - triggering sync...');
    
    // Small delay to let network stabilize
    setTimeout(async () => {
      await processSyncQueue();
      
      // Also register background sync for future
      await registerBackgroundSync();
    }, 1000);
  };
  
  window.addEventListener('online', handleOnline);
  console.log('✅ Auto-sync on online event registered');
}

/**
 * Initialize background sync system
 */
export async function initBackgroundSync(): Promise<void> {
  console.log('🚀 Initializing background sync...');
  
  // Setup auto-sync on online
  setupAutoSyncOnOnline();
  
  // Register background sync if supported
  if (isBackgroundSyncSupported()) {
    await registerBackgroundSync();
  } else {
    console.warn('⚠️ Background Sync API not available, using polling fallback');
  }
  
  // Start periodic sync as fallback
  // Store interval ID globally if needed to stop later
  if (typeof window !== 'undefined') {
    (window as any).__syncIntervalId = startPeriodicSync(5);
  }
  
  console.log('✅ Background sync initialized');
}

/**
 * Cleanup background sync
 */
export function cleanupBackgroundSync(): void {
  if (typeof window !== 'undefined' && (window as any).__syncIntervalId) {
    stopPeriodicSync((window as any).__syncIntervalId);
    delete (window as any).__syncIntervalId;
  }
}
