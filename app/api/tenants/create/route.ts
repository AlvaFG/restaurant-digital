import { createAdminClient } from '@/lib/supabase/admin'
import { manejarError, respuestaExitosa, logRequest, logResponse } from '@/lib/api-helpers'
import { DatabaseError } from '@/lib/errors'
import { logger } from '@/lib/logger'

/**
 * POST /api/tenants/create
 * 
 * Crea un tenant si no existe (endpoint de utilidad)
 */
export async function POST(request: Request) {
  const startTime = Date.now()
  
  try {
    logRequest('POST', '/api/tenants/create')

    const body = await request.json()
    const { tenant_id, name, slug } = body

    if (!tenant_id) {
      throw new DatabaseError('tenant_id es requerido')
    }

    const supabase = createAdminClient()

    // Verificar si ya existe
    const { data: existing } = await supabase
      .from('tenants')
      .select('*')
      .eq('id', tenant_id)
      .single()

    if (existing) {
      logger.info('Tenant ya existe', { tenantId: tenant_id })
      return respuestaExitosa({ tenant: existing, created: false }, 'Tenant ya existe')
    }

    // Crear el tenant
    const newTenant = {
      id: tenant_id,
      name: name || 'Mi Restaurante',
      slug: slug || 'mi-restaurante',
      settings: {
        logoUrl: null,
        theme: {
          accentColor: '#3b82f6'
        },
        features: {
          tablets: true,
          kds: true,
          payments: true
        }
      },
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }

    const { data, error } = await supabase
      .from('tenants')
      .insert([newTenant])
      .select()
      .single()

    if (error) {
      logger.error('Error al crear tenant', error)
      throw new DatabaseError('Error al crear tenant', { error: error.message })
    }

    const duration = Date.now() - startTime
    logResponse('POST', '/api/tenants/create', 200, duration)

    logger.info('Tenant creado exitosamente', { tenantId: data.id })

    return respuestaExitosa({ tenant: data, created: true }, 'Tenant creado exitosamente')
  } catch (error) {
    const duration = Date.now() - startTime
    logResponse('POST', '/api/tenants/create', 500, duration)
    return manejarError(error, 'create-tenant')
  }
}
