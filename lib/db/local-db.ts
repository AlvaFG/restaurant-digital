/**
 * Local Database Configuration (IndexedDB)
 * Uses Dexie.js for IndexedDB abstraction
 */

import Dexie, { type Table } from 'dexie';

// Type definitions for local database tables
export interface LocalOrder {
  id: string;
  tableId: string;
  tenantId: string;
  items: any[];
  total: number;
  status: 'pending' | 'preparing' | 'ready' | 'delivered' | 'paid';
  createdAt: Date;
  updatedAt: Date;
  synced: boolean;
  localOnly?: boolean;
}

export interface LocalTable {
  id: string;
  number: number;
  zoneId: string;
  tenantId: string;
  status: 'available' | 'occupied' | 'reserved' | 'cleaning';
  capacity: number;
  lastSync?: Date;
  synced: boolean;
}

export interface LocalMenuItem {
  id: string;
  name: string;
  categoryId: string;
  tenantId: string;
  price: number;
  description?: string;
  available: boolean;
  imageUrl?: string;
  lastSync?: Date;
  synced: boolean;
}

export interface SyncOperation {
  id?: number; // Auto-increment
  type: 'CREATE_ORDER' | 'UPDATE_ORDER' | 'UPDATE_ORDER_STATUS' | 'UPDATE_TABLE_STATUS' | 'CREATE_PAYMENT' | 'DELETE_ORDER' | 'UPDATE_MENU_ITEM' | 'BATCH_OPERATION';
  entityType: 'order' | 'table' | 'payment' | 'menu';
  entityId: string;
  payload: any;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  retryCount: number;
  lastRetryAt?: Date;
  createdAt: Date;
  error?: string;
}

export interface SyncMetadata {
  key: string;
  lastSyncAt: Date;
  syncVersion: number;
}

/**
 * Local Database Class
 * Manages all local storage using IndexedDB
 */
export class LocalDB extends Dexie {
  // Tables
  orders!: Table<LocalOrder, string>;
  restaurantTables!: Table<LocalTable, string>;
  menuItems!: Table<LocalMenuItem, string>;
  syncQueue!: Table<SyncOperation, number>;
  syncMetadata!: Table<SyncMetadata, string>;

  constructor() {
    super('restaurant-local-db');

    // Database version 1 schema
    this.version(1).stores({
      orders: 'id, tableId, tenantId, status, createdAt, synced',
      restaurantTables: 'id, number, zoneId, tenantId, status, synced',
      menuItems: 'id, categoryId, tenantId, available, synced',
      syncQueue: '++id, type, entityType, entityId, status, createdAt',
      syncMetadata: 'key, lastSyncAt',
    });

    // Populate with default data if needed
    this.on('populate', () => {
      console.log('🗄️ IndexedDB initialized for first time');
    });

    // Handle upgrades
    this.on('versionchange', (event) => {
      console.log('🔄 Database version changed:', event);
    });
  }

  /**
   * Clear all data (useful for logout)
   */
  async clearAll(): Promise<void> {
    await this.transaction('rw', [this.orders, this.restaurantTables, this.menuItems, this.syncQueue, this.syncMetadata], async () => {
      await this.orders.clear();
      await this.restaurantTables.clear();
      await this.menuItems.clear();
      await this.syncQueue.clear();
      await this.syncMetadata.clear();
    });
    console.log('🗑️ All local data cleared');
  }

  /**
   * Get storage statistics
   */
  async getStorageStats() {
    const [ordersCount, tablesCount, menuItemsCount, syncQueueCount] = await Promise.all([
      this.orders.count(),
      this.restaurantTables.count(),
      this.menuItems.count(),
      this.syncQueue.count(),
    ]);

    return {
      orders: ordersCount,
      tables: tablesCount,
      menuItems: menuItemsCount,
      pendingSync: syncQueueCount,
      total: ordersCount + tablesCount + menuItemsCount,
    };
  }

  /**
   * Get last sync timestamp for an entity
   */
  async getLastSync(key: string): Promise<Date | null> {
    const metadata = await this.syncMetadata.get(key);
    return metadata?.lastSyncAt || null;
  }

  /**
   * Update last sync timestamp
   */
  async updateLastSync(key: string): Promise<void> {
    await this.syncMetadata.put({
      key,
      lastSyncAt: new Date(),
      syncVersion: 1,
    });
  }
}

// Singleton instance
export const localDB = new LocalDB();

/**
 * Initialize local database
 */
export async function initLocalDB(): Promise<boolean> {
  try {
    await localDB.open();
    console.log('✅ Local database initialized');
    
    // Log stats
    const stats = await localDB.getStorageStats();
    console.log('📊 Local DB Stats:', stats);
    
    return true;
  } catch (error) {
    console.error('❌ Failed to initialize local database:', error);
    return false;
  }
}

/**
 * Check if IndexedDB is supported
 */
export function isIndexedDBSupported(): boolean {
  return typeof window !== 'undefined' && 'indexedDB' in window;
}
