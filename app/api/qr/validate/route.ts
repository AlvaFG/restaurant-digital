/**
 * QR Validate API
 * POST /api/qr/validate
 * Valida un token JWT de QR y retorna información de la mesa
 */

import { NextRequest, NextResponse } from 'next/server';
import { validateQRToken } from '@/lib/server/qr-service';
import { createGuestSession } from '@/lib/server/session-manager';
import { getTableById } from '@/lib/server/table-store';
import { logger } from '@/lib/logger';

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

export async function POST(request: NextRequest) {
  try {
    // Rate limiting
    const ip = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown';
    
    if (!checkRateLimit(ip)) {
      logger.warn('Rate limit exceeded', { ip });
      return NextResponse.json(
        { error: 'Too many requests' },
        { status: 429 }
      );
    }

    const body = await request.json();
    const { token } = body;

    if (!token) {
      return NextResponse.json(
        { error: 'token is required' },
        { status: 400 }
      );
    }

    // Validar token
    const validation = validateQRToken(token);

    if (!validation.valid || !validation.metadata) {
      logger.warn('Invalid QR token attempt', { ip, error: validation.error });
      return NextResponse.json(
        { 
          valid: false,
          error: validation.error || 'Invalid token'
        },
        { status: 400 }
      );
    }

    const { tableId } = validation.metadata;

    // Verificar que la mesa existe
    const table = await getTableById(tableId);
    
    if (!table) {
      logger.warn('QR token for non-existent table', { tableId, ip });
      return NextResponse.json(
        { valid: false, error: 'Table not found' },
        { status: 404 }
      );
    }

    // Crear sesión guest
    const session = createGuestSession({ tableId });

    logger.info('QR validated and session created', {
      tableId,
      sessionId: session.sessionId,
      ip,
    });

    return NextResponse.json({
      valid: true,
      tableId,
      sessionId: session.sessionId,
      table: {
        id: table.id,
        number: table.number,
        zone: table.zone,
        seats: table.seats,
      },
      session: {
        expiresAt: session.expiresAt.toISOString(),
        ttl: session.ttl,
      },
    });
  } catch (error) {
    logger.error('Failed to validate QR token', error instanceof Error ? error : new Error(String(error)));
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
