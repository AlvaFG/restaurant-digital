/**
 * Integration Tests: Tables + Zones
 * 
 * Tests the integration between table and zone management,
 * verifying that tables can be assigned to zones and relationships work correctly.
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { renderHook, waitFor } from '@testing-library/react'
import { useTables } from '@/hooks/use-tables'
import { useZones } from '@/hooks/use-zones'
import * as tablesService from '@/lib/services/tables-service'
import * as zonesService from '@/lib/services/zones-service'
import { useAuth } from '@/contexts/auth-context'
import {
  createIntegrationWrapper,
  createIntegrationTestQueryClient,
  mockAuthUser,
  mockAuthTenant,
  mockDataFactory,
} from '../utils/integration-test-utils'

// Mock dependencies
vi.mock('@/lib/services/tables-service')
vi.mock('@/lib/services/zones-service')
vi.mock('@/contexts/auth-context')

describe('Tables + Zones Integration', () => {
  let wrapper: ReturnType<typeof createIntegrationWrapper>
  const queryClient = createIntegrationTestQueryClient()

  const mockZones = [
    mockDataFactory.zone({ id: 'zone-1', name: 'Main Hall' }),
    mockDataFactory.zone({ id: 'zone-2', name: 'Terrace' }),
  ]

  const mockTables = [
    mockDataFactory.table({ id: 'table-1', zone_id: 'zone-1', number: 1 }),
    mockDataFactory.table({ id: 'table-2', zone_id: 'zone-1', number: 2 }),
    mockDataFactory.table({ id: 'table-3', zone_id: 'zone-2', number: 3 }),
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

    vi.mocked(zonesService.getZones).mockResolvedValue({
      data: mockZones,
      error: null,
    } as any)

    vi.mocked(tablesService.getTables).mockResolvedValue({
      data: mockTables,
      error: null,
    } as any)
  })

  afterEach(() => {
    queryClient.clear()
    vi.clearAllMocks()
  })

  it('should load zones and tables together', async () => {
    const { result: zonesResult } = renderHook(() => useZones(), { wrapper })
    const { result: tablesResult } = renderHook(() => useTables(), { wrapper })

    await waitFor(() => {
      expect(zonesResult.current.loading).toBe(false)
      expect(tablesResult.current.loading).toBe(false)
    })

    expect(zonesResult.current.zones).toHaveLength(2)
    expect(tablesResult.current.tables).toHaveLength(3)
  })

  it('should filter tables by zone', async () => {
    const { result: tablesResult } = renderHook(
      () => useTables({ zoneId: 'zone-1' }),
      { wrapper }
    )

    await waitFor(() => expect(tablesResult.current.loading).toBe(false))

    expect(tablesService.getTables).toHaveBeenCalledWith('tenant-test-123', {
      zoneId: 'zone-1',
    })
  })

  it('should create table and assign to zone', async () => {
    const newTable = mockDataFactory.table({
      id: 'table-4',
      zone_id: 'zone-1',
      number: '4',
    })

    vi.mocked(tablesService.createTable).mockResolvedValue({
      data: newTable,
      error: null,
    } as any)

    const { result } = renderHook(() => useTables(), { wrapper })

    await waitFor(() => expect(result.current.loading).toBe(false))

    await result.current.createTable({
      number: '4',
      seats: 4,
      zoneId: 'zone-1',
    })

    expect(tablesService.createTable).toHaveBeenCalledWith(
      expect.objectContaining({ zoneId: 'zone-1' }),
      'tenant-test-123'
    )
  })

  it('should reassign table to different zone', async () => {
    const updatedTable = {
      ...mockTables[0],
      zone_id: 'zone-2',
    }

    vi.mocked(tablesService.updateTable).mockResolvedValue({
      data: updatedTable,
      error: null,
    } as any)

    const { result } = renderHook(() => useTables(), { wrapper })

    await waitFor(() => expect(result.current.loading).toBe(false))

    await result.current.updateTable('table-1', {
      zoneId: 'zone-2',
    })

    expect(tablesService.updateTable).toHaveBeenCalledWith(
      'table-1',
      expect.objectContaining({ zoneId: 'zone-2' }),
      'tenant-test-123'
    )
  })

  it('should handle zone deletion affecting tables', async () => {
    // Delete zone
    vi.mocked(zonesService.deleteZone).mockResolvedValue({
      error: null,
    } as any)

    // Tables in deleted zone should become unassigned
    const tablesAfterZoneDeletion = mockTables.map((t) =>
      t.zone_id === 'zone-1' ? { ...t, zone_id: null } : t
    )

    vi.mocked(tablesService.getTables).mockResolvedValue({
      data: tablesAfterZoneDeletion,
      error: null,
    } as any)

    const { result: zonesResult } = renderHook(() => useZones(), { wrapper })
    const { result: tablesResult } = renderHook(() => useTables(), { wrapper })

    await waitFor(() => {
      expect(zonesResult.current.loading).toBe(false)
      expect(tablesResult.current.loading).toBe(false)
    })

    // Delete zone
    await zonesResult.current.deleteZone('zone-1')

    // Refresh tables to see the effect
    tablesResult.current.refresh()

    await waitFor(() => {
      const unassignedTables = tablesResult.current.tables.filter(
        (t) => t.zone_id === null
      )
      expect(unassignedTables.length).toBeGreaterThan(0)
    })
  })

  it('should create zone and immediately assign tables to it', async () => {
    const newZone = mockDataFactory.zone({ id: 'zone-3', name: 'VIP Area' })

    vi.mocked(zonesService.createZone).mockResolvedValue({
      data: newZone,
      error: null,
    } as any)

    const newTable = mockDataFactory.table({
      id: 'table-5',
      zone_id: 'zone-3',
      number: '5',
    })

    vi.mocked(tablesService.createTable).mockResolvedValue({
      data: newTable,
      error: null,
    } as any)

    const { result: zonesResult } = renderHook(() => useZones(), { wrapper })
    const { result: tablesResult } = renderHook(() => useTables(), { wrapper })

    await waitFor(() => {
      expect(zonesResult.current.loading).toBe(false)
      expect(tablesResult.current.loading).toBe(false)
    })

    // Create zone
    await zonesResult.current.createZone({
      name: 'VIP Area',
      description: 'VIP section',
      
    })

    // Create table in new zone
    await tablesResult.current.createTable({
      number: '5',
      seats: 4,
      zoneId: 'zone-3',
    })

    expect(zonesService.createZone).toHaveBeenCalled()
    expect(tablesService.createTable).toHaveBeenCalledWith(
      expect.objectContaining({ zoneId: 'zone-3' }),
      'tenant-test-123'
    )
  })

  it('should maintain cache consistency when moving tables between zones', async () => {
    const { result: tablesResult } = renderHook(() => useTables(), { wrapper })

    await waitFor(() => expect(tablesResult.current.loading).toBe(false))

    const initialTable1Count = tablesResult.current.tables.filter(
      (t) => t.zone_id === 'zone-1'
    ).length

    // Move table from zone-1 to zone-2
    const movedTable = { ...mockTables[0], zone_id: 'zone-2' }
    const updatedMockTables = [
      movedTable,
      ...mockTables.slice(1),
    ]
    
    vi.mocked(tablesService.updateTable).mockResolvedValue({
      data: movedTable,
      error: null,
    } as any)

    vi.mocked(tablesService.getTables).mockResolvedValue({
      data: updatedMockTables,
      error: null,
    } as any)

    await tablesResult.current.updateTable('table-1', { zoneId: 'zone-2' })

    await waitFor(() => {
      const zone1Tables = tablesResult.current.tables.filter(
        (t) => t.zone_id === 'zone-1'
      )
      expect(zone1Tables.length).toBe(initialTable1Count - 1)
    })
  })

  it('should handle concurrent zone and table operations', async () => {
    const newZone = mockDataFactory.zone({ id: 'zone-4', name: 'Bar' })
    const newTable = mockDataFactory.table({
      id: 'table-6',
      zone_id: 'zone-4',
      number: '6',
    })

    vi.mocked(zonesService.createZone).mockImplementation(
      () =>
        new Promise((resolve) =>
          setTimeout(
            () => resolve({ data: newZone, error: null } as any),
            100
          )
        )
    )

    vi.mocked(tablesService.createTable).mockImplementation(
      () =>
        new Promise((resolve) =>
          setTimeout(
            () => resolve({ data: newTable, error: null } as any),
            100
          )
        )
    )

    const { result: zonesResult } = renderHook(() => useZones(), { wrapper })
    const { result: tablesResult } = renderHook(() => useTables(), { wrapper })

    await waitFor(() => {
      expect(zonesResult.current.loading).toBe(false)
      expect(tablesResult.current.loading).toBe(false)
    })

    // Execute both operations concurrently
    const [zoneResult, tableResult] = await Promise.all([
      zonesResult.current.createZone({
        name: 'Bar',
        description: 'Bar area',
        
      }),
      tablesResult.current.createTable({
        number: '6',
        capacity: 2,
        zoneId: 'zone-4',
      }),
    ])

    // Both should succeed
    expect(zonesService.createZone).toHaveBeenCalled()
    expect(tablesService.createTable).toHaveBeenCalled()
  })
})
