/**
 * QR Validate API v2.0.0
 * POST /api/qr/validate
 * Valida un token JWT de QR y crea/retorna una sesión QR para el cliente
 */

import { NextRequest, NextResponse } from 'next/server';
import { createSession, validateSessionByToken } from '@/lib/server/session-manager';
import { getTableById } from '@/lib/server/table-store';
import { logger } from '@/lib/logger';
import { SessionValidationErrorCode } from '@/lib/server/session-types';
import { logRequest, logResponse, validarBody } from '@/lib/api-helpers';
import { MENSAJES } from '@/lib/i18n/mensajes';
import { ValidationError } from '@/lib/errors';

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
  const startTime = Date.now()
  const ip = getClientIP(request);
  
  try {
    logRequest('POST', '/api/qr/validate', { ip })
    
    // Rate limiting
    if (!checkRateLimit(ip)) {
      logger.warn('Límite de rate excedido en validación QR', { ip });
      
      const duration = Date.now() - startTime
      logResponse('POST', '/api/qr/validate', 429, duration)
      
      return NextResponse.json(
        { success: false, error: 'Too many requests' },
        { status: 429 }
      );
    }

    const body = await validarBody<{ token: string }>(request);
    const { token } = body;

    if (!token || typeof token !== 'string') {
      throw new ValidationError('token is required and must be a string')
    }

    // Opción 1: Validar sesión existente (si el cliente ya escaneó antes)
    logger.debug('Verificando si existe sesión para token', { ip })
    const existingValidation = await validateSessionByToken(token);

    if (existingValidation.valid && existingValidation.session) {
      const session = existingValidation.session;
      const table = await getTableById(session.tableId);

      if (!table) {
        logger.warn('Sesión encontrada pero mesa faltante', { 
          sessionId: session.id, 
          tableId: session.tableId 
        });
        
        const duration = Date.now() - startTime
        logResponse('POST', '/api/qr/validate', 404, duration)
        
        return NextResponse.json(
          { success: false, error: 'Table not found' },
          { status: 404 }
        );
      }

      const duration = Date.now() - startTime
      logResponse('POST', '/api/qr/validate', 200, duration)
      
      logger.info('Sesión existente validada', {
        sessionId: session.id,
        tableId: session.tableId,
        status: session.status,
        ip,
        duration: `${duration}ms`
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

      logger.info('Creando nueva sesión desde QR', { ip })
      
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
        logger.error('Sesión creada pero mesa no encontrada', undefined, {
          sessionId: session.id,
          tableId: session.tableId,
        });
        
        const duration = Date.now() - startTime
        logResponse('POST', '/api/qr/validate', 404, duration)
        
        return NextResponse.json(
          { success: false, error: 'Table not found' },
          { status: 404 }
        );
      }

      const duration = Date.now() - startTime
      logResponse('POST', '/api/qr/validate', 200, duration)
      
      // Log de auditoría SIN user agent completo (solo primeros 50 chars)
      logger.info('Nueva sesión QR creada exitosamente', {
        sessionId: session.id,
        tableId: session.tableId,
        tableNumber: session.tableNumber,
        zone: session.zone,
        ip,
        duration: `${duration}ms`
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
        logger.warn('Intento de usar token QR inválido', { ip, error: message });
        
        const duration = Date.now() - startTime
        logResponse('POST', '/api/qr/validate', 400, duration)
        
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
        logger.warn('Token QR para mesa inexistente', { ip, error: message });
        
        const duration = Date.now() - startTime
        logResponse('POST', '/api/qr/validate', 404, duration)
        
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
    const duration = Date.now() - startTime
    
    if (error instanceof ValidationError) {
      logResponse('POST', '/api/qr/validate', 400, duration)
      return NextResponse.json({ success: false, error: error.message }, { status: 400 })
    }
    
    logResponse('POST', '/api/qr/validate', 500, duration)
    logger.error('Error al validar token QR', error instanceof Error ? error : new Error(String(error)));
    
    return NextResponse.json(
      { 
        success: false,
        error: MENSAJES.ERRORES.GENERICO,
        code: SessionValidationErrorCode.SERVER_ERROR,
      },
      { status: 500 }
    );
  }
}
