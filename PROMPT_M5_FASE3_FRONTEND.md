# PROMPT M5 - FASE 3: FRONTEND CHECKOUT IMPLEMENTATION

## Contexto
Has completado exitosamente la Fase 2 (Backend Integration) del Milestone 5 de pagos digitales. El backend de MercadoPago está implementado y funcional con:
- ✅ PaymentStore con persistencia en JSON
- ✅ MercadoPagoProvider con integración completa del SDK
- ✅ API endpoints POST/GET /api/payment
- ✅ Webhook handler en /api/webhook/mercadopago
- ✅ Build exitoso y código commiteado en `feature/backend-payments-mercadopago`

**Objetivo de esta Fase**: Implementar la interfaz de usuario completa para el flujo de checkout, incluyendo componentes React, integración con Checkout Pro de MercadoPago, páginas de éxito/error, y actualizaciones en tiempo real vía WebSocket.

## Tiempo Estimado
8-10 horas de implementación

## Pre-requisitos
1. Backend de pagos completado (Fase 2) ✅
2. Variables de entorno configuradas:
   - `MERCADOPAGO_ACCESS_TOKEN`
   - `NEXT_PUBLIC_MERCADOPAGO_PUBLIC_KEY`
   - `PAYMENT_SANDBOX=true` (para desarrollo)
   - `PAYMENT_WEBHOOK_URL`

## Estructura de Implementación

### 1. Types & Utilities (30 min)
**Archivo**: `lib/payment-client-utils.ts`

```typescript
/**
 * Utilidades del lado del cliente para pagos
 * - Funciones para formatear montos
 * - Helpers para estados de pago
 * - Constantes de configuración del cliente
 */

export type PaymentStatus = 
  | 'pending'
  | 'approved'
  | 'rejected'
  | 'cancelled'
  | 'refunded'
  | 'in_process';

export interface PaymentClientConfig {
  publicKey: string;
  sandbox: boolean;
}

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('es-AR', {
    style: 'currency',
    currency: 'ARS',
  }).format(amount);
}

export function getPaymentStatusLabel(status: PaymentStatus): string {
  const labels: Record<PaymentStatus, string> = {
    pending: 'Pendiente',
    approved: 'Aprobado',
    rejected: 'Rechazado',
    cancelled: 'Cancelado',
    refunded: 'Reembolsado',
    in_process: 'En Proceso',
  };
  return labels[status] || 'Desconocido';
}

export function getPaymentStatusColor(status: PaymentStatus): string {
  const colors: Record<PaymentStatus, string> = {
    pending: 'bg-yellow-100 text-yellow-800',
    approved: 'bg-green-100 text-green-800',
    rejected: 'bg-red-100 text-red-800',
    cancelled: 'bg-gray-100 text-gray-800',
    refunded: 'bg-blue-100 text-blue-800',
    in_process: 'bg-blue-100 text-blue-800',
  };
  return colors[status] || 'bg-gray-100 text-gray-800';
}

export function getPaymentConfig(): PaymentClientConfig {
  return {
    publicKey: process.env.NEXT_PUBLIC_MERCADOPAGO_PUBLIC_KEY || '',
    sandbox: process.env.NEXT_PUBLIC_PAYMENT_SANDBOX === 'true',
  };
}
```

### 2. Payment Hook (1 hora)
**Archivo**: `hooks/use-payment.ts`

```typescript
/**
 * Hook personalizado para gestionar el estado de pagos
 * Features:
 * - createPayment: Crea un nuevo pago para un pedido
 * - getPaymentStatus: Obtiene el estado actual de un pago
 * - WebSocket listener para actualizaciones en tiempo real
 * - Estado de loading y errores
 */

import { useState, useEffect, useCallback } from 'react';
import { useSocket } from './use-socket';

interface Payment {
  id: string;
  orderId: string;
  amount: number;
  status: string;
  provider: string;
  externalId?: string;
  checkoutUrl?: string;
  createdAt: string;
  updatedAt: string;
}

interface UsePaymentReturn {
  createPayment: (orderId: string, amount: number) => Promise<Payment | null>;
  getPaymentStatus: (paymentId: string) => Promise<Payment | null>;
  payment: Payment | null;
  isLoading: boolean;
  error: string | null;
}

export function usePayment(): UsePaymentReturn {
  const [payment, setPayment] = useState<Payment | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const socket = useSocket();

  // Escuchar actualizaciones de pago en tiempo real
  useEffect(() => {
    if (!socket) return;

    const handlePaymentUpdate = (data: Payment) => {
      if (payment && data.id === payment.id) {
        setPayment(data);
      }
    };

    socket.on('payment:updated', handlePaymentUpdate);

    return () => {
      socket.off('payment:updated', handlePaymentUpdate);
    };
  }, [socket, payment]);

  const createPayment = useCallback(async (orderId: string, amount: number) => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/payment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderId, amount }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Error al crear el pago');
      }

      const newPayment = await response.json();
      setPayment(newPayment);
      return newPayment;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Error desconocido';
      setError(message);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const getPaymentStatus = useCallback(async (paymentId: string) => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/payment/${paymentId}`);

      if (!response.ok) {
        throw new Error('Error al obtener el estado del pago');
      }

      const paymentData = await response.json();
      setPayment(paymentData);
      return paymentData;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Error desconocido';
      setError(message);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, []);

  return {
    createPayment,
    getPaymentStatus,
    payment,
    isLoading,
    error,
  };
}
```

### 3. CheckoutButton Component (1 hora)
**Archivo**: `components/checkout-button.tsx`

```typescript
/**
 * Botón de pago que inicia el flujo de checkout
 * Props:
 * - orderId: ID del pedido a pagar
 * - amount: Monto total
 * - disabled: Deshabilitar botón
 * - onSuccess: Callback al crear pago exitosamente
 * - onError: Callback en caso de error
 * 
 * Behavior:
 * - Muestra loading state durante la creación
 * - Abre checkoutUrl en nueva ventana al completar
 * - Maneja errores con toast notifications
 */

'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { usePayment } from '@/hooks/use-payment';
import { useToast } from '@/hooks/use-toast';
import { formatCurrency } from '@/lib/payment-client-utils';
import { CreditCard, Loader2 } from 'lucide-react';

interface CheckoutButtonProps {
  orderId: string;
  amount: number;
  disabled?: boolean;
  onSuccess?: (payment: any) => void;
  onError?: (error: string) => void;
}

export function CheckoutButton({
  orderId,
  amount,
  disabled = false,
  onSuccess,
  onError,
}: CheckoutButtonProps) {
  const { createPayment, isLoading } = usePayment();
  const { toast } = useToast();
  const [isProcessing, setIsProcessing] = useState(false);

  const handleCheckout = async () => {
    setIsProcessing(true);

    try {
      const payment = await createPayment(orderId, amount);

      if (!payment) {
        throw new Error('No se pudo crear el pago');
      }

      if (!payment.checkoutUrl) {
        throw new Error('URL de checkout no disponible');
      }

      // Abrir Checkout Pro en nueva ventana
      const checkoutWindow = window.open(
        payment.checkoutUrl,
        '_blank',
        'width=800,height=600'
      );

      if (!checkoutWindow) {
        toast({
          title: 'Ventana bloqueada',
          description: 'Por favor, habilita ventanas emergentes para continuar',
          variant: 'destructive',
        });
        return;
      }

      toast({
        title: 'Redirigiendo a MercadoPago',
        description: 'Completa el pago en la ventana emergente',
      });

      onSuccess?.(payment);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Error al procesar el pago';
      toast({
        title: 'Error',
        description: message,
        variant: 'destructive',
      });
      onError?.(message);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <Button
      onClick={handleCheckout}
      disabled={disabled || isLoading || isProcessing}
      className="w-full"
      size="lg"
    >
      {isLoading || isProcessing ? (
        <>
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          Procesando...
        </>
      ) : (
        <>
          <CreditCard className="mr-2 h-4 w-4" />
          Pagar {formatCurrency(amount)}
        </>
      )}
    </Button>
  );
}
```

### 4. PaymentModal Component (2 horas)
**Archivo**: `components/payment-modal.tsx`

```typescript
/**
 * Modal completo de pago con detalles del pedido
 * Features:
 * - Muestra resumen del pedido
 * - Permite confirmar monto antes de pagar
 * - Integra CheckoutButton
 * - Polling del estado de pago después de redirección
 * - Cierra automáticamente al aprobar pago
 */

'use client';

import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { CheckoutButton } from './checkout-button';
import { formatCurrency, getPaymentStatusLabel, getPaymentStatusColor } from '@/lib/payment-client-utils';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { usePayment } from '@/hooks/use-payment';

interface PaymentModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  order: {
    id: string;
    tableId: string;
    items: Array<{
      name: string;
      quantity: number;
      price: number;
    }>;
    total: number;
  };
}

export function PaymentModal({ open, onOpenChange, order }: PaymentModalProps) {
  const { payment, getPaymentStatus } = usePayment();
  const [pollInterval, setPollInterval] = useState<NodeJS.Timeout | null>(null);

  // Polling del estado de pago cada 3 segundos
  useEffect(() => {
    if (payment && payment.status === 'pending' && open) {
      const interval = setInterval(async () => {
        await getPaymentStatus(payment.id);
      }, 3000);

      setPollInterval(interval);

      return () => {
        clearInterval(interval);
      };
    }

    return () => {
      if (pollInterval) clearInterval(pollInterval);
    };
  }, [payment, open, getPaymentStatus]);

  // Cerrar modal automáticamente cuando el pago es aprobado
  useEffect(() => {
    if (payment?.status === 'approved') {
      if (pollInterval) clearInterval(pollInterval);
      setTimeout(() => {
        onOpenChange(false);
      }, 2000);
    }
  }, [payment?.status, pollInterval, onOpenChange]);

  const handleSuccess = () => {
    // El polling se encargará de actualizar el estado
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Pagar Pedido</DialogTitle>
          <DialogDescription>
            Mesa {order.tableId} - Pedido #{order.id.slice(0, 8)}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Resumen de items */}
          <div className="space-y-2">
            <h4 className="font-medium text-sm">Resumen del pedido</h4>
            <div className="space-y-1">
              {order.items.map((item, index) => (
                <div key={index} className="flex justify-between text-sm">
                  <span>
                    {item.quantity}x {item.name}
                  </span>
                  <span>{formatCurrency(item.price * item.quantity)}</span>
                </div>
              ))}
            </div>
          </div>

          <Separator />

          {/* Total */}
          <div className="flex justify-between items-center">
            <span className="font-semibold">Total</span>
            <span className="text-2xl font-bold">{formatCurrency(order.total)}</span>
          </div>

          {/* Estado de pago si existe */}
          {payment && (
            <div className="p-3 bg-muted rounded-lg space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Estado del pago:</span>
                <Badge className={getPaymentStatusColor(payment.status as any)}>
                  {getPaymentStatusLabel(payment.status as any)}
                </Badge>
              </div>
              {payment.externalId && (
                <p className="text-xs text-muted-foreground">
                  ID de transacción: {payment.externalId}
                </p>
              )}
            </div>
          )}
        </div>

        <DialogFooter className="flex-col space-y-2 sm:space-y-0">
          {!payment && (
            <CheckoutButton
              orderId={order.id}
              amount={order.total}
              onSuccess={handleSuccess}
            />
          )}
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            className="w-full"
          >
            {payment?.status === 'approved' ? 'Cerrar' : 'Cancelar'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
```

### 5. Payment Success Page (1 hora)
**Archivo**: `app/(public)/payment/success/page.tsx`

```typescript
/**
 * Página de éxito después del pago
 * Query params:
 * - payment_id: ID del pago
 * - external_reference: ID del pedido
 * 
 * Features:
 * - Muestra confirmación visual
 * - Consulta estado del pago
 * - Botón para volver al salón
 * - Impresión automática de comprobante (opcional)
 */

import { Suspense } from 'react';
import Link from 'next/link';
import { CheckCircle, Home } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

function SuccessContent() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-green-50 to-emerald-50 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
            <CheckCircle className="w-10 h-10 text-green-600" />
          </div>
          <CardTitle className="text-2xl">¡Pago Exitoso!</CardTitle>
          <CardDescription>
            Tu pago ha sido procesado correctamente
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="text-center text-sm text-muted-foreground">
            <p>Recibirás una confirmación por email</p>
            <p>Tu pedido será preparado en breve</p>
          </div>

          <Button asChild className="w-full" size="lg">
            <Link href="/salon">
              <Home className="mr-2 h-4 w-4" />
              Volver al Salón
            </Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}

export default function PaymentSuccessPage() {
  return (
    <Suspense fallback={<div>Cargando...</div>}>
      <SuccessContent />
    </Suspense>
  );
}
```

### 6. Payment Failure Page (45 min)
**Archivo**: `app/(public)/payment/failure/page.tsx`

```typescript
/**
 * Página de error después de un pago fallido
 * Query params:
 * - payment_id: ID del pago
 * - external_reference: ID del pedido
 * 
 * Features:
 * - Muestra mensaje de error
 * - Botón para reintentar
 * - Botón para volver al salón
 * - Información de soporte
 */

import { Suspense } from 'react';
import Link from 'next/link';
import { XCircle, Home, RotateCcw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

function FailureContent() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-red-50 to-rose-50 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mb-4">
            <XCircle className="w-10 h-10 text-red-600" />
          </div>
          <CardTitle className="text-2xl">Pago No Procesado</CardTitle>
          <CardDescription>
            No pudimos completar tu pago
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="text-center text-sm text-muted-foreground">
            <p>El pago no pudo ser procesado.</p>
            <p>Puedes intentar nuevamente o contactar al personal.</p>
          </div>

          <div className="space-y-2">
            <Button asChild className="w-full" size="lg">
              <Link href="/salon">
                <RotateCcw className="mr-2 h-4 w-4" />
                Intentar Nuevamente
              </Link>
            </Button>

            <Button asChild variant="outline" className="w-full" size="lg">
              <Link href="/salon">
                <Home className="mr-2 h-4 w-4" />
                Volver al Salón
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default function PaymentFailurePage() {
  return (
    <Suspense fallback={<div>Cargando...</div>}>
      <FailureContent />
    </Suspense>
  );
}
```

### 7. Payment Pending Page (45 min)
**Archivo**: `app/(public)/payment/pending/page.tsx`

```typescript
/**
 * Página de pago pendiente
 * Para pagos que requieren confirmación (ej: transferencia bancaria)
 * 
 * Features:
 * - Muestra estado de espera
 * - Polling del estado
 * - Redirige automáticamente al aprobar
 */

import { Suspense } from 'react';
import Link from 'next/link';
import { Clock, Home } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

function PendingContent() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-yellow-50 to-amber-50 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center mb-4">
            <Clock className="w-10 h-10 text-yellow-600" />
          </div>
          <CardTitle className="text-2xl">Pago Pendiente</CardTitle>
          <CardDescription>
            Estamos procesando tu pago
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="text-center text-sm text-muted-foreground">
            <p>Tu pago está siendo verificado.</p>
            <p>Recibirás una notificación cuando se confirme.</p>
          </div>

          <Button asChild variant="outline" className="w-full" size="lg">
            <Link href="/salon">
              <Home className="mr-2 h-4 w-4" />
              Volver al Salón
            </Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}

export default function PaymentPendingPage() {
  return (
    <Suspense fallback={<div>Cargando...</div>}>
      <PendingContent />
    </Suspense>
  );
}
```

### 8. Integration with Orders Panel (1.5 horas)
**Archivo**: `components/orders-panel.tsx` (modificar)

```typescript
/**
 * Agregar botón de pago a cada pedido en OrdersPanel
 * Modificaciones:
 * 1. Importar PaymentModal
 * 2. Agregar estado para modal de pago
 * 3. Agregar botón "Pagar" junto a cada pedido
 * 4. Deshabilitar para pedidos que ya tienen pago activo
 */

// Agregar al componente OrdersPanel:

import { PaymentModal } from './payment-modal';
import { useState } from 'react';
import { CreditCard } from 'lucide-react';

// Dentro del componente, agregar estado:
const [paymentModalOpen, setPaymentModalOpen] = useState(false);
const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);

// En el render de cada pedido, agregar botón:
<Button
  size="sm"
  variant="outline"
  onClick={() => {
    setSelectedOrder(order);
    setPaymentModalOpen(true);
  }}
  disabled={order.status === 'paid'}
>
  <CreditCard className="mr-2 h-4 w-4" />
  {order.status === 'paid' ? 'Pagado' : 'Pagar'}
</Button>

// Al final del componente, agregar modal:
{selectedOrder && (
  <PaymentModal
    open={paymentModalOpen}
    onOpenChange={setPaymentModalOpen}
    order={{
      id: selectedOrder.id,
      tableId: selectedOrder.tableId,
      items: selectedOrder.items,
      total: selectedOrder.total,
    }}
  />
)}
```

### 9. Environment Variables Update
**Archivo**: `.env.local` (agregar)

```env
# MercadoPago Public Key (frontend)
NEXT_PUBLIC_MERCADOPAGO_PUBLIC_KEY=your_public_key_here

# Payment Environment (frontend)
NEXT_PUBLIC_PAYMENT_SANDBOX=true

# Webhook URL (debe ser accesible públicamente)
PAYMENT_WEBHOOK_URL=https://your-domain.com/api/webhook/mercadopago
```

### 10. UI Components Check
Verificar que existen estos componentes de shadcn/ui:
- Dialog ✓
- Button ✓
- Badge ✓
- Card ✓
- Separator ✓

Si falta alguno, instalarlo con:
```bash
npx shadcn-ui@latest add [component-name]
```

## Checklist de Implementación

### Paso 1: Utilities & Types (30 min)
- [ ] Crear `lib/payment-client-utils.ts` con helpers de formato
- [ ] Agregar funciones de formateo de moneda
- [ ] Agregar mapeos de estado y colores
- [ ] Exportar config del cliente

### Paso 2: Custom Hook (1 hora)
- [ ] Crear `hooks/use-payment.ts`
- [ ] Implementar `createPayment` function
- [ ] Implementar `getPaymentStatus` function
- [ ] Agregar listener de WebSocket para `payment:updated`
- [ ] Gestionar estados de loading y error

### Paso 3: Core Components (3 horas)
- [ ] Crear `components/checkout-button.tsx`
  - [ ] Integrar `usePayment` hook
  - [ ] Implementar apertura de Checkout Pro en popup
  - [ ] Agregar manejo de errores con toast
- [ ] Crear `components/payment-modal.tsx`
  - [ ] Diseñar UI de resumen de pedido
  - [ ] Integrar CheckoutButton
  - [ ] Implementar polling de estado
  - [ ] Auto-cierre al aprobar pago

### Paso 4: Result Pages (2.5 horas)
- [ ] Crear `app/(public)/payment/success/page.tsx`
  - [ ] Diseño de éxito con animación
  - [ ] Botón para volver al salón
- [ ] Crear `app/(public)/payment/failure/page.tsx`
  - [ ] Diseño de error
  - [ ] Botón de reintentar
- [ ] Crear `app/(public)/payment/pending/page.tsx`
  - [ ] Diseño de pendiente
  - [ ] Implementar polling opcional

### Paso 5: Integration (1.5 horas)
- [ ] Modificar `components/orders-panel.tsx`
  - [ ] Agregar botón de pago por pedido
  - [ ] Integrar PaymentModal
  - [ ] Actualizar estado de pedido después de pago
- [ ] Verificar componentes UI necesarios
- [ ] Instalar componentes faltantes de shadcn

### Paso 6: Testing Manual (1 hora)
- [ ] Probar flujo completo de pago
  - [ ] Crear pedido → Abrir modal → Pagar → Confirmar success
- [ ] Probar escenarios de error
  - [ ] Pago rechazado → Verificar failure page
- [ ] Probar actualización en tiempo real
  - [ ] Webhook actualiza estado → UI refleja cambio
- [ ] Probar con múltiples pestañas
  - [ ] WebSocket sincroniza estado entre tabs

## Validación Final

### Build & Lint
```bash
npm run lint
npm run build
```

### Manual Testing Checklist
1. [ ] Crear pedido desde Orders Panel
2. [ ] Abrir modal de pago
3. [ ] Verificar resumen correcto del pedido
4. [ ] Clic en "Pagar" abre Checkout Pro
5. [ ] Completar pago en sandbox de MercadoPago
6. [ ] Verificar redirección a success page
7. [ ] Verificar que webhook actualiza estado
8. [ ] Verificar que UI refleja pago aprobado
9. [ ] Probar pago rechazado → failure page
10. [ ] Verificar que botón "Pagar" se deshabilita después de pago exitoso

### Regression Testing
- [ ] Funcionalidad existente de pedidos no afectada
- [ ] WebSocket funciona para otros eventos (orders, tables)
- [ ] Performance no degradado (build time, bundle size)

## Commit Structure

```bash
# Staging
git add lib/payment-client-utils.ts
git add hooks/use-payment.ts
git add components/checkout-button.tsx
git add components/payment-modal.tsx
git add app/(public)/payment/success/page.tsx
git add app/(public)/payment/failure/page.tsx
git add app/(public)/payment/pending/page.tsx
git add components/orders-panel.tsx

# Commit
git commit -m "feat(m5): implement payment checkout frontend

- Add payment client utilities for formatting and status
- Create usePayment hook with WebSocket integration
- Implement CheckoutButton with MercadoPago Checkout Pro
- Create PaymentModal with order summary and polling
- Add payment result pages (success/failure/pending)
- Integrate payment button into OrdersPanel
- Add real-time payment status updates

Phase 3 of M5 (Digital Payments) - Frontend Implementation
Estimated: 8-10 hours
Files: 8 modified/created"

# Push
git push origin feature/backend-payments-mercadopago
```

## Siguientes Pasos (Fase 4)
Después de completar esta fase:
1. Testing automatizado (E2E con Playwright)
2. Documentación de APIs
3. Load testing con Artillery
4. Guía de troubleshooting
5. PR Review y merge a develop

## Recursos
- [MercadoPago Checkout Pro Docs](https://www.mercadopago.com.ar/developers/es/docs/checkout-pro/landing)
- [Next.js App Router](https://nextjs.org/docs/app)
- [shadcn/ui Components](https://ui.shadcn.com/)
- WebSocket Events: Ver `lib/socket-events.ts`

## Notas Importantes
1. **Popup Blockers**: Los navegadores pueden bloquear la ventana de Checkout Pro. Agregar instrucciones para usuarios.
2. **Webhook URL**: En desarrollo local, usar ngrok o similar para exponer webhook públicamente.
3. **Sandbox Testing**: Usar tarjetas de prueba de MercadoPago documentadas.
4. **CORS**: Verificar que el backend acepta requests del dominio de frontend.
5. **Environment Variables**: Nunca commitear `.env.local` con keys reales.

---

**¡Listo para implementar!** Sigue el checklist paso a paso y valida cada componente antes de pasar al siguiente.
