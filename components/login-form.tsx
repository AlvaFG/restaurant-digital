"use client"

import type React from "react"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { useTranslations } from "next-intl"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { useAuth } from "@/contexts/auth-context"
import { Loader2, Eye, EyeOff } from "lucide-react"
import { Separator } from "@/components/ui/separator"

type AuthMode = "login" | "register"

export function LoginForm() {
  const tCommon = useTranslations('common')
  const tErrors = useTranslations('errors')
  
  const [mode, setMode] = useState<AuthMode>("login")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [name, setName] = useState("")
  const [error, setError] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const { login } = useAuth()
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setIsLoading(true)

    try {
      if (mode === "register") {
        // Validar contraseñas
        if (password !== confirmPassword) {
          throw new Error("Las contraseñas no coinciden")
        }

        if (password.length < 6) {
          throw new Error("La contraseña debe tener al menos 6 caracteres")
        }

        if (!name.trim()) {
          throw new Error("El nombre es requerido")
        }

        // Llamar a API de registro
        const response = await fetch("/api/auth/register", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email, password, name }),
        })

        const data = await response.json()

        if (!response.ok) {
          const errorMsg = data.error?.message || data.error || tErrors('createAccountError')
          throw new Error(errorMsg)
        }
        
        // Después de registro exitoso, hacer login automáticamente
        await login(email, password)
        
        // Pequeño delay para asegurar que el estado se actualizó
        await new Promise(resolve => setTimeout(resolve, 300))
        
        router.push("/dashboard")
      } else {
        // Login normal
        
        const loginStartTime = Date.now()
        await login(email, password)
        const loginDuration = Date.now() - loginStartTime
        
        // Pequeño delay para asegurar que el estado se actualizó
        await new Promise(resolve => setTimeout(resolve, 300))
        
        router.push("/dashboard")
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Error en la operación"
      
      // Traducir mensajes de error comunes de Supabase
      let friendlyError = errorMessage
      
      if (errorMessage.includes("Invalid login credentials")) {
        friendlyError = "Correo o contraseña incorrectos"
      } else if (errorMessage.includes("Email not confirmed")) {
        friendlyError = "Debes confirmar tu email antes de iniciar sesión"
      } else if (errorMessage.includes("User already registered")) {
        friendlyError = "Este email ya está registrado"
      } else if (errorMessage.includes("Unable to validate email address")) {
        friendlyError = "El formato del email es inválido"
      } else if (errorMessage.includes("Network request failed")) {
        friendlyError = "Error de conexión. Verifica tu internet e intenta nuevamente"
      } else if (errorMessage.includes("Failed to fetch")) {
        friendlyError = "Error al conectar con el servidor. Intenta nuevamente"
      }
      
      setError(friendlyError)
    } finally {
      setIsLoading(false)
    }
  }

  const handleGoogleLogin = async () => {
    setError("")
    setIsLoading(true)

    try {
      const response = await fetch("/api/auth/google", {
        method: "POST",
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error?.message || "Error al iniciar sesión con Google")
      }

      // Redirigir a la URL de autorización de Google
      if (data.data?.url) {
        window.location.href = data.data.url
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al iniciar sesión con Google")
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-bold">
            {mode === "login" ? tCommon('signIn') : tCommon('createAccount')}
          </CardTitle>
          <CardDescription>
            {mode === "login"
              ? "Ingresa tus credenciales para acceder"
              : tCommon('createAccountHelp')}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {mode === "register" && (
              <div className="space-y-2">
                <Label htmlFor="name">Nombre completo</Label>
                <Input
                  id="name"
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Juan Pérez"
                  required
                />
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="tu@email.com"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Contraseña</Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  minLength={6}
                  className="pr-10"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4 text-muted-foreground" />
                  ) : (
                    <Eye className="h-4 w-4 text-muted-foreground" />
                  )}
                  <span className="sr-only">{showPassword ? "Ocultar contraseña" : "Mostrar contraseña"}</span>
                </Button>
              </div>
            </div>

            {mode === "register" && (
              <div className="space-y-2">
                <Label htmlFor="confirmPassword">Confirmar contraseña</Label>
                <div className="relative">
                  <Input
                    id="confirmPassword"
                    type={showConfirmPassword ? "text" : "password"}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="••••••••"
                    required
                    minLength={6}
                    className="pr-10"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  >
                    {showConfirmPassword ? (
                      <EyeOff className="h-4 w-4 text-muted-foreground" />
                    ) : (
                      <Eye className="h-4 w-4 text-muted-foreground" />
                    )}
                    <span className="sr-only">
                      {showConfirmPassword ? "Ocultar contraseña" : "Mostrar contraseña"}
                    </span>
                  </Button>
                </div>
              </div>
            )}

            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {mode === "login" ? tCommon('signIn') : tCommon('createAccount')}
            </Button>
          </form>

          <div className="mt-4">
            <Separator className="my-4" />
            <Button
              type="button"
              variant="outline"
              className="w-full"
              onClick={handleGoogleLogin}
              disabled={isLoading}
            >
              <svg className="mr-2 h-4 w-4" viewBox="0 0 24 24">
                <path
                  fill="currentColor"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="currentColor"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="currentColor"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                />
                <path
                  fill="currentColor"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                />
              </svg>
              Continuar con Google
            </Button>
          </div>

          <div className="mt-4 text-center">
            <Button
              type="button"
              variant="link"
              className="text-sm"
              onClick={() => {
                setMode(mode === "login" ? "register" : "login")
                setError("")
              }}
            >
              {mode === "login" ? "¿No tienes cuenta? Créala aquí" : "¿Ya tienes cuenta? Inicia sesión"}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
