export const TABLE_STATE_CODES = [
  "libre",
  "ocupada",
  "pedido_en_curso",
  "cuenta_solicitada",
  "pago_confirmado",
] as const

export type TableState = (typeof TABLE_STATE_CODES)[number]

export const TABLE_STATE = {
  FREE: "libre",
  OCCUPIED: "ocupada",
  ORDER_IN_PROGRESS: "pedido_en_curso",
  BILL_REQUESTED: "cuenta_solicitada",
  PAYMENT_CONFIRMED: "pago_confirmado",
} as const satisfies Record<string, TableState>

export const TABLE_STATE_LABELS: Record<TableState, string> = {
  libre: "Libre",
  ocupada: "Ocupada",
  pedido_en_curso: "Pedido en curso",
  cuenta_solicitada: "Cuenta solicitada",
  pago_confirmado: "Pago confirmado",
} as const

export const TABLE_STATE_DESCRIPTIONS: Record<TableState, string> = {
  libre: "Mesa disponible para asignar",
  ocupada: "Clientes sentados sin pedido registrado",
  pedido_en_curso: "Pedido activo asociado a la mesa",
  cuenta_solicitada: "La mesa pidio la cuenta",
  pago_confirmado: "Pago finalizado, pendiente de liberar mesa",
} as const

export const TABLE_STATE_COLORS: Record<TableState, string> = {
  libre: "#10b981",
  ocupada: "#f59e0b",
  pedido_en_curso: "#3b82f6",
  cuenta_solicitada: "#8b5cf6",
  pago_confirmado: "#06b6d4",
} as const

export const TABLE_STATE_BADGE_VARIANT: Record<TableState, "default" | "secondary" | "outline" | "destructive"> = {
  libre: "default",
  ocupada: "secondary",
  pedido_en_curso: "default",
  cuenta_solicitada: "destructive",
  pago_confirmado: "default",
} as const

export const TABLE_STATE_TRANSITIONS: Record<TableState, TableState[]> = {
  libre: [TABLE_STATE.OCCUPIED],
  ocupada: [TABLE_STATE.ORDER_IN_PROGRESS, TABLE_STATE.BILL_REQUESTED],
  pedido_en_curso: [TABLE_STATE.BILL_REQUESTED, TABLE_STATE.PAYMENT_CONFIRMED],
  cuenta_solicitada: [TABLE_STATE.PAYMENT_CONFIRMED],
  pago_confirmado: [TABLE_STATE.FREE],
} as const

const LEGACY_ALIASES: Record<string, TableState> = {
  pidio: TABLE_STATE.ORDER_IN_PROGRESS,
  "pid\u00F3": TABLE_STATE.ORDER_IN_PROGRESS,
  pidiA3: TABLE_STATE.ORDER_IN_PROGRESS,
  pedido: TABLE_STATE.ORDER_IN_PROGRESS,
}

export function isTableState(value: string): value is TableState {
  return TABLE_STATE_CODES.includes(value as TableState)
}

export function coerceTableState(value: string): TableState {
  if (!value) return TABLE_STATE.FREE

  const normalized = value.trim().toLowerCase()

  if (isTableState(normalized)) {
    return normalized
  }

  return LEGACY_ALIASES[normalized] ?? TABLE_STATE.FREE
}