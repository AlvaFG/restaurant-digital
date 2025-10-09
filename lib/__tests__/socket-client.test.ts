import { afterEach, beforeAll, describe, expect, it, vi } from "vitest"

import { socketClient } from "@/lib/socket"

describe("socketClient (mock fallback)", () => {
  beforeAll(() => {
    // Ensure we use the mock implementation
    process.env.NEXT_PUBLIC_DISABLE_SOCKET = "1"
  })

  afterEach(() => {
    socketClient.disconnect()
  })

  it("connects immediately with the mock implementation", () => {
    const readyHandler = vi.fn()
    socketClient.on("socket.ready", readyHandler)

    socketClient.connect()

    expect(socketClient.isConnected).toBe(true)
    const state = socketClient.getState()
    expect(state.isReady).toBe(true)
    expect(readyHandler).toHaveBeenCalledTimes(1)

    socketClient.off("socket.ready", readyHandler)
  })

  it("dispatches emitted events to listeners", () => {
    const createdHandler = vi.fn()
    socketClient.on("alert.created", createdHandler)

    socketClient.emit("alert.created", {
      alert: {
        id: "alert-1",
        tableId: "T1",
        type: "llamar_mozo",
        message: "Mesa T1",
        createdAt: "2025-10-03T10:00:00Z",
        acknowledged: false,
      },
    })

    expect(createdHandler).toHaveBeenCalledTimes(1)

    socketClient.off("alert.created", createdHandler)
  })
})
