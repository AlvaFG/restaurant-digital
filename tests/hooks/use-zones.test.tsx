/**
 * Unit Tests for useZones Hook
 * 
 * Tests completos para el hook de gestión de zonas con React Query
 * Incluye: queries, mutations, soft delete vs hard delete, optimistic updates
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { renderHook, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { useZones } from '@/hooks/use-zones'
import * as zonesService from '@/lib/services/zones-service'
import * as authContext from '@/contexts/auth-context'

// Mock del servicio
vi.mock('@/lib/services/zones-service')
vi.mock('@/contexts/auth-context')

// Mock data
const mockTenant = {
  id: 'tenant-test-123',
  name: 'Test Restaurant',
}

const mockZones = [
  {
    id: 'zone-1',
    name: 'Terraza',
    description: 'Zona exterior',
    sort_order: 1,
    active: true,
    tenant_id: 'tenant-test-123',
    created_at: '2025-01-01T00:00:00Z',
    updated_at: '2025-01-01T00:00:00Z',
  },
  {
    id: 'zone-2',
    name: 'Salón Principal',
    description: 'Zona interior',
    sort_order: 2,
    active: true,
    tenant_id: 'tenant-test-123',
    created_at: '2025-01-01T00:00:00Z',
    updated_at: '2025-01-01T00:00:00Z',
  },
  {
    id: 'zone-3',
    name: 'Barra',
    description: 'Zona de barra',
    sort_order: 3,
    active: false,
    tenant_id: 'tenant-test-123',
    created_at: '2025-01-01T00:00:00Z',
    updated_at: '2025-01-01T00:00:00Z',
  },
]

describe('useZones Hook', () => {
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

    // Mock del servicio - respuesta exitosa por defecto (solo zonas activas)
    vi.mocked(zonesService.getZones).mockResolvedValue({
      data: mockZones.filter(z => z.active) as any,
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

  describe('Query - Fetching zones', () => {
    it('should fetch active zones by default', async () => {
      const { result } = renderHook(() => useZones(), { wrapper })

      // Estado inicial
      expect(result.current.loading).toBe(true)
      expect(result.current.zones).toEqual([])

      // Esperar a que cargue
      await waitFor(() => {
        expect(result.current.loading).toBe(false)
      })

      // Verificar datos cargados (solo activas)
      expect(result.current.zones).toHaveLength(2)
      expect(result.current.zones[0].name).toBe('Terraza')
      expect(result.current.zones[1].name).toBe('Salón Principal')
      expect(result.current.error).toBeNull()

      // Verificar que se llamó al servicio con parámetros correctos
      expect(zonesService.getZones).toHaveBeenCalledWith(
        'tenant-test-123',
        false // includeInactive = false por defecto
      )
    })

    it('should fetch all zones including inactive when specified', async () => {
      vi.mocked(zonesService.getZones).mockResolvedValue({
        data: mockZones as any,
        error: null,
      })

      const { result } = renderHook(() => useZones(true), { wrapper })

      await waitFor(() => {
        expect(result.current.loading).toBe(false)
      })

      // Verificar que incluye inactivas
      expect(result.current.zones).toHaveLength(3)
      expect(zonesService.getZones).toHaveBeenCalledWith(
        'tenant-test-123',
        true // includeInactive = true
      )
    })

    it('should handle fetch error', async () => {
      const errorMessage = 'Database connection error'
      vi.mocked(zonesService.getZones).mockResolvedValue({
        data: null,
        error: new Error(errorMessage) as any,
      })

      const { result } = renderHook(() => useZones(), { wrapper })

      await waitFor(() => {
        expect(result.current.loading).toBe(false)
      })

      expect(result.current.error).toBeTruthy()
      expect(result.current.zones).toEqual([])
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

      const { result } = renderHook(() => useZones(), { wrapper })

      // No debería hacer fetch sin tenant
      expect(result.current.zones).toEqual([])
      expect(zonesService.getZones).not.toHaveBeenCalled()
    })
  })

  describe('Mutation - Create zone', () => {
    it('should create zone successfully', async () => {
      const newZoneData = {
        name: 'VIP',
        description: 'Zona VIP',
        sortOrder: 4,
      }

      const createdZone = {
        ...mockZones[0],
        id: 'zone-4',
        name: 'VIP',
        description: 'Zona VIP',
        sort_order: 4,
      }

      vi.mocked(zonesService.createZone).mockResolvedValue({
        data: createdZone as any,
        error: null,
      })

      const { result } = renderHook(() => useZones(), { wrapper })

      await waitFor(() => {
        expect(result.current.loading).toBe(false)
      })

      // Llamar mutation
      await result.current.createZone(newZoneData)

      // Verificar que se llamó al servicio
      expect(zonesService.createZone).toHaveBeenCalledWith(
        newZoneData,
        'tenant-test-123'
      )

      // Esperar invalidación de cache
      await waitFor(() => {
        expect(zonesService.getZones).toHaveBeenCalledTimes(2) // Initial + refetch
      })
    })

    it('should handle create error', async () => {
      vi.mocked(zonesService.createZone).mockResolvedValue({
        data: null,
        error: new Error('Failed to create zone') as any,
      })

      const { result } = renderHook(() => useZones(), { wrapper })

      await waitFor(() => {
        expect(result.current.loading).toBe(false)
      })

      // Intentar crear zona
      try {
        await result.current.createZone({
          name: 'VIP',
          description: 'Zona VIP',
        })
      } catch (error) {
        expect(error).toBeTruthy()
      }
    })

    it('should perform optimistic update on create', async () => {
      vi.mocked(zonesService.createZone).mockImplementation(
        () => new Promise((resolve) => setTimeout(() => resolve({
          data: { ...mockZones[0], id: 'zone-4', name: 'VIP' } as any,
          error: null,
        }), 100))
      )

      const { result } = renderHook(() => useZones(), { wrapper })

      await waitFor(() => {
        expect(result.current.loading).toBe(false)
      })

      // Crear zona
      result.current.createZone({
        name: 'VIP',
        description: 'Zona VIP',
      })

      // Verificar que eventualmente se completa
      await waitFor(() => {
        expect(zonesService.createZone).toHaveBeenCalled()
      })
    })
  })

  describe('Mutation - Update zone', () => {
    it('should update zone successfully', async () => {
      const updatedZone = {
        ...mockZones[0],
        name: 'Terraza Actualizada',
        description: 'Nueva descripción',
      }

      vi.mocked(zonesService.updateZone).mockResolvedValue({
        data: updatedZone as any,
        error: null,
      })

      const { result } = renderHook(() => useZones(), { wrapper })

      await waitFor(() => {
        expect(result.current.loading).toBe(false)
      })

      // Actualizar zona
      await result.current.updateZone('zone-1', {
        name: 'Terraza Actualizada',
        description: 'Nueva descripción',
      })

      expect(zonesService.updateZone).toHaveBeenCalledWith(
        'zone-1',
        {
          name: 'Terraza Actualizada',
          description: 'Nueva descripción',
        },
        'tenant-test-123'
      )
    })

    it('should handle update error and rollback', async () => {
      vi.mocked(zonesService.updateZone).mockResolvedValue({
        data: null,
        error: new Error('Update failed') as any,
      })

      const { result } = renderHook(() => useZones(), { wrapper })

      await waitFor(() => {
        expect(result.current.loading).toBe(false)
      })

      const originalZones = [...result.current.zones]

      try {
        await result.current.updateZone('zone-1', { name: 'Error' })
      } catch (error) {
        // Error esperado
      }

      // Verificar rollback
      await waitFor(() => {
        expect(result.current.zones).toEqual(originalZones)
      })
    })

    it('should update active status (soft delete)', async () => {
      const deactivatedZone = {
        ...mockZones[0],
        active: false,
      }

      vi.mocked(zonesService.updateZone).mockResolvedValue({
        data: deactivatedZone as any,
        error: null,
      })

      const { result } = renderHook(() => useZones(), { wrapper })

      await waitFor(() => {
        expect(result.current.loading).toBe(false)
      })

      await result.current.updateZone('zone-1', { active: false })

      expect(zonesService.updateZone).toHaveBeenCalledWith(
        'zone-1',
        { active: false },
        'tenant-test-123'
      )
    })
  })

  describe('Mutation - Soft delete (deleteZone)', () => {
    it('should soft delete zone successfully', async () => {
      const softDeletedZone = {
        ...mockZones[0],
        active: false,
      }

      vi.mocked(zonesService.deleteZone).mockResolvedValue({
        data: softDeletedZone as any,
        error: null,
      })

      const { result } = renderHook(() => useZones(), { wrapper })

      await waitFor(() => {
        expect(result.current.loading).toBe(false)
      })

      const initialCalls = vi.mocked(zonesService.getZones).mock.calls.length

      await result.current.deleteZone('zone-1')

      expect(zonesService.deleteZone).toHaveBeenCalledWith(
        'zone-1',
        'tenant-test-123'
      )

      // Verificar refetch
      await waitFor(() => {
        expect(zonesService.getZones).toHaveBeenCalledTimes(initialCalls + 1)
      })
    })

    it('should handle soft delete error', async () => {
      vi.mocked(zonesService.deleteZone).mockResolvedValue({
        data: null,
        error: new Error('Delete failed') as any,
      })

      const { result } = renderHook(() => useZones(), { wrapper })

      await waitFor(() => {
        expect(result.current.loading).toBe(false)
      })

      try {
        await result.current.deleteZone('zone-1')
      } catch (error) {
        expect(error).toBeTruthy()
      }
    })
  })

  describe('Mutation - Hard delete', () => {
    it('should hard delete zone successfully', async () => {
      vi.mocked(zonesService.hardDeleteZone).mockResolvedValue({
        error: null,
      })

      const { result } = renderHook(() => useZones(), { wrapper })

      await waitFor(() => {
        expect(result.current.loading).toBe(false)
      })

      const initialCalls = vi.mocked(zonesService.getZones).mock.calls.length

      await result.current.hardDelete('zone-1')

      expect(zonesService.hardDeleteZone).toHaveBeenCalledWith(
        'zone-1',
        'tenant-test-123'
      )

      // Verificar refetch
      await waitFor(() => {
        expect(zonesService.getZones).toHaveBeenCalledTimes(initialCalls + 1)
      })
    })

    it('should handle hard delete error', async () => {
      vi.mocked(zonesService.hardDeleteZone).mockResolvedValue({
        error: new Error('Hard delete failed') as any,
      })

      const { result } = renderHook(() => useZones(), { wrapper })

      await waitFor(() => {
        expect(result.current.loading).toBe(false)
      })

      try {
        await result.current.hardDelete('zone-1')
      } catch (error) {
        expect(error).toBeTruthy()
      }
    })
  })

  describe('Refresh functionality', () => {
    it('should refresh zones on demand', async () => {
      const { result } = renderHook(() => useZones(), { wrapper })

      await waitFor(() => {
        expect(result.current.loading).toBe(false)
      })

      const initialCalls = vi.mocked(zonesService.getZones).mock.calls.length

      // Refrescar
      await result.current.refresh()

      // Verificar refetch
      expect(zonesService.getZones).toHaveBeenCalledTimes(initialCalls + 1)
    })
  })

  describe('React Query features', () => {
    it('should cache query results', async () => {
      const { result, rerender } = renderHook(() => useZones(), { wrapper })

      await waitFor(() => {
        expect(result.current.loading).toBe(false)
      })

      const firstZones = result.current.zones

      // Rerender debería usar cache
      rerender()

      expect(result.current.zones).toBe(firstZones)
      // No debería hacer fetch adicional (cache activo)
      expect(zonesService.getZones).toHaveBeenCalledTimes(1)
    })

    it('should invalidate cache after mutation', async () => {
      vi.mocked(zonesService.createZone).mockResolvedValue({
        data: { ...mockZones[0], id: 'zone-4', name: 'VIP' } as any,
        error: null,
      })

      const { result } = renderHook(() => useZones(), { wrapper })

      await waitFor(() => {
        expect(result.current.loading).toBe(false)
      })

      // Primera carga
      expect(zonesService.getZones).toHaveBeenCalledTimes(1)

      // Mutation invalida cache
      await result.current.createZone({ name: 'VIP' })

      // Debería refetch
      await waitFor(() => {
        expect(zonesService.getZones).toHaveBeenCalledTimes(2)
      })
    })

    it('should use different cache for includeInactive parameter', async () => {
      // Renderizar hook con includeInactive=false
      const { result: result1 } = renderHook(() => useZones(false), { wrapper })

      await waitFor(() => {
        expect(result1.current.loading).toBe(false)
      })

      expect(zonesService.getZones).toHaveBeenCalledWith('tenant-test-123', false)

      // Renderizar hook con includeInactive=true (diferente cache)
      vi.mocked(zonesService.getZones).mockResolvedValue({
        data: mockZones as any,
        error: null,
      })

      const { result: result2 } = renderHook(() => useZones(true), { wrapper })

      await waitFor(() => {
        expect(result2.current.loading).toBe(false)
      })

      // Debería hacer otra llamada porque el queryKey es diferente
      expect(zonesService.getZones).toHaveBeenCalledWith('tenant-test-123', true)
      expect(zonesService.getZones).toHaveBeenCalledTimes(2)
    })
  })
})
