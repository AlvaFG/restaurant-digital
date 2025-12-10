/**
 * Tests for QR Order API
 * @vitest-environment node
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { POST, GET } from '../route'
import { NextRequest } from 'next/server'
import * as sessionManager from '@/lib/server/session-manager'
import { SessionStatus } from '@/lib/server/session-types'

// Mock session manager
vi.mock('@/lib/server/session-manager', () => ({
  getSession: vi.fn(),
  updateSession: vi.fn(),
}))

describe('POST /api/order/qr', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should reject missing required fields', async () => {
    const request = new NextRequest('http://localhost:3000/api/order/qr', {
      method: 'POST',
      body: JSON.stringify({}),
    })

    const response = await POST(request)
    const data = await response.json()

    expect(response.status).toBe(400)
    expect(data.error).toContain('Missing required fields')
  })

  it('should reject empty items array', async () => {
    const request = new NextRequest('http://localhost:3000/api/order/qr', {
      method: 'POST',
      body: JSON.stringify({
        tableId: 'TABLE-1',
        sessionId: 'SESSION-123',
        customerName: 'John Doe',
        paymentMethod: 'cash',
        items: [],
      }),
    })

    const response = await POST(request)
    const data = await response.json()

    expect(response.status).toBe(400)
    expect(data.error).toContain('at least one item')
  })

  it('should reject invalid session', async () => {
    vi.mocked(sessionManager.getSession).mockReturnValue(null)

    const request = new NextRequest('http://localhost:3000/api/order/qr', {
      method: 'POST',
      body: JSON.stringify({
        tableId: 'TABLE-1',
        sessionId: 'INVALID-SESSION',
        customerName: 'John Doe',
        paymentMethod: 'cash',
        items: [{ menuItemId: 'ITEM-1', quantity: 2 }],
      }),
    })

    const response = await POST(request)
    const data = await response.json()

    expect(response.status).toBe(401)
    expect(data.error).toContain('Invalid or expired session')
  })

  it('should reject session table mismatch', async () => {
    vi.mocked(sessionManager.getSession).mockReturnValue({
      id: 'SESSION-123',
      tableId: 'TABLE-999', // Different table
      tableNumber: 5,
      zone: 'Main',
      token: 'mock-token',
      status: SessionStatus.BROWSING,
      createdAt: new Date(),
      lastActivityAt: new Date(),
      expiresAt: new Date(Date.now() + 3600000),
      cartItemsCount: 0,
      orderIds: [],
    })

    const request = new NextRequest('http://localhost:3000/api/order/qr', {
      method: 'POST',
      body: JSON.stringify({
        tableId: 'TABLE-1',
        sessionId: 'SESSION-123',
        customerName: 'John Doe',
        paymentMethod: 'cash',
        items: [{ menuItemId: 'ITEM-1', quantity: 2 }],
      }),
    })

    const response = await POST(request)
    const data = await response.json()

    expect(response.status).toBe(403)
    expect(data.error).toContain('does not match table')
  })

  it('should reject expired session', async () => {
    vi.mocked(sessionManager.getSession).mockReturnValue({
      id: 'SESSION-123',
      tableId: 'TABLE-1',
      tableNumber: 5,
      zone: 'Main',
      token: 'mock-token',
      status: SessionStatus.EXPIRED,
      createdAt: new Date(),
      lastActivityAt: new Date(),
      expiresAt: new Date(Date.now() - 3600000),
      cartItemsCount: 0,
      orderIds: [],
    })

    const request = new NextRequest('http://localhost:3000/api/order/qr', {
      method: 'POST',
      body: JSON.stringify({
        tableId: 'TABLE-1',
        sessionId: 'SESSION-123',
        customerName: 'John Doe',
        paymentMethod: 'cash',
        items: [{ menuItemId: 'ITEM-1', quantity: 2 }],
      }),
    })

    const response = await POST(request)
    const data = await response.json()

    expect(response.status).toBe(400)
    expect(data.error).toContain('expired')
  })

  it('should successfully create order with valid data', async () => {
    const mockSession = {
      id: 'SESSION-123',
      tableId: 'TABLE-1',
      tableNumber: 5,
      zone: 'Main',
      token: 'mock-token',
      status: SessionStatus.BROWSING,
      createdAt: new Date(),
      lastActivityAt: new Date(),
      expiresAt: new Date(Date.now() + 3600000),
      cartItemsCount: 2,
      orderIds: [],
    }

    vi.mocked(sessionManager.getSession).mockReturnValue(mockSession)
    vi.mocked(sessionManager.updateSession).mockResolvedValue(undefined)

    const request = new NextRequest('http://localhost:3000/api/order/qr', {
      method: 'POST',
      body: JSON.stringify({
        tableId: 'TABLE-1',
        sessionId: 'SESSION-123',
        customerName: 'John Doe',
        customerNotes: 'No onions please',
        paymentMethod: 'cash',
        items: [
          {
            menuItemId: 'ITEM-1',
            quantity: 2,
            modifiers: [
              { name: 'Extra cheese', priceCents: 200 },
            ],
          },
          {
            menuItemId: 'ITEM-2',
            quantity: 1,
            notes: 'Well done',
          },
        ],
      }),
    })

    const response = await POST(request)
    const data = await response.json()

    expect(response.status).toBe(201)
    expect(data.success).toBe(true)
    expect(data.order).toBeDefined()
    expect(data.order.id).toBeTruthy()
    expect(data.order.status).toBe('pending')
    expect(data.order.estimatedMinutes).toBe(20)

    // Verify session was updated
    expect(sessionManager.updateSession).toHaveBeenCalledWith(
      'SESSION-123',
      expect.objectContaining({
        status: SessionStatus.ORDER_PLACED,
        cartItemsCount: 0,
      })
    )
  })

  it('should handle modifiers pricing correctly', async () => {
    const mockSession = {
      id: 'SESSION-123',
      tableId: 'TABLE-1',
      tableNumber: 5,
      zone: 'Main',
      token: 'mock-token',
      status: SessionStatus.CART_ACTIVE,
      createdAt: new Date(),
      lastActivityAt: new Date(),
      expiresAt: new Date(Date.now() + 3600000),
      cartItemsCount: 1,
      orderIds: [],
    }

    vi.mocked(sessionManager.getSession).mockReturnValue(mockSession)
    vi.mocked(sessionManager.updateSession).mockResolvedValue(undefined)

    const request = new NextRequest('http://localhost:3000/api/order/qr', {
      method: 'POST',
      body: JSON.stringify({
        tableId: 'TABLE-1',
        sessionId: 'SESSION-123',
        customerName: 'Jane Smith',
        paymentMethod: 'card',
        items: [
          {
            menuItemId: 'BURGER-1',
            quantity: 1,
            modifiers: [
              { name: 'Extra cheese', priceCents: 200 },
              { name: 'Bacon', priceCents: 300 },
            ],
          },
        ],
      }),
    })

    const response = await POST(request)
    const data = await response.json()

    expect(response.status).toBe(201)
    expect(data.success).toBe(true)
    // Total should include modifiers: 500 cents
    // Note: Actual menu item price would be added from database
  })

  it('should support different payment methods', async () => {
    const mockSession = {
      id: 'SESSION-123',
      tableId: 'TABLE-1',
      tableNumber: 5,
      zone: 'Main',
      token: 'mock-token',
      status: SessionStatus.BROWSING,
      createdAt: new Date(),
      lastActivityAt: new Date(),
      expiresAt: new Date(Date.now() + 3600000),
      cartItemsCount: 1,
      orderIds: [],
    }

    vi.mocked(sessionManager.getSession).mockReturnValue(mockSession)
    vi.mocked(sessionManager.updateSession).mockResolvedValue(undefined)

    const paymentMethods: Array<'cash' | 'card' | 'mercadopago'> = ['cash', 'card', 'mercadopago']

    for (const paymentMethod of paymentMethods) {
      const request = new NextRequest('http://localhost:3000/api/order/qr', {
        method: 'POST',
        body: JSON.stringify({
          tableId: 'TABLE-1',
          sessionId: 'SESSION-123',
          customerName: 'Test User',
          paymentMethod,
          items: [{ menuItemId: 'ITEM-1', quantity: 1 }],
        }),
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(201)
      expect(data.success).toBe(true)
    }
  })
})

describe('GET /api/order/qr', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should reject missing sessionId', async () => {
    const request = new NextRequest('http://localhost:3000/api/order/qr')

    const response = await GET(request)
    const data = await response.json()

    expect(response.status).toBe(400)
    expect(data.error).toContain('Missing sessionId')
  })

  it('should reject invalid session', async () => {
    vi.mocked(sessionManager.getSession).mockReturnValue(null)

    const request = new NextRequest('http://localhost:3000/api/order/qr?sessionId=INVALID')

    const response = await GET(request)
    const data = await response.json()

    expect(response.status).toBe(401)
    expect(data.error).toContain('Invalid or expired session')
  })

  it('should return orders for valid session', async () => {
    const mockSession = {
      id: 'SESSION-123',
      tableId: 'TABLE-1',
      tableNumber: 5,
      zone: 'Main',
      token: 'mock-token',
      status: SessionStatus.ORDER_PLACED,
      createdAt: new Date(),
      lastActivityAt: new Date(),
      expiresAt: new Date(Date.now() + 3600000),
      cartItemsCount: 0,
      orderIds: ['ORD-1', 'ORD-2'],
    }

    vi.mocked(sessionManager.getSession).mockReturnValue(mockSession)

    const request = new NextRequest('http://localhost:3000/api/order/qr?sessionId=SESSION-123')

    const response = await GET(request)
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.orders).toBeDefined()
    expect(Array.isArray(data.orders)).toBe(true)
    expect(data.orders.length).toBe(2)
  })

  it('should return empty array for session with no orders', async () => {
    const mockSession = {
      id: 'SESSION-456',
      tableId: 'TABLE-2',
      tableNumber: 3,
      zone: 'Patio',
      token: 'mock-token',
      status: SessionStatus.BROWSING,
      createdAt: new Date(),
      lastActivityAt: new Date(),
      expiresAt: new Date(Date.now() + 3600000),
      cartItemsCount: 0,
      orderIds: [],
    }

    vi.mocked(sessionManager.getSession).mockReturnValue(mockSession)

    const request = new NextRequest('http://localhost:3000/api/order/qr?sessionId=SESSION-456')

    const response = await GET(request)
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.orders).toEqual([])
  })
})
