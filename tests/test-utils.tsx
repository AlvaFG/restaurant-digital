/**
 * Test Utilities
 * Wrappers y helpers para testing con React Testing Library
 */

import React, { ReactElement } from 'react'
import { render, RenderOptions } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { AuthProvider } from '@/contexts/auth-context'
import { vi } from 'vitest'

// Mock para AuthContext
const mockAuthContextValue = {
  user: {
    id: 'test-user-id',
    email: 'test@example.com',
    tenant_id: 'tenant-test-123',
    role: 'admin',
    name: 'Test User',
    active: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  session: {
    access_token: 'mock-token',
    refresh_token: 'mock-refresh',
    expires_at: Date.now() + 3600000,
    user: {
      id: 'test-user-id',
      email: 'test@example.com',
    },
  },
  loading: false,
  login: async () => {},
  logout: async () => {},
  updateProfile: async () => {},
}

// Create a custom QueryClient for tests
export function createTestQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
        gcTime: 0, // Updated from cacheTime in React Query v5
      },
      mutations: {
        retry: false,
      },
    },
  })
}

// Wrapper with all providers
interface AllProvidersProps {
  children: React.ReactNode
  queryClient?: QueryClient
}

export function AllProviders({ children, queryClient }: AllProvidersProps) {
  const client = queryClient || createTestQueryClient()

  return (
    <QueryClientProvider client={client}>
      <AuthProvider>
        {children}
      </AuthProvider>
    </QueryClientProvider>
  )
}

// Custom render function
interface CustomRenderOptions extends Omit<RenderOptions, 'wrapper'> {
  queryClient?: QueryClient
}

export function renderWithProviders(
  ui: ReactElement,
  options?: CustomRenderOptions
) {
  const { queryClient, ...renderOptions } = options || {}

  const Wrapper = ({ children }: { children: React.ReactNode }) => (
    <AllProviders queryClient={queryClient}>
      {children}
    </AllProviders>
  )

  return render(ui, { wrapper: Wrapper, ...renderOptions })
}

// Mock for useAuth hook
export function mockUseAuth(overrides = {}) {
  return {
    ...mockAuthContextValue,
    ...overrides,
  }
}

// Wait for async operations
export const waitForAsync = () => new Promise(resolve => setTimeout(resolve, 0))

// Mock Supabase client
export function createMockSupabaseClient() {
  return {
    from: (table: string) => ({
      select: () => ({
        eq: () => ({
          eq: () => ({
            order: () => Promise.resolve({ data: [], error: null }),
            single: () => Promise.resolve({ data: null, error: null }),
          }),
          order: () => Promise.resolve({ data: [], error: null }),
          single: () => Promise.resolve({ data: null, error: null }),
        }),
        order: () => Promise.resolve({ data: [], error: null }),
        single: () => Promise.resolve({ data: null, error: null }),
      }),
      insert: () => ({
        select: () => ({
          single: () => Promise.resolve({ data: null, error: null }),
        }),
      }),
      update: () => ({
        eq: () => ({
          eq: () => ({
            select: () => ({
              single: () => Promise.resolve({ data: null, error: null }),
            }),
          }),
        }),
      }),
      delete: () => ({
        eq: () => ({
          eq: () => Promise.resolve({ error: null }),
        }),
      }),
    }),
    auth: {
      getSession: () => Promise.resolve({ data: { session: null }, error: null }),
      getUser: () => Promise.resolve({ data: { user: null }, error: null }),
      signInWithPassword: () => Promise.resolve({ data: null, error: null }),
      signOut: () => Promise.resolve({ error: null }),
    },
  }
}

// Re-export everything from testing library
export * from '@testing-library/react'

/**
 * Mock fetch with baseURL support for API routes
 * Useful for hooks that call internal APIs like /api/zones
 * @param baseURL - Base URL for relative paths (default: http://localhost:3000)
 */
export function mockFetchAPI(baseURL = 'http://localhost:3000') {
  const mockFetch = vi.fn((input: RequestInfo | URL, init?: RequestInit) => {
    let url = typeof input === 'string' ? input : input instanceof URL ? input.href : input.url
    
    // If URL is relative, prepend baseURL
    if (url.startsWith('/')) {
      url = `${baseURL}${url}`
    }
    
    // Return a mock Response
    return Promise.resolve({
      ok: true,
      status: 200,
      statusText: 'OK',
      headers: new Headers(),
      json: async () => ({ data: [], error: null }),
      text: async () => JSON.stringify({ data: [], error: null }),
      blob: async () => new Blob(),
      arrayBuffer: async () => new ArrayBuffer(0),
      formData: async () => new FormData(),
      clone: function() { return this },
    } as Response)
  })
  
  global.fetch = mockFetch as any
  
  return mockFetch
}
