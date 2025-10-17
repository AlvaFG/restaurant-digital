"use client"

import { useMemo, useState } from "react"

import { useOrdersPanelContext } from "@/app/pedidos/_providers/orders-panel-provider"
import { useTables } from "@/hooks/use-tables"
import { useMenuItems, useMenuCategories } from "@/hooks/use-menu"
import { useOrders } from "@/hooks/use-orders"
import type { Database } from "@/lib/supabase/database.types"
import { TABLE_STATE, TABLE_STATE_LABELS } from "@/lib/table-states"
import { LoadingSpinner } from "@/components/loading-spinner"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Separator } from "@/components/ui/separator"
import { useToast } from "@/hooks/use-toast"
import { ChevronDown, Minus, Plus, ShoppingCart, X } from "lucide-react"
import { logger } from "@/lib/logger"
import { MENSAJES } from "@/lib/i18n/mensajes"

type MenuItem = Database['public']['Tables']['menu_items']['Row']

interface OrderItem {
  menuItem: MenuItem
  quantity: number
}

export function OrderForm() {
  const { tables, loading: tablesLoading, error: tablesError, refresh: refreshTables } = useTables()
  const { items: menuItems, loading: menuItemsLoading } = useMenuItems()
  const { categories, loading: categoriesLoading } = useMenuCategories()
  const { createOrder } = useOrders()
  
  const [selectedTableId, setSelectedTableId] = useState<string>("")
  const [selectedCategory, setSelectedCategory] = useState<string>("all")
  const [orderItems, setOrderItems] = useState<OrderItem[]>([])
  const [isSubmitting, setIsSubmitting] = useState(false)

  const { refetch } = useOrdersPanelContext()
  const { toast } = useToast()

  // Mostrar todas las mesas, sin importar su estado
  const availableTables = useMemo(
    () => tables,
    [tables],
  )

  const filteredMenuItems = useMemo(() => {
    const availableItems = menuItems.filter((item) => item.available !== false)
    if (selectedCategory !== "all") {
      return availableItems.filter((item) => item.category_id === selectedCategory)
    }
    return availableItems
  }, [menuItems, selectedCategory])

  const categoryOptions = useMemo(
    () => [
      { id: "all", name: "Todas las categorias" },
      ...categories.map((category) => ({ id: category.id, name: category.name })),
    ],
    [categories],
  )

  const selectedCategoryLabel = useMemo(() => {
    return categoryOptions.find((option) => option.id === selectedCategory)?.name ?? "Todas las categorias"
  }, [categoryOptions, selectedCategory])

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

  const calculateTotal = () => orderItems.reduce((sum, item) => sum + item.menuItem.price_cents * item.quantity, 0)

  const handleSubmit = async () => {
    if (!selectedTableId || orderItems.length === 0) {
      logger.warn('Intento de enviar pedido sin mesa o items', {
        hasTable: !!selectedTableId,
        itemsCount: orderItems.length
      })
      
      toast({
        title: "Error",
        description: "Selecciona una mesa y agrega al menos un item",
        variant: "destructive",
      })
      return
    }

    setIsSubmitting(true)
    try {
      const payload = {
        tableId: selectedTableId,
        items: orderItems.map((item) => ({
          menuItemId: item.menuItem.id,
          quantity: item.quantity,
        })),
        source: "staff" as const,
      }

      // Obtener información de la mesa antes de crear el pedido
      const selectedTable = tables.find((table) => table.id === selectedTableId)
      const tableNumber = selectedTable?.number
      const previousTableStatus = selectedTable?.status

      logger.info('Creando pedido desde formulario', { 
        tableId: selectedTableId,
        tableNumber,
        previousTableStatus,
        itemsCount: orderItems.length,
        total: calculateTotal()
      })

      await createOrder(payload)

      // Mensaje mejorado según el estado anterior de la mesa
      let description = tableNumber
        ? `Pedido creado para la mesa ${tableNumber}`
        : "Pedido creado correctamente"
      
      if (previousTableStatus === TABLE_STATE.FREE) {
        description += `. Mesa cambió de estado a "${TABLE_STATE_LABELS.pedido_en_curso}"`
      }

      logger.info('Pedido creado exitosamente', {
        tableId: selectedTableId,
        tableNumber,
        previousTableStatus,
        newStatus: previousTableStatus === TABLE_STATE.FREE ? TABLE_STATE.ORDER_IN_PROGRESS : previousTableStatus
      })

      toast({
        title: "Pedido creado",
        description,
      })

      setSelectedTableId("")
      setOrderItems([])

      // Refrescar tanto los pedidos como las mesas para mostrar el cambio de estado
      await refreshTables()
      
      if (typeof window !== "undefined" && process.env.NEXT_PUBLIC_DISABLE_SOCKET === "1") {
        await refetch({ silent: false })
      }
    } catch (error) {
      logger.error('Error al crear pedido desde formulario', error as Error, {
        tableId: selectedTableId,
        itemsCount: orderItems.length
      })
      
      const message = error instanceof Error ? error.message : MENSAJES.ERRORES.GENERICO
      toast({
        title: "No se pudo crear el pedido",
        description: message,
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="grid gap-6 lg:grid-cols-3">
      <div className="space-y-4 lg:col-span-2">
        <Card className="border-2 border-border shadow-lg dark:border-zinc-700 dark:bg-zinc-900 dark:shadow-2xl">
          <CardHeader className="border-b dark:border-zinc-800 dark:bg-zinc-900/50">
            <CardTitle className="font-light dark:text-zinc-100">Seleccionar mesa</CardTitle>
          </CardHeader>
          <CardContent>
            {tablesLoading ? (
              <div className="flex h-20 items-center justify-center">
                <LoadingSpinner />
              </div>
            ) : tablesError ? (
              <div className="rounded-md border border-destructive/20 bg-destructive/10 px-3 py-2 text-sm text-destructive">
                {tablesError.message}
              </div>
            ) : (
              <Select disabled={isSubmitting} value={selectedTableId} onValueChange={setSelectedTableId}>
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
                        Mesa {table.number} - Sin zona ({TABLE_STATE_LABELS[table.status as keyof typeof TABLE_STATE_LABELS]})
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
            )}
          </CardContent>
        </Card>

        <Card className="border-2 border-border shadow-lg dark:border-zinc-700 dark:bg-zinc-900 dark:shadow-2xl">
          <CardHeader className="border-b dark:border-zinc-800 dark:bg-zinc-900/50">
            <div className="flex items-center justify-between">
              <CardTitle className="font-light dark:text-zinc-100">Menu</CardTitle>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="w-48 justify-between"
                    disabled={isSubmitting}
                  >
                    <span>{selectedCategoryLabel}</span>
                    <ChevronDown className="h-4 w-4 opacity-50" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  {categoryOptions.map((option) => (
                    <DropdownMenuItem
                      key={option.id}
                      onSelect={() => setSelectedCategory(option.id)}
                      data-state={selectedCategory === option.id ? "checked" : undefined}
                    >
                      {option.name}
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-96">
              <div className="space-y-3">
                {filteredMenuItems.map((item) => (
                  <div key={item.id} className="flex items-center justify-between rounded-lg border-2 border-border p-3 shadow-md hover:shadow-lg transition-all dark:border-zinc-700 dark:bg-zinc-800/50">
                    <div className="flex-1">
                      <h4 className="font-light dark:text-zinc-100">{item.name}</h4>
                      <p className="text-sm text-muted-foreground font-light dark:text-zinc-400">{item.description}</p>
                      <p className="text-sm font-light dark:text-zinc-200">${(item.price_cents / 100).toFixed(2)}</p>
                    </div>
                    <Button
                      onClick={() => addToOrder(item)}
                      size="sm"
                      disabled={isSubmitting}
                      aria-label={`Agregar ${item.name}`}
                    >
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
        <Card className="border-2 border-border shadow-lg dark:border-zinc-700 dark:bg-zinc-900 dark:shadow-2xl">
          <CardHeader className="border-b dark:border-zinc-800 dark:bg-zinc-900/50">
            <CardTitle className="flex items-center gap-2 font-light dark:text-zinc-100">
              <ShoppingCart className="h-5 w-5" />
              Pedido ({orderItems.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            {orderItems.length === 0 ? (
              <p className="py-4 text-center text-muted-foreground font-light dark:text-zinc-400">No hay items en el pedido</p>
            ) : (
              <div className="space-y-3">
                {orderItems.map((item) => (
                  <div key={item.menuItem.id} className="flex items-center justify-between rounded-lg border border-border/50 bg-accent/30 p-3 dark:border-transparent dark:bg-zinc-800/30">
                    <div className="flex-1">
                      <p className="text-sm font-light dark:text-zinc-100">{item.menuItem.name}</p>
                      <p className="text-xs text-muted-foreground font-light dark:text-zinc-400">${(item.menuItem.price_cents / 100).toFixed(2)} c/u</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => updateQuantity(item.menuItem.id, item.quantity - 1)}
                        disabled={isSubmitting}
                        aria-label={`Reducir ${item.menuItem.name}`}
                      >
                        <Minus className="h-3 w-3" />
                      </Button>
                      <span className="w-8 text-center text-sm">{item.quantity}</span>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => updateQuantity(item.menuItem.id, item.quantity + 1)}
                        disabled={isSubmitting}
                        aria-label={`Incrementar ${item.menuItem.name}`}
                      >
                        <Plus className="h-3 w-3" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => removeFromOrder(item.menuItem.id)}
                        disabled={isSubmitting}
                        aria-label={`Eliminar ${item.menuItem.name}`}
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                ))}

                <Separator />

                <div className="space-y-2 font-light dark:text-zinc-300">
                  <div className="flex justify-between text-sm">
                    <span>Subtotal:</span>
                    <span>${(calculateTotal() / 100).toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between font-light text-base dark:text-zinc-100">
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
