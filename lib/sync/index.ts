/**
 * Sync Module Exports
 * Central export point for synchronization functionality
 */

// Sync Queue
export {
  addToSyncQueue,
  getPendingOperations,
  getOperationsByPriority,
  updateOperationStatus,
  processSyncQueue,
  clearOldOperations,
  getSyncQueueStats,
  retryFailedOperations,
} from './sync-queue';

// Sync Operations
export {
  type SyncOperationType,
  type SyncEntityType,
  type SyncStatus,
  type CreateOrderPayload,
  type UpdateOrderPayload,
  type UpdateTableStatusPayload,
  type CreatePaymentPayload,
  type UpdateMenuItemPayload,
  type BatchOperationPayload,
  type SyncOperationMetadata,
  SyncPriority,
  getOperationPriority,
  shouldRetryOperation,
  getRetryDelay,
  validateOperationPayload,
} from './sync-operations';

// Background Sync
export {
  registerBackgroundSync,
  isBackgroundSyncSupported,
  triggerManualSync,
  startPeriodicSync,
  stopPeriodicSync,
  setupAutoSyncOnOnline,
  initBackgroundSync,
  cleanupBackgroundSync,
} from './background-sync';

// Conflict Resolution
export {
  type ConflictResolution,
  hasConflict,
  resolveConflict,
  resolveOrderConflict,
  resolveTableConflict,
  resolveMenuItemConflict,
  getConflictsSummary,
  batchResolveConflicts,
} from './conflict-resolver';

// Merge Strategies
export {
  type MergeStrategy,
  lastWriteWins,
  clientWins,
  serverWins,
  mergeFields,
  mergeOrders,
  mergeTables,
  mergeMenuItems,
  getDefaultMergeStrategy,
} from './merge-strategies';
