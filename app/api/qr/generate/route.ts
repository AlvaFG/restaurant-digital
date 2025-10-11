/**
 * QR Generation API Endpoint
 * 
 * POST /api/qr/generate - Generate QR code for single table
 * POST /api/qr/generate/batch - Generate QR codes for multiple tables
 * 
 * @module api/qr/generate
 * @version 1.0.0
 */

import { NextRequest, NextResponse } from 'next/server';
import { generateQR, generateBatch } from '@/lib/server/qr-service';
import { createLogger } from '@/lib/logger';
import type { QRGenerationOptions, BatchQRGenerationRequest } from '@/lib/server/qr-types';

const logger = createLogger('api:qr:generate');

// ============================================================================
// SINGLE QR GENERATION
// ============================================================================

/**
 * POST /api/qr/generate
 * 
 * Generate QR code for a single table
 * 
 * Request Body:
 * {
 *   tableId: string
 *   options?: QRGenerationOptions
 * }
 * 
 * Response:
 * {
 *   success: true
 *   data: GeneratedQRCode
 * }
 * 
 * @example
 * ```bash
 * curl -X POST http://localhost:3000/api/qr/generate \
 *   -H "Content-Type: application/json" \
 *   -d '{"tableId": "table-1"}'
 * ```
 */
export async function POST(request: NextRequest) {
  try {
    // TODO: Add staff authentication when implemented
    // const session = await getSession(request);
    // if (!session || session.user.role !== 'staff') {
    //   return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    // }

    const body = await request.json();
    const { tableId, options } = body as {
      tableId: string;
      options?: QRGenerationOptions;
    };

    // Validation
    if (!tableId || typeof tableId !== 'string') {
      logger.warn('[POST /api/qr/generate] Missing or invalid tableId', { body });
      return NextResponse.json(
        {
          success: false,
          error: 'tableId is required and must be a string',
        },
        { status: 400 }
      );
    }

    // Validate options if provided
    if (options) {
      if (options.size && (typeof options.size !== 'number' || options.size < 100 || options.size > 1000)) {
        return NextResponse.json(
          {
            success: false,
            error: 'size must be a number between 100 and 1000',
          },
          { status: 400 }
        );
      }

      if (options.errorCorrectionLevel && !['L', 'M', 'Q', 'H'].includes(options.errorCorrectionLevel)) {
        return NextResponse.json(
          {
            success: false,
            error: 'errorCorrectionLevel must be L, M, Q, or H',
          },
          { status: 400 }
        );
      }

      if (options.margin && (typeof options.margin !== 'number' || options.margin < 0 || options.margin > 10)) {
        return NextResponse.json(
          {
            success: false,
            error: 'margin must be a number between 0 and 10',
          },
          { status: 400 }
        );
      }
    }

    // Generate QR
    logger.info(`[POST /api/qr/generate] Generating QR for table ${tableId}`);
    const qrCode = await generateQR(tableId, options);

    logger.info(`[POST /api/qr/generate] QR generated successfully`, {
      tableId,
      expiresAt: qrCode.expiresAt,
    });

    return NextResponse.json(
      {
        success: true,
        data: qrCode,
      },
      { status: 200 }
    );
  } catch (error) {
    logger.error(
      '[POST /api/qr/generate] Error generating QR:',
      error instanceof Error ? error : new Error(String(error))
    );

    // Handle specific errors
    if (error instanceof Error) {
      if (error.message.includes('not found')) {
        return NextResponse.json(
          {
            success: false,
            error: error.message,
          },
          { status: 404 }
        );
      }
    }

    return NextResponse.json(
      {
        success: false,
        error: 'Failed to generate QR code',
      },
      { status: 500 }
    );
  }
}

// ============================================================================
// BATCH QR GENERATION
// ============================================================================

/**
 * POST /api/qr/generate/batch
 * 
 * Generate QR codes for multiple tables
 * 
 * Request Body:
 * {
 *   tableIds: string[]
 *   options?: QRGenerationOptions
 * }
 * 
 * Response:
 * {
 *   success: true
 *   data: BatchQRGenerationResult
 * }
 * 
 * @example
 * ```bash
 * curl -X POST http://localhost:3000/api/qr/generate/batch \
 *   -H "Content-Type: application/json" \
 *   -d '{"tableIds": ["table-1", "table-2", "table-3"]}'
 * ```
 */
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { tableIds, options } = body as {
      tableIds: string[];
      options?: QRGenerationOptions;
    };

    // Validation
    if (!Array.isArray(tableIds) || tableIds.length === 0) {
      logger.warn('[PUT /api/qr/generate/batch] Missing or invalid tableIds', { body });
      return NextResponse.json(
        {
          success: false,
          error: 'tableIds is required and must be a non-empty array',
        },
        { status: 400 }
      );
    }

    // Validate all tableIds are strings
    if (!tableIds.every((id) => typeof id === 'string')) {
      return NextResponse.json(
        {
          success: false,
          error: 'all tableIds must be strings',
        },
        { status: 400 }
      );
    }

    // Limit batch size
    if (tableIds.length > 100) {
      return NextResponse.json(
        {
          success: false,
          error: 'batch size limited to 100 tables',
        },
        { status: 400 }
      );
    }

    // Generate batch
    logger.info(`[PUT /api/qr/generate/batch] Generating QRs for ${tableIds.length} tables`);
    const request_data: BatchQRGenerationRequest = {
      tableIds,
      options,
    };
    const result = await generateBatch(request_data);

    logger.info(`[PUT /api/qr/generate/batch] Batch complete`, {
      total: result.summary.total,
      successful: result.summary.successful,
      failed: result.summary.failed,
    });

    return NextResponse.json(
      {
        success: true,
        data: result,
      },
      { status: 200 }
    );
  } catch (error) {
    logger.error(
      '[PUT /api/qr/generate/batch] Error generating batch:',
      error instanceof Error ? error : new Error(String(error))
    );

    return NextResponse.json(
      {
        success: false,
        error: 'Failed to generate QR codes',
      },
      { status: 500 }
    );
  }
}
