/**
 * Database Module Exports
 * Central export point for local database functionality
 */

// Local DB
export {
  LocalDB,
  localDB,
  initLocalDB,
  isIndexedDBSupported,
} from './local-db';

export type {
  LocalOrder,
  LocalTable,
  LocalMenuItem,
  SyncOperation,
  SyncMetadata,
} from './local-db';

// Sync Manager
export {
  SyncManager,
  syncManager,
  db,
} from './sync-manager';

export type {
  SyncQueueItem,
  ConflictLog,
  QueueStats,
} from './sync-manager';

// Migrations
export {
  runMigrations,
  rollbackTo,
  resetDatabase,
  migrations,
} from './migrations';

export type { MigrationScript } from './migrations';
