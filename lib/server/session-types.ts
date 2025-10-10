/**
 * Session Types
 * Tipos para el sistema de sesiones guest de QR ordering
 */

export interface Session {
  sessionId: string;
  tableId: string;
  createdAt: Date;
  lastActivity: Date;
  ttl: number; // TTL en segundos (default: 7200 = 2 horas)
  expiresAt: Date;
}

export interface CreateSessionOptions {
  tableId: string;
  ttl?: number; // TTL personalizado en segundos
}

export interface SessionStore {
  sessions: Map<string, Session>;
  sessionsByTable: Map<string, Set<string>>;
}

export const DEFAULT_SESSION_TTL = 7200; // 2 horas en segundos
export const MAX_SESSIONS_PER_TABLE = 10;
export const CLEANUP_INTERVAL = 600000; // 10 minutos en milisegundos
