"use client"

/**
 * AuthContext - Context de autenticación con Supabase
 * 
 * Maneja el estado global de autenticación usando Supabase Auth.
 * Escucha cambios de sesión automáticamente.
 * 
 * @module contexts/auth-context
 */

import type React from "react"
import { createContext, useContext, useEffect, useState } from "react"
import { type User, type Tenant } from "@/lib/auth"
import { createBrowserClient } from "@/lib/supabase/client"
import { logger } from "@/lib/logger"
import type { Session } from "@supabase/supabase-js"

interface AuthContextType {
  user: User | null
  tenant: Tenant | null
  session: Session | null
  login: (email: string, password: string) => Promise<void>
  logout: () => Promise<void>
  updateTenant: (updates: Partial<Tenant>) => void
  isLoading: boolean
  isHydrated: boolean
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [tenant, setTenant] = useState<Tenant | null>(null)
  const [session, setSession] = useState<Session | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isHydrated, setIsHydrated] = useState(false)

  useEffect(() => {
    const supabase = createBrowserClient()

    // Cargar sesión inicial
    const loadSession = async () => {
      try {
        console.log('🚀 AuthProvider montado, iniciando carga de sesión...')
        console.log('⏳ Ejecutando loadSession...')
        
        const { data: { session: currentSession }, error } = await supabase.auth.getSession()
        
        console.log('🔍 DEBUG: getSession result', { 
          hasSession: !!currentSession, 
          error: error?.message,
          userId: currentSession?.user?.id 
        })
        
        if (error) {
          logger.error('❌ Error al cargar sesión inicial', error)
          console.error('❌ Error al cargar sesión inicial:', error)
          setIsLoading(false)
          setIsHydrated(true)
          return
        }

        if (currentSession) {
          console.log('✅ Sesión válida encontrada, cargando datos...')
          setSession(currentSession)
          await loadUserData(currentSession)
        } else {
          console.log('⚠️ No hay sesión activa')
          setUser(null)
          setTenant(null)
          setSession(null)
        }
      } catch (error) {
        console.error('❌ Error crítico en loadSession', error)
        logger.error('Error al cargar sesión', error as Error)
      } finally {
        // ✅ CRÍTICO: Esto DEBE ejecutarse siempre
        console.log('✅ Finalizando loadSession, actualizando isLoading y isHydrated')
        setIsLoading(false)
        setIsHydrated(true)
      }
    }

    loadSession()

    // Escuchar cambios de autenticación
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, currentSession) => {
        console.log('🔄 Cambio de estado de autenticación:', event)
        logger.info('Cambio de estado de autenticación', { event })

        setSession(currentSession)

        if (event === 'SIGNED_IN' && currentSession) {
          console.log('✅ SIGNED_IN detectado, cargando datos del usuario...')
          await loadUserData(currentSession)
        } else if (event === 'SIGNED_OUT') {
          console.log('🚪 SIGNED_OUT detectado, limpiando estado...')
          setUser(null)
          setTenant(null)
          // Limpiar localStorage
          localStorage.removeItem('restaurant_tenant')
        } else if (event === 'TOKEN_REFRESHED') {
          // Sesión renovada, mantener datos del usuario
          console.log('🔄 Token renovado automáticamente')
          logger.info('Token renovado automáticamente')
        }
      }
    )

    // Cleanup
    return () => {
      subscription.unsubscribe()
    }
  }, [])

  /**
   * Cargar datos completos del usuario desde la API
   */
  const loadUserData = async (activeSession?: Session | null) => {
    try {
      console.log('[loadUserData] Fetching /api/auth/me...')

      // Determine active session token so the API can authenticate even if cookies lag
      const accessToken =
        activeSession?.access_token ??
        session?.access_token ??
        null

      const headers: Record<string, string> = {}
      if (accessToken) {
        headers.Authorization = `Bearer ${accessToken}`
      } else {
        console.warn('[loadUserData] No access token found, relying on cookies only')
      }

      // Pequeno delay para dar tiempo a que las cookies se establezcan
      await new Promise((resolve) => setTimeout(resolve, 100))

      // Timeout defensivo para evitar esperas infinitas
      const controller = new AbortController()
      const timeoutId = setTimeout(() => {
        console.warn('[loadUserData] Timeout de 10 segundos alcanzado')
        controller.abort()
      }, 10000) // 10 segundos max

      const response = await fetch('/api/auth/me', {
        signal: controller.signal,
        credentials: 'include', // Asegurar que las cookies se envien
        headers,
        cache: 'no-store',
      })

      clearTimeout(timeoutId)

      console.log('[loadUserData] Respuesta de /api/auth/me:', response.status)
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        console.error('❌ [loadUserData] Error en /api/auth/me:', errorData)
        throw new Error(errorData.error?.message || 'Error al cargar datos del usuario')
      }

      const data = await response.json()
      
      console.log('✅ [loadUserData] Datos recibidos:', { 
        hasUser: !!data.data?.user, 
        hasTenant: !!data.data?.tenant 
      })
      
      if (data.data?.user && data.data?.tenant) {
        setUser(data.data.user)
        setTenant(data.data.tenant)
        
        // Guardar tenant en localStorage para acceso rápido
        localStorage.setItem('restaurant_tenant', JSON.stringify(data.data.tenant))
        console.log('✅ [loadUserData] Estado de usuario y tenant actualizados')
      } else {
        console.warn('⚠️ [loadUserData] Datos incompletos en respuesta')
      }
    } catch (error: any) {
      console.error('❌ [loadUserData] Error:', error)
      
      if (error.name === 'AbortError') {
        console.error('❌ [loadUserData] La petición a /api/auth/me fue abortada por timeout')
      }
      
      logger.error('Error al cargar datos del usuario', error as Error)
      // NO lanzar error, solo loguear y continuar
      // Establecer valores null para que el estado sea consistente
      setUser(null)
      setTenant(null)
    }
  }

  /**
   * Iniciar sesión
   */
  const login = async (email: string, password: string) => {
    console.log('📝 [AuthContext.login] Iniciando proceso de login...')
    setIsLoading(true)
    
    try {
      console.log('📝 [AuthContext.login] Email:', email)
      const supabase = createBrowserClient()

      // Autenticar con Supabase directamente desde el navegador
      // Esto establecerá las cookies automáticamente
      console.log('⏳ [AuthContext.login] Llamando a signInWithPassword...')
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (error) {
        console.error('❌ [AuthContext.login] Error en signInWithPassword:', error.message)
        throw error
      }

      if (!data.session) {
        console.error('❌ [AuthContext.login] No se pudo crear la sesión')
        throw new Error('No se pudo crear la sesión')
      }

      console.log('✅ [AuthContext.login] Sesión creada en Supabase:', { 
        userId: data.user.id,
        hasSession: !!data.session 
      })

      setSession(data.session)
      
      // Cargar datos completos del usuario
      console.log('🔍 [AuthContext.login] Cargando datos completos del usuario...')
      const loadStartTime = Date.now()
      
      try {
        await loadUserData(data.session)
        const loadDuration = Date.now() - loadStartTime
        console.log(`✅ [AuthContext.login] Datos cargados en ${loadDuration}ms`)
      } catch (loadError) {
        console.error('❌ [AuthContext.login] Error al cargar datos, pero sesión establecida:', loadError)
        // No lanzar el error - la sesión se estableció correctamente
        // El usuario podrá recargar la página para obtener los datos
      }
      
      console.log('✅ [AuthContext.login] Login completado exitosamente')
    } catch (error) {
      console.error('❌ [AuthContext.login] Error en login:', error)
      throw error
    } finally {
      console.log('🔄 [AuthContext.login] Estableciendo isLoading = false')
      setIsLoading(false)
    }
  }

  /**
   * Cerrar sesión
   */
  const logout = async () => {
    setIsLoading(true)
    try {
      const supabase = createBrowserClient()
      
      // Cerrar sesión en Supabase
      const { error } = await supabase.auth.signOut()
      
      if (error) {
        throw error
      }

      // Limpiar estado local
      setUser(null)
      setTenant(null)
      setSession(null)
      localStorage.removeItem('restaurant_tenant')
      
      logger.info('Sesión cerrada exitosamente')
    } catch (error) {
      logger.error('Error al cerrar sesión', error as Error)
      throw error
    } finally {
      setIsLoading(false)
    }
  }

  /**
   * Actualizar información del tenant
   */
  const updateTenant = (updates: Partial<Tenant>) => {
    if (tenant) {
      const updated = { ...tenant, ...updates }
      setTenant(updated)
      localStorage.setItem('restaurant_tenant', JSON.stringify(updated))
      logger.info('Tenant actualizado', { tenantId: updated.id })
    }
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        tenant,
        session,
        login,
        logout,
        updateTenant,
        isLoading,
        isHydrated,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
}
