"use client"

import { useEffect, useMemo, useState } from "react"

import { Button } from "@/components/ui/button"
import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer"
import type { DetailedCartEntry } from "../_hooks/use-qr-cart"
import { AlertTriangle, CheckCircle2, Loader2, Minus, Plus, ShoppingCart, Trash2 } from "lucide-react"

interface QrCartSheetProps {
  items: DetailedCartEntry[]
  totalCents: number
  currencyFormatter: Intl.NumberFormat
  isSubmitting: boolean
  itemCount: number
  hasUnavailableItems?: boolean
  onIncrement: (menuItemId: string) => void
  onDecrement: (menuItemId: string) => void
  onClear: () => void
  onSubmit: () => void
  successOrderId?: string | null
  onCloseSuccess?: () => void
}

export function QrCartSheet({
  items,
  totalCents,
  currencyFormatter,
  isSubmitting,
  itemCount,
  hasUnavailableItems = false,
  onIncrement,
  onDecrement,
  onClear,
  onSubmit,
  successOrderId = null,
  onCloseSuccess,
}: QrCartSheetProps) {
  const [isOpen, setIsOpen] = useState(false)

  useEffect(() => {
    if (successOrderId) {
      setIsOpen(true)
    }
  }, [successOrderId])

  const totalFormatted = useMemo(() => currencyFormatter.format(totalCents / 100), [currencyFormatter, totalCents])
  const hasItems = itemCount > 0

  const handleOpenChange = (nextState: boolean) => {
    setIsOpen(nextState)
    if (!nextState && successOrderId && onCloseSuccess) {
      onCloseSuccess()
    }
  }

  const canSubmit = hasItems && !hasUnavailableItems && !isSubmitting

  return (
    <Drawer open={isOpen} onOpenChange={handleOpenChange}>
      <div className="sticky bottom-0 left-0 right-0 z-40 border-t border-border/50 bg-background/95 px-4 py-3 shadow-lg backdrop-blur supports-[backdrop-filter]:bg-background/80">
        <div className="mx-auto flex w-full max-w-screen-sm items-center gap-3">
          <div className="flex flex-1 items-center gap-3">
            <ShoppingCart className="size-6 text-primary" aria-hidden="true" />
            <div className="flex flex-col">
              <span className="text-sm font-semibold">
                {hasItems ? `${itemCount} ${itemCount === 1 ? "item" : "items"}` : "Tu carrito"}
              </span>
              <span className="text-xs text-muted-foreground">
                {hasItems ? `Total ${totalFormatted}` : "Agrega platos para enviar tu pedido"}
              </span>
            </div>
          </div>

          <Button
            type="button"
            className="min-h-[3rem] min-w-[7rem] rounded-full font-semibold"
            onClick={() => setIsOpen(true)}
            disabled={!hasItems && !successOrderId}
          >
            {successOrderId ? "Ver resumen" : "Ver pedido"}
          </Button>
        </div>
      </div>

      <DrawerContent className="max-h-[85vh] rounded-t-3xl border-t border-border/60">
        <DrawerHeader className="gap-2">
          <DrawerTitle className="text-lg font-semibold">Tu pedido</DrawerTitle>
          <DrawerDescription>
            {successOrderId
              ? "Pedido confirmado. Compartiremos la orden con el staff."
              : "Confirma los platos antes de enviarlos al staff."}
          </DrawerDescription>
        </DrawerHeader>

        <div className="flex-1 overflow-y-auto px-4 pb-4">
          {successOrderId ? (
            <div className="flex flex-col items-center gap-4 rounded-2xl border border-emerald-400/40 bg-emerald-50 px-6 py-10 text-center text-emerald-900 dark:border-emerald-500/60 dark:bg-emerald-950/40 dark:text-emerald-200">
              <CheckCircle2 className="size-12" aria-hidden="true" />
              <div className="space-y-2">
                <p className="text-lg font-semibold">Pedido enviado</p>
                <p className="text-sm">
                  Numero de orden mock <span className="font-mono font-bold">{successOrderId}</span>.
                </p>
                <p className="text-sm text-muted-foreground">
                  Avisaremos al staff para continuar con la preparacion.
                </p>
              </div>
              <Button type="button" variant="outline" onClick={() => handleOpenChange(false)}>
                Cerrar
              </Button>
            </div>
          ) : hasItems ? (
            <ul className="flex flex-col gap-4">
              {items.map(({ item, quantity }) => (
                <li key={`cart-item-${item.id}`} className="flex items-start justify-between gap-3">
                  <div className="max-w-[65%] space-y-1">
                    <p className="text-base font-semibold leading-tight">{item.name}</p>
                    <p className="text-sm text-muted-foreground">
                      {currencyFormatter.format(item.priceCents / 100)}
                    </p>
                    {item.available === false ? (
                      <span className="inline-flex items-center gap-1 text-xs font-medium text-amber-600">
                        <AlertTriangle className="size-3" aria-hidden="true" />
                        No disponible temporalmente
                      </span>
                    ) : null}
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="size-9 rounded-full"
                      onClick={() => onDecrement(item.id)}
                      aria-label={`Quitar una unidad de ${item.name}`}
                    >
                      <Minus className="size-4" aria-hidden="true" />
                    </Button>
                    <span className="min-w-[2rem] text-center text-base font-semibold">{quantity}</span>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="size-9 rounded-full"
                      onClick={() => onIncrement(item.id)}
                      aria-label={`Agregar una unidad de ${item.name}`}
                      disabled={item.available === false}
                    >
                      <Plus className="size-4" aria-hidden="true" />
                    </Button>
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <div className="rounded-2xl border border-dashed border-border/60 bg-muted/40 px-6 py-12 text-center text-sm text-muted-foreground">
              Todavia no agregaste platos. Explora el menu y elige tus favoritos.
            </div>
          )}
        </div>

        {!successOrderId ? (
          <DrawerFooter className="gap-3 border-t border-border/60 bg-background/90">
            {hasUnavailableItems ? (
              <div className="flex items-start gap-2 rounded-lg border border-amber-500/60 bg-amber-100/70 px-3 py-3 text-xs text-amber-900 dark:border-amber-500/40 dark:bg-amber-950/40 dark:text-amber-200">
                <AlertTriangle className="mt-0.5 size-4" aria-hidden="true" />
                <p>
                  Uno o mas platos no estan disponibles. Ajusta tu pedido antes de enviarlo o consulta al staff.
                </p>
              </div>
            ) : null}

            <div className="flex items-center justify-between text-sm font-semibold">
              <span>Total</span>
              <span>{totalFormatted}</span>
            </div>

            <div className="flex flex-col gap-2 pt-1">
              <Button
                type="button"
                className="min-h-[3rem] rounded-full text-base font-semibold"
                onClick={onSubmit}
                disabled={!canSubmit}
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="size-4 animate-spin" aria-hidden="true" />
                    <span>Enviando pedido...</span>
                  </>
                ) : (
                  <>
                    <ShoppingCart className="size-4" aria-hidden="true" />
                    <span>Enviar pedido</span>
                  </>
                )}
              </Button>
              <Button
                type="button"
                variant="ghost"
                className="gap-2 text-sm"
                onClick={onClear}
                disabled={!hasItems || isSubmitting}
              >
                <Trash2 className="size-4" aria-hidden="true" />
                Vaciar carrito
              </Button>
            </div>
          </DrawerFooter>
        ) : null}
      </DrawerContent>
    </Drawer>
  )
}
