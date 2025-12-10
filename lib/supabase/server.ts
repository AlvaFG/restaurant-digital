/**
 * Supabase Client - Server
 * 
 * Cliente de Supabase para uso en Server Components, API Routes y Server Actions.
 * Maneja cookies de forma segura para mantener la sesión del usuario.
 * 
 * @module supabase/server
 */

import { createServerClient as createClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import type { Database } from './types'

/**
 * Crear cliente de Supabase para el servidor
 * 
 * IMPORTANTE: Debe llamarse dentro de un Server Component o API Route
 * 
 * @example
 * ```typescript
 * // Server Component
 * export default async function Page() {
 *   const supabase = await createServerClient()
 *   const { data } = await supabase.from('orders').select('*')
 *   return <div>{data.length} orders</div>
 * }
 * 
 * // API Route
 * export async function GET() {
 *   const supabase = await createServerClient()
 *   const { data } = await supabase.from('orders').select('*')
 *   return Response.json(data)
 * }
 * ```
 */
export async function createServerClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error(
      'Missing Supabase environment variables. ' +
      'Please set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY'
    )
  }

  const cookieStore = await cookies()

  return createClient<Database>(supabaseUrl, supabaseAnonKey, {
    cookies: {
      get(name: string) {
        return cookieStore.get(name)?.value
      },
      set(name: string, value: string, options: Record<string, unknown>) {
        try {
          cookieStore.set({ name, value, ...options })
        } catch {
          // Cookie setting can fail in Server Components
          // This is expected and can be ignored
        }
      },
      remove(name: string, options: Record<string, unknown>) {
        try {
          cookieStore.set({ name, value: '', ...options })
        } catch {
          // Cookie removal can fail in Server Components
          // This is expected and can be ignored
        }
      },
    },
  })
}

/**
 * Obtener usuario actual del servidor
 * 
 * @returns Usuario autenticado o null
 */
export async function getCurrentUser() {
  const supabase = await createServerClient()
  const { data: { user }, error } = await supabase.auth.getUser()
  
  if (error || !user) {
    return null
  }
  
  return user
}

/**
 * Verificar si hay sesión activa
 */
export async function hasActiveSession(): Promise<boolean> {
  const user = await getCurrentUser()
  return user !== null
}

/**
 * Crear cliente de Supabase con Service Role
 * 
 * ⚠️ USAR CON CUIDADO: Este cliente bypasea Row Level Security (RLS)
 * Solo usar en operaciones del servidor que requieren acceso administrativo
 * 
 * @example
 * ```typescript
 * // API Route que necesita acceso completo
 * export async function GET() {
 *   const supabase = await createServiceRoleClient()
 *   // Este cliente puede acceder a todos los datos sin restricciones RLS
 *   const { data } = await supabase.from('tenants').select('*')
 *   return Response.json(data)
 * }
 * ```
 */
export async function createServiceRoleClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!supabaseUrl || !supabaseServiceKey) {
    throw new Error(
      'Missing Supabase Service Role environment variables. ' +
      'Please set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY'
    )
  }

  const cookieStore = await cookies()

  return createClient<Database>(supabaseUrl, supabaseServiceKey, {
    cookies: {
      get(name: string) {
        return cookieStore.get(name)?.value
      },
      set(name: string, value: string, options: Record<string, unknown>) {
        try {
          cookieStore.set({ name, value, ...options })
        } catch {
          // Cookie setting can fail in Server Components
        }
      },
      remove(name: string, options: Record<string, unknown>) {
        try {
          cookieStore.set({ name, value: '', ...options })
        } catch {
          // Cookie removal can fail in Server Components
        }
      },
    },
  })
}
