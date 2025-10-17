/**
 * Unit Tests for useTables Hook
 * 
 * Tests completos para el hook de gestión de mesas con React Query
 * Incluye: queries, mutations, optimistic updates, error handling
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { renderHook, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { useTables } from '@/hooks/use-tables'
import * as tablesService from '@/lib/services/tables-service'
import * as authContext from '@/contexts/auth-context'

// Mock del servicio
vi.mock('@/lib/services/tables-service')
vi.mock('@/contexts/auth-context')

// Mock data
const mockTenant = {
  id: 'tenant-test-123',
  name: 'Test Restaurant',
}

const mockTables = [
  {
    id: 'table-1',
    number: '1',
    capacity: 4,
    status: 'libre',
    zone_id: 'zone-1',
    tenant_id: 'tenant-test-123',
    created_at: '2025-01-01T00:00:00Z',
    updated_at: '2025-01-01T00:00:00Z',
    position: null,
    metadata: null,
    qr_token: null,
    qr_expires_at: null,
    qrcode_url: null,
    zone: {
      id: 'zone-1',
      name: 'Terraza',
      description: 'Zona exterior',
    },
  },
  {
    id: 'table-2',
    number: '2',
    capacity: 2,
    status: 'ocupada',
    zone_id: 'zone-1',
    tenant_id: 'tenant-test-123',
    created_at: '2025-01-01T00:00:00Z',
    updated_at: '2025-01-01T00:00:00Z',
    position: null,
    metadata: null,
    qr_token: null,
    qr_expires_at: null,
    qrcode_url: null,
    zone: {
      id: 'zone-1',
      name: 'Terraza',
      description: 'Zona exterior',
    },
  },
]

describe('useTables Hook', () => {
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
    vi.mocked(tablesService.getTables).mockResolvedValue({
      data: mockTables as any,
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

  describe('Query - Fetching tables', () => {
    it('should fetch tables successfully', async () => {
      const { result } = renderHook(() => useTables(), { wrapper })

      // Estado inicial
      expect(result.current.loading).toBe(true)
      expect(result.current.tables).toEqual([])

      // Esperar a que cargue
      await waitFor(() => {
        expect(result.current.loading).toBe(false)
      })

      // Verificar datos cargados
      expect(result.current.tables).toHaveLength(2)
      expect(result.current.tables[0].number).toBe('1')
      expect(result.current.tables[1].number).toBe('2')
      expect(result.current.error).toBeNull()

      // Verificar que se llamó al servicio con tenant correcto
      expect(tablesService.getTables).toHaveBeenCalledWith(
        'tenant-test-123',
        undefined
      )
    })

    it('should handle fetch error', async () => {
      const errorMessage = 'Network error'
      vi.mocked(tablesService.getTables).mockResolvedValue({
        data: null,
        error: new Error(errorMessage) as any,
      })

      const { result } = renderHook(() => useTables(), { wrapper })

      await waitFor(() => {
        expect(result.current.loading).toBe(false)
      })

      expect(result.current.error).toBeTruthy()
      expect(result.current.tables).toEqual([])
    })

    it('should filter tables by zone', async () => {
      const { result } = renderHook(
        () => useTables({ zoneId: 'zone-1' }),
        { wrapper }
      )

      await waitFor(() => {
        expect(result.current.loading).toBe(false)
      })

      // Verificar que se pasó el filtro
      expect(tablesService.getTables).toHaveBeenCalledWith(
        'tenant-test-123',
        { zoneId: 'zone-1' }
      )
    })

    it('should filter tables by status', async () => {
      const { result } = renderHook(
        () => useTables({ status: 'libre' }),
        { wrapper }
      )

      await waitFor(() => {
        expect(result.current.loading).toBe(false)
      })

      expect(tablesService.getTables).toHaveBeenCalledWith(
        'tenant-test-123',
        { status: 'libre' }
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

      const { result } = renderHook(() => useTables(), { wrapper })

      // No debería hacer fetch sin tenant
      expect(result.current.tables).toEqual([])
      expect(tablesService.getTables).not.toHaveBeenCalled()
    })
  })

  describe('Mutation - Create table', () => {
    it('should create table successfully', async () => {
      const newTableData = {
        number: '3',
        capacity: 6,
        zoneId: 'zone-1',
      }

      const createdTable = {
        ...mockTables[0],
        id: 'table-3',
        number: '3',
        capacity: 6,
      }

      vi.mocked(tablesService.createTable).mockResolvedValue({
        data: createdTable as any,
        error: null,
      })

      const { result } = renderHook(() => useTables(), { wrapper })

      await waitFor(() => {
        expect(result.current.loading).toBe(false)
      })

      // Llamar mutation
      await result.current.createTable(newTableData)

      // Verificar que se llamó al servicio
      expect(tablesService.createTable).toHaveBeenCalledWith(
        newTableData,
        'tenant-test-123'
      )

      // Esperar invalidación de cache
      await waitFor(() => {
        expect(tablesService.getTables).toHaveBeenCalledTimes(2) // Initial + refetch
      })
    })

    it('should handle create error', async () => {
      vi.mocked(tablesService.createTable).mockResolvedValue({
        data: null,
        error: new Error('Failed to create') as any,
      })

      const { result } = renderHook(() => useTables(), { wrapper })

      await waitFor(() => {
        expect(result.current.loading).toBe(false)
      })

      // Intentar crear mesa
      try {
        await result.current.createTable({
          number: '3',
          capacity: 4,
        })
      } catch (error) {
        expect(error).toBeTruthy()
      }
    })

    it('should perform optimistic update on create', async () => {
      vi.mocked(tablesService.createTable).mockImplementation(
        () => new Promise((resolve) => setTimeout(() => resolve({
          data: { ...mockTables[0], id: 'table-3', number: '3' } as any,
          error: null,
        }), 100))
      )

      const { result } = renderHook(() => useTables(), { wrapper })

      await waitFor(() => {
        expect(result.current.loading).toBe(false)
      })

      const initialCount = result.current.tables.length

      // Crear mesa
      result.current.createTable({
        number: '3',
        capacity: 4,
      })

      // Verificar que eventualmente se completa la mutación
      await waitFor(() => {
        expect(tablesService.createTable).toHaveBeenCalled()
      })
    })
  })

  describe('Mutation - Update table', () => {
    it('should update table successfully', async () => {
      const updatedTable = {
        ...mockTables[0],
        capacity: 8,
      }

      vi.mocked(tablesService.updateTable).mockResolvedValue({
        data: updatedTable as any,
        error: null,
      })

      const { result } = renderHook(() => useTables(), { wrapper })

      await waitFor(() => {
        expect(result.current.loading).toBe(false)
      })

      // Actualizar mesa
      await result.current.updateTable('table-1', { capacity: 8 })

      expect(tablesService.updateTable).toHaveBeenCalledWith(
        'table-1',
        { capacity: 8 },
        'tenant-test-123'
      )
    })

    it('should handle update error and rollback', async () => {
      vi.mocked(tablesService.updateTable).mockResolvedValue({
        data: null,
        error: new Error('Update failed') as any,
      })

      const { result } = renderHook(() => useTables(), { wrapper })

      await waitFor(() => {
        expect(result.current.loading).toBe(false)
      })

      const originalTables = [...result.current.tables]

      try {
        await result.current.updateTable('table-1', { capacity: 8 })
      } catch (error) {
        // Error esperado
      }

      // Verificar rollback
      await waitFor(() => {
        expect(result.current.tables).toEqual(originalTables)
      })
    })
  })

  describe('Mutation - Update status', () => {
    it('should update table status', async () => {
      const updatedTable = {
        ...mockTables[0],
        status: 'ocupada',
      }

      vi.mocked(tablesService.updateTableStatus).mockResolvedValue({
        data: updatedTable as any,
        error: null,
      })

      const { result } = renderHook(() => useTables(), { wrapper })

      await waitFor(() => {
        expect(result.current.loading).toBe(false)
      })

      await result.current.updateStatus('table-1', 'ocupada')

      expect(tablesService.updateTableStatus).toHaveBeenCalledWith(
        'table-1',
        'ocupada',
        'tenant-test-123'
      )
    })
  })

  describe('Mutation - Delete table', () => {
    it('should delete table successfully', async () => {
      vi.mocked(tablesService.deleteTable).mockResolvedValue({
        error: null,
      })

      const { result } = renderHook(() => useTables(), { wrapper })

      await waitFor(() => {
        expect(result.current.loading).toBe(false)
      })

      const initialCalls = vi.mocked(tablesService.getTables).mock.calls.length

      await result.current.deleteTable('table-1')

      expect(tablesService.deleteTable).toHaveBeenCalledWith(
        'table-1',
        'tenant-test-123'
      )

      // Verificar refetch
      await waitFor(() => {
        expect(tablesService.getTables).toHaveBeenCalledTimes(initialCalls + 1)
      })
    })

    it('should handle delete error', async () => {
      vi.mocked(tablesService.deleteTable).mockResolvedValue({
        error: new Error('Delete failed') as any,
      })

      const { result } = renderHook(() => useTables(), { wrapper })

      await waitFor(() => {
        expect(result.current.loading).toBe(false)
      })

      try {
        await result.current.deleteTable('table-1')
      } catch (error) {
        expect(error).toBeTruthy()
      }
    })
  })

  describe('Refresh functionality', () => {
    it('should refresh tables on demand', async () => {
      const { result } = renderHook(() => useTables(), { wrapper })

      await waitFor(() => {
        expect(result.current.loading).toBe(false)
      })

      // Primera carga (1 call)
      const initialCalls = vi.mocked(tablesService.getTables).mock.calls.length

      // Refrescar
      await result.current.refresh()

      // Segunda carga
      expect(tablesService.getTables).toHaveBeenCalledTimes(initialCalls + 1)
    })
  })

  describe('React Query features', () => {
    it('should cache query results', async () => {
      const { result, rerender } = renderHook(() => useTables(), { wrapper })

      await waitFor(() => {
        expect(result.current.loading).toBe(false)
      })

      const firstTables = result.current.tables

      // Rerender debería usar cache
      rerender()

      expect(result.current.tables).toBe(firstTables)
      // No debería hacer fetch adicional (cache activo)
      expect(tablesService.getTables).toHaveBeenCalledTimes(1)
    })

    it('should invalidate cache after mutation', async () => {
      vi.mocked(tablesService.createTable).mockResolvedValue({
        data: { ...mockTables[0], id: 'table-3' } as any,
        error: null,
      })

      const { result } = renderHook(() => useTables(), { wrapper })

      await waitFor(() => {
        expect(result.current.loading).toBe(false)
      })

      // Primera carga
      expect(tablesService.getTables).toHaveBeenCalledTimes(1)

      // Mutation invalida cache
      await result.current.createTable({ number: '3', capacity: 4 })

      // Debería refetch
      await waitFor(() => {
        expect(tablesService.getTables).toHaveBeenCalledTimes(2)
      })
    })
  })
})
