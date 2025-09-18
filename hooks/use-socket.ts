"use client"

import { useCallback, useEffect, useRef } from "react"
import {
  socketClient,
  type SocketEventHandler,
  type SocketEventName,
  type SocketEventPayload,
} from "@/lib/socket"

export function useSocket() {
  const isConnected = useRef(false)

  useEffect(() => {
    if (!isConnected.current) {
      socketClient.connect()
      isConnected.current = true
    }

    return () => {
      if (isConnected.current) {
        socketClient.disconnect()
        isConnected.current = false
      }
    }
  }, [])

  const on = useCallback(<TEvent extends SocketEventName>(event: TEvent, handler: SocketEventHandler<TEvent>) => {
    socketClient.on(event, handler)
  }, [])

  const off = useCallback(<TEvent extends SocketEventName>(event: TEvent, handler: SocketEventHandler<TEvent>) => {
    socketClient.off(event, handler)
  }, [])

  const emit = useCallback(<TEvent extends SocketEventName>(event: TEvent, payload: SocketEventPayload<TEvent>) => {
    socketClient.emit(event, payload)
  }, [])

  return {
    socket: socketClient,
    on,
    off,
    emit,
  }
}
