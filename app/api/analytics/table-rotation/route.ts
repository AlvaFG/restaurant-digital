import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser, createServerClient } from '@/lib/supabase/server'
import type { TableRotation, AnalyticsAPIResponse } from '@/lib/types/analytics-extended'
import { createLogger } from '@/lib/logger'

const logger = createLogger("analytics/table-rotation")
const ROUTE_TAG = "[api/analytics/table-rotation]"

function getTenantIdFromUser(user: { user_metadata?: { tenant_id?: string } }) {
  return user.user_metadata?.tenant_id || null
}

/**
 * GET /api/analytics/table-rotation
 * 
 * Retorna métricas de rotación de mesas:
 * - Duración promedio de sesión
 * - Rotaciones por mesa
 * - Horas pico de ocupación
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

    const supabase = await createServerClient()

    // Obtener parámetros de búsqueda
    const searchParams = request.nextUrl.searchParams
    const fromParam = searchParams.get('from')
    const toParam = searchParams.get('to')

    // Calcular fechas
    const now = new Date()
    const to = toParam ? new Date(toParam) : now
    const from = fromParam ? new Date(fromParam) : new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000) // 7 días atrás por defecto

    // ============================================
    // 1. DURACION PROMEDIO DE SESION
    // ============================================
    // Una sesión es desde que se ocupa la mesa hasta que se paga
    // Usamos created_at (inicio pedido) y updated_at del pago
    
    const { data: completedOrders, error: ordersError } = await supabase
      .from('orders')
      .select(`
        created_at,
        updated_at,
        table_id,
        payments (
          created_at,
          status
        )
      `)
      .eq('tenant_id', tenantId)
      .eq('payment_status', 'approved')
      .gte('created_at', from.toISOString())
      .lte('created_at', to.toISOString())
      .not('table_id', 'is', null)

    if (ordersError && ordersError.code !== 'PGRST116') {
      logger.error("Error fetching completed orders", new Error(ordersError.message), { tenantId })
    }

    // Calcular duración de cada sesión (en minutos)
    const sessionDurations: number[] = []
    
    completedOrders?.forEach((order: any) => {
      const startTime = new Date(order.created_at).getTime()
      
      // Buscar el pago completado más reciente
      const completedPayment = order.payments
        ?.filter((p: any) => p.status === 'approved')
        ?.sort((a: any, b: any) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())[0]
      
      if (completedPayment) {
        const endTime = new Date(completedPayment.created_at).getTime()
        const durationMinutes = (endTime - startTime) / (1000 * 60)
        
        // Validar que sea una duración razonable (entre 5 minutos y 5 horas)
        if (durationMinutes >= 5 && durationMinutes <= 300) {
          sessionDurations.push(durationMinutes)
        }
      }
    })

    const averageSessionDuration = sessionDurations.length > 0
      ? Math.round(sessionDurations.reduce((sum, dur) => sum + dur, 0) / sessionDurations.length)
      : 0

    // ============================================
    // 2. ROTACIONES POR MESA
    // ============================================
    // Contar cuántas veces se usó cada mesa en el período
    
    const { data: allOrders, error: allOrdersError } = await supabase
      .from('orders')
      .select('table_id, created_at')
      .eq('tenant_id', tenantId)
      .eq('payment_status', 'approved')
      .gte('created_at', from.toISOString())
      .lte('created_at', to.toISOString())
      .not('table_id', 'is', null)

    if (allOrdersError && allOrdersError.code !== 'PGRST116') {
      logger.error("Error fetching all orders", new Error(allOrdersError.message), { tenantId })
    }

    // Contar rotaciones por mesa
    const tableRotations = new Map<string, number>()
    allOrders?.forEach((order: any) => {
      if (order.table_id) {
        tableRotations.set(
          order.table_id,
          (tableRotations.get(order.table_id) || 0) + 1
        )
      }
    })

    const totalRotations = Array.from(tableRotations.values()).reduce((sum, count) => sum + count, 0)
    const uniqueTables = tableRotations.size
    const rotationsPerTable = uniqueTables > 0 ? Math.round((totalRotations / uniqueTables) * 10) / 10 : 0

    // ============================================
    // 3. HORAS PICO DE OCUPACION
    // ============================================
    // Analizar por hora del día cuándo hay más ocupación
    
    // Primero, obtener todas las mesas del tenant
    const { data: allTables, error: tablesError } = await supabase
      .from('tables')
      .select('id')
      .eq('tenant_id', tenantId)

    if (tablesError) {
      logger.error("Error fetching tables", new Error(tablesError.message), { tenantId })
    }

    const totalTablesCount = allTables?.length || 1 // Evitar división por cero

    // Contar pedidos por hora
    const hourlyActivity = new Map<string, { orders: number, tables: Set<string> }>()
    
    allOrders?.forEach((order: any) => {
      const orderDate = new Date(order.created_at)
      const hour = `${orderDate.getHours().toString().padStart(2, '0')}:00`
      
      if (!hourlyActivity.has(hour)) {
        hourlyActivity.set(hour, { orders: 0, tables: new Set() })
      }
      
      const activity = hourlyActivity.get(hour)!
      activity.orders += 1
      if (order.table_id) {
        activity.tables.add(order.table_id)
      }
    })

    // Convertir a array y calcular ocupación
    const peakHours = Array.from(hourlyActivity.entries())
      .map(([hour, activity]) => ({
        hour,
        occupancy: Math.round((activity.tables.size / totalTablesCount) * 100),
        rotations: activity.orders
      }))
      .sort((a, b) => b.occupancy - a.occupancy) // Ordenar por ocupación descendente
      .slice(0, 24) // Máximo 24 horas

    // Ordenar por hora para presentación
    const peakHoursSorted = peakHours.sort((a, b) => {
      const hourA = parseInt(a.hour.split(':')[0])
      const hourB = parseInt(b.hour.split(':')[0])
      return hourA - hourB
    })

    // ============================================
    // CONSTRUIR RESPUESTA
    // ============================================
    
    const tableRotationMetrics: TableRotation = {
      averageSessionDuration,
      rotationsPerTable,
      totalRotations,
      peakHours: peakHoursSorted.length > 0 ? peakHoursSorted : [
        { hour: '12:00', occupancy: 0, rotations: 0 },
        { hour: '13:00', occupancy: 0, rotations: 0 },
        { hour: '14:00', occupancy: 0, rotations: 0 }
      ]
    }

    const response: AnalyticsAPIResponse<TableRotation> = {
      success: true,
      data: tableRotationMetrics,
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

