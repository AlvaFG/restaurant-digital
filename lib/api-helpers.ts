/**
 * API Route Helpers
 * Utilidades comunes para manejar rutas API de Next.js
 */

import { NextResponse } from 'next/server'
import { logger } from './logger'
import { AppError, ValidationError, AuthenticationError, AuthorizationError, NotFoundError } from './errors'
import { MENSAJES } from './i18n/mensajes'

/**
 * Maneja errores de forma consistente en API routes
 */
export function manejarError(error: unknown, contexto?: string): NextResponse {
  // Log del error
  if (contexto) {
    logger.error(`Error en ${contexto}`, error as Error)
  } else {
    logger.error('Error en API route', error as Error)
  }

  // Si es un error de aplicación conocido
  if (error instanceof AppError) {
    return NextResponse.json(
      {
        error: {
          message: error.message,
          code: error.constructor.name,
          context: error.context,
        },
      },
      { status: error.statusCode }
    )
  }

  // Si es un error de validación
  if (error instanceof ValidationError) {
    return NextResponse.json(
      {
        error: {
          message: error.message,
          code: 'VALIDATION_ERROR',
          context: error.context,
        },
      },
      { status: 400 }
    )
  }

  // Si es un error de autenticación
  if (error instanceof AuthenticationError) {
    return NextResponse.json(
      {
        error: {
          message: error.message,
          code: 'AUTHENTICATION_ERROR',
        },
      },
      { status: 401 }
    )
  }

  // Si es un error de autorización
  if (error instanceof AuthorizationError) {
    return NextResponse.json(
      {
        error: {
          message: error.message,
          code: 'AUTHORIZATION_ERROR',
        },
      },
      { status: 403 }
    )
  }

  // Si es un error de recurso no encontrado
  if (error instanceof NotFoundError) {
    return NextResponse.json(
      {
        error: {
          message: error.message,
          code: 'NOT_FOUND',
          context: error.context,
        },
      },
      { status: 404 }
    )
  }

  // Error genérico
  return NextResponse.json(
    {
      error: {
        message: MENSAJES.ERRORES.GENERICO,
        code: 'INTERNAL_SERVER_ERROR',
      },
    },
    { status: 500 }
  )
}

/**
 * Crea una respuesta exitosa consistente
 */
export function respuestaExitosa<T>(
  data: T,
  mensaje?: string,
  status: number = 200
): NextResponse {
  const response: any = { data }
  
  if (mensaje) {
    response.message = mensaje
  }

  return NextResponse.json(response, { status })
}

/**
 * Valida el body de una request
 */
export async function validarBody<T>(
  request: Request,
  schema?: (data: any) => T
): Promise<T> {
  try {
    const body = await request.json()
    
    if (schema) {
      return schema(body)
    }
    
    return body as T
  } catch (error) {
    throw new ValidationError(MENSAJES.ERRORES.VALIDACION_FALLIDA, {
      detail: 'Cuerpo de la petición inválido'
    })
  }
}

/**
 * Valida parámetros de query string
 */
export function validarQueryParams(
  searchParams: URLSearchParams,
  required: string[] = []
): void {
  for (const param of required) {
    if (!searchParams.has(param)) {
      throw new ValidationError(
        `El parámetro '${param}' es requerido`,
        { missingParam: param }
      )
    }
  }
}

/**
 * Extrae y valida ID de los params de la ruta
 */
export function obtenerIdDeParams(
  params: any,
  nombreParam: string = 'id'
): string {
  const id = params[nombreParam]
  
  if (!id) {
    throw new ValidationError(
      MENSAJES.VALIDACIONES.CAMPO_REQUERIDO,
      { field: nombreParam }
    )
  }
  
  return id
}

/**
 * Wrapper para proteger rutas que requieren autenticación
 */
export function requiereAutenticacion(
  handler: (request: Request, context?: any) => Promise<NextResponse>
) {
  return async (request: Request, context?: any): Promise<NextResponse> => {
    try {
      // TODO: Implementar verificación de autenticación
      // Por ahora, continuamos
      // const token = request.headers.get('authorization')
      // if (!token) {
      //   throw new AuthenticationError(MENSAJES.ERRORES.NO_AUTENTICADO)
      // }
      
      return await handler(request, context)
    } catch (error) {
      return manejarError(error, 'autenticación')
    }
  }
}

/**
 * Logs de request/response para debugging
 */
export function logRequest(
  method: string,
  path: string,
  metadata?: Record<string, any>
): void {
  logger.info(`${method} ${path}`, metadata)
}

export function logResponse(
  method: string,
  path: string,
  status: number,
  duration: number
): void {
  logger.info(`${method} ${path} - ${status}`, {
    duration: `${duration}ms`,
    status
  })
}
