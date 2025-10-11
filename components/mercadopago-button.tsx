/**
 * MercadoPago Payment Button Component
 * Handles payment preference creation and redirect to MercadoPago checkout
 */

'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { CreditCard, Loader2 } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'

interface MercadoPagoButtonProps {
  orderId: string
  amount: number // in cents
  onSuccess?: () => void
  onError?: (error: Error) => void
  disabled?: boolean
  className?: string
}

export function MercadoPagoButton({
  orderId,
  amount,
  onSuccess,
  onError,
  disabled,
  className,
}: MercadoPagoButtonProps) {
  const [isLoading, setIsLoading] = useState(false)
  const { toast } = useToast()

  const handlePayment = async () => {
    try {
      setIsLoading(true)

      // Create payment preference
      const response = await fetch('/api/payment/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderId }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to create payment')
      }

      const { success, data, error } = await response.json()

      if (!success) {
        throw new Error(error || 'Failed to create payment')
      }

      // Success callback
      onSuccess?.()

      // Redirect to MercadoPago checkout
      // Use sandbox for testing, production for live
      const checkoutUrl = data.sandboxInitPoint || data.initPoint
      
      toast({
        title: 'Redirigiendo a MercadoPago',
        description: 'Serás redirigido al checkout en un momento...',
      })

      // Small delay for better UX
      setTimeout(() => {
        window.location.href = checkoutUrl
      }, 500)
    } catch (error) {
      console.error('Payment error:', error)
      
      toast({
        title: 'Error al procesar pago',
        description: error instanceof Error ? error.message : 'Intenta nuevamente',
        variant: 'destructive',
      })

      onError?.(error as Error)
      setIsLoading(false)
    }
  }

  const formattedAmount = `$${(amount / 100).toFixed(2)}`

  return (
    <Button
      onClick={handlePayment}
      disabled={isLoading || disabled}
      className={className}
      size="lg"
      style={{
        backgroundColor: '#00B1EA',
        color: '#fff',
      }}
      onMouseEnter={(e) => {
        if (!isLoading && !disabled) {
          e.currentTarget.style.backgroundColor = '#009DD1'
        }
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.backgroundColor = '#00B1EA'
      }}
    >
      {isLoading ? (
        <>
          <Loader2 className="mr-2 h-5 w-5 animate-spin" />
          Procesando...
        </>
      ) : (
        <>
          <CreditCard className="mr-2 h-5 w-5" />
          Pagar con MercadoPago ({formattedAmount})
        </>
      )}
    </Button>
  )
}
