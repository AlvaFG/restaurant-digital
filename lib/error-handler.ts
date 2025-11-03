/**
 * Error Handler Utility
 * 
 * Proporciona funciones estandarizadas para manejo de errores en servicios.
 * Mejora el type safety, logging y consistencia en error handling.
 * 
 * @module error-handler
 * @version 1.0.0
 */

import { logger } from '@/lib/logger'
import { PostgrestError } from '@supabase/supabase-js'

/**
 * Tipo de retorno estándar para servicios
 */
export type ServiceResult<T> = {
  data: T | null
  error: Error | null
}

/**
 * Categorías de errores para clasificación
 */
export enum ErrorCategory {
  DATABASE = 'DATABASE',
  VALIDATION = 'VALIDATION',
  AUTHENTICATION = 'AUTHENTICATION',
  AUTHORIZATION = 'AUTHORIZATION',
  NOT_FOUND = 'NOT_FOUND',
  BUSINESS_LOGIC = 'BUSINESS_LOGIC',
  EXTERNAL_SERVICE = 'EXTERNAL_SERVICE',
  NETWORK = 'NETWORK',
  UNKNOWN = 'UNKNOWN',
}

/**
 * Error extendido con metadatos adicionales
 */
export class ServiceError extends Error {
  category: ErrorCategory
  originalError?: unknown
  context?: Record<string, unknown>
  statusCode?: number

  constructor(
    message: string,
    category: ErrorCategory = ErrorCategory.UNKNOWN,
    originalError?: unknown,
    context?: Record<string, unknown>
  ) {
    super(message)
    this.name = 'ServiceError'
    this.category = category
    this.originalError = originalError
    this.context = context

    // Asignar status code basado en categoría
    this.statusCode = this.getStatusCode(category)

    // Mantener stack trace correcto
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, ServiceError)
    }
  }

  private getStatusCode(category: ErrorCategory): number {
    switch (category) {
      case ErrorCategory.VALIDATION:
        return 400
      case ErrorCategory.AUTHENTICATION:
        return 401
      case ErrorCategory.AUTHORIZATION:
        return 403
      case ErrorCategory.NOT_FOUND:
        return 404
      case ErrorCategory.BUSINESS_LOGIC:
        return 422
      case ErrorCategory.EXTERNAL_SERVICE:
      case ErrorCategory.NETWORK:
        return 503
      case ErrorCategory.DATABASE:
      case ErrorCategory.UNKNOWN:
      default:
        return 500
    }
  }

  toJSON() {
    return {
      name: this.name,
      message: this.message,
      category: this.category,
      statusCode: this.statusCode,
      context: this.context,
    }
  }
}

/**
 * Convierte unknown error a Error tipado
 */
export function toError(error: unknown): Error {
  if (error instanceof Error) {
    return error
  }

  if (typeof error === 'string') {
    return new Error(error)
  }

  if (error && typeof error === 'object' && 'message' in error) {
    return new Error(String(error.message))
  }

  return new Error('Unknown error occurred')
}

/**
 * Detecta la categoría de un error de Supabase/Postgres
 */
function categorizePostgrestError(error: PostgrestError): ErrorCategory {
  const code = error.code

  // Códigos de violación de constraints
  if (code === '23505') return ErrorCategory.VALIDATION // unique_violation
  if (code === '23503') return ErrorCategory.VALIDATION // foreign_key_violation
  if (code === '23502') return ErrorCategory.VALIDATION // not_null_violation
  if (code === '23514') return ErrorCategory.VALIDATION // check_violation

  // Códigos de permisos/autenticación
  if (code === 'PGRST301') return ErrorCategory.AUTHENTICATION
  if (code === '42501') return ErrorCategory.AUTHORIZATION

  // No encontrado
  if (code === 'PGRST116') return ErrorCategory.NOT_FOUND

  // Por defecto, error de base de datos
  return ErrorCategory.DATABASE
}

/**
 * Detecta la categoría de cualquier error
 */
function categorizeError(error: unknown): ErrorCategory {
  // Error de Supabase
  if (error && typeof error === 'object' && 'code' in error) {
    return categorizePostgrestError(error as PostgrestError)
  }

  // Error de red
  if (error instanceof TypeError && error.message.includes('fetch')) {
    return ErrorCategory.NETWORK
  }

  // ServiceError ya categorizado
  if (error instanceof ServiceError) {
    return error.category
  }

  return ErrorCategory.UNKNOWN
}

/**
 * Maneja errores en servicios con logging y transformación consistente
 * 
 * @param context - Contexto del servicio (ej: "orders-service.createOrder")
 * @param error - Error capturado
 * @param additionalContext - Contexto adicional para logging
 * @returns ServiceResult con error transformado
 * 
 * @example
 * ```typescript
 * export async function createOrder(data: OrderInput) {
 *   try {
 *     const result = await supabase.from('orders').insert(data)
 *     if (result.error) throw result.error
 *     return { data: result.data, error: null }
 *   } catch (error) {
 *     return handleServiceError('createOrder', error, { orderId: data.id })
 *   }
 * }
 * ```
 */
export function handleServiceError<T = never>(
  context: string,
  error: unknown,
  additionalContext?: Record<string, unknown>
): ServiceResult<T> {
  const typedError = toError(error)
  const category = categorizeError(error)

  // Crear ServiceError con metadatos
  const serviceError = new ServiceError(
    typedError.message,
    category,
    error,
    additionalContext
  )

  // Log con nivel apropiado según categoría
  const logContext = {
    ...additionalContext,
    category,
    errorCode: (error as any).code,
  }

  switch (category) {
    case ErrorCategory.VALIDATION:
    case ErrorCategory.NOT_FOUND:
      // Errores esperados, log como warn
      logger.warn(`${context}: ${typedError.message}`, logContext)
      break

    case ErrorCategory.AUTHENTICATION:
    case ErrorCategory.AUTHORIZATION:
      // Errores de seguridad, log como warn (no error para no alarmar)
      logger.warn(`${context}: ${typedError.message}`, logContext)
      break

    default:
      // Errores inesperados, log como error
      logger.error(`${context}: ${typedError.message}`, typedError, logContext)
  }

  return {
    data: null,
    error: serviceError,
  }
}

/**
 * Wrapper para try/catch que retorna ServiceResult
 * Útil para funciones síncronas o cuando se prefiere un enfoque más funcional
 * 
 * @example
 * ```typescript
 * export function parseOrderData(json: string) {
 *   return tryCatch(
 *     () => JSON.parse(json),
 *     'parseOrderData',
 *     { json: json.substring(0, 50) }
 *   )
 * }
 * ```
 */
export function tryCatch<T>(
  fn: () => T,
  context: string,
  additionalContext?: Record<string, unknown>
): ServiceResult<T> {
  try {
    const result = fn()
    return { data: result, error: null }
  } catch (error) {
    return handleServiceError(context, error, additionalContext)
  }
}

/**
 * Wrapper para try/catch asíncrono que retorna ServiceResult
 * 
 * @example
 * ```typescript
 * export async function getOrder(id: string) {
 *   return await tryCatchAsync(
 *     async () => {
 *       const { data, error } = await supabase
 *         .from('orders')
 *         .select('*')
 *         .eq('id', id)
 *         .single()
 *       
 *       if (error) throw error
 *       return data
 *     },
 *     'getOrder',
 *     { orderId: id }
 *   )
 * }
 * ```
 */
export async function tryCatchAsync<T>(
  fn: () => Promise<T>,
  context: string,
  additionalContext?: Record<string, unknown>
): Promise<ServiceResult<T>> {
  try {
    const result = await fn()
    return { data: result, error: null }
  } catch (error) {
    return handleServiceError(context, error, additionalContext)
  }
}

/**
 * Verifica si un ServiceResult contiene error
 * Type guard para type narrowing
 */
export function isError<T>(result: ServiceResult<T>): result is ServiceResult<never> {
  return result.error !== null
}

/**
 * Verifica si un ServiceResult es exitoso
 * Type guard para type narrowing
 */
export function isSuccess<T>(result: ServiceResult<T>): result is { data: T; error: null } {
  return result.error === null && result.data !== null
}

/**
 * Extrae data de ServiceResult o lanza error
 * Útil cuando se está seguro de que debe haber data
 */
export function unwrap<T>(result: ServiceResult<T>): T {
  if (result.error) {
    throw result.error
  }
  if (result.data === null) {
    throw new Error('Expected data but got null')
  }
  return result.data
}

/**
 * Extrae data de ServiceResult o retorna default
 */
export function unwrapOr<T>(result: ServiceResult<T>, defaultValue: T): T {
  if (result.error || result.data === null) {
    return defaultValue
  }
  return result.data
}
