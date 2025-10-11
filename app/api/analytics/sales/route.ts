/**
 * Sales Metrics API Endpoint
 * 
 * GET /api/analytics/sales
 * Returns sales metrics for the given date range
 */

import { NextRequest, NextResponse } from 'next/server'
import { MOCK_ORDERS } from '@/lib/mock-data'
import { calculateSalesMetrics, getDateRangePreset } from '@/lib/analytics-service'

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const preset = searchParams.get('preset') || 'last30days'
    
    // Get date range
    const dateRange = getDateRangePreset(preset)
    
    // Calculate metrics
    const metrics = calculateSalesMetrics(MOCK_ORDERS, dateRange)
    
    return NextResponse.json({
      success: true,
      data: {
        ...metrics,
        dateRange: {
          from: dateRange.from.toISOString(),
          to: dateRange.to.toISOString(),
        },
        preset,
      },
    })
  } catch (error) {
    console.error('Error calculating sales metrics:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to calculate sales metrics',
      },
      { status: 500 }
    )
  }
}
