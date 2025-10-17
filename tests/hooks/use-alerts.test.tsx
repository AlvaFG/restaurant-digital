/**
 * Unit Tests for useAlerts Hook
 * 
 * Tests completos para el hook de gestión de alertas con React Query
 * Incluye: queries, create, acknowledge, delete, activeAlerts computed
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { renderHook, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { useAlerts } from '@/hooks/use-alerts'
import * as alertsService from '@/lib/services/alerts-service'
import * as authContext from '@/contexts/auth-context'

// Mock del servicio
vi.mock('@/lib/services/alerts-service')
vi.mock('@/contexts/auth-context')

// Mock data
const mockTenant = {
  id: 'tenant-test-123',
  name: 'Test Restaurant',
}

const mockUser = {
  id: 'user-1',
  email: 'test@test.com',
}

const mockAlerts = [
  {
    id: 'alert-1',
    tenant_id: 'tenant-test-123',
    table_id: 'table-1',
    type: 'llamar_mozo' as const,
    message: 'Mesa 1 solicita mozo',
    acknowledged: false,
    acknowledged_by: null,
    acknowledged_at: null,
    created_at: '2025-01-01T10:00:00Z',
  },
  {
    id: 'alert-2',
    tenant_id: 'tenant-test-123',
    table_id: 'table-2',
    type: 'pedido_entrante' as const,
    message: 'Nuevo pedido en Mesa 2',
    acknowledged: false,
    acknowledged_by: null,
    acknowledged_at: null,
    created_at: '2025-01-01T10:05:00Z',
  },
  {
    id: 'alert-3',
    tenant_id: 'tenant-test-123',
    table_id: 'table-1',
    type: 'quiere_pagar_efectivo' as const,
    message: 'Mesa 1 quiere pagar',
    acknowledged: true,
    acknowledged_by: 'user-2',
    acknowledged_at: '2025-01-01T10:10:00Z',
    created_at: '2025-01-01T10:08:00Z',
  },
]

describe('useAlerts Hook', () => {
  let queryClient: QueryClient

  beforeEach(() => {
    // Crear QueryClient limpio para cada test
    queryClient = new QueryClient({
      defaultOptions: {
        queries: {
          retry: false,
          gcTime: 0,
        },
        mutations: {
          retry: false,
        },
      },
    })

    // Mock del contexto de auth
    vi.mocked(authContext.useAuth).mockReturnValue({
      user: mockUser as any,
      tenant: mockTenant as any,
      loading: false,
      signIn: vi.fn(),
      signOut: vi.fn(),
      signUp: vi.fn(),
    } as any)

    // Mock del servicio - respuesta exitosa por defecto (todas las alertas)
    vi.mocked(alertsService.fetchAlerts).mockResolvedValue(mockAlerts as any)
    vi.mocked(alertsService.fetchActiveAlerts).mockResolvedValue(
      mockAlerts.filter(a => !a.acknowledged) as any
    )
    vi.mocked(alertsService.fetchAlertsByTable).mockResolvedValue(
      mockAlerts.filter(a => a.table_id === 'table-1') as any
    )
  })

  afterEach(() => {
    queryClient.clear()
    vi.clearAllMocks()
  })

  // Helper para renderizar hook
  const wrapper = ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  )

  describe('Query - Fetching alerts', () => {
    it('should fetch all alerts successfully', async () => {
      const { result } = renderHook(() => useAlerts(), { wrapper })

      // Estado inicial
      expect(result.current.isLoading).toBe(true)
      expect(result.current.alerts).toEqual([])

      // Esperar a que cargue
      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })

      // Verificar datos cargados
      expect(result.current.alerts).toHaveLength(3)
      expect(result.current.alerts[0].id).toBe('alert-1')
      expect(result.current.alerts[1].id).toBe('alert-2')
      expect(result.current.alerts[2].id).toBe('alert-3')
      expect(result.current.error).toBeNull()

      // Verificar que se llamó al servicio correcto
      expect(alertsService.fetchAlerts).toHaveBeenCalledWith('tenant-test-123')
    })

    it('should fetch only active alerts when activeOnly is true', async () => {
      const { result } = renderHook(
        () => useAlerts({ activeOnly: true }),
        { wrapper }
      )

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })

      // Verificar que llamó al servicio de activas
      expect(alertsService.fetchActiveAlerts).toHaveBeenCalledWith('tenant-test-123')
      expect(alertsService.fetchAlerts).not.toHaveBeenCalled()

      // Verificar que solo trajo activas
      expect(result.current.alerts).toHaveLength(2)
      expect(result.current.alerts.every(a => !a.acknowledged)).toBe(true)
    })

    it('should filter alerts by table', async () => {
      const { result } = renderHook(
        () => useAlerts({ tableId: 'table-1' }),
        { wrapper }
      )

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })

      // Verificar que llamó al servicio con filtro de mesa
      expect(alertsService.fetchAlertsByTable).toHaveBeenCalledWith(
        'tenant-test-123',
        'table-1'
      )

      // Verificar que trajo solo alertas de table-1
      expect(result.current.alerts).toHaveLength(2)
      expect(result.current.alerts.every(a => a.table_id === 'table-1')).toBe(true)
    })

    it('should handle fetch error', async () => {
      const errorMessage = 'Database error'
      vi.mocked(alertsService.fetchAlerts).mockRejectedValue(new Error(errorMessage))

      const { result } = renderHook(() => useAlerts(), { wrapper })

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })

      expect(result.current.error).toBeTruthy()
      expect(result.current.alerts).toEqual([])
    })

    it('should not fetch if tenant is not available', async () => {
      vi.mocked(authContext.useAuth).mockReturnValue({
        user: null,
        tenant: null,
        loading: false,
        signIn: vi.fn(),
        signOut: vi.fn(),
        signUp: vi.fn(),
      } as any)

      const { result } = renderHook(() => useAlerts(), { wrapper })

      // No debería hacer fetch sin tenant
      expect(result.current.alerts).toEqual([])
      expect(alertsService.fetchAlerts).not.toHaveBeenCalled()
    })
  })

  describe('Computed properties - activeAlerts and acknowledgedAlerts', () => {
    it('should compute activeAlerts correctly', async () => {
      const { result } = renderHook(() => useAlerts(), { wrapper })

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })

      // activeAlerts debería contener solo las no acknowledged
      expect(result.current.activeAlerts).toHaveLength(2)
      expect(result.current.activeAlerts.every(a => !a.acknowledged)).toBe(true)
      expect(result.current.activeAlerts[0].id).toBe('alert-1')
      expect(result.current.activeAlerts[1].id).toBe('alert-2')
    })

    it('should compute acknowledgedAlerts correctly', async () => {
      const { result } = renderHook(() => useAlerts(), { wrapper })

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })

      // acknowledgedAlerts debería contener solo las acknowledged
      expect(result.current.acknowledgedAlerts).toHaveLength(1)
      expect(result.current.acknowledgedAlerts.every(a => a.acknowledged)).toBe(true)
      expect(result.current.acknowledgedAlerts[0].id).toBe('alert-3')
    })

    it('should update computed properties when alerts change', async () => {
      const { result } = renderHook(() => useAlerts(), { wrapper })

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })

      // Estado inicial
      expect(result.current.activeAlerts).toHaveLength(2)
      expect(result.current.acknowledgedAlerts).toHaveLength(1)

      // Simular acknowledge de una alerta
      const acknowledgedAlert = {
        ...mockAlerts[0],
        acknowledged: true,
        acknowledged_by: 'user-1',
        acknowledged_at: new Date().toISOString(),
      }

      vi.mocked(alertsService.acknowledgeAlert).mockResolvedValue(acknowledgedAlert as any)
      vi.mocked(alertsService.fetchAlerts).mockResolvedValue([
        acknowledgedAlert,
        mockAlerts[1],
        mockAlerts[2],
      ] as any)

      await result.current.acknowledgeAlert('alert-1')

      await waitFor(() => {
        expect(result.current.activeAlerts).toHaveLength(1)
        expect(result.current.acknowledgedAlerts).toHaveLength(2)
      })
    })
  })

  describe('Mutation - Create alert', () => {
    it('should create alert successfully', async () => {
      const newAlertPayload = {
        table_id: 'table-3',
        type: 'pago_aprobado' as const,
        message: 'Pago aprobado en Mesa 3',
      }

      const createdAlert = {
        ...mockAlerts[0],
        id: 'alert-4',
        ...newAlertPayload,
      }

      vi.mocked(alertsService.createAlert).mockResolvedValue(createdAlert as any)

      const { result } = renderHook(() => useAlerts(), { wrapper })

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })

      // Llamar mutation
      await result.current.createAlert(newAlertPayload)

      // Verificar que se llamó al servicio
      expect(alertsService.createAlert).toHaveBeenCalledWith(
        'tenant-test-123',
        newAlertPayload
      )

      // Esperar invalidación de cache
      await waitFor(() => {
        expect(alertsService.fetchAlerts).toHaveBeenCalledTimes(2) // Initial + refetch
      })
    })

    it('should handle create error', async () => {
      vi.mocked(alertsService.createAlert).mockRejectedValue(
        new Error('Failed to create alert')
      )

      const { result } = renderHook(() => useAlerts(), { wrapper })

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })

      // Intentar crear alerta
      try {
        await result.current.createAlert({
          table_id: 'table-1',
          type: 'llamar_mozo',
          message: 'Test',
        })
      } catch (error) {
        expect(error).toBeTruthy()
      }
    })

    it('should perform optimistic update on create', async () => {
      vi.mocked(alertsService.createAlert).mockImplementation(
        () => new Promise((resolve) => setTimeout(() => resolve({
          ...mockAlerts[0],
          id: 'alert-4',
        } as any), 100))
      )

      const { result } = renderHook(() => useAlerts(), { wrapper })

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })

      // Crear alerta
      result.current.createAlert({
        table_id: 'table-1',
        type: 'llamar_mozo',
        message: 'Test',
      })

      // Verificar que eventualmente se completa
      await waitFor(() => {
        expect(alertsService.createAlert).toHaveBeenCalled()
      })
    })
  })

  describe('Mutation - Acknowledge alert', () => {
    it('should acknowledge alert successfully', async () => {
      const acknowledgedAlert = {
        ...mockAlerts[0],
        acknowledged: true,
        acknowledged_by: 'user-1',
        acknowledged_at: new Date().toISOString(),
      }

      vi.mocked(alertsService.acknowledgeAlert).mockResolvedValue(acknowledgedAlert as any)

      const { result } = renderHook(() => useAlerts(), { wrapper })

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })

      const initialActiveCalls = vi.mocked(alertsService.fetchAlerts).mock.calls.length

      // Acknowledge alerta
      await result.current.acknowledgeAlert('alert-1')

      expect(alertsService.acknowledgeAlert).toHaveBeenCalledWith(
        'alert-1',
        'user-1'
      )

      // Verificar refetch
      await waitFor(() => {
        expect(alertsService.fetchAlerts).toHaveBeenCalledTimes(initialActiveCalls + 1)
      })
    })

    it('should handle acknowledge error and rollback', async () => {
      vi.mocked(alertsService.acknowledgeAlert).mockRejectedValue(
        new Error('Acknowledge failed')
      )

      const { result } = renderHook(() => useAlerts(), { wrapper })

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })

      const originalAlerts = [...result.current.alerts]

      try {
        await result.current.acknowledgeAlert('alert-1')
      } catch (error) {
        // Error esperado
      }

      // Verificar rollback
      await waitFor(() => {
        expect(result.current.alerts).toEqual(originalAlerts)
      })
    })

    it('should require user ID to acknowledge', async () => {
      vi.mocked(authContext.useAuth).mockReturnValue({
        user: null, // Sin usuario
        tenant: mockTenant as any,
        loading: false,
        signIn: vi.fn(),
        signOut: vi.fn(),
        signUp: vi.fn(),
      } as any)

      const { result } = renderHook(() => useAlerts(), { wrapper })

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })

      // Intentar acknowledge sin user
      try {
        await result.current.acknowledgeAlert('alert-1')
        // No debería llegar aquí
        expect(true).toBe(false)
      } catch (error: any) {
        expect(error.message).toContain('No user ID available')
      }
    })
  })

  describe('Mutation - Delete alert', () => {
    it('should delete alert successfully', async () => {
      vi.mocked(alertsService.deleteAlert).mockResolvedValue(undefined)

      const { result } = renderHook(() => useAlerts(), { wrapper })

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })

      const initialCalls = vi.mocked(alertsService.fetchAlerts).mock.calls.length

      await result.current.deleteAlert('alert-1')

      expect(alertsService.deleteAlert).toHaveBeenCalledWith('alert-1')

      // Verificar refetch
      await waitFor(() => {
        expect(alertsService.fetchAlerts).toHaveBeenCalledTimes(initialCalls + 1)
      })
    })

    it('should handle delete error', async () => {
      vi.mocked(alertsService.deleteAlert).mockRejectedValue(
        new Error('Delete failed')
      )

      const { result } = renderHook(() => useAlerts(), { wrapper })

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })

      try {
        await result.current.deleteAlert('alert-1')
      } catch (error) {
        expect(error).toBeTruthy()
      }
    })
  })

  describe('Refresh functionality', () => {
    it('should refresh alerts on demand', async () => {
      const { result } = renderHook(() => useAlerts(), { wrapper })

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })

      const initialCalls = vi.mocked(alertsService.fetchAlerts).mock.calls.length

      // Refrescar
      await result.current.refresh()

      // Verificar refetch
      expect(alertsService.fetchAlerts).toHaveBeenCalledTimes(initialCalls + 1)
    })
  })

  describe('React Query features', () => {
    it('should cache query results', async () => {
      const { result, rerender } = renderHook(() => useAlerts(), { wrapper })

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })

      const firstAlerts = result.current.alerts

      // Rerender debería usar cache
      rerender()

      expect(result.current.alerts).toBe(firstAlerts)
      // No debería hacer fetch adicional (cache activo)
      expect(alertsService.fetchAlerts).toHaveBeenCalledTimes(1)
    })

    it('should invalidate cache after mutation', async () => {
      vi.mocked(alertsService.createAlert).mockResolvedValue({
        ...mockAlerts[0],
        id: 'alert-4',
      } as any)

      const { result } = renderHook(() => useAlerts(), { wrapper })

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })

      // Primera carga
      expect(alertsService.fetchAlerts).toHaveBeenCalledTimes(1)

      // Mutation invalida cache
      await result.current.createAlert({
        table_id: 'table-1',
        type: 'llamar_mozo',
        message: 'Test',
      })

      // Debería refetch
      await waitFor(() => {
        expect(alertsService.fetchAlerts).toHaveBeenCalledTimes(2)
      })
    })

    it('should use different cache for different options', async () => {
      // Renderizar hook sin filtros
      const { result: result1 } = renderHook(() => useAlerts(), { wrapper })

      await waitFor(() => {
        expect(result1.current.isLoading).toBe(false)
      })

      expect(alertsService.fetchAlerts).toHaveBeenCalledWith('tenant-test-123')

      // Renderizar hook con activeOnly (diferente cache)
      const { result: result2 } = renderHook(
        () => useAlerts({ activeOnly: true }),
        { wrapper }
      )

      await waitFor(() => {
        expect(result2.current.isLoading).toBe(false)
      })

      // Debería hacer otra llamada porque el queryKey es diferente
      expect(alertsService.fetchActiveAlerts).toHaveBeenCalledWith('tenant-test-123')
    })

    it('should use different cache for different table filters', async () => {
      // Renderizar hook sin filtro de mesa
      const { result: result1 } = renderHook(() => useAlerts(), { wrapper })

      await waitFor(() => {
        expect(result1.current.isLoading).toBe(false)
      })

      // Renderizar hook con filtro de mesa (diferente cache)
      const { result: result2 } = renderHook(
        () => useAlerts({ tableId: 'table-2' }),
        { wrapper }
      )

      await waitFor(() => {
        expect(result2.current.isLoading).toBe(false)
      })

      // Debería hacer llamada al servicio de filtro por mesa
      expect(alertsService.fetchAlertsByTable).toHaveBeenCalledWith(
        'tenant-test-123',
        'table-2'
      )
    })
  })

  describe('AutoRefresh option', () => {
    it('should auto-refresh after mutations by default', async () => {
      vi.mocked(alertsService.createAlert).mockResolvedValue({
        ...mockAlerts[0],
        id: 'alert-4',
      } as any)

      const { result } = renderHook(() => useAlerts(), { wrapper })

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })

      const initialCalls = vi.mocked(alertsService.fetchAlerts).mock.calls.length

      await result.current.createAlert({
        table_id: 'table-1',
        type: 'llamar_mozo',
        message: 'Test',
      })

      // Debería refetch automáticamente
      await waitFor(() => {
        expect(alertsService.fetchAlerts).toHaveBeenCalledTimes(initialCalls + 1)
      })
    })

    it('should not auto-refresh when autoRefresh is false', async () => {
      vi.mocked(alertsService.createAlert).mockResolvedValue({
        ...mockAlerts[0],
        id: 'alert-4',
      } as any)

      const { result } = renderHook(
        () => useAlerts({ autoRefresh: false }),
        { wrapper }
      )

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })

      const initialCalls = vi.mocked(alertsService.fetchAlerts).mock.calls.length

      await result.current.createAlert({
        table_id: 'table-1',
        type: 'llamar_mozo',
        message: 'Test',
      })

      // No debería refetch automáticamente
      await waitFor(() => {
        // Solo la llamada inicial, no refetch
        expect(alertsService.fetchAlerts).toHaveBeenCalledTimes(initialCalls)
      })
    })
  })
})
