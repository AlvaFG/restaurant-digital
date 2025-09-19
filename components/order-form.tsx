"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import { MOCK_MENU_CATEGORIES, MOCK_MENU_ITEMS, OrderService, type MenuItem, type Table } from "@/lib/mock-data"
import { TABLE_STATE, TABLE_STATE_LABELS } from "@/lib/table-states"
import { fetchTables } from "@/lib/table-service"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Separator } from "@/components/ui/separator"
import { ScrollArea } from "@/components/ui/scroll-area"
import { LoadingSpinner } from "@/components/loading-spinner"
import { Plus, Minus, ShoppingCart, X } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

interface OrderItem {
  menuItem: MenuItem
  quantity: number
}

export function OrderForm() {
  const [tables, setTables] = useState<Table[]>([])
  const [tablesLoading, setTablesLoading] = useState(true)
  const [tablesError, setTablesError] = useState<string | null>(null)
  const [selectedTableId, setSelectedTableId] = useState<string>("")
  const [selectedCategory, setSelectedCategory] = useState<string>("all")
  const [orderItems, setOrderItems] = useState<OrderItem[]>([])
  const [isSubmitting, setIsSubmitting] = useState(false)
  const { toast } = useToast()

  const loadTables = useCallback(async () => {
    setTablesLoading(true)
    setTablesError(null)
    try {
      const response = await fetchTables()
      setTables(response.data)
    } catch (error) {
      console.error("[OrderForm] Failed to load tables", error)
      setTablesError("No se pudieron cargar las mesas")
    } finally {
      setTablesLoading(false)
    }
  }, [])

  useEffect(() => {
    void loadTables()
  }, [loadTables])

  const availableTables = useMemo(
    () => tables.filter((table) => table.status === TABLE_STATE.FREE || table.status === TABLE_STATE.OCCUPIED),
    [tables],
  )

  const filteredMenuItems = useMemo(() => {
    if (selectedCategory !== "all") {
      return MOCK_MENU_ITEMS.filter((item) => item.categoryId === selectedCategory && item.available)
    }
    return MOCK_MENU_ITEMS.filter((item) => item.available)
  }, [selectedCategory])

  const addToOrder = (menuItem: MenuItem) => {
    setOrderItems((current) => {
      const existing = current.find((item) => item.menuItem.id === menuItem.id)
      if (existing) {
        return current.map((item) =>
          item.menuItem.id === menuItem.id ? { ...item, quantity: item.quantity + 1 } : item,
        )
      }
      return [...current, { menuItem, quantity: 1 }]
    })
  }

  const updateQuantity = (menuItemId: string, quantity: number) => {
    setOrderItems((current) => {
      if (quantity <= 0) {
        return current.filter((item) => item.menuItem.id !== menuItemId)
      }
      return current.map((item) => (item.menuItem.id === menuItemId ? { ...item, quantity } : item))
    })
  }

  const removeFromOrder = (menuItemId: string) => {
    setOrderItems((current) => current.filter((item) => item.menuItem.id !== menuItemId))
  }

  const calculateTotal = () => orderItems.reduce((sum, item) => sum + item.menuItem.priceCents * item.quantity, 0)

  const handleSubmit = async () => {
    if (!selectedTableId || orderItems.length === 0) {
      toast({
        title: "Error",
        description: "Selecciona una mesa y agrega al menos un item",
        variant: "destructive",
      })
      return
    }

    setIsSubmitting(true)
    try {
      const orderData = orderItems.map((item) => ({
        menuItemId: item.menuItem.id,
        quantity: item.quantity,
      }))

      await OrderService.createOrder(selectedTableId, orderData)

      const tableNumber = tables.find((table) => table.id === selectedTableId)?.number
      toast({
        title: "Pedido creado",
        description: tableNumber
          ? `Pedido creado para la mesa ${tableNumber}`
          : "Pedido creado correctamente",
      })

      setSelectedTableId("")
      setOrderItems([])
    } catch (error) {
      console.error("[OrderForm] Error creating order", error)
      toast({
        title: "Error",
        description: "No se pudo crear el pedido",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="grid gap-6 lg:grid-cols-3">
      <div className="space-y-4 lg:col-span-2">
        <Card>
          <CardHeader>
            <CardTitle>Seleccionar mesa</CardTitle>
          </CardHeader>
          <CardContent>
            {tablesLoading ? (
              <div className="flex h-20 items-center justify-center">
                <LoadingSpinner />
              </div>
            ) : tablesError ? (
              <div className="rounded-md border border-destructive/20 bg-destructive/10 px-3 py-2 text-sm text-destructive">
                {tablesError}
              </div>
            ) : (
              <Select value={selectedTableId} onValueChange={setSelectedTableId}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecciona una mesa" />
                </SelectTrigger>
                <SelectContent>
                  {availableTables.length === 0 ? (
                    <SelectItem value="none" disabled>
                      No hay mesas disponibles
                    </SelectItem>
                  ) : (
                    availableTables.map((table) => (
                      <SelectItem key={table.id} value={table.id}>
                        Mesa {table.number} - {table.zone || "Sin zona"} ({TABLE_STATE_LABELS[table.status]})
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Menu</CardTitle>
              <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                <SelectTrigger className="w-48">
                  <SelectValue placeholder="Todas las categorias" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas las categorias</SelectItem>
                  {MOCK_MENU_CATEGORIES.map((category) => (
                    <SelectItem key={category.id} value={category.id}>
                      {category.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-96">
              <div className="space-y-3">
                {filteredMenuItems.map((item) => (
                  <div key={item.id} className="flex items-center justify-between rounded-lg border p-3">
                    <div className="flex-1">
                      <h4 className="font-medium">{item.name}</h4>
                      <p className="text-sm text-muted-foreground">{item.description}</p>
                      <p className="text-sm font-medium">${(item.priceCents / 100).toFixed(2)}</p>
                    </div>
                    <Button onClick={() => addToOrder(item)} size="sm">
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>
      </div>

      <div className="space-y-4">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ShoppingCart className="h-5 w-5" />
              Pedido ({orderItems.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            {orderItems.length === 0 ? (
              <p className="py-4 text-center text-muted-foreground">No hay items en el pedido</p>
            ) : (
              <div className="space-y-3">
                {orderItems.map((item) => (
                  <div key={item.menuItem.id} className="flex items-center justify-between">
                    <div className="flex-1">
                      <p className="text-sm font-medium">{item.menuItem.name}</p>
                      <p className="text-xs text-muted-foreground">${(item.menuItem.priceCents / 100).toFixed(2)} c/u</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => updateQuantity(item.menuItem.id, item.quantity - 1)}
                      >
                        <Minus className="h-3 w-3" />
                      </Button>
                      <span className="w-8 text-center text-sm">{item.quantity}</span>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => updateQuantity(item.menuItem.id, item.quantity + 1)}
                      >
                        <Plus className="h-3 w-3" />
                      </Button>
                      <Button variant="ghost" size="sm" onClick={() => removeFromOrder(item.menuItem.id)}>
                        <X className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                ))}

                <Separator />

                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Subtotal:</span>
                    <span>${(calculateTotal() / 100).toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between font-medium">
                    <span>Total:</span>
                    <span>${(calculateTotal() / 100).toFixed(2)}</span>
                  </div>
                </div>

                <Button onClick={handleSubmit} className="w-full" disabled={isSubmitting || !selectedTableId}>
                  {isSubmitting ? "Creando..." : "Crear pedido"}
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
