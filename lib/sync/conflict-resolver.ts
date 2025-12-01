/**
 * Conflict Resolver
 * Handles conflicts between local and remote data during synchronization
 */

import type { LocalOrder, LocalTable, LocalMenuItem } from '@/lib/db/local-db';
import {
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

export interface ConflictResolution<T> {
  resolved: T;
  strategy: MergeStrategy;
  hadConflict: boolean;
  requiresManualReview?: boolean;
  conflictDetails?: string;
}

/**
 * Detect if there's a conflict between local and remote data
 */
export function hasConflict<T extends { synced: boolean }>(
  local: T & { updatedAt?: Date },
  remote: T & { updatedAt?: Date }
): boolean {
  // No conflict if local is already synced
  if (local.synced) {
    return false;
  }
  
  // If we have timestamps, compare them
  if (local.updatedAt && remote.updatedAt) {
    // No conflict if local is already synced and hasn't changed
    if (local.synced && local.updatedAt <= remote.updatedAt) {
      return false;
    }
    
    // Conflict if both have been modified since last sync
    if (!local.synced && local.updatedAt > remote.updatedAt) {
      return true;
    }
  }
  
  // If no timestamps or timestamps are equal, check synced status
  return !local.synced;
}

/**
 * Resolve conflict using specified strategy
 */
export function resolveConflict<T>(
  local: T,
  remote: T,
  strategy: MergeStrategy
): T {
  switch (strategy) {
    case 'client-wins':
      return clientWins(local, remote);
    
    case 'server-wins':
      return serverWins(local, remote);
    
    case 'last-write-wins':
      return lastWriteWins(local as any, remote as any);
    
    case 'merge-fields':
      return mergeFields(local as any, remote as any);
    
    case 'manual':
      // Manual resolution requires UI intervention
      throw new Error('Manual resolution required');
    
    default:
      return serverWins(local, remote);
  }
}

/**
 * Resolve Order conflict
 */
export async function resolveOrderConflict(
  local: LocalOrder,
  remote: LocalOrder,
  preferredStrategy?: MergeStrategy
): Promise<ConflictResolution<LocalOrder>> {
  const strategy = preferredStrategy || getDefaultMergeStrategy('order');
  const hadConflict = hasConflict(local, remote);
  
  if (!hadConflict) {
    return {
      resolved: { ...remote, synced: true },
      strategy: 'server-wins',
      hadConflict: false,
    };
  }
  
  // Check for irreconcilable conflicts
  const isIrreconcilable = 
    (local.status === 'paid' && remote.status === 'delivered') ||
    (local.status === 'delivered' && remote.status === 'pending');
  
  if (isIrreconcilable) {
    return {
      resolved: mergeOrders(local, remote),
      strategy: 'manual',
      hadConflict: true,
      requiresManualReview: true,
      conflictDetails: `Order status conflict: local=${local.status}, remote=${remote.status}`,
    };
  }
  
  try {
    const resolved = strategy === 'merge-fields'
      ? mergeOrders(local, remote)
      : resolveConflict(local, remote, strategy);
    
    return {
      resolved,
      strategy,
      hadConflict,
    };
  } catch (error) {
    // Fallback to server wins if resolution fails
    return {
      resolved: { ...remote, synced: true },
      strategy: 'server-wins',
      hadConflict,
      conflictDetails: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Resolve Table conflict
 */
export async function resolveTableConflict(
  local: LocalTable,
  remote: LocalTable,
  preferredStrategy?: MergeStrategy
): Promise<ConflictResolution<LocalTable>> {
  const strategy = preferredStrategy || getDefaultMergeStrategy('table');
  const hadConflict = hasConflict(local, remote);
  
  if (!hadConflict) {
    return {
      resolved: { ...remote, synced: true },
      strategy: 'server-wins',
      hadConflict: false,
    };
  }
  
  // Tables are typically server-authoritative
  const resolved = mergeTables(local, remote);
  
  return {
    resolved,
    strategy,
    hadConflict,
  };
}

/**
 * Resolve Menu Item conflict
 */
export async function resolveMenuItemConflict(
  local: LocalMenuItem,
  remote: LocalMenuItem,
  preferredStrategy?: MergeStrategy
): Promise<ConflictResolution<LocalMenuItem>> {
  const strategy = preferredStrategy || getDefaultMergeStrategy('menu');
  const hadConflict = hasConflict(local, remote);
  
  if (!hadConflict) {
    return {
      resolved: { ...remote, synced: true },
      strategy: 'server-wins',
      hadConflict: false,
    };
  }
  
  // Menu items are admin-controlled, always use server data
  const resolved = mergeMenuItems(local, remote);
  
  return {
    resolved,
    strategy,
    hadConflict,
  };
}

/**
 * Get conflicts summary
 */
export async function getConflictsSummary(): Promise<{
  total: number;
  byType: Record<string, number>;
}> {
  // This would query local DB for unsynced records
  // For now, return placeholder
  return {
    total: 0,
    byType: {
      order: 0,
      table: 0,
      menu: 0,
    },
  };
}

/**
 * Batch resolve conflicts
 */
export async function batchResolveConflicts(
  conflicts: Array<{
    type: 'order' | 'table' | 'menu';
    local: any;
    remote: any;
  }>,
  strategy?: MergeStrategy
): Promise<ConflictResolution<any>[]> {
  const results: ConflictResolution<any>[] = [];
  
  for (const conflict of conflicts) {
    let resolution: ConflictResolution<any>;
    
    switch (conflict.type) {
      case 'order':
        resolution = await resolveOrderConflict(conflict.local, conflict.remote, strategy);
        break;
      
      case 'table':
        resolution = await resolveTableConflict(conflict.local, conflict.remote, strategy);
        break;
      
      case 'menu':
        resolution = await resolveMenuItemConflict(conflict.local, conflict.remote, strategy);
        break;
      
      default:
        throw new Error(`Unknown conflict type: ${conflict.type}`);
    }
    
    results.push(resolution);
  }
  
  return results;
}
