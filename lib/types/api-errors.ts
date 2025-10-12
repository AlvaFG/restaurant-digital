/**
 * API Error Types
 * 
 * Tipos específicos para manejo de errores en API routes.
 * Reemplaza el uso de 'any' en bloques catch.
 * 
 * @module lib/types/api-errors
 */

/**
 * Error base de API
 */
export interface ApiError {
  message: string
  code?: string
  statusCode?: number
  details?: unknown
}

/**
 * Error de validación
 */
export interface ValidationError extends ApiError {
  code: 'VALIDATION_ERROR'
  field?: string
  validationErrors?: Record<string, string>
}

/**
 * Error de autenticación
 */
export interface AuthError extends ApiError {
  code: 'AUTH_ERROR' | 'UNAUTHORIZED' | 'FORBIDDEN'
  statusCode: 401 | 403
}

/**
 * Error de base de datos
 */
export interface DatabaseError extends ApiError {
  code: 'DATABASE_ERROR'
  operation?: 'SELECT' | 'INSERT' | 'UPDATE' | 'DELETE'
  table?: string
}

/**
 * Error de servicio externo
 */
export interface ExternalServiceError extends ApiError {
  code: 'EXTERNAL_SERVICE_ERROR'
  service?: string
  statusCode?: number
}

/**
 * Error no encontrado
 */
export interface NotFoundError extends ApiError {
  code: 'NOT_FOUND'
  statusCode: 404
  resource?: string
}

/**
 * Type guard para verificar si un error es de tipo Error
 */
export function isError(error: unknown): error is Error {
  return error instanceof Error
}

/**
 * Type guard para verificar si un error tiene código
 */
export function hasErrorCode(error: unknown): error is { code: string } {
  return typeof error === 'object' && error !== null && 'code' in error
}

/**
 * Type guard para verificar si un error tiene mensaje
 */
export function hasErrorMessage(error: unknown): error is { message: string } {
  return typeof error === 'object' && error !== null && 'message' in error
}

/**
 * Convertir cualquier error a ApiError
 */
export function toApiError(error: unknown): ApiError {
  // Si ya es un Error con mensaje
  if (isError(error)) {
    return {
      message: error.message,
      code: hasErrorCode(error) ? error.code : 'UNKNOWN_ERROR',
      details: error,
    }
  }

  // Si es un objeto con mensaje
  if (hasErrorMessage(error)) {
    return {
      message: error.message,
      code: hasErrorCode(error) ? error.code : 'UNKNOWN_ERROR',
      details: error,
    }
  }

  // Si es un string
  if (typeof error === 'string') {
    return {
      message: error,
      code: 'UNKNOWN_ERROR',
    }
  }

  // Fallback para cualquier otro tipo
  return {
    message: 'An unknown error occurred',
    code: 'UNKNOWN_ERROR',
    details: error,
  }
}

/**
 * Crear error de validación
 */
export function createValidationError(
  message: string,
  field?: string,
  validationErrors?: Record<string, string>
): ValidationError {
  return {
    message,
    code: 'VALIDATION_ERROR',
    field,
    validationErrors,
  }
}

/**
 * Crear error de autenticación
 */
export function createAuthError(
  message: string,
  type: 'AUTH_ERROR' | 'UNAUTHORIZED' | 'FORBIDDEN' = 'UNAUTHORIZED'
): AuthError {
  return {
    message,
    code: type,
    statusCode: type === 'FORBIDDEN' ? 403 : 401,
  }
}

/**
 * Crear error de base de datos
 */
export function createDatabaseError(
  message: string,
  operation?: DatabaseError['operation'],
  table?: string
): DatabaseError {
  return {
    message,
    code: 'DATABASE_ERROR',
    operation,
    table,
  }
}

/**
 * Crear error de servicio externo
 */
export function createExternalServiceError(
  message: string,
  service?: string,
  statusCode?: number
): ExternalServiceError {
  return {
    message,
    code: 'EXTERNAL_SERVICE_ERROR',
    service,
    statusCode,
  }
}

/**
 * Crear error not found
 */
export function createNotFoundError(message: string, resource?: string): NotFoundError {
  return {
    message,
    code: 'NOT_FOUND',
    statusCode: 404,
    resource,
  }
}
