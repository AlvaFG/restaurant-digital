"use client"

import { useCallback, useEffect, useRef, useState } from "react"

import {
  socketClient,
  type SocketConnectionState,
  type SocketEventHandler,
  type SocketEventName,
  type SocketEventPayload,
  type SocketReadyPayload,
} from "@/lib/socket"

let activeSubscribers = 0

export function useSocket() {
  const [state, setState] = useState<SocketConnectionState>(() => socketClient.getState())
  const lastReadyRef = useRef<SocketReadyPayload | null>(socketClient.getLastReady())

  useEffect(() => {
    if (typeof window === "undefined") {
      return
    }

    activeSubscribers += 1
    socketClient.connect()

    const unsubscribeState = socketClient.subscribeState((next) => {
      setState(next)
    })

    const handleReady: SocketEventHandler<"socket.ready"> = (payload) => {
      lastReadyRef.current = payload
    }

    socketClient.on("socket.ready", handleReady)

    return () => {
      socketClient.off("socket.ready", handleReady)
      unsubscribeState()

      activeSubscribers = Math.max(0, activeSubscribers - 1)
      if (activeSubscribers === 0) {
        socketClient.disconnect()
      }
    }
  }, [])

  const on = useCallback(
    <TEvent extends SocketEventName>(event: TEvent, handler: SocketEventHandler<TEvent>) => {
      socketClient.on(event, handler)
    },
    [],
  )

  const off = useCallback(
    <TEvent extends SocketEventName>(event: TEvent, handler: SocketEventHandler<TEvent>) => {
      socketClient.off(event, handler)
    },
    [],
  )

  const emit = useCallback(
    <TEvent extends SocketEventName>(event: TEvent, payload: SocketEventPayload<TEvent>) => {
      socketClient.emit(event, payload)
    },
    [],
  )

  return {
    socket: socketClient,
    on,
    off,
    emit,
    state,
    isConnected: state.isConnected,
    isReady: state.isReady,
    isReconnecting: state.isReconnecting,
    connectionId: state.connectionId,
    lastHeartbeatAt: state.lastHeartbeatAt,
    lastReadyPayload: lastReadyRef.current,
  }
}
