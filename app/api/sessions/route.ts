/**
 * Sessions API
 * GET /api/sessions
 * Returns all active sessions with details
 */

import { NextResponse } from 'next/server';
import { getAllSessions } from '@/lib/server/session-manager';
import { logger } from '@/lib/logger';

export async function GET() {
  try {
    const sessions = getAllSessions();

    logger.info('[sessions] Retrieved all sessions', {
      count: sessions.length,
    });

    return NextResponse.json({
      success: true,
      sessions,
      count: sessions.length,
    });
  } catch (error) {
    logger.error('[sessions] Failed to retrieve sessions', error instanceof Error ? error : new Error(String(error)));
    
    return NextResponse.json(
      {
        success: false,
        error: 'Internal server error',
        sessions: [],
        count: 0,
      },
      { status: 500 }
    );
  }
}
