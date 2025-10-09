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
