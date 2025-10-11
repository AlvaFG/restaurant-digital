import { renderHook } from "@testing-library/react"
import { beforeEach, describe, expect, it, vi } from "vitest"

import { useQrSession } from "../use-qr-session"
import type { QrSessionData } from "../use-qr-session"

describe("useQrSession", () => {
  const mockTableId = "table-123"
  const validSession: QrSessionData = {
    sessionId: "session-abc",
    tableId: mockTableId,
    table: {
      id: mockTableId,
      number: 5,
      zone: "Terraza",
    },
    expiresAt: new Date(Date.now() + 7200000).toISOString(), // 2 hours from now
  }

  beforeEach(() => {
    localStorage.clear()
    vi.clearAllMocks()
  })

  it("returns null session when localStorage is empty", () => {
    const { result } = renderHook(() => useQrSession(mockTableId))

    expect(result.current.session).toBeNull()
    expect(result.current.isValidating).toBe(false)
    expect(result.current.isExpired).toBe(false)
    expect(result.current.isTableMismatch).toBe(false)
    expect(result.current.error).toBe("No se encontró una sesión activa")
  })

  it("returns valid session when data is correct", () => {
    localStorage.setItem("qr_session", JSON.stringify(validSession))

    const { result } = renderHook(() => useQrSession(mockTableId))

    expect(result.current.session).toEqual(validSession)
    expect(result.current.isValidating).toBe(false)
    expect(result.current.isExpired).toBe(false)
    expect(result.current.isTableMismatch).toBe(false)
    expect(result.current.error).toBeNull()
  })

  it("detects expired session", () => {
    const expiredSession: QrSessionData = {
      ...validSession,
      expiresAt: new Date(Date.now() - 1000).toISOString(), // 1 second ago
    }
    localStorage.setItem("qr_session", JSON.stringify(expiredSession))

    const { result } = renderHook(() => useQrSession(mockTableId))

    expect(result.current.session).toEqual(expiredSession)
    expect(result.current.isExpired).toBe(true)
    expect(result.current.error).toBe("La sesión ha expirado")
  })

  it("detects table mismatch", () => {
    const mismatchSession: QrSessionData = {
      ...validSession,
      tableId: "table-999",
      table: {
        id: "table-999",
        number: 10,
        zone: "Interior",
      },
    }
    localStorage.setItem("qr_session", JSON.stringify(mismatchSession))

    const { result } = renderHook(() => useQrSession(mockTableId))

    expect(result.current.session).toEqual(mismatchSession)
    expect(result.current.isTableMismatch).toBe(true)
    expect(result.current.error).toContain("Esta sesión es para la mesa")
  })

  it("handles corrupted session data", () => {
    localStorage.setItem("qr_session", "invalid-json")

    const { result } = renderHook(() => useQrSession(mockTableId))

    expect(result.current.session).toBeNull()
    expect(result.current.error).toContain("Error al validar sesión")
  })

  it("handles session with missing required fields", () => {
    const invalidSession = {
      sessionId: "session-abc",
      // Missing tableId and expiresAt
    }
    localStorage.setItem("qr_session", JSON.stringify(invalidSession))

    const { result } = renderHook(() => useQrSession(mockTableId))

    expect(result.current.session).toBeNull()
    expect(result.current.error).toBeTruthy() // Just verify there's an error
    expect(result.current.error).toMatch(/inválida|corrupta/) // Flexible regex
    expect(localStorage.getItem("qr_session")).toBeNull() // Should clear invalid session
  })

  it("clearSession removes session from localStorage", () => {
    localStorage.setItem("qr_session", JSON.stringify(validSession))

    const { result } = renderHook(() => useQrSession(mockTableId))

    expect(result.current.session).not.toBeNull()

    // Act: clear the session
    result.current.clearSession()

    // Need to wait for state update
    expect(localStorage.getItem("qr_session")).toBeNull()
  })

  it("warns when session is about to expire", () => {
    const consoleWarnSpy = vi.spyOn(console, "warn").mockImplementation(() => {})
    
    const soonToExpireSession: QrSessionData = {
      ...validSession,
      expiresAt: new Date(Date.now() + 5 * 60 * 1000).toISOString(), // 5 minutes from now
    }
    localStorage.setItem("qr_session", JSON.stringify(soonToExpireSession))

    renderHook(() => useQrSession(mockTableId))

    expect(consoleWarnSpy).toHaveBeenCalledWith(
      expect.stringContaining("[useQrSession] Session expires in")
    )

    consoleWarnSpy.mockRestore()
  })
})
