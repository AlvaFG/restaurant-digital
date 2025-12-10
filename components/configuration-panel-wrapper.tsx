"use client"

import { Component, type ReactNode } from "react"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { AlertCircle, RefreshCw } from "lucide-react"
import { Button } from "@/components/ui/button"

interface ErrorBoundaryState {
  hasError: boolean
  error: Error | null
}

export class ConfigurationErrorBoundary extends Component<
  { children: ReactNode },
  ErrorBoundaryState
> {
  constructor(props: { children: ReactNode }) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    // Skip catching certain non-critical errors
    const errorMessage = error.message || error.toString()
    
    // Don't catch hydration mismatches
    if (errorMessage.includes('Hydration') || 
        errorMessage.includes('hydration') ||
        errorMessage.includes('Text content does not match')) {
      console.warn('ConfigurationErrorBoundary: Hydration error ignored:', error)
      return { hasError: false, error: null }
    }

    // Don't catch translation errors
    if (errorMessage.includes('useTranslations') || 
        errorMessage.includes('translation') ||
        errorMessage.includes('IntlProvider')) {
      console.warn('ConfigurationErrorBoundary: Translation error ignored:', error)
      return { hasError: false, error: null }
    }

    // Don't catch auth context errors (we have fallbacks)
    if (errorMessage.includes('useAuth') || 
        errorMessage.includes('AuthProvider')) {
      console.warn('ConfigurationErrorBoundary: Auth context error ignored:', error)
      return { hasError: false, error: null }
    }

    // This is a real error we should catch
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error("Configuration Panel Error:", error, errorInfo)
    
    // Send to Sentry if available
    if (typeof window !== 'undefined' && (window as any).Sentry) {
      const Sentry = (window as any).Sentry
      Sentry.captureException(error, {
        contexts: {
          react: {
            componentStack: errorInfo.componentStack,
          },
        },
      })
    }
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="container mx-auto max-w-2xl py-8">
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Error al cargar la configuración</AlertTitle>
            <AlertDescription className="mt-2 space-y-2">
              <p>
                Ha ocurrido un error al intentar cargar el panel de configuración.
                Esto puede deberse a:
              </p>
              <ul className="list-disc list-inside space-y-1 text-sm">
                <li>Problema de conexión con la base de datos</li>
                <li>Sesión expirada o inválida</li>
                <li>Configuración incorrecta del servidor</li>
              </ul>
              <div className="mt-4 flex gap-2">
                <Button 
                  variant="default" 
                  size="sm"
                  onClick={() => this.setState({ hasError: false, error: null })}
                >
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Reintentar
                </Button>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => window.location.reload()}
                >
                  Recargar página
                </Button>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => window.location.href = "/es/dashboard"}
                >
                  Volver al Dashboard
                </Button>
              </div>
              {process.env.NODE_ENV === 'development' && this.state.error && (
                <details className="mt-4 text-xs">
                  <summary className="cursor-pointer font-medium">Detalles técnicos</summary>
                  <pre className="mt-2 p-2 bg-muted rounded overflow-auto">
                    {this.state.error.toString()}
                  </pre>
                </details>
              )}
            </AlertDescription>
          </Alert>
        </div>
      )
    }

    return this.props.children
  }
}
