/**
 * Sistema de Errores Personalizados
 * Clases de error tipadas para diferentes escenarios
 */

/**
 * Clase base para errores de la aplicación
 */
export class AppError extends Error {
  public readonly statusCode: number;
  public readonly isOperational: boolean;
  public readonly context?: Record<string, unknown>;

  constructor(
    message: string,
    statusCode: number = 500,
    isOperational: boolean = true,
    context?: Record<string, unknown>
  ) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = isOperational;
    this.context = context;
    this.name = this.constructor.name;
    Error.captureStackTrace(this, this.constructor);
  }
}

/**
 * Error de validación (400)
 */
export class ValidationError extends AppError {
  constructor(message: string, context?: Record<string, unknown>) {
    super(message, 400, true, context);
  }
}

/**
 * Error de autenticación (401)
 */
export class AuthenticationError extends AppError {
  constructor(message: string = 'No autenticado', context?: Record<string, unknown>) {
    super(message, 401, true, context);
  }
}

/**
 * Error de autorización (403)
 */
export class AuthorizationError extends AppError {
  constructor(message: string = 'No autorizado', context?: Record<string, unknown>) {
    super(message, 403, true, context);
  }
}

/**
 * Error de recurso no encontrado (404)
 */
export class NotFoundError extends AppError {
  constructor(message: string, resource?: string, context?: Record<string, unknown>) {
    super(
      message,
      404,
      true,
      resource ? { ...context, resource } : context
    );
  }
}

/**
 * Error de conflicto (409)
 */
export class ConflictError extends AppError {
  constructor(message: string, context?: Record<string, unknown>) {
    super(message, 409, true, context);
  }
}

/**
 * Error de base de datos
 */
export class DatabaseError extends AppError {
  constructor(message: string, context?: Record<string, unknown>) {
    super(message, 500, true, context);
  }
}

/**
 * Error de servicio externo (502)
 */
export class ExternalServiceError extends AppError {
  constructor(
    message: string,
    serviceName?: string,
    context?: Record<string, unknown>
  ) {
    super(
      message,
      502,
      true,
      serviceName ? { ...context, service: serviceName } : context
    );
  }
}

/**
 * Error de timeout (504)
 */
export class TimeoutError extends AppError {
  constructor(message: string = 'La operación tardó demasiado tiempo', context?: Record<string, unknown>) {
    super(message, 504, true, context);
  }
}

/**
 * Verifica si un error es operacional (esperado)
 */
export const isOperationalError = (error: Error): boolean => {
  if (error instanceof AppError) {
    return error.isOperational;
  }
  return false;
};

/**
 * Convierte un error desconocido en AppError
 */
export const toAppError = (error: unknown): AppError => {
  if (error instanceof AppError) {
    return error;
  }

  if (error instanceof Error) {
    return new AppError(error.message, 500, false);
  }

  if (typeof error === 'string') {
    return new AppError(error, 500, false);
  }

  return new AppError('Error desconocido', 500, false);
};
