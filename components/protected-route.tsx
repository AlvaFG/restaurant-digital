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
    if (!isLoading) {
      if (!user) {
        router.push("/login")
        return
      }

      // Verificar roles permitidos
      if (allowedRoles && !allowedRoles.includes(user.role)) {
        router.push("/dashboard")
        return
      }

      // Verificar rol requerido específico
      if (requiredRole && user.role !== requiredRole && user.role !== "admin") {
        // Admin puede acceder a todo, pero otros roles necesitan coincidencia exacta
        router.push("/dashboard")
        return
      }
    }
  }, [user, isLoading, requiredRole, allowedRoles, router])

  if (isLoading) {
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
  if (allowedRoles && !allowedRoles.includes(user.role)) {
    return null
  }

  // Verificar rol requerido específico
  if (requiredRole && user.role !== requiredRole && user.role !== "admin") {
    return null
  }

  return <>{children}</>
}
