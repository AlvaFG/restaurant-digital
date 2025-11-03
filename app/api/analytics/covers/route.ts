import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser, createServerClient } from '@/lib/supabase/server'
import type { CoversServed, AnalyticsAPIResponse } from '@/lib/types/analytics-extended'
import { createLogger } from '@/lib/logger'

const logger = createLogger("analytics/covers")
const ROUTE_TAG = "[api/analytics/covers]"

function getTenantIdFromUser(user: { user_metadata?: { tenant_id?: string } }) {
  return user.user_metadata?.tenant_id || null
}

/**
 * GET /api/analytics/covers
 * 
 * Retorna métricas avanzadas de cubiertos servidos:
 * - Hoy, esta semana, este mes, este año
 * - Tendencia y cambio porcentual
 * - Datos por día para gráficos
 * 
 * Query params:
 * - from: fecha inicio (ISO) opcional
 * - to: fecha fin (ISO) opcional
 */
export async function GET(request: NextRequest) {
  const startTime = Date.now()

  try {
    // Obtener usuario actual
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json(
        {
          success: false,
          error: { code: 'UNAUTHORIZED', message: 'No autenticado' }
        } as AnalyticsAPIResponse<null>,
        { status: 401 }
      )
    }

    // Obtener tenant_id del usuario
    const tenantId = getTenantIdFromUser(user)
    if (!tenantId) {
      return NextResponse.json(
        {
          success: false,
          error: { code: 'FORBIDDEN', message: 'Usuario sin tenant asignado' }
        } as AnalyticsAPIResponse<null>,
        { status: 403 }
      )
    }

    const supabase = createServerClient()

    // Obtener parámetros de búsqueda
    const searchParams = request.nextUrl.searchParams
    const fromParam = searchParams.get('from')
    const toParam = searchParams.get('to')

    // Calcular fechas
    const now = new Date()
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
    const to = toParam ? new Date(toParam) : now
    const from = fromParam ? new Date(fromParam) : new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000) // 30 días atrás

    // Calcular inicio de semana (lunes)
    const startOfWeek = new Date(today)
    const day = startOfWeek.getDay()
    const diff = startOfWeek.getDate() - day + (day === 0 ? -6 : 1) // ajustar cuando es domingo
    startOfWeek.setDate(diff)
    startOfWeek.setHours(0, 0, 0, 0)

    // Calcular inicio de mes
    const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1)

    // Calcular inicio de año
    const startOfYear = new Date(today.getFullYear(), 0, 1)

    // Query para contar cubiertos (personas en pedidos completados)
    // Los cubiertos están en metadata.guests o metadata.covers
    
    // CUBIERTOS HOY
    const { data: todayData, error: todayError } = await supabase
      .from('orders')
      .select('metadata')
      .eq('tenant_id', tenantId)
      .gte('created_at', today.toISOString())
      .eq('payment_status', 'approved')
    
    if (todayError && todayError.code !== 'PGRST116') { // Ignorar "no rows" error
      logger.error("Error fetching today data", new Error(todayError.message), { tenantId })
    }
    
    const todayCovers = todayData?.reduce((sum: number, order: any) => {
      const covers = order.metadata?.guests || order.metadata?.covers || 1
      return sum + covers
    }, 0) || 0

    // CUBIERTOS ESTA SEMANA
    const { data: weekData, error: weekError } = await supabase
      .from('orders')
      .select('metadata')
      .eq('tenant_id', tenantId)
      .gte('created_at', startOfWeek.toISOString())
      .eq('payment_status', 'approved')
    
    if (weekError && weekError.code !== 'PGRST116') {
      logger.error("Error fetching week data", new Error(weekError.message), { tenantId })
    }
    
    const thisWeekCovers = weekData?.reduce((sum: number, order: any) => {
      const covers = order.metadata?.guests || order.metadata?.covers || 1
      return sum + covers
    }, 0) || 0

    // CUBIERTOS ESTE MES
    const { data: monthData, error: monthError } = await supabase
      .from('orders')
      .select('metadata')
      .eq('tenant_id', tenantId)
      .gte('created_at', startOfMonth.toISOString())
      .eq('payment_status', 'approved')
    
    if (monthError && monthError.code !== 'PGRST116') {
      logger.error("Error fetching month data", new Error(monthError.message), { tenantId })
    }
    
    const thisMonthCovers = monthData?.reduce((sum: number, order: any) => {
      const covers = order.metadata?.guests || order.metadata?.covers || 1
      return sum + covers
    }, 0) || 0

    // CUBIERTOS ESTE AÑO
    const { data: yearData, error: yearError } = await supabase
      .from('orders')
      .select('metadata')
      .eq('tenant_id', tenantId)
      .gte('created_at', startOfYear.toISOString())
      .eq('payment_status', 'approved')
    
    if (yearError && yearError.code !== 'PGRST116') {
      logger.error("Error fetching year data", new Error(yearError.message), { tenantId })
    }
    
    const thisYearCovers = yearData?.reduce((sum: number, order: any) => {
      const covers = order.metadata?.guests || order.metadata?.covers || 1
      return sum + covers
    }, 0) || 0

    // CUBIERTOS MES ANTERIOR (para comparación)
    const previousMonth = new Date(startOfMonth)
    previousMonth.setMonth(previousMonth.getMonth() - 1)

    const { data: prevMonthData } = await supabase
      .from('orders')
      .select('metadata')
      .eq('tenant_id', tenantId)
      .gte('created_at', previousMonth.toISOString())
      .lt('created_at', startOfMonth.toISOString())
      .eq('payment_status', 'approved')
    
    const prevMonthCovers = prevMonthData?.reduce((sum: number, order: any) => {
      const covers = order.metadata?.guests || order.metadata?.covers || 1
      return sum + covers
    }, 0) || 0

    // Calcular tendencia
    let trend: 'up' | 'down' | 'stable' = 'stable'
    let percentageChange = 0
    
    if (prevMonthCovers > 0) {
      percentageChange = ((thisMonthCovers - prevMonthCovers) / prevMonthCovers) * 100
      if (percentageChange > 5) trend = 'up'
      else if (percentageChange < -5) trend = 'down'
    } else if (thisMonthCovers > 0) {
      trend = 'up'
      percentageChange = 100
    }

    // DATOS POR DÍA (últimos 30 días o rango personalizado)
    const { data: dailyData, error: dailyError } = await supabase
      .from('orders')
      .select('created_at, metadata')
      .eq('tenant_id', tenantId)
      .gte('created_at', from.toISOString())
      .lte('created_at', to.toISOString())
      .eq('payment_status', 'approved')
      .order('created_at', { ascending: true })

    if (dailyError && dailyError.code !== 'PGRST116') {
      logger.error("Error fetching daily data", new Error(dailyError.message), { tenantId, from: from.toISOString(), to: to.toISOString() })
    }

    // Agrupar por día
    const byDayMap = new Map<string, number>()
    
    dailyData?.forEach((order: any) => {
      const date = new Date(order.created_at)
      const dateKey = date.toISOString().split('T')[0]
      const current = byDayMap.get(dateKey) || 0
      const covers = order.metadata?.guests || order.metadata?.covers || 1
      byDayMap.set(dateKey, current + covers)
    })

    // Convertir a array y ordenar
    const byDay = Array.from(byDayMap.entries())
      .map(([date, count]) => ({ date, count }))
      .sort((a, b) => a.date.localeCompare(b.date))

    // Construir respuesta
    const coversServed: CoversServed = {
      today: todayCovers,
      thisWeek: thisWeekCovers,
      thisMonth: thisMonthCovers,
      thisYear: thisYearCovers,
      trend,
      percentageChange: Math.round(percentageChange * 100) / 100,
      byDay
    }

    const response: AnalyticsAPIResponse<CoversServed> = {
      success: true,
      data: coversServed,
      metadata: {
        timestamp: new Date().toISOString(),
        cached: false,
        executionTime: Date.now() - startTime
      }
    }

    return NextResponse.json(response)

  } catch (error) {
    logger.error("Internal error", error instanceof Error ? error : new Error(String(error)))
    
    const response: AnalyticsAPIResponse<null> = {
      success: false,
      data: null,
      error: {
        code: 'INTERNAL_ERROR',
        message: error instanceof Error ? error.message : 'Error interno del servidor'
      },
      metadata: {
        timestamp: new Date().toISOString(),
        cached: false,
        executionTime: Date.now() - startTime
      }
    }

    return NextResponse.json(response, { status: 500 })
  }
}