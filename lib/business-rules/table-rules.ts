/**
 * Table Business Rules
 * 
 * Reglas de negocio para validar operaciones relacionadas con mesas.
 * Centraliza toda la lógica de validación para mantener consistencia.
 */

import type { Database } from '@/lib/supabase/database.types'
import { TABLE_STATE } from '@/lib/table-states'

type Table = Database['public']['Tables']['tables']['Row']
type User = Database['public']['Tables']['users']['Row']

// =============================================
// Types
// =============================================

export interface ValidationResult {
  valid: boolean
  error?: string
  code?: string
}

export interface OrderCreationContext {
  partySize?: number
  estimatedDuration?: number
  specialRequests?: string[]
  source?: 'staff' | 'qr' | 'kiosk'
}

export interface StatusTransitionContext {
  reason?: string
  force?: boolean // Admin puede forzar transición
  orderId?: string
}

// =============================================
// Configuración de Reglas
// =============================================

const BUSINESS_RULES_CONFIG = {
  // Horarios de operación
  OPERATING_HOURS: {
    OPEN: 11, // 11:00 AM
    CLOSE: 23, // 11:00 PM
  },

  // Límites de pedidos
  MAX_ACTIVE_ORDERS_PER_TABLE: 3,
  MAX_ITEMS_PER_ORDER: 50,

  // Tiempos estimados (minutos)
  ESTIMATED_SERVICE_TIME: 45,
  MAX_TABLE_OCCUPATION_TIME: 180, // 3 horas

  // Capacidad
  MIN_PARTY_SIZE: 1,
  MAX_PARTY_SIZE: 20,

  // Estados bloqueados para ciertos actions
  BLOCKED_FOR_NEW_ORDERS: ['cuenta_solicitada', 'pago_confirmado'] as const,
  BLOCKED_FOR_MODIFICATIONS: ['pago_confirmado'] as const,
}

// Transiciones válidas entre estados
const VALID_TRANSITIONS: Record<string, string[]> = {
  [TABLE_STATE.FREE]: [TABLE_STATE.OCCUPIED, TABLE_STATE.ORDER_IN_PROGRESS],
  [TABLE_STATE.OCCUPIED]: [TABLE_STATE.ORDER_IN_PROGRESS, TABLE_STATE.FREE],
  [TABLE_STATE.ORDER_IN_PROGRESS]: [TABLE_STATE.BILL_REQUESTED, TABLE_STATE.FREE],
  [TABLE_STATE.BILL_REQUESTED]: [TABLE_STATE.PAYMENT_CONFIRMED],
  [TABLE_STATE.PAYMENT_CONFIRMED]: [TABLE_STATE.FREE],
}

// =============================================
// Clase Principal de Reglas de Negocio
// =============================================

export class TableBusinessRules {
  /**
   * Valida si se puede crear un pedido para una mesa
   */
  static validateOrderCreation(
    table: Table,
    user: User | null,
    context: OrderCreationContext = {}
  ): ValidationResult {
    // 1. Validar horario de operación
    const hourCheck = this.checkOperatingHours()
    if (!hourCheck.valid) return hourCheck

    // 2. Validar disponibilidad de mesa
    const availabilityCheck = this.checkTableAvailability(table)
    if (!availabilityCheck.valid) return availabilityCheck

    // 3. Validar capacidad si se especifica party size
    if (context.partySize) {
      const capacityCheck = this.checkTableCapacity(table, context.partySize)
      if (!capacityCheck.valid) return capacityCheck
    }

    // 4. Validar límite de pedidos activos
    // Esta validación se hará en el servicio con query a la DB

    // 5. Validar permisos de usuario para casos especiales
    if (table.status === TABLE_STATE.BILL_REQUESTED && user?.role !== 'admin') {
      return {
        valid: false,
        error: 'Solo administradores pueden crear pedidos adicionales después de solicitar la cuenta.',
        code: 'PERMISSION_DENIED'
      }
    }

    return { valid: true }
  }

  /**
   * Valida si se puede cambiar el estado de una mesa
   */
  static validateStatusTransition(
    currentStatus: string,
    newStatus: string,
    user: User | null,
    context: StatusTransitionContext = {}
  ): ValidationResult {
    // Si es forzado por admin, permitir cualquier transición
    if (context.force && user?.role === 'admin') {
      return { valid: true }
    }

    // Validar que la transición es válida según las reglas
    const validTransitions = VALID_TRANSITIONS[currentStatus] || []

    if (!validTransitions.includes(newStatus)) {
      return {
        valid: false,
        error: `No se puede cambiar de "${currentStatus}" a "${newStatus}". Transición no permitida.`,
        code: 'INVALID_TRANSITION'
      }
    }

    return { valid: true }
  }

  /**
   * Verifica si el restaurante está operando
   */
  static checkOperatingHours(): ValidationResult {
    // Permitir bypass de validación de horarios en desarrollo
    if (process.env.NEXT_PUBLIC_SKIP_HOURS_VALIDATION === '1') {
      console.log('[TableBusinessRules] Validación de horarios desactivada (desarrollo)')
      return { valid: true }
    }

    const now = new Date()
    const currentHour = now.getHours()
    const currentDay = now.getDay() // 0 = Domingo, 6 = Sábado

    // Verificar si es día de la semana (lunes a viernes)
    const isWeekday = currentDay >= 1 && currentDay <= 5

    // Verificar horario
    const isOpen = 
      currentHour >= BUSINESS_RULES_CONFIG.OPERATING_HOURS.OPEN && 
      currentHour < BUSINESS_RULES_CONFIG.OPERATING_HOURS.CLOSE

    if (!isOpen) {
      return {
        valid: false,
        error: `El restaurante está cerrado. Horario: ${BUSINESS_RULES_CONFIG.OPERATING_HOURS.OPEN}:00 - ${BUSINESS_RULES_CONFIG.OPERATING_HOURS.CLOSE}:00`,
        code: 'OUTSIDE_OPERATING_HOURS'
      }
    }

    return { valid: true }
  }

  /**
   * Verifica disponibilidad de mesa según su estado
   */
  static checkTableAvailability(table: Table): ValidationResult {
    // Estados bloqueados para nuevos pedidos
    if (BUSINESS_RULES_CONFIG.BLOCKED_FOR_NEW_ORDERS.includes(table.status as any)) {
      return {
        valid: false,
        error: `No se pueden crear pedidos para una mesa en estado "${table.status}". Por favor, procesa primero la transacción actual.`,
        code: 'TABLE_STATUS_BLOCKED'
      }
    }

    return { valid: true }
  }

  /**
   * Verifica si la mesa tiene capacidad suficiente
   */
  static checkTableCapacity(table: Table, partySize: number): ValidationResult {
    if (partySize < BUSINESS_RULES_CONFIG.MIN_PARTY_SIZE) {
      return {
        valid: false,
        error: `El tamaño del grupo debe ser al menos ${BUSINESS_RULES_CONFIG.MIN_PARTY_SIZE} persona.`,
        code: 'PARTY_SIZE_TOO_SMALL'
      }
    }

    if (partySize > BUSINESS_RULES_CONFIG.MAX_PARTY_SIZE) {
      return {
        valid: false,
        error: `El tamaño máximo del grupo es ${BUSINESS_RULES_CONFIG.MAX_PARTY_SIZE} personas. Por favor, divida la reserva.`,
        code: 'PARTY_SIZE_TOO_LARGE'
      }
    }

    if (partySize > table.capacity) {
      return {
        valid: false,
        error: `La mesa ${table.number} tiene capacidad para ${table.capacity} personas. No puede acomodar ${partySize} comensales.`,
        code: 'INSUFFICIENT_CAPACITY'
      }
    }

    // Advertencia si está cerca del límite (80% de capacidad)
    const utilizationPercent = (partySize / table.capacity) * 100
    if (utilizationPercent > 80) {
      // Este es un warning, no un error - retorna válido pero podrías loggearlo
      console.warn(`Mesa ${table.number} estará al ${utilizationPercent.toFixed(0)}% de capacidad`)
    }

    return { valid: true }
  }

  /**
   * Valida permisos de usuario para una acción
   */
  static checkUserPermissions(
    user: User | null,
    action: 'create_order' | 'modify_order' | 'change_status' | 'view_reports',
    table?: Table
  ): ValidationResult {
    if (!user) {
      return {
        valid: false,
        error: 'Usuario no autenticado.',
        code: 'NOT_AUTHENTICATED'
      }
    }

    // Admin puede hacer todo
    if (user.role === 'admin') {
      return { valid: true }
    }

    // Staff puede crear pedidos y cambiar estados básicos
    if (user.role === 'staff') {
      if (action === 'view_reports') {
        return {
          valid: false,
          error: 'No tienes permisos para ver reportes.',
          code: 'INSUFFICIENT_PERMISSIONS'
        }
      }
      return { valid: true }
    }

    // Otros roles no pueden hacer operaciones críticas
    return {
      valid: false,
      error: 'No tienes permisos suficientes para esta acción.',
      code: 'INSUFFICIENT_PERMISSIONS'
    }
  }

  /**
   * Valida que el pedido no exceda límites
   */
  static validateOrderLimits(
    itemsCount: number,
    orderTotal: number
  ): ValidationResult {
    if (itemsCount > BUSINESS_RULES_CONFIG.MAX_ITEMS_PER_ORDER) {
      return {
        valid: false,
        error: `El pedido no puede tener más de ${BUSINESS_RULES_CONFIG.MAX_ITEMS_PER_ORDER} items. Por favor, divide el pedido.`,
        code: 'TOO_MANY_ITEMS'
      }
    }

    // Validar monto mínimo (opcional)
    const MIN_ORDER_AMOUNT = 100 // centavos
    if (orderTotal < MIN_ORDER_AMOUNT) {
      return {
        valid: false,
        error: 'El monto mínimo del pedido es $1.00',
        code: 'ORDER_AMOUNT_TOO_LOW'
      }
    }

    // Validar monto máximo (prevenir errores)
    const MAX_ORDER_AMOUNT = 10000000 // $100,000
    if (orderTotal > MAX_ORDER_AMOUNT) {
      return {
        valid: false,
        error: 'El monto del pedido excede el límite permitido. Por favor, verifica los valores.',
        code: 'ORDER_AMOUNT_TOO_HIGH'
      }
    }

    return { valid: true }
  }

  /**
   * Verifica si una mesa puede ser liberada
   */
  static canReleaseTable(table: Table, hasActiveOrders: boolean): ValidationResult {
    if (hasActiveOrders) {
      return {
        valid: false,
        error: `La mesa ${table.number} tiene pedidos activos. Completa o cancela los pedidos antes de liberar la mesa.`,
        code: 'HAS_ACTIVE_ORDERS'
      }
    }

    if (table.status === TABLE_STATE.BILL_REQUESTED) {
      return {
        valid: false,
        error: `La cuenta ha sido solicitada. Por favor, procesa el pago antes de liberar la mesa.`,
        code: 'BILL_PENDING'
      }
    }

    return { valid: true }
  }

  /**
   * Obtiene recomendación de acción según estado de mesa
   */
  static getRecommendedAction(table: Table): string {
    switch (table.status) {
      case TABLE_STATE.FREE:
        return 'Mesa disponible - Puede ser asignada a clientes'
      
      case TABLE_STATE.OCCUPIED:
        return 'Clientes sentados - Toma el pedido'
      
      case TABLE_STATE.ORDER_IN_PROGRESS:
        return 'Pedido activo - Monitorea preparación y entrega'
      
      case TABLE_STATE.BILL_REQUESTED:
        return 'Cuenta solicitada - Procesa el pago'
      
      case TABLE_STATE.PAYMENT_CONFIRMED:
        return 'Pago confirmado - Libera la mesa'
      
      default:
        return 'Estado desconocido'
    }
  }

  /**
   * Calcula tiempo estimado de servicio
   */
  static estimateServiceTime(itemsCount: number): number {
    // Tiempo base + tiempo por item
    const baseTime = 15 // minutos
    const timePerItem = 2 // minutos por item
    
    return Math.min(
      baseTime + (itemsCount * timePerItem),
      BUSINESS_RULES_CONFIG.MAX_TABLE_OCCUPATION_TIME
    )
  }
}

// =============================================
// Funciones de Ayuda
// =============================================

/**
 * Combina múltiples validaciones
 */
export function combineValidations(...results: ValidationResult[]): ValidationResult {
  for (const result of results) {
    if (!result.valid) {
      return result
    }
  }
  return { valid: true }
}

/**
 * Verifica si una validación falló
 */
export function hasValidationError(result: ValidationResult): boolean {
  return !result.valid
}

/**
 * Obtiene mensaje de error de validación
 */
export function getValidationError(result: ValidationResult): string {
  return result.error || 'Validación fallida'
}

export default TableBusinessRules
