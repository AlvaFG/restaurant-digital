import { createBrowserClient } from "./supabase/client"
import bcrypt from "bcryptjs"

export interface User {
  id: string
  name: string
  email: string
  role: "admin" | "staff" | "manager"
  active: boolean
  tenant_id: string
  last_login_at?: string
}

export interface Tenant {
  id: string
  name: string
  slug: string
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
    const supabase = createBrowserClient()

    // 1. Buscar usuario en Supabase
    const { data: users, error } = await supabase
      .from("users")
      .select(`
        *,
        tenants (
          id,
          name,
          slug,
          settings
        )
      `)
      .eq("email", email)
      .eq("active", true)
      .limit(1)

    if (error || !users || users.length === 0) {
      throw new Error("Usuario no encontrado")
    }

    const userData = users[0]

    // 2. Verificar password con bcrypt
    // Nota: En producción, la validación de password debería hacerse en el servidor
    // por razones de seguridad. Aquí lo hacemos en el cliente solo para demo.
    const isValid = await bcrypt.compare(password, userData.password_hash)
    if (!isValid) {
      throw new Error("Credenciales inválidas")
    }

    // 3. Actualizar last_login_at
    await supabase.from("users").update({ last_login_at: new Date().toISOString() }).eq("id", userData.id)

    // 4. Preparar datos de usuario
    const user: User = {
      id: userData.id,
      name: userData.name,
      email: userData.email,
      role: userData.role,
      active: userData.active,
      tenant_id: userData.tenant_id,
      last_login_at: new Date().toISOString(),
    }

    // 5. Preparar datos de tenant
    const tenantData = userData.tenants as any
    const tenant: Tenant = {
      id: tenantData.id,
      name: tenantData.name,
      slug: tenantData.slug,
      logoUrl: tenantData.settings?.logoUrl,
      theme: {
        accentColor: tenantData.settings?.theme?.accentColor || "#3b82f6",
      },
      features: {
        tablets: tenantData.settings?.features?.tablets ?? true,
        kds: tenantData.settings?.features?.kds ?? true,
        payments: tenantData.settings?.features?.payments ?? true,
      },
    }

    // 6. Store in localStorage for demo
    localStorage.setItem(this.STORAGE_KEY, JSON.stringify(user))
    localStorage.setItem(this.TENANT_KEY, JSON.stringify(tenant))

    this.setCookie(this.STORAGE_KEY, JSON.stringify(user))
    this.setCookie(this.TENANT_KEY, JSON.stringify(tenant))

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

