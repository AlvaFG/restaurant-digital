/**
 * Revenue Analytics API Endpoint
 * 
 * GET /api/analytics/revenue
 * Returns revenue analytics including daily trends, category breakdown, etc.
 */

import { NextRequest, NextResponse } from 'next/server'
import { MOCK_ORDERS } from '@/lib/mock-data'
import { calculateRevenueAnalytics, getDateRangePreset } from '@/lib/analytics-service'
import { logRequest, logResponse } from '@/lib/api-helpers'
import { logger } from '@/lib/logger'
import { MENSAJES } from '@/lib/i18n/mensajes'

export async function GET(request: NextRequest) {
  const startTime = Date.now()
  
  try {
    const searchParams = request.nextUrl.searchParams
    const preset = searchParams.get('preset') || 'last30days'
    
    logRequest('GET', '/api/analytics/revenue', { preset })
    
    // Get date range
    logger.debug('Calculando rango de fechas para ingresos', { preset })
    const dateRange = getDateRangePreset(preset)
    
    // Calculate analytics
    logger.info('Calculando análisis de ingresos', { 
      preset,
      dateFrom: dateRange.from.toISOString(),
      dateTo: dateRange.to.toISOString()
    })
    
    const analytics = calculateRevenueAnalytics(MOCK_ORDERS, dateRange)
    
    const duration = Date.now() - startTime
    logResponse('GET', '/api/analytics/revenue', 200, duration)
    
    logger.info('Análisis de ingresos calculado', { 
      duration: `${duration}ms`
    })
    
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
    const duration = Date.now() - startTime
    logResponse('GET', '/api/analytics/revenue', 500, duration)
    
    logger.error('Error al calcular análisis de ingresos', error as Error)
    
    return NextResponse.json(
      {
        success: false,
        error: MENSAJES.ERRORES.GENERICO,
      },
      { status: 500 }
    )
  }
}
