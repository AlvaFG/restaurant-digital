/**
 * Type definitions for Cloudflare Workers / Next.js Edge Runtime
 * These types provide type safety for WebSocket APIs available in edge environments
 */

declare global {
  /**
   * WebSocketPair represents a pair of WebSocket connections
   * One end for the client, one for the server
   */
  interface WebSocketPair {
    0: WebSocket
    1: WebSocket
  }

  /**
   * Extended WebSocket interface with edge runtime methods
   */
  interface WebSocket {
    /**
     * Accept the WebSocket connection
     * Must be called on the server-side WebSocket before using it
     */
    accept(): void
    
    /**
     * Send data through the WebSocket
     */
    send(data: string | ArrayBufferLike | ArrayBufferView): void
    
    /**
     * Close the WebSocket connection
     */
    close(code?: number, reason?: string): void
    
    /**
     * Add event listener for WebSocket events
     */
    addEventListener(
      type: 'open' | 'message' | 'close' | 'error',
      listener: (event: Event | MessageEvent | CloseEvent) => void
    ): void
    
    /**
     * Remove event listener
     */
    removeEventListener(
      type: 'open' | 'message' | 'close' | 'error',
      listener: (event: Event | MessageEvent | CloseEvent) => void
    ): void
    
    /**
     * Current state of the WebSocket connection
     */
    readyState: number
    
    /**
     * URL of the WebSocket
     */
    url: string
  }

  /**
   * Extended Response interface with webSocket property for edge runtime
   */
  interface Response {
    /**
     * WebSocket connection attached to the response
     * Available in Cloudflare Workers and edge environments
     */
    webSocket?: WebSocket
  }

  /**
   * WebSocketPair constructor
   */
  var WebSocketPair: {
    prototype: WebSocketPair
    new (): WebSocketPair
  }
}

export {}
