"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

export default function TestErrorPage() {
  const [shouldThrow, setShouldThrow] = useState(false)

  if (shouldThrow) {
    throw new Error('🧪 Test error from Error Boundary - Fase 5.6 Testing')
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>🧪 Test Error Boundary</CardTitle>
          <CardDescription>
            Prueba del sistema de logging y error tracking implementado en Fase 5
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <h3 className="font-semibold">¿Qué va a pasar?</h3>
            <ul className="list-disc list-inside text-sm text-muted-foreground space-y-1">
              <li>Se lanzará un error de React</li>
              <li>El Error Boundary lo capturará</li>
              <li>Se mostrará UI de error mejorado</li>
              <li>Se logueará estructuradamente</li>
              <li>Si configuraste Sentry DSN, se enviará a Sentry</li>
            </ul>
          </div>

          <Button 
            onClick={() => setShouldThrow(true)}
            variant="destructive"
            className="w-full"
          >
            🚨 Lanzar Error de Prueba
          </Button>

          <div className="text-xs text-muted-foreground">
            <strong>Nota:</strong> Después del error, recarga la página para volver aquí.
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
