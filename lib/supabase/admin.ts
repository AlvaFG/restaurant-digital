/**
 * Supabase Admin Client
 * 
 * Cliente de Supabase con permisos de service role.
 * ⚠️ NUNCA usar en el cliente, solo en servidor.
 * ⚠️ Bypassa Row Level Security (RLS).
 * 
 * @module supabase/admin
 */

import { createClient } from '@supabase/supabase-js'
import type { Database } from './types'

let adminClient: ReturnType<typeof createClient<Database>> | null = null

/**
 * Crear cliente admin de Supabase (singleton)
 * 
 * ⚠️ USO EXCLUSIVO EN SERVIDOR
 * ⚠️ Bypassa RLS - usar con precaución
 * 
 * @example
 * ```typescript
 * // Solo en API Routes o Server Actions
 * import { createAdminClient } from '@/lib/supabase/admin'
 * 
 * export async function POST() {
 *   const supabase = createAdminClient()
 *   
 *   // Admin puede hacer cualquier operación
 *   const { data } = await supabase
 *     .from('orders')
 *     .delete()
 *     .eq('status', 'cancelled')
 *   
 *   return Response.json(data)
 * }
 * ```
 */
export function createAdminClient() {
  // Prevenir uso en cliente
  if (typeof window !== 'undefined') {
    throw new Error(
      'createAdminClient() cannot be used in the browser. ' +
      'This is a security risk as it exposes the service role key.'
    )
  }

  if (adminClient) {
    return adminClient
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!supabaseUrl || !supabaseServiceKey) {
    throw new Error(
      'Missing Supabase admin credentials. ' +
      'Please set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY'
    )
  }

  adminClient = createClient<Database>(supabaseUrl, supabaseServiceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  })

  return adminClient
}

/**
 * Ejecutar operación con permisos admin
 * 
 * Helper para operaciones que requieren bypass de RLS
 */
export async function withAdmin<T>(
  operation: (client: ReturnType<typeof createAdminClient>) => Promise<T>
): Promise<T> {
  const admin = createAdminClient()
  return operation(admin)
}
