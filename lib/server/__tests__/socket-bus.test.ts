import { describe, expect, it, vi } from "vitest"

import { SocketBus } from "@/lib/server/socket-bus"
import type { OrderEventPayload } from "@/lib/socket-events"

function createOrderPayload(version: number): OrderEventPayload {
  return {
    order: {
      id: "order-1",
      tableId: "T1",
      status: "abierto",
      paymentStatus: "pendiente",
      subtotal: 1000,
      total: 1210,
      discountTotalCents: 0,
      taxTotalCents: 210,
      tipCents: 0,
      serviceChargeCents: 0,
      createdAt: "2025-10-03T10:00:00Z",
      updatedAt: "2025-10-03T10:00:00Z",
      items: [
        { id: "item-1", name: "Milanesa", quantity: 1, price: 1000, totalCents: 1000 },
      ],
      discounts: [],
      taxes: [],
    },
    metadata: {
      version,
      updatedAt: "2025-10-03T10:00:00Z",
    },
  }
}

describe("SocketBus", () => {
  it("publishes to subscribers and stores history", () => {
    const bus = new SocketBus()
    const handler = vi.fn()

    const unsubscribe = bus.subscribe("order.updated", handler)
    const payload = createOrderPayload(1)
    const envelope = bus.publish("order.updated", payload)

    expect(handler).toHaveBeenCalledTimes(1)
    expect(handler).toHaveBeenCalledWith(envelope)

    const history = bus.getHistory("order.updated")
    expect(history).toHaveLength(1)
    expect(history[0]).toEqual(envelope)

    unsubscribe()
    bus.publish("order.updated", createOrderPayload(2))
    expect(handler).toHaveBeenCalledTimes(1)
  })

  it("limits history to 50 envelopes per event", () => {
    const bus = new SocketBus()

    for (let index = 0; index < 60; index += 1) {
      bus.publish("order.updated", createOrderPayload(index))
    }

    const history = bus.getHistory("order.updated")
    expect(history).toHaveLength(50)
    expect(history[0].payload.metadata.version).toBe(10)
    expect(history[49].payload.metadata.version).toBe(59)

    const drained = bus.drainAllHistory()
    expect(drained).toHaveLength(50)
    expect(drained[0].event).toBe("order.updated")
  })
})
