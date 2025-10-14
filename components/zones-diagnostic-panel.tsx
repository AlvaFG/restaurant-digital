"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { CheckCircle2, XCircle, AlertCircle, Play, Loader2 } from "lucide-react"

interface DiagnosticStep {
  step: number | string
  name: string
  status: 'success' | 'error' | 'warning' | 'running'
  data?: any
  error?: string
  warning?: string
  suggestion?: string
}

interface DiagnosticResult {
  timestamp: string
  steps: DiagnosticStep[]
  conclusion?: string
  solution?: string
  zonesCount?: number
}

export function ZonesDiagnosticPanel() {
  const [result, setResult] = useState<DiagnosticResult | null>(null)
  const [isRunning, setIsRunning] = useState(false)
  const [isSyncing, setIsSyncing] = useState(false)
  const [syncResult, setSyncResult] = useState<string | null>(null)

  const runDiagnostic = async () => {
    setIsRunning(true)
    setResult(null)
    setSyncResult(null)

    try {
      const response = await fetch('/api/debug/zones')
      const data = await response.json()
      setResult(data)
    } catch (error) {
      console.error('Error al ejecutar diagnóstico:', error)
      setResult({
        timestamp: new Date().toISOString(),
        steps: [],
        conclusion: '❌ Error al ejecutar el diagnóstico',
        solution: error instanceof Error ? error.message : 'Error desconocido',
      })
    } finally {
      setIsRunning(false)
    }
  }

  const syncMetadata = async () => {
    setIsSyncing(true)
    setSyncResult(null)

    try {
      const response = await fetch('/api/auth/sync-metadata', {
        method: 'POST',
      })
      const data = await response.json()

      if (response.ok) {
        setSyncResult('✅ Metadata sincronizado exitosamente. Recarga la página para ver los cambios.')
        // Re-ejecutar diagnóstico después de 1 segundo
        setTimeout(() => {
          runDiagnostic()
        }, 1000)
      } else {
        setSyncResult(`❌ Error: ${data.error || 'No se pudo sincronizar'}`)
      }
    } catch (error) {
      console.error('Error al sincronizar metadata:', error)
      setSyncResult(`❌ Error: ${error instanceof Error ? error.message : 'Error desconocido'}`)
    } finally {
      setIsSyncing(false)
    }
  }

  const getStatusIcon = (status: DiagnosticStep['status']) => {
    switch (status) {
      case 'success':
        return <CheckCircle2 className="h-5 w-5 text-green-500" />
      case 'error':
        return <XCircle className="h-5 w-5 text-red-500" />
      case 'warning':
        return <AlertCircle className="h-5 w-5 text-yellow-500" />
      case 'running':
        return <Loader2 className="h-5 w-5 animate-spin text-blue-500" />
    }
  }

  const getStatusBadge = (status: DiagnosticStep['status']) => {
    switch (status) {
      case 'success':
        return <Badge className="bg-green-500">Éxito</Badge>
      case 'error':
        return <Badge variant="destructive">Error</Badge>
      case 'warning':
        return <Badge className="bg-yellow-500">Advertencia</Badge>
      case 'running':
        return <Badge className="bg-blue-500">Ejecutando</Badge>
    }
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>🔍 Diagnóstico de Zonas</CardTitle>
          <CardDescription>
            Esta herramienta verifica la configuración completa del sistema de zonas,
            incluyendo autenticación, permisos RLS y datos en Supabase.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col gap-3">
            <Button onClick={runDiagnostic} disabled={isRunning}>
              {isRunning ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Ejecutando diagnóstico...
                </>
              ) : (
                <>
                  <Play className="mr-2 h-4 w-4" />
                  Ejecutar Diagnóstico
                </>
              )}
            </Button>

            {result && (result.conclusion?.includes('tenant_id') || result.steps?.some(step => 
              step.warning?.includes('tenant_id') || step.error?.includes('tenant_id')
            )) && (
              <div className="space-y-2 mt-4 p-4 border rounded-lg bg-yellow-50 dark:bg-yellow-950">
                <p className="text-sm font-medium text-yellow-800 dark:text-yellow-200">
                  ⚠️ Se detectó problema con tenant_id
                </p>
                <p className="text-sm text-yellow-700 dark:text-yellow-300">
                  El tenant_id está en la base de datos pero no en tu sesión. 
                  Haz clic abajo para sincronizarlo automáticamente.
                </p>
                <Button 
                  onClick={syncMetadata} 
                  disabled={isSyncing}
                  variant="default"
                  className="w-full bg-yellow-600 hover:bg-yellow-700"
                >
                  {isSyncing ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Sincronizando...
                    </>
                  ) : (
                    <>
                      🔄 Sincronizar tenant_id ahora
                    </>
                  )}
                </Button>
                {syncResult && (
                  <Alert className={syncResult.includes('✅') ? 'border-green-500' : 'border-red-500'}>
                    <AlertDescription className="font-medium">{syncResult}</AlertDescription>
                  </Alert>
                )}
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {result && (
        <>
          {/* Conclusión */}
          {result.conclusion && (
            <Alert variant={result.conclusion.includes('❌') ? 'destructive' : 'default'}>
              <AlertTitle className="text-lg font-semibold">
                {result.conclusion}
              </AlertTitle>
              {result.solution && (
                <AlertDescription className="mt-2">
                  <strong>Solución:</strong> {result.solution}
                </AlertDescription>
              )}
              {result.zonesCount !== undefined && (
                <AlertDescription className="mt-2">
                  <strong>Zonas encontradas:</strong> {result.zonesCount}
                </AlertDescription>
              )}
            </Alert>
          )}

          {/* Pasos del diagnóstico */}
          <Card>
            <CardHeader>
              <CardTitle>Pasos del Diagnóstico</CardTitle>
              <CardDescription>
                Ejecutado el {new Date(result.timestamp).toLocaleString('es-ES')}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {result.steps.map((step, index) => (
                  <div
                    key={index}
                    className="flex items-start gap-3 border-b pb-4 last:border-b-0"
                  >
                    <div className="flex-shrink-0 mt-1">
                      {getStatusIcon(step.status)}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <h4 className="font-medium">
                          {typeof step.step === 'number' ? `Paso ${step.step}:` : ''} {step.name}
                        </h4>
                        {getStatusBadge(step.status)}
                      </div>

                      {step.error && (
                        <p className="text-sm text-red-600 mt-1">
                          <strong>Error:</strong> {step.error}
                        </p>
                      )}

                      {step.warning && (
                        <p className="text-sm text-yellow-600 mt-1">
                          <strong>Advertencia:</strong> {step.warning}
                        </p>
                      )}

                      {step.suggestion && (
                        <p className="text-sm text-blue-600 mt-1">
                          <strong>Sugerencia:</strong> {step.suggestion}
                        </p>
                      )}

                      {step.data && (
                        <details className="mt-2">
                          <summary className="text-sm text-muted-foreground cursor-pointer hover:text-foreground">
                            Ver datos
                          </summary>
                          <pre className="mt-2 text-xs bg-muted p-2 rounded overflow-auto max-h-40">
                            {JSON.stringify(step.data, null, 2)}
                          </pre>
                        </details>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Información adicional */}
          <Card>
            <CardHeader>
              <CardTitle>📚 Recursos Adicionales</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <p>
                <strong>Documentación completa:</strong>{' '}
                <code>docs/DIAGNOSTICO_ZONAS.md</code>
              </p>
              <p>
                <strong>Console del navegador:</strong> Abre DevTools (F12) y busca logs
                que comiencen con [fetchZones], [GET /api/zones], [listZones]
              </p>
              <p>
                <strong>Supabase Dashboard:</strong> Revisa la tabla zones y las
                políticas RLS en Authentication → Policies
              </p>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  )
}
