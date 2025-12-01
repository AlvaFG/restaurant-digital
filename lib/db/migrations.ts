/**
 * Database Migrations
 * Handles schema changes and data migrations for IndexedDB
 */

import { localDB } from './local-db';

export interface MigrationScript {
  version: number;
  description: string;
  up: () => Promise<void>;
  down?: () => Promise<void>;
}

/**
 * Migration scripts
 * Add new migrations here as the schema evolves
 */
export const migrations: MigrationScript[] = [
  {
    version: 1,
    description: 'Initial schema - orders, tables, menu, sync queue',
    up: async () => {
      console.log('📦 Migration v1: Initial schema created');
      // Schema is created automatically by Dexie
    },
  },
  // Future migrations will be added here
  // {
  //   version: 2,
  //   description: 'Add new field to orders',
  //   up: async () => {
  //     // Migration logic
  //   },
  // },
];

/**
 * Run all pending migrations
 */
export async function runMigrations(): Promise<void> {
  console.log('🔄 Checking for database migrations...');
  
  try {
    const currentVersion = localDB.verno;
    console.log(`📌 Current database version: ${currentVersion}`);
    
    const pendingMigrations = migrations.filter(m => m.version > currentVersion);
    
    if (pendingMigrations.length === 0) {
      console.log('✅ Database is up to date');
      return;
    }
    
    console.log(`🔄 Running ${pendingMigrations.length} migrations...`);
    
    for (const migration of pendingMigrations) {
      console.log(`⬆️ Migrating to v${migration.version}: ${migration.description}`);
      await migration.up();
      console.log(`✅ Migration v${migration.version} completed`);
    }
    
    console.log('🎉 All migrations completed successfully');
  } catch (error) {
    console.error('❌ Migration failed:', error);
    throw error;
  }
}

/**
 * Rollback to a specific version
 * Only works if down() is defined in migrations
 */
export async function rollbackTo(targetVersion: number): Promise<void> {
  console.log(`🔙 Rolling back to version ${targetVersion}...`);
  
  const currentVersion = localDB.verno;
  
  if (targetVersion >= currentVersion) {
    console.log('⚠️ Target version is not lower than current version');
    return;
  }
  
  const migrationsToRollback = migrations
    .filter(m => m.version > targetVersion && m.version <= currentVersion)
    .sort((a, b) => b.version - a.version); // Reverse order
  
  for (const migration of migrationsToRollback) {
    if (!migration.down) {
      throw new Error(`Migration v${migration.version} does not have a rollback script`);
    }
    
    console.log(`⬇️ Rolling back v${migration.version}: ${migration.description}`);
    await migration.down();
    console.log(`✅ Rollback v${migration.version} completed`);
  }
  
  console.log(`🎉 Rollback to v${targetVersion} completed`);
}

/**
 * Reset database (useful for development)
 */
export async function resetDatabase(): Promise<void> {
  console.log('🗑️ Resetting database...');
  
  await localDB.delete();
  console.log('✅ Database deleted');
  
  await localDB.open();
  console.log('✅ Database recreated');
}
