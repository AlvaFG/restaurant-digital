/**
 * Sessions API
 * GET /api/sessions
 * Returns all active sessions with details
 */

import { NextResponse } from 'next/server';
import { getAllSessions } from '@/lib/server/session-manager';
import { logger } from '@/lib/logger';
import { logRequest, logResponse } from '@/lib/api-helpers';
import { MENSAJES } from '@/lib/i18n/mensajes';

export async function GET() {
  const startTime = Date.now()
  
  try {
    logRequest('GET', '/api/sessions')
    
    const sessions = getAllSessions();

    const duration = Date.now() - startTime
    logResponse('GET', '/api/sessions', 200, duration)
    
    logger.info('Sesiones obtenidas', {
      count: sessions.length,
      duration: `${duration}ms`
    });

    return NextResponse.json({
      success: true,
      sessions,
      count: sessions.length,
    });
  } catch (error) {
    const duration = Date.now() - startTime
    logResponse('GET', '/api/sessions', 500, duration)
    
    logger.error('Error al obtener sesiones', error instanceof Error ? error : new Error(String(error)));
    
    return NextResponse.json(
      {
        success: false,
        error: MENSAJES.ERRORES.GENERICO,
        sessions: [],
        count: 0,
      },
      { status: 500 }
    );
  }
}
