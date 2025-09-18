"use client"

import { useState } from "react"
import { MOCK_MENU_CATEGORIES, MOCK_MENU_ITEMS, MOCK_TABLES, OrderService, type MenuItem } from "@/lib/mock-data"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Separator } from "@/components/ui/separator"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Plus, Minus, ShoppingCart, X } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

interface OrderItem {
  menuItem: MenuItem
  quantity: number
}

export function OrderForm() {
  const [selectedTableId, setSelectedTableId] = useState<string>("")
  const [selectedCategory, setSelectedCategory] = useState<string>("all") // Updated default value
  const [orderItems, setOrderItems] = useState<OrderItem[]>([])
  const [isSubmitting, setIsSubmitting] = useState(false)
  const { toast } = useToast()

  const availableTables = MOCK_TABLES.filter((table) => table.status === "libre" || table.status === "ocupada")
  const filteredMenuItems = selectedCategory
    ? MOCK_MENU_ITEMS.filter((item) => item.categoryId === selectedCategory && item.available)
    : MOCK_MENU_ITEMS.filter((item) => item.available)

  const addToOrder = (menuItem: MenuItem) => {
    const existingItem = orderItems.find((item) => item.menuItem.id === menuItem.id)

    if (existingItem) {
      setOrderItems(
        orderItems.map((item) => (item.menuItem.id === menuItem.id ? { ...item, quantity: item.quantity + 1 } : item)),
      )
    } else {
      setOrderItems([...orderItems, { menuItem, quantity: 1 }])
    }
  }

  const updateQuantity = (menuItemId: string, quantity: number) => {
    if (quantity <= 0) {
      setOrderItems(orderItems.filter((item) => item.menuItem.id !== menuItemId))
    } else {
      setOrderItems(orderItems.map((item) => (item.menuItem.id === menuItemId ? { ...item, quantity } : item)))
    }
  }

  const removeFromOrder = (menuItemId: string) => {
    setOrderItems(orderItems.filter((item) => item.menuItem.id !== menuItemId))
  }

  const calculateTotal = () => {
    return orderItems.reduce((sum, item) => sum + item.menuItem.priceCents * item.quantity, 0)
  }

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

      toast({
        title: "Pedido creado",
        description: `Pedido creado exitosamente para Mesa ${MOCK_TABLES.find((t) => t.id === selectedTableId)?.number}`,
      })

      // Reset form
      setSelectedTableId("")
      setOrderItems([])
    } catch (error) {
      console.error("[v0] Error creating order", error)
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
      {/* Menu Selection */}
      <div className="lg:col-span-2 space-y-4">
        <Card>
          <CardHeader>
            <CardTitle>Seleccionar Mesa</CardTitle>
          </CardHeader>
          <CardContent>
            <Select value={selectedTableId} onValueChange={setSelectedTableId}>
              <SelectTrigger>
                <SelectValue placeholder="Selecciona una mesa" />
              </SelectTrigger>
              <SelectContent>
                {availableTables.map((table) => (
                  <SelectItem key={table.id} value={table.id}>
                    Mesa {table.number} - {table.zone} ({table.status})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>MenÃº</CardTitle>
              <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                <SelectTrigger className="w-48">
                  <SelectValue placeholder="Todas las categorÃ­as" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas las categorÃ­as</SelectItem> {/* Updated value */}
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
                  <div key={item.id} className="flex items-center justify-between p-3 border rounded-lg">
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

      {/* Order Summary */}
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
              <p className="text-muted-foreground text-center py-4">No hay items en el pedido</p>
            ) : (
              <div className="space-y-3">
                {orderItems.map((item) => (
                  <div key={item.menuItem.id} className="flex items-center justify-between">
                    <div className="flex-1">
                      <p className="font-medium text-sm">{item.menuItem.name}</p>
                      <p className="text-xs text-muted-foreground">
                        ${(item.menuItem.priceCents / 100).toFixed(2)} c/u
                      </p>
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
                  {isSubmitting ? "Creando..." : "Crear Pedido"}
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}


