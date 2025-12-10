/**
 * POST /api/auth/sync-metadata
 * 
 * Sincroniza el tenant_id desde la tabla users hacia user_metadata en Supabase Auth
 * Útil para usuarios existentes que no tienen tenant_id en user_metadata
 */

import { NextResponse } from 'next/server'
import { getCurrentUser, createServerClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { logger } from '@/lib/logger'

export async function POST() {
  try {
    logger.info('Iniciando sincronización de metadata')
    
    // Obtener usuario actual
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 })
    }

    logger.debug('Usuario autenticado', { userId: user.id })

    // Obtener datos desde la tabla users
    const supabase = await createServerClient()
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('id, tenant_id, name, role, active')
      .eq('id', user.id)
      .single()

    if (userError || !userData) {
      logger.error('Usuario no encontrado en tabla', userError ? new Error(userError.message) : undefined, { userId: user.id })
      return NextResponse.json(
        { error: 'Usuario no encontrado en base de datos' },
        { status: 404 }
      )
    }

    logger.debug('Datos de usuario encontrados', {
      userId: userData.id,
      tenantId: userData.tenant_id,
    })

    // Actualizar user_metadata con tenant_id
    const adminClient = createAdminClient()
    const { error: updateError } = await adminClient.auth.admin.updateUserById(
      userData.id,
      {
        user_metadata: {
          tenant_id: userData.tenant_id,
          name: userData.name,
          role: userData.role,
        }
      }
    )

    if (updateError) {
      logger.error('Error al actualizar metadata', new Error(updateError.message), { userId: userData.id })
      return NextResponse.json(
        { error: 'No se pudo actualizar user_metadata', details: updateError.message },
        { status: 500 }
      )
    }

    logger.info('Metadata actualizado exitosamente', {
      userId: userData.id,
      tenantId: userData.tenant_id,
    })

    return NextResponse.json({
      success: true,
      message: 'Metadata sincronizado exitosamente',
      data: {
        userId: userData.id,
        tenantId: userData.tenant_id,
        name: userData.name,
        role: userData.role,
      }
    })
  } catch (error) {
    logger.error('Error inesperado al sincronizar metadata', error instanceof Error ? error : new Error(String(error)))
    return NextResponse.json(
      { error: 'Error inesperado', details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    )
  }
}
