import { createServerClient } from "@/lib/supabase/server"
import { logger } from "@/lib/logger"
import { MENSAJES } from "@/lib/i18n/mensajes"

export interface DashboardMetrics {
  dailySales: number
  averageTicket: number
  occupancyRate: number
  activeAlerts: number
  totalCovers: number // Cubiertos del día
  occupiedTables: number
  totalTables: number
  tablesByStatus: Record<string, number>
  topDishes: Array<{
    name: string
    orders: number
    revenue: number
  }>
}

interface CoverItem {
  quantity: number | null
}

interface TopDishRow {
  name: string
  quantity: number
  total_cents: number
}

/**
 * Obtiene las métricas del dashboard desde Supabase
 */
export async function getDashboardMetrics(tenantId: string): Promise<DashboardMetrics> {
  const startTime = Date.now()
  logger.debug("Obteniendo métricas del dashboard", { tenantId })

  try {
    const supabase = await createServerClient()

    // Fecha de inicio del día (00:00:00)
    const startOfDay = new Date()
    startOfDay.setHours(0, 0, 0, 0)

    // 1. Obtener ventas del día
    const { data: ordersData, error: ordersError } = await supabase
      .from("orders")
      .select("total_cents, subtotal_cents, created_at")
      .eq("tenant_id", tenantId)
      .gte("created_at", startOfDay.toISOString())
      .in("status", ["servido", "pagado"])

    if (ordersError) {
      logger.error("Error al obtener ventas del día", ordersError, { tenantId })
      throw new Error(MENSAJES.ERRORES.GENERICO)
    }

    const dailySales =
      ordersData?.reduce((sum: number, order: { total_cents: number }) => sum + order.total_cents, 0) || 0
    const orderCount = ordersData?.length || 0
    const averageTicket = orderCount > 0 ? Math.round(dailySales / orderCount) : 0

    // 2. Obtener cubiertos del día (suma de quantity de order_items del día)
    const { data: coversData, error: coversError } = await supabase
      .from("order_items")
      .select(`
        quantity,
        order_id,
        orders!inner(created_at, tenant_id, status)
      `)
      .eq("orders.tenant_id", tenantId)
      .gte("orders.created_at", startOfDay.toISOString())
      .in("orders.status", ["servido", "pagado"])

    if (coversError) {
      logger.error("Error al obtener cubiertos del día", coversError, { tenantId })
      throw new Error(MENSAJES.ERRORES.GENERICO)
    }

    const totalCovers = coversData?.reduce((sum: number, item: CoverItem) => sum + (item.quantity ?? 0), 0) || 0

    // 3. Obtener estado de mesas
    const { data: tablesData, error: tablesError } = await supabase
      .from("tables")
      .select("id, number, status, capacity")
      .eq("tenant_id", tenantId)

    if (tablesError) {
      logger.error("Error al obtener mesas", tablesError, { tenantId })
      throw new Error(MENSAJES.ERRORES.GENERICO)
    }

    const totalTables = tablesData?.length || 0
    const occupiedTables =
      tablesData?.filter((t: { status: string }) => t.status === "ocupada").length || 0
    const occupancyRate = totalTables > 0 ? Math.round((occupiedTables / totalTables) * 100) : 0

    // Distribución por estado
    const tablesByStatus =
      tablesData?.reduce(
        (acc: Record<string, number>, table: { status: string }) => {
          acc[table.status] = (acc[table.status] || 0) + 1
          return acc
        },
        {} as Record<string, number>,
      ) || {}

    // 4. Obtener platos más pedidos del día
    const { data: topDishesData, error: topDishesError } = await supabase
      .from("order_items")
      .select(`
        name,
        quantity,
        total_cents,
        menu_item_id,
        orders!inner(created_at, tenant_id, status)
      `)
      .eq("orders.tenant_id", tenantId)
      .gte("orders.created_at", startOfDay.toISOString())
      .in("orders.status", ["servido", "pagado"])

    if (topDishesError) {
      logger.error("Error al obtener platos más pedidos", topDishesError, { tenantId })
    }

    // Agrupar por plato
    const dishMap = new Map<
      string,
      {
        name: string
        orders: number
        revenue: number
      }
    >()

    topDishesData?.forEach((item: TopDishRow) => {
      const key = item.name
      const existing = dishMap.get(key)

      if (existing) {
        existing.orders += item.quantity
        existing.revenue += item.total_cents
      } else {
        dishMap.set(key, {
          name: item.name,
          orders: item.quantity,
          revenue: item.total_cents,
        })
      }
    })

    const topDishes = Array.from(dishMap.values())
      .sort((a, b) => b.orders - a.orders)
      .slice(0, 5)

    // 5. Contar alertas activas (simulado por ahora, puedes agregar tabla de alerts)
    const activeAlerts = 0 // TODO: Implementar cuando tengas tabla de alertas

    const duration = Date.now() - startTime
    logger.info("Métricas del dashboard obtenidas exitosamente", {
      tenantId,
      dailySales: dailySales / 100,
      averageTicket: averageTicket / 100,
      totalCovers,
      occupancyRate,
      duration: `${duration}ms`,
    })

    return {
      dailySales: Math.round(dailySales / 100), // Convertir de centavos a pesos
      averageTicket: Math.round(averageTicket / 100),
      occupancyRate,
      activeAlerts,
      totalCovers,
      occupiedTables,
      totalTables,
      tablesByStatus,
      topDishes: topDishes.map((dish) => ({
        ...dish,
        revenue: Math.round(dish.revenue / 100),
      })),
    }
  } catch (error) {
    logger.error("Error al obtener métricas del dashboard", error as Error, { tenantId })
    throw error
  }
}

/**
 * Obtiene las alertas activas (por implementar)
 */
export async function getActiveAlerts(_tenantId: string) {
  // TODO: Implementar cuando tengas tabla de alertas en Supabase
  return []
}
