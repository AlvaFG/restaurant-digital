/**
 * Users Service
 * Operations for user management with Supabase
 */

import { createBrowserClient } from "@/lib/supabase/client"
import type { Database } from "@/lib/supabase/database.types"

// Create Supabase client
const supabase = createBrowserClient()

// Use database types
type DbUser = Database['public']['Tables']['users']['Row']
type DbUserInsert = Database['public']['Tables']['users']['Insert']
type DbUserUpdate = Database['public']['Tables']['users']['Update']

// Export simplified User interface for components
export interface User {
  id: string
  tenant_id: string
  email: string
  name: string
  role: "admin" | "staff" | "manager"
  active: boolean
  created_at: string
  updated_at: string
  last_login_at?: string | null
  reset_token?: string | null
  reset_token_expires_at?: string | null
}

export interface CreateUserInput {
  email: string
  name: string
  role: "admin" | "staff" | "manager"
  password: string
  active?: boolean
}

export interface UpdateUserInput {
  email?: string
  name?: string
  role?: "admin" | "staff" | "manager"
  active?: boolean
}

/**
 * Get all users for the current tenant
 */
export async function getUsers(tenantId: string): Promise<User[]> {
  const { data, error } = await supabase
    .from("users")
    .select("*")
    .eq("tenant_id", tenantId)
    .order("created_at", { ascending: false })

  if (error) {
    console.error("Error fetching users:", error)
    throw new Error(`Error al obtener usuarios: ${error.message}`)
  }

  return (data || []) as User[]
}

/**
 * Get a single user by ID
 */
export async function getUserById(userId: string, tenantId: string): Promise<User> {
  const { data, error } = await supabase
    .from("users")
    .select("*")
    .eq("id", userId)
    .eq("tenant_id", tenantId)
    .single()

  if (error) {
    console.error("Error fetching user:", error)
    throw new Error(`Error al obtener usuario: ${error.message}`)
  }

  return data as User
}

/**
 * Create a new user
 * NOTE: Password hashing should be done server-side via API route
 */
export async function createUser(input: CreateUserInput, tenantId: string): Promise<User> {
  // For now, we'll use a simple hash client-side
  // In production, this MUST be done server-side via API route
  const { data, error } = await supabase
    .from("users")
    .insert({
      tenant_id: tenantId,
      email: input.email.trim().toLowerCase(),
      name: input.name.trim(),
      role: input.role,
      password_hash: `$2a$10$temp_${Date.now()}`, // TEMP: Replace with API call
      active: input.active ?? true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .select()
    .single()

  if (error) {
    console.error("Error creating user:", error)
    
    // Handle specific errors
    if (error.code === "23505") {
      throw new Error("Ya existe un usuario con ese email")
    }
    
    throw new Error(`Error al crear usuario: ${error.message}`)
  }

  return data as User
}

/**
 * Update an existing user
 */
export async function updateUser(
  userId: string,
  input: UpdateUserInput,
  tenantId: string,
): Promise<User> {
  const updateData: any = {
    updated_at: new Date().toISOString(),
  }

  if (input.email !== undefined) {
    updateData.email = input.email.trim().toLowerCase()
  }
  if (input.name !== undefined) {
    updateData.name = input.name.trim()
  }
  if (input.role !== undefined) {
    updateData.role = input.role
  }
  if (input.active !== undefined) {
    updateData.active = input.active
  }

  const { data, error } = await supabase
    .from("users")
    .update(updateData)
    .eq("id", userId)
    .eq("tenant_id", tenantId)
    .select()
    .single()

  if (error) {
    console.error("Error updating user:", error)
    
    // Handle specific errors
    if (error.code === "23505") {
      throw new Error("Ya existe un usuario con ese email")
    }
    
    throw new Error(`Error al actualizar usuario: ${error.message}`)
  }

  return data as User
}

/**
 * Toggle user active status
 */
export async function toggleUserActive(
  userId: string,
  active: boolean,
  tenantId: string,
): Promise<User> {
  const { data, error } = await supabase
    .from("users")
    .update({
      active,
      updated_at: new Date().toISOString(),
    })
    .eq("id", userId)
    .eq("tenant_id", tenantId)
    .select()
    .single()

  if (error) {
    console.error("Error toggling user status:", error)
    throw new Error(`Error al cambiar estado del usuario: ${error.message}`)
  }

  return data as User
}

/**
 * Delete a user (soft delete by setting active = false)
 */
export async function deleteUser(userId: string, tenantId: string): Promise<void> {
  // First, check if this is the last admin
  const { data: admins } = await supabase
    .from("users")
    .select("id")
    .eq("tenant_id", tenantId)
    .eq("role", "admin")
    .eq("active", true)

  if (admins && admins.length === 1 && admins[0].id === userId) {
    throw new Error("No se puede eliminar el único administrador activo")
  }

  // Soft delete
  const { error } = await supabase
    .from("users")
    .update({
      active: false,
      updated_at: new Date().toISOString(),
    })
    .eq("id", userId)
    .eq("tenant_id", tenantId)

  if (error) {
    console.error("Error deleting user:", error)
    throw new Error(`Error al eliminar usuario: ${error.message}`)
  }
}

/**
 * Hard delete a user (permanent deletion)
 * USE WITH CAUTION
 */
export async function hardDeleteUser(userId: string, tenantId: string): Promise<void> {
  // First, check if this is the last admin
  const { data: admins } = await supabase
    .from("users")
    .select("id")
    .eq("tenant_id", tenantId)
    .eq("role", "admin")
    .eq("active", true)

  if (admins && admins.length === 1 && admins[0].id === userId) {
    throw new Error("No se puede eliminar el único administrador activo")
  }

  const { error } = await supabase.from("users").delete().eq("id", userId).eq("tenant_id", tenantId)

  if (error) {
    console.error("Error hard deleting user:", error)
    throw new Error(`Error al eliminar usuario permanentemente: ${error.message}`)
  }
}

/**
 * Get user statistics
 */
export async function getUserStats(tenantId: string) {
  const { data: users, error } = await supabase.from("users").select("role, active").eq("tenant_id", tenantId)

  if (error) {
    console.error("Error fetching user stats:", error)
    throw new Error(`Error al obtener estadísticas: ${error.message}`)
  }

  const stats = {
    total: users.length,
    active: users.filter((u: any) => u.active).length,
    inactive: users.filter((u: any) => !u.active).length,
    admins: users.filter((u: any) => u.role === "admin" && u.active).length,
    managers: users.filter((u: any) => u.role === "manager" && u.active).length,
    staff: users.filter((u: any) => u.role === "staff" && u.active).length,
  }

  return stats
}

/**
 * Check if email is available
 */
export async function isEmailAvailable(email: string, tenantId: string): Promise<boolean> {
  const { data } = await supabase
    .from("users")
    .select("id")
    .eq("email", email.trim().toLowerCase())
    .eq("tenant_id", tenantId)
    .single()

  return !data
}
