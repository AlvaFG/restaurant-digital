// lib/__tests__/supabase-connection.test.ts
import { describe, it, expect } from 'vitest'

describe('Supabase Connection', () => {
  it('should connect to Supabase successfully', async () => {
    // This test assumes the dev server is running, as it makes a fetch request to an API route.
    // We need to provide the full URL
    const response = await fetch('http://localhost:3000/api/test-supabase')
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.success).toBe(true)
  })
})
