/**
 * useAlerts Hook - Supabase Integration with React Query
 * 
 * Hook para gestionar alertas de mesas desde componentes React con caché y optimistic updates.
 * Proporciona funciones para crear, obtener y gestionar alertas (notificaciones).
 * 
 * Tipos de alertas soportadas:
 * - llamar_mozo: Cliente solicita mozo
 * - pedido_entrante: Nuevo pedido incoming
 * - quiere_pagar_efectivo: Cliente quiere pagar en efectivo
 * - pago_aprobado: Pago aprobado por sistema
 */

"use client"

import { useMemo } from "react"
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useAuth } from "@/contexts/auth-context"
import type { Database } from "@/lib/supabase/database.types"
import {
  fetchAlerts,
  fetchActiveAlerts,
  createAlert as createAlertService,
  acknowledgeAlert as acknowledgeAlertService,
  deleteAlert as deleteAlertService,
  fetchAlertsByTable
} from "@/lib/services/alerts-service"

// Type definitions from Supabase generated types
type Alert = Database['public']['Tables']['alerts']['Row']

type CreateAlertPayload = {
  table_id: string
  type: Alert['type']
  message: string
}

interface UseAlertsOptions {
  /**
   * Si true, solo devuelve alertas activas (no confirmadas)
   * @default false
   */
  activeOnly?: boolean
  /**
   * ID de mesa para filtrar alertas
   */
  tableId?: string
  /**
   * Si true, refresca automáticamente después de mutations
   * @default true
   */
  autoRefresh?: boolean
}

interface UseAlertsReturn {
  /** Lista completa de alertas (o filtrada) */
  alerts: Alert[]
  /** Solo alertas activas (no confirmadas) */
  activeAlerts: Alert[]
  /** Alertas ya atendidas */
  acknowledgedAlerts: Alert[]
  /** Estado de carga */
  isLoading: boolean
  /** Error si ocurre */
  error: Error | null
  /** Crear nueva alerta */
  createAlert: (payload: CreateAlertPayload) => Promise<Alert>
  /** Marcar alerta como atendida */
  acknowledgeAlert: (alertId: string) => Promise<void>
  /** Eliminar alerta */
  deleteAlert: (alertId: string) => Promise<void>
  /** Refrescar manualmente la lista de alertas */
  refresh: () => void
}

/**
 * Hook useAlerts - Gestión de alertas de restaurante con React Query
 * 
 * @example Uso básico
 * ```tsx
 * function AlertsPanel() {
 *   const { alerts, activeAlerts, acknowledgeAlert, isLoading } = useAlerts()
 *   
 *   return (
 *     <div>
 *       {activeAlerts.map(alert => (
 *         <div key={alert.id}>
 *           {alert.message}
 *           <button onClick={() => acknowledgeAlert(alert.id)}>Atender</button>
 *         </div>
 *       ))}
 *     </div>
 *   )
 * }
 * ```
 * 
 * @example Solo alertas activas
 * ```tsx
 * const { activeAlerts } = useAlerts({ activeOnly: true })
 * ```
 * 
 * @example Filtrar por mesa
 * ```tsx
 * const { alerts } = useAlerts({ tableId: 'mesa-123' })
 * ```
 */
export function useAlerts(options: UseAlertsOptions = {}): UseAlertsReturn {
  const { activeOnly = false, tableId, autoRefresh = true } = options
  const { user, tenant } = useAuth()
  const tenantId = tenant?.id
  const queryClient = useQueryClient()

  const queryKey = ['alerts', tenantId, { activeOnly, tableId }]

  const {
    data: alerts = [],
    isLoading,
    error,
  } = useQuery({
    queryKey,
    queryFn: async () => {
      if (!tenantId) return []
      
      let data: Alert[]
      
      if (tableId) {
        data = await fetchAlertsByTable(tenantId, tableId)
      } else if (activeOnly) {
        data = await fetchActiveAlerts(tenantId)
      } else {
        data = await fetchAlerts(tenantId)
      }
      
      return data
    },
    enabled: !!tenantId,
  })

  const createAlertMutation = useMutation({
    mutationFn: async (payload: CreateAlertPayload) => {
      if (!tenantId) throw new Error('No tenant ID available')
      return await createAlertService(tenantId, payload)
    },
    onMutate: async (newAlert) => {
      await queryClient.cancelQueries({ queryKey })
      const previousAlerts = queryClient.getQueryData(queryKey)
      
      queryClient.setQueryData(queryKey, (old: Alert[] = []) => [
        {
          ...newAlert,
          id: 'temp-' + Date.now(),
          tenant_id: tenantId!,
          acknowledged: false,
          acknowledged_by: null,
          acknowledged_at: null,
          created_at: new Date().toISOString(),
        } as Alert,
        ...old,
      ])
      
      return { previousAlerts }
    },
    onError: (err, newAlert, context) => {
      queryClient.setQueryData(queryKey, context?.previousAlerts)
    },
    onSettled: () => {
      if (autoRefresh) {
        queryClient.invalidateQueries({ queryKey })
      }
    },
  })

  const acknowledgeAlertMutation = useMutation({
    mutationFn: async (alertId: string) => {
      if (!user?.id) throw new Error('No user ID available')
      await acknowledgeAlertService(alertId, user.id)
    },
    onMutate: async (alertId) => {
      await queryClient.cancelQueries({ queryKey })
      const previousAlerts = queryClient.getQueryData(queryKey)
      
      queryClient.setQueryData(queryKey, (old: Alert[] = []) =>
        old.map((alert) =>
          alert.id === alertId
            ? {
                ...alert,
                acknowledged: true,
                acknowledged_by: user?.id || null,
                acknowledged_at: new Date().toISOString(),
              }
            : alert
        )
      )
      
      return { previousAlerts }
    },
    onError: (err, alertId, context) => {
      queryClient.setQueryData(queryKey, context?.previousAlerts)
    },
    onSettled: () => {
      if (autoRefresh) {
        queryClient.invalidateQueries({ queryKey })
      }
    },
  })

  const deleteAlertMutation = useMutation({
    mutationFn: async (alertId: string) => {
      await deleteAlertService(alertId)
    },
    onMutate: async (alertId) => {
      await queryClient.cancelQueries({ queryKey })
      const previousAlerts = queryClient.getQueryData(queryKey)
      
      queryClient.setQueryData(queryKey, (old: Alert[] = []) =>
        old.filter((alert) => alert.id !== alertId)
      )
      
      return { previousAlerts }
    },
    onError: (err, alertId, context) => {
      queryClient.setQueryData(queryKey, context?.previousAlerts)
    },
    onSettled: () => {
      if (autoRefresh) {
        queryClient.invalidateQueries({ queryKey })
      }
    },
  })

  /**
   * Derivar alertas activas y atendidas usando useMemo
   */
  const activeAlerts = useMemo(() => alerts.filter(alert => !alert.acknowledged), [alerts])
  const acknowledgedAlerts = useMemo(() => alerts.filter(alert => alert.acknowledged), [alerts])

  return {
    alerts,
    activeAlerts,
    acknowledgedAlerts,
    isLoading,
    error: error as Error | null,
    createAlert: (payload: CreateAlertPayload) => createAlertMutation.mutateAsync(payload),
    acknowledgeAlert: (alertId: string) => acknowledgeAlertMutation.mutateAsync(alertId),
    deleteAlert: (alertId: string) => deleteAlertMutation.mutateAsync(alertId),
    refresh: () => queryClient.invalidateQueries({ queryKey }),
  }
}
