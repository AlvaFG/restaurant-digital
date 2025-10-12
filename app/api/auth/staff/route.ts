/**
 * POST /api/auth/staff
 * 
 * Crear usuario staff (solo admin)
 */

import { createAdminClient } from '@/lib/supabase/admin'
import { createServerClient } from '@/lib/supabase/server'
import bcrypt from 'bcryptjs'
import {
  manejarError,
  validarBody,
  respuestaExitosa,
  logRequest,
  logResponse,
} from '@/lib/api-helpers'
import { ValidationError, AuthenticationError, DatabaseError } from '@/lib/errors'
import { MENSAJES } from '@/lib/i18n/mensajes'
import { logger } from '@/lib/logger'

export async function POST(request: Request) {
  const startTime = Date.now()

  try {
    logRequest('POST', '/api/auth/staff')

    // Obtener usuario actual
    const supabase = createServerClient()
    const { data: { session }, error: sessionError } = await supabase.auth.getSession()

    if (sessionError || !session) {
      throw new AuthenticationError('No hay sesión activa')
    }

    const adminUserId = session.user.id

    // Verificar que el usuario actual es admin
    const { data: adminUser, error: adminError } = await supabase
      .from('users')
      .select('role, tenant_id')
      .eq('id', adminUserId)
      .single()

    if (adminError || !adminUser) {
      throw new AuthenticationError('Usuario no encontrado')
    }

    if (adminUser.role !== 'admin') {
      throw new AuthenticationError('Solo los administradores pueden crear usuarios staff')
    }

    // Validar y extraer body
    const { email, password, name } = await validarBody<{
      email: string
      password: string
      name: string
    }>(request)

    // Validar inputs
    if (!email || !password || !name) {
      throw new ValidationError(MENSAJES.VALIDACIONES.CAMPO_REQUERIDO, {
        fields: ['email', 'password', 'name'],
      })
    }

    if (!email.includes('@')) {
      throw new ValidationError(MENSAJES.VALIDACIONES.EMAIL_INVALIDO)
    }

    if (password.length < 6) {
      throw new ValidationError('La contraseña debe tener al menos 6 caracteres')
    }

    // Usar admin client para crear en Auth
    const supabaseAdmin = createAdminClient()

    logger.info('Admin creando usuario staff', { 
      adminId: adminUserId, 
      staffEmail: email 
    })

    // Verificar si el usuario ya existe
    const { data: existingUser } = await supabaseAdmin
      .from('users')
      .select('id')
      .eq('email', email)
      .single()

    if (existingUser) {
      throw new ValidationError('Este email ya está registrado')
    }

    // 1. Crear usuario en Supabase Auth
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true, // Auto-confirmar email
      user_metadata: {
        name,
        role: 'staff',
      }
    })

    if (authError || !authData.user) {
      logger.error('Error al crear usuario staff en Auth', authError as Error, { email })
      throw new DatabaseError('Error al crear usuario en el sistema de autenticación', {
        operation: 'createAuthUser',
        email,
        error: authError?.message
      })
    }

    const authUser = authData.user
    logger.info('Usuario staff creado en Auth', { authUserId: authUser.id, email })

    // 2. Hash de la contraseña
    const passwordHash = await bcrypt.hash(password, 10)

    // 3. Crear usuario en tabla users
    interface NewStaffData {
      id: string
      email: string
      name: string
      role: string
      tenant_id: string
      created_by_admin_id: string
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: newStaff, error: createError } = await (supabaseAdmin.from('users') as any)
      .insert({
        id: authUser.id,
        email,
        password_hash: passwordHash,
        name,
        role: 'staff', // 🔒 Rol staff
        tenant_id: adminUser.tenant_id,
        created_by_admin_id: adminUserId, // 🔗 Vincular con admin creador
        active: true,
      })
      .select()
      .single()

    if (createError) {
      // Rollback: eliminar de Auth si falla la inserción en DB
      logger.error('Error al crear usuario staff en DB, rollback', createError as Error, { email })
      await supabaseAdmin.auth.admin.deleteUser(authUser.id)
      
      throw new DatabaseError('Error al crear usuario staff', {
        operation: 'createStaffUser',
        email,
      })
    }

    const staffData = newStaff as NewStaffData

    const duration = Date.now() - startTime
    logResponse('POST', '/api/auth/staff', 201, duration)

    logger.info('Usuario staff creado exitosamente', {
      staffId: staffData.id,
      email: staffData.email,
      adminId: adminUserId,
      duration: `${duration}ms`,
    })

    return respuestaExitosa(
      {
        user: {
          id: staffData.id,
          email: staffData.email,
          name: staffData.name,
          role: staffData.role,
          created_by_admin_id: staffData.created_by_admin_id,
        },
      },
      'Usuario staff creado exitosamente',
      201
    )
  } catch (error) {
    const duration = Date.now() - startTime
    logResponse('POST', '/api/auth/staff', 400, duration)
    return manejarError(error, 'create-staff')
  }
}

/**
 * GET /api/auth/staff
 * 
 * Listar usuarios staff creados por el admin actual
 */
export async function GET() {
  const startTime = Date.now()

  try {
    logRequest('GET', '/api/auth/staff')

    // Obtener usuario actual
    const supabase = createServerClient()
    const { data: { session }, error: sessionError } = await supabase.auth.getSession()

    if (sessionError || !session) {
      throw new AuthenticationError('No hay sesión activa')
    }

    const adminUserId = session.user.id

    // Verificar que el usuario actual es admin
    const { data: adminUser, error: adminError } = await supabase
      .from('users')
      .select('role, tenant_id')
      .eq('id', adminUserId)
      .single()

    if (adminError || !adminUser) {
      throw new AuthenticationError('Usuario no encontrado')
    }

    if (adminUser.role !== 'admin') {
      throw new AuthenticationError('Solo los administradores pueden ver usuarios staff')
    }

    // Obtener lista de staff del mismo tenant
    const { data: staffList, error: staffError } = await supabase
      .from('users')
      .select('id, email, name, role, active, created_at, created_by_admin_id')
      .eq('tenant_id', adminUser.tenant_id)
      .eq('role', 'staff')
      .order('created_at', { ascending: false })

    if (staffError) {
      logger.error('Error al listar staff', staffError as Error)
      throw new DatabaseError('Error al obtener lista de staff')
    }

    const duration = Date.now() - startTime
    logResponse('GET', '/api/auth/staff', 200, duration)

    return respuestaExitosa({
      staff: staffList || [],
      total: staffList?.length || 0,
    })
  } catch (error) {
    const duration = Date.now() - startTime
    logResponse('GET', '/api/auth/staff', error instanceof AuthenticationError ? 401 : 500, duration)
    return manejarError(error, 'list-staff')
  }
}
