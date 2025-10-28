import { NextRequest, NextResponse } from 'next/server'
import { getPaymentById } from '@/lib/services/payments-service'
import { PaymentError, PAYMENT_ERROR_CODES } from '@/lib/server/payment-types'
import { getCurrentUser } from '@/lib/supabase/server'
import type { User } from "@supabase/supabase-js"

/**
 * Extract tenantId from Supabase Auth User
 */
function getTenantIdFromUser(user: User): string | null {
  return user.user_metadata?.tenant_id || null
}

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Obtener usuario actual
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json(
        { error: 'No autenticado' },
        { status: 401 }
      )
    }

    // Obtener tenant_id del usuario
    const tenantId = getTenantIdFromUser(user)
    if (!tenantId) {
      return NextResponse.json(
        { error: 'Usuario sin tenant asignado' },
        { status: 403 }
      )
    }

    const { data: payment, error } = await getPaymentById(params.id, tenantId)

    if (error || !payment) {
      throw new PaymentError(
        `Payment not found: ${params.id}`,
        PAYMENT_ERROR_CODES.PAYMENT_NOT_FOUND,
        404
      )
    }

    return NextResponse.json({
      data: {
        id: payment.id,
        orderId: payment.order_id,
        tableId: payment.table_id,
        paymentNumber: payment.payment_number,
        provider: payment.provider,
        status: payment.status,
        method: payment.method,
        amountCents: payment.amount_cents,
        currency: payment.currency,
        externalId: payment.external_id,
        checkoutUrl: payment.checkout_url,
        createdAt: payment.created_at,
        updatedAt: payment.updated_at,
      },
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
