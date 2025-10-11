/**
 * QR Usage Analytics API Endpoint
 * 
 * GET /api/analytics/qr-usage
 * Returns QR code usage statistics
 */

import { NextRequest, NextResponse } from 'next/server'
import { MOCK_ORDERS } from '@/lib/mock-data'
import { calculateQrUsageMetrics, getDateRangePreset } from '@/lib/analytics-service'

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const preset = searchParams.get('preset') || 'last30days'
    
    // Get date range
    const dateRange = getDateRangePreset(preset)
    
    // Calculate metrics
    const metrics = calculateQrUsageMetrics(MOCK_ORDERS, dateRange)
    
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
    console.error('Error calculating QR usage metrics:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to calculate QR usage metrics',
      },
      { status: 500 }
    )
  }
}
