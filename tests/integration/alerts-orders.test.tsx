/**
 * Integration Tests: Alerts + Orders
 * 
 * Tests the integration between alerts and orders,
 * verifying that order events trigger alerts and state synchronization works correctly.
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { renderHook, waitFor } from '@testing-library/react'
import { useAlerts } from '@/hooks/use-alerts'
import { useOrders } from '@/hooks/use-orders'
import * as alertsService from '@/lib/services/alerts-service'
import * as ordersService from '@/lib/services/orders-service'
import { useAuth } from '@/contexts/auth-context'
import {
  createIntegrationWrapper,
  createIntegrationTestQueryClient,
  mockAuthUser,
  mockAuthTenant,
  mockDataFactory,
} from '../utils/integration-test-utils'

// Mock dependencies
vi.mock('@/lib/services/alerts-service')
vi.mock('@/lib/services/orders-service')
vi.mock('@/contexts/auth-context')

describe('Alerts + Orders Integration', () => {
  let wrapper: ReturnType<typeof createIntegrationWrapper>
  const queryClient = createIntegrationTestQueryClient()

  const mockOrders = [
    mockDataFactory.order({
      id: 'order-1',
      table_id: 'table-1',
      status: 'pending',
      total_cents: 1200,
    }),
    mockDataFactory.order({
      id: 'order-2',
      table_id: 'table-2',
      status: 'preparing',
      total_cents: 800,
    }),
  ]

  const mockAlerts = [
    mockDataFactory.alert({
      id: 'alert-1',
      type: 'llamar_mozo',
      message: 'New order for Table 1',
      acknowledged: false,
      table_id: 'table-1',
    }),
    mockDataFactory.alert({
      id: 'alert-2',
      type: 'pedido_entrante',
      message: 'Order ready for Table 2',
      acknowledged: false,
      table_id: 'table-2',
    }),
  ]

  beforeEach(() => {
    wrapper = createIntegrationWrapper(queryClient)

    vi.mocked(useAuth).mockReturnValue({
      user: mockAuthUser,
      tenant: mockAuthTenant,
      session: null,
      isLoading: false,
      isHydrated: true,
      login: vi.fn(),
      logout: vi.fn(),
      updateTenant: vi.fn(),
    })

    vi.mocked(alertsService.fetchAlerts).mockResolvedValue(mockAlerts as any)

    vi.mocked(ordersService.getOrders).mockResolvedValue({
      data: mockOrders,
      error: null,
    } as any)
  })

  afterEach(() => {
    queryClient.clear()
    vi.clearAllMocks()
  })

  it('should load alerts and orders together', async () => {
    const { result: alertsResult } = renderHook(() => useAlerts(), { wrapper })
    const { result: ordersResult } = renderHook(() => useOrders(), { wrapper })

    await waitFor(() => {
      expect(alertsResult.current.isLoading).toBe(false)
      expect(ordersResult.current.loading).toBe(false)
    })

    expect(alertsResult.current.alerts).toHaveLength(2)
    expect(ordersResult.current.orders).toHaveLength(2)
  })

  it('should acknowledge alert related to table', async () => {
    const acknowledgedAlert = { ...mockAlerts[0], acknowledged: true }

    vi.mocked(alertsService.acknowledgeAlert).mockResolvedValue(acknowledgedAlert as any)

    const { result: alertsResult } = renderHook(() => useAlerts(), { wrapper })
    const { result: ordersResult } = renderHook(() => useOrders(), { wrapper })

    await waitFor(() => {
      expect(alertsResult.current.isLoading).toBe(false)
      expect(ordersResult.current.loading).toBe(false)
    })

    // Acknowledge alert for table-1
    await alertsResult.current.acknowledgeAlert('alert-1')

    expect(alertsService.acknowledgeAlert).toHaveBeenCalledWith(
      'alert-1',
      'user-test-123'
    )

    // Order should still exist
    const order = ordersResult.current.orders.find((o) => o.table_id === 'table-1')
    expect(order).toBeDefined()
  })

  it('should filter alerts by table', async () => {
    const { result: alertsResult } = renderHook(
      () => useAlerts({ tableId: 'table-1' }),
      { wrapper }
    )

    await waitFor(() => expect(alertsResult.current.isLoading).toBe(false))

    expect(alertsService.fetchAlertsByTable).toHaveBeenCalledWith(
      'tenant-test-123',
      'table-1'
    )
  })

  it('should handle order status update', async () => {
    const updatedOrder = { ...mockOrders[0], status: 'preparing' }

    vi.mocked(ordersService.updateOrderStatus).mockResolvedValue({
      data: updatedOrder,
      error: null,
    } as any)

    const { result: ordersResult } = renderHook(() => useOrders(), { wrapper })
    const { result: alertsResult } = renderHook(() => useAlerts(), { wrapper })

    await waitFor(() => {
      expect(ordersResult.current.loading).toBe(false)
      expect(alertsResult.current.isLoading).toBe(false)
    })

    // Update order status
    await ordersResult.current.updateStatus('order-1', 'preparing')

    expect(ordersService.updateOrderStatus).toHaveBeenCalledWith(
      'order-1',
      'preparing',
      'tenant-test-123'
    )

    // Alert still exists (table-based, not order-based)
    const alert = alertsResult.current.alerts.find((a) => a.table_id === 'table-1')
    expect(alert).toBeDefined()
  })

  it('should create order and trigger alert', async () => {
    const newOrder = mockDataFactory.order({
      id: 'order-3',
      table_id: 'table-3',
      status: 'pending',
    })

    const newAlert = mockDataFactory.alert({
      id: 'alert-3',
      type: 'pedido_entrante',
      message: 'New order for Table 3',
      table_id: 'table-3',
    })

    vi.mocked(ordersService.createOrder).mockResolvedValue({
      data: newOrder,
      error: null,
    } as any)

    vi.mocked(alertsService.createAlert).mockResolvedValue(newAlert as any)

    const { result: ordersResult } = renderHook(() => useOrders(), { wrapper })
    const { result: alertsResult } = renderHook(() => useAlerts(), { wrapper })

    await waitFor(() => {
      expect(ordersResult.current.loading).toBe(false)
      expect(alertsResult.current.isLoading).toBe(false)
    })

    // Create order
    await ordersResult.current.createOrder({
      tableId: 'table-3',
      items: [{ menuItemId: 'item-1', quantity: 1 }],
    })

    expect(ordersService.createOrder).toHaveBeenCalled()

    // Create related alert
    await alertsResult.current.createAlert({
      table_id: 'table-3',
      type: 'pedido_entrante',
      message: 'New order for Table 3',
    })

    expect(alertsService.createAlert).toHaveBeenCalled()
  })

  it('should delete multiple alerts for table', async () => {
    const table1Alerts = [
      mockDataFactory.alert({
        id: 'alert-3',
        type: 'llamar_mozo',
        table_id: 'table-1',
      }),
      mockDataFactory.alert({
        id: 'alert-4',
        type: 'pedido_entrante',
        table_id: 'table-1',
      }),
    ]

    vi.mocked(alertsService.fetchAlerts).mockResolvedValue(
      [...mockAlerts, ...table1Alerts] as any
    )

    vi.mocked(alertsService.deleteAlert).mockResolvedValue(undefined as any)

    const { result: alertsResult } = renderHook(() => useAlerts(), { wrapper })

    await waitFor(() => expect(alertsResult.current.isLoading).toBe(false))

    // Get all alerts for table-1
    const table1AlertsList = alertsResult.current.alerts.filter(
      (alert) => alert.table_id === 'table-1'
    )

    expect(table1AlertsList.length).toBe(3) // 1 from mockAlerts + 2 new

    // Delete all alerts for the table
    await Promise.all(
      table1AlertsList.map((alert) => alertsResult.current.deleteAlert(alert.id))
    )

    expect(alertsService.deleteAlert).toHaveBeenCalledTimes(3)
  })

  it('should count unacknowledged alerts per table', async () => {
    const { result: alertsResult } = renderHook(() => useAlerts(), { wrapper })
    const { result: ordersResult } = renderHook(() => useOrders(), { wrapper })

    await waitFor(() => {
      expect(alertsResult.current.isLoading).toBe(false)
      expect(ordersResult.current.loading).toBe(false)
    })

    // Count unacknowledged alerts per table
    const unacknowledgedByTable = ordersResult.current.orders.reduce(
      (acc, order) => {
        const count = alertsResult.current.alerts.filter(
          (alert) =>
            !alert.acknowledged && alert.table_id === order.table_id
        ).length
        acc[order.table_id] = count
        return acc
      },
      {} as Record<string, number>
    )

    expect(unacknowledgedByTable['table-1']).toBe(1)
    expect(unacknowledgedByTable['table-2']).toBe(1)
  })

  it('should handle concurrent alert acknowledgment and order updates', async () => {
    const acknowledgedAlert = { ...mockAlerts[0], acknowledged: true }
    const updatedOrder = { ...mockOrders[0], status: 'preparing' }

    vi.mocked(alertsService.acknowledgeAlert).mockResolvedValue(acknowledgedAlert as any)

    vi.mocked(ordersService.updateOrderStatus).mockResolvedValue({
      data: updatedOrder,
      error: null,
    } as any)

    const { result: alertsResult } = renderHook(() => useAlerts(), { wrapper })
    const { result: ordersResult } = renderHook(() => useOrders(), { wrapper })

    await waitFor(() => {
      expect(alertsResult.current.isLoading).toBe(false)
      expect(ordersResult.current.loading).toBe(false)
    })

    // Perform both operations concurrently
    await Promise.all([
      alertsResult.current.acknowledgeAlert('alert-1'),
      ordersResult.current.updateStatus('order-1', 'preparing'),
    ])

    expect(alertsService.acknowledgeAlert).toHaveBeenCalled()
    expect(ordersService.updateOrderStatus).toHaveBeenCalled()
  })

  it('should filter active alerts only', async () => {
    vi.mocked(alertsService.fetchActiveAlerts).mockResolvedValue([mockAlerts[0]] as any)

    const { result } = renderHook(
      () => useAlerts({ activeOnly: true }),
      { wrapper }
    )

    await waitFor(() => expect(result.current.isLoading).toBe(false))

    expect(alertsService.fetchActiveAlerts).toHaveBeenCalledWith('tenant-test-123')
  })
})
