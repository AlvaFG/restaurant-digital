"use client"

import type { Alert, Order, Table, TableMapLayout } from "@/lib/mock-data"

import { TABLE_STATE_CODES } from "./table-states"
export type SocketEvents = {
  "alert.created": {
    type: Alert["type"]
    tableId: Alert["tableId"]
    message: Alert["message"]
  }
  "alert.updated": {
    alertId: Alert["id"]
    acknowledged: boolean
  }
  "alert.acknowledged": {
    alertId: Alert["id"]
    acknowledged: boolean
  }
  "table.updated": {
    tableId: Table["id"]
    status: Table["status"]
  }
  "table.layout.updated": {
    layout: TableMapLayout
    timestamp: string
  }
  "order.updated": {
    orderId: Order["id"]
    status: Order["status"]
  }
}

export type SocketEventName = keyof SocketEvents
export type SocketEventPayload<TEvent extends SocketEventName> = SocketEvents[TEvent]
export type SocketEventHandler<TEvent extends SocketEventName> = (
  payload: SocketEventPayload<TEvent>,
) => void

export class MockSocketClient {
  private listeners: Partial<{ [K in SocketEventName]: Array<SocketEventHandler<K>> }> = {}
  private connected = false
  private intervalId: ReturnType<typeof setInterval> | null = null

  connect() {
    if (this.connected) return
    this.connected = true
    console.log("[v0] Mock Socket connected")
    this.startMockUpdates()
  }

  disconnect() {
    if (!this.connected) return
    this.connected = false
    console.log("[v0] Mock Socket disconnected")
    if (this.intervalId) {
      clearInterval(this.intervalId)
      this.intervalId = null
    }
  }

  on<TEvent extends SocketEventName>(event: TEvent, callback: SocketEventHandler<TEvent>) {
    const listeners = (this.listeners[event] as Array<SocketEventHandler<TEvent>> | undefined) ?? []
    listeners.push(callback)
    this.listeners[event] = listeners
  }

  off<TEvent extends SocketEventName>(event: TEvent, callback: SocketEventHandler<TEvent>) {
    const listeners = this.listeners[event]
    if (!listeners) return

    const remaining = (listeners as Array<SocketEventHandler<TEvent>>).filter((listener) => listener !== callback)

    if (remaining.length > 0) {
      this.listeners[event] = remaining as Array<SocketEventHandler<TEvent>>
    } else {
      delete this.listeners[event]
    }
  }

  emit<TEvent extends SocketEventName>(event: TEvent, payload: SocketEventPayload<TEvent>) {
    console.log(`[v0] Emitting ${event}:`, payload)
    this.notify(event, payload)
  }

  private notify<TEvent extends SocketEventName>(event: TEvent, payload: SocketEventPayload<TEvent>) {
    const listeners = this.listeners[event] as Array<SocketEventHandler<TEvent>> | undefined
    listeners?.forEach((listener) => listener(payload))
  }

  private startMockUpdates() {
    if (this.intervalId) return

    const tableIds: Table["id"][] = ["1", "2", "3", "4"]
    const tableStatuses: Table["status"][] = [...TABLE_STATE_CODES]
    const alertTypes: Alert["type"][] = ["llamar_mozo", "pedido_entrante", "quiere_pagar_efectivo", "pago_aprobado"]
    const orderStatuses: Order["status"][] = ["abierto", "preparando", "listo", "entregado", "cerrado"]

    this.intervalId = setInterval(() => {
      if (!this.connected) return

      const events: SocketEventName[] = ["table.updated", "order.updated", "alert.created"]
      const event = events[Math.floor(Math.random() * events.length)]

      switch (event) {
        case "table.updated": {
          this.notify(event, {
            tableId: tableIds[Math.floor(Math.random() * tableIds.length)],
            status: tableStatuses[Math.floor(Math.random() * tableStatuses.length)],
          })
          break
        }
        case "order.updated": {
          this.notify(event, {
            orderId: `order-${Math.floor(Math.random() * 10) + 1}`,
            status: orderStatuses[Math.floor(Math.random() * orderStatuses.length)],
          })
          break
        }
        case "alert.created": {
          this.notify(event, {
            tableId: tableIds[Math.floor(Math.random() * tableIds.length)],
            type: alertTypes[Math.floor(Math.random() * alertTypes.length)],
            message: "Actualizacion simulada de alertas",
          })
          break
        }
      }
    }, 30000)
  }
}

export const socketClient = new MockSocketClient()
