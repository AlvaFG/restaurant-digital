/**
 * @deprecated Este archivo está deprecado y solo debe usarse en tests.
 * Los datos reales deben obtenerse de Supabase usando los servicios en lib/services/
 * 
 * Ver docs/LEGACY_DEPRECATION.md para más información.
 */

import { TABLE_STATE, TABLE_STATE_COLORS, TABLE_STATE_LABELS, type TableState } from "./table-states"
import type { ModifierGroup, CartItemModifier } from "@/app/(public)/qr/_types/modifiers"

export interface Zone {
  id: string
  name: string
  admin_id?: string
  tenant_id?: string
  active?: boolean
  created_at?: string
  // Campos calculados
  table_count?: number
}

export interface TableCovers {
  current: number
  total: number
  sessions: number
  lastUpdatedAt: string | null
  lastSessionAt: string | null
}

export interface Table {
  id: string
  number: string  // Cambiado de number a string para permitir "Mesa 1", "M1", etc.
  zone_id?: string  // FK a zones.id
  zone?: Zone | string  // Puede ser el objeto completo o solo el nombre (backward compatibility)
  status: TableState
  seats?: number
  covers: TableCovers
  qrcodeUrl?: string
  qrToken?: string
  qrTokenExpiry?: Date
}

export interface Alert {
  id: string
  tableId: string
  type: "llamar_mozo" | "pedido_entrante" | "quiere_pagar_efectivo" | "pago_aprobado"
  createdAt: Date
  acknowledged?: boolean
  message: string
}

export interface Order {
  id: string
  tableId: string
  items: Array<{
    id: string
    name: string
    quantity: number
    price: number
    modifiers?: CartItemModifier[]
    notes?: string
  }>
  subtotal: number
  total: number
  status: "abierto" | "preparando" | "listo" | "entregado" | "cerrado"
  paymentStatus: "pendiente" | "pagado" | "cancelado"
  createdAt: Date
}

export interface TableMapLayout {
  zones: Array<{
    id: string
    name: string
    color: string
  }>
  nodes: Array<{
    id: string
    tableId: string
    x: number
    y: number
    width: number
    height: number
    shape: "rectangle" | "circle"
    zone: string
  }>
  visualZones?: Array<{
    id: string
    name: string
    type: 'rectangle' | 'circle' | 'polygon'
    x: number
    y: number
    width?: number
    height?: number
    radius?: number
    points?: number[]
    fill: string
    stroke: string
    opacity: number
  }>
}

export type AllergenCode =
  | "gluten"
  | "lacteos"
  | "huevo"
  | "frutos_secos"
  | "soja"
  | "pescado"
  | "mariscos"
  | "sulfitos"

export interface MenuAllergen {
  code: AllergenCode
  name: string
  description?: string
  icon?: string
}

export interface MenuItemAllergen {
  code: AllergenCode
  contains: boolean
  traces?: boolean
  notes?: string
}

export interface MenuCategory {
  id: string
  name: string
  sort: number
  description?: string
}

export interface MenuItem {
  id: string
  categoryId: string
  name: string
  description: string
  priceCents: number
  available: boolean
  allergens: MenuItemAllergen[]
  tags?: string[]
  imageUrl?: string
  modifierGroups?: ModifierGroup[]
}

export interface MenuMetadata {
  currency: string
  version: number
  updatedAt: string
}

export interface MenuResponse {
  categories: MenuCategory[]
  items: MenuItem[]
  allergens: MenuAllergen[]
  metadata: MenuMetadata
}

// Mock data
export const MOCK_TABLES: Table[] = [
  { id: "1", number: "1", zone: "Salon Principal", status: TABLE_STATE.FREE, seats: 4, covers: { current: 0, total: 0, sessions: 0, lastUpdatedAt: null, lastSessionAt: null } },
  { id: "2", number: "2", zone: "Salon Principal", status: TABLE_STATE.OCCUPIED, seats: 2, covers: { current: 0, total: 0, sessions: 0, lastUpdatedAt: null, lastSessionAt: null } },
  { id: "3", number: "3", zone: "Salon Principal", status: TABLE_STATE.ORDER_IN_PROGRESS, seats: 6, covers: { current: 0, total: 0, sessions: 0, lastUpdatedAt: null, lastSessionAt: null } },
  { id: "4", number: "4", zone: "Terraza", status: TABLE_STATE.BILL_REQUESTED, seats: 4, covers: { current: 0, total: 0, sessions: 0, lastUpdatedAt: null, lastSessionAt: null } },
  { id: "5", number: "5", zone: "Terraza", status: TABLE_STATE.PAYMENT_CONFIRMED, seats: 2, covers: { current: 0, total: 0, sessions: 0, lastUpdatedAt: null, lastSessionAt: null } },
  { id: "6", number: "6", zone: "Terraza", status: TABLE_STATE.FREE, seats: 8, covers: { current: 0, total: 0, sessions: 0, lastUpdatedAt: null, lastSessionAt: null } },
]

export const MOCK_ALERTS: Alert[] = [
  {
    id: "1",
    tableId: "2",
    type: "llamar_mozo",
    createdAt: new Date(Date.now() - 5 * 60 * 1000),
    message: "Mesa 2 solicita atención",
  },
  {
    id: "2",
    tableId: "4",
    type: "quiere_pagar_efectivo",
    createdAt: new Date(Date.now() - 2 * 60 * 1000),
    message: "Mesa 4 quiere pagar en efectivo",
  },
  {
    id: "3",
    tableId: "3",
    type: "pedido_entrante",
    createdAt: new Date(Date.now() - 10 * 60 * 1000),
    acknowledged: true,
    message: "Nuevo pedido en Mesa 3",
  },
]

export const MOCK_ORDERS: Order[] = [
  {
    id: "1",
    tableId: "3",
    items: [
      { id: "1", name: "Milanesa con papas", quantity: 2, price: 2500 },
      { id: "2", name: "Ensalada mixta", quantity: 1, price: 1200 },
    ],
    subtotal: 6200,
    total: 6200,
    status: "preparando",
    paymentStatus: "pendiente",
    createdAt: new Date(Date.now() - 30 * 60 * 1000),
  },
  {
    id: "2",
    tableId: "4",
    items: [
      { id: "3", name: "Bife de chorizo", quantity: 1, price: 3500 },
      { id: "4", name: "Vino tinto", quantity: 1, price: 2800 },
    ],
    subtotal: 6300,
    total: 6300,
    status: "listo",
    paymentStatus: "pendiente",
    createdAt: new Date(Date.now() - 45 * 60 * 1000),
  },
]

export const MOCK_MENU_ALLERGENS: MenuAllergen[] = [
  {
    code: "gluten",
    name: "Gluten",
    description: "Cereales que contienen gluten (trigo, cebada, centeno).",
  },
  {
    code: "lacteos",
    name: "Lácteos",
    description: "Leche y derivados como queso o crema.",
  },
  {
    code: "huevo",
    name: "Huevo",
    description: "Huevos y productos derivados.",
  },
  {
    code: "frutos_secos",
    name: "Frutos secos",
    description: "Nueces, almendras y otros frutos secos.",
  },
  {
    code: "soja",
    name: "Soja",
    description: "Soja y productos basados en soja.",
  },
  {
    code: "pescado",
    name: "Pescado",
    description: "Pescados y derivados.",
  },
  {
    code: "mariscos",
    name: "Mariscos",
    description: "Crustáceos y moluscos.",
  },
  {
    code: "sulfitos",
    name: "Sulfitos",
    description: "Aditivos conservantes a base de sulfito.",
  },
]

export const MOCK_MENU_CATEGORIES: MenuCategory[] = [
  { id: "1", name: "Entradas", sort: 1 },
  { id: "2", name: "Platos Principales", sort: 2 },
  { id: "3", name: "Postres", sort: 3 },
  { id: "4", name: "Bebidas", sort: 4 },
]

export const MOCK_MENU_ITEMS: MenuItem[] = [
  {
    id: "1",
    categoryId: "1",
    name: "Empanadas",
    description: "Empanadas caseras (x6)",
    priceCents: 1800,
    available: true,
    allergens: [
      { code: "gluten", contains: true },
      { code: "huevo", contains: true },
    ],
  },
  {
    id: "2",
    categoryId: "1",
    name: "Provoleta",
    description: "Provoleta a la parrilla",
    priceCents: 1500,
    available: true,
    allergens: [{ code: "lacteos", contains: true }],
  },
  {
    id: "3",
    categoryId: "2",
    name: "Milanesa con papas",
    description: "Milanesa napolitana con papas fritas",
    priceCents: 2500,
    available: true,
    allergens: [
      { code: "gluten", contains: true },
      { code: "huevo", contains: true },
      { code: "lacteos", contains: true },
    ],
    modifierGroups: [
      {
        id: "milanesa-type",
        name: "Tipo de milanesa",
        required: true,
        minSelection: 1,
        maxSelection: 1,
        options: [
          { id: "napolitana", name: "Napolitana", priceCents: 0, available: true, description: "Con jamón, queso y salsa" },
          { id: "simple", name: "Simple", priceCents: -300, available: true, description: "Sin cobertura" },
          { id: "caballo", name: "A caballo", priceCents: 200, available: true, description: "Con huevo frito" },
        ],
      },
      {
        id: "side-options",
        name: "Acompañamiento",
        required: false,
        minSelection: 0,
        maxSelection: 2,
        description: "Elige hasta 2 acompañamientos adicionales",
        options: [
          { id: "ensalada", name: "Ensalada mixta", priceCents: 400, available: true },
          { id: "pure", name: "Puré de papas", priceCents: 300, available: true },
          { id: "arroz", name: "Arroz", priceCents: 300, available: true },
        ],
      },
    ],
  },
  {
    id: "4",
    categoryId: "2",
    name: "Bife de chorizo",
    description: "Bife de chorizo 400g",
    priceCents: 3500,
    available: true,
    allergens: [],
    modifierGroups: [
      {
        id: "meat-cooking",
        name: "Punto de cocción",
        required: true,
        minSelection: 1,
        maxSelection: 1,
        description: "Elige cómo prefieres tu carne",
        options: [
          { id: "rare", name: "Jugoso", priceCents: 0, available: true, description: "Rojo en el centro" },
          { id: "medium", name: "A punto", priceCents: 0, available: true, description: "Rosado en el centro" },
          { id: "well", name: "Bien cocido", priceCents: 0, available: true, description: "Sin rosado" },
        ],
      },
      {
        id: "meat-extras",
        name: "Extras",
        required: false,
        minSelection: 0,
        maxSelection: 3,
        description: "Agrega tus favoritos",
        options: [
          { id: "chimichurri", name: "Chimichurri", priceCents: 100, available: true },
          { id: "morrones", name: "Morrones asados", priceCents: 200, available: true },
          { id: "champignones", name: "Champiñones", priceCents: 300, available: true },
          { id: "queso-azul", name: "Salsa de queso azul", priceCents: 400, available: true },
        ],
      },
    ],
  },
  {
    id: "5",
    categoryId: "2",
    name: "Pasta con salsa",
    description: "Fideos con salsa bolognesa",
    priceCents: 2200,
    available: true,
    allergens: [
      { code: "gluten", contains: true },
      { code: "soja", contains: false, traces: true },
    ],
  },
  {
    id: "6",
    categoryId: "3",
    name: "Flan casero",
    description: "Flan con dulce de leche",
    priceCents: 800,
    available: true,
    allergens: [
      { code: "lacteos", contains: true },
      { code: "huevo", contains: true },
    ],
  },
  {
    id: "7",
    categoryId: "3",
    name: "Tiramisu",
    description: "Tiramisu italiano",
    priceCents: 1200,
    available: true,
    allergens: [
      { code: "gluten", contains: true },
      { code: "lacteos", contains: true },
      { code: "huevo", contains: true },
    ],
  },
  {
    id: "8",
    categoryId: "4",
    name: "Coca Cola",
    description: "Coca Cola 500ml",
    priceCents: 600,
    available: true,
    allergens: [],
    modifierGroups: [
      {
        id: "drink-size",
        name: "Tamaño",
        required: true,
        minSelection: 1,
        maxSelection: 1,
        options: [
          { id: "small", name: "Chica (250ml)", priceCents: -200, available: true },
          { id: "medium", name: "Mediana (500ml)", priceCents: 0, available: true },
          { id: "large", name: "Grande (1L)", priceCents: 300, available: true },
        ],
      },
      {
        id: "drink-temperature",
        name: "Temperatura",
        required: false,
        minSelection: 0,
        maxSelection: 1,
        options: [
          { id: "cold", name: "Bien fría", priceCents: 0, available: true },
          { id: "no-ice", name: "Sin hielo", priceCents: 0, available: true },
        ],
      },
    ],
  },
  {
    id: "9",
    categoryId: "4",
    name: "Vino tinto",
    description: "Vino tinto de la casa",
    priceCents: 2800,
    available: true,
    allergens: [{ code: "sulfitos", contains: true }],
  },
]

// Analytics mock data
export const MOCK_ANALYTICS = {
  dailySales: 125000,
  averageTicket: 2800,
  occupancyRate: 75,
  topDishes: [
    { name: "Milanesa con papas", orders: 15 },
    { name: "Bife de chorizo", orders: 12 },
    { name: "Ensalada César", orders: 8 },
    { name: "Pasta con salsa", orders: 7 },
    { name: "Pizza margherita", orders: 6 },
  ],
  preparationTimes: [
    { time: "12:00", avgMinutes: 18 },
    { time: "13:00", avgMinutes: 22 },
    { time: "14:00", avgMinutes: 25 },
    { time: "15:00", avgMinutes: 20 },
    { time: "16:00", avgMinutes: 15 },
  ],
  npsScore: 8.5,
}

export const MOCK_TABLE_LAYOUT: TableMapLayout = {
  zones: [
    { id: "salon", name: "Salón Principal", color: "#e3f2fd" },
    { id: "terraza", name: "Terraza", color: "#f3e5f5" },
  ],
  nodes: [
    { id: "node-1", tableId: "1", x: 50, y: 50, width: 80, height: 60, shape: "rectangle", zone: "salon" },
    { id: "node-2", tableId: "2", x: 200, y: 50, width: 60, height: 60, shape: "circle", zone: "salon" },
    { id: "node-3", tableId: "3", x: 350, y: 50, width: 100, height: 80, shape: "rectangle", zone: "salon" },
    { id: "node-4", tableId: "4", x: 50, y: 200, width: 80, height: 60, shape: "rectangle", zone: "terraza" },
    { id: "node-5", tableId: "5", x: 200, y: 200, width: 60, height: 60, shape: "circle", zone: "terraza" },
    { id: "node-6", tableId: "6", x: 350, y: 200, width: 120, height: 80, shape: "rectangle", zone: "terraza" },
  ],
}

export const TABLE_STATUS_COLORS = TABLE_STATE_COLORS
export const TABLE_STATUS_LABELS = TABLE_STATE_LABELS

export const ALERT_PRIORITIES = {
  quiere_pagar_efectivo: 1,
  llamar_mozo: 2,
  pedido_entrante: 3,
  pago_aprobado: 4,
} as const

export const ALERT_TYPE_LABELS = {
  llamar_mozo: "Llamar Mozo",
  pedido_entrante: "Pedido Entrante",
  quiere_pagar_efectivo: "Pago en Efectivo",
  pago_aprobado: "Pago Aprobado",
} as const

export const ALERT_TYPE_COLORS = {
  llamar_mozo: "#f59e0b", // amber
  pedido_entrante: "#3b82f6", // blue
  quiere_pagar_efectivo: "#ef4444", // red
  pago_aprobado: "#10b981", // green
} as const

export class TableService {
  static async invitarLaCasa(tableId: string): Promise<void> {
    console.log(`[MOCK] Invitando la casa para mesa ${tableId}`)
    // Mock: Close order with $0 total, mark reason=house_comp
    // Emit: order.updated, table.updated
  }

  static async resetearMesa(tableId: string): Promise<void> {
    console.log(`[MOCK] Reseteando mesa ${tableId}`)
    // Mock: Cancel open order, set table status to libre
    // Emit: order.updated, table.updated
  }

  static async updateTableLayout(layout: TableMapLayout): Promise<void> {
    console.log(`[MOCK] Guardando layout de mesas`, layout)
    // Mock: Save layout to backend
  }
}

export class OrderService {
  private static async loadMenuItems(menuItemIds: string[]): Promise<Map<string, MenuItem>> {
    const uniqueIds = Array.from(new Set(menuItemIds.map((id) => String(id))))

    if (uniqueIds.length === 0) {
      return new Map<string, MenuItem>()
    }

    if (typeof window === "undefined") {
      // Legacy code removed - now using Supabase menu-service
      // const { getMenuItemsSnapshot } = await import("@/lib/server/menu-store")
      // const snapshot = await getMenuItemsSnapshot(uniqueIds)
      // return snapshot.items
    }

    const fallbackMap = new Map<string, MenuItem>()
    for (const id of uniqueIds) {
      const match = MOCK_MENU_ITEMS.find((item) => item.id === id)
      if (match) {
        fallbackMap.set(id, match)
      }
    }

    return fallbackMap
  }

  static async createOrder(
    tableId: string,
    items: Array<{ menuItemId: string; quantity: number; modifiers?: CartItemModifier[]; notes?: string }>,
  ): Promise<Order> {
    console.log("[MOCK] Creating order for table " + tableId, items)

    const ids = items.map((item) => String(item.menuItemId))
    const menuItemsMap = await this.loadMenuItems(ids)
    const missing = Array.from(new Set(ids.filter((id) => !menuItemsMap.has(id))))

    if (missing.length > 0) {
      throw new Error("Menu item not found: " + missing[0])
    }

    const orderItems = items.map((item) => {
      const menuItem = menuItemsMap.get(String(item.menuItemId))!
      
      // Calculate total price including modifiers
      const basePrice = menuItem.priceCents
      const modifiersPrice = (item.modifiers ?? []).reduce((sum, mod) => sum + mod.priceCents, 0)
      const totalPrice = basePrice + modifiersPrice

      return {
        id: menuItem.id,
        name: menuItem.name,
        quantity: item.quantity,
        price: totalPrice,
        modifiers: item.modifiers,
        notes: item.notes,
      }
    })

    const subtotal = orderItems.reduce((sum, item) => sum + item.price * item.quantity, 0)

    const newOrder: Order = {
      id: "order-" + Date.now(),
      tableId,
      items: orderItems,
      subtotal,
      total: subtotal,
      status: "abierto",
      paymentStatus: "pendiente",
      createdAt: new Date(),
    }

    // Mock: emit order.created event
    console.log("[MOCK] Emitting order.created event", newOrder)

    return newOrder
  }

  static async updateOrderStatus(orderId: string, status: Order["status"]): Promise<void> {
    console.log("[MOCK] Updating order " + orderId + " status to " + status)
    // Mock: emit order.updated event
  }
}

type AlertSocketEvent = "alert.created" | "alert.updated" | "alert.acknowledged"

type SocketBusLike = {
  publish: <TEvent extends AlertSocketEvent>(
    event: TEvent,
    payload: import("@/lib/socket-events").SocketEventPayload<TEvent>,
  ) => void
}

function getServerSocketBus(): SocketBusLike | null {
  if (typeof window !== "undefined") {
    return null
  }
  const globalAny = globalThis as unknown as { __SOCKET_BUS__?: { bus?: SocketBusLike } }
  return globalAny.__SOCKET_BUS__?.bus ?? null
}

function serializeAlertForSocket(alert: Alert) {
  return {
    id: alert.id,
    tableId: alert.tableId,
    type: alert.type,
    message: alert.message,
    createdAt: alert.createdAt instanceof Date ? alert.createdAt.toISOString() : new Date(alert.createdAt).toISOString(),
    acknowledged: Boolean(alert.acknowledged),
  }
}

export class AlertService {
  static async createAlert(tableId: string, type: Alert["type"], message: string): Promise<Alert> {
    const newAlert: Alert = {
      id: "alert-" + Date.now().toString(),
      tableId,
      type,
      message,
      createdAt: new Date(),
      acknowledged: false,
    }

    MOCK_ALERTS.unshift(newAlert)

    const bus = getServerSocketBus()
    if (bus) {
      try {
        bus.publish("alert.created", { alert: serializeAlertForSocket(newAlert) })
      } catch (error) {
        console.error("[alert-service] Failed to broadcast alert.created", error)
      }
    }

    return newAlert
  }

  static async acknowledgeAlert(alertId: string): Promise<void> {
    const target = MOCK_ALERTS.find((alert) => alert.id === alertId)
    if (target) {
      target.acknowledged = true
    }

    const bus = getServerSocketBus()
    if (bus) {
      try {
        bus.publish("alert.updated", { alertId, acknowledged: true })
        bus.publish("alert.acknowledged", { alertId, acknowledged: true })
      } catch (error) {
        console.error("[alert-service] Failed to broadcast alert acknowledgement", error)
      }
    }
  }

  static async getActiveAlerts(): Promise<Alert[]> {
    return MOCK_ALERTS.filter((alert) => !alert.acknowledged)
  }
}


