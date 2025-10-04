import { EventEmitter } from "node:events"

import type { SocketEnvelope, SocketEventName, SocketEventPayload } from "@/lib/socket-events"

const MAX_HISTORY_PER_EVENT = 50

function assertServerOnly() {
  if (typeof window !== "undefined") {
    throw new Error("socket-bus must not be imported on the client")
  }
}

type EnvelopeListener<TEvent extends SocketEventName> = (message: SocketEnvelope<TEvent>) => void

declare global {
  // eslint-disable-next-line no-var
  var __SOCKET_BUS__:
    | {
        bus: SocketBus
      }
    | undefined
}

export class SocketBus {
  private emitter = new EventEmitter()
  private history = new Map<SocketEventName, SocketEnvelope[]>()

  subscribe<TEvent extends SocketEventName>(event: TEvent, listener: EnvelopeListener<TEvent>) {
    const handler = (message: SocketEnvelope<TEvent>) => listener(message)
    this.emitter.on(event, handler)

    return () => {
      this.emitter.off(event, handler)
    }
  }

  unsubscribe<TEvent extends SocketEventName>(event: TEvent, listener: EnvelopeListener<TEvent>) {
    this.emitter.off(event, listener as unknown as (...args: unknown[]) => void)
  }

  publish<TEvent extends SocketEventName>(event: TEvent, payload: SocketEventPayload<TEvent>): SocketEnvelope<TEvent> {
    const envelope: SocketEnvelope<TEvent> = {
      event,
      payload,
      ts: new Date().toISOString(),
    }

    const queue = this.history.get(event) ?? []
    queue.push(envelope)
    while (queue.length > MAX_HISTORY_PER_EVENT) {
      queue.shift()
    }
    this.history.set(event, queue)

    this.emitter.emit(event, envelope)

    return envelope
  }

  getHistory<TEvent extends SocketEventName>(event: TEvent): SocketEnvelope<TEvent>[] {
    const queue = this.history.get(event)
    return queue ? queue.map((entry) => ({ ...entry })) : []
  }

  drainAllHistory(): SocketEnvelope[] {
    const snapshots: SocketEnvelope[] = []

    for (const [, entries] of this.history) {
      for (const entry of entries) {
        snapshots.push({ ...entry })
      }
    }

    return snapshots.sort((a, b) => a.ts.localeCompare(b.ts))
  }
}

export function getSocketBus(): SocketBus {
  assertServerOnly()

  if (!globalThis.__SOCKET_BUS__) {
    globalThis.__SOCKET_BUS__ = {
      bus: new SocketBus(),
    }
  }

  return globalThis.__SOCKET_BUS__.bus
}
