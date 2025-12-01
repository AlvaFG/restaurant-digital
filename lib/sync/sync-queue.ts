/**
 * Sync Queue Manager
 * Manages the queue of operations to be synchronized
 */

import { localDB } from '@/lib/db/local-db';
import type { SyncOperation } from '@/lib/db/local-db';
import {
  type SyncOperationType,
  type SyncEntityType,
  getOperationPriority,
  shouldRetryOperation,
  getRetryDelay,
  validateOperationPayload,
  SyncPriority,
} from './sync-operations';
import { checkOnlineStatus } from '@/hooks/use-online-status';

/**
 * Add an operation to the sync queue
 */
export async function addToSyncQueue(
  type: SyncOperationType,
  entityType: SyncEntityType,
  entityId: string,
  payload: any
): Promise<number | undefined> {
  // Validate payload
  const validation = validateOperationPayload(type, payload);
  if (!validation.valid) {
    console.error('❌ Invalid operation payload:', validation.error);
    throw new Error(validation.error);
  }

  const operation: Omit<SyncOperation, 'id'> = {
    type,
    entityType,
    entityId,
    payload,
    status: 'pending',
    retryCount: 0,
    createdAt: new Date(),
  };

  try {
    const id = await localDB.syncQueue.add(operation as SyncOperation);
    console.log(`📝 Operation added to sync queue: ${type} (ID: ${id})`);
    
    // Try to sync immediately if online
    if (checkOnlineStatus()) {
      // Don't await - fire and forget
      processSyncQueue().catch(console.error);
    }
    
    return id;
  } catch (error) {
    console.error('❌ Failed to add operation to sync queue:', error);
    throw error;
  }
}

/**
 * Get all pending operations
 */
export async function getPendingOperations(): Promise<SyncOperation[]> {
  return await localDB.syncQueue
    .where('status')
    .equals('pending')
    .sortBy('createdAt');
}

/**
 * Get operations by priority
 */
export async function getOperationsByPriority(
  priority: SyncPriority
): Promise<SyncOperation[]> {
  const operations = await getPendingOperations();
  return operations.filter(op => getOperationPriority(op.type) === priority);
}

/**
 * Update operation status
 */
export async function updateOperationStatus(
  operationId: number,
  status: 'processing' | 'completed' | 'failed',
  error?: string
): Promise<void> {
  const updates: Partial<SyncOperation> = { status };
  
  if (error) {
    updates.error = error;
  }
  
  if (status === 'failed') {
    const operation = await localDB.syncQueue.get(operationId);
    if (operation) {
      updates.retryCount = operation.retryCount + 1;
      updates.lastRetryAt = new Date();
    }
  }
  
  await localDB.syncQueue.update(operationId, updates);
}

/**
 * Process the sync queue
 */
export async function processSyncQueue(): Promise<{
  processed: number;
  succeeded: number;
  failed: number;
}> {
  if (!checkOnlineStatus()) {
    console.log('⏸️ Offline - skipping sync queue processing');
    return { processed: 0, succeeded: 0, failed: 0 };
  }

  console.log('🔄 Processing sync queue...');
  
  const operations = await getPendingOperations();
  
  if (operations.length === 0) {
    console.log('✅ Sync queue is empty');
    return { processed: 0, succeeded: 0, failed: 0 };
  }
  
  console.log(`📊 Processing ${operations.length} operations...`);
  
  // Sort by priority
  operations.sort((a, b) => {
    const priorityA = getOperationPriority(a.type);
    const priorityB = getOperationPriority(b.type);
    return priorityB - priorityA; // Higher priority first
  });
  
  let succeeded = 0;
  let failed = 0;
  
  for (const operation of operations) {
    if (!operation.id) continue;
    
    try {
      // Check if should retry
      if (operation.retryCount > 0) {
        const shouldRetry = shouldRetryOperation(
          operation.retryCount,
          5, // max retries
          operation.error
        );
        
        if (!shouldRetry) {
          console.log(`⏭️ Skipping operation ${operation.id} - max retries reached`);
          continue;
        }
        
        // Wait for retry delay
        const delay = getRetryDelay(operation.retryCount);
        const timeSinceLastRetry = operation.lastRetryAt
          ? Date.now() - operation.lastRetryAt.getTime()
          : Infinity;
        
        if (timeSinceLastRetry < delay) {
          console.log(`⏸️ Operation ${operation.id} waiting for retry delay`);
          continue;
        }
      }
      
      // Mark as processing
      await updateOperationStatus(operation.id, 'processing');
      
      // Execute the operation
      await executeOperation(operation);
      
      // Mark as completed
      await updateOperationStatus(operation.id, 'completed');
      succeeded++;
      
      console.log(`✅ Operation ${operation.id} completed: ${operation.type}`);
    } catch (error) {
      failed++;
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      console.error(`❌ Operation ${operation.id} failed:`, errorMessage);
      
      await updateOperationStatus(operation.id, 'failed', errorMessage);
    }
  }
  
  console.log(`🎉 Sync queue processed: ${succeeded} succeeded, ${failed} failed`);
  
  return {
    processed: operations.length,
    succeeded,
    failed,
  };
}

/**
 * Execute a sync operation
 */
async function executeOperation(operation: SyncOperation): Promise<void> {
  const { type, payload } = operation;
  
  // Import dynamically to avoid circular dependencies
  const { createBrowserClient } = await import('@/lib/supabase/client');
  const supabase = createBrowserClient();
  
  switch (type) {
    case 'CREATE_ORDER': {
      // TODO: Implement based on actual schema
      // For now, just mark as completed
      console.log('📝 Would create order:', payload);
      break;
    }
    
    case 'UPDATE_TABLE_STATUS': {
      const { error } = await supabase
        .from('tables')
        .update({
          status: payload.status,
        })
        .eq('id', payload.tableId);
      
      if (error) throw error;
      
      // Update local record
      await localDB.restaurantTables.update(payload.tableId, {
        status: payload.status,
        synced: true,
      });
      break;
    }
    
    case 'CREATE_PAYMENT': {
      // TODO: Implement based on actual schema
      console.log('💳 Would create payment:', payload);
      break;
    }
    
    case 'UPDATE_ORDER_STATUS': {
      // TODO: Implement based on actual schema
      console.log('📝 Would update order status:', payload);
      
      // Update local record
      await localDB.orders.update(payload.orderId, {
        status: payload.status,
        synced: true,
      });
      break;
    }
    
    default:
      throw new Error(`Unknown operation type: ${type}`);
  }
}

/**
 * Clear completed operations (older than 24 hours)
 */
export async function clearOldOperations(): Promise<number> {
  const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
  
  const deleted = await localDB.syncQueue
    .where('status')
    .equals('completed')
    .and(op => op.createdAt < oneDayAgo)
    .delete();
  
  console.log(`🗑️ Cleared ${deleted} old operations`);
  return deleted;
}

/**
 * Get sync queue statistics
 */
export async function getSyncQueueStats() {
  const [pending, processing, completed, failed] = await Promise.all([
    localDB.syncQueue.where('status').equals('pending').count(),
    localDB.syncQueue.where('status').equals('processing').count(),
    localDB.syncQueue.where('status').equals('completed').count(),
    localDB.syncQueue.where('status').equals('failed').count(),
  ]);
  
  return {
    pending,
    processing,
    completed,
    failed,
    total: pending + processing + completed + failed,
  };
}

/**
 * Retry all failed operations
 */
export async function retryFailedOperations(): Promise<void> {
  const failedOps = await localDB.syncQueue
    .where('status')
    .equals('failed')
    .toArray();
  
  for (const op of failedOps) {
    if (op.id) {
      await localDB.syncQueue.update(op.id, {
        status: 'pending',
        retryCount: 0,
        error: undefined,
      });
    }
  }
  
  console.log(`🔄 Reset ${failedOps.length} failed operations to pending`);
  
  // Try to process immediately
  await processSyncQueue();
}
