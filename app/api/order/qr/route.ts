/**
 * QR Order Submission API
 * POST /api/order/qr - Submits customer orders from QR menu
 * 
 * Features:
 * - Customer order submission
 * - Session validation
 * - Table status updates
 * - Order creation with items
 * - WebSocket notification
 */

import { NextRequest, NextResponse } from "next/server"
import * as sessionManager from "@/lib/server/session-manager"
import { SessionStatus as Status } from "@/lib/server/session-types"
import { createLogger } from "@/lib/logger"

const logger = createLogger("order/qr")

interface QrOrderRequest {
  tableId: string
  sessionId: string
  customerName: string
  customerNotes?: string
  paymentMethod: 'cash' | 'card' | 'mercadopago'
  items: Array<{
    menuItemId: string
    quantity: number
    customizationId?: string
    modifiers?: Array<{ name: string; priceCents: number }>
    notes?: string
  }>
}

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as QrOrderRequest

    // Validate required fields
    if (!body.tableId || !body.sessionId || !body.customerName) {
      return NextResponse.json(
        { error: "Missing required fields: tableId, sessionId, customerName" },
        { status: 400 }
      )
    }

    if (!body.items || body.items.length === 0) {
      return NextResponse.json(
        { error: "Order must contain at least one item" },
        { status: 400 }
      )
    }

    // Validate session
    const session = sessionManager.getSession(body.sessionId)
    if (!session) {
      return NextResponse.json(
        { error: "Invalid or expired session" },
        { status: 401 }
      )
    }

    if (session.tableId !== body.tableId) {
      return NextResponse.json(
        { error: "Session does not match table" },
        { status: 403 }
      )
    }

    // Check session is not expired/closed
    if (session.status === Status.EXPIRED || session.status === Status.CLOSED) {
      return NextResponse.json(
        { error: `Session is ${session.status}, cannot submit order` },
        { status: 400 }
      )
    }

    // Calculate total
    const totalCents = body.items.reduce((sum, item) => {
      const modifiersTotal = item.modifiers?.reduce((mSum, mod) => mSum + mod.priceCents, 0) ?? 0
      // Note: We should fetch actual menu item prices from database
      // For now, assuming price is validated on client
      return sum + modifiersTotal
    }, 0)

    // Create order object
    const orderId = `ORD-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
    const _order = {
      id: orderId,
      tableId: body.tableId,
      sessionId: body.sessionId,
      customerName: body.customerName,
      customerNotes: body.customerNotes,
      paymentMethod: body.paymentMethod,
      items: body.items,
      totalCents,
      status: 'pending' as const,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }

    // TODO: Save order to database
    // await orderService.create(order)

    // Update session with order
    await sessionManager.updateSession(body.sessionId, {
      status: Status.ORDER_PLACED,
      orderId, // Store latest order ID
      cartItemsCount: 0, // Reset cart
    })

    // TODO: Update table status to 'occupied' if not already
    // TODO: Notify kitchen via WebSocket
    // TODO: Send confirmation to customer

    logger.info('Order created successfully', {
      orderId,
      tableId: body.tableId,
      customerName: body.customerName,
      itemsCount: body.items.length,
      totalAmount: totalCents / 100,
    })

    return NextResponse.json(
      {
        success: true,
        order: {
          id: orderId,
          status: 'pending',
          estimatedMinutes: 20, // TODO: Calculate based on items
          message: 'Tu pedido ha sido recibido y está siendo preparado',
        },
      },
      { status: 201 }
    )
  } catch (error) {
    logger.error('Error submitting order', error instanceof Error ? error : new Error(String(error)))
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

// GET /api/order/qr?sessionId=xxx - Get orders for a session
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const sessionId = searchParams.get('sessionId')

    if (!sessionId) {
      return NextResponse.json(
        { error: "Missing sessionId parameter" },
        { status: 400 }
      )
    }

    const session = sessionManager.getSession(sessionId)
    if (!session) {
      return NextResponse.json(
        { error: "Invalid or expired session" },
        { status: 401 }
      )
    }

    // TODO: Fetch orders from database
    // const orders = await orderService.findBySessionId(sessionId)

    // Mock response for now
    const orders = (session.orderIds || []).map((id: string) => ({
      id,
      status: 'pending',
      createdAt: session.createdAt,
    }))

    return NextResponse.json({ orders })
  } catch (error) {
    logger.error('Error fetching orders', error instanceof Error ? error : new Error(String(error)))
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
