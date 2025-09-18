"use client"

import type React from "react"

import { createContext, useContext, useEffect, useState } from "react"
import { type User, type Tenant, AuthService } from "@/lib/auth"

interface AuthContextType {
  user: User | null
  tenant: Tenant | null
  login: (email: string, password: string) => Promise<void>
  logout: () => void
  updateTenant: (updates: Partial<Tenant>) => void
  isLoading: boolean
  isHydrated: boolean
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [tenant, setTenant] = useState<Tenant | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isHydrated, setIsHydrated] = useState(false)

  useEffect(() => {
    setIsHydrated(true)

    const currentUser = AuthService.getCurrentUser()
    const currentTenant = AuthService.getTenant()

    setUser(currentUser)
    setTenant(currentTenant)
    setIsLoading(false)
  }, [])

  const login = async (email: string, password: string) => {
    const user = await AuthService.login(email, password)
    const tenant = AuthService.getTenant()

    setUser(user)
    setTenant(tenant)
  }

  const logout = () => {
    AuthService.logout()
    setUser(null)
    setTenant(null)
  }

  const updateTenant = (updates: Partial<Tenant>) => {
    if (tenant) {
      const updated = { ...tenant, ...updates }
      AuthService.updateTenant(updates)
      setTenant(updated)
    }
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        tenant,
        login,
        logout,
        updateTenant,
        isLoading,
        isHydrated,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
}
