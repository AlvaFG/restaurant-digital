/**
 * QR Validate API v2.0.0
 * POST /api/qr/validate
 * Valida un token JWT de QR y crea/retorna una sesión QR para el cliente
 * 
 * @endpoint POST /api/qr/validate
 * @body { token: string }
 * @returns { success: boolean, data?: { session, table }, error?: string }
 * 
 * @changes v2.0.0
 * - Migrado a session-manager v2.0.0 (createSession)
 * - Integrado con QRSession types (SessionStatus, SessionValidationResult)
 * - Mejor estructura de respuesta (success/data/error)
 * - Validación mejorada con SessionValidationErrorCode
 * - Captura de userAgent e ipAddress en sesión
 */

import { NextRequest, NextResponse } from 'next/server';
import { createSession, validateSessionByToken } from '@/lib/server/session-manager';
import { getTableById } from '@/lib/server/table-store';
import { logger } from '@/lib/logger';
import { SessionValidationErrorCode } from '@/lib/server/session-types';

// Rate limiting simple (en producción usar una librería como rate-limiter-flexible)
const requestCounts = new Map<string, { count: number; resetAt: number }>();
const RATE_LIMIT = 10; // requests
const RATE_WINDOW = 60 * 1000; // 1 minuto

function checkRateLimit(ip: string): boolean {
  const now = Date.now();
  const record = requestCounts.get(ip);

  if (!record || now > record.resetAt) {
    requestCounts.set(ip, { count: 1, resetAt: now + RATE_WINDOW });
    return true;
  }

  if (record.count >= RATE_LIMIT) {
    return false;
  }

  record.count++;
  return true;
}

function getClientIP(request: NextRequest): string {
  return (
    request.headers.get('x-forwarded-for')?.split(',')[0].trim() ||
    request.headers.get('x-real-ip') ||
    'unknown'
  );
}

function getClientUserAgent(request: NextRequest): string {
  return request.headers.get('user-agent') || 'unknown';
}

export async function POST(request: NextRequest) {
  try {
    // Rate limiting
    const ip = getClientIP(request);
    
    if (!checkRateLimit(ip)) {
      logger.warn('[validate] Rate limit exceeded', { ip });
      return NextResponse.json(
        { success: false, error: 'Too many requests' },
        { status: 429 }
      );
    }

    const body = await request.json();
    const { token } = body;

    if (!token || typeof token !== 'string') {
      return NextResponse.json(
        { success: false, error: 'token is required and must be a string' },
        { status: 400 }
      );
    }

    // Opción 1: Validar sesión existente (si el cliente ya escaneó antes)
    const existingValidation = await validateSessionByToken(token);

    if (existingValidation.valid && existingValidation.session) {
      const session = existingValidation.session;
      const table = await getTableById(session.tableId);

      if (!table) {
        logger.warn('[validate] Session found but table missing', { 
          sessionId: session.id, 
          tableId: session.tableId 
        });
        return NextResponse.json(
          { success: false, error: 'Table not found' },
          { status: 404 }
        );
      }

      logger.info('[validate] Existing session validated', {
        sessionId: session.id,
        tableId: session.tableId,
        status: session.status,
        ip,
      });

      return NextResponse.json({
        success: true,
        data: {
          session: {
            id: session.id,
            tableId: session.tableId,
            tableNumber: session.tableNumber,
            zone: session.zone,
            status: session.status,
            createdAt: session.createdAt.toISOString(),
            expiresAt: session.expiresAt.toISOString(),
            lastActivityAt: session.lastActivityAt.toISOString(),
            cartItemsCount: session.cartItemsCount,
            orderIds: session.orderIds,
          },
          table: {
            id: table.id,
            number: table.number,
            zone: table.zone,
            seats: table.seats,
          },
        },
      });
    }

    // Opción 2: Crear nueva sesión (primer escaneo del QR)
    try {
      const userAgent = getClientUserAgent(request);

      const session = await createSession({
        token,
        ipAddress: ip,
        userAgent,
        metadata: {
          firstScanAt: new Date().toISOString(),
        },
      });

      // Obtener información de la mesa
      const table = await getTableById(session.tableId);

      if (!table) {
        logger.error('[validate] Session created but table not found', undefined, {
          sessionId: session.id,
          tableId: session.tableId,
        });
        return NextResponse.json(
          { success: false, error: 'Table not found' },
          { status: 404 }
        );
      }

      logger.info('[validate] New session created successfully', {
        session: {
          sessionId: session.id,
          tableId: session.tableId,
          tableNumber: session.tableNumber,
          zone: session.zone,
        },
        ip,
        userAgent: userAgent.substring(0, 50), // Log solo primeros 50 chars
      });

      return NextResponse.json({
        success: true,
        data: {
          session: {
            id: session.id,
            tableId: session.tableId,
            tableNumber: session.tableNumber,
            zone: session.zone,
            status: session.status,
            createdAt: session.createdAt.toISOString(),
            expiresAt: session.expiresAt.toISOString(),
            lastActivityAt: session.lastActivityAt.toISOString(),
            cartItemsCount: session.cartItemsCount,
            orderIds: session.orderIds,
          },
          table: {
            id: table.id,
            number: table.number,
            zone: table.zone,
            seats: table.seats,
          },
        },
      });
    } catch (error) {
      // Manejar errores específicos de validación
      const message = error instanceof Error ? error.message : String(error);
      
      if (message.includes('Invalid or expired token')) {
        logger.warn('[validate] Invalid QR token attempt', { ip, error: message });
        return NextResponse.json(
          { 
            success: false,
            error: 'Invalid or expired QR code',
            code: SessionValidationErrorCode.INVALID_TOKEN,
          },
          { status: 400 }
        );
      }

      if (message.includes('Table not found')) {
        logger.warn('[validate] QR token for non-existent table', { ip, error: message });
        return NextResponse.json(
          { 
            success: false,
            error: 'Table not found',
            code: SessionValidationErrorCode.TABLE_MISMATCH,
          },
          { status: 404 }
        );
      }

      // Error genérico
      throw error;
    }
  } catch (error) {
    logger.error('[validate] Failed to validate QR token', error instanceof Error ? error : new Error(String(error)));
    return NextResponse.json(
      { 
        success: false,
        error: 'Internal server error',
        code: SessionValidationErrorCode.SERVER_ERROR,
      },
      { status: 500 }
    );
  }
}
