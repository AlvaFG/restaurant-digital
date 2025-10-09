# 🔧 PROMPT EJECUTABLE: M5 Fase 2 - Backend Integration

**Fecha de creación:** 9 de octubre de 2025  
**Branch objetivo:** `feature/backend-payments-mercadopago`  
**Fase:** 2 de 4 (Backend Integration)  
**Tiempo estimado:** 6-8 horas  
**Agentes responsables:** Backend Architect + Lib Logic Owner

---

## 📋 CONTEXTO

### Estado Actual del Proyecto:
- ✅ **Fase 1 completada:** Research, arquitectura definida, tipos creados
- ✅ **Payment Types:** `lib/server/payment-types.ts` con tipos completos
- ✅ **Order Store:** Sistema de órdenes funcionando con persistencia
- ✅ **WebSocket:** Sistema en tiempo real operativo
- 🎯 **Objetivo Fase 2:** Implementar backend de pagos (Store, Provider, API, Webhooks)

### Dependencias Verificadas:
- ✅ `lib/server/payment-types.ts` existe y contiene todos los tipos necesarios
- ✅ `lib/server/order-store.ts` con métodos CRUD funcionando
- ✅ `lib/socket.ts` con sistema de eventos WebSocket
- ✅ `docs/payments/` con documentación de arquitectura
- ✅ Variables de entorno configuradas en `.env.local`

---

## 🎯 OBJETIVO FASE 2

Implementar el backend completo del sistema de pagos:
1. Payment Store (persistencia)
2. Mercado Pago Provider (integración SDK)
3. API Endpoints (REST)
4. Webhook Handler (notificaciones)
5. Integración con Order Store
6. Tests unitarios

### Definition of Done:
- [ ] PaymentStore con CRUD completo
- [ ] MercadoPagoProvider implementado
- [ ] Endpoints API funcionando (POST/GET/PATCH)
- [ ] Webhook procesando notificaciones de Mercado Pago
- [ ] Integración con Order Store completada
- [ ] Eventos WebSocket emitidos correctamente
- [ ] 37+ tests unitarios pasando
- [ ] npm run build exitoso
- [ ] npm run lint sin warnings

---

## 📝 TAREA #1: Payment Store (2-3 horas)

### Objetivo:
Crear sistema de persistencia para payments similar al order-store.

### Paso 1: Crear estructura de datos

**Archivo:** `data/payment-store.json`

```json
{
  "payments": [],
  "metadata": {
    "version": 0,
    "updatedAt": "2025-10-09T00:00:00.000Z"
  },
  "sequence": 0
}
```

### Paso 2: Implementar Payment Store

**Archivo:** `lib/server/payment-store.ts`

```typescript
/**
 * Payment Store - Persistencia de pagos digitales
 * 
 * Maneja operaciones CRUD sobre payments
 * Integra con WebSocket para eventos en tiempo real
 * Valida reglas de negocio (duplicados, estados, etc.)
 * 
 * @module payment-store
 * @version 1.0.0
 */

import fs from 'fs/promises'
import path from 'path'
import { randomBytes } from 'crypto'
import { getServerSocket } from '@/lib/socket'
import {
  type Payment,
  type PaymentStatus,
  type PaymentStoreData,
  type PaymentStoreMetadata,
  type ListPaymentsFilters,
  type PaymentsSummary,
  type PaymentProvider,
  type Currency,
  PaymentError,
  PAYMENT_ERROR_CODES,
  isValidStatusTransition,
  serializePayment,
  calculateSuccessRate,
} from './payment-types'

const STORE_PATH = path.join(process.cwd(), 'data', 'payment-store.json')

// ============================================================================
// PAYMENT STORE IMPLEMENTATION
// ============================================================================

class PaymentStore {
  private cache: PaymentStoreData | null = null
  private writeLock: Promise<void> = Promise.resolve()

  /**
   * Leer payment store desde disco
   */
  private async read(): Promise<PaymentStoreData> {
    if (this.cache) {
      return this.cache
    }

    try {
      const content = await fs.readFile(STORE_PATH, 'utf-8')
      const data = JSON.parse(content) as PaymentStoreData

      // Hidratar fechas
      data.payments = data.payments.map(p => ({
        ...p,
        createdAt: new Date(p.createdAt),
        updatedAt: new Date(p.updatedAt),
        completedAt: p.completedAt ? new Date(p.completedAt) : undefined,
        expiresAt: p.expiresAt ? new Date(p.expiresAt) : undefined,
      }))

      this.cache = data
      return data
    } catch (error) {
      console.error('[payment-store] Error reading store:', error)
      
      // Inicializar store si no existe
      const initialData: PaymentStoreData = {
        payments: [],
        metadata: {
          version: 0,
          updatedAt: new Date().toISOString(),
        },
        sequence: 0,
      }
      
      await this.write(initialData)
      return initialData
    }
  }

  /**
   * Escribir payment store a disco
   */
  private async write(data: PaymentStoreData): Promise<void> {
    this.writeLock = this.writeLock.then(async () => {
      try {
        // Actualizar metadata
        data.metadata.version += 1
        data.metadata.updatedAt = new Date().toISOString()

        // Serializar fechas
        const serialized = {
          ...data,
          payments: data.payments.map(p => ({
            ...p,
            createdAt: p.createdAt.toISOString(),
            updatedAt: p.updatedAt.toISOString(),
            completedAt: p.completedAt?.toISOString(),
            expiresAt: p.expiresAt?.toISOString(),
          })),
        }

        await fs.writeFile(STORE_PATH, JSON.stringify(serialized, null, 2), 'utf-8')
        this.cache = data

        console.log(`[payment-store] Written version ${data.metadata.version}`)
      } catch (error) {
        console.error('[payment-store] Error writing store:', error)
        throw new PaymentError(
          'Failed to persist payment data',
          PAYMENT_ERROR_CODES.INTERNAL_ERROR,
          500
        )
      }
    })

    await this.writeLock
  }

  /**
   * Generar ID único para payment
   * Formato: pmt-{timestamp}-{sequence}-{random}
   */
  private generatePaymentId(sequence: number): string {
    const timestamp = Date.now()
    const random = randomBytes(4).toString('hex')
    return `pmt-${timestamp}-${String(sequence).padStart(3, '0')}-${random}`
  }

  /**
   * Emitir evento WebSocket
   */
  private emitEvent(event: string, payload: unknown): void {
    try {
      const io = getServerSocket()
      if (io) {
        io.emit(event, payload)
        console.log(`[payment-store] Event emitted: ${event}`)
      }
    } catch (error) {
      console.error('[payment-store] Error emitting event:', error)
    }
  }

  // ==========================================================================
  // PUBLIC API - CRUD OPERATIONS
  // ==========================================================================

  /**
   * Crear nuevo payment
   */
  async create(params: {
    orderId: string
    tableId: string
    provider: PaymentProvider
    amount: number
    currency: Currency
    externalId: string
    checkoutUrl?: string
    expiresAt?: Date
    metadata?: Payment['metadata']
  }): Promise<Payment> {
    const data = await this.read()

    // Validar que no exista payment activo para esta orden
    const hasActive = data.payments.some(
      p => 
        p.orderId === params.orderId && 
        (p.status === 'pending' || p.status === 'processing')
    )

    if (hasActive) {
      throw new PaymentError(
        'Order already has an active payment',
        PAYMENT_ERROR_CODES.PAYMENT_IN_PROGRESS,
        409
      )
    }

    // Crear payment
    const now = new Date()
    const sequence = data.sequence + 1

    const payment: Payment = {
      id: this.generatePaymentId(sequence),
      orderId: params.orderId,
      tableId: params.tableId,
      provider: params.provider,
      status: 'pending',
      amount: params.amount,
      currency: params.currency,
      externalId: params.externalId,
      checkoutUrl: params.checkoutUrl,
      expiresAt: params.expiresAt,
      metadata: params.metadata,
      createdAt: now,
      updatedAt: now,
    }

    data.payments.push(payment)
    data.sequence = sequence

    await this.write(data)

    // Emitir evento
    this.emitEvent('payment.created', {
      payment: serializePayment(payment),
      metadata: data.metadata,
    })

    console.log(`[payment-store] Payment created: ${payment.id} for order ${params.orderId}`)
    return payment
  }

  /**
   * Obtener payment por ID
   */
  async getById(id: string): Promise<Payment | null> {
    const data = await this.read()
    const payment = data.payments.find(p => p.id === id)
    return payment || null
  }

  /**
   * Obtener payment por ID externo
   */
  async getByExternalId(externalId: string): Promise<Payment | null> {
    const data = await this.read()
    const payment = data.payments.find(p => p.externalId === externalId)
    return payment || null
  }

  /**
   * Obtener payments por orden
   */
  async getByOrderId(orderId: string): Promise<Payment[]> {
    const data = await this.read()
    return data.payments.filter(p => p.orderId === orderId)
  }

  /**
   * Listar payments con filtros
   */
  async list(filters: ListPaymentsFilters = {}): Promise<Payment[]> {
    const data = await this.read()
    let payments = [...data.payments]

    // Filtrar por status
    if (filters.status) {
      const statuses = Array.isArray(filters.status) ? filters.status : [filters.status]
      payments = payments.filter(p => statuses.includes(p.status))
    }

    // Filtrar por orderId
    if (filters.orderId) {
      payments = payments.filter(p => p.orderId === filters.orderId)
    }

    // Filtrar por tableId
    if (filters.tableId) {
      payments = payments.filter(p => p.tableId === filters.tableId)
    }

    // Filtrar por provider
    if (filters.provider) {
      payments = payments.filter(p => p.provider === filters.provider)
    }

    // Filtrar por método de pago
    if (filters.method) {
      payments = payments.filter(p => p.method === filters.method)
    }

    // Búsqueda por texto (reference o email)
    if (filters.search) {
      const search = filters.search.toLowerCase()
      payments = payments.filter(p => 
        p.id.toLowerCase().includes(search) ||
        p.orderId.toLowerCase().includes(search) ||
        p.metadata?.reference?.toLowerCase().includes(search) ||
        p.metadata?.customerEmail?.toLowerCase().includes(search)
      )
    }

    // Ordenar
    const sortField = filters.sort === 'oldest' ? 'asc' : 'desc'
    payments.sort((a, b) => {
      const diff = a.createdAt.getTime() - b.createdAt.getTime()
      return sortField === 'asc' ? diff : -diff
    })

    // Limitar resultados
    if (filters.limit) {
      payments = payments.slice(0, filters.limit)
    }

    return payments
  }

  /**
   * Actualizar payment (parcial)
   */
  async update(id: string, updates: Partial<Payment>): Promise<Payment> {
    const data = await this.read()
    const index = data.payments.findIndex(p => p.id === id)

    if (index === -1) {
      throw new PaymentError(
        `Payment not found: ${id}`,
        PAYMENT_ERROR_CODES.PAYMENT_NOT_FOUND,
        404
      )
    }

    const payment = data.payments[index]!
    const updatedPayment: Payment = {
      ...payment,
      ...updates,
      id: payment.id, // Nunca cambiar ID
      createdAt: payment.createdAt, // Nunca cambiar createdAt
      updatedAt: new Date(),
    }

    data.payments[index] = updatedPayment
    await this.write(data)

    // Emitir evento
    this.emitEvent('payment.updated', {
      payment: serializePayment(updatedPayment),
      metadata: data.metadata,
    })

    console.log(`[payment-store] Payment updated: ${id}`)
    return updatedPayment
  }

  /**
   * Actualizar estado del payment
   */
  async updateStatus(
    id: string,
    newStatus: PaymentStatus,
    options: {
      method?: Payment['method']
      failureReason?: string
      failureCode?: string
      completedAt?: Date
    } = {}
  ): Promise<Payment> {
    const data = await this.read()
    const index = data.payments.findIndex(p => p.id === id)

    if (index === -1) {
      throw new PaymentError(
        `Payment not found: ${id}`,
        PAYMENT_ERROR_CODES.PAYMENT_NOT_FOUND,
        404
      )
    }

    const payment = data.payments[index]!
    const previousStatus = payment.status

    // Validar transición de estado
    if (!isValidStatusTransition(previousStatus, newStatus)) {
      throw new PaymentError(
        `Invalid status transition: ${previousStatus} -> ${newStatus}`,
        PAYMENT_ERROR_CODES.INVALID_PAYMENT_STATUS,
        400
      )
    }

    // Actualizar payment
    const updatedPayment: Payment = {
      ...payment,
      status: newStatus,
      method: options.method || payment.method,
      failureReason: options.failureReason,
      failureCode: options.failureCode,
      completedAt: newStatus === 'completed' ? (options.completedAt || new Date()) : undefined,
      updatedAt: new Date(),
    }

    data.payments[index] = updatedPayment
    await this.write(data)

    // Emitir evento específico
    if (newStatus === 'completed') {
      this.emitEvent('payment.completed', {
        payment: serializePayment(updatedPayment),
        metadata: data.metadata,
      })
    } else if (newStatus === 'failed') {
      this.emitEvent('payment.failed', {
        payment: serializePayment(updatedPayment),
        reason: options.failureReason || 'Unknown error',
        code: options.failureCode,
        metadata: data.metadata,
      })
    } else {
      this.emitEvent('payment.updated', {
        payment: serializePayment(updatedPayment),
        previousStatus,
        metadata: data.metadata,
      })
    }

    console.log(`[payment-store] Payment ${id} status: ${previousStatus} -> ${newStatus}`)
    return updatedPayment
  }

  /**
   * Verificar si orden tiene payment activo
   */
  async hasActivePayment(orderId: string): Promise<boolean> {
    const data = await this.read()
    return data.payments.some(
      p => 
        p.orderId === orderId && 
        (p.status === 'pending' || p.status === 'processing')
    )
  }

  /**
   * Obtener summary de payments
   */
  async getSummary(): Promise<PaymentsSummary> {
    const data = await this.read()
    const payments = data.payments

    const byStatus: Record<PaymentStatus, number> = {
      pending: 0,
      processing: 0,
      completed: 0,
      failed: 0,
      refunded: 0,
      cancelled: 0,
      expired: 0,
    }

    const byProvider: Record<PaymentProvider, number> = {
      mercadopago: 0,
      stripe: 0,
    }

    let totalProcessed = 0
    let totalPending = 0
    let oldestPaymentAt: Date | null = null
    let latestPaymentAt: Date | null = null

    payments.forEach(p => {
      byStatus[p.status]++
      byProvider[p.provider]++

      if (p.status === 'completed') {
        totalProcessed += p.amount
      }
      if (p.status === 'pending' || p.status === 'processing') {
        totalPending += p.amount
      }

      if (!oldestPaymentAt || p.createdAt < oldestPaymentAt) {
        oldestPaymentAt = p.createdAt
      }
      if (!latestPaymentAt || p.createdAt > latestPaymentAt) {
        latestPaymentAt = p.createdAt
      }
    })

    return {
      total: payments.length,
      byStatus,
      byProvider,
      oldestPaymentAt: oldestPaymentAt?.toISOString() || null,
      latestPaymentAt: latestPaymentAt?.toISOString() || null,
      totalProcessed,
      totalPending,
      successRate: calculateSuccessRate(payments),
    }
  }

  /**
   * Obtener metadata del store
   */
  async getMetadata(): Promise<PaymentStoreMetadata> {
    const data = await this.read()
    return data.metadata
  }

  /**
   * Invalidar cache (para testing)
   */
  invalidateCache(): void {
    this.cache = null
  }
}

// ============================================================================
// SINGLETON EXPORT
// ============================================================================

export const paymentStore = new PaymentStore()
```

### Paso 3: Tests del Payment Store

**Archivo:** `lib/server/__tests__/payment-store.test.ts`

```typescript
import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { paymentStore } from '../payment-store'
import { PaymentError, PAYMENT_ERROR_CODES } from '../payment-types'

describe('PaymentStore', () => {
  beforeEach(() => {
    paymentStore.invalidateCache()
  })

  describe('create', () => {
    it('should create payment successfully', async () => {
      const payment = await paymentStore.create({
        orderId: 'order-123',
        tableId: 'table-1',
        provider: 'mercadopago',
        amount: 50000,
        currency: 'ARS',
        externalId: 'mp-pref-123',
        checkoutUrl: 'https://mpago.la/123',
      })

      expect(payment.id).toMatch(/^pmt-\d+-\d{3}-[a-f0-9]{8}$/)
      expect(payment.status).toBe('pending')
      expect(payment.orderId).toBe('order-123')
      expect(payment.amount).toBe(50000)
    })

    it('should prevent duplicate active payments for same order', async () => {
      await paymentStore.create({
        orderId: 'order-123',
        tableId: 'table-1',
        provider: 'mercadopago',
        amount: 50000,
        currency: 'ARS',
        externalId: 'mp-pref-123',
      })

      await expect(
        paymentStore.create({
          orderId: 'order-123',
          tableId: 'table-1',
          provider: 'mercadopago',
          amount: 50000,
          currency: 'ARS',
          externalId: 'mp-pref-456',
        })
      ).rejects.toThrow(PaymentError)
    })
  })

  describe('getById', () => {
    it('should return payment by ID', async () => {
      const created = await paymentStore.create({
        orderId: 'order-123',
        tableId: 'table-1',
        provider: 'mercadopago',
        amount: 50000,
        currency: 'ARS',
        externalId: 'mp-pref-123',
      })

      const found = await paymentStore.getById(created.id)
      expect(found).toBeDefined()
      expect(found?.id).toBe(created.id)
    })

    it('should return null for non-existent payment', async () => {
      const found = await paymentStore.getById('non-existent')
      expect(found).toBeNull()
    })
  })

  describe('updateStatus', () => {
    it('should update payment status', async () => {
      const payment = await paymentStore.create({
        orderId: 'order-123',
        tableId: 'table-1',
        provider: 'mercadopago',
        amount: 50000,
        currency: 'ARS',
        externalId: 'mp-pref-123',
      })

      const updated = await paymentStore.updateStatus(payment.id, 'completed', {
        method: 'credit_card',
      })

      expect(updated.status).toBe('completed')
      expect(updated.method).toBe('credit_card')
      expect(updated.completedAt).toBeDefined()
    })

    it('should reject invalid status transition', async () => {
      const payment = await paymentStore.create({
        orderId: 'order-123',
        tableId: 'table-1',
        provider: 'mercadopago',
        amount: 50000,
        currency: 'ARS',
        externalId: 'mp-pref-123',
      })

      await paymentStore.updateStatus(payment.id, 'completed')

      await expect(
        paymentStore.updateStatus(payment.id, 'pending')
      ).rejects.toThrow(PaymentError)
    })
  })

  describe('list', () => {
    it('should list payments with filters', async () => {
      await paymentStore.create({
        orderId: 'order-1',
        tableId: 'table-1',
        provider: 'mercadopago',
        amount: 50000,
        currency: 'ARS',
        externalId: 'mp-1',
      })

      await paymentStore.create({
        orderId: 'order-2',
        tableId: 'table-1',
        provider: 'mercadopago',
        amount: 30000,
        currency: 'ARS',
        externalId: 'mp-2',
      })

      const all = await paymentStore.list()
      expect(all.length).toBeGreaterThanOrEqual(2)

      const filtered = await paymentStore.list({ orderId: 'order-1' })
      expect(filtered.length).toBe(1)
      expect(filtered[0]?.orderId).toBe('order-1')
    })
  })
})
```

**Validación:**
```powershell
npm run test -- payment-store.test.ts
```

---

## 📝 TAREA #2: Mercado Pago Provider (2-3 horas)

### Objetivo:
Implementar integración con SDK de Mercado Pago.

### Paso 1: Instalar dependencias

```powershell
npm install mercadopago@^2.0.0
npm install -D @types/node
```

### Paso 2: Configuración de Payment

**Archivo:** `lib/server/payment-config.ts`

```typescript
/**
 * Payment Configuration
 * 
 * Carga y valida configuración de pasarelas de pago
 * desde variables de entorno
 */

import type { MercadoPagoConfig } from './payment-types'

/**
 * Validar que todas las variables de entorno requeridas existan
 */
function validateEnvVars() {
  const required = [
    'MERCADOPAGO_ACCESS_TOKEN',
    'NEXT_PUBLIC_MERCADOPAGO_PUBLIC_KEY',
  ]

  const missing = required.filter(key => !process.env[key])

  if (missing.length > 0) {
    throw new Error(
      `Missing required environment variables for payments: ${missing.join(', ')}\n` +
      `Please check your .env.local file.`
    )
  }
}

/**
 * Obtener configuración de Mercado Pago
 */
export function getMercadoPagoConfig(): MercadoPagoConfig {
  validateEnvVars()

  return {
    accessToken: process.env.MERCADOPAGO_ACCESS_TOKEN!,
    publicKey: process.env.NEXT_PUBLIC_MERCADOPAGO_PUBLIC_KEY!,
    webhookSecret: process.env.MERCADOPAGO_WEBHOOK_SECRET,
    sandbox: process.env.PAYMENT_SANDBOX === 'true',
    timeout: parseInt(process.env.PAYMENT_PROVIDER_TIMEOUT || '10000', 10),
  }
}

/**
 * Obtener configuración general de pagos
 */
export function getPaymentConfig() {
  return {
    provider: (process.env.PAYMENT_PROVIDER || 'mercadopago') as 'mercadopago' | 'stripe',
    mercadopago: getMercadoPagoConfig(),
    returnUrl: process.env.PAYMENT_RETURN_URL || `${process.env.NEXT_PUBLIC_APP_URL}/payment/success`,
    failureUrl: process.env.PAYMENT_FAILURE_URL || `${process.env.NEXT_PUBLIC_APP_URL}/payment/failure`,
    webhookUrl: process.env.PAYMENT_WEBHOOK_URL,
  }
}
```

### Paso 3: Base Provider Interface

**Archivo:** `lib/server/providers/base-provider.ts`

```typescript
/**
 * Base Payment Provider Interface
 * 
 * Contrato que deben cumplir todos los providers de pago
 */

import type {
  CreatePaymentOptions,
  PaymentResult,
  PaymentStatus,
  WebhookPayload,
  WebhookResult,
} from '../payment-types'

export interface IPaymentProvider {
  /**
   * Crear intención de pago en el provider
   */
  createPayment(options: CreatePaymentOptions): Promise<PaymentResult>

  /**
   * Consultar estado de un pago
   */
  getPaymentStatus(externalId: string): Promise<PaymentStatus>

  /**
   * Procesar notificación webhook del provider
   */
  processWebhook(payload: WebhookPayload): Promise<WebhookResult>

  /**
   * Reembolsar pago (opcional)
   */
  refundPayment?(externalId: string, amount?: number): Promise<void>
}
```

### Paso 4: Mercado Pago Provider

**Archivo:** `lib/server/providers/mercadopago-provider.ts`

```typescript
/**
 * Mercado Pago Provider
 * 
 * Integración con Mercado Pago API usando SDK oficial
 * Implementa IPaymentProvider para abstracción
 */

import { MercadoPagoConfig, Preference, Payment as MPPayment } from 'mercadopago'
import type { IPaymentProvider } from './base-provider'
import type {
  CreatePaymentOptions,
  PaymentResult,
  PaymentStatus,
  WebhookPayload,
  WebhookResult,
  MercadoPagoConfig as MPConfig,
  PaymentError,
} from '../payment-types'
import { PAYMENT_ERROR_CODES } from '../payment-types'

// Mapeo de estados de Mercado Pago a nuestros PaymentStatus
const MP_STATUS_MAP: Record<string, PaymentStatus> = {
  'pending': 'pending',
  'approved': 'completed',
  'authorized': 'processing',
  'in_process': 'processing',
  'in_mediation': 'processing',
  'rejected': 'failed',
  'cancelled': 'cancelled',
  'refunded': 'refunded',
  'charged_back': 'refunded',
}

export class MercadoPagoProvider implements IPaymentProvider {
  private client: MercadoPagoConfig
  private preferenceClient: Preference
  private paymentClient: MPPayment
  private config: MPConfig

  constructor(config: MPConfig) {
    this.config = config

    // Inicializar cliente de Mercado Pago
    this.client = new MercadoPagoConfig({
      accessToken: config.accessToken,
      options: {
        timeout: config.timeout || 10000,
        idempotencyKey: undefined, // Se configura por request
      },
    })

    this.preferenceClient = new Preference(this.client)
    this.paymentClient = new MPPayment(this.client)

    console.log('[MercadoPagoProvider] Initialized', {
      sandbox: config.sandbox,
      timeout: config.timeout,
    })
  }

  /**
   * Crear preference en Mercado Pago
   */
  async createPayment(options: CreatePaymentOptions): Promise<PaymentResult> {
    try {
      console.log('[MercadoPagoProvider] Creating preference', {
        amount: options.amount,
        orderId: options.orderId,
      })

      // Crear preference
      const preference = await this.preferenceClient.create({
        body: {
          items: [
            {
              id: options.orderId,
              title: options.description || `Pedido ${options.orderId}`,
              quantity: 1,
              unit_price: options.amount / 100, // Convertir centavos a pesos
              currency_id: options.currency,
            },
          ],
          payer: options.customerEmail ? {
            email: options.customerEmail,
            name: options.customerName,
          } : undefined,
          back_urls: {
            success: options.returnUrl,
            failure: options.failureUrl,
            pending: options.returnUrl,
          },
          auto_return: 'approved',
          external_reference: options.orderId,
          notification_url: this.config.webhookUrl,
          expires: options.expiresAt ? true : undefined,
          expiration_date_from: options.expiresAt 
            ? new Date().toISOString()
            : undefined,
          expiration_date_to: options.expiresAt?.toISOString(),
          metadata: options.metadata,
        },
      })

      if (!preference.id) {
        throw new Error('No preference ID returned from Mercado Pago')
      }

      const checkoutUrl = this.config.sandbox
        ? preference.sandbox_init_point!
        : preference.init_point!

      console.log('[MercadoPagoProvider] Preference created', {
        preferenceId: preference.id,
        checkoutUrl,
      })

      return {
        externalId: preference.id,
        checkoutUrl,
        status: 'pending',
        expiresAt: preference.expiration_date_to 
          ? new Date(preference.expiration_date_to)
          : undefined,
      }
    } catch (error) {
      console.error('[MercadoPagoProvider] Error creating preference:', error)
      throw this.handleError(error)
    }
  }

  /**
   * Consultar estado de pago en Mercado Pago
   */
  async getPaymentStatus(externalId: string): Promise<PaymentStatus> {
    try {
      // Buscar payment por preference_id (external_reference en MP)
      const searchResult = await this.paymentClient.search({
        options: {
          criteria: 'desc',
          external_reference: externalId,
        },
      })

      if (!searchResult.results || searchResult.results.length === 0) {
        return 'pending'
      }

      // Obtener el payment más reciente
      const latestPayment = searchResult.results[0]!
      const mpStatus = latestPayment.status || 'pending'

      return MP_STATUS_MAP[mpStatus] || 'pending'
    } catch (error) {
      console.error('[MercadoPagoProvider] Error getting payment status:', error)
      throw this.handleError(error)
    }
  }

  /**
   * Procesar webhook de Mercado Pago
   */
  async processWebhook(payload: WebhookPayload): Promise<WebhookResult> {
    try {
      console.log('[MercadoPagoProvider] Processing webhook', {
        event: payload.event,
      })

      // Ignorar eventos que no sean de payment
      if (payload.event !== 'payment') {
        return {
          paymentId: '',
          status: 'pending',
          externalId: '',
          processed: false,
        }
      }

      // Extraer payment ID del payload
      const data = payload.data as { id?: string }
      const mpPaymentId = data?.id

      if (!mpPaymentId) {
        console.warn('[MercadoPagoProvider] No payment ID in webhook')
        return {
          paymentId: '',
          status: 'pending',
          externalId: '',
          processed: false,
        }
      }

      // Consultar payment en Mercado Pago
      const payment = await this.paymentClient.get({ id: mpPaymentId })

      if (!payment || !payment.status) {
        console.warn('[MercadoPagoProvider] Payment not found:', mpPaymentId)
        return {
          paymentId: '',
          status: 'pending',
          externalId: mpPaymentId,
          processed: false,
        }
      }

      const status = MP_STATUS_MAP[payment.status] || 'pending'
      const method = this.mapPaymentMethod(payment.payment_type_id || '')

      console.log('[MercadoPagoProvider] Webhook processed', {
        mpPaymentId,
        status: payment.status,
        mappedStatus: status,
        method,
      })

      return {
        paymentId: payment.external_reference || '',
        status,
        externalId: payment.id!.toString(),
        processed: true,
        method,
        failureReason: payment.status_detail,
        failureCode: payment.status_detail,
      }
    } catch (error) {
      console.error('[MercadoPagoProvider] Error processing webhook:', error)
      throw this.handleError(error)
    }
  }

  /**
   * Mapear tipo de pago de MP a nuestros métodos
   */
  private mapPaymentMethod(mpType: string): PaymentResult['method'] {
    const map: Record<string, NonNullable<PaymentResult['method']>> = {
      'credit_card': 'credit_card',
      'debit_card': 'debit_card',
      'ticket': 'cash',
      'bank_transfer': 'bank_transfer',
      'account_money': 'wallet',
      'digital_wallet': 'wallet',
    }

    return map[mpType]
  }

  /**
   * Convertir error a PaymentError
   */
  private handleError(error: unknown): PaymentError {
    const PaymentError = require('../payment-types').PaymentError

    if (error instanceof Error) {
      return new PaymentError(
        error.message,
        PAYMENT_ERROR_CODES.PROVIDER_ERROR,
        502,
        { originalError: error.message }
      )
    }

    return new PaymentError(
      'Unknown provider error',
      PAYMENT_ERROR_CODES.PROVIDER_ERROR,
      502
    )
  }
}
```

**Validación:**
```powershell
npm run test -- mercadopago-provider.test.ts
```

---

## 📝 TAREA #3: API Endpoints (2 horas)

### Objetivo:
Crear endpoints REST para gestionar payments.

### Paso 1: POST /api/payment (Crear payment)

**Archivo:** `app/api/payment/route.ts`

```typescript
import { NextRequest, NextResponse } from 'next/server'
import { paymentStore } from '@/lib/server/payment-store'
import { orderStore } from '@/lib/server/order-store'
import { MercadoPagoProvider } from '@/lib/server/providers/mercadopago-provider'
import { getMercadoPagoConfig, getPaymentConfig } from '@/lib/server/payment-config'
import { 
  PaymentError, 
  PAYMENT_ERROR_CODES,
  type CreatePaymentPayload,
  serializePayment,
} from '@/lib/server/payment-types'

/**
 * POST /api/payment
 * Crear nuevo payment para una orden
 */
export async function POST(request: NextRequest) {
  try {
    const payload: CreatePaymentPayload = await request.json()

    // Validar payload
    if (!payload.orderId) {
      throw new PaymentError(
        'orderId is required',
        PAYMENT_ERROR_CODES.INVALID_PAYLOAD,
        400
      )
    }

    // Verificar que orden existe
    const order = await orderStore.getById(payload.orderId)
    if (!order) {
      throw new PaymentError(
        `Order not found: ${payload.orderId}`,
        PAYMENT_ERROR_CODES.ORDER_NOT_FOUND,
        404
      )
    }

    // Verificar que orden no tenga payment activo
    const hasActive = await paymentStore.hasActivePayment(payload.orderId)
    if (hasActive) {
      throw new PaymentError(
        'Order already has an active payment',
        PAYMENT_ERROR_CODES.PAYMENT_IN_PROGRESS,
        409
      )
    }

    // Crear payment en Mercado Pago
    const config = getMercadoPagoConfig()
    const provider = new MercadoPagoProvider(config)
    const paymentConfig = getPaymentConfig()

    const result = await provider.createPayment({
      amount: order.total,
      currency: 'ARS',
      orderId: order.id,
      description: `Pedido #${order.id} - Mesa ${order.tableId}`,
      customerEmail: payload.metadata?.customerEmail,
      customerName: payload.metadata?.customerName,
      returnUrl: payload.returnUrl || paymentConfig.returnUrl,
      failureUrl: payload.failureUrl || paymentConfig.failureUrl,
      metadata: {
        tableId: order.tableId,
        ...payload.metadata?.custom,
      },
    })

    // Guardar payment en store
    const payment = await paymentStore.create({
      orderId: order.id,
      tableId: order.tableId,
      provider: 'mercadopago',
      amount: order.total,
      currency: 'ARS',
      externalId: result.externalId,
      checkoutUrl: result.checkoutUrl,
      expiresAt: result.expiresAt,
      metadata: {
        customerEmail: payload.metadata?.customerEmail,
        customerName: payload.metadata?.customerName,
        reference: payload.metadata?.reference,
        returnUrl: payload.returnUrl,
        failureUrl: payload.failureUrl,
      },
    })

    console.log(`[API] Payment created: ${payment.id} for order ${order.id}`)

    return NextResponse.json(
      {
        data: {
          paymentId: payment.id,
          checkoutUrl: payment.checkoutUrl!,
          status: payment.status,
          expiresAt: payment.expiresAt?.toISOString(),
        },
        metadata: {
          provider: payment.provider,
          createdAt: payment.createdAt.toISOString(),
        },
      },
      { status: 201 }
    )
  } catch (error) {
    console.error('[API] Payment creation error:', error)

    if (error instanceof PaymentError) {
      return NextResponse.json(
        {
          error: {
            message: error.message,
            code: error.code,
          },
        },
        { status: error.status }
      )
    }

    return NextResponse.json(
      {
        error: {
          message: 'Internal server error',
          code: PAYMENT_ERROR_CODES.INTERNAL_ERROR,
        },
      },
      { status: 500 }
    )
  }
}

/**
 * GET /api/payment
 * Listar payments con filtros
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)

    const filters = {
      orderId: searchParams.get('orderId') || undefined,
      tableId: searchParams.get('tableId') || undefined,
      status: searchParams.get('status') as any || undefined,
      provider: searchParams.get('provider') as any || undefined,
      search: searchParams.get('search') || undefined,
      limit: parseInt(searchParams.get('limit') || '50', 10),
      sort: (searchParams.get('sort') || 'newest') as 'newest' | 'oldest',
    }

    const payments = await paymentStore.list(filters)
    const summary = await paymentStore.getSummary()

    return NextResponse.json({
      data: payments.map(serializePayment),
      metadata: {
        total: payments.length,
        summary,
      },
    })
  } catch (error) {
    console.error('[API] Payment list error:', error)

    return NextResponse.json(
      {
        error: {
          message: 'Failed to fetch payments',
          code: PAYMENT_ERROR_CODES.INTERNAL_ERROR,
        },
      },
      { status: 500 }
    )
  }
}
```

### Paso 2: GET /api/payment/[id] (Obtener por ID)

**Archivo:** `app/api/payment/[id]/route.ts`

```typescript
import { NextRequest, NextResponse } from 'next/server'
import { paymentStore } from '@/lib/server/payment-store'
import { PaymentError, PAYMENT_ERROR_CODES, serializePayment } from '@/lib/server/payment-types'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const payment = await paymentStore.getById(params.id)

    if (!payment) {
      throw new PaymentError(
        `Payment not found: ${params.id}`,
        PAYMENT_ERROR_CODES.PAYMENT_NOT_FOUND,
        404
      )
    }

    return NextResponse.json({
      data: serializePayment(payment),
      metadata: {
        provider: payment.provider,
      },
    })
  } catch (error) {
    console.error('[API] Payment fetch error:', error)

    if (error instanceof PaymentError) {
      return NextResponse.json(
        {
          error: {
            message: error.message,
            code: error.code,
          },
        },
        { status: error.status }
      )
    }

    return NextResponse.json(
      {
        error: {
          message: 'Internal server error',
          code: PAYMENT_ERROR_CODES.INTERNAL_ERROR,
        },
      },
      { status: 500 }
    )
  }
}
```

### Paso 3: POST /api/webhook/mercadopago (Webhook)

**Archivo:** `app/api/webhook/mercadopago/route.ts`

```typescript
import { NextRequest, NextResponse } from 'next/server'
import { paymentStore } from '@/lib/server/payment-store'
import { MercadoPagoProvider } from '@/lib/server/providers/mercadopago-provider'
import { getMercadoPagoConfig } from '@/lib/server/payment-config'

/**
 * POST /api/webhook/mercadopago
 * Recibir notificaciones de Mercado Pago
 */
export async function POST(request: NextRequest) {
  try {
    const payload = await request.json()
    const signature = request.headers.get('x-signature')
    const requestId = request.headers.get('x-request-id')

    console.log('[WEBHOOK] Received notification', {
      type: payload.type,
      requestId,
      hasSignature: !!signature,
    })

    // Inicializar provider
    const config = getMercadoPagoConfig()
    const provider = new MercadoPagoProvider(config)

    // Procesar webhook
    const result = await provider.processWebhook({
      provider: 'mercadopago',
      event: payload.type,
      data: payload.data,
      signature: signature || undefined,
      timestamp: new Date().toISOString(),
    })

    // Si no se procesó, retornar OK sin hacer nada
    if (!result.processed) {
      console.log('[WEBHOOK] Event ignored:', payload.type)
      return NextResponse.json({ status: 'ignored' })
    }

    // Buscar payment por externalId
    const payment = await paymentStore.getByExternalId(result.externalId)

    if (!payment) {
      console.warn('[WEBHOOK] Payment not found for externalId:', result.externalId)
      return NextResponse.json({ status: 'payment_not_found' })
    }

    // Actualizar estado del payment
    const updated = await paymentStore.updateStatus(
      payment.id,
      result.status,
      {
        method: result.method,
        failureReason: result.failureReason,
        failureCode: result.failureCode,
      }
    )

    console.log('[WEBHOOK] Payment updated', {
      paymentId: updated.id,
      status: updated.status,
      method: updated.method,
    })

    return NextResponse.json({ status: 'ok' })
  } catch (error) {
    console.error('[WEBHOOK] Processing error:', error)

    // Siempre retornar 200 para evitar reintentos infinitos
    return NextResponse.json(
      { status: 'error', message: error instanceof Error ? error.message : 'Unknown error' },
      { status: 200 }
    )
  }
}

// Desactivar body parsing de Next.js para webhooks
export const dynamic = 'force-dynamic'
```

**Validación:**
```powershell
npm run test -- app/api/payment
npm run dev
# Testear con curl o Postman
```

---

## ✅ CHECKLIST FASE 2

Antes de considerar esta fase completa:

### Implementación:
- [ ] ✅ `data/payment-store.json` creado
- [ ] ✅ `lib/server/payment-store.ts` implementado
- [ ] ✅ `lib/server/payment-config.ts` implementado
- [ ] ✅ `lib/server/providers/base-provider.ts` creado
- [ ] ✅ `lib/server/providers/mercadopago-provider.ts` implementado
- [ ] ✅ `app/api/payment/route.ts` (POST, GET)
- [ ] ✅ `app/api/payment/[id]/route.ts` (GET)
- [ ] ✅ `app/api/webhook/mercadopago/route.ts` (POST)

### Tests:
- [ ] ✅ PaymentStore tests (12+ tests)
- [ ] ✅ MercadoPagoProvider tests (10+ tests)
- [ ] ✅ API endpoints tests (15+ tests)
- [ ] ✅ 37+ tests totales pasando

### Validación:
- [ ] ✅ `npm run test` - todos los tests pasan
- [ ] ✅ `npm run lint` - sin warnings
- [ ] ✅ `npm run build` - build exitoso
- [ ] ✅ POST /api/payment crea payment correctamente
- [ ] ✅ GET /api/payment lista payments con filtros
- [ ] ✅ GET /api/payment/[id] retorna payment por ID
- [ ] ✅ Webhook procesa notificaciones
- [ ] ✅ WebSocket emite eventos correctamente
- [ ] ✅ Payment store persiste en disco

### Documentación:
- [ ] ✅ Comentarios JSDoc en funciones principales
- [ ] ✅ Console logs estructurados
- [ ] ✅ Error handling robusto

---

## 📦 COMANDOS FINALES

```powershell
# Instalar dependencias
npm install mercadopago@^2.0.0

# Ejecutar tests
npm run test

# Lint
npm run lint

# Build
npm run build

# Commit
git add .
git commit -m "feat(m5): implement payment backend integration

- Add PaymentStore with CRUD operations
- Implement MercadoPago provider with SDK integration
- Create payment API endpoints (POST/GET)
- Add webhook handler for payment notifications
- Integrate with Order Store and WebSocket events
- Add 37+ unit tests for store, provider, and API

SCOPE: M5 Phase 2 - Backend Integration
AGENTS: Backend Architect + Lib Logic Owner
TESTS: 37/37 passing
"

git push origin feature/backend-payments-mercadopago
```

---

## 🎯 SIGUIENTE PASO

Una vez completada esta fase:
1. ✅ Revisar que todos los tests pasen
2. ✅ Validar que el build sea exitoso
3. ✅ Testear endpoints manualmente con curl/Postman
4. ✅ Verificar webhooks con webhook.site
5. 🚀 **Ejecutar PROMPT_M5_FASE3_FRONTEND.md** para la UI

---

## 💡 NOTAS IMPORTANTES

### Testing Manual:
```powershell
# Crear payment
curl -X POST http://localhost:3000/api/payment `
  -H "Content-Type: application/json" `
  -d '{"orderId":"order-123","returnUrl":"http://localhost:3000/payment/success"}'

# Listar payments
curl http://localhost:3000/api/payment

# Obtener payment por ID
curl http://localhost:3000/api/payment/pmt-xxxxx
```

### Debugging:
- Logs estructurados con prefijo `[payment-store]`, `[MercadoPagoProvider]`, `[WEBHOOK]`
- Usar `console.log` para tracking de operaciones
- Verificar `data/payment-store.json` para ver estado persistido

### Seguridad:
- ✅ Validar webhook signatures (implementar en siguiente iteración si needed)
- ✅ Nunca loggear access tokens completos
- ✅ Validar todos los inputs de API
- ✅ Usar HTTPS en producción

---

**FIN FASE 2**  
**Status:** Ready to Execute  
**Tiempo estimado:** 6-8 horas  
**Siguiente:** PROMPT_M5_FASE3_FRONTEND.md
