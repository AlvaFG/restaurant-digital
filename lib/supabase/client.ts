/**
 * Supabase Client - Browser
 * 
 * Cliente de Supabase para uso en componentes del cliente.
 * Incluye autenticación y manejo de sesión.
 * 
 * @module supabase/client
 */

import { createBrowserClient as createClient } from '@supabase/ssr'
import type { Database } from './types'

let client: ReturnType<typeof createClient<Database>> | null = null

/**
 * Crear cliente de Supabase para el navegador (singleton)
 * 
 * @example
 * ```tsx
 * 'use client'
 * 
 * const supabase = createBrowserClient()
 * const { data } = await supabase.from('orders').select('*')
 * ```
 */
export function createBrowserClient() {
  if (client) {
    return client
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error(
      'Missing Supabase environment variables. ' +
      'Please set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY'
    )
  }

  client = createClient<Database>(supabaseUrl, supabaseAnonKey, {
    cookies: {
      get(name: string) {
        // Browser cookies are handled automatically
        return undefined
      },
    },
  })

  return client
}

/**
 * Verificar si Supabase está configurado
 */
export function isSupabaseConfigured(): boolean {
  return Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_URL && 
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  )
}
