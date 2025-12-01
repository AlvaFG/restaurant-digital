import { randomUUID } from "node:crypto"

import type { NextRequest } from "next/server"

import { AlertService, type Alert } from "@/lib/mock-data"
import { getCurrentUser } from '@/lib/supabase/server'
import { getOrders } from '@/lib/services/orders-service'
import { getTables } from '@/lib/services/tables-service'
import { getSocketBus } from "@/lib/server/socket-bus"
import { buildHeartbeatPayload, buildReadyPayload } from "@/lib/server/socket-payloads"
import type { SocketEnvelope, SocketEventName } from "@/lib/socket-events"
import { createLogger } from "@/lib/logger"

const logger = createLogger("socket")

export const runtime = "nodejs"

const HEARTBEAT_INTERVAL_MS = 25_000

function getTenantIdFromUser(user: { user_metadata?: { tenant_id?: string } }) {
  return user.user_metadata?.tenant_id || null
}

function assertWebSocketSupport() {
  if (typeof (globalThis as unknown as { WebSocketPair?: unknown }).WebSocketPair === "undefined") {
    throw new Error("WebSocketPair API is not available in this runtime")
  }
}

async function buildReadySnapshot(connectionId: string, tenantId: string) {
  const [orders, tables, alerts] = await Promise.all([
    getOrders(tenantId).catch((error: Error) => {
      logger.error("Failed to obtain orders", error, { connectionId, tenantId })
      return { data: null, error }
    }),
    getTables(tenantId).catch((error: Error) => {
      logger.error("Failed to list tables", error, { connectionId, tenantId })
      return { data: null, error }
    }),
    AlertService.getActiveAlerts().catch((error: Error) => {
      logger.error("Failed to fetch alerts", error, { connectionId, tenantId })
      return []
    }),
  ])

  // Construir summary de órdenes
  const ordersList = orders.data || []
  const ordersSummary = ordersList.length > 0 ? {
    total: ordersList.length,
    byStatus: ordersList.reduce((acc: Record<string, number>, order: any) => {
      acc[order.status] = (acc[order.status] || 0) + 1
      return acc
    }, {} as Record<string, number>),
    byPaymentStatus: ordersList.reduce((acc: Record<string, number>, order: any) => {
      acc[order.payment_status] = (acc[order.payment_status] || 0) + 1
      return acc
    }, {} as Record<string, number>),
    oldestOrderAt: ordersList[0]?.created_at || null,
    latestOrderAt: ordersList[ordersList.length - 1]?.created_at || null,
    pendingPayment: ordersList.filter((o: any) => o.payment_status === 'pending').length,
  } : null

  // Construir metadata de mesas
  const tablesList = tables.data || []
  const coverTotals = tablesList.reduce((acc: { current: number; total: number; sessions: number }, table: any) => {
    const covers = (table.metadata as { covers?: { current?: number } })?.covers?.current || 0
    return {
      current: acc.current + covers,
      total: acc.total + covers,
      sessions: acc.sessions + (covers > 0 ? 1 : 0),
    }
  }, { current: 0, total: 0, sessions: 0 })

  const tableMetadata = {
    version: 1,
    updatedAt: new Date().toISOString(),
    coverTotals,
  }

  return buildReadyPayload({
    connectionId,
    orders: ordersSummary
      ? {
          metadata: {
            version: 1,
            updatedAt: new Date().toISOString(),
          },
          summary: ordersSummary,
        }
      : undefined,
    tables: tableMetadata
      ? {
          metadata: tableMetadata,
          layout: undefined, // TODO: Implementar getTableLayout en tables-service
          tables: tablesList as any[], // Cast temporal - los tipos son compatibles
        }
      : undefined,
    alerts: {
      active: alerts,
    },
  })
}


function wireIncomingMessages(socket: WebSocket, connectionId: string) {
  socket.addEventListener("message", (event) => {
    if (typeof event.data !== "string") {
      return
    }

    try {
      const envelope = JSON.parse(event.data) as SocketEnvelope | null
      if (!envelope || typeof envelope.event !== "string") {
        return
      }

      switch (envelope.event as SocketEventName) {
        case "alert.acknowledged": {
          const alertId = envelope.payload && (envelope.payload as { alertId?: string }).alertId
          if (alertId) {
            void AlertService.acknowledgeAlert(alertId)
          }
          break
        }
        case "alert.created": {
          if (
            envelope.payload &&
            typeof (envelope.payload as { tableId?: string }).tableId === "string" &&
            typeof (envelope.payload as { type?: string }).type === "string" &&
            typeof (envelope.payload as { message?: string }).message === "string"
          ) {
            const payload = envelope.payload as unknown as { tableId: string; type: string; message: string }
            void AlertService.createAlert(payload.tableId, payload.type as Alert["type"], payload.message)
          }
          break
        }
        default:
          break
      }
    } catch (error) {
      logger.error("Failed to process incoming message", error instanceof Error ? error : new Error(String(error)), { connectionId })
    }
  })
}

function attachBusBridge(socket: WebSocket, connectionId: string) {
  const bus = getSocketBus()
  const releases: Array<() => void> = []

  const forward = (message: SocketEnvelope) => {
    if (socket.readyState === socket.OPEN) {
      socket.send(JSON.stringify(message))
    }
  }

  for (const eventName of [
    "alert.created",
    "alert.updated",
    "alert.acknowledged",
    "order.created",
    "order.updated",
    "order.summary.updated",
    "table.updated",
    "table.layout.updated",
  ] as SocketEventName[]) {
    const release = bus.subscribe(eventName, (message) => forward(message as SocketEnvelope))
    releases.push(release)
  }

  const history = bus.drainAllHistory()
  if (history.length > 0 && socket.readyState === socket.OPEN) {
    for (const item of history) {
      socket.send(JSON.stringify(item))
    }
  }

  const heartbeatTimer = setInterval(() => {
    if (socket.readyState !== socket.OPEN) {
      return
    }
    const heartbeat = {
      event: "socket.heartbeat",
      payload: buildHeartbeatPayload(connectionId),
      ts: new Date().toISOString(),
    }
    socket.send(JSON.stringify(heartbeat))
  }, HEARTBEAT_INTERVAL_MS)

  const cleanup = () => {
    clearInterval(heartbeatTimer)
    for (const release of releases) {
      try {
        release()
      } catch (error) {
        logger.error("Failed to release listener", error instanceof Error ? error : new Error(String(error)), { connectionId })
      }
    }
  }

  socket.addEventListener("close", cleanup)
  socket.addEventListener("error", cleanup)

  return cleanup
}

export async function GET(request: NextRequest) {
  // Validar autenticación y obtener tenant
  const user = await getCurrentUser()
  if (!user) {
    return new Response("Unauthorized", { status: 401 })
  }

  const tenantId = getTenantIdFromUser(user)
  if (!tenantId) {
    return new Response("Forbidden: No tenant assigned", { status: 403 })
  }

  // Verificar si es upgrade a WebSocket
  if (request.headers.get("upgrade")?.toLowerCase() !== "websocket") {
    return new Response("Expected websocket upgrade", { status: 426 })
  }

  try {
    assertWebSocketSupport()
  } catch (error) {
    logger.error("WebSocket support assertion failed", error instanceof Error ? error : new Error(String(error)))
    return new Response("WebSockets not supported in this runtime", { status: 501 })
  }

  // Get WebSocketPair from global (available in edge runtime)
  const WebSocketPairConstructor = (globalThis as any).WebSocketPair as {
    new (): WebSocketPair
  } | undefined
  
  if (!WebSocketPairConstructor) {
    return new Response("WebSockets not available", { status: 501 })
  }

  const pair = new WebSocketPairConstructor()
  const client = pair[0]
  const server = pair[1]
  const connectionId = randomUUID()

  // Accept the server-side WebSocket connection
  server.accept()

  try {
    const readyPayload = await buildReadySnapshot(connectionId, tenantId)
    const readyEnvelope: SocketEnvelope = {
      event: "socket.ready",
      payload: readyPayload,
      ts: new Date().toISOString(),
    }

    server.send(JSON.stringify(readyEnvelope))
  } catch (error) {
    logger.error("Failed to push ready payload", error instanceof Error ? error : new Error(String(error)), { connectionId, tenantId })
    server.close(1011, "Failed to initialize connection")
    return new Response("Failed to initialize socket", { status: 500 })
  }

  attachBusBridge(server, connectionId)
  wireIncomingMessages(server, connectionId)

  server.addEventListener("close", (event: any) => {
    if (!event.wasClean) {
      logger.warn("Connection closed unexpectedly", { connectionId, tenantId, code: event.code, reason: event.reason })
    }
  })

  server.addEventListener("error", (error: any) => {
    logger.error("Connection error", error instanceof Error ? error : new Error(String(error)), { connectionId, tenantId })
    try {
      server.close(1011, "Internal socket error")
    } catch (closeError) {
      logger.error("Unable to close socket after error", closeError instanceof Error ? closeError : new Error(String(closeError)))
    }
  })

  // Return WebSocket upgrade response (edge runtime specific)
  return new Response(null, {
    status: 101,
    webSocket: client,
  } as ResponseInit & { webSocket: WebSocket })
}
