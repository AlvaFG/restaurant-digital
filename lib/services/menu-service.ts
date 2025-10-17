/**
 * Menu Service - Supabase Integration
 * 
 * Servicio completo de menú usando Supabase como única fuente de datos.
 * Reemplaza completamente a lib/server/menu-store.ts
 */

import { createBrowserClient } from "@/lib/supabase/client"
import type { Database } from "@/lib/supabase/database.types"
import { createLogger } from "@/lib/logger"

const logger = createLogger('menu-service')

type MenuCategory = Database['public']['Tables']['menu_categories']['Row']
type MenuCategoryInsert = Database['public']['Tables']['menu_categories']['Insert']
type MenuItem = Database['public']['Tables']['menu_items']['Row']
type MenuItemInsert = Database['public']['Tables']['menu_items']['Insert']
type MenuItemUpdate = Database['public']['Tables']['menu_items']['Update']

/**
 * Obtiene todas las categorías del menú
 */
export async function getMenuCategories(tenantId: string) {
  const supabase = createBrowserClient()

  try {
    const { data, error } = await supabase
      .from('menu_categories')
      .select('*')
      .eq('tenant_id', tenantId)
      .eq('active', true)
      .order('sort_order', { ascending: true })

    if (error) throw error

    return { data, error: null }
  } catch (error) {
    logger.error('Error al obtener categorías', error as Error)
    return { data: null, error: error as Error }
  }
}

/**
 * Obtiene todos los items del menú con sus categorías
 */
export async function getMenuItems(tenantId: string, filters?: {
  categoryId?: string
  available?: boolean
  search?: string
}) {
  const supabase = createBrowserClient()

  try {
    let query = supabase
      .from('menu_items')
      .select(`
        *,
        category:menu_categories (
          id,
          name,
          description
        )
      `)
      .eq('tenant_id', tenantId)

    if (filters?.categoryId) {
      query = query.eq('category_id', filters.categoryId)
    }

    if (filters?.available !== undefined) {
      query = query.eq('available', filters.available)
    }

    if (filters?.search) {
      query = query.or(`name.ilike.%${filters.search}%,description.ilike.%${filters.search}%`)
    }

    const { data, error } = await query.order('name', { ascending: true })

    if (error) throw error

    return { data, error: null }
  } catch (error) {
    logger.error('Error al obtener items del menú', error as Error)
    return { data: null, error: error as Error }
  }
}

/**
 * Obtiene un item del menú por ID
 */
export async function getMenuItemById(itemId: string, tenantId: string) {
  const supabase = createBrowserClient()

  try {
    const { data, error } = await supabase
      .from('menu_items')
      .select(`
        *,
        category:menu_categories (
          id,
          name,
          description
        )
      `)
      .eq('id', itemId)
      .eq('tenant_id', tenantId)
      .single()

    if (error) throw error

    return { data, error: null }
  } catch (error) {
    logger.error('Error al obtener item del menú', error as Error, { itemId })
    return { data: null, error: error as Error }
  }
}

/**
 * Crea un nuevo item del menú
 */
export async function createMenuItem(
  input: {
    categoryId: string
    name: string
    description: string
    priceCents: number
    imageUrl?: string
    tags?: string[]
    allergens?: unknown
    available?: boolean
  },
  tenantId: string
) {
  const supabase = createBrowserClient()

  try {
    const { data, error } = await supabase
      .from('menu_items')
      .insert({
        tenant_id: tenantId,
        category_id: input.categoryId,
        name: input.name,
        description: input.description,
        price_cents: input.priceCents,
        image_url: input.imageUrl || null,
        tags: input.tags || null,
        allergens: input.allergens || null,
        available: input.available ?? true,
      } as MenuItemInsert)
      .select()
      .single()

    if (error) throw error

    logger.info('Item del menú creado', { itemId: data?.id, name: input.name })

    return { data, error: null }
  } catch (error) {
    logger.error('Error al crear item del menú', error as Error)
    return { data: null, error: error as Error }
  }
}

/**
 * Actualiza un item del menú
 */
export async function updateMenuItem(
  itemId: string,
  updates: {
    categoryId?: string
    name?: string
    description?: string
    priceCents?: number
    imageUrl?: string
    tags?: string[]
    allergens?: unknown
    available?: boolean
  },
  tenantId: string
) {
  const supabase = createBrowserClient()

  try {
    const updateData: MenuItemUpdate = {}

    if (updates.categoryId !== undefined) updateData.category_id = updates.categoryId
    if (updates.name !== undefined) updateData.name = updates.name
    if (updates.description !== undefined) updateData.description = updates.description
    if (updates.priceCents !== undefined) updateData.price_cents = updates.priceCents
    if (updates.imageUrl !== undefined) updateData.image_url = updates.imageUrl
    if (updates.tags !== undefined) updateData.tags = updates.tags
    if (updates.allergens !== undefined) updateData.allergens = updates.allergens as any
    if (updates.available !== undefined) updateData.available = updates.available

    const { data, error } = await supabase
      .from('menu_items')
      .update(updateData)
      .eq('id', itemId)
      .eq('tenant_id', tenantId)
      .select()
      .single()

    if (error) throw error

    logger.info('Item del menú actualizado', { itemId })

    return { data, error: null }
  } catch (error) {
    logger.error('Error al actualizar item del menú', error as Error, { itemId })
    return { data: null, error: error as Error }
  }
}

/**
 * Elimina un item del menú
 */
export async function deleteMenuItem(itemId: string, tenantId: string) {
  const supabase = createBrowserClient()

  try {
    const { error } = await supabase
      .from('menu_items')
      .delete()
      .eq('id', itemId)
      .eq('tenant_id', tenantId)

    if (error) throw error

    logger.info('Item del menú eliminado', { itemId })

    return { error: null }
  } catch (error) {
    logger.error('Error al eliminar item del menú', error as Error, { itemId })
    return { error: error as Error }
  }
}

/**
 * Crea una nueva categoría
 */
export async function createMenuCategory(
  input: {
    name: string
    description?: string
    sortOrder?: number
  },
  tenantId: string
) {
  const supabase = createBrowserClient()

  try {
    const { data, error } = await supabase
      .from('menu_categories')
      .insert({
        tenant_id: tenantId,
        name: input.name,
        description: input.description || null,
        sort_order: input.sortOrder || 0,
        active: true,
      } as MenuCategoryInsert)
      .select()
      .single()

    if (error) throw error

    logger.info('Categoría creada', { categoryId: data?.id, name: input.name })

    return { data, error: null }
  } catch (error) {
    logger.error('Error al crear categoría', error as Error)
    return { data: null, error: error as Error }
  }
}

/**
 * Actualiza una categoría
 */
export async function updateMenuCategory(
  categoryId: string,
  updates: {
    name?: string
    description?: string
    sortOrder?: number
    active?: boolean
  },
  tenantId: string
) {
  const supabase = createBrowserClient()

  try {
    const updateData: Partial<MenuCategory> = {}

    if (updates.name !== undefined) updateData.name = updates.name
    if (updates.description !== undefined) updateData.description = updates.description
    if (updates.sortOrder !== undefined) updateData.sort_order = updates.sortOrder
    if (updates.active !== undefined) updateData.active = updates.active

    const { data, error } = await supabase
      .from('menu_categories')
      .update(updateData)
      .eq('id', categoryId)
      .eq('tenant_id', tenantId)
      .select()
      .single()

    if (error) throw error

    logger.info('Categoría actualizada', { categoryId })

    return { data, error: null }
  } catch (error) {
    logger.error('Error al actualizar categoría', error as Error, { categoryId })
    return { data: null, error: error as Error }
  }
}

/**
 * Obtiene el menú completo (categorías con items)
 */
export async function getFullMenu(tenantId: string) {
  const supabase = createBrowserClient()

  try {
    const { data: categories, error: categoriesError } = await supabase
      .from('menu_categories')
      .select(`
        *,
        items:menu_items (*)
      `)
      .eq('tenant_id', tenantId)
      .eq('active', true)
      .order('sort_order', { ascending: true })

    if (categoriesError) throw categoriesError

    return { data: categories, error: null }
  } catch (error) {
    logger.error('Error al obtener menú completo', error as Error)
    return { data: null, error: error as Error }
  }
}
