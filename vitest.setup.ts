import "@testing-library/jest-dom/vitest"
import { vi } from 'vitest'

// Load test environment variables
if (typeof process !== 'undefined') {
  process.env.NEXT_PUBLIC_SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || 'http://localhost:54321'
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0'
}

// Mock global fetch for tests
global.fetch = vi.fn()

// Mock Next.js server APIs (cookies, headers)
vi.mock('next/headers', () => ({
  cookies: vi.fn(() => ({
    get: vi.fn((name: string) => ({ 
      name, 
      value: name === 'session' ? 'mock-session-token' : 'mock-value' 
    })),
    set: vi.fn(),
    delete: vi.fn(),
    getAll: vi.fn(() => []),
    has: vi.fn(() => true),
  })),
  headers: vi.fn(() => ({
    get: vi.fn((name: string) => {
      if (name === 'x-tenant-id') return 'tenant-test-123'
      if (name === 'user-agent') return 'test-agent'
      return null
    }),
    getAll: vi.fn(() => []),
    has: vi.fn(() => true),
    keys: vi.fn(() => []),
    values: vi.fn(() => []),
    entries: vi.fn(() => []),
  })),
}))

if (typeof Element !== "undefined") {
  Element.prototype.hasPointerCapture ||= () => false
  Element.prototype.setPointerCapture ||= () => {}
  Element.prototype.releasePointerCapture ||= () => {}
  Element.prototype.scrollIntoView ||= () => {}
}

if (typeof window !== "undefined") {
  window.HTMLElement.prototype.hasPointerCapture ||= () => false
  window.HTMLElement.prototype.setPointerCapture ||= () => {}
  window.HTMLElement.prototype.releasePointerCapture ||= () => {}
  window.HTMLElement.prototype.scrollIntoView ||= () => {}

  if (typeof window.ResizeObserver === "undefined") {
    window.ResizeObserver = class {
      observe() {}
      unobserve() {}
      disconnect() {}
    }
  }
}

