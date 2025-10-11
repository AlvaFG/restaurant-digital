"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { CheckCircle2, Clock, ChefHat, Home } from "lucide-react"
import { useRouter } from "next/navigation"

interface QrOrderConfirmationProps {
  orderId: string
  estimatedMinutes?: number
  message?: string
  tableNumber?: number | null
  onBackToMenu?: () => void
}

export function QrOrderConfirmation({
  orderId,
  estimatedMinutes = 20,
  message = "Tu pedido ha sido recibido y está siendo preparado",
  tableNumber,
  onBackToMenu,
}: QrOrderConfirmationProps) {
  const router = useRouter()
  const [countdown, setCountdown] = useState(estimatedMinutes)

  useEffect(() => {
    const interval = setInterval(() => {
      setCountdown((prev) => (prev > 0 ? prev - 1 : 0))
    }, 60000) // Update every minute

    return () => clearInterval(interval)
  }, [])

  return (
    <div className="container max-w-2xl py-8 px-4">
      <Card className="text-center">
        <CardHeader className="pb-4">
          <div className="flex justify-center mb-4">
            <div className="rounded-full bg-green-100 dark:bg-green-900/20 p-4">
              <CheckCircle2 className="size-16 text-green-600 dark:text-green-500" aria-hidden="true" />
            </div>
          </div>
          <CardTitle className="text-2xl md:text-3xl">¡Pedido confirmado!</CardTitle>
          <CardDescription className="text-base mt-2">{message}</CardDescription>
        </CardHeader>

        <CardContent className="space-y-6 pb-6">
          {/* Order ID */}
          <div className="bg-muted rounded-lg p-4">
            <p className="text-sm text-muted-foreground mb-1">Número de pedido</p>
            <p className="text-2xl font-mono font-bold">{orderId.split('-').slice(-1)[0].toUpperCase()}</p>
          </div>

          {/* Estimated Time */}
          <div className="flex items-center justify-center gap-3">
            <Clock className="size-5 text-muted-foreground" aria-hidden="true" />
            <div>
              <p className="text-sm text-muted-foreground">Tiempo estimado</p>
              <p className="text-xl font-semibold">
                {countdown > 0 ? `${countdown} minutos` : 'Pronto estará listo'}
              </p>
            </div>
          </div>

          {/* Status Badge */}
          <div className="flex justify-center gap-2">
            <Badge variant="outline" className="text-sm py-1.5 px-3">
              <ChefHat className="size-4 mr-1.5" aria-hidden="true" />
              En cocina
            </Badge>
          </div>

          {/* Table Info */}
          {tableNumber && (
            <div className="border-t pt-4">
              <p className="text-sm text-muted-foreground">
                Mesa <span className="font-bold text-foreground">{tableNumber}</span>
              </p>
            </div>
          )}

          {/* Instructions */}
          <div className="bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4 text-left">
            <p className="text-sm font-medium text-blue-900 dark:text-blue-100 mb-2">
              📋 Información importante
            </p>
            <ul className="text-sm text-blue-800 dark:text-blue-200 space-y-1">
              <li>• El staff te avisará cuando esté listo</li>
              <li>• Puedes hacer más pedidos si lo necesitas</li>
              <li>• El pago se realiza al finalizar tu comida</li>
            </ul>
          </div>
        </CardContent>

        <CardFooter className="flex flex-col gap-3 pt-4">
          <Button
            onClick={onBackToMenu}
            size="lg"
            className="w-full"
            variant="default"
          >
            <Home className="mr-2 size-5" aria-hidden="true" />
            Volver al menú
          </Button>

          <Button
            onClick={() => router.push('/')}
            size="lg"
            variant="ghost"
            className="w-full"
          >
            Cerrar
          </Button>
        </CardFooter>
      </Card>

      {/* Animated Checkmark Effect */}
      <style jsx>{`
        @keyframes checkmark {
          0% {
            transform: scale(0.8);
            opacity: 0;
          }
          50% {
            transform: scale(1.1);
          }
          100% {
            transform: scale(1);
            opacity: 1;
          }
        }

        .check-animation {
          animation: checkmark 0.6s ease-out;
        }
      `}</style>
    </div>
  )
}
