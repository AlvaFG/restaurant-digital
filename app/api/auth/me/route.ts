/**
 * GET /api/auth/me
 *
 * Obtiene la información del usuario autenticado actual.
 * Acepta token Bearer para evitar problemas de sincronización de cookies
 * y usa Service Role para bypassear RLS al resolver datos del tenant.
 */

import { createServerClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { respuestaExitosa, manejarError, logRequest, logResponse } from '@/lib/api-helpers'
import { AuthenticationError } from '@/lib/errors'
import { logger } from '@/lib/logger'

export async function GET(request: Request) {
  const startTime = Date.now()

  try {
    logRequest('GET', '/api/auth/me')
    logger.debug('Iniciando obtención de datos del usuario')

    const adminClient = createAdminClient()
    let authUser = null

    const authHeader = request.headers.get('authorization') ?? request.headers.get('Authorization')
    if (authHeader?.toLowerCase().startsWith('bearer ')) {
      const token = authHeader.slice(7).trim()
      if (token) {
        const { data: tokenData, error: tokenError } = await adminClient.auth.getUser(token)
        if (tokenError) {
          logger.warn('[auth/me] Token Bearer inválido', { error: tokenError.message })
        } else if (tokenData?.user) {
          authUser = tokenData.user
        }
      }
    }

    if (!authUser) {
      const supabase = await createServerClient()
      const { data: { session }, error: sessionError } = await supabase.auth.getSession()

      logger.debug('Estado de sesión vía cookies', {
        hasSession: !!session,
        error: sessionError?.message,
        userId: session?.user?.id,
      })

      if (sessionError || !session) {
        throw new AuthenticationError('No hay sesión activa')
      }

      authUser = session.user
    }

    logger.debug('Resolviendo usuario en tabla users', { userId: authUser.id })

    const { data: userRow, error: userError } = await adminClient
      .from('users')
      .select(`
        id,
        name,
        email,
        role,
        active,
        tenant_id,
        last_login_at,
        tenants:tenants (
          id,
          name,
          slug,
          settings
        )
      `)
      .eq('id', authUser.id)
      .eq('active', true)
      .single()

    if (userError || !userRow) {
      logger.error('Usuario no encontrado en tabla users', userError as Error, {
        authUserId: authUser.id,
      })
      throw new AuthenticationError('Usuario no encontrado')
    }

    const tenantData = userRow.tenants
    if (!tenantData) {
      logger.error('Tenant no encontrado para usuario', new Error('tenant_missing'), {
        tenantId: userRow.tenant_id,
      })
      throw new AuthenticationError('Configuración de tenant no encontrada')
    }

    const tenantSettings = (tenantData.settings || {}) as {
      logoUrl?: string
      theme?: { accentColor?: string }
      features?: { tablets?: boolean; kds?: boolean; payments?: boolean }
    }

    const user = {
      id: userRow.id,
      name: userRow.name,
      email: userRow.email,
      role: userRow.role,
      active: userRow.active,
      tenant_id: userRow.tenant_id,
      last_login_at: userRow.last_login_at,
    }

    const tenant = {
      id: tenantData.id,
      name: tenantData.name,
      slug: tenantData.slug,
      logoUrl: tenantSettings.logoUrl,
      theme: {
        accentColor: tenantSettings.theme?.accentColor || '#3b82f6',
      },
      features: {
        tablets: tenantSettings.features?.tablets ?? true,
        kds: tenantSettings.features?.kds ?? true,
        payments: tenantSettings.features?.payments ?? true,
      },
    }

    const duration = Date.now() - startTime
    logger.info('Datos obtenidos exitosamente', {
      userId: user.id,
      tenantId: tenant.id,
      duration: `${duration}ms`,
    })
    logResponse('GET', '/api/auth/me', 200, duration)

    return respuestaExitosa({ user, tenant })
  } catch (error) {
    const duration = Date.now() - startTime
    logger.error('Error obteniendo datos del usuario', error instanceof Error ? error : new Error(String(error)))
    logResponse('GET', '/api/auth/me', error instanceof AuthenticationError ? 401 : 500, duration)
    return manejarError(error, 'get-current-user')
  }
}
