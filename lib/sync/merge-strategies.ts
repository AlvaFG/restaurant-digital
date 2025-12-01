/**
 * Merge Strategies
 * Different strategies for merging conflicting data
 */

import type { LocalOrder, LocalTable, LocalMenuItem } from '@/lib/db/local-db';

export type MergeStrategy = 'client-wins' | 'server-wins' | 'last-write-wins' | 'manual' | 'merge-fields';

/**
 * Last Write Wins (LWW)
 * Choose the version with the most recent timestamp
 */
export function lastWriteWins<T extends { updatedAt: Date }>(
  local: T,
  remote: T
): T {
  return local.updatedAt > remote.updatedAt ? local : remote;
}

/**
 * Client Wins
 * Always prefer the local version
 */
export function clientWins<T>(local: T, remote: T): T {
  return local;
}

/**
 * Server Wins
 * Always prefer the remote version
 */
export function serverWins<T>(local: T, remote: T): T {
  return remote;
}

/**
 * Merge Fields
 * Intelligently merge non-conflicting fields
 */
export function mergeFields<T extends Record<string, any>>(
  local: T,
  remote: T,
  strategy: (local: any, remote: any, key: string) => any = lastWriteWins
): T {
  const merged = { ...remote }; // Start with remote as base
  
  // Merge each field
  for (const key in local) {
    if (local[key] !== remote[key]) {
      // Fields differ - apply strategy
      merged[key] = strategy(local[key], remote[key], key);
    }
  }
  
  return merged;
}

/**
 * Merge Orders
 * Special logic for merging order data
 */
export function mergeOrders(local: LocalOrder, remote: LocalOrder): LocalOrder {
  // Status changes from server are authoritative (staff updates)
  if (remote.status !== local.status) {
    return { ...local, status: remote.status, synced: true };
  }
  
  // If local has newer items, keep them (customer added more)
  if (local.updatedAt > remote.updatedAt) {
    return { ...local, synced: false }; // Need to sync local changes
  }
  
  // Otherwise, use remote
  return { ...remote, synced: true };
}

/**
 * Merge Tables
 * Special logic for merging table data
 */
export function mergeTables(local: LocalTable, remote: LocalTable): LocalTable {
  // Server table status is authoritative
  return { ...remote, synced: true };
}

/**
 * Merge Menu Items
 * Special logic for merging menu item data
 */
export function mergeMenuItems(local: LocalMenuItem, remote: LocalMenuItem): LocalMenuItem {
  // Server menu data is authoritative (only admin can change)
  return { ...remote, synced: true };
}

/**
 * Determine merge strategy based on entity type
 */
export function getDefaultMergeStrategy(entityType: string): MergeStrategy {
  switch (entityType) {
    case 'order':
      return 'merge-fields';
    case 'table':
      return 'server-wins';
    case 'menu':
      return 'server-wins';
    case 'payment':
      return 'server-wins';
    default:
      return 'last-write-wins';
  }
}
