/**
 * Session Types - v2.0.0
 * 
 * TypeScript definitions for QR session management.
 * Sessions track customer scanning and ordering lifecycle.
 * 
 * @module session-types
 * @version 2.0.0
 */

/**
 * Session Status
 * Represents the current state of a customer session
 */
export enum SessionStatus {
  /** Session created, waiting for first action */
  PENDING = 'pending',
  
  /** Customer is browsing menu */
  BROWSING = 'browsing',
  
  /** Customer has items in cart */
  CART_ACTIVE = 'cart_active',
  
  /** Order has been placed */
  ORDER_PLACED = 'order_placed',
  
  /** Waiting for payment */
  AWAITING_PAYMENT = 'awaiting_payment',
  
  /** Payment completed */
  PAYMENT_COMPLETED = 'payment_completed',
  
  /** Session manually closed */
  CLOSED = 'closed',
  
  /** Session expired due to inactivity */
  EXPIRED = 'expired',
}

/**
 * QR Session
 * Represents an active customer session started by scanning a QR code
 */
export interface QRSession {
  /** Unique session identifier */
  id: string;
  
  /** Table associated with this session */
  tableId: string;
  
  /** Table number */
  tableNumber: number;
  
  /** Zone name */
  zone: string;
  
  /** JWT token used to create session */
  token: string;
  
  /** Current session status */
  status: SessionStatus;
  
  /** When session was created */
  createdAt: Date;
  
  /** Last activity timestamp */
  lastActivityAt: Date;
  
  /** When session expires (if not extended) */
  expiresAt: Date;
  
  /** IP address of client (optional) */
  ipAddress?: string;
  
  /** User agent string (optional) */
  userAgent?: string;
  
  /** Current cart items count */
  cartItemsCount: number;
  
  /** IDs of orders placed in this session */
  orderIds: string[];
  
  /** Session metadata */
  metadata?: Record<string, unknown>;
}

/**
 * Session Create Request
 */
export interface SessionCreateRequest {
  /** JWT token from QR scan */
  token: string;
  
  /** Tenant ID for multi-tenancy support */
  tenantId: string;
  
  /** Client IP address */
  ipAddress?: string;
  
  /** User agent */
  userAgent?: string;
  
  /** Additional metadata */
  metadata?: Record<string, unknown>;
}

/**
 * Session Validation Result
 */
export interface SessionValidationResult {
  /** Whether session is valid */
  valid: boolean;
  
  /** Session data if valid */
  session?: QRSession;
  
  /** Error message if invalid */
  error?: string;
  
  /** Error code */
  errorCode?: SessionValidationErrorCode;
}

/**
 * Session Validation Error Codes
 */
export enum SessionValidationErrorCode {
  /** Session not found */
  SESSION_NOT_FOUND = 'SESSION_NOT_FOUND',
  
  /** Session expired */
  SESSION_EXPIRED = 'SESSION_EXPIRED',
  
  /** Session closed */
  SESSION_CLOSED = 'SESSION_CLOSED',
  
  /** Invalid token */
  INVALID_TOKEN = 'INVALID_TOKEN',
  
  /** Table mismatch */
  TABLE_MISMATCH = 'TABLE_MISMATCH',
  
  /** Server error */
  SERVER_ERROR = 'SERVER_ERROR',
}

/**
 * Session Update Request
 */
export interface SessionUpdateRequest {
  /** New status (optional) */
  status?: SessionStatus;
  
  /** Cart items count (optional) */
  cartItemsCount?: number;
  
  /** Order ID to add (optional) */
  orderId?: string;
  
  /** Extend expiration (optional) */
  extend?: boolean;
  
  /** Additional metadata (optional) */
  metadata?: Record<string, unknown>;
}

/**
 * Session Statistics
 */
export interface SessionStatistics {
  /** Total active sessions */
  totalActive: number;
  
  /** Sessions by status */
  byStatus: Record<SessionStatus, number>;
  
  /** Sessions by table */
  byTable: Record<string, number>;
  
  /** Average session duration (ms) */
  averageDuration: number;
  
  /** Total sessions created today */
  todayTotal: number;
  
  /** Snapshot timestamp */
  timestamp: Date;
}

/**
 * Session Event Type
 */
export enum SessionEventType {
  /** Session created */
  SESSION_CREATED = 'session.created',
  
  /** Session status changed */
  SESSION_UPDATED = 'session.updated',
  
  /** Session expired */
  SESSION_EXPIRED = 'session.expired',
  
  /** Session closed */
  SESSION_CLOSED = 'session.closed',
  
  /** Cart updated */
  CART_UPDATED = 'cart.updated',
  
  /** Order placed */
  ORDER_PLACED = 'order.placed',
}

/**
 * Session Event Payload
 */
export interface SessionEvent {
  /** Event type */
  type: SessionEventType;
  
  /** Session ID */
  sessionId: string;
  
  /** Table ID */
  tableId: string;
  
  /** Event data */
  data: {
    session?: Partial<QRSession>;
    oldStatus?: SessionStatus;
    newStatus?: SessionStatus;
    [key: string]: unknown;
  };
  
  /** Event timestamp */
  timestamp: Date;
}

/**
 * Session Cleanup Options
 */
export interface SessionCleanupOptions {
  /** Remove sessions older than this (ms) */
  olderThan?: number;
  
  /** Remove sessions in these statuses */
  statuses?: SessionStatus[];
  
  /** Dry run (don't actually remove) */
  dryRun?: boolean;
}

/**
 * Session Cleanup Result
 */
export interface SessionCleanupResult {
  /** Number of sessions removed */
  removed: number;
  
  /** Session IDs removed */
  sessionIds: string[];
  
  /** Whether this was a dry run */
  dryRun: boolean;
}

// ============================================================================
// LEGACY TYPES (for backward compatibility)
// ============================================================================

/** @deprecated Use QRSession instead */
export interface Session {
  sessionId: string;
  tableId: string;
  createdAt: Date;
  lastActivity: Date;
  ttl: number;
  expiresAt: Date;
}

/** @deprecated Use SessionCreateRequest instead */
export interface CreateSessionOptions {
  tableId: string;
  ttl?: number;
}

/** @deprecated Internal use only */
export interface SessionStore {
  sessions: Map<string, QRSession>;
  sessionsByTable: Map<string, Set<string>>;
}

// Configuration constants
export const DEFAULT_SESSION_TTL = 1800; // 30 minutes (reduced from 2 hours)
export const MAX_SESSIONS_PER_TABLE = 10;
export const CLEANUP_INTERVAL = 600000; // 10 minutes in ms
export const SESSION_EXTENSION_TIME = 1800; // 30 minutes in seconds
