/**
 * Session Extension API
 * POST /api/sessions/[id]/extend
 * Extends session expiration by 30 minutes
 */

import { NextRequest, NextResponse } from 'next/server';
import { extendSession } from '@/lib/server/session-manager';
import { logger } from '@/lib/logger';

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const sessionId = params.id;
    
    const session = await extendSession(sessionId);

    logger.info('[session-extend] Session extended', {
      sessionId,
      tableId: session.tableId,
      tableNumber: session.tableNumber,
      newExpiresAt: session.expiresAt.toISOString(),
    });

    return NextResponse.json({
      success: true,
      message: 'Session extended successfully',
      session,
    });
  } catch (error) {
    logger.error('[session-extend] Failed to extend session', error instanceof Error ? error : new Error(String(error)));
    
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to extend session',
      },
      { status: 500 }
    );
  }
}
