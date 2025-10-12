"use client"

import type React from "react"

import { useAuth } from "@/contexts/auth-context"
import { useRouter } from "next/navigation"
import { useEffect } from "react"
import { Loader2 } from "lucide-react"

interface ProtectedRouteProps {
  children: React.ReactNode
  requiredRole?: "admin" | "staff" | "manager"
  allowedRoles?: Array<"admin" | "staff" | "manager">
}

export function ProtectedRoute({ children, requiredRole, allowedRoles }: ProtectedRouteProps) {
  const { user, isLoading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    console.log('🛡️ ProtectedRoute - Estado:', { 
      hasUser: !!user, 
      isLoading,
      pathname: typeof window !== 'undefined' ? window.location.pathname : 'unknown'
    })
    
    if (!isLoading) {
      if (!user) {
        console.log('⚠️ No hay usuario, redirigiendo a login...')
        router.push("/login")
        return
      }

      console.log('✅ Usuario autenticado, verificando permisos...', { 
        userRole: user.role,
        requiredRole,
        allowedRoles 
      })

      // Verificar roles permitidos
      if (allowedRoles && !allowedRoles.includes(user.role as any)) {
        console.log('⚠️ Rol no permitido, redirigiendo a dashboard...')
        router.push("/dashboard")
        return
      }

      // Verificar rol requerido específico
      if (requiredRole && user.role !== requiredRole && user.role !== "admin") {
        // Admin puede acceder a todo, pero otros roles necesitan coincidencia exacta
        console.log('⚠️ Rol requerido no coincide, redirigiendo a dashboard...')
        router.push("/dashboard")
        return
      }
      
      console.log('✅ Usuario tiene permisos para acceder')
    }
  }, [user, isLoading, requiredRole, allowedRoles, router])

  if (isLoading) {
    console.log('⏳ ProtectedRoute: Cargando autenticación...')
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    )
  }

  if (!user) {
    return null
  }

  // Verificar roles permitidos
  if (allowedRoles && !allowedRoles.includes(user.role as any)) {
    return null
  }

  // Verificar rol requerido específico
  if (requiredRole && user.role !== requiredRole && user.role !== "admin") {
    return null
  }

  return <>{children}</>
}
