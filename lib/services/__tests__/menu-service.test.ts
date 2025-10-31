/**
 * Menu Service Tests
 * Tests unitarios completos para menu-service.ts
 */

import { describe, it, expect, beforeEach, vi } from 'vitest'
import {
  getMenuCategories,
  getMenuItems,
  getMenuItemById,
  createMenuItem,
  updateMenuItem,
  deleteMenuItem,
  createMenuCategory,
  updateMenuCategory,
  getFullMenu,
} from '../menu-service'

// Mock Supabase client with proper chaining
vi.mock('@/lib/supabase/client', () => ({
  createBrowserClient: vi.fn(() => {
    const createChainableMock = (data: any) => ({
      eq: vi.fn(() => createChainableMock(data)),
      order: vi.fn(() => Promise.resolve({ data, error: null })),
      single: vi.fn(() => Promise.resolve({ data: data?.[0] || data, error: null })),
      or: vi.fn(() => createChainableMock(data)),
      data,
      error: null,
    })

    return {
      from: vi.fn((table: string) => ({
        select: vi.fn((query?: string) => {
          const data = mockData[table] || []
          return createChainableMock(data)
        }),
        insert: vi.fn((values: any) => ({
          select: vi.fn(() => ({
            single: vi.fn(() => Promise.resolve({ 
              data: mockData.newItem || mockData.newCategory, 
              error: null 
            })),
          })),
        })),
        update: vi.fn((values: any) => ({
          eq: vi.fn(() => ({
            eq: vi.fn(() => ({
              select: vi.fn(() => ({
                single: vi.fn(() => Promise.resolve({ 
                  data: mockData.updated, 
                  error: null 
                })),
              })),
            })),
          })),
        })),
        delete: vi.fn(() => ({
          eq: vi.fn(() => ({
            eq: vi.fn(() => Promise.resolve({ error: null })),
          })),
        })),
      })),
    }
  }),
}))

// Mock data
const mockData: any = {
  menu_categories: [
    {
      id: 'cat-1',
      tenant_id: 'tenant-1',
      name: 'Entradas',
      description: 'Entradas y aperitivos',
      sort_order: 1,
      active: true,
      created_at: '2025-01-01T00:00:00Z',
      updated_at: '2025-01-01T00:00:00Z',
    },
    {
      id: 'cat-2',
      tenant_id: 'tenant-1',
      name: 'Platos Principales',
      description: 'Platos fuertes',
      sort_order: 2,
      active: true,
      created_at: '2025-01-01T00:00:00Z',
      updated_at: '2025-01-01T00:00:00Z',
    },
  ],
  menu_items: [
    {
      id: 'item-1',
      tenant_id: 'tenant-1',
      category_id: 'cat-1',
      name: 'Ensalada César',
      description: 'Ensalada clásica con pollo',
      price_cents: 1500,
      image_url: 'https://example.com/cesar.jpg',
      tags: ['ensalada', 'pollo'],
      allergens: { gluten: true },
      available: true,
      created_at: '2025-01-01T00:00:00Z',
      updated_at: '2025-01-01T00:00:00Z',
      category: {
        id: 'cat-1',
        name: 'Entradas',
        description: 'Entradas y aperitivos',
      },
    },
  ],
  newCategory: {
    id: 'cat-3',
    tenant_id: 'tenant-1',
    name: 'Postres',
    description: 'Dulces postres',
    sort_order: 3,
    active: true,
    created_at: '2025-01-01T00:00:00Z',
    updated_at: '2025-01-01T00:00:00Z',
  },
  newItem: {
    id: 'item-2',
    tenant_id: 'tenant-1',
    category_id: 'cat-1',
    name: 'Bruschetta',
    description: 'Pan tostado con tomate',
    price_cents: 800,
    available: true,
  },
  updated: {
    id: 'item-1',
    name: 'Ensalada César Premium',
    price_cents: 1800,
  },
}

const TENANT_ID = 'tenant-1'

describe('Menu Service - Categories', () => {
  it('should get all menu categories', async () => {
    const result = await getMenuCategories(TENANT_ID)
    
    expect(result.error).toBeNull()
    expect(result.data).toHaveLength(2)
    expect(result.data?.[0].name).toBe('Entradas')
  })

  it('should create a new category', async () => {
    const input = {
      name: 'Postres',
      description: 'Dulces postres',
      sortOrder: 3,
    }

    const result = await createMenuCategory(input, TENANT_ID)

    expect(result.error).toBeNull()
    expect(result.data?.name).toBe('Postres')
  })

  it('should update a category', async () => {
    const updates = {
      name: 'Entradas Gourmet',
      description: 'Entradas premium',
    }

    const result = await updateMenuCategory('cat-1', updates, TENANT_ID)

    expect(result.error).toBeNull()
    expect(result.data).toBeDefined()
  })
})

describe('Menu Service - Items', () => {
  it('should get all menu items', async () => {
    const result = await getMenuItems(TENANT_ID)

    expect(result.error).toBeNull()
    expect(result.data).toHaveLength(1)
    expect(result.data?.[0].name).toBe('Ensalada César')
  })

  it('should get menu items by category', async () => {
    const result = await getMenuItems(TENANT_ID, { categoryId: 'cat-1' })

    expect(result.error).toBeNull()
    expect(result.data).toBeDefined()
  })

  it('should get menu items with search filter', async () => {
    const result = await getMenuItems(TENANT_ID, { search: 'ensalada' })

    expect(result.error).toBeNull()
    expect(result.data).toBeDefined()
  })

  it('should get a menu item by id', async () => {
    const result = await getMenuItemById('item-1', TENANT_ID)

    expect(result.error).toBeNull()
    expect(result.data?.name).toBe('Ensalada César')
    expect(result.data?.category).toBeDefined()
  })

  it('should create a new menu item', async () => {
    const input = {
      categoryId: 'cat-1',
      name: 'Bruschetta',
      description: 'Pan tostado con tomate',
      priceCents: 800,
      tags: ['italiano', 'vegetariano'],
    }

    const result = await createMenuItem(input, TENANT_ID)

    expect(result.error).toBeNull()
    expect(result.data?.name).toBe('Bruschetta')
  })

  it('should update a menu item', async () => {
    const updates = {
      name: 'Ensalada César Premium',
      priceCents: 1800,
    }

    const result = await updateMenuItem('item-1', updates, TENANT_ID)

    expect(result.error).toBeNull()
    expect(result.data).toBeDefined()
  })

  it('should delete a menu item', async () => {
    const result = await deleteMenuItem('item-1', TENANT_ID)

    expect(result.error).toBeNull()
  })
})

describe('Menu Service - Full Menu', () => {
  it('should get full menu with categories and items', async () => {
    const result = await getFullMenu(TENANT_ID)

    expect(result.error).toBeNull()
    expect(result.data).toBeDefined()
    expect(Array.isArray(result.data)).toBe(true)
  })
})

describe('Menu Service - Validations', () => {
  it('should handle empty tenant id gracefully', async () => {
    const result = await getMenuCategories('')

    // Should not throw, just return empty or error
    expect(result).toBeDefined()
  })

  it('should create item with minimal data', async () => {
    const input = {
      categoryId: 'cat-1',
      name: 'Item Mínimo',
      description: 'Descripción',
      priceCents: 100,
    }

    const result = await createMenuItem(input, TENANT_ID)

    expect(result.error).toBeNull()
  })

  it('should handle item with optional fields', async () => {
    const input = {
      categoryId: 'cat-1',
      name: 'Item Completo',
      description: 'Con todos los campos',
      priceCents: 2000,
      imageUrl: 'https://example.com/image.jpg',
      tags: ['tag1', 'tag2'],
      allergens: { nuts: true, dairy: true },
      available: false,
    }

    const result = await createMenuItem(input, TENANT_ID)

    expect(result.error).toBeNull()
  })
})
