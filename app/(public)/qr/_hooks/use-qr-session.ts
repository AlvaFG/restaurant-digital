"use client"

import { useEffect, useState } from "react"

/**
 * Session data stored in localStorage after QR validation
 */
export interface QrSessionData {
  sessionId: string
  tableId: string
  table: {
    id: string
    number: number
    zone: string
  }
  expiresAt: string
}

export interface UseQrSessionReturn {
  /** Session data if valid, null otherwise */
  session: QrSessionData | null
  /** True while validating session from localStorage */
  isValidating: boolean
  /** True if session exists but has expired */
  isExpired: boolean
  /** True if session tableId doesn't match current route tableId */
  isTableMismatch: boolean
  /** Error message if validation failed */
  error: string | null
  /** Clear session from localStorage */
  clearSession: () => void
}

const SESSION_KEY = "qr_session"
const SESSION_WARNING_THRESHOLD_MS = 10 * 60 * 1000 // 10 minutes before expiry

/**
 * Hook to manage and validate QR guest sessions
 * 
 * @param currentTableId - The tableId from the current route
 * @returns Session state and validation status
 * 
 * @example
 * ```tsx
 * const { session, isExpired, isTableMismatch } = useQrSession(tableId)
 * 
 * if (isExpired) {
 *   router.push('/qr/validate')
 * }
 * ```
 */
export function useQrSession(currentTableId: string): UseQrSessionReturn {
  const [session, setSession] = useState<QrSessionData | null>(null)
  const [isValidating, setIsValidating] = useState(true)
  const [isExpired, setIsExpired] = useState(false)
  const [isTableMismatch, setIsTableMismatch] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    validateSession()
  }, [currentTableId])

  const validateSession = () => {
    setIsValidating(true)
    setError(null)

    try {
      const sessionStr = localStorage.getItem(SESSION_KEY)

      if (!sessionStr) {
        setError("No se encontró una sesión activa")
        setSession(null)
        setIsExpired(false)
        setIsTableMismatch(false)
        setIsValidating(false)
        return
      }

      const sessionData = JSON.parse(sessionStr) as QrSessionData

      // Validate required fields
      if (!sessionData.sessionId || !sessionData.tableId || !sessionData.expiresAt) {
        setError("Sesión inválida o corrupta")
        setSession(null)
        setIsExpired(false)
        setIsTableMismatch(false)
        // Clear invalid session from localStorage
        try {
          localStorage.removeItem(SESSION_KEY)
        } catch (err) {
          console.error("[useQrSession] Error removing invalid session:", err)
        }
        setIsValidating(false)
        return
      }

      const expiresAt = new Date(sessionData.expiresAt)
      const now = new Date()

      // Check if session has expired
      if (expiresAt <= now) {
        setIsExpired(true)
        setError("La sesión ha expirado")
        setSession(sessionData) // Keep data for display purposes
        setIsValidating(false)
        return
      }

      // Check if tableId matches
      if (sessionData.tableId !== currentTableId) {
        setIsTableMismatch(true)
        setError(`Esta sesión es para la mesa ${sessionData.table?.number || sessionData.tableId}`)
        setSession(sessionData)
        setIsValidating(false)
        return
      }

      // Session is valid
      setSession(sessionData)
      setIsExpired(false)
      setIsTableMismatch(false)
      setError(null)

      // Warn if session is about to expire
      const timeUntilExpiry = expiresAt.getTime() - now.getTime()
      if (timeUntilExpiry < SESSION_WARNING_THRESHOLD_MS) {
        console.warn(`[useQrSession] Session expires in ${Math.round(timeUntilExpiry / 60000)} minutes`)
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : "Error desconocido"
      setError(`Error al validar sesión: ${message}`)
      setSession(null)
      console.error("[useQrSession] Validation error:", err)
    } finally {
      setIsValidating(false)
    }
  }

  const clearSession = () => {
    try {
      localStorage.removeItem(SESSION_KEY)
    } catch (err) {
      console.error("[useQrSession] Error clearing session:", err)
    }
    setSession(null)
    setIsExpired(false)
    setIsTableMismatch(false)
    setError(null)
  }

  return {
    session,
    isValidating,
    isExpired,
    isTableMismatch,
    error,
    clearSession,
  }
}
