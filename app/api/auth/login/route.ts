import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import bcrypt from 'bcryptjs'
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

    // Usar admin client para bypassear RLS
    const supabase = createAdminClient()

    logger.info('Buscando usuario', { email })

    // 1. Buscar usuario
    const { data: users, error } = await supabase
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
      .limit(1)

    if (error) {
      logger.error('Error al buscar usuario', error as Error, { email })
      throw new DatabaseError(MENSAJES.ERRORES.DB_ERROR, { 
        operation: 'findUser',
        email 
      })
    }

    if (!users || users.length === 0) {
      logger.warn('Usuario no encontrado o inactivo', { email })
      throw new AuthenticationError(MENSAJES.ERRORES.CREDENCIALES_INVALIDAS)
    }

    const userData: any = users[0]

    // 2. Verificar password
    logger.debug('Verificando contraseña')
    const isValid = await bcrypt.compare(password, userData.password_hash)
    
    if (!isValid) {
      logger.warn('Contraseña inválida', { email })
      throw new AuthenticationError(MENSAJES.ERRORES.CREDENCIALES_INVALIDAS)
    }

    // 3. Actualizar last_login_at
    const updateResult = await supabase
      .from('users')
      .update({ last_login_at: new Date().toISOString() } as any)
      .eq('id', userData.id)

    if (updateResult.error) {
      logger.warn('No se pudo actualizar last_login_at', { 
        userId: userData.id,
        error: updateResult.error.message 
      })
    }

    // 4. Preparar respuesta
    const user = {
      id: userData.id,
      name: userData.name,
      email: userData.email,
      role: userData.role,
      active: userData.active,
      tenant_id: userData.tenant_id,
      last_login_at: new Date().toISOString(),
    }

    const tenantData = userData.tenants as any
    const tenant = {
      id: tenantData.id,
      name: tenantData.name,
      slug: tenantData.slug,
      logoUrl: tenantData.settings?.logoUrl,
      theme: {
        accentColor: tenantData.settings?.theme?.accentColor || '#3b82f6',
      },
      features: {
        tablets: tenantData.settings?.features?.tablets ?? true,
        kds: tenantData.settings?.features?.kds ?? true,
        payments: tenantData.settings?.features?.payments ?? true,
      },
    }

    const duration = Date.now() - startTime
    logResponse('POST', '/api/auth/login', 200, duration)
    
    logger.info('Login exitoso', { 
      userId: user.id, 
      tenantId: tenant.id,
      duration: `${duration}ms`
    })

    return respuestaExitosa({ user, tenant }, MENSAJES.EXITOS.LOGIN_EXITOSO)
  } catch (error) {
    const duration = Date.now() - startTime
    logResponse('POST', '/api/auth/login', error instanceof AuthenticationError ? 401 : 500, duration)
    return manejarError(error, 'login')
  }
}
