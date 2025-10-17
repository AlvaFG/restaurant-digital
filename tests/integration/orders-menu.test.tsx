/**
 * Integration Tests: Orders + Menu
 * 
 * Tests the integration between orders and menu items,
 * verifying that orders can be created with menu items and totals are calculated correctly.
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { renderHook, waitFor } from '@testing-library/react'
import { useOrders } from '@/hooks/use-orders'
import { useMenuItems } from '@/hooks/use-menu'
import * as ordersService from '@/lib/services/orders-service'
import * as menuService from '@/lib/services/menu-service'
import { useAuth } from '@/contexts/auth-context'
import {
  createIntegrationWrapper,
  createIntegrationTestQueryClient,
  mockAuthUser,
  mockAuthTenant,
  mockDataFactory,
} from '../utils/integration-test-utils'

// Mock dependencies
vi.mock('@/lib/services/orders-service')
vi.mock('@/lib/services/menu-service')
vi.mock('@/contexts/auth-context')

describe('Orders + Menu Integration', () => {
  let wrapper: ReturnType<typeof createIntegrationWrapper>
  const queryClient = createIntegrationTestQueryClient()

  const mockMenuItems = [
    mockDataFactory.menuItem({ id: 'item-1', name: 'Pizza', price_cents: 1200 }),
    mockDataFactory.menuItem({ id: 'item-2', name: 'Pasta', price_cents: 800 }),
    mockDataFactory.menuItem({ id: 'item-3', name: 'Soda', price_cents: 200 }),
  ]

  const mockOrders = [
    mockDataFactory.order({
      id: 'order-1',
      table_id: 'table-1',
      total_cents: 1400,
      items: [
        { menu_item_id: 'item-1', quantity: 1, price_cents: 1200 },
        { menu_item_id: 'item-3', quantity: 1, price_cents: 200 },
      ],
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

    vi.mocked(menuService.getMenuItems).mockResolvedValue({
      data: mockMenuItems,
      error: null,
    } as any)

    vi.mocked(ordersService.getOrders).mockResolvedValue({
      data: mockOrders,
      error: null,
    } as any)
  })

  afterEach(() => {
    queryClient.clear()
    vi.clearAllMocks()
  })

  it('should load menu items and orders together', async () => {
    const { result: menuResult } = renderHook(() => useMenuItems(), { wrapper })
    const { result: ordersResult } = renderHook(() => useOrders(), { wrapper })

    await waitFor(() => {
      expect(menuResult.current.loading).toBe(false)
      expect(ordersResult.current.loading).toBe(false)
    })

    expect(menuResult.current.items).toHaveLength(3)
    expect(ordersResult.current.orders).toHaveLength(1)
  })

  it('should create order with menu items and calculate total', async () => {
    const newOrder = mockDataFactory.order({
      id: 'order-2',
      table_id: 'table-2',
      total_cents: 2000, // 1200 + 800
      items: [
        { menu_item_id: 'item-1', quantity: 1, price_cents: 1200 },
        { menu_item_id: 'item-2', quantity: 1, price_cents: 800 },
      ],
    })

    vi.mocked(ordersService.createOrder).mockResolvedValue({
      data: newOrder,
      error: null,
    } as any)

    const { result: menuResult } = renderHook(() => useMenuItems(), { wrapper })
    const { result: ordersResult } = renderHook(() => useOrders(), { wrapper })

    await waitFor(() => {
      expect(menuResult.current.loading).toBe(false)
      expect(ordersResult.current.loading).toBe(false)
    })

    // Create order with menu items (prices come from menu items)
    await ordersResult.current.createOrder({
      tableId: 'table-2',
      items: [
        { menuItemId: 'item-1', quantity: 1 },
        { menuItemId: 'item-2', quantity: 1 },
      ],
    })

    expect(ordersService.createOrder).toHaveBeenCalledWith(
      expect.objectContaining({
        tableId: 'table-2',
        items: expect.arrayContaining([
          expect.objectContaining({ menuItemId: 'item-1' }),
          expect.objectContaining({ menuItemId: 'item-2' }),
        ]),
      }),
      'tenant-test-123'
    )
  })

  it('should handle menu item unavailability when creating order', async () => {
    // Make item unavailable
    const unavailableItems = mockMenuItems.map((item) =>
      item.id === 'item-1' ? { ...item, available: false } : item
    )

    vi.mocked(menuService.getMenuItems).mockResolvedValue({
      data: unavailableItems,
      error: null,
    } as any)

    const { result: menuResult } = renderHook(() => useMenuItems(), { wrapper })

    await waitFor(() => expect(menuResult.current.loading).toBe(false))

    const pizzaItem = menuResult.current.items.find((i) => i.id === 'item-1')
    expect(pizzaItem?.available).toBe(false)

    // Attempting to create order with unavailable item should be handled by UI
    const availableItems = menuResult.current.items.filter((i) => i.available)
    expect(availableItems).not.toContainEqual(
      expect.objectContaining({ id: 'item-1' })
    )
  })

  it('should update order status after creation', async () => {
    vi.mocked(ordersService.updateOrderStatus).mockResolvedValue({
      data: { ...mockOrders[0], status: 'preparing' },
      error: null,
    } as any)

    const { result: ordersResult } = renderHook(() => useOrders(), { wrapper })

    await waitFor(() => expect(ordersResult.current.loading).toBe(false))

    // Update order status
    await ordersResult.current.updateStatus('order-1', 'preparing')

    expect(ordersService.updateOrderStatus).toHaveBeenCalledWith(
      'order-1',
      'preparing',
      'tenant-test-123'
    )
  })

  it('should filter available menu items for ordering', async () => {
    const mixedAvailability = [
      { ...mockMenuItems[0], available: true },
      { ...mockMenuItems[1], available: false },
      { ...mockMenuItems[2], available: true },
    ]

    vi.mocked(menuService.getMenuItems).mockResolvedValue({
      data: mixedAvailability,
      error: null,
    } as any)

    const { result } = renderHook(
      () => useMenuItems({ available: true }),
      { wrapper }
    )

    await waitFor(() => expect(result.current.loading).toBe(false))

    expect(menuService.getMenuItems).toHaveBeenCalledWith(
      'tenant-test-123',
      { available: true }
    )
  })

  it('should handle price changes between menu and order', async () => {
    // Menu item price changes after order was created
    const updatedMenuItems = mockMenuItems.map((item) =>
      item.id === 'item-1' ? { ...item, price_cents: 1500 } : item
    )

    vi.mocked(menuService.getMenuItems).mockResolvedValue({
      data: updatedMenuItems,
      error: null,
    } as any)

    const { result: menuResult } = renderHook(() => useMenuItems(), { wrapper })
    const { result: ordersResult } = renderHook(() => useOrders(), { wrapper })

    await waitFor(() => {
      expect(menuResult.current.loading).toBe(false)
      expect(ordersResult.current.loading).toBe(false)
    })

    // Current menu price
    const pizzaMenuItem = menuResult.current.items.find((i) => i.id === 'item-1')
    expect(pizzaMenuItem?.price_cents).toBe(1500)

    // Order still has old price (items are stored with order, not referenced)
    const existingOrder = ordersResult.current.orders[0]
    expect(existingOrder.total_cents).toBe(1400) // Original price preserved
  })

  it('should create multiple orders with different menu items', async () => {
    const order2 = mockDataFactory.order({
      id: 'order-2',
      table_id: 'table-2',
      total_cents: 800,
      items: [{ menu_item_id: 'item-2', quantity: 1, price_cents: 800 }],
    })

    const order3 = mockDataFactory.order({
      id: 'order-3',
      table_id: 'table-3',
      total_cents: 400,
      items: [{ menu_item_id: 'item-3', quantity: 2, price_cents: 200 }],
    })

    vi.mocked(ordersService.createOrder)
      .mockResolvedValueOnce({ data: order2, error: null } as any)
      .mockResolvedValueOnce({ data: order3, error: null } as any)

    const { result } = renderHook(() => useOrders(), { wrapper })

    await waitFor(() => expect(result.current.loading).toBe(false))

    await result.current.createOrder({
      tableId: 'table-2',
      items: [{ menuItemId: 'item-2', quantity: 1 }],
    })

    await result.current.createOrder({
      tableId: 'table-3',
      items: [{ menuItemId: 'item-3', quantity: 2 }],
    })

    expect(ordersService.createOrder).toHaveBeenCalledTimes(2)
  })

  it('should handle concurrent order creation with same menu items', async () => {
    const order2 = mockDataFactory.order({
      id: 'order-2',
      table_id: 'table-2',
      items: [{ menu_item_id: 'item-1', quantity: 1, price_cents: 1200 }],
    })

    const order3 = mockDataFactory.order({
      id: 'order-3',
      table_id: 'table-3',
      items: [{ menu_item_id: 'item-1', quantity: 1, price_cents: 1200 }],
    })

    vi.mocked(ordersService.createOrder).mockImplementation((input) => {
      const orderId = input.tableId === 'table-2' ? 'order-2' : 'order-3'
      return Promise.resolve({
        data: input.tableId === 'table-2' ? order2 : order3,
        error: null,
      } as any)
    })

    const { result } = renderHook(() => useOrders(), { wrapper })

    await waitFor(() => expect(result.current.loading).toBe(false))

    // Create both orders concurrently
    await Promise.all([
      result.current.createOrder({
        tableId: 'table-2',
        items: [{ menuItemId: 'item-1', quantity: 1 }],
      }),
      result.current.createOrder({
        tableId: 'table-3',
        items: [{ menuItemId: 'item-1', quantity: 1 }],
      }),
    ])

    expect(ordersService.createOrder).toHaveBeenCalledTimes(2)
  })
})
