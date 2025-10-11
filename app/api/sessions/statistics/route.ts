/**
 * Sessions Statistics API
 * GET /api/sessions/statistics
 * Returns session statistics and metrics
 */

import { NextResponse } from 'next/server';
import { getStatistics } from '@/lib/server/session-manager';
import { logger } from '@/lib/logger';

export async function GET() {
  try {
    const statistics = getStatistics();

    logger.debug('[sessions-statistics] Retrieved statistics', {
      totalActive: statistics.totalActive,
      todayTotal: statistics.todayTotal,
    });

    return NextResponse.json({
      success: true,
      statistics,
    });
  } catch (error) {
    logger.error('[sessions-statistics] Failed to retrieve statistics', error instanceof Error ? error : new Error(String(error)));
    
    return NextResponse.json(
      {
        success: false,
        error: 'Internal server error',
        statistics: null,
      },
      { status: 500 }
    );
  }
}
