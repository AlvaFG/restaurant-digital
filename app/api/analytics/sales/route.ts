/**
 * Sales Metrics API Endpoint
 * 
 * GET /api/analytics/sales
 * Returns sales metrics for the given date range
 */

import { NextRequest, NextResponse } from 'next/server'
import { MOCK_ORDERS } from '@/lib/mock-data'
import { calculateSalesMetrics, getDateRangePreset } from '@/lib/analytics-service'
import { logRequest, logResponse } from '@/lib/api-helpers'
import { logger } from '@/lib/logger'
import { MENSAJES } from '@/lib/i18n/mensajes'

export async function GET(request: NextRequest) {
  const startTime = Date.now()
  
  try {
    const searchParams = request.nextUrl.searchParams
    const preset = searchParams.get('preset') || 'last30days'
    
    logRequest('GET', '/api/analytics/sales', { preset })
    
    // Get date range
    logger.debug('Calculando rango de fechas', { preset })
    const dateRange = getDateRangePreset(preset)
    
    // Calculate metrics
    logger.info('Calculando métricas de ventas', { 
      preset,
      dateFrom: dateRange.from.toISOString(),
      dateTo: dateRange.to.toISOString()
    })
    
    const metrics = calculateSalesMetrics(MOCK_ORDERS, dateRange)
    
    const duration = Date.now() - startTime
    logResponse('GET', '/api/analytics/sales', 200, duration)
    
    logger.info('Métricas de ventas calculadas', { 
      totalRevenue: metrics.totalRevenue,
      duration: `${duration}ms`
    })
    
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
    const duration = Date.now() - startTime
    logResponse('GET', '/api/analytics/sales', 500, duration)
    
    logger.error('Error al calcular métricas de ventas', error as Error)
    
    return NextResponse.json(
      {
        success: false,
        error: MENSAJES.ERRORES.GENERICO,
      },
      { status: 500 }
    )
  }
}
