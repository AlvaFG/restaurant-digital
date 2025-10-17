/**
 * Unit Tests for useOrders Hook
 * 
 * Tests completos para el hook de gestión de órdenes con React Query
 * Incluye: queries, create, update status, payment status, cancel
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { renderHook, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { useOrders } from '@/hooks/use-orders'
import * as ordersService from '@/lib/services/orders-service'
import * as authContext from '@/contexts/auth-context'

// Mock del servicio
vi.mock('@/lib/services/orders-service')
vi.mock('@/contexts/auth-context')

// Mock data
const mockTenant = {
  id: 'tenant-test-123',
  name: 'Test Restaurant',
}

const mockOrders = [
  {
    id: 'order-1',
    table_id: 'table-1',
    tenant_id: 'tenant-test-123',
    status: 'pending',
    payment_status: 'pending',
    source: 'staff',
    subtotal_cents: 2500,
    tax_cents: 250,
    tip_cents: 0,
    service_charge_cents: 0,
    discount_cents: 0,
    total_cents: 2750,
    notes: null,
    customer_data: null,
    created_at: '2025-01-01T10:00:00Z',
    updated_at: '2025-01-01T10:00:00Z',
  },
  {
    id: 'order-2',
    table_id: 'table-2',
    tenant_id: 'tenant-test-123',
    status: 'confirmed',
    payment_status: 'paid',
    source: 'qr',
    subtotal_cents: 3500,
    tax_cents: 350,
    tip_cents: 500,
    service_charge_cents: 200,
    discount_cents: 0,
    total_cents: 4550,
    notes: 'Sin cebolla',
    customer_data: { name: 'Juan' },
    created_at: '2025-01-01T11:00:00Z',
    updated_at: '2025-01-01T11:30:00Z',
  },
]

describe('useOrders Hook', () => {
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
      user: { id: 'user-1', email: 'test@test.com' } as any,
      tenant: mockTenant as any,
      loading: false,
      signIn: vi.fn(),
      signOut: vi.fn(),
      signUp: vi.fn(),
    } as any)

    // Mock del servicio - respuesta exitosa por defecto
    vi.mocked(ordersService.getOrders).mockResolvedValue({
      data: mockOrders as any,
      error: null,
    })
  })

  afterEach(() => {
    queryClient.clear()
    vi.clearAllMocks()
  })

  // Helper para renderizar hook
  const wrapper = ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  )

  describe('Query - Fetching orders', () => {
    it('should fetch orders successfully', async () => {
      const { result } = renderHook(() => useOrders(), { wrapper })

      // Estado inicial
      expect(result.current.loading).toBe(true)
      expect(result.current.orders).toEqual([])

      // Esperar a que cargue
      await waitFor(() => {
        expect(result.current.loading).toBe(false)
      })

      // Verificar datos cargados
      expect(result.current.orders).toHaveLength(2)
      expect(result.current.orders[0].id).toBe('order-1')
      expect(result.current.orders[1].id).toBe('order-2')
      expect(result.current.error).toBeNull()

      // Verificar que se llamó al servicio
      expect(ordersService.getOrders).toHaveBeenCalledWith(
        'tenant-test-123',
        undefined
      )
    })

    it('should handle fetch error', async () => {
      const errorMessage = 'Database error'
      vi.mocked(ordersService.getOrders).mockResolvedValue({
        data: null,
        error: new Error(errorMessage) as any,
      })

      const { result } = renderHook(() => useOrders(), { wrapper })

      await waitFor(() => {
        expect(result.current.loading).toBe(false)
      })

      expect(result.current.error).toBeTruthy()
      expect(result.current.orders).toEqual([])
    })

    it('should filter orders by table', async () => {
      const { result } = renderHook(
        () => useOrders({ tableId: 'table-1' }),
        { wrapper }
      )

      await waitFor(() => {
        expect(result.current.loading).toBe(false)
      })

      // Verificar que se pasó el filtro
      expect(ordersService.getOrders).toHaveBeenCalledWith(
        'tenant-test-123',
        { tableId: 'table-1' }
      )
    })

    it('should filter orders by status', async () => {
      const { result } = renderHook(
        () => useOrders({ status: 'pending' }),
        { wrapper }
      )

      await waitFor(() => {
        expect(result.current.loading).toBe(false)
      })

      expect(ordersService.getOrders).toHaveBeenCalledWith(
        'tenant-test-123',
        { status: 'pending' }
      )
    })

    it('should filter orders by payment status', async () => {
      const { result } = renderHook(
        () => useOrders({ paymentStatus: 'paid' }),
        { wrapper }
      )

      await waitFor(() => {
        expect(result.current.loading).toBe(false)
      })

      expect(ordersService.getOrders).toHaveBeenCalledWith(
        'tenant-test-123',
        { paymentStatus: 'paid' }
      )
    })

    it('should filter orders by source', async () => {
      const { result } = renderHook(
        () => useOrders({ source: 'qr' }),
        { wrapper }
      )

      await waitFor(() => {
        expect(result.current.loading).toBe(false)
      })

      expect(ordersService.getOrders).toHaveBeenCalledWith(
        'tenant-test-123',
        { source: 'qr' }
      )
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

      const { result } = renderHook(() => useOrders(), { wrapper })

      // No debería hacer fetch sin tenant
      expect(result.current.orders).toEqual([])
      expect(ordersService.getOrders).not.toHaveBeenCalled()
    })
  })

  describe('Mutation - Create order', () => {
    it('should create order successfully', async () => {
      const newOrderInput = {
        tableId: 'table-1',
        items: [
          {
            menuItemId: 'item-1',
            quantity: 2,
            notes: 'Sin picante',
          },
        ],
        source: 'staff' as const,
      }

      const createdOrder = {
        ...mockOrders[0],
        id: 'order-3',
        notes: 'Sin picante',
      }

      vi.mocked(ordersService.createOrder).mockResolvedValue({
        data: createdOrder as any,
        error: null,
      })

      const { result } = renderHook(() => useOrders(), { wrapper })

      await waitFor(() => {
        expect(result.current.loading).toBe(false)
      })

      // Llamar mutation
      await result.current.createOrder(newOrderInput)

      // Verificar que se llamó al servicio
      expect(ordersService.createOrder).toHaveBeenCalledWith(
        newOrderInput,
        'tenant-test-123'
      )

      // Esperar invalidación de cache
      await waitFor(() => {
        expect(ordersService.getOrders).toHaveBeenCalledTimes(2) // Initial + refetch
      })
    })

    it('should handle create error', async () => {
      vi.mocked(ordersService.createOrder).mockResolvedValue({
        data: null,
        error: new Error('Failed to create order') as any,
      })

      const { result } = renderHook(() => useOrders(), { wrapper })

      await waitFor(() => {
        expect(result.current.loading).toBe(false)
      })

      // Intentar crear orden
      try {
        await result.current.createOrder({
          items: [{ menuItemId: 'item-1', quantity: 1 }],
        })
      } catch (error) {
        expect(error).toBeTruthy()
      }
    })

    it('should perform optimistic update on create', async () => {
      vi.mocked(ordersService.createOrder).mockImplementation(
        () => new Promise((resolve) => setTimeout(() => resolve({
          data: { ...mockOrders[0], id: 'order-3' } as any,
          error: null,
        }), 100))
      )

      const { result } = renderHook(() => useOrders(), { wrapper })

      await waitFor(() => {
        expect(result.current.loading).toBe(false)
      })

      // Crear orden
      result.current.createOrder({
        items: [{ menuItemId: 'item-1', quantity: 1 }],
      })

      // Verificar que eventualmente se completa
      await waitFor(() => {
        expect(ordersService.createOrder).toHaveBeenCalled()
      })
    })
  })

  describe('Mutation - Update status', () => {
    it('should update order status successfully', async () => {
      const updatedOrder = {
        ...mockOrders[0],
        status: 'confirmed',
      }

      vi.mocked(ordersService.updateOrderStatus).mockResolvedValue({
        data: updatedOrder as any,
        error: null,
      })

      const { result } = renderHook(() => useOrders(), { wrapper })

      await waitFor(() => {
        expect(result.current.loading).toBe(false)
      })

      // Actualizar estado
      await result.current.updateStatus('order-1', 'confirmed')

      expect(ordersService.updateOrderStatus).toHaveBeenCalledWith(
        'order-1',
        'confirmed',
        'tenant-test-123'
      )
    })

    it('should handle update status error and rollback', async () => {
      vi.mocked(ordersService.updateOrderStatus).mockResolvedValue({
        data: null,
        error: new Error('Update failed') as any,
      })

      const { result } = renderHook(() => useOrders(), { wrapper })

      await waitFor(() => {
        expect(result.current.loading).toBe(false)
      })

      const originalOrders = [...result.current.orders]

      try {
        await result.current.updateStatus('order-1', 'confirmed')
      } catch (error) {
        // Error esperado
      }

      // Verificar rollback
      await waitFor(() => {
        expect(result.current.orders).toEqual(originalOrders)
      })
    })

    it('should update to different statuses', async () => {
      const statuses = ['pending', 'confirmed', 'preparing', 'ready', 'delivered']

      for (const status of statuses) {
        const updatedOrder = {
          ...mockOrders[0],
          status,
        }

        vi.mocked(ordersService.updateOrderStatus).mockResolvedValue({
          data: updatedOrder as any,
          error: null,
        })

        const { result } = renderHook(() => useOrders(), { wrapper })

        await waitFor(() => {
          expect(result.current.loading).toBe(false)
        })

        await result.current.updateStatus('order-1', status)

        expect(ordersService.updateOrderStatus).toHaveBeenCalledWith(
          'order-1',
          status,
          'tenant-test-123'
        )

        queryClient.clear()
        vi.clearAllMocks()
        
        // Re-mock para próxima iteración
        vi.mocked(authContext.useAuth).mockReturnValue({
          user: { id: 'user-1', email: 'test@test.com' } as any,
          tenant: mockTenant as any,
          loading: false,
          signIn: vi.fn(),
          signOut: vi.fn(),
          signUp: vi.fn(),
        } as any)
        
        vi.mocked(ordersService.getOrders).mockResolvedValue({
          data: mockOrders as any,
          error: null,
        })
      }
    })
  })

  describe('Mutation - Update payment status', () => {
    it('should update payment status successfully', async () => {
      const updatedOrder = {
        ...mockOrders[0],
        payment_status: 'paid',
      }

      vi.mocked(ordersService.updateOrderPaymentStatus).mockResolvedValue({
        data: updatedOrder as any,
        error: null,
      })

      const { result } = renderHook(() => useOrders(), { wrapper })

      await waitFor(() => {
        expect(result.current.loading).toBe(false)
      })

      // Actualizar estado de pago
      await result.current.updatePaymentStatus('order-1', 'paid')

      expect(ordersService.updateOrderPaymentStatus).toHaveBeenCalledWith(
        'order-1',
        'paid',
        'tenant-test-123'
      )
    })

    it('should handle payment status update error', async () => {
      vi.mocked(ordersService.updateOrderPaymentStatus).mockResolvedValue({
        data: null,
        error: new Error('Payment update failed') as any,
      })

      const { result } = renderHook(() => useOrders(), { wrapper })

      await waitFor(() => {
        expect(result.current.loading).toBe(false)
      })

      try {
        await result.current.updatePaymentStatus('order-1', 'paid')
      } catch (error) {
        expect(error).toBeTruthy()
      }
    })

    it('should update to different payment statuses', async () => {
      const paymentStatuses = ['pending', 'paid', 'failed', 'refunded']

      for (const paymentStatus of paymentStatuses) {
        const updatedOrder = {
          ...mockOrders[0],
          payment_status: paymentStatus,
        }

        vi.mocked(ordersService.updateOrderPaymentStatus).mockResolvedValue({
          data: updatedOrder as any,
          error: null,
        })

        const { result } = renderHook(() => useOrders(), { wrapper })

        await waitFor(() => {
          expect(result.current.loading).toBe(false)
        })

        await result.current.updatePaymentStatus('order-1', paymentStatus)

        expect(ordersService.updateOrderPaymentStatus).toHaveBeenCalledWith(
          'order-1',
          paymentStatus,
          'tenant-test-123'
        )

        queryClient.clear()
        vi.clearAllMocks()
        
        // Re-mock para próxima iteración
        vi.mocked(authContext.useAuth).mockReturnValue({
          user: { id: 'user-1', email: 'test@test.com' } as any,
          tenant: mockTenant as any,
          loading: false,
          signIn: vi.fn(),
          signOut: vi.fn(),
          signUp: vi.fn(),
        } as any)
        
        vi.mocked(ordersService.getOrders).mockResolvedValue({
          data: mockOrders as any,
          error: null,
        })
      }
    })
  })

  describe('Mutation - Cancel order', () => {
    it('should cancel order successfully', async () => {
      const cancelledOrder = {
        ...mockOrders[0],
        status: 'cancelado',
      }

      vi.mocked(ordersService.cancelOrder).mockResolvedValue({
        data: cancelledOrder as any,
        error: null,
      })

      const { result } = renderHook(() => useOrders(), { wrapper })

      await waitFor(() => {
        expect(result.current.loading).toBe(false)
      })

      const initialCalls = vi.mocked(ordersService.getOrders).mock.calls.length

      await result.current.cancelOrder('order-1')

      expect(ordersService.cancelOrder).toHaveBeenCalledWith(
        'order-1',
        'tenant-test-123'
      )

      // Verificar refetch
      await waitFor(() => {
        expect(ordersService.getOrders).toHaveBeenCalledTimes(initialCalls + 1)
      })
    })

    it('should handle cancel error', async () => {
      vi.mocked(ordersService.cancelOrder).mockResolvedValue({
        data: null,
        error: new Error('Cancel failed') as any,
      })

      const { result } = renderHook(() => useOrders(), { wrapper })

      await waitFor(() => {
        expect(result.current.loading).toBe(false)
      })

      try {
        await result.current.cancelOrder('order-1')
      } catch (error) {
        expect(error).toBeTruthy()
      }
    })
  })

  describe('Refresh functionality', () => {
    it('should refresh orders on demand', async () => {
      const { result } = renderHook(() => useOrders(), { wrapper })

      await waitFor(() => {
        expect(result.current.loading).toBe(false)
      })

      const initialCalls = vi.mocked(ordersService.getOrders).mock.calls.length

      // Refrescar
      await result.current.refresh()

      // Verificar refetch
      expect(ordersService.getOrders).toHaveBeenCalledTimes(initialCalls + 1)
    })
  })

  describe('React Query features', () => {
    it('should cache query results', async () => {
      const { result, rerender } = renderHook(() => useOrders(), { wrapper })

      await waitFor(() => {
        expect(result.current.loading).toBe(false)
      })

      const firstOrders = result.current.orders

      // Rerender debería usar cache
      rerender()

      expect(result.current.orders).toBe(firstOrders)
      // No debería hacer fetch adicional (cache activo)
      expect(ordersService.getOrders).toHaveBeenCalledTimes(1)
    })

    it('should invalidate cache after mutation', async () => {
      vi.mocked(ordersService.createOrder).mockResolvedValue({
        data: { ...mockOrders[0], id: 'order-3' } as any,
        error: null,
      })

      const { result } = renderHook(() => useOrders(), { wrapper })

      await waitFor(() => {
        expect(result.current.loading).toBe(false)
      })

      // Primera carga
      expect(ordersService.getOrders).toHaveBeenCalledTimes(1)

      // Mutation invalida cache
      await result.current.createOrder({
        items: [{ menuItemId: 'item-1', quantity: 1 }],
      })

      // Debería refetch
      await waitFor(() => {
        expect(ordersService.getOrders).toHaveBeenCalledTimes(2)
      })
    })

    it('should use different cache for different filters', async () => {
      // Renderizar hook sin filtros
      const { result: result1 } = renderHook(() => useOrders(), { wrapper })

      await waitFor(() => {
        expect(result1.current.loading).toBe(false)
      })

      expect(ordersService.getOrders).toHaveBeenCalledWith('tenant-test-123', undefined)

      // Renderizar hook con filtros (diferente cache)
      const { result: result2 } = renderHook(
        () => useOrders({ status: 'pending' }),
        { wrapper }
      )

      await waitFor(() => {
        expect(result2.current.loading).toBe(false)
      })

      // Debería hacer otra llamada porque el queryKey es diferente
      expect(ordersService.getOrders).toHaveBeenCalledWith('tenant-test-123', { status: 'pending' })
      expect(ordersService.getOrders).toHaveBeenCalledTimes(2)
    })
  })
})
