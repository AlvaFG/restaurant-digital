/**
 * Session Manager Tests
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import {
  createGuestSession,
  getSession,
  extendSession,
  invalidateSession,
  getTableSessions,
  cleanupExpiredSessions,
  isSessionExpired,
  getSessionStats,
  clearAllSessions,
  startCleanup,
  stopCleanup,
} from '../session-manager';
import { MAX_SESSIONS_PER_TABLE } from '../session-types';

// Mock del logger
vi.mock('@/lib/logger', () => ({
  logger: {
    info: vi.fn(),
    debug: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
  },
}));

describe('Session Manager', () => {
  beforeEach(() => {
    clearAllSessions();
    stopCleanup();
  });

  afterEach(() => {
    clearAllSessions();
    stopCleanup();
  });

  describe('createGuestSession', () => {
    it('should create valid session', () => {
      const tableId = '5';
      const session = createGuestSession({ tableId });

      expect(session).toBeDefined();
      expect(session.sessionId).toMatch(/^guest_/);
      expect(session.tableId).toBe(tableId);
      expect(session.createdAt).toBeInstanceOf(Date);
      expect(session.lastActivity).toBeInstanceOf(Date);
      expect(session.expiresAt).toBeInstanceOf(Date);
      expect(session.ttl).toBe(7200); // Default 2 hours
    });

    it('should create session with custom TTL', () => {
      const tableId = '5';
      const customTTL = 3600; // 1 hour
      const session = createGuestSession({ tableId, ttl: customTTL });

      expect(session.ttl).toBe(customTTL);

      const expectedExpiry =
        session.createdAt.getTime() + customTTL * 1000;
      expect(session.expiresAt.getTime()).toBe(expectedExpiry);
    });

    it('should create unique session IDs', () => {
      const tableId = '5';
      const session1 = createGuestSession({ tableId });
      const session2 = createGuestSession({ tableId });

      expect(session1.sessionId).not.toBe(session2.sessionId);
    });

    it('should enforce max sessions per table', () => {
      const tableId = '5';

      // Create max sessions
      for (let i = 0; i < MAX_SESSIONS_PER_TABLE; i++) {
        createGuestSession({ tableId });
      }

      // Should throw on next attempt
      expect(() => createGuestSession({ tableId })).toThrow(
        `Maximum ${MAX_SESSIONS_PER_TABLE} sessions per table`
      );
    });

    it('should allow sessions for different tables', () => {
      for (let i = 0; i < MAX_SESSIONS_PER_TABLE; i++) {
        createGuestSession({ tableId: '5' });
      }

      // Should not throw for different table
      expect(() => createGuestSession({ tableId: '6' })).not.toThrow();
    });
  });

  describe('getSession', () => {
    it('should retrieve existing session', () => {
      const tableId = '5';
      const created = createGuestSession({ tableId });

      const retrieved = getSession(created.sessionId);

      expect(retrieved).not.toBeNull();
      expect(retrieved!.sessionId).toBe(created.sessionId);
      expect(retrieved!.tableId).toBe(tableId);
    });

    it('should return null for non-existent session', () => {
      const session = getSession('non-existent-id');
      expect(session).toBeNull();
    });

    it('should return null for expired session', () => {
      const tableId = '5';
      const session = createGuestSession({ tableId, ttl: -1 }); // Already expired

      const retrieved = getSession(session.sessionId);
      expect(retrieved).toBeNull();
    });
  });

  describe('extendSession', () => {
    it('should update lastActivity and expiresAt', async () => {
      const tableId = '5';
      const session = createGuestSession({ tableId });
      const originalLastActivity = session.lastActivity.getTime();
      const originalExpiresAt = session.expiresAt.getTime();

      // Wait to ensure timestamp changes
      await new Promise(resolve => setTimeout(resolve, 50));

      extendSession(session.sessionId);

      const updated = getSession(session.sessionId);
      expect(updated).not.toBeNull();
      expect(updated!.lastActivity.getTime()).toBeGreaterThan(originalLastActivity);
      expect(updated!.expiresAt.getTime()).toBeGreaterThan(originalExpiresAt);
    });

    it('should not extend non-existent session', () => {
      // Should not throw
      expect(() => extendSession('non-existent')).not.toThrow();
    });

    it('should invalidate expired session on extend attempt', () => {
      const tableId = '5';
      const session = createGuestSession({ tableId, ttl: -1 });

      extendSession(session.sessionId);

      const retrieved = getSession(session.sessionId);
      expect(retrieved).toBeNull();
    });
  });

  describe('invalidateSession', () => {
    it('should remove session from store', () => {
      const tableId = '5';
      const session = createGuestSession({ tableId });

      invalidateSession(session.sessionId);

      const retrieved = getSession(session.sessionId);
      expect(retrieved).toBeNull();
    });

    it('should remove session from table index', () => {
      const tableId = '5';
      const session = createGuestSession({ tableId });

      invalidateSession(session.sessionId);

      const tableSessions = getTableSessions(tableId);
      expect(tableSessions).toHaveLength(0);
    });

    it('should not throw on non-existent session', () => {
      expect(() => invalidateSession('non-existent')).not.toThrow();
    });
  });

  describe('getTableSessions', () => {
    it('should return all active sessions for table', () => {
      const tableId = '5';
      createGuestSession({ tableId });
      createGuestSession({ tableId });
      createGuestSession({ tableId });

      const sessions = getTableSessions(tableId);
      expect(sessions).toHaveLength(3);
      sessions.forEach((s) => expect(s.tableId).toBe(tableId));
    });

    it('should return empty array for table with no sessions', () => {
      const sessions = getTableSessions('99');
      expect(sessions).toEqual([]);
    });

    it('should not include expired sessions', () => {
      const tableId = '5';
      createGuestSession({ tableId });
      createGuestSession({ tableId, ttl: -1 }); // Expired

      const sessions = getTableSessions(tableId);
      expect(sessions).toHaveLength(1);
    });

    it('should return sessions only for specified table', () => {
      createGuestSession({ tableId: '5' });
      createGuestSession({ tableId: '5' });
      createGuestSession({ tableId: '6' });

      const table5Sessions = getTableSessions('5');
      expect(table5Sessions).toHaveLength(2);
    });
  });

  describe('cleanupExpiredSessions', () => {
    it('should remove expired sessions', () => {
      const tableId = '5';
      createGuestSession({ tableId, ttl: -1 }); // Expired
      createGuestSession({ tableId, ttl: -1 }); // Expired
      createGuestSession({ tableId }); // Valid

      const removed = cleanupExpiredSessions();
      expect(removed).toBe(2);

      const sessions = getTableSessions(tableId);
      expect(sessions).toHaveLength(1);
    });

    it('should return 0 when no sessions expired', () => {
      const tableId = '5';
      createGuestSession({ tableId });

      const removed = cleanupExpiredSessions();
      expect(removed).toBe(0);
    });

    it('should handle empty store', () => {
      const removed = cleanupExpiredSessions();
      expect(removed).toBe(0);
    });
  });

  describe('isSessionExpired', () => {
    it('should return false for valid session', () => {
      const tableId = '5';
      const session = createGuestSession({ tableId });

      expect(isSessionExpired(session)).toBe(false);
    });

    it('should return true for expired session', () => {
      const tableId = '5';
      const session = createGuestSession({ tableId, ttl: -1 });

      expect(isSessionExpired(session)).toBe(true);
    });
  });

  describe('getSessionStats', () => {
    it('should return correct stats', () => {
      createGuestSession({ tableId: '5' });
      createGuestSession({ tableId: '5' });
      createGuestSession({ tableId: '6' });

      const stats = getSessionStats();

      expect(stats.totalSessions).toBe(3);
      expect(stats.tablesWithSessions).toBe(2);
      expect(stats.avgSessionsPerTable).toBe(1.5);
    });

    it('should handle empty store', () => {
      const stats = getSessionStats();

      expect(stats.totalSessions).toBe(0);
      expect(stats.tablesWithSessions).toBe(0);
      expect(stats.avgSessionsPerTable).toBe(0);
    });
  });

  describe('clearAllSessions', () => {
    it('should remove all sessions', () => {
      createGuestSession({ tableId: '5' });
      createGuestSession({ tableId: '6' });

      clearAllSessions();

      const stats = getSessionStats();
      expect(stats.totalSessions).toBe(0);
      expect(stats.tablesWithSessions).toBe(0);
    });
  });

  describe('cleanup automation', () => {
    it('should start cleanup interval', () => {
      startCleanup();
      // Interval should be running (no error)
      stopCleanup();
    });

    it('should not start multiple intervals', () => {
      startCleanup();
      startCleanup();
      stopCleanup();
    });

    it('should stop cleanup interval', () => {
      startCleanup();
      stopCleanup();
      // Should not throw
    });
  });
});
