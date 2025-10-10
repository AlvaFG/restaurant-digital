"use client"

import {
  MOCK_ALERTS,
  MOCK_ORDERS,
  MOCK_TABLES,
  MOCK_TABLE_LAYOUT,
} from "@/lib/mock-data"
import type {
  SocketEnvelope,
  SocketEventName,
  SocketEventPayload,
  SocketReadyPayload,
  SerializedAlert,
  SerializedOrder,
  SerializedOrdersSummary,
  SerializedTable,
  SerializedTableLayout,
} from "@/lib/socket-events"

export type { SocketEnvelope, SocketEventName, SocketEventPayload, SocketReadyPayload } from "@/lib/socket-events"

const MAX_BACKOFF_MS = 30_000
const BASE_BACKOFF_MS = 1_500

const ORDER_STATUSES: SerializedOrder["status"][] = ["abierto", "preparando", "listo", "entregado", "cerrado"]
const PAYMENT_STATUSES: SerializedOrder["paymentStatus"][] = ["pendiente", "pagado", "cancelado"]

function nowIso() {
  return new Date().toISOString()
}

function cloneLayout(): SerializedTableLayout {
  return {
    zones: MOCK_TABLE_LAYOUT.zones.map((zone) => ({ ...zone })),
    nodes: MOCK_TABLE_LAYOUT.nodes.map((node) => ({ ...node })),
  }
}

function serializeAlert(alert: (typeof MOCK_ALERTS)[number]): SerializedAlert {
  return {
    id: alert.id,
    tableId: alert.tableId,
    type: alert.type,
    message: alert.message,
    createdAt: alert.createdAt instanceof Date ? alert.createdAt.toISOString() : new Date(alert.createdAt).toISOString(),
    acknowledged: Boolean(alert.acknowledged),
  }
}

function serializeTable(table: (typeof MOCK_TABLES)[number]): SerializedTable {
  return {
    id: table.id,
    number: table.number,
    status: table.status,
    zone: table.zone,
    seats: table.seats,
    qrcodeUrl: table.qrcodeUrl,
    covers: {
      current: table.covers.current,
      total: table.covers.total,
      sessions: table.covers.sessions,
      lastUpdatedAt: table.covers.lastUpdatedAt,
      lastSessionAt: table.covers.lastSessionAt,
    },
  }
}



function buildMockSummary(): SerializedOrdersSummary {
  const summary: SerializedOrdersSummary = {
    total: 0,
    byStatus: Object.fromEntries(ORDER_STATUSES.map((status) => [status, 0])) as SerializedOrdersSummary["byStatus"],
    byPaymentStatus: Object.fromEntries(PAYMENT_STATUSES.map((status) => [status, 0])) as SerializedOrdersSummary["byPaymentStatus"],
    oldestOrderAt: null,
    latestOrderAt: null,
    pendingPayment: 0,
  }

  for (const order of MOCK_ORDERS) {
    summary.total += 1
    summary.byStatus[order.status] = (summary.byStatus[order.status] ?? 0) + 1
    summary.byPaymentStatus[order.paymentStatus] = (summary.byPaymentStatus[order.paymentStatus] ?? 0) + 1

    if (order.paymentStatus === "pendiente") {
      summary.pendingPayment += 1
    }

    const createdAt = order.createdAt instanceof Date ? order.createdAt : new Date(order.createdAt)
    const iso = createdAt.toISOString()
    if (!summary.oldestOrderAt || iso < summary.oldestOrderAt) {
      summary.oldestOrderAt = iso
    }
    if (!summary.latestOrderAt || iso > summary.latestOrderAt) {
      summary.latestOrderAt = iso
    }
  }

  return summary
}

function buildMockTables() {
  return MOCK_TABLES.map((table) => serializeTable(table))
}

function buildMockCoverTotals(tables: SerializedTable[]) {
  return tables.reduce(
    (totals, table) => {
      totals.current += table.covers.current
      totals.total += table.covers.total
      totals.sessions += table.covers.sessions
      return totals
    },
    { current: 0, total: 0, sessions: 0 },
  )
}

function buildMockReadyPayload(): SocketReadyPayload {
  const tables = buildMockTables()
  return {
    connectionId: "mock-connection",
    issuedAt: nowIso(),
    orders: {
      metadata: {
        version: 0,
        updatedAt: nowIso(),
      },
      summary: buildMockSummary(),
    },
    tables: {
      metadata: {
        version: 0,
        updatedAt: nowIso(),
        coverTotals: buildMockCoverTotals(tables),
      },
      layout: cloneLayout(),
      tables,
    },
    alerts: {
      active: MOCK_ALERTS.map((alert) => serializeAlert(alert)),
    },
  }
}

export interface SocketConnectionState {
  isReady: boolean
  isConnected: boolean
  isReconnecting: boolean
  connectionId: string | null
  lastReadyAt: string | null
  lastHeartbeatAt: string | null
  error?: string
}

export type SocketEventHandler<TEvent extends SocketEventName> = (
  payload: SocketEventPayload<TEvent>,
  envelope?: SocketEnvelope<TEvent>,
) => void

export interface SocketClientInstance {
  connect(): void
  disconnect(): void
  on<TEvent extends SocketEventName>(event: TEvent, handler: SocketEventHandler<TEvent>): void
  off<TEvent extends SocketEventName>(event: TEvent, handler: SocketEventHandler<TEvent>): void
  emit<TEvent extends SocketEventName>(event: TEvent, payload: SocketEventPayload<TEvent>): void
  readonly isConnected: boolean
  getLastReady(): SocketReadyPayload | null
  getState(): SocketConnectionState
  subscribeState(listener: (state: SocketConnectionState) => void): () => void
}

type ListenerMap = Map<SocketEventName, Set<SocketEventHandler<SocketEventName>>>

type OptionalWebSocket = WebSocket | null

type ReconnectOptions = {
  baseDelay?: number
  maxDelay?: number
}

declare global {
  interface Window {
    __restaurantSocketClient__?: SocketClientInstance
  }
}

class RealtimeSocketClient implements SocketClientInstance {
  private listeners: ListenerMap = new Map()
  private socket: OptionalWebSocket = null
  private reconnectTimer: ReturnType<typeof setTimeout> | null = null
  private manualClose = false
  private attempts = 0
  private outbox: SocketEnvelope[] = []
  private lastReadyPayload: SocketReadyPayload | null = null
  private lastHeartbeatAt: string | null = null
  private state: SocketConnectionState = {
    isReady: false,
    isConnected: false,
    isReconnecting: false,
    connectionId: null,
    lastReadyAt: null,
    lastHeartbeatAt: null,
  }
  private stateListeners = new Set<(state: SocketConnectionState) => void>()

  constructor(private readonly options: ReconnectOptions = {}) {}

  get isConnected() {
    return this.state.isConnected
  }

  getLastReady() {
    return this.lastReadyPayload
  }

  getState() {
    return { ...this.state }
  }

  subscribeState(listener: (state: SocketConnectionState) => void) {
    this.stateListeners.add(listener)
    return () => {
      this.stateListeners.delete(listener)
    }
  }

  connect() {
    if (typeof window === "undefined" || typeof window.WebSocket === "undefined") {
      return
    }

    if (this.socket && (this.socket.readyState === WebSocket.OPEN || this.socket.readyState === WebSocket.CONNECTING)) {
      return
    }

    this.manualClose = false
    this.createSocket()
  }

  disconnect() {
    this.manualClose = true
    this.clearReconnectTimer()

    if (this.socket) {
      try {
        this.socket.removeEventListener("open", this.handleOpen)
        this.socket.removeEventListener("message", this.handleMessage)
        this.socket.removeEventListener("close", this.handleClose)
        this.socket.removeEventListener("error", this.handleError)
        this.socket.close(1000, "client disconnect")
      } catch (error) {
        console.error("[socket-client] Failed to close socket", error)
      }
    }

    this.socket = null
    this.updateState({ isConnected: false, isReady: false, isReconnecting: false })
  }

  on<TEvent extends SocketEventName>(event: TEvent, handler: SocketEventHandler<TEvent>) {
    const listeners = this.listeners.get(event) ?? new Set()
    listeners.add(handler as SocketEventHandler<SocketEventName>)
    this.listeners.set(event, listeners)
  }

  off<TEvent extends SocketEventName>(event: TEvent, handler: SocketEventHandler<TEvent>) {
    const listeners = this.listeners.get(event)
    if (!listeners) {
      return
    }
    listeners.delete(handler as SocketEventHandler<SocketEventName>)
    if (listeners.size === 0) {
      this.listeners.delete(event)
    }
  }

  emit<TEvent extends SocketEventName>(event: TEvent, payload: SocketEventPayload<TEvent>) {
    const envelope: SocketEnvelope<TEvent> = {
      event,
      payload,
      ts: nowIso(),
    }

    if (this.socket && this.socket.readyState === WebSocket.OPEN) {
      try {
        this.socket.send(JSON.stringify(envelope))
      } catch (error) {
        console.error("[socket-client] Failed to send message", error)
      }
    } else {
      this.outbox.push(envelope)
    }
  }

  private buildUrl() {
    const basePath = "/api/socket"
    if (typeof window === "undefined") {
      return basePath
    }

    const protocol = window.location.protocol === "https:" ? "wss:" : "ws:"
    return protocol + "//" + window.location.host + basePath
  }

  private createSocket() {
    try {
      const url = this.buildUrl()
      this.socket = new WebSocket(url)
      this.socket.addEventListener("open", this.handleOpen)
      this.socket.addEventListener("message", this.handleMessage)
      this.socket.addEventListener("close", this.handleClose)
      this.socket.addEventListener("error", this.handleError)
      this.updateState({ isReconnecting: this.attempts > 0 })
    } catch (error) {
      console.error("[socket-client] Failed to create WebSocket", error)
      this.scheduleReconnect()
    }
  }

  private handleOpen = () => {
    this.clearReconnectTimer()
    this.attempts = 0
    this.updateState({ isConnected: true, isReconnecting: false })
    this.flushOutbox()
  }

  private handleMessage = (event: MessageEvent) => {
    if (typeof event.data !== "string") {
      return
    }

    let envelope: SocketEnvelope
    try {
      envelope = JSON.parse(event.data) as SocketEnvelope
    } catch (error) {
      console.error("[socket-client] Failed to parse message", error)
      return
    }

    if (!envelope || typeof envelope.event !== "string") {
      return
    }

    if (envelope.event === "socket.ready") {
      this.lastReadyPayload = envelope.payload as SocketReadyPayload
      this.updateState({
        isReady: true,
        isConnected: true,
        isReconnecting: false,
        connectionId: this.lastReadyPayload.connectionId,
        lastReadyAt: envelope.ts ?? nowIso(),
        error: undefined,
      })
    }

    if (envelope.event === "socket.heartbeat") {
      this.lastHeartbeatAt = envelope.ts ?? nowIso()
      this.updateState({ lastHeartbeatAt: this.lastHeartbeatAt })
    }

    this.notify(envelope)
  }

  private handleClose = (event: CloseEvent) => {
    this.socket = null
    this.updateState({ isConnected: false, isReady: false })

    if (this.manualClose) {
      return
    }

    if (event.code !== 1000) {
      this.updateState({ error: event.reason || "Socket closed unexpectedly" })
    }

    this.scheduleReconnect()
  }

  private handleError = (event: Event) => {
    console.error("[socket-client] socket error", event)
    this.updateState({ error: "Socket error" })
  }

  private flushOutbox() {
    if (!this.socket || this.socket.readyState !== WebSocket.OPEN) {
      return
    }

    while (this.outbox.length > 0) {
      const message = this.outbox.shift()
      if (!message) {
        continue
      }
      try {
        this.socket.send(JSON.stringify(message))
      } catch (error) {
        console.error("[socket-client] Failed to flush message", error)
        this.outbox.unshift(message)
        break
      }
    }
  }

  private scheduleReconnect() {
    if (this.manualClose) {
      return
    }

    this.attempts += 1
    const delay = Math.min(
      this.options.maxDelay ?? MAX_BACKOFF_MS,
      (this.options.baseDelay ?? BASE_BACKOFF_MS) * Math.pow(2, this.attempts - 1),
    )

    this.updateState({ isReconnecting: true })

    this.reconnectTimer = setTimeout(() => {
      this.createSocket()
    }, delay)
  }

  private clearReconnectTimer() {
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer)
      this.reconnectTimer = null
    }
  }

  private notify(envelope: SocketEnvelope) {
    const listeners = this.listeners.get(envelope.event as SocketEventName)
    if (!listeners || listeners.size === 0) {
      return
    }

    for (const listener of listeners) {
      try {
        listener(envelope.payload as never, envelope as never)
      } catch (error) {
        console.error("[socket-client] listener failed", error)
      }
    }
  }

  private updateState(patch: Partial<SocketConnectionState>) {
    this.state = { ...this.state, ...patch }
    for (const listener of this.stateListeners) {
      listener({ ...this.state })
    }
  }
}

class MockSocketClient implements SocketClientInstance {
  private listeners: ListenerMap = new Map()
  private readyPayload: SocketReadyPayload | null = null
  private state: SocketConnectionState = {
    isReady: false,
    isConnected: false,
    isReconnecting: false,
    connectionId: null,
    lastReadyAt: null,
    lastHeartbeatAt: null,
  }
  private stateListeners = new Set<(state: SocketConnectionState) => void>()

  get isConnected() {
    return this.state.isConnected
  }

  getLastReady() {
    return this.readyPayload
  }

  getState() {
    return { ...this.state }
  }

  subscribeState(listener: (state: SocketConnectionState) => void) {
    this.stateListeners.add(listener)
    return () => this.stateListeners.delete(listener)
  }

  connect() {
    if (this.state.isConnected) {
      return
    }

    this.readyPayload = buildMockReadyPayload()
    this.state = {
      isReady: true,
      isConnected: true,
      isReconnecting: false,
      connectionId: this.readyPayload.connectionId,
      lastReadyAt: this.readyPayload.issuedAt,
      lastHeartbeatAt: nowIso(),
    }

    // Notify listeners immediately in mock mode
    const readyEnvelope: SocketEnvelope = {
      event: "socket.ready",
      payload: this.readyPayload,
      ts: this.readyPayload.issuedAt,
    }

    const summaryEnvelope: SocketEnvelope = {
      event: "order.summary.updated",
      payload: {
        summary: this.readyPayload.orders?.summary ?? buildMockSummary(),
        metadata: this.readyPayload.orders?.metadata ?? { version: 0, updatedAt: nowIso() },
      },
      ts: nowIso(),
    }

    // Use setTimeout to ensure listeners are registered before notifying
    setTimeout(() => {
      this.broadcastState()
      this.notify(readyEnvelope)
      this.notify(summaryEnvelope)
    }, 0)
  }

  disconnect() {
    if (!this.state.isConnected) {
      return
    }
    this.state = {
      ...this.state,
      isConnected: false,
      isReady: false,
    }
    this.broadcastState()
  }

  on<TEvent extends SocketEventName>(event: TEvent, handler: SocketEventHandler<TEvent>) {
    const listeners = this.listeners.get(event) ?? new Set()
    listeners.add(handler as SocketEventHandler<SocketEventName>)
    this.listeners.set(event, listeners)
  }

  off<TEvent extends SocketEventName>(event: TEvent, handler: SocketEventHandler<TEvent>) {
    const listeners = this.listeners.get(event)
    if (!listeners) {
      return
    }
    listeners.delete(handler as SocketEventHandler<SocketEventName>)
    if (listeners.size === 0) {
      this.listeners.delete(event)
    }
  }

  emit<TEvent extends SocketEventName>(event: TEvent, payload: SocketEventPayload<TEvent>) {
    const envelope: SocketEnvelope<TEvent> = {
      event,
      payload,
      ts: nowIso(),
    }
    this.notify(envelope)
  }

  private notify(envelope: SocketEnvelope) {
    const listeners = this.listeners.get(envelope.event as SocketEventName)
    if (!listeners) {
      return
    }

    for (const listener of listeners) {
      try {
        listener(envelope.payload as never, envelope as never)
      } catch (error) {
        console.error("[socket-mock] listener failed", error)
      }
    }
  }

  private broadcastState() {
    for (const listener of this.stateListeners) {
      listener({ ...this.state })
    }
  }
}

const shouldDisableRealtime =
  typeof process !== "undefined" && process.env.NEXT_PUBLIC_DISABLE_SOCKET === "1"

function instantiateClient(): SocketClientInstance {
  if (shouldDisableRealtime || typeof window === "undefined" || typeof window.WebSocket === "undefined") {
    return new MockSocketClient()
  }
  return new RealtimeSocketClient()
}

const client: SocketClientInstance =
  typeof window !== "undefined"
    ? (window.__restaurantSocketClient__ ?? (window.__restaurantSocketClient__ = instantiateClient()))
    : instantiateClient()

export const socketClient: SocketClientInstance = client
