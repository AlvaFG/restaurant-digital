/**
 * Session Store - In-Memory Session Management
 * 
 * Manages QR ordering sessions in memory with TTL and cleanup.
 * This is an in-memory store - sessions are lost on server restart.
 * For production, consider Redis or similar persistent store.
 * 
 * @module session-store
 * @version 1.0.0
 */

import { createLogger } from '@/lib/logger';
import type {
  QRSession,
  SessionStatus,
  SessionStatistics,
  SessionCleanupOptions,
  SessionCleanupResult,
} from './session-types';
import {
  DEFAULT_SESSION_TTL,
  MAX_SESSIONS_PER_TABLE,
  CLEANUP_INTERVAL,
  SESSION_EXTENSION_TIME,
  SessionStatus as Status,
} from './session-types';

const logger = createLogger('session-store');

// ============================================================================
// IN-MEMORY STORAGE
// ============================================================================

/** Map of session ID → session data */
const sessions = new Map<string, QRSession>();

/** Map of table ID → set of session IDs */
const sessionsByTable = new Map<string, Set<string>>();

/** Daily session counter (reset at midnight) */
let todaySessionCount = 0;
let lastResetDate: Date | null = null;

// ============================================================================
// CLEANUP MANAGEMENT
// ============================================================================

/**
 * Cleanup expired sessions automatically
 */
function cleanupExpiredSessions(): void {
  const now = Date.now();
  let removedCount = 0;

  for (const [sessionId, session] of sessions.entries()) {
    if (session.expiresAt.getTime() <= now) {
      logger.info('[cleanupExpiredSessions] Removing expired session', {
        sessionId,
        tableId: session.tableId,
      });

      // Remove from main store
      sessions.delete(sessionId);

      // Remove from table index
      const tableSessions = sessionsByTable.get(session.tableId);
      if (tableSessions) {
        tableSessions.delete(sessionId);
        if (tableSessions.size === 0) {
          sessionsByTable.delete(session.tableId);
        }
      }

      removedCount++;
    }
  }

  if (removedCount > 0) {
    logger.info(`[cleanupExpiredSessions] Removed ${removedCount} expired sessions`);
  }
}

/** Cleanup interval handle */
let cleanupInterval: NodeJS.Timeout | null = null;

/**
 * Start automatic cleanup
 */
export function startCleanup(): void {
  if (cleanupInterval) {
    logger.warn('[startCleanup] Cleanup already running');
    return;
  }

  logger.info(`[startCleanup] Starting automatic cleanup every ${CLEANUP_INTERVAL}ms`);
  cleanupInterval = setInterval(cleanupExpiredSessions, CLEANUP_INTERVAL);

  // Run initial cleanup
  cleanupExpiredSessions();
}

/**
 * Stop automatic cleanup
 */
export function stopCleanup(): void {
  if (cleanupInterval) {
    clearInterval(cleanupInterval);
    cleanupInterval = null;
    logger.info('[stopCleanup] Stopped automatic cleanup');
  }
}

// ============================================================================
// SESSION CRUD OPERATIONS
// ============================================================================

/**
 * Create a new session
 * 
 * @param session - Session data
 * @returns Created session
 * @throws Error if session already exists or table limit exceeded
 */
export function createSession(session: QRSession): QRSession {
  // Check if session already exists
  if (sessions.has(session.id)) {
    throw new Error(`Session ${session.id} already exists`);
  }

  // Check table limit
  const tableSessions = sessionsByTable.get(session.tableId);
  if (tableSessions && tableSessions.size >= MAX_SESSIONS_PER_TABLE) {
    throw new Error(
      `Table ${session.tableId} has reached max sessions (${MAX_SESSIONS_PER_TABLE})`
    );
  }

  // Add to main store
  sessions.set(session.id, session);

  // Add to table index
  if (!tableSessions) {
    sessionsByTable.set(session.tableId, new Set([session.id]));
  } else {
    tableSessions.add(session.id);
  }

  // Update daily counter
  updateDailyCounter();
  todaySessionCount++;

  logger.info('[createSession] Session created', {
    sessionId: session.id,
    tableId: session.tableId,
    status: session.status,
  });

  return session;
}

/**
 * Get session by ID
 * 
 * @param sessionId - Session ID
 * @returns Session or null if not found
 */
export function getSession(sessionId: string): QRSession | null {
  const session = sessions.get(sessionId);
  return session || null;
}

/**
 * Get all sessions for a table
 * 
 * @param tableId - Table ID
 * @returns Array of sessions
 */
export function getSessionsByTable(tableId: string): QRSession[] {
  const sessionIds = sessionsByTable.get(tableId);
  if (!sessionIds) {
    return [];
  }

  const tableSessions: QRSession[] = [];
  for (const sessionId of sessionIds) {
    const session = sessions.get(sessionId);
    if (session) {
      tableSessions.push(session);
    }
  }

  return tableSessions;
}

/**
 * Get all active sessions
 * 
 * @returns Array of all sessions
 */
export function getAllSessions(): QRSession[] {
  return Array.from(sessions.values());
}

/**
 * Update session
 * 
 * @param sessionId - Session ID
 * @param updates - Partial session updates
 * @returns Updated session
 * @throws Error if session not found
 */
export function updateSession(
  sessionId: string,
  updates: Partial<QRSession>
): QRSession {
  const session = sessions.get(sessionId);
  if (!session) {
    throw new Error(`Session ${sessionId} not found`);
  }

  // Apply updates
  const updated: QRSession = {
    ...session,
    ...updates,
    id: session.id, // Prevent ID change
    tableId: session.tableId, // Prevent table change
    lastActivityAt: new Date(), // Always update activity
  };

  // Update in store
  sessions.set(sessionId, updated);

  logger.debug('[updateSession] Session updated', {
    sessionId,
    updates: Object.keys(updates),
  });

  return updated;
}

/**
 * Extend session expiration
 * 
 * @param sessionId - Session ID
 * @param extensionSeconds - Seconds to extend (default: SESSION_EXTENSION_TIME)
 * @returns Updated session
 * @throws Error if session not found
 */
export function extendSession(
  sessionId: string,
  extensionSeconds: number = SESSION_EXTENSION_TIME
): QRSession {
  const session = sessions.get(sessionId);
  if (!session) {
    throw new Error(`Session ${sessionId} not found`);
  }

  const now = new Date();
  const newExpiry = new Date(now.getTime() + extensionSeconds * 1000);

  return updateSession(sessionId, {
    expiresAt: newExpiry,
    lastActivityAt: now,
  });
}

/**
 * Delete session
 * 
 * @param sessionId - Session ID
 * @returns True if deleted, false if not found
 */
export function deleteSession(sessionId: string): boolean {
  const session = sessions.get(sessionId);
  if (!session) {
    return false;
  }

  // Remove from main store
  sessions.delete(sessionId);

  // Remove from table index
  const tableSessions = sessionsByTable.get(session.tableId);
  if (tableSessions) {
    tableSessions.delete(sessionId);
    if (tableSessions.size === 0) {
      sessionsByTable.delete(session.tableId);
    }
  }

  logger.info('[deleteSession] Session deleted', {
    sessionId,
    tableId: session.tableId,
  });

  return true;
}

/**
 * Delete all sessions for a table
 * 
 * @param tableId - Table ID
 * @returns Number of sessions deleted
 */
export function deleteSessionsByTable(tableId: string): number {
  const tableSessions = sessionsByTable.get(tableId);
  if (!tableSessions) {
    return 0;
  }

  let count = 0;
  for (const sessionId of tableSessions) {
    if (deleteSession(sessionId)) {
      count++;
    }
  }

  logger.info(`[deleteSessionsByTable] Deleted ${count} sessions for table ${tableId}`);
  return count;
}

// ============================================================================
// STATISTICS & MONITORING
// ============================================================================

/**
 * Update daily counter (reset at midnight)
 */
function updateDailyCounter(): void {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

  if (!lastResetDate || lastResetDate.getTime() !== today.getTime()) {
    todaySessionCount = 0;
    lastResetDate = today;
    logger.info('[updateDailyCounter] Daily counter reset');
  }
}

/**
 * Get session statistics
 * 
 * @returns Session statistics
 */
export function getStatistics(): SessionStatistics {
  updateDailyCounter();

  const byStatus: Record<SessionStatus, number> = {
    [Status.PENDING]: 0,
    [Status.BROWSING]: 0,
    [Status.CART_ACTIVE]: 0,
    [Status.ORDER_PLACED]: 0,
    [Status.AWAITING_PAYMENT]: 0,
    [Status.PAYMENT_COMPLETED]: 0,
    [Status.CLOSED]: 0,
    [Status.EXPIRED]: 0,
  };

  const byTable: Record<string, number> = {};
  let totalDuration = 0;
  const now = Date.now();

  for (const session of sessions.values()) {
    // Count by status
    byStatus[session.status]++;

    // Count by table
    byTable[session.tableId] = (byTable[session.tableId] || 0) + 1;

    // Calculate duration
    const duration = now - session.createdAt.getTime();
    totalDuration += duration;
  }

  const averageDuration = sessions.size > 0 ? totalDuration / sessions.size : 0;

  return {
    totalActive: sessions.size,
    byStatus,
    byTable,
    averageDuration,
    todayTotal: todaySessionCount,
    timestamp: new Date(),
  };
}

/**
 * Cleanup sessions matching criteria
 * 
 * @param options - Cleanup options
 * @returns Cleanup result
 */
export function cleanup(options: SessionCleanupOptions = {}): SessionCleanupResult {
  const { olderThan, statuses, dryRun = false } = options;

  const now = Date.now();
  const toRemove: string[] = [];

  for (const [sessionId, session] of sessions.entries()) {
    let shouldRemove = false;

    // Check age
    if (olderThan) {
      const age = now - session.createdAt.getTime();
      if (age > olderThan) {
        shouldRemove = true;
      }
    }

    // Check status
    if (statuses && statuses.length > 0) {
      if (statuses.includes(session.status)) {
        shouldRemove = true;
      }
    }

    // Default: remove expired
    if (!olderThan && !statuses) {
      if (session.expiresAt.getTime() <= now) {
        shouldRemove = true;
      }
    }

    if (shouldRemove) {
      toRemove.push(sessionId);
    }
  }

  if (!dryRun) {
    for (const sessionId of toRemove) {
      deleteSession(sessionId);
    }
  }

  logger.info('[cleanup] Cleanup complete', {
    removed: toRemove.length,
    dryRun,
  });

  return {
    removed: toRemove.length,
    sessionIds: toRemove,
    dryRun,
  };
}

/**
 * Clear all sessions (use with caution!)
 */
export function clearAll(): void {
  const count = sessions.size;
  sessions.clear();
  sessionsByTable.clear();
  logger.warn(`[clearAll] Cleared all sessions (${count} removed)`);
}

// ============================================================================
// INITIALIZATION
// ============================================================================

// Start cleanup on module load (server-side only)
if (typeof window === 'undefined') {
  startCleanup();
}

// Cleanup on process exit
if (typeof process !== 'undefined') {
  process.on('SIGINT', () => {
    stopCleanup();
  });
  process.on('SIGTERM', () => {
    stopCleanup();
  });
}
