/**
 * Session Manager Tests v2.0.0
 * 
 * Test suite for session-manager.ts business logic layer
 * Tests cover:
 * - Session creation with QR validation
 * - Session validation (existence, expiry, closure, token)
 * - Session updates and status transitions
 * - Status state machine enforcement
 * - Session extension and closure
 * - Cleanup and queries
 * - Legacy functions backward compatibility
 * 
 * @module session-manager.test
 * @version 2.0.0
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import * as sessionManager from '../session-manager';
import * as qrService from '../qr-service';
import * as sessionStore from '../session-store';
import { SessionStatus, SessionValidationErrorCode } from '../session-types';
import { QRValidationErrorCode } from '../qr-types';

// Mock dependencies
vi.mock('../qr-service');
vi.mock('../session-store');
vi.mock('@/lib/logger', () => ({
  logger: {
    info: vi.fn(),
    debug: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
  },
  createLogger: vi.fn(() => ({
    info: vi.fn(),
    debug: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
  })),
}));

describe('session-manager v2.0.0', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('createSession', () => {
    it('should create session with valid QR token', async () => {
      // Arrange
      const mockToken = 'valid-qr-token';
      const mockTableId = 'table-1';
      const mockIP = '192.168.1.100';
      const mockUserAgent = 'Mozilla/5.0';

      vi.mocked(qrService.validateToken).mockResolvedValue({
        valid: true,
        payload: {
          tableId: mockTableId,
          tableNumber: 5,
          zone: 'Terraza',
          iat: Math.floor(Date.now() / 1000),
          exp: Math.floor(Date.now() / 1000) + 86400,
          iss: 'restaurantmanagement',
          type: 'qr-table-access',
        },
        tableData: {
          id: mockTableId,
          number: 5,
          zone: 'Terraza',
          status: 'available',
          seats: 4,
        },
      });

      vi.mocked(sessionStore.createSession).mockImplementation((session) => session);

      // Act
      const session = await sessionManager.createSession({
        token: mockToken,
        ipAddress: mockIP,
        userAgent: mockUserAgent,
        metadata: { test: true },
      });

      // Assert
      expect(session).toBeDefined();
      expect(session.id).toMatch(/^session_\d+_[a-z0-9]+$/);
      expect(session.tableId).toBe(mockTableId);
      expect(session.tableNumber).toBe(5);
      expect(session.zone).toBe('Terraza');
      expect(session.token).toBe(mockToken);
      expect(session.status).toBe(SessionStatus.PENDING);
      expect(session.ipAddress).toBe(mockIP);
      expect(session.userAgent).toBe(mockUserAgent);
      expect(session.cartItemsCount).toBe(0);
      expect(session.orderIds).toEqual([]);
      expect(session.metadata).toEqual({ test: true });

      // Verify QR validation was called
      expect(qrService.validateToken).toHaveBeenCalledWith(mockToken);

      // Verify session was stored
      expect(sessionStore.createSession).toHaveBeenCalledWith(
        expect.objectContaining({
          id: expect.stringMatching(/^session_\d+_[a-z0-9]+$/),
          tableId: mockTableId,
          token: mockToken,
          status: SessionStatus.PENDING,
        })
      );
    });

    it('should throw error with invalid QR token', async () => {
      // Arrange
      const mockToken = 'invalid-token';

      vi.mocked(qrService.validateToken).mockResolvedValue({
        valid: false,
        error: 'Invalid signature',
      });

      // Act & Assert
      await expect(
        sessionManager.createSession({
          token: mockToken,
          ipAddress: '127.0.0.1',
          userAgent: 'test',
        })
      ).rejects.toThrow('Invalid QR token: Invalid signature');

      // Verify no session was stored
      expect(sessionStore.createSession).not.toHaveBeenCalled();
    });

    it('should throw error with expired QR token', async () => {
      // Arrange
      const mockToken = 'expired-token';

      vi.mocked(qrService.validateToken).mockResolvedValue({
        valid: false,
        error: 'QR code has expired. Please request a new one from staff.',
        errorCode: QRValidationErrorCode.TOKEN_EXPIRED,
      });

      // Act & Assert
      await expect(
        sessionManager.createSession({
          token: mockToken,
          ipAddress: '127.0.0.1',
          userAgent: 'test',
        })
      ).rejects.toThrow('Invalid QR token: QR code has expired');

      // Verify no session was stored
      expect(sessionStore.createSession).not.toHaveBeenCalled();
    });

    it('should throw error when QR token missing table metadata', async () => {
      // Arrange
      const mockToken = 'no-metadata-token';

      vi.mocked(qrService.validateToken).mockResolvedValue({
        valid: true,
        // No payload or tableData provided (this is the missing data case)
      });

      // Act & Assert
      await expect(
        sessionManager.createSession({
          token: mockToken,
          ipAddress: '127.0.0.1',
          userAgent: 'test',
        })
      ).rejects.toThrow('Token validation succeeded but missing data');

      // Verify no session was stored
      expect(sessionStore.createSession).not.toHaveBeenCalled();
    });
  });

  describe('validateSession', () => {
    it('should validate existing active session successfully', async () => {
      // Arrange
      const mockSessionId = 'session-123';
      const mockSession = {
        id: mockSessionId,
        tableId: 'table-1',
        tableNumber: 5,
        zone: 'Terraza',
        token: 'valid-token',
        status: SessionStatus.BROWSING,
        createdAt: new Date(Date.now() - 5 * 60 * 1000), // 5 min ago
        expiresAt: new Date(Date.now() + 25 * 60 * 1000), // 25 min from now
        lastActivityAt: new Date(),
        ipAddress: '192.168.1.100',
        userAgent: 'Mozilla/5.0',
        cartItemsCount: 0,
        orderIds: [],
        metadata: {},
      };

      vi.mocked(sessionStore.getSession).mockReturnValue(mockSession);
      vi.mocked(qrService.isTokenExpired).mockReturnValue(false);
      vi.mocked(sessionStore.updateSession).mockReturnValue(mockSession);

      // Act
      const result = await sessionManager.validateSession(mockSessionId);

      // Assert
      expect(result.valid).toBe(true);
      expect(result.session).toBeDefined();
      expect(result.session?.id).toBe(mockSessionId);
      expect(result.error).toBeUndefined();
      expect(result.errorCode).toBeUndefined();

      // Verify session was fetched
      expect(sessionStore.getSession).toHaveBeenCalledWith(mockSessionId);

      // Verify lastActivityAt was updated
      expect(sessionStore.updateSession).toHaveBeenCalledWith(mockSessionId, {
        lastActivityAt: expect.any(Date),
      });
    });

    it('should fail validation for non-existent session', async () => {
      // Arrange
      const mockSessionId = 'non-existent';

      vi.mocked(sessionStore.getSession).mockReturnValue(null);

      // Act
      const result = await sessionManager.validateSession(mockSessionId);

      // Assert
      expect(result.valid).toBe(false);
      expect(result.error).toBe('Session not found');
      expect(result.errorCode).toBe(SessionValidationErrorCode.SESSION_NOT_FOUND);

      // Verify no update was attempted
      expect(sessionStore.updateSession).not.toHaveBeenCalled();
    });

    it('should fail validation for expired session', async () => {
      // Arrange
      const mockSessionId = 'expired-session';
      const mockSession = {
        id: mockSessionId,
        tableId: 'table-1',
        tableNumber: 5,
        zone: 'Terraza',
        token: 'valid-token',
        status: SessionStatus.BROWSING,
        createdAt: new Date(Date.now() - 40 * 60 * 1000), // 40 min ago
        expiresAt: new Date(Date.now() - 10 * 60 * 1000), // 10 min ago (expired)
        lastActivityAt: new Date(Date.now() - 10 * 60 * 1000),
        ipAddress: '192.168.1.100',
        userAgent: 'Mozilla/5.0',
        cartItemsCount: 0,
        orderIds: [],
        metadata: {},
      };

      vi.mocked(sessionStore.getSession).mockReturnValue(mockSession);

      // Act
      const result = await sessionManager.validateSession(mockSessionId);

      // Assert
      expect(result.valid).toBe(false);
      expect(result.error).toBe('Session expired. Please scan QR code again.');
      expect(result.errorCode).toBe(SessionValidationErrorCode.SESSION_EXPIRED);

      // Verify no update was attempted
      expect(sessionStore.updateSession).not.toHaveBeenCalled();
    });

    it('should fail validation for closed session', async () => {
      // Arrange
      const mockSessionId = 'closed-session';
      const mockSession = {
        id: mockSessionId,
        tableId: 'table-1',
        tableNumber: 5,
        zone: 'Terraza',
        token: 'valid-token',
        status: SessionStatus.CLOSED,
        createdAt: new Date(Date.now() - 30 * 60 * 1000),
        expiresAt: new Date(Date.now() + 10 * 60 * 1000),
        lastActivityAt: new Date(),
        ipAddress: '192.168.1.100',
        userAgent: 'Mozilla/5.0',
        cartItemsCount: 2,
        orderIds: ['order-1'],
        metadata: {},
      };

      vi.mocked(sessionStore.getSession).mockReturnValue(mockSession);

      // Act
      const result = await sessionManager.validateSession(mockSessionId);

      // Assert
      expect(result.valid).toBe(false);
      expect(result.error).toBe('Session closed');
      expect(result.errorCode).toBe(SessionValidationErrorCode.SESSION_CLOSED);

      // Verify no update was attempted
      expect(sessionStore.updateSession).not.toHaveBeenCalled();
    });

    it('should fail validation when QR token is expired', async () => {
      // Arrange
      const mockSessionId = 'session-123';
      const mockSession = {
        id: mockSessionId,
        tableId: 'table-1',
        tableNumber: 5,
        zone: 'Terraza',
        token: 'expired-qr-token',
        status: SessionStatus.BROWSING,
        createdAt: new Date(Date.now() - 5 * 60 * 1000),
        expiresAt: new Date(Date.now() + 25 * 60 * 1000),
        lastActivityAt: new Date(),
        ipAddress: '192.168.1.100',
        userAgent: 'Mozilla/5.0',
        cartItemsCount: 0,
        orderIds: [],
        metadata: {},
      };

      vi.mocked(sessionStore.getSession).mockReturnValue(mockSession);
      vi.mocked(qrService.isTokenExpired).mockReturnValue(true);

      // Act
      const result = await sessionManager.validateSession(mockSessionId);

      // Assert
      expect(result.valid).toBe(false);
      expect(result.error).toBe('QR token expired. Please request a new QR code.');
      expect(result.errorCode).toBe(SessionValidationErrorCode.INVALID_TOKEN);

      // Verify token expiry was checked
      expect(qrService.isTokenExpired).toHaveBeenCalledWith('expired-qr-token');

      // Verify no update was attempted
      expect(sessionStore.updateSession).not.toHaveBeenCalled();
    });
  });

  describe('updateSession', () => {
    it('should update session status with valid transition', async () => {
      // Arrange
      const mockSessionId = 'session-123';
      const mockSession = {
        id: mockSessionId,
        tableId: 'table-1',
        tableNumber: 5,
        zone: 'Terraza',
        token: 'valid-token',
        status: SessionStatus.BROWSING,
        createdAt: new Date(),
        expiresAt: new Date(Date.now() + 30 * 60 * 1000),
        lastActivityAt: new Date(),
        ipAddress: '192.168.1.100',
        userAgent: 'Mozilla/5.0',
        cartItemsCount: 0,
        orderIds: [],
        metadata: {},
      };

      const updatedSession = {
        ...mockSession,
        status: SessionStatus.CART_ACTIVE,
        cartItemsCount: 2,
      };

      vi.mocked(sessionStore.getSession).mockReturnValue(mockSession);
      vi.mocked(sessionStore.updateSession).mockReturnValue(updatedSession);

      // Act
      const result = await sessionManager.updateSession(mockSessionId, {
        status: SessionStatus.CART_ACTIVE,
        cartItemsCount: 2,
      });

      // Assert
      expect(result).toBeDefined();
      expect(result.status).toBe(SessionStatus.CART_ACTIVE);
      expect(result.cartItemsCount).toBe(2);

      // Verify update was called
      expect(sessionStore.updateSession).toHaveBeenCalledWith(mockSessionId, {
        status: SessionStatus.CART_ACTIVE,
        cartItemsCount: 2,
      });
    });

    it('should throw error for invalid status transition', async () => {
      // Arrange
      const mockSessionId = 'session-123';
      const mockSession = {
        id: mockSessionId,
        tableId: 'table-1',
        tableNumber: 5,
        zone: 'Terraza',
        token: 'valid-token',
        status: SessionStatus.PAYMENT_COMPLETED, // terminal state
        createdAt: new Date(),
        expiresAt: new Date(Date.now() + 30 * 60 * 1000),
        lastActivityAt: new Date(),
        ipAddress: '192.168.1.100',
        userAgent: 'Mozilla/5.0',
        cartItemsCount: 3,
        orderIds: ['order-1'],
        metadata: {},
      };

      vi.mocked(sessionStore.getSession).mockReturnValue(mockSession);

      // Act & Assert
      await expect(
        sessionManager.updateSession(mockSessionId, {
          status: SessionStatus.BROWSING, // Can't go back from PAYMENT_COMPLETED
        })
      ).rejects.toThrow('Invalid status transition');

      // Verify no update was attempted
      expect(sessionStore.updateSession).not.toHaveBeenCalled();
    });

    it('should add order ID to session', async () => {
      // Arrange
      const mockSessionId = 'session-123';
      const mockSession = {
        id: mockSessionId,
        tableId: 'table-1',
        tableNumber: 5,
        zone: 'Terraza',
        token: 'valid-token',
        status: SessionStatus.CART_ACTIVE,
        createdAt: new Date(),
        expiresAt: new Date(Date.now() + 30 * 60 * 1000),
        lastActivityAt: new Date(),
        ipAddress: '192.168.1.100',
        userAgent: 'Mozilla/5.0',
        cartItemsCount: 3,
        orderIds: [],
        metadata: {},
      };

      const updatedSession = {
        ...mockSession,
        orderIds: ['order-123'],
        status: SessionStatus.ORDER_PLACED,
      };

      vi.mocked(sessionStore.getSession).mockReturnValue(mockSession);
      vi.mocked(sessionStore.updateSession).mockReturnValue(updatedSession);

      // Act
      const result = await sessionManager.updateSession(mockSessionId, {
        orderId: 'order-123',
        status: SessionStatus.ORDER_PLACED,
      });

      // Assert
      expect(result.orderIds).toContain('order-123');
      expect(result.status).toBe(SessionStatus.ORDER_PLACED);

      // Verify update included orderIds array
      expect(sessionStore.updateSession).toHaveBeenCalledWith(mockSessionId, {
        orderIds: ['order-123'],
        status: SessionStatus.ORDER_PLACED,
      });
    });

    it('should extend session when requested', async () => {
      // Arrange
      const mockSessionId = 'session-123';
      const mockSession = {
        id: mockSessionId,
        tableId: 'table-1',
        tableNumber: 5,
        zone: 'Terraza',
        token: 'valid-token',
        status: SessionStatus.BROWSING,
        createdAt: new Date(),
        expiresAt: new Date(Date.now() + 5 * 60 * 1000), // 5 min left
        lastActivityAt: new Date(),
        ipAddress: '192.168.1.100',
        userAgent: 'Mozilla/5.0',
        cartItemsCount: 0,
        orderIds: [],
        metadata: {},
      };

      const extendedSession = {
        ...mockSession,
        expiresAt: new Date(Date.now() + 35 * 60 * 1000), // Extended by 30 min
      };

      vi.mocked(sessionStore.getSession).mockReturnValue(mockSession);
      vi.mocked(sessionStore.extendSession).mockReturnValue(extendedSession);

      // Act
      const result = await sessionManager.updateSession(mockSessionId, {
        extend: true,
      });

      // Assert
      expect(result.expiresAt.getTime()).toBeGreaterThan(mockSession.expiresAt.getTime());

      // Verify extendSession was called
      expect(sessionStore.extendSession).toHaveBeenCalledWith(mockSessionId);
    });
  });

  describe('closeSession', () => {
    it('should close an active session', async () => {
      // Arrange
      const mockSessionId = 'session-123';
      const mockSession = {
        id: mockSessionId,
        tableId: 'table-1',
        tableNumber: 5,
        zone: 'Terraza',
        token: 'valid-token',
        status: SessionStatus.BROWSING,
        createdAt: new Date(),
        expiresAt: new Date(Date.now() + 30 * 60 * 1000),
        lastActivityAt: new Date(),
        ipAddress: '192.168.1.100',
        userAgent: 'Mozilla/5.0',
        cartItemsCount: 0,
        orderIds: [],
        metadata: {},
      };

      const closedSession = {
        ...mockSession,
        status: SessionStatus.CLOSED,
      };

      vi.mocked(sessionStore.getSession).mockReturnValue(mockSession);
      vi.mocked(sessionStore.updateSession).mockReturnValue(closedSession);

      // Act
      const result = await sessionManager.closeSession(mockSessionId);

      // Assert
      expect(result.status).toBe(SessionStatus.CLOSED);

      // Verify update was called
      expect(sessionStore.updateSession).toHaveBeenCalledWith(mockSessionId, {
        status: SessionStatus.CLOSED,
      });
    });
  });

  describe('extendSession', () => {
    it('should extend session expiration', async () => {
      // Arrange
      const mockSessionId = 'session-123';
      const mockSession = {
        id: mockSessionId,
        tableId: 'table-1',
        tableNumber: 5,
        zone: 'Terraza',
        token: 'valid-token',
        status: SessionStatus.BROWSING,
        createdAt: new Date(),
        expiresAt: new Date(Date.now() + 10 * 60 * 1000), // 10 min left
        lastActivityAt: new Date(),
        ipAddress: '192.168.1.100',
        userAgent: 'Mozilla/5.0',
        cartItemsCount: 0,
        orderIds: [],
        metadata: {},
      };

      const extendedSession = {
        ...mockSession,
        expiresAt: new Date(Date.now() + 40 * 60 * 1000), // Extended by 30 min
      };

      vi.mocked(sessionStore.extendSession).mockReturnValue(extendedSession);

      // Act
      const result = await sessionManager.extendSession(mockSessionId);

      // Assert
      expect(result.expiresAt.getTime()).toBeGreaterThan(mockSession.expiresAt.getTime());

      // Verify extendSession was called
      expect(sessionStore.extendSession).toHaveBeenCalledWith(mockSessionId);
    });
  });

  describe('getSessionsByTable', () => {
    it('should return all sessions for a table', () => {
      // Arrange
      const mockTableId = 'table-1';
      const mockSessions = [
        {
          id: 'session-1',
          tableId: mockTableId,
          tableNumber: 5,
          zone: 'Terraza',
          token: 'token-1',
          status: SessionStatus.BROWSING,
          createdAt: new Date(),
          expiresAt: new Date(Date.now() + 30 * 60 * 1000),
          lastActivityAt: new Date(),
          ipAddress: '192.168.1.100',
          userAgent: 'Mozilla/5.0',
          cartItemsCount: 0,
          orderIds: [],
          metadata: {},
        },
        {
          id: 'session-2',
          tableId: mockTableId,
          tableNumber: 5,
          zone: 'Terraza',
          token: 'token-2',
          status: SessionStatus.CART_ACTIVE,
          createdAt: new Date(),
          expiresAt: new Date(Date.now() + 25 * 60 * 1000),
          lastActivityAt: new Date(),
          ipAddress: '192.168.1.101',
          userAgent: 'Chrome',
          cartItemsCount: 3,
          orderIds: [],
          metadata: {},
        },
      ];

      vi.mocked(sessionStore.getSessionsByTable).mockReturnValue(mockSessions);

      // Act
      const result = sessionManager.getSessionsByTable(mockTableId);

      // Assert
      expect(result).toHaveLength(2);
      expect(result[0].id).toBe('session-1');
      expect(result[1].id).toBe('session-2');
      expect(sessionStore.getSessionsByTable).toHaveBeenCalledWith(mockTableId);
    });
  });

  describe('cleanup', () => {
    it('should cleanup expired sessions', () => {
      // Arrange
      const mockResult = {
        removed: 5,
        sessionIds: ['session-1', 'session-2', 'session-3', 'session-4', 'session-5'],
        dryRun: false,
      };

      vi.mocked(sessionStore.cleanup).mockReturnValue(mockResult);

      // Act
      const result = sessionManager.cleanup();

      // Assert
      expect(result.removed).toBe(5);
      expect(result.sessionIds).toHaveLength(5);
      expect(sessionStore.cleanup).toHaveBeenCalledWith(undefined);
    });

    it('should support dry run mode', () => {
      // Arrange
      const mockResult = {
        removed: 3,
        sessionIds: ['session-1', 'session-2', 'session-3'],
        dryRun: true,
      };

      vi.mocked(sessionStore.cleanup).mockReturnValue(mockResult);

      // Act
      const result = sessionManager.cleanup({ dryRun: true });

      // Assert
      expect(result.removed).toBe(3);
      expect(result.dryRun).toBe(true);
      expect(sessionStore.cleanup).toHaveBeenCalledWith({ dryRun: true });
    });
  });
});