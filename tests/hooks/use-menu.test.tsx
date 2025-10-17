/**
 * Tests for useMenu Hooks (Categories, Items, MenuItem, FullMenu)
 * 
 * Comprehensive test suite covering all 4 menu-related hooks
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { renderHook, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { useMenuCategories, useMenuItems, useMenuItem, useFullMenu } from '@/hooks/use-menu'
import * as menuService from '@/lib/services/menu-service'
import { useAuth } from '@/contexts/auth-context'

// Mock dependencies
vi.mock('@/lib/services/menu-service')
vi.mock('@/contexts/auth-context')

describe('useMenuCategories', () => {
  let queryClient: QueryClient
  const mockTenant = { id: 'tenant-123', name: 'Test Restaurant' } as any
  const mockUser = { id: 'user-123', email: 'test@example.com' } as any

  const mockCategories = [
    { id: 'cat-1', tenant_id: 'tenant-123', name: 'Bebidas', description: 'Drinks', sort_order: 1, active: true },
    { id: 'cat-2', tenant_id: 'tenant-123', name: 'Comidas', description: 'Food', sort_order: 2, active: true },
  ] as any

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false, gcTime: 0 },
        mutations: { retry: false },
      },
    })

    vi.mocked(useAuth).mockReturnValue({
      user: mockUser,
      tenant: mockTenant,
      isLoading: false,
      signIn: vi.fn(),
      signOut: vi.fn(),
      signUp: vi.fn(),
    })

    vi.mocked(menuService.getMenuCategories).mockResolvedValue({
      data: mockCategories,
      error: null,
    } as any)
  })

  afterEach(() => {
    queryClient.clear()
    vi.clearAllMocks()
  })

  const wrapper = ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  )

  // Query Tests
  it('should fetch categories successfully', async () => {
    const { result } = renderHook(() => useMenuCategories(), { wrapper })

    expect(result.current.loading).toBe(true)

    await waitFor(() => {
      expect(result.current.loading).toBe(false)
    })

    expect(result.current.categories).toEqual(mockCategories)
    expect(result.current.error).toBe(null)
    expect(menuService.getMenuCategories).toHaveBeenCalledWith('tenant-123')
  })

  it('should handle fetch error', async () => {
    const mockError = new Error('Failed to fetch categories')
    vi.mocked(menuService.getMenuCategories).mockResolvedValue({
      data: null,
      error: mockError,
    })

    const { result } = renderHook(() => useMenuCategories(), { wrapper })

    await waitFor(() => {
      expect(result.current.loading).toBe(false)
    })

    expect(result.current.error).toEqual(mockError)
    expect(result.current.categories).toEqual([])
  })

  it('should return empty array when no tenant', async () => {
    vi.mocked(useAuth).mockReturnValue({
      user: mockUser,
      tenant: null,
      isLoading: false,
      signIn: vi.fn(),
      signOut: vi.fn(),
      signUp: vi.fn(),
    })

    const { result } = renderHook(() => useMenuCategories(), { wrapper })

    await waitFor(() => {
      expect(result.current.loading).toBe(false)
    })

    expect(result.current.categories).toEqual([])
    expect(menuService.getMenuCategories).not.toHaveBeenCalled()
  })

  // Create Category Tests
  it('should create category successfully', async () => {
    const newCategory = { id: 'cat-3', tenant_id: 'tenant-123', name: 'Postres', description: 'Desserts', sort_order: 3, active: true }
    vi.mocked(menuService.createMenuCategory).mockResolvedValue({
      data: newCategory,
      error: null,
    })

    const { result } = renderHook(() => useMenuCategories(), { wrapper })

    await waitFor(() => expect(result.current.loading).toBe(false))

    await result.current.createCategory({
      name: 'Postres',
      description: 'Desserts',
      sortOrder: 3,
    })

    expect(menuService.createMenuCategory).toHaveBeenCalledWith(
      { name: 'Postres', description: 'Desserts', sortOrder: 3 },
      'tenant-123'
    )
  })

  it('should handle create category error', async () => {
    const mockError = new Error('Failed to create category')
    vi.mocked(menuService.createMenuCategory).mockResolvedValue({
      data: null,
      error: mockError,
    })

    const { result } = renderHook(() => useMenuCategories(), { wrapper })

    await waitFor(() => expect(result.current.loading).toBe(false))

    await expect(
      result.current.createCategory({ name: 'Postres' })
    ).rejects.toThrow('Failed to create category')
  })

  it('should apply optimistic update when creating category', async () => {
    vi.mocked(menuService.createMenuCategory).mockImplementation(
      () => new Promise((resolve) => setTimeout(() => resolve({ data: null, error: null }), 100))
    )

    const { result } = renderHook(() => useMenuCategories(), { wrapper })

    await waitFor(() => expect(result.current.loading).toBe(false))

    const initialCount = result.current.categories.length

    result.current.createCategory({ name: 'Postres' })

    await waitFor(() => {
      expect(result.current.categories.length).toBeGreaterThan(initialCount)
    })
  })

  // Update Category Tests
  it('should update category successfully', async () => {
    const updatedCategory = { ...mockCategories[0], name: 'Bebidas Updated' }
    vi.mocked(menuService.updateMenuCategory).mockResolvedValue({
      data: updatedCategory,
      error: null,
    })

    const { result } = renderHook(() => useMenuCategories(), { wrapper })

    await waitFor(() => expect(result.current.loading).toBe(false))

    await result.current.updateCategory('cat-1', { name: 'Bebidas Updated' })

    expect(menuService.updateMenuCategory).toHaveBeenCalledWith(
      'cat-1',
      { name: 'Bebidas Updated' },
      'tenant-123'
    )
  })

  it('should handle update category error', async () => {
    const mockError = new Error('Failed to update category')
    vi.mocked(menuService.updateMenuCategory).mockResolvedValue({
      data: null,
      error: mockError,
    })

    const { result } = renderHook(() => useMenuCategories(), { wrapper })

    await waitFor(() => expect(result.current.loading).toBe(false))

    await expect(
      result.current.updateCategory('cat-1', { name: 'Updated' })
    ).rejects.toThrow('Failed to update category')
  })

  it('should rollback optimistic update on update error', async () => {
    vi.mocked(menuService.updateMenuCategory).mockResolvedValue({
      data: null,
      error: new Error('Update failed'),
    })

    const { result } = renderHook(() => useMenuCategories(), { wrapper })

    await waitFor(() => expect(result.current.loading).toBe(false))

    const originalCategories = result.current.categories

    try {
      await result.current.updateCategory('cat-1', { name: 'Updated' })
    } catch (error) {
      // Expected error
    }

    await waitFor(() => {
      expect(result.current.categories).toEqual(originalCategories)
    })
  })

  // Refresh Tests
  it('should refresh categories', async () => {
    const { result } = renderHook(() => useMenuCategories(), { wrapper })

    await waitFor(() => expect(result.current.loading).toBe(false))

    vi.clearAllMocks()

    result.current.refresh()

    await waitFor(() => {
      expect(menuService.getMenuCategories).toHaveBeenCalled()
    })
  })

  // Cache Tests
  it('should cache categories data', async () => {
    const { result, rerender } = renderHook(() => useMenuCategories(), { wrapper })

    await waitFor(() => expect(result.current.loading).toBe(false))

    expect(menuService.getMenuCategories).toHaveBeenCalledTimes(1)

    rerender()

    expect(menuService.getMenuCategories).toHaveBeenCalledTimes(1)
  })

  it('should invalidate cache after mutations', async () => {
    vi.mocked(menuService.createMenuCategory).mockResolvedValue({
      data: { id: 'cat-3', tenant_id: 'tenant-123', name: 'New', active: true } as any,
      error: null,
    })

    const { result } = renderHook(() => useMenuCategories(), { wrapper })

    await waitFor(() => expect(result.current.loading).toBe(false))

    vi.clearAllMocks()

    await result.current.createCategory({ name: 'New' })

    await waitFor(() => {
      expect(menuService.getMenuCategories).toHaveBeenCalled()
    })
  })
})

describe('useMenuItems', () => {
  let queryClient: QueryClient
  const mockTenant = { id: 'tenant-123', name: 'Test Restaurant' }
  const mockUser = { id: 'user-123', email: 'test@example.com' }

  const mockItems = [
    { id: 'item-1', tenant_id: 'tenant-123', category_id: 'cat-1', name: 'Coca Cola', description: 'Soda', price_cents: 200, available: true },
    { id: 'item-2', tenant_id: 'tenant-123', category_id: 'cat-1', name: 'Agua', description: 'Water', price_cents: 150, available: true },
  ]

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false, gcTime: 0 },
        mutations: { retry: false },
      },
    })

    vi.mocked(useAuth).mockReturnValue({
      user: mockUser,
      tenant: mockTenant,
      isLoading: false,
      signIn: vi.fn(),
      signOut: vi.fn(),
      signUp: vi.fn(),
    })

    vi.mocked(menuService.getMenuItems).mockResolvedValue({
      data: mockItems,
      error: null,
    })
  })

  afterEach(() => {
    queryClient.clear()
    vi.clearAllMocks()
  })

  const wrapper = ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  )

  // Query Tests
  it('should fetch items successfully', async () => {
    const { result } = renderHook(() => useMenuItems(), { wrapper })

    expect(result.current.loading).toBe(true)

    await waitFor(() => {
      expect(result.current.loading).toBe(false)
    })

    expect(result.current.items).toEqual(mockItems)
    expect(result.current.error).toBe(null)
    expect(menuService.getMenuItems).toHaveBeenCalledWith('tenant-123', undefined)
  })

  it('should fetch items with category filter', async () => {
    const { result } = renderHook(() => useMenuItems({ categoryId: 'cat-1' }), { wrapper })

    await waitFor(() => expect(result.current.loading).toBe(false))

    expect(menuService.getMenuItems).toHaveBeenCalledWith('tenant-123', { categoryId: 'cat-1' })
  })

  it('should fetch items with available filter', async () => {
    const { result } = renderHook(() => useMenuItems({ available: true }), { wrapper })

    await waitFor(() => expect(result.current.loading).toBe(false))

    expect(menuService.getMenuItems).toHaveBeenCalledWith('tenant-123', { available: true })
  })

  it('should fetch items with search filter', async () => {
    const { result } = renderHook(() => useMenuItems({ search: 'coca' }), { wrapper })

    await waitFor(() => expect(result.current.loading).toBe(false))

    expect(menuService.getMenuItems).toHaveBeenCalledWith('tenant-123', { search: 'coca' })
  })

  it('should fetch items with multiple filters', async () => {
    const filters = { categoryId: 'cat-1', available: true, search: 'coca' }
    const { result } = renderHook(() => useMenuItems(filters), { wrapper })

    await waitFor(() => expect(result.current.loading).toBe(false))

    expect(menuService.getMenuItems).toHaveBeenCalledWith('tenant-123', filters)
  })

  it('should handle fetch error', async () => {
    const mockError = new Error('Failed to fetch items')
    vi.mocked(menuService.getMenuItems).mockResolvedValue({
      data: null,
      error: mockError,
    })

    const { result } = renderHook(() => useMenuItems(), { wrapper })

    await waitFor(() => {
      expect(result.current.loading).toBe(false)
    })

    expect(result.current.error).toEqual(mockError)
    expect(result.current.items).toEqual([])
  })

  it('should return empty array when no tenant', async () => {
    vi.mocked(useAuth).mockReturnValue({
      user: mockUser,
      tenant: null,
      isLoading: false,
      signIn: vi.fn(),
      signOut: vi.fn(),
      signUp: vi.fn(),
    })

    const { result } = renderHook(() => useMenuItems(), { wrapper })

    await waitFor(() => {
      expect(result.current.loading).toBe(false)
    })

    expect(result.current.items).toEqual([])
    expect(menuService.getMenuItems).not.toHaveBeenCalled()
  })

  // Create Item Tests
  it('should create item successfully', async () => {
    const newItem = {
      id: 'item-3',
      tenant_id: 'tenant-123',
      category_id: 'cat-1',
      name: 'Sprite',
      description: 'Lemon soda',
      price_cents: 220,
      available: true,
    }

    vi.mocked(menuService.createMenuItem).mockResolvedValue({
      data: newItem,
      error: null,
    })

    const { result } = renderHook(() => useMenuItems(), { wrapper })

    await waitFor(() => expect(result.current.loading).toBe(false))

    await result.current.createItem({
      categoryId: 'cat-1',
      name: 'Sprite',
      description: 'Lemon soda',
      priceCents: 220,
    })

    expect(menuService.createMenuItem).toHaveBeenCalledWith(
      {
        categoryId: 'cat-1',
        name: 'Sprite',
        description: 'Lemon soda',
        priceCents: 220,
      },
      'tenant-123'
    )
  })

  it('should create item with optional fields', async () => {
    const newItem = {
      id: 'item-3',
      tenant_id: 'tenant-123',
      category_id: 'cat-1',
      name: 'Pizza',
      description: 'Cheese pizza',
      price_cents: 1000,
      image_url: 'https://example.com/pizza.jpg',
      tags: ['vegetarian'],
      allergens: { gluten: true },
      available: false,
    }

    vi.mocked(menuService.createMenuItem).mockResolvedValue({
      data: newItem,
      error: null,
    })

    const { result } = renderHook(() => useMenuItems(), { wrapper })

    await waitFor(() => expect(result.current.loading).toBe(false))

    await result.current.createItem({
      categoryId: 'cat-1',
      name: 'Pizza',
      description: 'Cheese pizza',
      priceCents: 1000,
      imageUrl: 'https://example.com/pizza.jpg',
      tags: ['vegetarian'],
      allergens: { gluten: true },
      available: false,
    })

    expect(menuService.createMenuItem).toHaveBeenCalled()
  })

  it('should handle create item error', async () => {
    const mockError = new Error('Failed to create item')
    vi.mocked(menuService.createMenuItem).mockResolvedValue({
      data: null,
      error: mockError,
    })

    const { result } = renderHook(() => useMenuItems(), { wrapper })

    await waitFor(() => expect(result.current.loading).toBe(false))

    await expect(
      result.current.createItem({
        categoryId: 'cat-1',
        name: 'Sprite',
        description: 'Soda',
        priceCents: 220,
      })
    ).rejects.toThrow('Failed to create item')
  })

  // Update Item Tests
  it('should update item successfully', async () => {
    const updatedItem = { ...mockItems[0], name: 'Coca Cola Zero' }
    vi.mocked(menuService.updateMenuItem).mockResolvedValue({
      data: updatedItem,
      error: null,
    })

    const { result } = renderHook(() => useMenuItems(), { wrapper })

    await waitFor(() => expect(result.current.loading).toBe(false))

    await result.current.updateItem('item-1', { name: 'Coca Cola Zero' })

    expect(menuService.updateMenuItem).toHaveBeenCalledWith(
      'item-1',
      { name: 'Coca Cola Zero' },
      'tenant-123'
    )
  })

  it('should update item price', async () => {
    const updatedItem = { ...mockItems[0], price_cents: 250 }
    vi.mocked(menuService.updateMenuItem).mockResolvedValue({
      data: updatedItem,
      error: null,
    })

    const { result } = renderHook(() => useMenuItems(), { wrapper })

    await waitFor(() => expect(result.current.loading).toBe(false))

    await result.current.updateItem('item-1', { priceCents: 250 })

    expect(menuService.updateMenuItem).toHaveBeenCalledWith(
      'item-1',
      { priceCents: 250 },
      'tenant-123'
    )
  })

  it('should update item availability', async () => {
    const updatedItem = { ...mockItems[0], available: false }
    vi.mocked(menuService.updateMenuItem).mockResolvedValue({
      data: updatedItem,
      error: null,
    })

    const { result } = renderHook(() => useMenuItems(), { wrapper })

    await waitFor(() => expect(result.current.loading).toBe(false))

    await result.current.updateItem('item-1', { available: false })

    expect(menuService.updateMenuItem).toHaveBeenCalledWith(
      'item-1',
      { available: false },
      'tenant-123'
    )
  })

  it('should handle update item error', async () => {
    const mockError = new Error('Failed to update item')
    vi.mocked(menuService.updateMenuItem).mockResolvedValue({
      data: null,
      error: mockError,
    })

    const { result } = renderHook(() => useMenuItems(), { wrapper })

    await waitFor(() => expect(result.current.loading).toBe(false))

    await expect(
      result.current.updateItem('item-1', { name: 'Updated' })
    ).rejects.toThrow('Failed to update item')
  })

  it('should rollback optimistic update on update error', async () => {
    vi.mocked(menuService.updateMenuItem).mockResolvedValue({
      data: null,
      error: new Error('Update failed'),
    })

    const { result } = renderHook(() => useMenuItems(), { wrapper })

    await waitFor(() => expect(result.current.loading).toBe(false))

    const originalItems = result.current.items

    try {
      await result.current.updateItem('item-1', { name: 'Updated' })
    } catch (error) {
      // Expected error
    }

    await waitFor(() => {
      expect(result.current.items).toEqual(originalItems)
    })
  })

  // Delete Item Tests
  it('should delete item successfully', async () => {
    vi.mocked(menuService.deleteMenuItem).mockResolvedValue({
      error: null,
    })

    const { result } = renderHook(() => useMenuItems(), { wrapper })

    await waitFor(() => expect(result.current.loading).toBe(false))

    await result.current.deleteItem('item-1')

    expect(menuService.deleteMenuItem).toHaveBeenCalledWith('item-1', 'tenant-123')
  })

  it('should handle delete item error', async () => {
    const mockError = new Error('Failed to delete item')
    vi.mocked(menuService.deleteMenuItem).mockResolvedValue({
      error: mockError,
    })

    const { result } = renderHook(() => useMenuItems(), { wrapper })

    await waitFor(() => expect(result.current.loading).toBe(false))

    await expect(result.current.deleteItem('item-1')).rejects.toThrow('Failed to delete item')
  })

  it('should rollback optimistic delete on error', async () => {
    vi.mocked(menuService.deleteMenuItem).mockResolvedValue({
      error: new Error('Delete failed'),
    })

    const { result } = renderHook(() => useMenuItems(), { wrapper })

    await waitFor(() => expect(result.current.loading).toBe(false))

    const originalItems = result.current.items

    try {
      await result.current.deleteItem('item-1')
    } catch (error) {
      // Expected error
    }

    await waitFor(() => {
      expect(result.current.items).toEqual(originalItems)
    })
  })

  // Refresh Tests
  it('should refresh items', async () => {
    const { result } = renderHook(() => useMenuItems(), { wrapper })

    await waitFor(() => expect(result.current.loading).toBe(false))

    vi.clearAllMocks()

    result.current.refresh()

    await waitFor(() => {
      expect(menuService.getMenuItems).toHaveBeenCalled()
    })
  })

  // Cache Tests
  it('should cache items data', async () => {
    const { result, rerender } = renderHook(() => useMenuItems(), { wrapper })

    await waitFor(() => expect(result.current.loading).toBe(false))

    expect(menuService.getMenuItems).toHaveBeenCalledTimes(1)

    rerender()

    expect(menuService.getMenuItems).toHaveBeenCalledTimes(1)
  })

  it('should use different cache for different filters', async () => {
    const { result: result1 } = renderHook(() => useMenuItems({ categoryId: 'cat-1' }), { wrapper })
    const { result: result2 } = renderHook(() => useMenuItems({ categoryId: 'cat-2' }), { wrapper })

    await waitFor(() => {
      expect(result1.current.loading).toBe(false)
      expect(result2.current.loading).toBe(false)
    })

    expect(menuService.getMenuItems).toHaveBeenCalledTimes(2)
    expect(menuService.getMenuItems).toHaveBeenCalledWith('tenant-123', { categoryId: 'cat-1' })
    expect(menuService.getMenuItems).toHaveBeenCalledWith('tenant-123', { categoryId: 'cat-2' })
  })

  it('should invalidate cache after mutations', async () => {
    vi.mocked(menuService.createMenuItem).mockResolvedValue({
      data: { id: 'item-3', name: 'New' } as any,
      error: null,
    })

    const { result } = renderHook(() => useMenuItems(), { wrapper })

    await waitFor(() => expect(result.current.loading).toBe(false))

    vi.clearAllMocks()

    await result.current.createItem({
      categoryId: 'cat-1',
      name: 'New',
      description: 'New item',
      priceCents: 100,
    })

    await waitFor(() => {
      expect(menuService.getMenuItems).toHaveBeenCalled()
    })
  })
})

describe('useMenuItem', () => {
  let queryClient: QueryClient
  const mockTenant = { id: 'tenant-123', name: 'Test Restaurant' }
  const mockUser = { id: 'user-123', email: 'test@example.com' }

  const mockItem = {
    id: 'item-1',
    tenant_id: 'tenant-123',
    category_id: 'cat-1',
    name: 'Coca Cola',
    description: 'Soda',
    price_cents: 200,
    available: true,
    category: {
      id: 'cat-1',
      name: 'Bebidas',
      description: 'Drinks',
    },
  }

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false, gcTime: 0 },
        mutations: { retry: false },
      },
    })

    vi.mocked(useAuth).mockReturnValue({
      user: mockUser,
      tenant: mockTenant,
      isLoading: false,
      signIn: vi.fn(),
      signOut: vi.fn(),
      signUp: vi.fn(),
    })

    vi.mocked(menuService.getMenuItemById).mockResolvedValue({
      data: mockItem,
      error: null,
    })
  })

  afterEach(() => {
    queryClient.clear()
    vi.clearAllMocks()
  })

  const wrapper = ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  )

  it('should fetch single item successfully', async () => {
    const { result } = renderHook(() => useMenuItem('item-1'), { wrapper })

    expect(result.current.loading).toBe(true)

    await waitFor(() => {
      expect(result.current.loading).toBe(false)
    })

    expect(result.current.item).toEqual(mockItem)
    expect(result.current.error).toBe(null)
    expect(menuService.getMenuItemById).toHaveBeenCalledWith('item-1', 'tenant-123')
  })

  it('should handle fetch error', async () => {
    const mockError = new Error('Failed to fetch item')
    vi.mocked(menuService.getMenuItemById).mockResolvedValue({
      data: null,
      error: mockError,
    })

    const { result } = renderHook(() => useMenuItem('item-1'), { wrapper })

    await waitFor(() => {
      expect(result.current.loading).toBe(false)
    })

    expect(result.current.error).toEqual(mockError)
    expect(result.current.item).toBe(null)
  })

  it('should return null when no itemId', async () => {
    const { result } = renderHook(() => useMenuItem(), { wrapper })

    await waitFor(() => {
      expect(result.current.loading).toBe(false)
    })

    expect(result.current.item).toBe(null)
    expect(menuService.getMenuItemById).not.toHaveBeenCalled()
  })

  it('should return null when no tenant', async () => {
    vi.mocked(useAuth).mockReturnValue({
      user: mockUser,
      tenant: null,
      isLoading: false,
      signIn: vi.fn(),
      signOut: vi.fn(),
      signUp: vi.fn(),
    })

    const { result } = renderHook(() => useMenuItem('item-1'), { wrapper })

    await waitFor(() => {
      expect(result.current.loading).toBe(false)
    })

    expect(result.current.item).toBe(null)
    expect(menuService.getMenuItemById).not.toHaveBeenCalled()
  })

  it('should include category data', async () => {
    const { result } = renderHook(() => useMenuItem('item-1'), { wrapper })

    await waitFor(() => expect(result.current.loading).toBe(false))

    expect(result.current.item?.category).toEqual({
      id: 'cat-1',
      name: 'Bebidas',
      description: 'Drinks',
    })
  })
})

describe('useFullMenu', () => {
  let queryClient: QueryClient
  const mockTenant = { id: 'tenant-123', name: 'Test Restaurant' }
  const mockUser = { id: 'user-123', email: 'test@example.com' }

  const mockFullMenu = [
    {
      id: 'cat-1',
      tenant_id: 'tenant-123',
      name: 'Bebidas',
      description: 'Drinks',
      sort_order: 1,
      active: true,
      items: [
        { id: 'item-1', name: 'Coca Cola', price_cents: 200, available: true },
        { id: 'item-2', name: 'Agua', price_cents: 150, available: true },
      ],
    },
    {
      id: 'cat-2',
      tenant_id: 'tenant-123',
      name: 'Comidas',
      description: 'Food',
      sort_order: 2,
      active: true,
      items: [
        { id: 'item-3', name: 'Pizza', price_cents: 1000, available: true },
      ],
    },
  ]

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false, gcTime: 0 },
        mutations: { retry: false },
      },
    })

    vi.mocked(useAuth).mockReturnValue({
      user: mockUser,
      tenant: mockTenant,
      isLoading: false,
      signIn: vi.fn(),
      signOut: vi.fn(),
      signUp: vi.fn(),
    })

    vi.mocked(menuService.getFullMenu).mockResolvedValue({
      data: mockFullMenu,
      error: null,
    })
  })

  afterEach(() => {
    queryClient.clear()
    vi.clearAllMocks()
  })

  const wrapper = ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  )

  it('should fetch full menu successfully', async () => {
    const { result } = renderHook(() => useFullMenu(), { wrapper })

    expect(result.current.loading).toBe(true)

    await waitFor(() => {
      expect(result.current.loading).toBe(false)
    })

    expect(result.current.menu).toEqual(mockFullMenu)
    expect(result.current.error).toBe(null)
    expect(menuService.getFullMenu).toHaveBeenCalledWith('tenant-123')
  })

  it('should handle fetch error', async () => {
    const mockError = new Error('Failed to fetch menu')
    vi.mocked(menuService.getFullMenu).mockResolvedValue({
      data: null,
      error: mockError,
    })

    const { result } = renderHook(() => useFullMenu(), { wrapper })

    await waitFor(() => {
      expect(result.current.loading).toBe(false)
    })

    expect(result.current.error).toEqual(mockError)
    expect(result.current.menu).toEqual([])
  })

  it('should return empty array when no tenant', async () => {
    vi.mocked(useAuth).mockReturnValue({
      user: mockUser,
      tenant: null,
      isLoading: false,
      signIn: vi.fn(),
      signOut: vi.fn(),
      signUp: vi.fn(),
    })

    const { result } = renderHook(() => useFullMenu(), { wrapper })

    await waitFor(() => {
      expect(result.current.loading).toBe(false)
    })

    expect(result.current.menu).toEqual([])
    expect(menuService.getFullMenu).not.toHaveBeenCalled()
  })

  it('should include nested items in categories', async () => {
    const { result } = renderHook(() => useFullMenu(), { wrapper })

    await waitFor(() => expect(result.current.loading).toBe(false))

    expect(result.current.menu[0].items).toHaveLength(2)
    expect(result.current.menu[1].items).toHaveLength(1)
  })

  it('should cache full menu data', async () => {
    const { result, rerender } = renderHook(() => useFullMenu(), { wrapper })

    await waitFor(() => expect(result.current.loading).toBe(false))

    expect(menuService.getFullMenu).toHaveBeenCalledTimes(1)

    rerender()

    expect(menuService.getFullMenu).toHaveBeenCalledTimes(1)
  })
})
