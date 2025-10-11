"use client"

import { useState, useCallback } from "react"
import type { CheckoutData } from "../_components/qr-checkout-form"

interface OrderResponse {
  success: boolean
  order: {
    id: string
    status: string
    estimatedMinutes: number
    message: string
  }
}

interface OrderError {
  error: string
}

export interface UseQrOrderOptions {
  tableId: string
  sessionId: string | null
  onSuccess?: (orderId: string) => void
  onError?: (error: string) => void
}

/**
 * Hook for submitting QR orders to the API
 * 
 * @param options - Configuration options
 * @returns Order submission state and methods
 */
export function useQrOrder({ tableId, sessionId, onSuccess, onError }: UseQrOrderOptions) {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [lastOrderId, setLastOrderId] = useState<string | null>(null)

  const submitOrder = useCallback(async (data: CheckoutData) => {
    if (!sessionId) {
      const errorMsg = "No hay sesión activa. Por favor recarga la página."
      setError(errorMsg)
      onError?.(errorMsg)
      return
    }

    setIsSubmitting(true)
    setError(null)

    try {
      const response = await fetch('/api/order/qr', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          tableId,
          sessionId,
          ...data,
        }),
      })

      if (!response.ok) {
        const errorData = (await response.json()) as OrderError
        throw new Error(errorData.error || 'Error al enviar el pedido')
      }

      const result = (await response.json()) as OrderResponse

      if (!result.success) {
        throw new Error('Error al procesar el pedido')
      }

      setLastOrderId(result.order.id)
      onSuccess?.(result.order.id)

      return result.order
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Error desconocido'
      console.error('[useQrOrder] Error submitting order:', err)
      setError(errorMsg)
      onError?.(errorMsg)
      throw err
    } finally {
      setIsSubmitting(false)
    }
  }, [tableId, sessionId, onSuccess, onError])

  const resetError = useCallback(() => {
    setError(null)
  }, [])

  return {
    submitOrder,
    isSubmitting,
    error,
    lastOrderId,
    resetError,
  }
}
