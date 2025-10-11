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
 *   const supabase = createServerClient()
 *   const { data } = await supabase.from('orders').select('*')
 *   return <div>{data.length} orders</div>
 * }
 * 
 * // API Route
 * export async function GET() {
 *   const supabase = createServerClient()
 *   const { data } = await supabase.from('orders').select('*')
 *   return Response.json(data)
 * }
 * ```
 */
export function createServerClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error(
      'Missing Supabase environment variables. ' +
      'Please set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY'
    )
  }

  const cookieStore = cookies()

  return createClient<Database>(supabaseUrl, supabaseAnonKey, {
    cookies: {
      get(name: string) {
        return cookieStore.get(name)?.value
      },
      set(name: string, value: string, options: any) {
        try {
          cookieStore.set({ name, value, ...options })
        } catch (error) {
          // Cookie setting can fail in Server Components
          // This is expected and can be ignored
        }
      },
      remove(name: string, options: any) {
        try {
          cookieStore.set({ name, value: '', ...options })
        } catch (error) {
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
  const supabase = createServerClient()
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
