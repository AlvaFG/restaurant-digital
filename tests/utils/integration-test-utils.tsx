/**
 * Integration Test Utilities
 * 
 * Utilities for testing multi-hook and component interactions
 */

import { ReactNode } from 'react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render, RenderOptions } from '@testing-library/react'
import { AuthProvider } from '@/contexts/auth-context'
import { vi } from 'vitest'

/**
 * Create a QueryClient for testing with proper configuration
 */
export function createIntegrationTestQueryClient(): QueryClient {
  return new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
        gcTime: 0,
        staleTime: 0,
      },
      mutations: {
        retry: false,
      },
    },
  })
}

/**
 * Mock authenticated user for integration tests
 */
export const mockAuthUser = {
  id: 'user-test-123',
  email: 'test@restaurant.com',
  name: 'Test User',
  role: 'admin' as const,
  active: true,
  tenant_id: 'tenant-test-123',
  created_at: '2025-01-01T00:00:00Z',
  updated_at: '2025-01-01T00:00:00Z',
}

/**
 * Mock tenant for integration tests
 */
export const mockAuthTenant = {
  id: 'tenant-test-123',
  name: 'Test Restaurant',
  slug: 'test-restaurant',
  theme: {
    accentColor: '#3b82f6',
  },
  features: {
    tablets: true,
    kds: true,
    payments: true,
  },
  created_at: '2025-01-01T00:00:00Z',
  updated_at: '2025-01-01T00:00:00Z',
}

/**
 * Create wrapper with all necessary providers for integration tests
 */
export function createIntegrationWrapper(queryClient?: QueryClient) {
  const client = queryClient || createIntegrationTestQueryClient()

  return function Wrapper({ children }: { children: ReactNode }) {
    return (
      <QueryClientProvider client={client}>
        {children}
      </QueryClientProvider>
    )
  }
}

/**
 * Render with all providers for integration tests
 */
export function renderWithProviders(
  ui: React.ReactElement,
  options?: Omit<RenderOptions, 'wrapper'>
) {
  const queryClient = createIntegrationTestQueryClient()

  return {
    ...render(ui, {
      wrapper: createIntegrationWrapper(queryClient),
      ...options,
    }),
    queryClient,
  }
}

/**
 * Wait for all pending React Query operations to complete
 */
export async function waitForQueryClient(queryClient: QueryClient) {
  await queryClient.cancelQueries()
  await queryClient.refetchQueries()
}

/**
 * Helper to create mock data factories
 */
export const mockDataFactory = {
  table: (overrides = {}) => ({
    id: `table-${Math.random().toString(36).substr(2, 9)}`,
    tenant_id: 'tenant-test-123',
    zone_id: 'zone-test-1',
    number: Math.floor(Math.random() * 100),
    seats: 4,
    status: 'available' as const,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    ...overrides,
  }),

  zone: (overrides = {}) => ({
    id: `zone-${Math.random().toString(36).substr(2, 9)}`,
    tenant_id: 'tenant-test-123',
    name: `Zone ${Math.floor(Math.random() * 10)}`,
    description: 'Test zone',
    capacity: 20,
    active: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    ...overrides,
  }),

  order: (overrides = {}) => ({
    id: `order-${Math.random().toString(36).substr(2, 9)}`,
    tenant_id: 'tenant-test-123',
    table_id: 'table-test-1',
    status: 'pending' as const,
    payment_status: 'pending' as const,
    source: 'staff' as const,
    total_cents: 1000,
    items: [],
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    ...overrides,
  }),

  menuItem: (overrides = {}) => ({
    id: `item-${Math.random().toString(36).substr(2, 9)}`,
    tenant_id: 'tenant-test-123',
    category_id: 'category-test-1',
    name: 'Test Item',
    description: 'Test description',
    price_cents: 500,
    available: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    ...overrides,
  }),

  alert: (overrides = {}) => ({
    id: `alert-${Math.random().toString(36).substr(2, 9)}`,
    tenant_id: 'tenant-test-123',
    table_id: 'table-test-1',
    type: 'llamar_mozo' as const,
    message: 'Test alert',
    acknowledged: false,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    ...overrides,
  }),
}

/**
 * Helper to mock Supabase responses
 */
export function createMockSupabaseResponse<T>(data: T, error: Error | null = null) {
  return {
    data,
    error,
    count: null,
    status: error ? 400 : 200,
    statusText: error ? 'Bad Request' : 'OK',
  }
}

/**
 * Helper to create delayed promise for testing race conditions
 */
export function delayedPromise<T>(value: T, delay: number = 100): Promise<T> {
  return new Promise((resolve) => setTimeout(() => resolve(value), delay))
}

/**
 * Mock service call with realistic delay
 */
export function mockServiceCall<T>(
  data: T,
  delay: number = 50,
  shouldFail: boolean = false
): Promise<{ data: T | null; error: Error | null }> {
  return new Promise((resolve) => {
    setTimeout(() => {
      if (shouldFail) {
        resolve({ data: null, error: new Error('Service call failed') })
      } else {
        resolve({ data, error: null })
      }
    }, delay)
  })
}
