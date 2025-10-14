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
    console.log('[sync-metadata] Iniciando sincronización...')
    
    // Obtener usuario actual
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 })
    }

    console.log('[sync-metadata] Usuario autenticado:', user.id)

    // Obtener datos desde la tabla users
    const supabase = createServerClient()
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('id, tenant_id, name, role, active')
      .eq('id', user.id)
      .single()

    if (userError || !userData) {
      console.error('[sync-metadata] Usuario no encontrado en tabla:', userError)
      return NextResponse.json(
        { error: 'Usuario no encontrado en base de datos' },
        { status: 404 }
      )
    }

    console.log('[sync-metadata] Datos de usuario encontrados:', {
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
      console.error('[sync-metadata] Error al actualizar metadata:', updateError)
      return NextResponse.json(
        { error: 'No se pudo actualizar user_metadata', details: updateError.message },
        { status: 500 }
      )
    }

    console.log('[sync-metadata] ✅ Metadata actualizado exitosamente')
    logger.info('user_metadata sincronizado', {
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
    console.error('[sync-metadata] Error inesperado:', error)
    logger.error('Error al sincronizar metadata', error as Error)
    return NextResponse.json(
      { error: 'Error inesperado', details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    )
  }
}
