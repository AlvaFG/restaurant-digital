/**
 * Session Manager - v2.0.0
 * Business Logic for QR Sessions with lifecycle management
 * 
 * Integrates QR validation with session store. Handles session
 * creation, validation, updates, and cleanup.
 * 
 * @module session-manager
 * @version 2.0.0
 */

import { createLogger } from '@/lib/logger';
import { validateToken as validateQRToken, isTokenExpired as isQRTokenExpired } from './qr-service';
import * as sessionStore from './session-store';
import type {
  QRSession,
  SessionStatus,
  SessionCreateRequest,
  SessionValidationResult,
  SessionUpdateRequest,
  SessionStatistics,
  SessionCleanupOptions,
  SessionCleanupResult,
  // Legacy types
  Session as LegacySession,
  CreateSessionOptions as LegacyCreateOptions,
} from './session-types';
import {
  SessionStatus as Status,
  SessionValidationErrorCode,
  DEFAULT_SESSION_TTL,
} from './session-types';

const logger = createLogger('session-manager');

// ============================================================================
// SESSION CREATION
// ============================================================================

/**
 * Create a new session from QR token
 * 
 * @param request - Session create request
 * @returns Created session
 * @throws Error if token invalid or session creation fails
 */
export async function createSession(request: SessionCreateRequest): Promise<QRSession> {
  logger.info('[createSession] Creating session');

  // Validate QR token with tenantId
  const tokenValidation = await validateQRToken(request.token, request.tenantId);
  if (!tokenValidation.valid) {
    throw new Error(`Invalid QR token: ${tokenValidation.error}`);
  }

  const { payload, tableData } = tokenValidation;
  if (!payload || !tableData) {
    throw new Error('Token validation succeeded but missing data');
  }

  // Generate unique session ID
  const sessionId = generateSessionId();

  const now = new Date();
  const expiresAt = new Date(now.getTime() + DEFAULT_SESSION_TTL * 1000);

  // Create session object
  const session: QRSession = {
    id: sessionId,
    tableId: tableData.id,
    tableNumber: tableData.number,
    zone: tableData.zone,
    token: request.token,
    status: Status.PENDING,
    createdAt: now,
    lastActivityAt: now,
    expiresAt,
    ipAddress: request.ipAddress,
    userAgent: request.userAgent,
    cartItemsCount: 0,
    orderIds: [],
    metadata: request.metadata,
  };

  // Store session
  const created = sessionStore.createSession(session);

  logger.info('[createSession] Session created successfully', {
    sessionId: created.id,
    tableId: created.tableId,
    expiresAt: created.expiresAt,
  });

  return created;
}

/**
 * Generate unique session ID
 */
function generateSessionId(): string {
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(2, 15);
  return `session_${timestamp}_${random}`;
}

// ============================================================================
// SESSION VALIDATION
// ============================================================================

/**
 * Validate session by ID
 * 
 * @param sessionId - Session ID
 * @returns Validation result
 */
export async function validateSession(sessionId: string): Promise<SessionValidationResult> {
  logger.debug('[validateSession] Validating session', { sessionId });

  // Get session from store
  const session = sessionStore.getSession(sessionId);

  if (!session) {
    return {
      valid: false,
      error: 'Session not found',
      errorCode: SessionValidationErrorCode.SESSION_NOT_FOUND,
    };
  }

  // Check if expired
  if (session.expiresAt.getTime() <= Date.now()) {
    return {
      valid: false,
      error: 'Session expired. Please scan QR code again.',
      errorCode: SessionValidationErrorCode.SESSION_EXPIRED,
      session,
    };
  }

  // Check if closed
  if (session.status === Status.CLOSED) {
    return {
      valid: false,
      error: 'Session closed',
      errorCode: SessionValidationErrorCode.SESSION_CLOSED,
      session,
    };
  }

  // Validate QR token if needed
  if (isQRTokenExpired(session.token)) {
    return {
      valid: false,
      error: 'QR token expired. Please request a new QR code.',
      errorCode: SessionValidationErrorCode.INVALID_TOKEN,
      session,
    };
  }

  // Update last activity
  sessionStore.updateSession(sessionId, {
    lastActivityAt: new Date(),
  });

  return {
    valid: true,
    session,
  };
}

/**
 * Validate session by token
 * 
 * @param token - JWT token from QR
 * @returns Validation result with session
 */
export async function validateSessionByToken(
  token: string
): Promise<SessionValidationResult> {
  logger.debug('[validateSessionByToken] Validating by token');

  // Find session with this token
  const allSessions = sessionStore.getAllSessions();
  const session = allSessions.find((s) => s.token === token);

  if (!session) {
    return {
      valid: false,
      error: 'No active session found for this QR code',
      errorCode: SessionValidationErrorCode.SESSION_NOT_FOUND,
    };
  }

  // Validate the session
  return validateSession(session.id);
}

// ============================================================================
// SESSION UPDATES
// ============================================================================

/**
 * Update session
 * 
 * @param sessionId - Session ID
 * @param request - Update request
 * @returns Updated session
 * @throws Error if session not found
 */
export async function updateSession(
  sessionId: string,
  request: SessionUpdateRequest
): Promise<QRSession> {
  logger.info('[updateSession] Updating session', { sessionId, updates: Object.keys(request) });

  const session = sessionStore.getSession(sessionId);
  if (!session) {
    throw new Error(`Session ${sessionId} not found`);
  }

  const updates: Partial<QRSession> = {};

  // Status update
  if (request.status && request.status !== session.status) {
    validateStatusTransition(session.status, request.status);
    updates.status = request.status;
  }

  // Cart count update
  if (typeof request.cartItemsCount === 'number') {
    updates.cartItemsCount = Math.max(0, request.cartItemsCount);
  }

  // Order ID addition
  if (request.orderId) {
    updates.orderIds = [...session.orderIds, request.orderId];
  }

  // Metadata update
  if (request.metadata) {
    updates.metadata = {
      ...session.metadata,
      ...request.metadata,
    };
  }

  // Extend expiration
  if (request.extend) {
    return sessionStore.extendSession(sessionId);
  }

  return sessionStore.updateSession(sessionId, updates);
}

/**
 * Validate status transition
 * 
 * @throws Error if transition is invalid
 */
function validateStatusTransition(from: SessionStatus, to: SessionStatus): void {
  // Define valid transitions
  const validTransitions: Record<SessionStatus, SessionStatus[]> = {
    [Status.PENDING]: [Status.BROWSING, Status.CLOSED, Status.EXPIRED],
    [Status.BROWSING]: [Status.CART_ACTIVE, Status.CLOSED, Status.EXPIRED],
    [Status.CART_ACTIVE]: [Status.ORDER_PLACED, Status.BROWSING, Status.CLOSED, Status.EXPIRED],
    [Status.ORDER_PLACED]: [Status.AWAITING_PAYMENT, Status.PAYMENT_COMPLETED, Status.CLOSED],
    [Status.AWAITING_PAYMENT]: [Status.PAYMENT_COMPLETED, Status.CLOSED],
    [Status.PAYMENT_COMPLETED]: [Status.CLOSED],
    [Status.CLOSED]: [], // No transitions from closed
    [Status.EXPIRED]: [], // No transitions from expired
  };

  const allowed = validTransitions[from] || [];
  if (!allowed.includes(to)) {
    throw new Error(`Invalid status transition from ${from} to ${to}`);
  }
}

/**
 * Close session
 * 
 * @param sessionId - Session ID
 * @returns Closed session
 */
export async function closeSession(sessionId: string): Promise<QRSession> {
  logger.info('[closeSession] Closing session', { sessionId });

  return sessionStore.updateSession(sessionId, {
    status: Status.CLOSED,
  });
}

/**
 * Extend session expiration
 * 
 * @param sessionId - Session ID
 * @returns Extended session
 */
export async function extendSession(sessionId: string): Promise<QRSession> {
  logger.info('[extendSession] Extending session', { sessionId });

  return sessionStore.extendSession(sessionId);
}

// ============================================================================
// SESSION QUERIES
// ============================================================================

/**
 * Get session by ID
 * 
 * @param sessionId - Session ID
 * @returns Session or null
 */
export function getSession(sessionId: string): QRSession | null {
  return sessionStore.getSession(sessionId);
}

/**
 * Get all sessions for a table
 * 
 * @param tableId - Table ID
 * @returns Array of sessions
 */
export function getSessionsByTable(tableId: string): QRSession[] {
  return sessionStore.getSessionsByTable(tableId);
}

/**
 * Get all active sessions
 * 
 * @returns Array of all sessions
 */
export function getAllSessions(): QRSession[] {
  return sessionStore.getAllSessions();
}

/**
 * Get session statistics
 * 
 * @returns Session statistics
 */
export function getStatistics(): SessionStatistics {
  return sessionStore.getStatistics();
}

// ============================================================================
// SESSION LIFECYCLE
// ============================================================================

/**
 * Delete session
 * 
 * @param sessionId - Session ID
 * @returns True if deleted
 */
export function deleteSession(sessionId: string): boolean {
  logger.info('[deleteSession] Deleting session', { sessionId });
  return sessionStore.deleteSession(sessionId);
}

/**
 * Delete all sessions for a table
 * 
 * @param tableId - Table ID
 * @returns Number of sessions deleted
 */
export function deleteSessionsByTable(tableId: string): number {
  logger.info('[deleteSessionsByTable] Deleting sessions for table', { tableId });
  return sessionStore.deleteSessionsByTable(tableId);
}

/**
 * Cleanup sessions
 * 
 * @param options - Cleanup options
 * @returns Cleanup result
 */
export function cleanup(options?: SessionCleanupOptions): SessionCleanupResult {
  logger.info('[cleanup] Running cleanup', options ? { options: JSON.stringify(options) } : undefined);
  return sessionStore.cleanup(options);
}

/**
 * Clear all sessions (use with caution!)
 */
export function clearAll(): void {
  logger.warn('[clearAll] Clearing all sessions');
  sessionStore.clearAll();
}

// ============================================================================
// LEGACY COMPATIBILITY
// ============================================================================

/**
 * @deprecated Use createSession instead
 */
export function createGuestSession(options: LegacyCreateOptions): LegacySession {
  logger.warn('[createGuestSession] Using deprecated function');
  
  const sessionId = generateSessionId();
  const now = new Date();
  const ttl = options.ttl || DEFAULT_SESSION_TTL;
  const expiresAt = new Date(now.getTime() + ttl * 1000);

  const session: LegacySession = {
    sessionId,
    tableId: options.tableId,
    createdAt: now,
    lastActivity: now,
    ttl,
    expiresAt,
  };

  return session;
}

/**
 * @deprecated Use getSessionsByTable instead
 */
export function getTableSessions(tableId: string): QRSession[] {
  return getSessionsByTable(tableId);
}

/**
 * @deprecated Use deleteSession instead
 */
export function invalidateSession(sessionId: string): void {
  deleteSession(sessionId);
}

/**
 * @deprecated Use getStatistics instead
 */
export function getSessionStats() {
  const stats = getStatistics();
  return {
    totalSessions: stats.totalActive,
    tablesWithSessions: Object.keys(stats.byTable).length,
    avgSessionsPerTable:
      Object.keys(stats.byTable).length > 0
        ? stats.totalActive / Object.keys(stats.byTable).length
        : 0,
  };
}

/**
 * @deprecated Use cleanup instead
 */
export function cleanupExpiredSessions(): number {
  const result = cleanup();
  return result.removed;
}

/**
 * @deprecated Use clearAll instead
 */
export function clearAllSessions(): void {
  clearAll();
}

/**
 * @deprecated Handled automatically by session-store
 */
export function startCleanup(): void {
  logger.warn('[startCleanup] Called deprecated function - cleanup is automatic');
}

/**
 * @deprecated Handled automatically by session-store
 */
export function stopCleanup(): void {
  logger.warn('[stopCleanup] Called deprecated function - use session-store');
}
