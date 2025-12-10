import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser, createServerClient } from '@/lib/supabase/server'
import type { StaffMetrics, AnalyticsAPIResponse } from '@/lib/types/analytics-extended'
import { createLogger } from '@/lib/logger'

const logger = createLogger("analytics/staff-performance")
const ROUTE_TAG = "[api/analytics/staff-performance]"

function getTenantIdFromUser(user: { user_metadata?: { tenant_id?: string } }) {
  return user.user_metadata?.tenant_id || null
}

/**
 * GET /api/analytics/staff-performance
 * 
 * Retorna métricas de rendimiento del staff:
 * - Tiempo promedio de servicio
 * - Pedidos completados
 * - Eficiencia (pedidos por hora)
 * - Ventas totales
 * - Ticket promedio
 * - Propinas
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
    // 1. OBTENER TODOS LOS STAFF DEL TENANT
    // ============================================
    
    const { data: allStaff, error: staffError } = await supabase
      .from('users')
      .select('id, full_name, role, avatar_url')
      .eq('tenant_id', tenantId)
      .in('role', ['waiter', 'bartender', 'chef', 'manager'])
      .eq('active', true)

    if (staffError) {
      logger.error("Error fetching staff", new Error(staffError.message), { tenantId })
      throw staffError
    }

    if (!allStaff || allStaff.length === 0) {
      // No hay staff, retornar métricas vacías
      const emptyMetrics: StaffMetrics = {
        performance: [],
        dateRange: { from, to },
        summary: {
          totalStaff: 0,
          averageEfficiency: 0,
          topPerformer: {
            staffId: '',
            name: 'N/A',
            efficiency: 0
          }
        }
      }

      return NextResponse.json({
        success: true,
        data: emptyMetrics,
        metadata: {
          timestamp: new Date().toISOString(),
          cached: false,
          executionTime: Date.now() - startTime
        }
      } as AnalyticsAPIResponse<StaffMetrics>)
    }

    // ============================================
    // 2. OBTENER PEDIDOS ASIGNADOS A CADA STAFF
    // ============================================
    
    const { data: ordersData, error: ordersError } = await supabase
      .from('orders')
      .select(`
        id,
        created_at,
        updated_at,
        status,
        payment_status,
        total_cents,
        tip_cents,
        waiter_id,
        metadata,
        payments (
          created_at,
          status
        )
      `)
      .eq('tenant_id', tenantId)
      .gte('created_at', from.toISOString())
      .lte('created_at', to.toISOString())

    if (ordersError && ordersError.code !== 'PGRST116') {
      logger.error("Error fetching orders", new Error(ordersError.message), { tenantId })
    }

    // ============================================
    // 3. CALCULAR MÉTRICAS POR STAFF
    // ============================================
    
    const performance = allStaff.map((staff: any) => {
      // Filtrar pedidos de este staff member
      const staffOrders = ordersData?.filter((order: any) => 
        order.waiter_id === staff.id
      ) || []

      // Pedidos completados (pagados)
      const completedOrders = staffOrders.filter((order: any) => 
        order.payment_status === 'approved'
      )

      const ordersCompleted = completedOrders.length

      // Calcular tiempo promedio de servicio (desde creación hasta pago)
      const serviceTimes: number[] = []
      completedOrders.forEach((order: any) => {
        const startTime = new Date(order.created_at).getTime()
        const completedPayment = order.payments
          ?.filter((p: any) => p.status === 'approved')
          ?.sort((a: any, b: any) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())[0]
        
        if (completedPayment) {
          const endTime = new Date(completedPayment.created_at).getTime()
          const durationMinutes = (endTime - startTime) / (1000 * 60)
          
          // Validar duración razonable (5 min a 5 horas)
          if (durationMinutes >= 5 && durationMinutes <= 300) {
            serviceTimes.push(durationMinutes)
          }
        }
      })

      const averageServiceTime = serviceTimes.length > 0
        ? Math.round(serviceTimes.reduce((sum, time) => sum + time, 0) / serviceTimes.length)
        : 0

      // Calcular ventas totales
      const totalRevenue = completedOrders.reduce((sum, order: any) => 
        sum + (order.total_cents || 0) / 100, 0
      )

      // Ticket promedio
      const averageTicket = ordersCompleted > 0 
        ? Math.round(totalRevenue / ordersCompleted)
        : 0

      // Propinas totales
      const totalTips = completedOrders.reduce((sum, order: any) => 
        sum + (order.tip_cents || 0) / 100, 0
      )

      // Porcentaje promedio de propina
      const averageTipPercentage = totalRevenue > 0
        ? Math.round((totalTips / totalRevenue) * 100 * 10) / 10
        : 0

      // Calcular pedidos por hora (eficiencia)
      const totalHours = (to.getTime() - from.getTime()) / (1000 * 60 * 60)
      const ordersPerHour = totalHours > 0 
        ? Math.round((ordersCompleted / totalHours) * 10) / 10
        : 0

      // Score de eficiencia (0-100)
      // Basado en: pedidos completados (40%), tiempo servicio (30%), ventas (30%)
      let efficiency = 0
      
      // 40 puntos por pedidos (1 punto por cada 2 pedidos, máx 40)
      const orderScore = Math.min(ordersCompleted * 0.5, 40)
      
      // 30 puntos por tiempo de servicio (más rápido = mejor)
      // Óptimo: 30-45 minutos
      let timeScore = 0
      if (averageServiceTime > 0) {
        if (averageServiceTime >= 30 && averageServiceTime <= 45) {
          timeScore = 30
        } else if (averageServiceTime < 30) {
          timeScore = 25 // Muy rápido puede no ser bueno
        } else if (averageServiceTime <= 60) {
          timeScore = 20
        } else {
          timeScore = 10
        }
      }
      
      // 30 puntos por ventas (1 punto por cada $100, máx 30)
      const revenueScore = Math.min(totalRevenue / 100, 30)
      
      efficiency = Math.round(orderScore + timeScore + revenueScore)

      // Errores y cancelaciones
      const cancelledOrders = staffOrders.filter((order: any) => 
        order.status === 'cancelled'
      ).length
      
      const errorRate = staffOrders.length > 0
        ? Math.round((cancelledOrders / staffOrders.length) * 100 * 10) / 10
        : 0

      const cancellationRate = errorRate // Por ahora son lo mismo

      // Determinar tendencia (comparar con período anterior)
      // TODO: Implementar comparación con período anterior
      const trend: 'improving' | 'stable' | 'declining' = 'stable'

      return {
        staffId: staff.id,
        name: staff.full_name || 'Sin nombre',
        role: staff.role || 'waiter',
        avatar: staff.avatar_url,
        metrics: {
          averageServiceTime,
          ordersCompleted,
          ordersPerHour,
          efficiency,
          totalRevenue: Math.round(totalRevenue),
          averageTicket,
          totalTips: Math.round(totalTips),
          averageTipPercentage,
          errorRate,
          cancellationRate
        },
        trend,
        ranking: 0 // Se calculará después
      }
    })

    // Ordenar por eficiencia y asignar ranking
    performance.sort((a, b) => b.metrics.efficiency - a.metrics.efficiency)
    performance.forEach((staff, index) => {
      staff.ranking = index + 1
    })

    // ============================================
    // 4. CALCULAR RESUMEN
    // ============================================
    
    const totalStaff = performance.length
    const averageEfficiency = performance.length > 0
      ? Math.round(performance.reduce((sum, s) => sum + s.metrics.efficiency, 0) / performance.length)
      : 0

    const topPerformer = performance.length > 0
      ? {
          staffId: performance[0].staffId,
          name: performance[0].name,
          efficiency: performance[0].metrics.efficiency
        }
      : {
          staffId: '',
          name: 'N/A',
          efficiency: 0
        }

    // ============================================
    // CONSTRUIR RESPUESTA
    // ============================================
    
    const staffMetrics: StaffMetrics = {
      performance,
      dateRange: { from, to },
      summary: {
        totalStaff,
        averageEfficiency,
        topPerformer
      }
    }

    const response: AnalyticsAPIResponse<StaffMetrics> = {
      success: true,
      data: staffMetrics,
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

