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
