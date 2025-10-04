# Realtime Sockets

## Endpoint
- WebSocket: GET /api/socket
- Runtime: Node.js (Next.js App Router)
- Upgrade requirements: Connection: Upgrade, Upgrade: websocket

## Handshake Sequence
1. Client opens WebSocket connection to /api/socket.
2. Server accepts and immediately emits a socket.ready envelope containing connection metadata, order summary, current tables and active alerts.
3. Consumers store the connectionId and snapshot returned in that payload.
4. Server sends a socket.heartbeat envelope every 25 seconds with the connectionId and timestamp.

## Events & Payloads
| Event | Description | Payload |
| --- | --- | --- |
| socket.ready | Initial snapshot | SocketReadyPayload |
| socket.heartbeat | Keep-alive ping | SocketHeartbeatPayload |
| order.created | Order persisted | OrderEventPayload |
| order.updated | Order mutated | OrderEventPayload |
| order.summary.updated | Aggregated totals refresh | OrderSummaryEventPayload |
| table.updated | Covers or status changed | TableUpdatedPayload |
| table.layout.updated | Layout replaced | TableLayoutUpdatedPayload |
| alert.created | New alert raised | AlertCreatedPayload |
| alert.updated | Alert mutated | AlertUpdatedPayload |
| alert.acknowledged | Alert acknowledged | AlertAcknowledgedPayload |

Payload definitions live in lib/socket-events.ts.

## Client Helper
- lib/socket.ts exports socketClient with on/off/emit hooks, connection state helpers and exponential backoff (base 1.5s, capped at 30s).
- useSocket() wraps the client for React, exposing state, lastReadyPayload and automatically disconnecting when no subscribers remain.
- Set NEXT_PUBLIC_DISABLE_SOCKET=1 to force the deterministic mock client (useful in tests or isolated stories).

## Reconnection Strategy
- Pending emits are queued until the socket is open again.
- On reconnect, socket.ready is re-sent followed by the stored history drained from the event bus.
- Heartbeat gaps allow UI to display reconnection indicators via state.isReconnecting.

## Server Bus
- lib/server/socket-bus.ts keeps the last 50 envelopes per event and exposes publish / subscribe.
- Business services publish events after mutations:
  - Orders: lib/server/order-store.ts publishes order.created, order.updated and order.summary.updated.
  - Tables: lib/server/table-store.ts publishes table.updated and table.layout.updated.
  - Alerts: AlertService publishes alert.created, alert.updated and alert.acknowledged when executed server-side (API routes or the socket bridge).

## Example Client Usage
    const { on, off, lastReadyPayload } = useSocket()

    useEffect(() => {
      const handleOrder = (payload: OrderEventPayload) => {
        const order = toOrdersPanelOrder(payload.order)
        // update local state here
      }

      on("order.created", handleOrder)
      on("order.updated", handleOrder)

      return () => {
        off("order.created", handleOrder)
        off("order.updated", handleOrder)
      }
    }, [on, off])

## Testing Notes
- lib/server/__tests__/socket-bus.test.ts validates publish / subscribe semantics and history draining.
- lib/server/__tests__/socket-payloads.test.ts ensures serialization remains stable.
- lib/__tests__/socket-client.test.ts stubs WebSocket to cover the reconnection backoff and mock fallback.
- Components can mock useSocket() returning synthetic lastReadyPayload snapshots to exercise UI flows without a real server.
