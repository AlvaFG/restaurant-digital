/**
 * Testing Utilities for React Query Hooks
 * 
 * Provides helpers for testing hooks that use React Query
 */

import { ReactNode } from 'react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { renderHook, waitFor } from '@testing-library/react'
import { vi } from 'vitest'

/**
 * Creates a new QueryClient with testing-friendly defaults
 */
export function createTestQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        retry: false, // Disable retries in tests
        gcTime: 0, // Disable cache time
        staleTime: 0, // Always consider data stale
      },
      mutations: {
        retry: false,
      },
    },
  })
}

/**
 * Wrapper component that provides QueryClient
 */
export function createWrapper(queryClient?: QueryClient) {
  const client = queryClient || createTestQueryClient()
  
  return function Wrapper({ children }: { children: ReactNode }) {
    return (
      <QueryClientProvider client={client}>
        {children}
      </QueryClientProvider>
    )
  }
}

/**
 * Renders a hook with QueryClientProvider wrapper
 */
export function renderHookWithQuery<TResult, TProps>(
  hook: (props: TProps) => TResult,
  options?: {
    queryClient?: QueryClient
    initialProps?: TProps
  }
) {
  const queryClient = options?.queryClient || createTestQueryClient()
  
  return {
    ...renderHook(hook, {
      wrapper: createWrapper(queryClient),
      initialProps: options?.initialProps,
    }),
    queryClient,
  }
}

/**
 * Waits for a query to finish loading
 */
export async function waitForQueryToSettle() {
  await waitFor(() => {}, { timeout: 1000 })
}

/**
 * Mock AuthContext for testing
 */
export const mockAuthContext = {
  user: {
    id: 'user-1',
    email: 'test@test.com',
  },
  tenant: {
    id: 'tenant-1',
    name: 'Test Restaurant',
  },
  loading: false,
  signIn: vi.fn(),
  signOut: vi.fn(),
  signUp: vi.fn(),
}

/**
 * Mock Supabase client for testing
 */
export const mockSupabaseClient = {
  from: (table: string) => ({
    select: vi.fn().mockReturnThis(),
    insert: vi.fn().mockReturnThis(),
    update: vi.fn().mockReturnThis(),
    delete: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    single: vi.fn(),
    maybeSingle: vi.fn(),
  }),
  auth: {
    getUser: vi.fn(),
    signInWithPassword: vi.fn(),
    signOut: vi.fn(),
  },
  rpc: vi.fn(),
}

/**
 * Mock fetch for API calls
 */
export function mockFetch(response: any, options?: { ok?: boolean; status?: number }) {
  global.fetch = vi.fn(() =>
    Promise.resolve({
      ok: options?.ok ?? true,
      status: options?.status ?? 200,
      json: () => Promise.resolve(response),
    } as Response)
  ) as any
}

/**
 * Mock successful API response
 */
export function mockSuccessResponse(data: any) {
  mockFetch(data, { ok: true, status: 200 })
}

/**
 * Mock error API response
 */
export function mockErrorResponse(error: string, status = 500) {
  mockFetch({ error }, { ok: false, status })
}

/**
 * Clean up after tests
 */
export function cleanupTests(queryClient: QueryClient) {
  queryClient.clear()
  vi.clearAllMocks()
}
