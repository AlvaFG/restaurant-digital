import { beforeEach, describe, expect, it } from "vitest"

import { AuthService } from "@/lib/auth"

const STORAGE_KEY = "restaurant_auth"
const TENANT_KEY = "restaurant_tenant"

function clearCookies(prefix: string) {
  document.cookie
    .split(";")
    .map((cookie) => cookie.split("=")[0]?.trim())
    .filter((name) => !!name && name.startsWith(prefix))
    .forEach((name) => {
      document.cookie = `${name}=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/`
    })
}

describe("AuthService", () => {
  beforeEach(() => {
    localStorage.clear()
    clearCookies("restaurant_")
  })

  it("almacena el usuario y el tenant tras un login valido", async () => {
    const user = await AuthService.login("admin@admin.com", "123456")

    expect(user?.email).toBe("admin@admin.com")
    expect(localStorage.getItem(STORAGE_KEY)).toContain("admin@admin.com")
    expect(localStorage.getItem(TENANT_KEY)).toContain("Restaurante Demo")
  })

  it("lanza un error cuando las credenciales no coinciden", async () => {
    await expect(AuthService.login("admin@admin.com", "wrong"))
      .rejects.toBeInstanceOf(Error)
  })

  it("elimina los datos persistidos al cerrar sesion", async () => {
    await AuthService.login("admin@admin.com", "123456")

    AuthService.logout()

    expect(localStorage.getItem(STORAGE_KEY)).toBeNull()
    expect(localStorage.getItem(TENANT_KEY)).toBeNull()
  })
})
