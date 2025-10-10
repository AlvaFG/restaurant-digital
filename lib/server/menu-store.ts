import { promises as fs } from "node:fs"
import { access } from "node:fs/promises"
import { constants as fsConstants } from "node:fs"
import { getDataDir, getDataFile } from "./data-path"
import { createLogger } from "@/lib/logger"

import {
  MOCK_MENU_ALLERGENS,
  MOCK_MENU_CATEGORIES,
  MOCK_MENU_ITEMS,
  type MenuAllergen,
  type MenuCategory,
  type MenuItem,
  type MenuItemAllergen,
  type MenuMetadata,
  type MenuResponse,
} from "@/lib/mock-data"

const logger = createLogger('menu-store')

const DATA_DIR = getDataDir()
const DATA_FILE = getDataFile("menu-store.json")

interface MenuStoreData {
  categories: MenuCategory[]
  items: MenuItem[]
  allergens: MenuAllergen[]
  metadata: MenuMetadata
}

const DEFAULT_METADATA: MenuMetadata = {
  currency: "ARS",
  version: 1,
  updatedAt: new Date().toISOString(),
}

let cache: MenuStoreData | null = null
let writeQueue: Promise<unknown> = Promise.resolve()

function deepClone<T>(value: T): T {
  return structuredClone(value)
}

function ensureMetadata(value?: Partial<MenuMetadata>): MenuMetadata {
  const version = Number.isFinite(value?.version) ? Number(value?.version) : DEFAULT_METADATA.version
  return {
    currency: value?.currency?.trim() || DEFAULT_METADATA.currency,
    version: Math.max(1, Math.floor(version)),
    updatedAt: value?.updatedAt ?? new Date().toISOString(),
  }
}

function sanitizeCategory(category: MenuCategory): MenuCategory {
  const name = category.name.trim()
  if (!name) {
    throw new Error("El nombre de la categoría es obligatorio")
  }

  const sortValue = Number.isFinite(category.sort) ? Number(category.sort) : 0
  return {
    ...category,
    id: String(category.id),
    name,
    description: category.description?.trim() || undefined,
    sort: Math.max(0, Math.floor(sortValue)),
  }
}

function sanitizeAllergens(allergens: MenuAllergen[]): MenuAllergen[] {
  return allergens
    .map((allergen) => ({
      ...allergen,
      code: allergen.code,
      name: allergen.name.trim(),
      description: allergen.description?.trim() || undefined,
      icon: allergen.icon?.trim() || undefined,
    }))
    .filter((allergen) => Boolean(allergen.code) && Boolean(allergen.name))
}

function normalizeItemAllergens(
  allergens: MenuItemAllergen[] | undefined,
  knownCodes: Set<MenuAllergen["code"]>,
): MenuItemAllergen[] {
  if (!allergens || allergens.length === 0) {
    return []
  }

  const unique: MenuItemAllergen[] = []
  const seen = new Set<MenuAllergen["code"]>()

  for (const allergen of allergens) {
    if (!knownCodes.has(allergen.code) || seen.has(allergen.code)) {
      continue
    }

    const contains = Boolean(allergen.contains)
    const traces = allergen.traces === undefined ? undefined : Boolean(allergen.traces)

    unique.push({
      code: allergen.code,
      contains,
      traces,
      notes: allergen.notes?.trim() || undefined,
    })
    seen.add(allergen.code)
  }

  return unique
}

function sanitizeItem(item: MenuItem, known: { categories: Set<string>; allergens: Set<MenuAllergen["code"]> }): MenuItem {
  const categoryId = String(item.categoryId)
  if (!known.categories.has(categoryId)) {
    throw new Error(`Categoría de menú desconocida: ${categoryId}`)
  }

  const base: MenuItem = {
    ...item,
    id: String(item.id),
    categoryId,
    name: item.name.trim(),
    description: item.description.trim(),
    priceCents: sanitizePrice(item.priceCents),
    available: Boolean(item.available),
    allergens: normalizeItemAllergens(item.allergens, known.allergens),
  }

  const tags = item.tags?.map((tag) => tag.trim()).filter(Boolean) ?? []
  base.tags = tags.length > 0 ? Array.from(new Set(tags)) : undefined

  base.imageUrl = item.imageUrl?.trim() || undefined

  return base
}

function sanitizePrice(value: number): number {
  if (!Number.isFinite(value)) {
    throw new Error("Precio inválido")
  }

  const price = Math.max(0, Math.round(value))
  return price
}

function sanitizeStoreData(data: Partial<MenuStoreData>): MenuStoreData {
  const metadata = ensureMetadata(data.metadata)

  const categories = (data.categories ?? deepClone(MOCK_MENU_CATEGORIES)).map(sanitizeCategory)
  const categoryIds = new Set(categories.map((category) => category.id))

  const allergensList = sanitizeAllergens(data.allergens ?? deepClone(MOCK_MENU_ALLERGENS))
  const allergenCodes = new Set(allergensList.map((allergen) => allergen.code))

  const items = (data.items ?? deepClone(MOCK_MENU_ITEMS)).map((item) =>
    sanitizeItem(item, { categories: categoryIds, allergens: allergenCodes }),
  )

  return {
    categories,
    items,
    allergens: allergensList,
    metadata,
  }
}

async function ensureDataFile() {
  try {
    await access(DATA_FILE, fsConstants.F_OK)
  } catch {
    await fs.mkdir(DATA_DIR, { recursive: true })
    const store = sanitizeStoreData({})
    await fs.writeFile(DATA_FILE, JSON.stringify(store, null, 2), "utf-8").catch(async (error: NodeJS.ErrnoException) => {
      if (error?.code !== "ENOENT") {
        throw error
      }
      await fs.mkdir(DATA_DIR, { recursive: true })
      await fs.writeFile(DATA_FILE, JSON.stringify(store, null, 2), "utf-8")
    })
  }
}

async function loadStore(): Promise<MenuStoreData> {
  if (cache) {
    return deepClone(cache)
  }

  await ensureDataFile()

  try {
    const raw = await fs.readFile(DATA_FILE, "utf-8")
    const parsed = JSON.parse(raw) as Partial<MenuStoreData>
    cache = sanitizeStoreData(parsed)
    return deepClone(cache)
  } catch (error) {
    logger.warn('Failed to read menu store, using defaults', {
      error: error instanceof Error ? error.message : String(error),
      dataFile: DATA_FILE,
    })
    const fallback = sanitizeStoreData({})
    cache = fallback
    return deepClone(fallback)
  }
}

async function persistStore(data: MenuStoreData) {
  cache = deepClone(data)
  await fs.mkdir(DATA_DIR, { recursive: true })
  await fs.writeFile(DATA_FILE, JSON.stringify(cache, null, 2), "utf-8").catch(async (error: NodeJS.ErrnoException) => {
    if (error?.code !== "ENOENT") {
      throw error
    }
    await fs.mkdir(DATA_DIR, { recursive: true })
    await fs.writeFile(DATA_FILE, JSON.stringify(cache, null, 2), "utf-8")
  })
}

type Mutation<T> = (draft: MenuStoreData) => T | Promise<T>

async function withStoreMutation<T>(mutation: Mutation<T>): Promise<T> {
  const runner = async () => {
    const current = await loadStore()
    const draft = deepClone(current)

    const result = await mutation(draft)

    draft.metadata = {
      ...draft.metadata,
      updatedAt: new Date().toISOString(),
      version: draft.metadata.version + 1,
    }

    await persistStore(draft)

    return result
  }

  const next = writeQueue.then(runner)

  writeQueue = next.then(
    () => undefined,
    (error) => {
      logger.error('Menu store mutation failed', error as Error)
      return undefined
    },
  )

  return next
}

export async function getMenuCatalog(): Promise<MenuResponse> {
  const store = await loadStore()
  const metadata = deepClone(store.metadata)
  return {
    categories: deepClone(store.categories).sort((a, b) => a.sort - b.sort),
    items: deepClone(store.items),
    allergens: deepClone(store.allergens),
    metadata,
  }
}

export async function listMenuCategories(): Promise<MenuCategory[]> {
  const store = await loadStore()
  return deepClone(store.categories).sort((a, b) => a.sort - b.sort)
}

export async function listMenuItems(): Promise<MenuItem[]> {
  const store = await loadStore()
  return deepClone(store.items)
}

export async function listMenuAllergens(): Promise<MenuAllergen[]> {
  const store = await loadStore()
  return deepClone(store.allergens)
}

export async function getMenuItemById(itemId: string): Promise<MenuItem | null> {
  const store = await loadStore()
  const item = store.items.find((entry) => entry.id === itemId)
  return item ? deepClone(item) : null
}

export interface MenuItemUpdate {
  name?: string
  description?: string
  priceCents?: number
  available?: boolean
  tags?: string[]
  imageUrl?: string | null
  allergens?: MenuItemAllergen[]
}

function sanitizeTags(tags?: string[]): string[] | undefined {
  if (!tags) {
    return undefined
  }

  const clean = tags
    .map((tag) => tag.trim())
    .filter(Boolean)

  if (clean.length === 0) {
    return undefined
  }

  return Array.from(new Set(clean))
}

function applyItemUpdate(
  item: MenuItem,
  updates: MenuItemUpdate,
  knownAllergens: Set<MenuAllergen["code"]>,
): MenuItem {
  const next: MenuItem = { ...item }

  if (Object.prototype.hasOwnProperty.call(updates, "name")) {
    const name = updates.name?.trim()
    if (!name) {
      throw new Error("El nombre del plato es obligatorio")
    }
    next.name = name
  }

  if (Object.prototype.hasOwnProperty.call(updates, "description")) {
    const description = updates.description?.trim()
    if (!description) {
      throw new Error("La descripción del plato es obligatoria")
    }
    next.description = description
  }

  if (Object.prototype.hasOwnProperty.call(updates, "priceCents")) {
    if (updates.priceCents === undefined) {
      throw new Error("El precio es obligatorio")
    }
    next.priceCents = sanitizePrice(updates.priceCents)
  }

  if (Object.prototype.hasOwnProperty.call(updates, "available")) {
    next.available = Boolean(updates.available)
  }

  if (Object.prototype.hasOwnProperty.call(updates, "tags")) {
    next.tags = sanitizeTags(updates.tags)
  }

  if (Object.prototype.hasOwnProperty.call(updates, "imageUrl")) {
    const url = updates.imageUrl?.trim()
    next.imageUrl = url && url.length > 0 ? url : undefined
  }

  if (Object.prototype.hasOwnProperty.call(updates, "allergens")) {
    next.allergens = normalizeItemAllergens(updates.allergens, knownAllergens)
  }

  return next
}

export async function updateMenuItem(itemId: string, updates: MenuItemUpdate): Promise<MenuItem> {
  if (!itemId) {
    throw new Error("Se requiere el identificador del plato")
  }

  return withStoreMutation((draft) => {
    const index = draft.items.findIndex((item) => item.id === itemId)
    if (index === -1) {
      throw new Error("Menu item not found")
    }

    const allergenCodes = new Set(draft.allergens.map((allergen) => allergen.code))
    const updated = applyItemUpdate(draft.items[index], updates, allergenCodes)
    draft.items[index] = updated

    return deepClone(updated)
  })
}

export async function getMenuMetadata(): Promise<MenuMetadata> {
  const store = await loadStore()
  return deepClone(store.metadata)
}

export interface MenuItemsSnapshot {
  items: Map<string, MenuItem>
  metadata: MenuMetadata
}

export async function getMenuItemsSnapshot(itemIds: string[]): Promise<MenuItemsSnapshot> {
  const store = await loadStore()
  const metadata = deepClone(store.metadata)
  const itemsMap = new Map<string, MenuItem>()
  const uniqueIds = Array.from(new Set(itemIds.map((id) => String(id))))

  for (const id of uniqueIds) {
    const match = store.items.find((entry) => entry.id === id)
    if (match) {
      itemsMap.set(id, deepClone(match))
    }
  }

  return {
    items: itemsMap,
    metadata,
  }
}

export async function resetMenuStoreCache(): Promise<void> {
  cache = null
}

