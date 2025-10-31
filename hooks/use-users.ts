/**
 * Users Hook - React Query Integration
 * Custom hooks for user management operations
 */

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { useAuth } from "@/contexts/auth-context"
import {
  getUsers,
  getUserById,
  createUser,
  updateUser,
  toggleUserActive,
  deleteUser,
  getUserStats,
  type User,
  type CreateUserInput,
  type UpdateUserInput,
} from "@/lib/services/users-service"
import { toast } from "@/hooks/use-toast"

// Re-export User type for convenience
export type { User } from "@/lib/services/users-service"

/**
 * Hook to fetch all users
 */
export function useUsers() {
  const { tenant } = useAuth()

  return useQuery({
    queryKey: ["users", tenant?.id],
    queryFn: () => {
      if (!tenant?.id) throw new Error("No tenant ID available")
      return getUsers(tenant.id)
    },
    enabled: !!tenant?.id,
    staleTime: 30000, // 30 seconds
    retry: 2,
  })
}

/**
 * Hook to fetch a single user
 */
export function useUser(userId: string) {
  const { tenant } = useAuth()

  return useQuery({
    queryKey: ["users", tenant?.id, userId],
    queryFn: () => {
      if (!tenant?.id) throw new Error("No tenant ID available")
      return getUserById(userId, tenant.id)
    },
    enabled: !!tenant?.id && !!userId,
    staleTime: 60000, // 1 minute
  })
}

/**
 * Hook to get user statistics
 */
export function useUserStats() {
  const { tenant } = useAuth()

  return useQuery({
    queryKey: ["users", tenant?.id, "stats"],
    queryFn: () => {
      if (!tenant?.id) throw new Error("No tenant ID available")
      return getUserStats(tenant.id)
    },
    enabled: !!tenant?.id,
    staleTime: 30000, // 30 seconds
  })
}

/**
 * Hook to create a new user
 */
export function useCreateUser() {
  const { tenant } = useAuth()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (input: CreateUserInput) => {
      if (!tenant?.id) throw new Error("No tenant ID available")
      return createUser(input, tenant.id)
    },
    onSuccess: (newUser) => {
      if (!tenant?.id) return

      // Invalidate and refetch users
      queryClient.invalidateQueries({ queryKey: ["users", tenant.id] })

      // Optimistically update the cache
      queryClient.setQueryData<User[]>(["users", tenant.id], (oldData) => {
        if (!oldData) return [newUser]
        return [newUser, ...oldData]
      })

      toast({
        title: "Usuario creado",
        description: `Usuario ${newUser.name} creado exitosamente`,
      })
    },
    onError: (error: Error) => {
      toast({
        variant: "destructive",
        title: "Error al crear usuario",
        description: error.message,
      })
    },
  })
}

/**
 * Hook to update a user
 */
export function useUpdateUser() {
  const { tenant } = useAuth()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ userId, input }: { userId: string; input: UpdateUserInput }) => {
      if (!tenant?.id) throw new Error("No tenant ID available")
      return updateUser(userId, input, tenant.id)
    },
    onSuccess: (updatedUser) => {
      if (!tenant?.id) return

      // Invalidate and refetch
      queryClient.invalidateQueries({ queryKey: ["users", tenant.id] })
      queryClient.invalidateQueries({ queryKey: ["users", tenant.id, updatedUser.id] })

      // Optimistically update the list
      queryClient.setQueryData<User[]>(["users", tenant.id], (oldData) => {
        if (!oldData) return [updatedUser]
        return oldData.map((user) => (user.id === updatedUser.id ? updatedUser : user))
      })

      toast({
        title: "Usuario actualizado",
        description: `Usuario ${updatedUser.name} actualizado exitosamente`,
      })
    },
    onError: (error: Error) => {
      toast({
        variant: "destructive",
        title: "Error al actualizar usuario",
        description: error.message,
      })
    },
  })
}

/**
 * Hook to toggle user active status
 */
export function useToggleUserActive() {
  const { tenant } = useAuth()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ userId, active }: { userId: string; active: boolean }) => {
      if (!tenant?.id) throw new Error("No tenant ID available")
      return toggleUserActive(userId, active, tenant.id)
    },
    onSuccess: (updatedUser) => {
      if (!tenant?.id) return

      // Invalidate and refetch
      queryClient.invalidateQueries({ queryKey: ["users", tenant.id] })

      // Optimistically update the list
      queryClient.setQueryData<User[]>(["users", tenant.id], (oldData) => {
        if (!oldData) return [updatedUser]
        return oldData.map((user) => (user.id === updatedUser.id ? updatedUser : user))
      })

      toast({
        title: updatedUser.active ? "Usuario activado" : "Usuario desactivado",
        description: `El usuario ha sido ${updatedUser.active ? "activado" : "desactivado"}`,
      })
    },
    onError: (error: Error) => {
      toast({
        variant: "destructive",
        title: "Error al cambiar estado",
        description: error.message,
      })
    },
  })
}

/**
 * Hook to delete a user (soft delete)
 */
export function useDeleteUser() {
  const { tenant } = useAuth()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (userId: string) => {
      if (!tenant?.id) throw new Error("No tenant ID available")
      return deleteUser(userId, tenant.id)
    },
    onSuccess: (_, userId) => {
      if (!tenant?.id) return

      // Invalidate and refetch
      queryClient.invalidateQueries({ queryKey: ["users", tenant.id] })

      // Optimistically remove from the list
      queryClient.setQueryData<User[]>(["users", tenant.id], (oldData) => {
        if (!oldData) return []
        return oldData.filter((user) => user.id !== userId)
      })

      toast({
        title: "Usuario eliminado",
        description: "Usuario eliminado exitosamente",
      })
    },
    onError: (error: Error) => {
      toast({
        variant: "destructive",
        title: "Error al eliminar usuario",
        description: error.message,
      })
    },
  })
}
