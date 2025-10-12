/**
 * GET /api/auth/me
 * 
 * Obtiene la información del usuario autenticado actual
 * Usa Service Role para bypassear RLS en la búsqueda del tenant
 */

import { createServerClient, createServiceRoleClient } from '@/lib/supabase/server'
import { respuestaExitosa, manejarError, logRequest, logResponse } from '@/lib/api-helpers'
import { AuthenticationError } from '@/lib/errors'
import { logger } from '@/lib/logger'

export async function GET() {
  const startTime = Date.now()
  
  try {
    logRequest('GET', '/api/auth/me')
    console.log('🔍 [/api/auth/me] Iniciando obtención de datos del usuario...')

    const supabase = createServerClient()

    // Obtener usuario de la sesión de Supabase
    const { data: { session }, error: sessionError } = await supabase.auth.getSession()

    console.log('🔍 [/api/auth/me] Estado de sesión:', { 
      hasSession: !!session, 
      error: sessionError?.message,
      userId: session?.user?.id 
    })

    if (sessionError || !session) {
      console.error('❌ [/api/auth/me] No hay sesión activa:', sessionError?.message)
      throw new AuthenticationError('No hay sesión activa')
    }

    const authUser = session.user

    console.log('🔍 [/api/auth/me] Buscando usuario en tabla users:', authUser.id)

    // Buscar datos completos del usuario en la tabla users
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('*')
      .eq('id', authUser.id)
      .eq('active', true)
      .single()

    console.log('🔍 [/api/auth/me] Resultado de búsqueda de usuario:', { 
      found: !!userData, 
      error: userError?.message 
    })

    if (userError || !userData) {
      console.error('❌ [/api/auth/me] Usuario no encontrado en tabla users:', userError?.message)
      logger.error('Usuario no encontrado en tabla users', userError as Error, { 
        authUserId: authUser.id 
      })
      throw new AuthenticationError('Usuario no encontrado')
    }

    interface UserData {
      id: string
      name: string
      email: string
      role: string
      active: boolean
      tenant_id: string
      last_login_at?: string
    }

    const userDataTyped = userData as UserData

    console.log('🔍 [/api/auth/me] Buscando tenant:', userDataTyped.tenant_id)

    // Usar Service Role client para bypassear RLS al buscar tenant
    // (necesario porque el usuario aún no tiene tenant_id en el JWT)
    const supabaseAdmin = createServiceRoleClient()

    // Buscar datos del tenant usando Service Role (bypasea RLS)
    const { data: tenantDataArray, error: tenantError } = await supabaseAdmin
      .from('tenants')
      .select('id, name, slug, settings')
      .eq('id', userDataTyped.tenant_id)
      .limit(1)

    const tenantData = tenantDataArray?.[0]

    console.log('🔍 [/api/auth/me] Resultado de búsqueda de tenant:', { 
      found: !!tenantData, 
      error: tenantError?.message,
      tenantId: userDataTyped.tenant_id
    })

    if (tenantError || !tenantData) {
      console.error('❌ [/api/auth/me] Tenant no encontrado:', tenantError?.message)
      logger.error('Tenant no encontrado', tenantError as Error, { 
        tenantId: userDataTyped.tenant_id,
        tenantError: tenantError?.message 
      })
      throw new AuthenticationError('Configuración de tenant no encontrada')
    }

    // Preparar respuesta
    const user = {
      id: userDataTyped.id,
      name: userDataTyped.name,
      email: userDataTyped.email,
      role: userDataTyped.role,
      active: userDataTyped.active,
      tenant_id: userDataTyped.tenant_id,
      last_login_at: userDataTyped.last_login_at,
    }

    const tenantSettings = (tenantData.settings || {}) as {
      logoUrl?: string
      theme?: { accentColor?: string }
      features?: { tablets?: boolean; kds?: boolean; payments?: boolean }
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
    console.log('✅ [/api/auth/me] Datos obtenidos exitosamente:', { 
      userId: user.id, 
      tenantId: tenant.id,
      duration: `${duration}ms` 
    })
    logResponse('GET', '/api/auth/me', 200, duration)

    return respuestaExitosa({ user, tenant })
  } catch (error) {
    const duration = Date.now() - startTime
    console.error('❌ [/api/auth/me] Error:', error)
    logResponse('GET', '/api/auth/me', error instanceof AuthenticationError ? 401 : 500, duration)
    return manejarError(error, 'get-current-user')
  }
}
