/**
 * PATCH /api/auth/staff/[id]
 * Actualizar usuario staff (solo admin)
 * 
 * DELETE /api/auth/staff/[id]
 * Eliminar usuario staff (solo admin)
 * 
 * GET /api/auth/staff/[id]
 * Obtener detalle de usuario staff (solo admin)
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
import { AuthenticationError, DatabaseError, ValidationError } from '@/lib/errors'
import { logger } from '@/lib/logger'

/**
 * GET - Obtener detalle de un staff
 */
export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  const startTime = Date.now()

  try {
    const staffId = params.id
    logRequest('GET', `/api/auth/staff/${staffId}`)

    // Verificar sesión y rol admin
    const supabase = await createServerClient()
    const { data: { session } } = await supabase.auth.getSession()

    if (!session) {
      throw new AuthenticationError('No hay sesión activa')
    }

    const { data: adminUser } = await supabase
      .from('users')
      .select('role, tenant_id')
      .eq('id', session.user.id)
      .single()

    if (!adminUser || adminUser.role !== 'admin') {
      throw new AuthenticationError('Solo administradores pueden ver detalles de staff')
    }

    // Obtener staff
    const { data: staff, error } = await supabase
      .from('users')
      .select('id, email, name, role, active, created_at, created_by_admin_id')
      .eq('id', staffId)
      .eq('tenant_id', adminUser.tenant_id)
      .eq('role', 'staff')
      .single()

    if (error || !staff) {
      throw new DatabaseError('Usuario staff no encontrado')
    }

    const duration = Date.now() - startTime
    logResponse('GET', `/api/auth/staff/${staffId}`, 200, duration)

    return respuestaExitosa({ staff })
  } catch (error) {
    const duration = Date.now() - startTime
    logResponse('GET', `/api/auth/staff/${params.id}`, 404, duration)
    return manejarError(error, 'get-staff-detail')
  }
}

/**
 * PATCH - Actualizar staff (nombre, email, activo, password)
 */
export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  const startTime = Date.now()

  try {
    const staffId = params.id
    logRequest('PATCH', `/api/auth/staff/${staffId}`)

    // Verificar sesión y rol admin
    const supabase = await createServerClient()
    const { data: { session } } = await supabase.auth.getSession()

    if (!session) {
      throw new AuthenticationError('No hay sesión activa')
    }

    const { data: adminUser } = await supabase
      .from('users')
      .select('role, tenant_id')
      .eq('id', session.user.id)
      .single()

    if (!adminUser || adminUser.role !== 'admin') {
      throw new AuthenticationError('Solo administradores pueden actualizar staff')
    }

    // Validar body
    const { name, email, active, password } = await validarBody<{
      name?: string
      email?: string
      active?: boolean
      password?: string
    }>(request)

    // Verificar que el staff existe y pertenece al tenant
    const { data: existingStaff } = await supabase
      .from('users')
      .select('id, email')
      .eq('id', staffId)
      .eq('tenant_id', adminUser.tenant_id)
      .eq('role', 'staff')
      .single()

    if (!existingStaff) {
      throw new DatabaseError('Usuario staff no encontrado')
    }

    const supabaseAdmin = createAdminClient()

    // Preparar updates
    const updates: Record<string, unknown> = {}
    if (name !== undefined) updates.name = name
    if (active !== undefined) updates.active = active

    // Si se actualiza email
    if (email !== undefined && email !== existingStaff.email) {
      if (!email.includes('@')) {
        throw new ValidationError('Email inválido')
      }

      // Actualizar en Auth
      const { error: authError } = await supabaseAdmin.auth.admin.updateUserById(
        staffId,
        { email }
      )

      if (authError) {
        throw new DatabaseError('Error al actualizar email en Auth')
      }

      updates.email = email
    }

    // Si se actualiza password
    if (password !== undefined) {
      if (password.length < 6) {
        throw new ValidationError('La contraseña debe tener al menos 6 caracteres')
      }

      // Actualizar en Auth
      const { error: authError } = await supabaseAdmin.auth.admin.updateUserById(
        staffId,
        { password }
      )

      if (authError) {
        throw new DatabaseError('Error al actualizar contraseña en Auth')
      }

      // Hash para DB
      const passwordHash = await bcrypt.hash(password, 10)
      updates.password_hash = passwordHash
    }

    // Actualizar en DB
    const { data: updatedStaff, error: updateError } = await supabaseAdmin
      .from('users')
      .update(updates)
      .eq('id', staffId)
      .select('id, email, name, role, active')
      .single()

    if (updateError) {
      throw new DatabaseError('Error al actualizar usuario staff')
    }

    const duration = Date.now() - startTime
    logResponse('PATCH', `/api/auth/staff/${staffId}`, 200, duration)

    logger.info('Usuario staff actualizado', {
      staffId,
      adminId: session.user.id,
      updates: Object.keys(updates),
    })

    return respuestaExitosa(
      { staff: updatedStaff },
      'Usuario staff actualizado exitosamente'
    )
  } catch (error) {
    const duration = Date.now() - startTime
    logResponse('PATCH', `/api/auth/staff/${params.id}`, 400, duration)
    return manejarError(error, 'update-staff')
  }
}

/**
 * DELETE - Eliminar staff
 */
export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  const startTime = Date.now()

  try {
    const staffId = params.id
    logRequest('DELETE', `/api/auth/staff/${staffId}`)

    // Verificar sesión y rol admin
    const supabase = await createServerClient()
    const { data: { session } } = await supabase.auth.getSession()

    if (!session) {
      throw new AuthenticationError('No hay sesión activa')
    }

    const { data: adminUser } = await supabase
      .from('users')
      .select('role, tenant_id')
      .eq('id', session.user.id)
      .single()

    if (!adminUser || adminUser.role !== 'admin') {
      throw new AuthenticationError('Solo administradores pueden eliminar staff')
    }

    // Verificar que el staff existe y pertenece al tenant
    const { data: existingStaff } = await supabase
      .from('users')
      .select('id, email')
      .eq('id', staffId)
      .eq('tenant_id', adminUser.tenant_id)
      .eq('role', 'staff')
      .single()

    if (!existingStaff) {
      throw new DatabaseError('Usuario staff no encontrado')
    }

    const supabaseAdmin = createAdminClient()

    // Eliminar de Auth (esto también eliminará de users por CASCADE)
    const { error: authError } = await supabaseAdmin.auth.admin.deleteUser(staffId)

    if (authError) {
      throw new DatabaseError('Error al eliminar usuario staff')
    }

    const duration = Date.now() - startTime
    logResponse('DELETE', `/api/auth/staff/${staffId}`, 200, duration)

    logger.info('Usuario staff eliminado', {
      staffId,
      email: existingStaff.email,
      adminId: session.user.id,
    })

    return respuestaExitosa(
      null,
      'Usuario staff eliminado exitosamente'
    )
  } catch (error) {
    const duration = Date.now() - startTime
    logResponse('DELETE', `/api/auth/staff/${params.id}`, 400, duration)
    return manejarError(error, 'delete-staff')
  }
}
