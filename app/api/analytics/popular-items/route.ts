/**
 * Popular Items API Endpoint
 * 
 * GET /api/analytics/popular-items
 * Returns popular items analysis
 */

import { NextRequest, NextResponse } from 'next/server'
import { MOCK_ORDERS } from '@/lib/mock-data'
import { calculatePopularItemsAnalytics, getDateRangePreset } from '@/lib/analytics-service'
import { createLogger } from '@/lib/logger'

const logger = createLogger("analytics/popular-items")

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const preset = searchParams.get('preset') || 'last30days'
    
    // Get date range
    const dateRange = getDateRangePreset(preset)
    
    // Calculate analytics
    const analytics = calculatePopularItemsAnalytics(MOCK_ORDERS, dateRange)
    
    return NextResponse.json({
      success: true,
      data: {
        ...analytics,
        dateRange: {
          from: dateRange.from.toISOString(),
          to: dateRange.to.toISOString(),
        },
        preset,
      },
    })
  } catch (error) {
    logger.error('Error calculating popular items', error instanceof Error ? error : new Error(String(error)))
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to calculate popular items',
      },
      { status: 500 }
    )
  }
}
