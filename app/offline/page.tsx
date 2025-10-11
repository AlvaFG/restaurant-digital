"use client"

import { WifiOff } from "lucide-react"
import { Button } from "@/components/ui/button"

export default function OfflinePage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background px-4 text-center">
      <WifiOff className="size-20 text-muted-foreground mb-6" aria-hidden="true" />
      <h1 className="text-3xl font-bold mb-2">Sin conexión</h1>
      <p className="text-muted-foreground mb-6 max-w-md">
        No tienes conexión a internet en este momento. Por favor verifica tu conexión e intenta nuevamente.
      </p>
      <Button
        onClick={() => window.location.reload()}
        size="lg"
      >
        Reintentar
      </Button>
    </div>
  )
}
