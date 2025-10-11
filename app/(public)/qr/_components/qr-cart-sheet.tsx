"use client"

import { useState } from "react"
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Separator } from "@/components/ui/separator"
import { ShoppingCart, Trash2, Plus, Minus, X } from "lucide-react"
import type { DetailedCartEntry } from "../_hooks/use-qr-cart"
import { QrCheckoutForm, type CheckoutData } from "./qr-checkout-form"
import { QrOrderConfirmation } from "./qr-order-confirmation"
import { useQrOrder } from "../_hooks/use-qr-order"

interface QrCartSheetProps {
  items: DetailedCartEntry[]
  itemCount: number
  totalCents: number
  currencyFormatter: Intl.NumberFormat
  tableNumber: number | null
  tableId: string
  sessionId?: string
  onIncrement: (customizationId: string) => void
  onDecrement: (customizationId: string) => void
  onRemove: (customizationId: string) => void
  onClear: () => void
  trigger?: React.ReactNode
}

type ViewMode = 'cart' | 'checkout' | 'confirmation'

interface ConfirmationState {
  orderId: string
  estimatedMinutes: number
  message: string
}

/**
 * Multi-view cart sheet for QR ordering
 * Handles cart display, checkout flow, and order confirmation
 */
export function QrCartSheet({
  items,
  itemCount,
  totalCents,
  currencyFormatter,
  tableNumber,
  tableId,
  sessionId,
  onIncrement,
  onDecrement,
  onRemove,
  onClear,
  trigger,
}: QrCartSheetProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [viewMode, setViewMode] = useState<ViewMode>('cart')
  const [confirmationState, setConfirmationState] = useState<ConfirmationState | null>(null)

  const { submitOrder, isSubmitting, error, resetError } = useQrOrder({
    tableId,
    sessionId: sessionId ?? null,
    onSuccess: (orderId) => {
      setConfirmationState({
        orderId,
        estimatedMinutes: 20,
        message: "Tu pedido ha sido recibido y está siendo preparado",
      })
      setViewMode('confirmation')
      onClear() // Clear cart after successful order
    },
    onError: (errorMsg) => {
      console.error('[QrCartSheet] Order error:', errorMsg)
      // Error is displayed in the form
    },
  })

  const handleCheckout = () => {
    resetError()
    setViewMode('checkout')
  }

  const handleBackToCart = () => {
    setViewMode('cart')
  }

  const handleBackToMenu = () => {
    setViewMode('cart')
    setIsOpen(false)
    setConfirmationState(null)
  }

  const handleSubmitOrder = async (data: CheckoutData) => {
    await submitOrder(data)
  }

  const handleOpenChange = (open: boolean) => {
    setIsOpen(open)
    if (!open) {
      // Reset to cart view when closing (with delay for animation)
      setTimeout(() => {
        setViewMode('cart')
        setConfirmationState(null)
      }, 300)
    }
  }

  return (
    <Sheet open={isOpen} onOpenChange={handleOpenChange}>
      <SheetTrigger asChild>
        {trigger ?? (
          <Button
            size="lg"
            className="fixed bottom-6 right-6 h-16 w-16 rounded-full shadow-lg z-50 hover:scale-110 transition-transform"
            aria-label={`Carrito: ${itemCount} ${itemCount === 1 ? 'artículo' : 'artículos'}`}
          >
            <div className="relative">
              <ShoppingCart className="size-6" aria-hidden="true" />
              {itemCount > 0 && (
                <Badge
                  variant="destructive"
                  className="absolute -top-2 -right-2 h-6 w-6 flex items-center justify-center p-0 text-xs font-bold animate-in zoom-in-50"
                >
                  {itemCount > 99 ? '99+' : itemCount}
                </Badge>
              )}
            </div>
          </Button>
        )}
      </SheetTrigger>

      <SheetContent 
        side="right" 
        className="w-full sm:max-w-lg p-0 flex flex-col overflow-hidden"
        aria-describedby="cart-description"
      >
        {/* CART VIEW */}
        {viewMode === 'cart' && (
          <>
            <SheetHeader className="px-6 pt-6 pb-4 border-b">
              <SheetTitle className="flex items-center justify-between">
                <span>Tu pedido</span>
                {items.length > 0 && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={onClear}
                    className="text-destructive hover:text-destructive hover:bg-destructive/10"
                    aria-label="Vaciar carrito"
                  >
                    <Trash2 className="size-4 mr-1" aria-hidden="true" />
                    Vaciar
                  </Button>
                )}
              </SheetTitle>
              <SheetDescription id="cart-description">
                Mesa {tableNumber ?? tableId} • {itemCount} {itemCount === 1 ? 'artículo' : 'artículos'}
              </SheetDescription>
            </SheetHeader>

            {items.length === 0 ? (
              <div className="flex-1 flex items-center justify-center px-6">
                <div className="text-center text-muted-foreground space-y-4">
                  <ShoppingCart className="size-16 mx-auto opacity-20" aria-hidden="true" />
                  <div>
                    <p className="text-lg font-medium">Tu carrito está vacío</p>
                    <p className="text-sm mt-2">Agrega platos del menú para comenzar</p>
                  </div>
                </div>
              </div>
            ) : (
              <>
                <ScrollArea className="flex-1 px-6">
                  <div className="space-y-4 py-4">
                    {items.map((entry) => {
                      const basePrice = entry.item.priceCents
                      const modifiersPrice = entry.modifiers.reduce((sum, m) => sum + m.priceCents, 0)
                      const itemTotal = (basePrice + modifiersPrice) * entry.quantity

                      return (
                        <div
                          key={entry.customizationId}
                          className="border rounded-lg p-4 space-y-3 hover:border-primary/50 transition-colors"
                        >
                          {/* Item Header */}
                          <div className="flex justify-between items-start gap-3">
                            <div className="flex-1 min-w-0">
                              <h4 className="font-semibold text-sm leading-tight">
                                {entry.item.name}
                              </h4>
                              {entry.modifiers && entry.modifiers.length > 0 && (
                                <div className="flex flex-wrap gap-1 mt-1.5">
                                  {entry.modifiers.map((m, idx) => (
                                    <Badge 
                                      key={`${entry.customizationId}-mod-${idx}`}
                                      variant="secondary" 
                                      className="text-xs"
                                    >
                                      {m.optionName}
                                      {m.priceCents !== 0 && (
                                        <span className="ml-1">
                                          {m.priceCents > 0 ? '+' : ''}
                                          {currencyFormatter.format(m.priceCents / 100)}
                                        </span>
                                      )}
                                    </Badge>
                                  ))}
                                </div>
                              )}
                              {entry.notes && (
                                <p className="text-xs text-muted-foreground italic mt-1.5 flex items-start gap-1">
                                  <span>📝</span>
                                  <span>{entry.notes}</span>
                                </p>
                              )}
                            </div>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-8 w-8 p-0 text-destructive hover:text-destructive hover:bg-destructive/10"
                              onClick={() => onRemove(entry.customizationId)}
                              aria-label={`Eliminar ${entry.item.name}`}
                            >
                              <X className="size-4" aria-hidden="true" />
                            </Button>
                          </div>

                          {/* Quantity Controls */}
                          <div className="flex items-center justify-between pt-2 border-t">
                            <div className="flex items-center gap-2">
                              <Button
                                variant="outline"
                                size="sm"
                                className="h-9 w-9 p-0 rounded-full"
                                onClick={() => onDecrement(entry.customizationId)}
                                aria-label="Disminuir cantidad"
                              >
                                <Minus className="size-4" aria-hidden="true" />
                              </Button>
                              <span className="text-base font-semibold w-10 text-center" aria-live="polite">
                                {entry.quantity}
                              </span>
                              <Button
                                variant="outline"
                                size="sm"
                                className="h-9 w-9 p-0 rounded-full"
                                onClick={() => onIncrement(entry.customizationId)}
                                aria-label="Aumentar cantidad"
                              >
                                <Plus className="size-4" aria-hidden="true" />
                              </Button>
                            </div>
                            <span className="text-base font-bold">
                              {currencyFormatter.format(itemTotal / 100)}
                            </span>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </ScrollArea>

                {/* Footer with Total and Checkout Button */}
                <div className="border-t bg-muted/30 p-6 space-y-4">
                  <div className="flex justify-between items-baseline">
                    <span className="text-lg font-bold">Total</span>
                    <div className="text-right">
                      <span className="text-3xl font-bold">
                        {currencyFormatter.format(totalCents / 100)}
                      </span>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {itemCount} {itemCount === 1 ? 'artículo' : 'artículos'}
                      </p>
                    </div>
                  </div>
                  <Button
                    size="lg"
                    className="w-full h-14 text-lg font-semibold"
                    onClick={handleCheckout}
                  >
                    Continuar al pago
                  </Button>
                </div>
              </>
            )}
          </>
        )}

        {/* CHECKOUT VIEW */}
        {viewMode === 'checkout' && (
          <>
            <SheetHeader className="px-6 pt-6 pb-4 border-b">
              <SheetTitle>Finalizar pedido</SheetTitle>
              <SheetDescription>
                Completa los datos para enviar tu pedido a la cocina
              </SheetDescription>
            </SheetHeader>

            <ScrollArea className="flex-1">
              <div className="px-6 py-4 space-y-4">
                {error && (
                  <div className="p-4 bg-destructive/10 border border-destructive rounded-lg animate-in fade-in-50">
                    <p className="text-sm text-destructive font-medium">{error}</p>
                  </div>
                )}
                
                <QrCheckoutForm
                  items={items}
                  totalCents={totalCents}
                  currencyFormatter={currencyFormatter}
                  tableNumber={tableNumber}
                  tableId={tableId}
                  sessionId={sessionId}
                  onSubmit={handleSubmitOrder}
                  isSubmitting={isSubmitting}
                />

                <Separator className="my-4" />

                <Button
                  variant="outline"
                  className="w-full"
                  onClick={handleBackToCart}
                  disabled={isSubmitting}
                >
                  ← Volver al carrito
                </Button>
              </div>
            </ScrollArea>
          </>
        )}

        {/* CONFIRMATION VIEW */}
        {viewMode === 'confirmation' && confirmationState && (
          <div className="flex-1 overflow-auto animate-in fade-in-50 slide-in-from-right-5">
            <QrOrderConfirmation
              orderId={confirmationState.orderId}
              estimatedMinutes={confirmationState.estimatedMinutes}
              message={confirmationState.message}
              tableNumber={tableNumber}
              onBackToMenu={handleBackToMenu}
            />
          </div>
        )}
      </SheetContent>
    </Sheet>
  )
}
