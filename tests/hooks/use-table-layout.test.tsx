/**
 * Tests for useTableLayout Hook
 * 
 * Tests canvas layout management with dependencies on useTables and useZones
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { renderHook, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { useTableLayout } from '@/hooks/use-table-layout'
import * as layoutsService from '@/lib/services/layouts-service'
import * as tablesService from '@/lib/services/tables-service'
import * as zonesService from '@/lib/services/zones-service'
import { useAuth } from '@/contexts/auth-context'

// Mock dependencies
vi.mock('@/lib/services/layouts-service')
vi.mock('@/lib/services/tables-service')
vi.mock('@/lib/services/zones-service')
vi.mock('@/contexts/auth-context')

describe('useTableLayout', () => {
  let queryClient: QueryClient
  const mockUser = { id: 'user-123', email: 'test@example.com', tenant_id: 'tenant-123' } as any
  const mockTenant = { id: 'tenant-123', name: 'Test Restaurant' } as any

  const mockTables = [
    { id: 'table-1', tenant_id: 'tenant-123', zone_id: 'zone-1', number: 1, seats: 4, status: 'available' },
    { id: 'table-2', tenant_id: 'tenant-123', zone_id: 'zone-1', number: 2, seats: 2, status: 'available' },
  ] as any

  const mockZones = [
    { id: 'zone-1', tenant_id: 'tenant-123', name: 'Main Hall', active: true },
  ] as any

  const mockLayout = {
    zones: [
      { id: 'zone-1', name: 'Main Hall', color: '#ef4444' },
    ],
    nodes: [
      { id: 'node-table-1', tableId: 'table-1', x: 50, y: 50, width: 80, height: 60, shape: 'rectangle' as const, zone: 'Main Hall' },
      { id: 'node-table-2', tableId: 'table-2', x: 150, y: 50, width: 80, height: 60, shape: 'circle' as const, zone: 'Main Hall' },
    ],
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
      session: null,
      isLoading: false,
      isHydrated: true,
      login: vi.fn(),
      logout: vi.fn(),
      updateTenant: vi.fn(),
    })

    // Mock tables service
    vi.mocked(tablesService.getTables).mockResolvedValue({
      data: mockTables,
      error: null,
    } as any)

    // Mock zones service
    vi.mocked(zonesService.getZones).mockResolvedValue({
      data: mockZones,
      error: null,
    } as any)

    // Mock layout service
    vi.mocked(layoutsService.getLayout).mockResolvedValue(mockLayout)
    vi.mocked(layoutsService.saveLayout).mockResolvedValue(true)
    vi.mocked(layoutsService.deleteLayout).mockResolvedValue(true)
    vi.mocked(layoutsService.createDefaultLayout).mockReturnValue(mockLayout)
  })

  afterEach(() => {
    queryClient.clear()
    vi.clearAllMocks()
  })

  const wrapper = ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  )

  // Query Tests
  it('should fetch layout successfully', async () => {
    const { result } = renderHook(() => useTableLayout(), { wrapper })

    expect(result.current.isLoading).toBe(true)

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false)
    })

    expect(result.current.layout).toEqual(mockLayout)
    expect(result.current.error).toBe(null)
    expect(layoutsService.getLayout).toHaveBeenCalledWith('tenant-123')
  })

  it('should handle fetch error', async () => {
    vi.mocked(layoutsService.getLayout).mockRejectedValue(new Error('Failed to fetch layout'))

    const { result } = renderHook(() => useTableLayout(), { wrapper })

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false)
    })

    expect(result.current.error).toBeTruthy()
    expect(result.current.layout).toBe(null)
  })

  it('should return null when no user', async () => {
    vi.mocked(useAuth).mockReturnValue({
      user: null,
      tenant: mockTenant,
      session: null,
      isLoading: false,
      isHydrated: true,
      login: vi.fn(),
      logout: vi.fn(),
      updateTenant: vi.fn(),
    })

    const { result } = renderHook(() => useTableLayout(), { wrapper })

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false)
    })

    expect(result.current.layout).toBe(null)
    expect(layoutsService.getLayout).not.toHaveBeenCalled()
  })

  it('should create default layout when none exists', async () => {
    vi.mocked(layoutsService.getLayout).mockResolvedValue(null)

    const { result } = renderHook(() => useTableLayout({ createDefaultIfMissing: true }), { wrapper })

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false)
    })

    expect(layoutsService.createDefaultLayout).toHaveBeenCalledWith(
      expect.arrayContaining([
        expect.objectContaining({ id: 'table-1', zone_id: 'zone-1' }),
        expect.objectContaining({ id: 'table-2', zone_id: 'zone-1' }),
      ]),
      expect.arrayContaining([
        expect.objectContaining({ id: 'zone-1', name: 'Main Hall' }),
      ])
    )
    expect(result.current.layout).toEqual(mockLayout)
  })

  it('should not create default layout when disabled', async () => {
    vi.mocked(layoutsService.getLayout).mockResolvedValue(null)

    const { result } = renderHook(() => useTableLayout({ createDefaultIfMissing: false }), { wrapper })

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false)
    })

    expect(layoutsService.createDefaultLayout).not.toHaveBeenCalled()
    expect(result.current.layout).toBe(null)
  })

  it('should wait for tables and zones to load', async () => {
    vi.mocked(tablesService.getTables).mockImplementation(
      () => new Promise((resolve) => setTimeout(() => resolve({ data: mockTables, error: null } as any), 100))
    )

    const { result } = renderHook(() => useTableLayout(), { wrapper })

    expect(result.current.isLoading).toBe(true)

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false)
    }, { timeout: 3000 })
  })

  // Save Layout Tests
  it('should save layout successfully', async () => {
    const { result } = renderHook(() => useTableLayout(), { wrapper })

    await waitFor(() => expect(result.current.isLoading).toBe(false))

    const newLayout = {
      ...mockLayout,
      nodes: [
        ...mockLayout.nodes,
        { id: 'node-table-3', tableId: 'table-3', x: 250, y: 50, width: 80, height: 60, shape: 'rectangle' as const, zone: 'Main Hall' },
      ],
    }

    const success = await result.current.saveLayout(newLayout)

    expect(success).toBe(true)
    expect(layoutsService.saveLayout).toHaveBeenCalledWith('tenant-123', newLayout)
  })

  it('should handle save layout error', async () => {
    vi.mocked(layoutsService.saveLayout).mockRejectedValue(new Error('Save failed'))

    const { result } = renderHook(() => useTableLayout(), { wrapper })

    await waitFor(() => expect(result.current.isLoading).toBe(false))

    const success = await result.current.saveLayout(mockLayout)

    expect(success).toBe(false)
  })

  it('should apply optimistic update when saving layout', async () => {
    vi.mocked(layoutsService.saveLayout).mockImplementation(
      () => new Promise((resolve) => setTimeout(() => resolve(true), 100))
    )

    const { result } = renderHook(() => useTableLayout(), { wrapper })

    await waitFor(() => expect(result.current.isLoading).toBe(false))

    const newLayout = {
      ...mockLayout,
      nodes: [...mockLayout.nodes].map(n => ({ ...n, x: n.x + 10 })),
    }

    result.current.saveLayout(newLayout)

    await waitFor(() => {
      expect(result.current.layout?.nodes[0].x).toBe(60) // 50 + 10
    })
  })

  it('should rollback optimistic update on save error', async () => {
    vi.mocked(layoutsService.saveLayout).mockResolvedValue(false)

    const { result } = renderHook(() => useTableLayout(), { wrapper })

    await waitFor(() => expect(result.current.isLoading).toBe(false))

    const originalLayout = result.current.layout

    const newLayout = {
      ...mockLayout,
      nodes: [],
    }

    await result.current.saveLayout(newLayout)

    await waitFor(() => {
      expect(result.current.layout).toEqual(originalLayout)
    })
  })

  // Delete Layout Tests
  it('should delete layout successfully', async () => {
    const { result } = renderHook(() => useTableLayout(), { wrapper })

    await waitFor(() => expect(result.current.isLoading).toBe(false))

    const success = await result.current.deleteLayout()

    expect(success).toBe(true)
    expect(layoutsService.deleteLayout).toHaveBeenCalledWith('tenant-123')
  })

  it('should handle delete layout error', async () => {
    vi.mocked(layoutsService.deleteLayout).mockRejectedValue(new Error('Delete failed'))

    const { result } = renderHook(() => useTableLayout(), { wrapper })

    await waitFor(() => expect(result.current.isLoading).toBe(false))

    const success = await result.current.deleteLayout()

    expect(success).toBe(false)
  })

  it('should set layout to null optimistically during delete', async () => {
    vi.mocked(layoutsService.deleteLayout).mockImplementation(
      () => new Promise((resolve) => setTimeout(() => resolve(true), 100))
    )

    const { result } = renderHook(() => useTableLayout(), { wrapper })

    await waitFor(() => expect(result.current.isLoading).toBe(false))

    expect(result.current.layout).not.toBe(null)

    result.current.deleteLayout()

    await waitFor(() => {
      expect(result.current.layout).toBe(null)
    })
  })

  it('should rollback on delete error', async () => {
    vi.mocked(layoutsService.deleteLayout).mockRejectedValue(new Error('Delete failed'))

    const { result } = renderHook(() => useTableLayout(), { wrapper })

    await waitFor(() => expect(result.current.isLoading).toBe(false))

    const originalLayout = result.current.layout

    await result.current.deleteLayout()

    await waitFor(() => {
      expect(result.current.layout).toEqual(originalLayout)
    })
  })

  // Generate Default Layout Tests
  it('should generate default layout from current tables and zones', async () => {
    const { result } = renderHook(() => useTableLayout(), { wrapper })

    await waitFor(() => expect(result.current.isLoading).toBe(false))

    const defaultLayout = result.current.generateDefaultLayout()

    expect(defaultLayout).toEqual(mockLayout)
    expect(layoutsService.createDefaultLayout).toHaveBeenCalledWith(
      expect.arrayContaining([
        expect.objectContaining({ id: 'table-1' }),
        expect.objectContaining({ id: 'table-2' }),
      ]),
      expect.arrayContaining([
        expect.objectContaining({ id: 'zone-1' }),
      ])
    )
  })

  it('should return null when generating layout with no tables', async () => {
    vi.mocked(tablesService.getTables).mockResolvedValue({
      data: [],
      error: null,
    } as any)

    vi.mocked(layoutsService.createDefaultLayout).mockReturnValue(null as any)

    const { result } = renderHook(() => useTableLayout(), { wrapper })

    await waitFor(() => expect(result.current.isLoading).toBe(false))

    const defaultLayout = result.current.generateDefaultLayout()

    expect(defaultLayout).toBe(null)
  })

  // Refresh Tests
  it('should refresh layout', async () => {
    const { result } = renderHook(() => useTableLayout(), { wrapper })

    await waitFor(() => expect(result.current.isLoading).toBe(false))

    vi.clearAllMocks()

    result.current.refresh()

    await waitFor(() => {
      expect(layoutsService.getLayout).toHaveBeenCalled()
    })
  })

  // Cache Tests
  it('should cache layout data', async () => {
    const { result, rerender } = renderHook(() => useTableLayout(), { wrapper })

    await waitFor(() => expect(result.current.isLoading).toBe(false))

    expect(layoutsService.getLayout).toHaveBeenCalledTimes(1)

    rerender()

    expect(layoutsService.getLayout).toHaveBeenCalledTimes(1)
  })

  it('should invalidate cache after save mutation', async () => {
    const { result } = renderHook(() => useTableLayout(), { wrapper })

    await waitFor(() => expect(result.current.isLoading).toBe(false))

    vi.clearAllMocks()

    await result.current.saveLayout(mockLayout)

    await waitFor(() => {
      expect(layoutsService.getLayout).toHaveBeenCalled()
    })
  })

  it('should invalidate cache after delete mutation', async () => {
    const { result } = renderHook(() => useTableLayout(), { wrapper })

    await waitFor(() => expect(result.current.isLoading).toBe(false))

    vi.clearAllMocks()

    await result.current.deleteLayout()

    await waitFor(() => {
      expect(layoutsService.getLayout).toHaveBeenCalled()
    })
  })
})
