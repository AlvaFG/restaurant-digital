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
import { getSocketBus } from '@/lib/server/socket-bus'
import { createLogger } from '@/lib/logger'
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

const logger = createLogger('payment-store')
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
        createdAt: new Date(p.createdAt as unknown as string),
        updatedAt: new Date(p.updatedAt as unknown as string),
        completedAt: p.completedAt ? new Date(p.completedAt as unknown as string) : undefined,
        expiresAt: p.expiresAt ? new Date(p.expiresAt as unknown as string) : undefined,
      }))

      this.cache = data
      return data
    } catch (error) {
      logger.debug('Store file not found, initializing new store', { 
        path: STORE_PATH,
        error: error instanceof Error ? error.message : String(error),
      })
      
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

        // Ensure directory exists before writing
        const dir = path.dirname(STORE_PATH)
        await fs.mkdir(dir, { recursive: true })
        
        await fs.writeFile(STORE_PATH, JSON.stringify(serialized, null, 2), 'utf-8')
        this.cache = data

        logger.debug('Store written successfully', { 
          version: data.metadata.version,
          paymentsCount: data.payments.length,
        })
      } catch (error) {
        logger.error('Failed to persist payment data', error as Error, {
          paymentsCount: data.payments.length,
        })
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
      const bus = getSocketBus()
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      bus.publish(event as any, payload as any)
      logger.debug('Event emitted', { event, hasPayload: !!payload })
    } catch (error) {
      logger.error('Failed to emit event', error as Error, { event })
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

    logger.info('Payment created', { 
      paymentId: payment.id,
      orderId: params.orderId,
      amount: payment.amount,
      provider: payment.provider,
    })
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

    logger.info('Payment updated', { paymentId: id })
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

    logger.info('Payment status updated', { 
      paymentId: id,
      previousStatus,
      newStatus,
      method: options.method,
    })
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
    const payments: Payment[] = data.payments

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

    let totalProcessed: number = 0
    let totalPending: number = 0
    let oldestDate: Date | null = null as Date | null
    let latestDate: Date | null = null as Date | null

    payments.forEach((p: Payment) => {
      byStatus[p.status]++
      byProvider[p.provider]++

      if (p.status === 'completed') {
        totalProcessed += p.amount
      }
      if (p.status === 'pending' || p.status === 'processing') {
        totalPending += p.amount
      }

      const createdAt: Date = p.createdAt
      if (!oldestDate || createdAt < oldestDate) {
        oldestDate = createdAt
      }
      if (!latestDate || createdAt > latestDate) {
        latestDate = createdAt
      }
    })

    const oldestPaymentAt: string | null = oldestDate ? oldestDate.toISOString() : null
    const latestPaymentAt: string | null = latestDate ? latestDate.toISOString() : null

    return {
      total: payments.length,
      byStatus,
      byProvider,
      oldestPaymentAt,
      latestPaymentAt,
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
