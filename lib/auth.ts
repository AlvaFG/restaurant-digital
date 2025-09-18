export interface User {
  id: string
  name: string
  email: string
  role: "admin" | "staff"
  active: boolean
}

export interface Tenant {
  id: string
  name: string
  logoUrl?: string
  theme: {
    accentColor: string
  }
  features: {
    tablets: boolean
    kds: boolean
    payments: boolean
  }
}

// Mock users for demo
const MOCK_USERS: User[] = [
  {
    id: "1",
    name: "Administrador",
    email: "admin@admin.com",
    role: "admin",
    active: true,
  },
  {
    id: "2",
    name: "Personal",
    email: "staff@staff.com",
    role: "staff",
    active: true,
  },
]

// Mock tenant data
const MOCK_TENANT: Tenant = {
  id: "tenant-1",
  name: "Restaurante Demo",
  logoUrl: undefined,
  theme: {
    accentColor: "#3b82f6", // Blue default
  },
  features: {
    tablets: true,
    kds: true,
    payments: true,
  },
}

export class AuthService {
  private static readonly STORAGE_KEY = "restaurant_auth"
  private static readonly TENANT_KEY = "restaurant_tenant"

  private static setCookie(name: string, value: string, days = 7): void {
    if (typeof document === "undefined") return

    const expires = new Date()
    expires.setTime(expires.getTime() + days * 24 * 60 * 60 * 1000)
    const encodedValue = encodeURIComponent(value)
    document.cookie = `${name}=${encodedValue};expires=${expires.toUTCString()};path=/;SameSite=Lax`
  }

  private static deleteCookie(name: string): void {
    if (typeof document === "undefined") return

    document.cookie = `${name}=;expires=Thu, 01 Jan 1970 00:00:00 UTC;path=/;`
  }

  static async login(email: string, password: string): Promise<User | null> {
    // Mock authentication - in real app this would be an API call
    if (password !== "123456") {
      throw new Error("Credenciales invÃ¡lidas")
    }

    const user = MOCK_USERS.find((u) => u.email === email && u.active)
    if (!user) {
      throw new Error("Usuario no encontrado")
    }

    // Store in localStorage for demo
    localStorage.setItem(this.STORAGE_KEY, JSON.stringify(user))
    localStorage.setItem(this.TENANT_KEY, JSON.stringify(MOCK_TENANT))

    this.setCookie(this.STORAGE_KEY, JSON.stringify(user))
    this.setCookie(this.TENANT_KEY, JSON.stringify(MOCK_TENANT))

    return user
  }

  static logout(): void {
    localStorage.removeItem(this.STORAGE_KEY)
    localStorage.removeItem(this.TENANT_KEY)

    this.deleteCookie(this.STORAGE_KEY)
    this.deleteCookie(this.TENANT_KEY)
  }

  static getCurrentUser(): User | null {
    if (typeof window === "undefined") return null

    const stored = localStorage.getItem(this.STORAGE_KEY)
    return stored ? JSON.parse(stored) : null
  }

  static getTenant(): Tenant | null {
    if (typeof window === "undefined") return null

    const stored = localStorage.getItem(this.TENANT_KEY)
    return stored ? JSON.parse(stored) : null
  }

  static updateTenant(updates: Partial<Tenant>): void {
    const current = this.getTenant()
    if (current) {
      const updated = { ...current, ...updates }
      localStorage.setItem(this.TENANT_KEY, JSON.stringify(updated))

      this.setCookie(this.TENANT_KEY, JSON.stringify(updated))
    }
  }
}

