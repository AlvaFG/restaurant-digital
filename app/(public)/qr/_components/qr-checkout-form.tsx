"use client"

import { useState } from "react"
import { useTranslations } from 'next-intl'
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Separator } from "@/components/ui/separator"
import { Badge } from "@/components/ui/badge"
import { CreditCard, Loader2, User, MessageSquare } from "lucide-react"
import type { DetailedCartEntry } from "../_hooks/use-qr-cart"

export type CartItemDetailed = DetailedCartEntry

interface QrCheckoutFormProps {
  items: CartItemDetailed[]
  totalCents: number
  currencyFormatter: Intl.NumberFormat
  tableNumber: number | null
  tableId: string
  sessionId?: string
  onSubmit: (data: CheckoutData) => Promise<void>
  isSubmitting?: boolean
}

export interface CheckoutData {
  customerName: string
  customerNotes?: string
  paymentMethod: 'cash' | 'card' | 'mercadopago'
  items: Array<{
    menuItemId: string
    quantity: number
    customizationId?: string
    modifiers?: Array<{ name: string; priceCents: number }>
    notes?: string
  }>
}

export function QrCheckoutForm({
  items,
  totalCents,
  currencyFormatter,
  tableNumber,
  tableId,
  sessionId: _sessionId,
  onSubmit,
  isSubmitting = false,
}: QrCheckoutFormProps) {
  const t = useTranslations('customer')
  const [customerName, setCustomerName] = useState("")
  const [customerNotes, setCustomerNotes] = useState("")
  const [paymentMethod, setPaymentMethod] = useState<'cash' | 'card' | 'mercadopago'>('cash')
  const [errors, setErrors] = useState<Record<string, string>>({})

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {}

    if (!customerName.trim()) {
      newErrors.customerName = t('pleaseEnterName')
    }

    if (items.length === 0) {
      newErrors.items = t('cartIsEmpty')
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!validateForm()) {
      return
    }

    const checkoutData: CheckoutData = {
      customerName: customerName.trim(),
      customerNotes: customerNotes.trim() || undefined,
      paymentMethod,
      items: items.map(entry => {
        const _basePrice = entry.item.priceCents
        const _modifiersPrice = entry.modifiers.reduce((sum, m) => sum + m.priceCents, 0)
        
        return {
          menuItemId: entry.item.id,
          quantity: entry.quantity,
          customizationId: entry.customizationId,
          modifiers: entry.modifiers?.map((m) => ({
            name: m.optionName, // Use optionName from CartItemModifier
            priceCents: m.priceCents,
          })),
          notes: entry.notes,
        }
      }),
    }

    try {
      await onSubmit(checkoutData)
      
      // Reset form on success
      setCustomerName("")
      setCustomerNotes("")
      setPaymentMethod('cash')
      setErrors({})
    } catch (error) {
      console.error('[Checkout] Submission failed:', error)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Customer Information */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="size-5" aria-hidden="true" />
            {t('customerInfo')}
          </CardTitle>
          <CardDescription>
            {t('customerInfoDesc')}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="customerName">
              {t('yourName')} <span className="text-destructive">*</span>
            </Label>
            <Input
              id="customerName"
              type="text"
              value={customerName}
              onChange={(e) => setCustomerName(e.target.value)}
              placeholder={t('yourName')}
              disabled={isSubmitting}
              aria-required="true"
              aria-invalid={!!errors.customerName}
              aria-describedby={errors.customerName ? "customerName-error" : undefined}
              className="h-12"
            />
            {errors.customerName && (
              <p id="customerName-error" className="text-sm text-destructive">
                {errors.customerName}
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="customerNotes" className="flex items-center gap-2">
              <MessageSquare className="size-4" aria-hidden="true" />
              {t('additionalNotes')}
            </Label>
            <Textarea
              id="customerNotes"
              value={customerNotes}
              onChange={(e) => setCustomerNotes(e.target.value)}
              placeholder={t('additionalNotesPlaceholder')}
              disabled={isSubmitting}
              rows={3}
              className="resize-none"
            />
          </div>
        </CardContent>
      </Card>

      {/* Payment Method */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CreditCard className="size-5" aria-hidden="true" />
            {t('paymentMethod')}
          </CardTitle>
          <CardDescription>
            {t('selectPayment')}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <RadioGroup
            value={paymentMethod}
            onValueChange={(value) => setPaymentMethod(value as typeof paymentMethod)}
            disabled={isSubmitting}
          >
            <div className="flex items-center space-x-3 rounded-lg border border-input p-4 hover:bg-accent/50 transition-colors">
              <RadioGroupItem value="cash" id="cash" />
              <Label htmlFor="cash" className="flex-1 cursor-pointer font-normal">
                💵 {t('cash')}
                <span className="block text-xs text-muted-foreground mt-0.5">
                  {t('cashDesc')}
                </span>
              </Label>
            </div>

            <div className="flex items-center space-x-3 rounded-lg border border-input p-4 hover:bg-accent/50 transition-colors">
              <RadioGroupItem value="card" id="card" />
              <Label htmlFor="card" className="flex-1 cursor-pointer font-normal">
                💳 {t('card')}
                <span className="block text-xs text-muted-foreground mt-0.5">
                  {t('cardDesc')}
                </span>
              </Label>
            </div>

            <div className="flex items-center space-x-3 rounded-lg border border-input p-4 hover:bg-accent/50 transition-colors">
              <RadioGroupItem value="mercadopago" id="mercadopago" />
              <Label htmlFor="mercadopago" className="flex-1 cursor-pointer font-normal">
                🔵 {t('mercadopago')}
                <span className="block text-xs text-muted-foreground mt-0.5">
                  {t('mercadopagoDesc')}
                </span>
              </Label>
            </div>
          </RadioGroup>
        </CardContent>
      </Card>

      {/* Order Summary */}
      <Card>
        <CardHeader>
          <CardTitle>{t('orderSummary')}</CardTitle>
          <CardDescription>
            Mesa {tableNumber ?? tableId} • {items.length} {items.length === 1 ? 'item' : 'items'}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {items.map((entry) => {
            const basePrice = entry.item.priceCents
            const modifiersPrice = entry.modifiers.reduce((sum, m) => sum + m.priceCents, 0)
            const totalCents = (basePrice + modifiersPrice) * entry.quantity

            return (
              <div key={entry.customizationId} className="flex justify-between items-start gap-4">
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm">
                    {entry.quantity}x {entry.item.name}
                  </p>
                  {entry.modifiers && entry.modifiers.length > 0 && (
                    <p className="text-xs text-muted-foreground">
                      {entry.modifiers.map((m) => m.optionName).join(', ')}
                    </p>
                  )}
                  {entry.notes && (
                    <p className="text-xs text-muted-foreground italic">
                      Nota: {entry.notes}
                    </p>
                  )}
                </div>
                <p className="text-sm font-medium whitespace-nowrap">
                  {currencyFormatter.format(totalCents / 100)}
                </p>
              </div>
            )
          })}

          <Separator />

          <div className="flex justify-between items-center pt-2">
            <p className="text-lg font-bold">{t('total')}</p>
            <p className="text-2xl font-bold">
              {currencyFormatter.format(totalCents / 100)}
            </p>
          </div>
        </CardContent>
        <CardFooter>
          <Button
            type="submit"
            size="lg"
            className="w-full h-14 text-lg"
            disabled={isSubmitting || items.length === 0}
          >
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 size-5 animate-spin" aria-hidden="true" />
                {t('sendingOrder')}
              </>
            ) : (
              `${t('confirmOrder')} • ${currencyFormatter.format(totalCents / 100)}`
            )}
          </Button>
        </CardFooter>
      </Card>

      {/* Info Badge */}
      <div className="flex justify-center">
        <Badge variant="outline" className="text-xs">
          {t('secureOrder')}
        </Badge>
      </div>
    </form>
  )
}
