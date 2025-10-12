"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/contexts/auth-context"
import { Loader2 } from "lucide-react"

export default function HomePage() {
  const { user, isLoading, isHydrated } = useAuth()
  const router = useRouter()

  // 🚧 BYPASS TEMPORAL PARA DESARROLLO
  const bypassAuth = process.env.NEXT_PUBLIC_BYPASS_AUTH === 'true'

  useEffect(() => {
    // Si bypass está activo, ir directo al dashboard
    if (bypassAuth) {
      router.replace("/dashboard")
      return
    }

    if (isHydrated && !isLoading) {
      if (user) {
        router.replace("/dashboard")
      } else {
        router.replace("/login")
      }
    }
  }, [user, isLoading, isHydrated, router, bypassAuth])

  if (!isHydrated || isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-sm text-muted-foreground">Cargando aplicación...</p>
        </div>
      </div>
    )
  }

  return null
}
