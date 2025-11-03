import { afterAll, afterEach, beforeEach, describe, expect, it, vi } from "vitest"
import { promises as fs } from "node:fs"
import path from "node:path"
import type { CreateOrderPayload } from "@/lib/server/order-types"
import { TABLE_STATE } from "@/lib/table-states"

const ordersDataDir = path.join(process.cwd(), ".tmp", "vitest-orders-api")
const dataFilePath = path.join(ordersDataDir, "order-store.json")
const API_URL = "http://localhost/api/order"

interface DiscountRecord {
  scope: string
  amountCents: number
}

interface TaxRecord {
  code: string
  amountCents: number
}

interface OrderItemRecord {
  id: string
  name: string
  quantity: number
  totalCents: number
  discount?: DiscountRecord
  modifiers?: Array<{ name: string; priceCents: number }>
}

interface OrderResponseData {
  id: string
  tableId: string
  status: string
  paymentStatus: string
  subtotal: number
  total: number
  discountTotalCents: number
  taxTotalCents: number
  tipCents: number
  serviceChargeCents: number
  discounts: DiscountRecord[]
  taxes: TaxRecord[]
  items: OrderItemRecord[]
  customer?: { name?: string; email?: string }
}

interface CreateOrderSuccess {
  data: OrderResponseData
  metadata: {
    version: number
    updatedAt: string
  }
}

interface OrdersIndexSuccess {
  data: OrderResponseData[]
  metadata: {
    store: {
      version: number
      updatedAt: string
    }
    summary: {
      total: number
      pendingPayment: number
      byStatus: Record<string, number>
      byPaymentStatus: Record<string, number>
    }
  }
}

interface PersistedOrderStore {
  orders: Array<
    OrderResponseData & {
      createdAt: string
      updatedAt: string
    }
  >
  inventory: Record<string, unknown>
  metadata: {
    version: number
    updatedAt: string
  }
  sequence: number
}

async function resetStores() {
  process.env.RESTAURANT_DATA_DIR = ordersDataDir
  await fs.rm(ordersDataDir, { recursive: true, force: true }).catch(() => undefined)
  await fs.mkdir(ordersDataDir, { recursive: true })
  vi.clearAllMocks()
  vi.resetModules()
  const { resetOrderStoreCache } = await import("@/lib/server/order-store")
  await resetOrderStoreCache()
}

function buildPostRequest(payload: unknown) {
  return new Request(API_URL, {
    method: "POST",
    body: JSON.stringify(payload),
    headers: {
      "content-type": "application/json",
    },
  })
}

function buildGetRequest(query?: string) {
  const url = query ? `${API_URL}?${query}` : API_URL
  return new Request(url)
}

function buildOrderPayload(overrides: Partial<CreateOrderPayload> = {}): CreateOrderPayload {
  const payload: CreateOrderPayload = {
    tableId: overrides.tableId ?? "1",
    items:
      overrides.items ??
      [
        {
          menuItemId: "1",
          quantity: 1,
        },
      ],
  }

  payload.source = overrides.source ?? "staff"

  if (typeof overrides.tipCents === "number") {
    payload.tipCents = overrides.tipCents
  }
  if (typeof overrides.serviceChargeCents === "number") {
    payload.serviceChargeCents = overrides.serviceChargeCents
  }
  if (overrides.discounts) {
    payload.discounts = overrides.discounts
  }
  if (overrides.taxes) {
    payload.taxes = overrides.taxes
  }
  if (overrides.payment) {
    payload.payment = overrides.payment
  }
  if (typeof overrides.notes === "string") {
    payload.notes = overrides.notes
  }
  if (overrides.customer) {
    payload.customer = overrides.customer
  }
  if (overrides.metadata) {
    payload.metadata = overrides.metadata
  }

  return payload
}

async function createOrder(overrides: Partial<CreateOrderPayload> = {}) {
  const { POST } = await import("@/app/api/order/route")
  const response = await POST(buildPostRequest(buildOrderPayload(overrides)))
  const body = (await response.json()) as CreateOrderSuccess
  expect(response.status).toBe(201)
  return body
}

async function mutatePersistedOrders(mutator: (store: PersistedOrderStore) => void) {
  const raw = await fs.readFile(dataFilePath, "utf-8")
  const store = JSON.parse(raw) as PersistedOrderStore
  mutator(store)
  store.metadata.version += 1
  store.metadata.updatedAt = new Date().toISOString()
  await fs.writeFile(dataFilePath, JSON.stringify(store, null, 2), "utf-8")
  const { resetOrderStoreCache } = await import("@/lib/server/order-store")
  await resetOrderStoreCache()
}

afterEach(() => {
  vi.restoreAllMocks()
})

describe("POST /api/order", () => {
  beforeEach(async () => {
    await resetStores()
  })

  it("crea un pedido y devuelve 201 con metadata", async () => {
    const result = await createOrder({
      items: [
        {
          menuItemId: "1",
          quantity: 2,
        },
      ],
    })

    expect(result.data.tableId).toBe("1")
    expect(result.data.subtotal).toBe(3600)
    expect(result.data.total).toBe(4356)
    expect(result.metadata.version).toBeGreaterThan(1)
    expect(new Date(result.metadata.updatedAt).toISOString()).toBe(result.metadata.updatedAt)
  })

  it("calcula totales con descuentos, impuestos, propinas y cargos de servicio", async () => {
    const initial = await createOrder()

    const complex = await createOrder({
      tableId: "2",
      items: [
        {
          menuItemId: "1",
          quantity: 2,
          modifiers: [{ 
            name: "Salsa picante", 
            priceCents: 200,
            groupId: "extras",
            groupName: "Extras",
            optionId: "salsa-picante",
            optionName: "Salsa picante"
          }],
          discount: { type: "percentage", value: 10, scope: "item" },
        },
        {
          menuItemId: "2",
          quantity: 1,
          discount: { type: "fixed", value: 300, scope: "item" },
        },
      ],
      discounts: [
        { type: "percentage", value: 5, code: "PERC5" },
        { type: "fixed", value: 250, reason: "Compensacion" },
      ],
      taxes: [
        { code: "iva", rate: 0.21 },
        { code: "turismo", amountCents: 150 },
      ],
      tipCents: 500,
      serviceChargeCents: 300,
      customer: { name: "Cliente QA" },
      metadata: { origin: "test-suite" },
    })

    expect(complex.metadata.version).toBe(initial.metadata.version + 1)
    expect(new Date(complex.metadata.updatedAt).getTime()).toBeGreaterThan(
      new Date(initial.metadata.updatedAt).getTime(),
    )

    expect(complex.data.total).toBe(6165)
    expect(complex.data.subtotal).toBe(5500)
    expect(complex.data.discountTotalCents).toBe(1190)
    expect(complex.data.taxTotalCents).toBe(1055)
    expect(complex.data.tipCents).toBe(500)
    expect(complex.data.serviceChargeCents).toBe(300)
    expect(complex.data.items[0]?.discount?.amountCents).toBe(400)
    expect(complex.data.items[1]?.discount?.amountCents).toBe(300)

    const discountsByScope = complex.data.discounts.reduce<Record<string, number>>((acc, discount) => {
      acc[discount.scope] = (acc[discount.scope] ?? 0) + 1
      return acc
    }, {})
    expect(discountsByScope.item).toBe(2)
    expect(discountsByScope.order).toBe(2)

    const taxCodes = complex.data.taxes.map((tax) => tax.code).sort()
    expect(taxCodes).toEqual(["iva", "turismo"])
  })

  it("rechaza payload invalido con 400", async () => {
    const { POST } = await import("@/app/api/order/route")

    const response = await POST(
      buildPostRequest({
        tableId: "",
        items: [],
      }),
    )

    expect(response.status).toBe(400)
    const body = (await response.json()) as { error: { code: string; details?: { path?: unknown[] } } }
    expect(body.error.code).toBe("INVALID_PAYLOAD")
    expect(body.error.details?.path).toEqual(["tableId"])
  })

  it("should reject malformed item modifiers (missing modifier name)", async () => {
    const { POST } = await import("@/app/api/order/route")
    const response = await POST(
      buildPostRequest(
        buildOrderPayload({
          items: [
            {
              menuItemId: "1",
              quantity: 1,
              modifiers: [{ 
                name: "", 
                priceCents: -10,
                groupId: "invalid",
                groupName: "Invalid",
                optionId: "invalid",
                optionName: ""
              }],
            },
          ],
        }),
      ),
    )

    expect(response.status).toBe(400)
    const body = (await response.json()) as { error: { code: string; details?: { path?: unknown[] } } }
    expect(body.error.code).toBe("INVALID_PAYLOAD")
    expect(body.error.details?.path).toEqual(["items", 0, "modifiers", 0, "name"])
  })

  it("rechaza descuentos sin valor positivo", async () => {
    const { POST } = await import("@/app/api/order/route")

    const response = await POST(
      buildPostRequest(
        buildOrderPayload({
          discounts: [{ type: "fixed", value: 0 }],
          items: [
            {
              menuItemId: "1",
              quantity: 1,
            },
          ],
        }),
      ),
    )

    expect(response.status).toBe(400)
    const body = (await response.json()) as { error: { code: string; details?: { path?: unknown[] } } }
    expect(body.error.code).toBe("INVALID_PAYLOAD")
    expect(body.error.details?.path).toEqual(["discounts", 0, "value"])
  })

  it("retorna 404 si la mesa no existe", async () => {
    const { POST } = await import("@/app/api/order/route")

    const response = await POST(
      buildPostRequest({
        tableId: "999",
        items: [{ menuItemId: "1", quantity: 1 }],
      }),
    )

    expect(response.status).toBe(404)
    const body = (await response.json()) as { error: { code: string } }
    expect(body.error.code).toBe("TABLE_NOT_FOUND")
  })

  it("retorna 404 si un producto no existe", async () => {
    const { POST } = await import("@/app/api/order/route")

    const response = await POST(
      buildPostRequest({
        tableId: "1",
        items: [{ menuItemId: "999", quantity: 1 }],
      }),
    )

    expect(response.status).toBe(404)
    const body = (await response.json()) as { error: { code: string } }
    expect(body.error.code).toBe("MENU_ITEM_NOT_FOUND")
  })

  it("retorna 409 si no hay stock suficiente", async () => {
    const { POST } = await import("@/app/api/order/route")

    const response = await POST(
      buildPostRequest({
        tableId: "1",
        items: [{ menuItemId: "1", quantity: 100 }],
      }),
    )

    expect(response.status).toBe(409)
    const body = (await response.json()) as { error: { code: string } }
    expect(body.error.code).toBe("STOCK_INSUFFICIENT")
  })

  it("retorna 409 si la mesa esta en un estado que no admite pedidos", async () => {
    const tableStore = await import("@/lib/server/table-store")
    await tableStore.updateTableState("1", TABLE_STATE.OCCUPIED)
    await tableStore.updateTableState("1", TABLE_STATE.BILL_REQUESTED)

    const { POST } = await import("@/app/api/order/route")
    const response = await POST(
      buildPostRequest({
        tableId: "1",
        items: [{ menuItemId: "1", quantity: 1 }],
      }),
    )

    expect(response.status).toBe(409)
    const body = (await response.json()) as { error: { code: string; details?: { status?: string } } }
    expect(body.error.code).toBe("TABLE_STATE_CONFLICT")
    expect(body.error.details?.status).toBe(TABLE_STATE.BILL_REQUESTED)
  })

  it("retorna TABLE_UPDATE_FAILED cuando la transicion de mesa falla", async () => {
    const tableStore = await import("@/lib/server/table-store")
    const updateSpy = vi.spyOn(tableStore, "updateTableState").mockRejectedValue(new Error("offline"))

    const { POST } = await import("@/app/api/order/route")
    const response = await POST(
      buildPostRequest({
        tableId: "1",
        items: [{ menuItemId: "1", quantity: 1 }],
      }),
    )

    expect(response.status).toBe(500)
    const body = (await response.json()) as { error: { code: string } }
    expect(body.error.code).toBe("TABLE_UPDATE_FAILED")
    expect(updateSpy).toHaveBeenCalled()
  })

  it("devuelve 500 si falla la persistencia", async () => {
    const writeSpy = vi.spyOn(fs, "writeFile").mockRejectedValueOnce(new Error("disk full"))

    const { POST } = await import("@/app/api/order/route")
    const response = await POST(
      buildPostRequest({
        tableId: "1",
        items: [{ menuItemId: "1", quantity: 1 }],
      }),
    )

    expect(response.status).toBe(500)
    const body = (await response.json()) as { error: { code: string } }
    expect(body.error.code).toBe("INTERNAL_ERROR")

    expect(writeSpy).toHaveBeenCalled()
  })
})

describe("GET /api/order", () => {
  beforeEach(async () => {
    await resetStores()
  })

  it("devuelve lista vacia y resumen en cero cuando no hay datos", async () => {
    const { GET } = await import("@/app/api/order/route")
    const response = await GET(buildGetRequest())

    expect(response.status).toBe(200)
    const body = (await response.json()) as OrdersIndexSuccess
    expect(body.data).toEqual([])
    expect(body.metadata.summary.total).toBe(0)
    expect(body.metadata.summary.pendingPayment).toBe(0)
  })

  it("permite buscar por id, mesa, item o cliente", async () => {
    const order = await createOrder({
      tableId: "6",
      customer: { name: "Lucia QA", email: "lucia@example.com" },
      items: [
        {
          menuItemId: "1",
          quantity: 1,
        },
      ],
    })
    const { GET } = await import("@/app/api/order/route")

    const orderIdFragment = order.data.id.split("-")[1] ?? order.data.id
    const searchById = await GET(buildGetRequest(`search=${orderIdFragment}`))
    const byIdBody = (await searchById.json()) as OrdersIndexSuccess
    expect(byIdBody.data[0]?.id).toBe(order.data.id)

    const searchByTable = await GET(buildGetRequest("search=6"))
    const byTableBody = (await searchByTable.json()) as OrdersIndexSuccess
    expect(byTableBody.data[0]?.tableId).toBe("6")

    const searchByItem = await GET(buildGetRequest("search=empanadas"))
    const byItemBody = (await searchByItem.json()) as OrdersIndexSuccess
    expect(byItemBody.data[0]?.items[0]?.name.toLowerCase()).toContain("empanadas")

    const searchByCustomer = await GET(buildGetRequest("search=lucia"))
    const byCustomerBody = (await searchByCustomer.json()) as OrdersIndexSuccess
    expect(byCustomerBody.data[0]?.customer?.name).toBe("Lucia QA")
  })

  it("aplica filtros combinados de estado, pago, mesa y search", async () => {
    await createOrder({
      tableId: "1",
      customer: { name: "Ana" },
    })
    await createOrder({
      tableId: "2",
      customer: { name: "Gina" },
      items: [{ menuItemId: "2", quantity: 1 }],
      payment: { method: "tarjeta", amountCents: 1500, status: "pagado" },
    })
    await createOrder({
      tableId: "3",
      customer: { name: "Hugo" },
      items: [{ menuItemId: "3", quantity: 1 }],
      payment: { method: "efectivo", status: "cancelado" },
    })

    await mutatePersistedOrders((store) => {
      for (const order of store.orders) {
        if (order.tableId === "1") {
          order.status = "preparando"
        } else if (order.tableId === "2") {
          order.status = "listo"
        } else if (order.tableId === "3") {
          order.status = "cerrado"
        }
      }
    })

    const params = new URLSearchParams()
    params.append("status", "preparando")
    params.append("status", "listo")
    params.set("paymentStatus", "pagado")
    params.set("tableId", "2")
    params.set("search", "gina")

    const { GET } = await import("@/app/api/order/route")
    const response = await GET(buildGetRequest(params.toString()))

    expect(response.status).toBe(200)
    const body = (await response.json()) as OrdersIndexSuccess
    expect(body.data).toHaveLength(1)
    expect(body.data[0]?.tableId).toBe("2")
    expect(body.data[0]?.status).toBe("listo")
    expect(body.metadata.summary.total).toBe(1)
    expect(body.metadata.summary.byStatus.listo).toBe(1)
    expect(body.metadata.summary.byPaymentStatus.pagado).toBe(1)
    expect(body.metadata.summary.pendingPayment).toBe(0)
  })

  it("ordena y limita resultados respetando metadata de resumen", async () => {
    const first = await createOrder({ tableId: "1" })
    await new Promise((resolve) => setTimeout(resolve, 5))
    const second = await createOrder({ tableId: "2" })
    await new Promise((resolve) => setTimeout(resolve, 5))
    await createOrder({ tableId: "3" })

    const { GET } = await import("@/app/api/order/route")
    const response = await GET(buildGetRequest("limit=2&sort=oldest"))

    expect(response.status).toBe(200)
    const body = (await response.json()) as OrdersIndexSuccess
    expect(body.data).toHaveLength(2)
    const ids = body.data.map((order) => order.id)
    expect(ids).toContain(first.data.id)
    expect(ids).toContain(second.data.id)
    expect(body.metadata.summary.total).toBe(3)
    expect(body.metadata.summary.pendingPayment).toBe(3)
  })

  it("actualiza el resumen global tras crear pedidos", async () => {
    await createOrder({ tableId: "1" })
    await createOrder({
      tableId: "2",
      payment: { method: "tarjeta", status: "pagado", amountCents: 1500 },
    })

    await mutatePersistedOrders((store) => {
      for (const order of store.orders) {
        if (order.tableId === "1") {
          order.status = "entregado"
        } else if (order.tableId === "2") {
          order.status = "cerrado"
        }
      }
    })

    const { GET } = await import("@/app/api/order/route")
    const response = await GET(buildGetRequest())

    expect(response.status).toBe(200)
    const body = (await response.json()) as OrdersIndexSuccess
    expect(body.metadata.summary.total).toBe(2)
    expect(body.metadata.summary.byStatus.entregado).toBe(1)
    expect(body.metadata.summary.byStatus.cerrado).toBe(1)
    expect(body.metadata.summary.byPaymentStatus.pagado).toBe(1)
    expect(body.metadata.summary.pendingPayment).toBe(1)
  })

  it("rechaza parametros invalidos con detalle en INVALID_QUERY", async () => {
    const { GET } = await import("@/app/api/order/route")

    const response = await GET(buildGetRequest("limit=-1"))

    expect(response.status).toBe(400)
    const body = (await response.json()) as { error: { code: string; details?: { path?: unknown[] } } }
    expect(body.error.code).toBe("INVALID_QUERY")
    expect(body.error.details?.path).toEqual(["limit"])
  })
})

afterAll(async () => {
  await fs.rm(ordersDataDir, { recursive: true, force: true }).catch(() => undefined)
  delete process.env.RESTAURANT_DATA_DIR
})
