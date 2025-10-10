/**
 * Session Manager
 * Gestión de sesiones guest para QR ordering con TTL y cleanup automático
 */

import { randomBytes } from 'crypto';
import type {
  Session,
  CreateSessionOptions,
  SessionStore,
} from './session-types';
import {
  DEFAULT_SESSION_TTL,
  MAX_SESSIONS_PER_TABLE,
  CLEANUP_INTERVAL,
} from './session-types';
import { logger } from '@/lib/logger';

// In-memory store
const store: SessionStore = {
  sessions: new Map(),
  sessionsByTable: new Map(),
};

// Cleanup interval reference
let cleanupIntervalId: NodeJS.Timeout | null = null;

/**
 * Inicializa el cleanup automático de sesiones expiradas
 */
export function startCleanup(): void {
  if (cleanupIntervalId) {
    return; // Ya está corriendo
  }

  cleanupIntervalId = setInterval(() => {
    const removed = cleanupExpiredSessions();
    if (removed > 0) {
      logger.info('Session cleanup completed', { removedCount: removed });
    }
  }, CLEANUP_INTERVAL);

  logger.info('Session cleanup started', { intervalMs: CLEANUP_INTERVAL });
}

/**
 * Detiene el cleanup automático
 */
export function stopCleanup(): void {
  if (cleanupIntervalId) {
    clearInterval(cleanupIntervalId);
    cleanupIntervalId = null;
    logger.info('Session cleanup stopped');
  }
}

/**
 * Crea una nueva sesión guest para una mesa
 */
export function createGuestSession(options: CreateSessionOptions): Session {
  const { tableId, ttl = DEFAULT_SESSION_TTL } = options;

  // Verificar límite de sesiones por mesa
  const tableSessions = store.sessionsByTable.get(tableId);
  if (tableSessions && tableSessions.size >= MAX_SESSIONS_PER_TABLE) {
    logger.warn('Max sessions per table reached', {
      tableId,
      currentSessions: tableSessions.size,
    });
    throw new Error(`Maximum ${MAX_SESSIONS_PER_TABLE} sessions per table`);
  }

  // Generar session ID único
  const sessionId = `guest_${Date.now()}_${randomBytes(8).toString('hex')}`;

  const now = new Date();
  const expiresAt = new Date(now.getTime() + ttl * 1000);

  const session: Session = {
    sessionId,
    tableId,
    createdAt: now,
    lastActivity: now,
    ttl,
    expiresAt,
  };

  // Guardar en store
  store.sessions.set(sessionId, session);

  // Actualizar índice por mesa
  if (!store.sessionsByTable.has(tableId)) {
    store.sessionsByTable.set(tableId, new Set());
  }
  store.sessionsByTable.get(tableId)!.add(sessionId);

  logger.info('Guest session created', {
    sessionId,
    tableId,
    expiresAt,
  });

  return session;
}

/**
 * Obtiene una sesión por ID
 */
export function getSession(sessionId: string): Session | null {
  const session = store.sessions.get(sessionId);

  if (!session) {
    return null;
  }

  // Verificar si está expirada
  if (isSessionExpired(session)) {
    logger.debug('Session expired', { sessionId });
    invalidateSession(sessionId);
    return null;
  }

  return session;
}

/**
 * Extiende el TTL de una sesión actualizando lastActivity
 */
export function extendSession(sessionId: string): void {
  const session = store.sessions.get(sessionId);

  if (!session) {
    logger.warn('Attempt to extend non-existent session', { sessionId });
    return;
  }

  if (isSessionExpired(session)) {
    logger.warn('Attempt to extend expired session', { sessionId });
    invalidateSession(sessionId);
    return;
  }

  const now = new Date();
  session.lastActivity = now;
  session.expiresAt = new Date(now.getTime() + session.ttl * 1000);

  store.sessions.set(sessionId, session);

  logger.debug('Session extended', { sessionId, newExpiresAt: session.expiresAt });
}

/**
 * Invalida una sesión (la elimina del store)
 */
export function invalidateSession(sessionId: string): void {
  const session = store.sessions.get(sessionId);

  if (!session) {
    return;
  }

  // Remover de store principal
  store.sessions.delete(sessionId);

  // Remover de índice por mesa
  const tableSessions = store.sessionsByTable.get(session.tableId);
  if (tableSessions) {
    tableSessions.delete(sessionId);
    if (tableSessions.size === 0) {
      store.sessionsByTable.delete(session.tableId);
    }
  }

  logger.info('Session invalidated', { sessionId, tableId: session.tableId });
}

/**
 * Obtiene todas las sesiones activas de una mesa
 */
export function getTableSessions(tableId: string): Session[] {
  const sessionIds = store.sessionsByTable.get(tableId);

  if (!sessionIds) {
    return [];
  }

  const sessions: Session[] = [];

  for (const sessionId of sessionIds) {
    const session = getSession(sessionId);
    if (session) {
      sessions.push(session);
    }
  }

  return sessions;
}

/**
 * Limpia todas las sesiones expiradas
 * @returns Número de sesiones eliminadas
 */
export function cleanupExpiredSessions(): number {
  let removedCount = 0;
  const now = new Date();

  for (const [sessionId, session] of store.sessions.entries()) {
    if (now > session.expiresAt) {
      invalidateSession(sessionId);
      removedCount++;
    }
  }

  if (removedCount > 0) {
    logger.debug('Expired sessions cleaned up', { count: removedCount });
  }

  return removedCount;
}

/**
 * Verifica si una sesión está expirada
 */
export function isSessionExpired(session: Session): boolean {
  return new Date() > session.expiresAt;
}

/**
 * Obtiene estadísticas del store de sesiones
 */
export function getSessionStats() {
  return {
    totalSessions: store.sessions.size,
    tablesWithSessions: store.sessionsByTable.size,
    avgSessionsPerTable:
      store.sessionsByTable.size > 0
        ? store.sessions.size / store.sessionsByTable.size
        : 0,
  };
}

/**
 * Limpia todas las sesiones (para testing)
 */
export function clearAllSessions(): void {
  store.sessions.clear();
  store.sessionsByTable.clear();
  logger.info('All sessions cleared');
}

// Iniciar cleanup automático al cargar el módulo
if (process.env.NODE_ENV !== 'test') {
  startCleanup();
}
