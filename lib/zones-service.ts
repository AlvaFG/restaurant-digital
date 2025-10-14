/**
 * Zones Service - Client Side
 *
 * Funciones para gestionar zonas desde el cliente.
 */

import type { Zone } from "@/lib/mock-data"
import { logger } from './logger'
import { AppError, ValidationError } from './errors'
import { MENSAJES } from './i18n/mensajes'

type ZonesResponse = {
  data: Zone[]
}

type ZoneResponse = {
  data: Zone
}

async function fetchJSON<T>(input: RequestInfo, init?: RequestInit): Promise<T> {
  try {
    const response = await fetch(input, {
      cache: 'no-store',
      ...init,
      headers: {
        'Content-Type': 'application/json',
        ...(init?.headers ?? {}),
      },
    })

    if (!response.ok) {
      const text = await response.text().catch(() => '')
      let message = 'Error en la solicitud'

      if (text) {
        try {
          const parsed = JSON.parse(text)
          message = parsed.error ?? message
        } catch {
          message = text
        }
      }

      logger.error('Error en fetchJSON', undefined, {
        url: input.toString(),
        status: response.status,
        statusText: response.statusText,
        message,
      })

      throw new AppError(message, response.status)
    }

    return (await response.json()) as T
  } catch (error) {
    if (error instanceof AppError) {
      throw error
    }

    logger.error('Error inesperado en fetchJSON', error as Error, {
      url: input.toString(),
    })
    throw new AppError(MENSAJES.ERRORES.GENERICO)
  }
}

/**
 * Obtiene todas las zonas del usuario actual.
 */
export async function fetchZones(): Promise<Zone[]> {
  try {
    console.log('[fetchZones] Iniciando petición a /api/zones...')
    logger.debug('Obteniendo zonas disponibles')
    const result = await fetchJSON<ZonesResponse>('/api/zones')
    console.log('[fetchZones] ✅ Respuesta recibida:', {
      hasData: !!result.data,
      count: result.data.length,
      zones: result.data,
    })
    logger.info('Zonas obtenidas', { count: result.data.length })
    return result.data
  } catch (error) {
    console.error('[fetchZones] ❌ Error:', error)
    logger.error('Error al obtener zonas', error as Error)
    throw error instanceof AppError ? error : new AppError(MENSAJES.ERRORES.GENERICO)
  }
}

/**
 * Obtiene una zona por ID.
 */
export async function fetchZone(zoneId: string): Promise<Zone> {
  if (!zoneId) {
    throw new ValidationError('El identificador de la zona es obligatorio', {
      field: 'zoneId',
    })
  }

  try {
    const result = await fetchJSON<ZoneResponse>(`/api/zones/${zoneId}`)
    return result.data
  } catch (error) {
    logger.error('Error al cargar zona', error as Error, { zoneId })
    throw error instanceof AppError ? error : new AppError(MENSAJES.ERRORES.GENERICO)
  }
}

interface CreateZonePayload {
  name: string
  active?: boolean
}

/**
 * Crea una nueva zona.
 */
export async function createZone(payload: CreateZonePayload): Promise<Zone> {
  const { name, active } = payload

  if (!name || name.trim().length === 0) {
    throw new ValidationError('El nombre de la zona es obligatorio', {
      field: 'name',
    })
  }

  try {
    const result = await fetchJSON<ZoneResponse>('/api/zones', {
      method: 'POST',
      body: JSON.stringify({ name: name.trim(), active }),
    })

    logger.info('Zona creada desde cliente', { zoneId: result.data.id })
    return result.data
  } catch (error) {
    logger.error('Error al crear zona', error as Error, { name })
    throw error instanceof AppError ? error : new AppError(MENSAJES.ERRORES.GENERICO)
  }
}

interface UpdateZonePayload {
  name?: string
  active?: boolean
}

/**
 * Actualiza una zona existente.
 */
export async function updateZone(
  zoneId: string,
  updates: UpdateZonePayload,
): Promise<Zone> {
  if (!zoneId) {
    throw new ValidationError('El identificador de la zona es obligatorio', {
      field: 'zoneId',
    })
  }

  if (updates.name !== undefined && updates.name.trim().length === 0) {
    throw new ValidationError('El nombre de la zona no puede quedar vacio', {
      field: 'name',
    })
  }

  try {
    const result = await fetchJSON<ZoneResponse>(`/api/zones/${zoneId}`, {
      method: 'PATCH',
      body: JSON.stringify({
        ...(updates.name !== undefined ? { name: updates.name.trim() } : {}),
        ...(updates.active !== undefined ? { active: updates.active } : {}),
      }),
    })

    logger.info('Zona actualizada desde cliente', {
      zoneId,
      fields: Object.keys(updates),
    })

    return result.data
  } catch (error) {
    logger.error('Error al actualizar zona', error as Error, {
      zoneId,
      updates,
    })
    throw error instanceof AppError ? error : new AppError(MENSAJES.ERRORES.GENERICO)
  }
}

/**
 * Elimina una zona.
 */
export async function deleteZone(zoneId: string): Promise<void> {
  if (!zoneId) {
    throw new ValidationError('El identificador de la zona es obligatorio', {
      field: 'zoneId',
    })
  }

  try {
    await fetchJSON(`/api/zones/${zoneId}`, { method: 'DELETE' })
    logger.info('Zona eliminada desde cliente', { zoneId })
  } catch (error) {
    logger.error('Error al eliminar zona', error as Error, { zoneId })
    throw error instanceof AppError ? error : new AppError(MENSAJES.ERRORES.GENERICO)
  }
}



