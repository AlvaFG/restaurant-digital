/**
 * POST /api/auth/logout
 * 
 * Cierra la sesión del usuario actual
 */

import { createServerClient } from '@/lib/supabase/server'
import { respuestaExitosa, manejarError, logRequest, logResponse } from '@/lib/api-helpers'
import { logger } from '@/lib/logger'
import { MENSAJES } from '@/lib/i18n/mensajes'

export async function POST() {
  const startTime = Date.now()
  
  try {
    logRequest('POST', '/api/auth/logout')

    const supabase = createServerClient()

    // Obtener usuario actual antes de cerrar sesión
    const { data: { session } } = await supabase.auth.getSession()
    const userId = session?.user?.id

    if (userId) {
      logger.info('Cerrando sesión', { userId })
    }

    // Cerrar sesión en Supabase
    const { error } = await supabase.auth.signOut()

    if (error) {
      logger.error('Error al cerrar sesión en Supabase', error as Error)
      throw error
    }

    const duration = Date.now() - startTime
    logResponse('POST', '/api/auth/logout', 200, duration)

    logger.info('Sesión cerrada exitosamente', { 
      userId,
      duration: `${duration}ms`
    })

    return respuestaExitosa(null, MENSAJES.EXITOS.LOGOUT_EXITOSO || 'Sesión cerrada exitosamente')
  } catch (error) {
    const duration = Date.now() - startTime
    logResponse('POST', '/api/auth/logout', 500, duration)
    return manejarError(error, 'logout')
  }
}
