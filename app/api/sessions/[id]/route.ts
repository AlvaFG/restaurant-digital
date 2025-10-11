/**
 * Session Management API
 * DELETE /api/sessions/[id] - Close a session
 * GET /api/sessions/[id] - Get session details
 */

import { NextRequest, NextResponse } from 'next/server';
import { closeSession, getSession } from '@/lib/server/session-manager';
import { logger } from '@/lib/logger';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const sessionId = params.id;
    const session = getSession(sessionId);

    if (!session) {
      return NextResponse.json(
        {
          success: false,
          error: 'Session not found',
        },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      session,
    });
  } catch (error) {
    logger.error('[session-get] Failed to retrieve session', error instanceof Error ? error : new Error(String(error)));
    
    return NextResponse.json(
      {
        success: false,
        error: 'Internal server error',
      },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const sessionId = params.id;
    
    const session = await closeSession(sessionId);

    logger.info('[session-close] Session closed', {
      sessionId,
      tableId: session.tableId,
      tableNumber: session.tableNumber,
    });

    return NextResponse.json({
      success: true,
      message: 'Session closed successfully',
      session,
    });
  } catch (error) {
    logger.error('[session-close] Failed to close session', error instanceof Error ? error : new Error(String(error)));
    
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to close session',
      },
      { status: 500 }
    );
  }
}
