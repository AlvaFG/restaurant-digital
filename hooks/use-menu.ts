/**
 * useMenu Hook - Supabase Integration with React Query
 * 
 * Hook para gestionar el menú desde componentes React con caché y optimistic updates
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useAuth } from '@/contexts/auth-context'
import {
  getMenuCategories as getMenuCategoriesService,
  getMenuItems as getMenuItemsService,
  getMenuItemById as getMenuItemByIdService,
  createMenuItem as createMenuItemService,
  updateMenuItem as updateMenuItemService,
  deleteMenuItem as deleteMenuItemService,
  createMenuCategory as createMenuCategoryService,
  updateMenuCategory as updateMenuCategoryService,
  getFullMenu as getFullMenuService,
} from '@/lib/services/menu-service'

export function useMenuCategories() {
  const { tenant } = useAuth()
  const queryClient = useQueryClient()

  const queryKey = ['menu', 'categories', tenant?.id]

  const {
    data: categories = [],
    isLoading: loading,
    error,
  } = useQuery({
    queryKey,
    queryFn: async () => {
      if (!tenant?.id) return []
      const { data, error: fetchError } = await getMenuCategoriesService(tenant.id)
      if (fetchError) throw fetchError
      return data || []
    },
    enabled: !!tenant?.id,
  })

  const createCategoryMutation = useMutation({
    mutationFn: async (input: {
      name: string
      description?: string
      sortOrder?: number
    }) => {
      if (!tenant?.id) throw new Error('No tenant ID available')
      const { data, error: createError } = await createMenuCategoryService(input, tenant.id)
      if (createError) throw createError
      return data
    },
    onMutate: async (newCategory) => {
      await queryClient.cancelQueries({ queryKey })
      const previousCategories = queryClient.getQueryData(queryKey)
      
      queryClient.setQueryData(queryKey, (old: any[] = []) => [
        ...old,
        { ...newCategory, id: 'temp-' + Date.now(), active: true },
      ])
      
      return { previousCategories }
    },
    onError: (err, newCategory, context) => {
      queryClient.setQueryData(queryKey, context?.previousCategories)
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey })
    },
  })

  const updateCategoryMutation = useMutation({
    mutationFn: async ({
      categoryId,
      updates,
    }: {
      categoryId: string
      updates: {
        name?: string
        description?: string
        sortOrder?: number
        active?: boolean
      }
    }) => {
      if (!tenant?.id) throw new Error('No tenant ID available')
      const { data, error: updateError } = await updateMenuCategoryService(categoryId, updates, tenant.id)
      if (updateError) throw updateError
      return data
    },
    onMutate: async ({ categoryId, updates }) => {
      await queryClient.cancelQueries({ queryKey })
      const previousCategories = queryClient.getQueryData(queryKey)
      
      queryClient.setQueryData(queryKey, (old: any[] = []) =>
        old.map((category) => (category.id === categoryId ? { ...category, ...updates } : category))
      )
      
      return { previousCategories }
    },
    onError: (err, variables, context) => {
      queryClient.setQueryData(queryKey, context?.previousCategories)
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey })
    },
  })

  return {
    categories,
    loading,
    error: error as Error | null,
    createCategory: (input: Parameters<typeof createCategoryMutation.mutateAsync>[0]) =>
      createCategoryMutation.mutateAsync(input),
    updateCategory: (categoryId: string, updates: any) =>
      updateCategoryMutation.mutateAsync({ categoryId, updates }),
    refresh: () => queryClient.invalidateQueries({ queryKey }),
  }
}

export function useMenuItems(filters?: {
  categoryId?: string
  available?: boolean
  search?: string
}) {
  const { tenant } = useAuth()
  const queryClient = useQueryClient()

  const queryKey = ['menu', 'items', tenant?.id, filters]

  const {
    data: items = [],
    isLoading: loading,
    error,
  } = useQuery({
    queryKey,
    queryFn: async () => {
      if (!tenant?.id) return []
      const { data, error: fetchError } = await getMenuItemsService(tenant.id, filters)
      if (fetchError) throw fetchError
      return data || []
    },
    enabled: !!tenant?.id,
  })

  const createItemMutation = useMutation({
    mutationFn: async (input: {
      categoryId: string
      name: string
      description: string
      priceCents: number
      imageUrl?: string
      tags?: string[]
      allergens?: unknown
      available?: boolean
    }) => {
      if (!tenant?.id) throw new Error('No tenant ID available')
      const { data, error: createError } = await createMenuItemService(input, tenant.id)
      if (createError) throw createError
      return data
    },
    onMutate: async (newItem) => {
      await queryClient.cancelQueries({ queryKey })
      const previousItems = queryClient.getQueryData(queryKey)
      
      queryClient.setQueryData(queryKey, (old: any[] = []) => [
        ...old,
        { ...newItem, id: 'temp-' + Date.now() },
      ])
      
      return { previousItems }
    },
    onError: (err, newItem, context) => {
      queryClient.setQueryData(queryKey, context?.previousItems)
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey })
    },
  })

  const updateItemMutation = useMutation({
    mutationFn: async ({
      itemId,
      updates,
    }: {
      itemId: string
      updates: {
        categoryId?: string
        name?: string
        description?: string
        priceCents?: number
        imageUrl?: string
        tags?: string[]
        allergens?: unknown
        available?: boolean
      }
    }) => {
      if (!tenant?.id) throw new Error('No tenant ID available')
      const { data, error: updateError } = await updateMenuItemService(itemId, updates, tenant.id)
      if (updateError) throw updateError
      return data
    },
    onMutate: async ({ itemId, updates }) => {
      await queryClient.cancelQueries({ queryKey })
      const previousItems = queryClient.getQueryData(queryKey)
      
      queryClient.setQueryData(queryKey, (old: any[] = []) =>
        old.map((item) => (item.id === itemId ? { ...item, ...updates } : item))
      )
      
      return { previousItems }
    },
    onError: (err, variables, context) => {
      queryClient.setQueryData(queryKey, context?.previousItems)
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey })
    },
  })

  const deleteItemMutation = useMutation({
    mutationFn: async (itemId: string) => {
      if (!tenant?.id) throw new Error('No tenant ID available')
      const { error: deleteError } = await deleteMenuItemService(itemId, tenant.id)
      if (deleteError) throw deleteError
    },
    onMutate: async (itemId) => {
      await queryClient.cancelQueries({ queryKey })
      const previousItems = queryClient.getQueryData(queryKey)
      
      queryClient.setQueryData(queryKey, (old: any[] = []) =>
        old.filter((item) => item.id !== itemId)
      )
      
      return { previousItems }
    },
    onError: (err, itemId, context) => {
      queryClient.setQueryData(queryKey, context?.previousItems)
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey })
    },
  })

  return {
    items,
    loading,
    error: error as Error | null,
    createItem: (input: Parameters<typeof createItemMutation.mutateAsync>[0]) =>
      createItemMutation.mutateAsync(input),
    updateItem: (itemId: string, updates: any) =>
      updateItemMutation.mutateAsync({ itemId, updates }),
    deleteItem: (itemId: string) => deleteItemMutation.mutateAsync(itemId),
    refresh: () => queryClient.invalidateQueries({ queryKey }),
  }
}

export function useMenuItem(itemId?: string) {
  const { tenant } = useAuth()

  const { data: item = null, isLoading: loading, error } = useQuery({
    queryKey: ['menu', 'item', tenant?.id, itemId],
    queryFn: async () => {
      if (!tenant?.id || !itemId) return null
      const { data, error: fetchError } = await getMenuItemByIdService(itemId, tenant.id)
      if (fetchError) throw fetchError
      return data
    },
    enabled: !!(tenant?.id && itemId),
  })

  return {
    item,
    loading,
    error: error as Error | null,
    refresh: () => {
      // Query will automatically refetch
    },
  }
}

export function useFullMenu() {
  const { tenant } = useAuth()

  const { data: menu = [], isLoading: loading, error } = useQuery({
    queryKey: ['menu', 'full', tenant?.id],
    queryFn: async () => {
      if (!tenant?.id) return []
      const { data, error: fetchError } = await getFullMenuService(tenant.id)
      if (fetchError) throw fetchError
      return data || []
    },
    enabled: !!tenant?.id,
  })

  return {
    menu,
    loading,
    error: error as Error | null,
    refresh: () => {
      // Query will automatically refetch
    },
  }
}
