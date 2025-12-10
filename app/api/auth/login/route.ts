import { createAdminClient } from '@/lib/supabase/admin'
import { manejarError, validarBody, respuestaExitosa, logRequest, logResponse } from '@/lib/api-helpers'
import { AuthenticationError, ValidationError, DatabaseError } from '@/lib/errors'
import { MENSAJES } from '@/lib/i18n/mensajes'
import { logger } from '@/lib/logger'

export async function POST(request: Request) {
  const startTime = Date.now()
  
  try {
    logRequest('POST', '/api/auth/login')

    // Validar y extraer body
    const { email, password } = await validarBody<{ email: string; password: string }>(request)

    // Validar inputs
    if (!email || !password) {
      throw new ValidationError(MENSAJES.VALIDACIONES.CAMPO_REQUERIDO, {
        fields: ['email', 'password']
      })
    }

    if (!email.includes('@')) {
      throw new ValidationError(MENSAJES.VALIDACIONES.EMAIL_INVALIDO)
    }

    // Usar admin client para Supabase Auth
    const supabase = createAdminClient()

    logger.info('Iniciando autenticaci�n con Supabase', { email })

    // 1. Autenticar con Supabase Auth
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (authError || !authData.session) {
      logger.warn('Error en autenticaci�n de Supabase', { email, error: authError?.message })
      throw new AuthenticationError(MENSAJES.ERRORES.CREDENCIALES_INVALIDAS)
    }

    const authUser = authData.user
    logger.info('Usuario autenticado en Supabase', { userId: authUser.id, email: authUser.email })

    // 2. Buscar datos del usuario en la tabla users
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select(`
        *,
        tenants (
          id,
          name,
          slug,
          settings
        )
      `)
      .eq('email', email)
      .eq('active', true)
      .single()

    if (userError || !userData) {
      logger.error('Usuario no encontrado en tabla users', userError as Error, { email })
      throw new DatabaseError('Usuario no encontrado o inactivo', { 
        operation: 'findUser',
        email 
      })
    }

    interface UserWithTenant {
      id: string
      name: string
      email: string
      role: string
      active: boolean
      tenant_id: string
      last_login_at?: string
      tenants: {
        id: string
        name: string
        slug: string
        settings?: Record<string, unknown>
      }
    }

    const userDataTyped = userData as UserWithTenant

    // 3. Actualizar user_metadata con tenant_id en Supabase Auth
    logger.info('Actualizando user_metadata con tenant_id', { 
      userId: userDataTyped.id, 
      tenantId: userDataTyped.tenant_id 
    })
    
    const { error: updateMetadataError } = await supabase.auth.admin.updateUserById(
      userDataTyped.id,
      {
        user_metadata: {
          tenant_id: userDataTyped.tenant_id,
          name: userDataTyped.name,
          role: userDataTyped.role,
        }
      }
    )

    if (updateMetadataError) {
      logger.warn('No se pudo actualizar user_metadata', { 
        userId: userDataTyped.id,
        error: updateMetadataError.message 
      })
    } else {
      logger.info('user_metadata actualizado exitosamente', { 
        userId: userDataTyped.id,
        tenantId: userDataTyped.tenant_id 
      })
    }

    // 4. Actualizar last_login_at
    const updateResult = await supabase
      .from('users')
      .update({ last_login_at: new Date().toISOString() })
      .eq('id', userDataTyped.id)

    if (updateResult.error) {
      logger.warn('No se pudo actualizar last_login_at', { 
        userId: userDataTyped.id,
        error: updateResult.error.message 
      })
    }

    // 5. Preparar respuesta
    const user = {
      id: userDataTyped.id,
      name: userDataTyped.name,
      email: userDataTyped.email,
      role: userDataTyped.role,
      active: userDataTyped.active,
      tenant_id: userDataTyped.tenant_id,
      last_login_at: new Date().toISOString(),
    }

    const tenantData = userDataTyped.tenants
    const tenantSettings = tenantData.settings as {
      logoUrl?: string
      theme?: { accentColor?: string }
      features?: { tablets?: boolean; kds?: boolean; payments?: boolean }
    } | undefined

    const tenant = {
      id: tenantData.id,
      name: tenantData.name,
      slug: tenantData.slug,
      logoUrl: tenantSettings?.logoUrl,
      theme: {
        accentColor: tenantSettings?.theme?.accentColor || '#3b82f6',
      },
      features: {
        tablets: tenantSettings?.features?.tablets ?? true,
        kds: tenantSettings?.features?.kds ?? true,
        payments: tenantSettings?.features?.payments ?? true,
      },
    }

    const duration = Date.now() - startTime
    logResponse('POST', '/api/auth/login', 200, duration)
    
    logger.info('Login exitoso', { 
      userId: user.id, 
      tenantId: tenant.id,
      duration: `${duration}ms`
    })

    // Devolver session y datos del usuario/tenant
    return respuestaExitosa({ 
      user, 
      tenant,
      session: {
        access_token: authData.session.access_token,
        refresh_token: authData.session.refresh_token,
        expires_at: authData.session.expires_at,
      }
    }, MENSAJES.EXITOS.LOGIN_EXITOSO)
  } catch (error) {
    const duration = Date.now() - startTime
    logResponse('POST', '/api/auth/login', error instanceof AuthenticationError ? 401 : 500, duration)
    return manejarError(error, 'login')
  }
}
