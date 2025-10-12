/**
 * Zones Service - Client Side
 * 
 * Funciones para gestionar zonas desde el cliente
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
      cache: "no-store",
      ...init,
      headers: {
        "Content-Type": "application/json",
        ...(init?.headers ?? {}),
      },
    })

    if (!response.ok) {
      const errorText = await response.text().catch(() => '')
      let errorMessage = 'Error en la solicitud'
      
      try {
        const errorData = JSON.parse(errorText)
        errorMessage = errorData.error || errorMessage
      } catch {
        errorMessage = errorText || errorMessage
      }
      
      logger.error('Error en fetchJSON', undefined, { 
        url: input.toString(), 
        status: response.status,
        statusText: response.statusText,
        errorText 
      })
      
      throw new AppError(errorMessage, response.status)
    }

    return (await response.json()) as T
  } catch (error) {
    if (error instanceof AppError) {
      throw error
    }
    
    logger.error('Error inesperado en fetchJSON', error as Error, { url: input.toString() })
    throw new AppError(MENSAJES.ERRORES.GENERICO)
  }
}

/**
 * Obtiene todas las zonas del tenant actual
 */
export async function fetchZones(): Promise<Zone[]> {
  try {
    logger.debug('Obteniendo zonas')
    const result = await fetchJSON<ZonesResponse>("/api/zones")
    logger.info('Zonas obtenidas exitosamente', { count: result.data.length })
    return result.data
  } catch (error) {
    logger.error('Error al obtener zonas', error as Error)
    throw error instanceof AppError ? error : new AppError(MENSAJES.ERRORES.GENERICO)
  }
}

/**
 * Obtiene una zona por ID
 */
export async function fetchZone(zoneId: string): Promise<Zone> {
  try {
    logger.debug('Obteniendo zona', { zoneId })
    
    if (!zoneId) {
      throw new ValidationError('El ID de la zona es requerido', { field: 'zoneId' })
    }
    
    const result = await fetchJSON<ZoneResponse>(`/api/zones/${zoneId}`)
    logger.info('Zona obtenida exitosamente', { zoneId })
    return result.data
  } catch (error) {
    logger.error('Error al obtener zona', error as Error, { zoneId })
    throw error instanceof AppError ? error : new AppError(MENSAJES.ERRORES.GENERICO)
  }
}

/**
 * Crea una nueva zona
 */
export async function createZone(data: {
  name: string
  description?: string
  sort_order?: number
  active?: boolean
}): Promise<Zone> {
  try {
    logger.info('Creando nueva zona', { name: data.name })
    
    if (!data.name || data.name.trim().length === 0) {
      throw new ValidationError('El nombre de la zona es requerido', { field: 'name' })
    }
    
    const result = await fetchJSON<ZoneResponse>('/api/zones', {
      method: 'POST',
      body: JSON.stringify(data),
    })
    
    logger.info('Zona creada exitosamente', { zoneId: result.data.id, name: result.data.name })
    return result.data
  } catch (error) {
    logger.error('Error al crear zona', error as Error, { name: data.name })
    throw error instanceof AppError ? error : new AppError(MENSAJES.ERRORES.GENERICO)
  }
}

/**
 * Actualiza una zona existente
 */
export async function updateZone(
  zoneId: string,
  updates: Partial<Pick<Zone, 'name' | 'description' | 'sort_order' | 'active'>>
): Promise<Zone> {
  try {
    logger.info('Actualizando zona', { zoneId, updates: Object.keys(updates) })
    
    if (!zoneId) {
      throw new ValidationError('El ID de la zona es requerido', { field: 'zoneId' })
    }
    
    const result = await fetchJSON<ZoneResponse>(`/api/zones/${zoneId}`, {
      method: 'PATCH',
      body: JSON.stringify(updates),
    })
    
    logger.info('Zona actualizada exitosamente', { zoneId })
    return result.data
  } catch (error) {
    logger.error('Error al actualizar zona', error as Error, { zoneId })
    throw error instanceof AppError ? error : new AppError(MENSAJES.ERRORES.GENERICO)
  }
}

/**
 * Elimina una zona
 */
export async function deleteZone(zoneId: string): Promise<void> {
  try {
    logger.info('Eliminando zona', { zoneId })
    
    if (!zoneId) {
      throw new ValidationError('El ID de la zona es requerido', { field: 'zoneId' })
    }
    
    await fetchJSON(`/api/zones/${zoneId}`, {
      method: 'DELETE',
    })
    
    logger.info('Zona eliminada exitosamente', { zoneId })
  } catch (error) {
    logger.error('Error al eliminar zona', error as Error, { zoneId })
    throw error instanceof AppError ? error : new AppError(MENSAJES.ERRORES.GENERICO)
  }
}
