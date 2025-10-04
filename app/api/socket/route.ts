import { randomUUID } from "node:crypto"

import type { NextRequest } from "next/server"

import { AlertService, type Alert } from "@/lib/mock-data"
import { getOrdersSummary, getOrderStoreMetadata } from "@/lib/server/order-store"
import { getSocketBus } from "@/lib/server/socket-bus"
import { buildHeartbeatPayload, buildReadyPayload } from "@/lib/server/socket-payloads"
import { getStoreMetadata as getTableStoreMetadata, getTableLayout, listTables } from "@/lib/server/table-store"
import type { SocketEnvelope, SocketEventName } from "@/lib/socket-events"

export const runtime = "nodejs"

const HEARTBEAT_INTERVAL_MS = 25_000

function assertWebSocketSupport() {
  if (typeof (globalThis as unknown as { WebSocketPair?: unknown }).WebSocketPair === "undefined") {
    throw new Error("WebSocketPair API is not available in this runtime")
  }
}

async function buildReadySnapshot(connectionId: string) {
  const [ordersMetadata, ordersSummary, tableMetadata, tables, layout, alerts] = await Promise.all([
    getOrderStoreMetadata().catch((error) => {
      console.error("[socket] Failed to obtain order metadata", error)
      return { version: 0, updatedAt: new Date(0).toISOString() }
    }),
    getOrdersSummary().catch((error) => {
      console.error("[socket] Failed to obtain orders summary", error)
      return null
    }),
    getTableStoreMetadata().catch((error) => {
      console.error("[socket] Failed to obtain table metadata", error)
      return {
        version: 0,
        updatedAt: new Date(0).toISOString(),
        coverTotals: { current: 0, total: 0, sessions: 0 },
      }
    }),
    listTables().catch((error) => {
      console.error("[socket] Failed to list tables", error)
      return []
    }),
    getTableLayout().catch((error) => {
      console.error("[socket] Failed to get table layout", error)
      return null
    }),
    AlertService.getActiveAlerts().catch((error) => {
      console.error("[socket] Failed to fetch alerts", error)
      return []
    }),
  ])

  return buildReadyPayload({
    connectionId,
    orders: ordersSummary
      ? {
          metadata: ordersMetadata,
          summary: ordersSummary,
        }
      : undefined,
    tables: tableMetadata
      ? {
          metadata: tableMetadata,
          layout: layout ?? undefined,
          tables,
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
            const payload = envelope.payload as { tableId: string; type: string; message: string }
            void AlertService.createAlert(payload.tableId, payload.type as Alert["type"], payload.message)
          }
          break
        }
        default:
          break
      }
    } catch (error) {
      console.error("[socket] Failed to process incoming message", error, { connectionId })
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
        console.error("[socket] Failed to release listener", error, { connectionId })
      }
    }
  }

  socket.addEventListener("close", cleanup)
  socket.addEventListener("error", cleanup)

  return cleanup
}

export async function GET(request: NextRequest) {
  if (request.headers.get("upgrade")?.toLowerCase() !== "websocket") {
    return new Response("Expected websocket upgrade", { status: 426 })
  }

  try {
    assertWebSocketSupport()
  } catch (error) {
    console.error("[socket]", error)
    return new Response("WebSockets not supported in this runtime", { status: 501 })
  }

  const { WebSocketPair } = globalThis as unknown as { WebSocketPair: typeof import("undici").WebSocketPair }
  const { 0: client, 1: server } = new WebSocketPair()
  const connectionId = randomUUID()

  server.accept()

  try {
    const readyPayload = await buildReadySnapshot(connectionId)
    const readyEnvelope: SocketEnvelope = {
      event: "socket.ready",
      payload: readyPayload,
      ts: new Date().toISOString(),
    }

    server.send(JSON.stringify(readyEnvelope))
  } catch (error) {
    console.error("[socket] Failed to push ready payload", error, { connectionId })
    server.close(1011, "Failed to initialize connection")
    return new Response("Failed to initialize socket", { status: 500 })
  }

  attachBusBridge(server, connectionId)
  wireIncomingMessages(server, connectionId)

  server.addEventListener("close", (event) => {
    if (!event.wasClean) {
      console.warn("[socket] connection closed unexpectedly", { connectionId, code: event.code, reason: event.reason })
    }
  })

  server.addEventListener("error", (error) => {
    console.error("[socket] connection error", error, { connectionId })
    try {
      server.close(1011, "Internal socket error")
    } catch (closeError) {
      console.error("[socket] unable to close socket after error", closeError)
    }
  })

  return new Response(null, {
    status: 101,
    webSocket: client,
  })
}
