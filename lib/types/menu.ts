/**
 * Menu related types
 * Used in menu management, QR ordering, and kitchen display
 */

import type { ModifierGroup } from "@/app/(public)/qr/_types/modifiers"

export interface MenuItem {
  id: string
  name: string
  description?: string
  price: number
  category_id: string
  image_url?: string
  available: boolean
  modifiers?: ModifierGroup[]
  created_at: string
  updated_at: string
  tenant_id: string
  sort_order?: number
  tags?: string[]
  allergens?: string[]
  nutrition_info?: NutritionInfo
}

export interface MenuCategory {
  id: string
  name: string
  description?: string
  sort_order: number
  active: boolean
  tenant_id: string
  created_at: string
  updated_at: string
  items?: MenuItem[]
  icon?: string
  color?: string
}

export interface NutritionInfo {
  calories?: number
  protein?: number
  carbohydrates?: number
  fat?: number
  fiber?: number
  sodium?: number
}

export interface CreateMenuItemInput {
  name: string
  description?: string
  price: number
  category_id: string
  image_url?: string
  available?: boolean
  modifiers?: ModifierGroup[]
  sort_order?: number
  tags?: string[]
  allergens?: string[]
}

export interface UpdateMenuItemInput {
  name?: string
  description?: string
  price?: number
  category_id?: string
  image_url?: string
  available?: boolean
  modifiers?: ModifierGroup[]
  sort_order?: number
  tags?: string[]
  allergens?: string[]
}

export interface CreateMenuCategoryInput {
  name: string
  description?: string
  sort_order?: number
  active?: boolean
  icon?: string
  color?: string
}

export interface UpdateMenuCategoryInput {
  name?: string
  description?: string
  sort_order?: number
  active?: boolean
  icon?: string
  color?: string
}

export interface MenuWithCategories {
  categories: MenuCategory[]
  items: MenuItem[]
  total_categories: number
  total_items: number
  active_items: number
}
