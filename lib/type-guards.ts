/**
 * Type Guards and Type Transformers
 * 
 * Utilidades para validar y transformar tipos entre Supabase DB y Application types.
 * Resuelve discrepancias comunes como null vs undefined, string vs union types, etc.
 */

import type { Database } from './supabase/database.types'

// ============================================
// Table Status Type Guards
// ============================================

export type TableStatus = 'libre' | 'ocupada' | 'pedido_en_curso' | 'cuenta_solicitada' | 'pago_confirmado'

const VALID_TABLE_STATUSES: TableStatus[] = [
  'libre',
  'ocupada', 
  'pedido_en_curso',
  'cuenta_solicitada',
  'pago_confirmado'
]

/**
 * Valida si un string es un TableStatus válido
 */
export function isValidTableStatus(status: string): status is TableStatus {
  return VALID_TABLE_STATUSES.includes(status as TableStatus)
}

/**
 * Convierte un string de DB a TableStatus, con fallback seguro
 */
export function toTableStatus(status: string | null | undefined): TableStatus {
  if (!status) return 'libre'
  if (isValidTableStatus(status)) return status
  
  console.warn(`Invalid table status: ${status}, defaulting to 'libre'`)
  return 'libre'
}

// ============================================
// Zone Type Transformers
// ============================================

type DbZone = Database['public']['Tables']['zones']['Row']
type DbZonePartial = Pick<DbZone, 'id' | 'name' | 'description'>

/**
 * Normaliza zone de cualquier formato a string | undefined
 */
export function normalizeTableZone(zone: string | DbZonePartial | null | undefined): string | undefined {
  if (!zone) return undefined
  if (typeof zone === 'string') return zone
  return zone.name || undefined
}

/**
 * Normaliza zone_id (null → undefined)
 */
export function normalizeZoneId(zoneId: string | null | undefined): string | undefined {
  return zoneId || undefined
}

/**
 * Extrae zone name de objeto zone
 */
export function getZoneName(zone: string | { name: string } | null | undefined): string {
  if (!zone) return 'Sin zona'
  if (typeof zone === 'string') return zone
  return zone.name || 'Sin zona'
}

// ============================================
// Table Type Transformers
// ============================================

/**
 * Normaliza table number (asegura que sea string)
 */
export function normalizeTableNumber(number: string | number | null | undefined): string {
  if (number === null || number === undefined) return '0'
  return String(number)
}

/**
 * Normaliza table capacity
 */
export function normalizeTableCapacity(capacity: number | null | undefined): number {
  return capacity ?? 4 // Default 4 seats
}

/**
 * Convierte tabla de Supabase a formato de aplicación
 */
export function transformSupabaseTable(
  table: Database['public']['Tables']['tables']['Row'] & { zone?: any }
) {
  return {
    id: table.id,
    number: normalizeTableNumber(table.number),
    zone_id: normalizeZoneId(table.zone_id),
    zone: normalizeTableZone(table.zone),
    status: toTableStatus(table.status),
    seats: normalizeTableCapacity(table.capacity),
    capacity: normalizeTableCapacity(table.capacity),
    qrcodeUrl: table.qrcode_url || undefined,
    qrToken: table.qr_token || undefined,
    qrTokenExpiry: table.qr_expires_at ? new Date(table.qr_expires_at) : undefined,
    covers: {
      current: 0,
      total: 0,
      sessions: 0,
      lastUpdatedAt: null,
      lastSessionAt: null,
    },
  }
}

// ============================================
// Order Status Type Guards
// ============================================

export type OrderStatus = 'abierto' | 'preparando' | 'listo' | 'entregado' | 'cerrado' | 'cancelado'

const VALID_ORDER_STATUSES: OrderStatus[] = [
  'abierto',
  'preparando',
  'listo',
  'entregado',
  'cerrado',
  'cancelado'
]

/**
 * Valida si un string es un OrderStatus válido
 */
export function isValidOrderStatus(status: string): status is OrderStatus {
  return VALID_ORDER_STATUSES.includes(status as OrderStatus)
}

/**
 * Convierte un string de DB a OrderStatus, con fallback seguro
 */
export function toOrderStatus(status: string | null | undefined): OrderStatus {
  if (!status) return 'abierto'
  if (isValidOrderStatus(status)) return status
  
  console.warn(`Invalid order status: ${status}, defaulting to 'abierto'`)
  return 'abierto'
}

// ============================================
// Payment Status Type Guards
// ============================================

export type PaymentStatus = 'pendiente' | 'pagado' | 'cancelado' | 'reembolsado'

const VALID_PAYMENT_STATUSES: PaymentStatus[] = [
  'pendiente',
  'pagado',
  'cancelado',
  'reembolsado'
]

/**
 * Valida si un string es un PaymentStatus válido
 */
export function isValidPaymentStatus(status: string): status is PaymentStatus {
  return VALID_PAYMENT_STATUSES.includes(status as PaymentStatus)
}

/**
 * Convierte un string de DB a PaymentStatus, con fallback seguro
 */
export function toPaymentStatus(status: string | null | undefined): PaymentStatus {
  if (!status) return 'pendiente'
  if (isValidPaymentStatus(status)) return status
  
  console.warn(`Invalid payment status: ${status}, defaulting to 'pendiente'`)
  return 'pendiente'
}

// ============================================
// Alert Type Type Guards
// ============================================

export type AlertType = 'llamar_mozo' | 'pedido_entrante' | 'quiere_pagar_efectivo' | 'pago_aprobado'

const VALID_ALERT_TYPES: AlertType[] = [
  'llamar_mozo',
  'pedido_entrante',
  'quiere_pagar_efectivo',
  'pago_aprobado'
]

/**
 * Valida si un string es un AlertType válido
 */
export function isValidAlertType(type: string): type is AlertType {
  return VALID_ALERT_TYPES.includes(type as AlertType)
}

/**
 * Convierte un string de DB a AlertType, con fallback seguro
 */
export function toAlertType(type: string | null | undefined): AlertType {
  if (!type) return 'llamar_mozo'
  if (isValidAlertType(type)) return type
  
  console.warn(`Invalid alert type: ${type}, defaulting to 'llamar_mozo'`)
  return 'llamar_mozo'
}

// ============================================
// Null/Undefined Normalizers
// ============================================

/**
 * Convierte null a undefined (común en Supabase)
 */
export function nullToUndefined<T>(value: T | null | undefined): T | undefined {
  return value === null ? undefined : value
}

/**
 * Convierte undefined a null (para enviar a Supabase)
 */
export function undefinedToNull<T>(value: T | null | undefined): T | null {
  return value === undefined ? null : value
}

/**
 * Normaliza string opcional
 */
export function normalizeString(value: string | null | undefined): string | undefined {
  if (!value || value.trim() === '') return undefined
  return value.trim()
}

/**
 * Normaliza número opcional
 */
export function normalizeNumber(value: number | null | undefined): number | undefined {
  if (value === null || value === undefined) return undefined
  return Number(value)
}

// ============================================
// JSON/Metadata Helpers
// ============================================

/**
 * Parse JSON seguro
 */
export function safeJsonParse<T>(json: string | null | undefined, defaultValue: T): T {
  if (!json) return defaultValue
  try {
    return JSON.parse(json) as T
  } catch (error) {
    console.warn('Failed to parse JSON:', error)
    return defaultValue
  }
}

/**
 * Stringify JSON seguro
 */
export function safeJsonStringify(value: unknown): string | null {
  try {
    return JSON.stringify(value)
  } catch (error) {
    console.warn('Failed to stringify JSON:', error)
    return null
  }
}

// ============================================
// Date Helpers
// ============================================

/**
 * Convierte string ISO a Date, con fallback
 */
export function toDate(value: string | null | undefined): Date | undefined {
  if (!value) return undefined
  try {
    const date = new Date(value)
    return isNaN(date.getTime()) ? undefined : date
  } catch {
    return undefined
  }
}

/**
 * Convierte Date a string ISO para DB
 */
export function toISOString(date: Date | null | undefined): string | null {
  if (!date || !(date instanceof Date)) return null
  try {
    return date.toISOString()
  } catch {
    return null
  }
}
