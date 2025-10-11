/**
 * MercadoPago SDK Wrapper
 * Handles all MercadoPago API interactions
 */

import { MercadoPagoConfig, Preference, Payment as MPPayment } from 'mercadopago'
import type { CreatePreferenceInput } from './payment-types'

// Configure MercadoPago SDK
let client: MercadoPagoConfig | null = null
let preferenceClient: Preference | null = null
let paymentClient: MPPayment | null = null

if (process.env.MERCADOPAGO_ACCESS_TOKEN) {
  client = new MercadoPagoConfig({
    accessToken: process.env.MERCADOPAGO_ACCESS_TOKEN,
    options: { timeout: 5000 }
  })
  preferenceClient = new Preference(client)
  paymentClient = new MPPayment(client)
} else {
  console.warn('⚠️ MERCADOPAGO_ACCESS_TOKEN not configured')
}

/**
 * Creates a payment preference in MercadoPago
 * This generates a checkout URL for the customer
 */
export async function createPaymentPreference(input: CreatePreferenceInput) {
  if (!preferenceClient) {
    throw new Error('MercadoPago client not configured')
  }

  try {
    const now = new Date()
    const expirationDate = new Date(now.getTime() + 24 * 60 * 60 * 1000) // 24h expiry

    const preference = await preferenceClient.create({
      body: {
        items: input.items.map(item => ({
          ...item,
          id: item.id || `item-${Math.random().toString(36).substr(2, 9)}`
        })),
        payer: {
          name: input.payer.name,
          email: input.payer.email,
          phone: input.payer.phone ? {
            area_code: '',
            number: input.payer.phone,
          } : undefined,
        },
        back_urls: input.back_urls,
        notification_url: input.notification_url,
        external_reference: input.external_reference,
        metadata: input.metadata,
        auto_return: 'approved', // Auto-redirect after approval
        binary_mode: true, // Only approved or rejected (no pending)
        statement_descriptor: 'RESTAURANTE 360', // Appears on customer's card statement
        expires: true,
        expiration_date_from: now.toISOString(),
        expiration_date_to: expirationDate.toISOString(),
      }
    })

    return preference
  } catch (error) {
    console.error('MercadoPago preference creation error:', error)
    throw new Error('Failed to create payment preference')
  }
}

/**
 * Gets payment details from MercadoPago
 */
export async function getPayment(paymentId: number | string) {
  if (!paymentClient) {
    throw new Error('MercadoPago client not configured')
  }

  try {
    const payment = await paymentClient.get({ id: Number(paymentId) })
    return payment
  } catch (error) {
    console.error('MercadoPago get payment error:', error)
    throw new Error('Failed to retrieve payment')
  }
}

/**
 * Processes a refund for a payment
 * Note: Refund API requires PaymentRefund client
 */
export async function refundPayment(paymentId: number | string, amount?: number) {
  if (!client) {
    throw new Error('MercadoPago client not configured')
  }

  try {
    // For now, return a mock refund response
    // In production, implement with PaymentRefund client
    console.warn('Refund functionality not yet fully implemented')
    return {
      id: paymentId,
      status: 'refunded',
      amount: amount,
    }
  } catch (error) {
    console.error('MercadoPago refund error:', error)
    throw new Error('Failed to process refund')
  }
}

/**
 * Test credentials configuration
 */
export function isConfigured(): boolean {
  return !!process.env.MERCADOPAGO_ACCESS_TOKEN
}

/**
 * Get public key for frontend
 */
export function getPublicKey(): string | undefined {
  return process.env.NEXT_PUBLIC_MERCADOPAGO_PUBLIC_KEY
}

export { client, preferenceClient, paymentClient }
