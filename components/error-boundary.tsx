"use client"

import { Component, type ReactNode, type ErrorInfo } from "react"
import { AlertTriangle, RefreshCw } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { createLogger } from "@/lib/logger"

const logger = createLogger('error-boundary')

interface Props {
  children: ReactNode
  fallback?: ReactNode
}

interface State {
  hasError: boolean
  error?: Error
  errorInfo?: ErrorInfo
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = { hasError: false }
  }

  static getDerivedStateFromError(error: Error): State {
    // Skip certain non-critical errors
    const errorMessage = error.message || error.toString()
    
    // Don't catch hydration mismatches - let React handle them
    if (errorMessage.includes('Hydration') || 
        errorMessage.includes('hydration') ||
        errorMessage.includes('Text content does not match')) {
      console.warn('Hydration error ignored by error boundary:', error)
      // Return state that doesn't trigger error UI
      return { hasError: false }
    }

    // Don't catch translation errors
    if (errorMessage.includes('useTranslations') || 
        errorMessage.includes('translation') ||
        errorMessage.includes('IntlProvider')) {
      console.warn('Translation error ignored by error boundary:', error)
      return { hasError: false }
    }

    // Don't catch auth context errors (we have fallbacks)
    if (errorMessage.includes('useAuth') || 
        errorMessage.includes('AuthProvider')) {
      console.warn('Auth context error ignored by error boundary:', error)
      return { hasError: false }
    }

    // This is a real error we should catch
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    // Skip catching certain non-critical errors
    const errorMessage = error.message || error.toString()
    
    // Don't catch hydration mismatches - let React handle them
    if (errorMessage.includes('Hydration') || errorMessage.includes('hydration')) {
      console.warn('Hydration error caught and ignored:', error)
      return
    }

    // Don't catch translation errors - component should handle them
    if (errorMessage.includes('useTranslations') || errorMessage.includes('translation')) {
      console.warn('Translation error caught and ignored:', error)
      return
    }

    // ✅ Log estructurado
    logger.error('React error boundary caught error', error, {
      componentStack: errorInfo.componentStack,
      route: typeof window !== 'undefined' ? window.location.pathname : 'unknown',
    })

    // ✅ Enviar a Sentry si está disponible
    if (typeof window !== 'undefined' && (window as any).Sentry) {
      const Sentry = (window as any).Sentry
      Sentry.withScope((scope: any) => {
        scope.setContext('react', {
          componentStack: errorInfo.componentStack,
        })
        scope.setContext('location', {
          pathname: window.location.pathname,
          search: window.location.search,
        })
        Sentry.captureException(error)
      })
    }

    this.setState({ errorInfo })
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback
      }

      return (
        <div className="flex items-center justify-center min-h-[400px] p-4">
          <Card className="w-full max-w-md">
            <CardHeader className="text-center">
              <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-destructive/10">
                <AlertTriangle className="h-6 w-6 text-destructive" />
              </div>
              <CardTitle>Algo salió mal</CardTitle>
              <CardDescription>
                Ha ocurrido un error inesperado. Nuestro equipo ha sido notificado automáticamente.
              </CardDescription>
            </CardHeader>
            <CardContent className="text-center space-y-2">
              <div className="space-y-2">
                <Button 
                  onClick={() => this.setState({ hasError: false, error: undefined, errorInfo: undefined })} 
                  className="w-full"
                  variant="default"
                >
                  <RefreshCw className="mr-2 h-4 w-4" />
                  Reintentar
                </Button>
                <Button 
                  onClick={() => window.location.reload()} 
                  className="w-full"
                  variant="outline"
                >
                  Recargar página completa
                </Button>
              </div>
              
              {this.state.error && (
                <details className="mt-4 text-left">
                  <summary className="cursor-pointer text-sm text-muted-foreground hover:text-foreground">
                    Ver detalles del error
                  </summary>
                  <pre className="mt-2 text-xs bg-muted p-2 rounded overflow-auto max-h-40">
                    {this.state.error.toString()}
                    {this.state.errorInfo?.componentStack && `\n\nComponent Stack:\n${this.state.errorInfo.componentStack}`}
                  </pre>
                </details>
              )}
            </CardContent>
          </Card>
        </div>
      )
    }

    return this.props.children
  }
}

