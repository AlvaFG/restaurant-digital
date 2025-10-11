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
import { logRequest, logResponse, validarBody } from '@/lib/api-helpers';
import { MENSAJES } from '@/lib/i18n/mensajes';
import { ValidationError } from '@/lib/errors';

const logger = createLogger('api:qr:generate');

// ============================================================================
// SINGLE QR GENERATION
// ============================================================================

/**
 * POST /api/qr/generate
 * 
 * Generate QR code for a single table
 */
export async function POST(request: NextRequest) {
  const startTime = Date.now()
  
  try {
    logRequest('POST', '/api/qr/generate')
    
    const body = await validarBody<{
      tableId: string;
      options?: QRGenerationOptions;
    }>(request);
    
    const { tableId, options } = body;

    // Validation
    if (!tableId || typeof tableId !== 'string') {
      logger.warn('tableId faltante o inválido en generación de QR', { body });
      throw new ValidationError('tableId is required and must be a string')
    }

    // Validate options if provided
    if (options) {
      if (options.size && (typeof options.size !== 'number' || options.size < 100 || options.size > 1000)) {
        throw new ValidationError('size must be a number between 100 and 1000')
      }

      if (options.errorCorrectionLevel && !['L', 'M', 'Q', 'H'].includes(options.errorCorrectionLevel)) {
        throw new ValidationError('errorCorrectionLevel must be L, M, Q, or H')
      }

      if (options.margin && (typeof options.margin !== 'number' || options.margin < 0 || options.margin > 10)) {
        throw new ValidationError('margin must be a number between 0 and 10')
      }
    }

    // Generate QR
    logger.info('Generando QR para mesa', { tableId });
    const qrCode = await generateQR(tableId, options);

    const duration = Date.now() - startTime
    logResponse('POST', '/api/qr/generate', 200, duration)
    
    logger.info('QR generado exitosamente', {
      tableId,
      expiresAt: qrCode.expiresAt,
      duration: `${duration}ms`
    });

    return NextResponse.json(
      {
        success: true,
        data: qrCode,
      },
      { status: 200 }
    );
  } catch (error) {
    const duration = Date.now() - startTime
    
    if (error instanceof ValidationError) {
      logResponse('POST', '/api/qr/generate', 400, duration)
      return NextResponse.json({ success: false, error: error.message }, { status: 400 })
    }

    // Handle specific errors
    if (error instanceof Error) {
      if (error.message.includes('not found')) {
        logResponse('POST', '/api/qr/generate', 404, duration)
        logger.warn('Mesa no encontrada al generar QR', { error: error.message })
        return NextResponse.json({ success: false, error: error.message }, { status: 404 })
      }
    }

    logResponse('POST', '/api/qr/generate', 500, duration)
    logger.error('Error al generar código QR', error instanceof Error ? error : new Error(String(error)));

    return NextResponse.json(
      { success: false, error: MENSAJES.ERRORES.GENERICO },
      { status: 500 }
    );
  }
}

// ============================================================================
// BATCH QR GENERATION
// ============================================================================

/**
 * PUT /api/qr/generate/batch
 * 
 * Generate QR codes for multiple tables
 */
export async function PUT(request: NextRequest) {
  const startTime = Date.now()
  
  try {
    logRequest('PUT', '/api/qr/generate/batch')
    
    const body = await validarBody<{
      tableIds: string[];
      options?: QRGenerationOptions;
    }>(request);
    
    const { tableIds, options } = body;

    // Validation
    if (!Array.isArray(tableIds) || tableIds.length === 0) {
      logger.warn('tableIds faltante o inválido en generación batch', { body });
      throw new ValidationError('tableIds is required and must be a non-empty array')
    }

    // Validate all tableIds are strings
    if (!tableIds.every((id) => typeof id === 'string')) {
      throw new ValidationError('all tableIds must be strings')
    }

    // Limit batch size
    if (tableIds.length > 100) {
      throw new ValidationError('batch size limited to 100 tables')
    }

    // Generate batch
    logger.info('Generando QRs en lote', { count: tableIds.length });
    const request_data: BatchQRGenerationRequest = {
      tableIds,
      options,
    };
    const result = await generateBatch(request_data);

    const duration = Date.now() - startTime
    logResponse('PUT', '/api/qr/generate/batch', 200, duration)
    
    logger.info('Lote de QRs completado', {
      total: result.summary.total,
      successful: result.summary.successful,
      failed: result.summary.failed,
      duration: `${duration}ms`
    });

    return NextResponse.json(
      {
        success: true,
        data: result,
      },
      { status: 200 }
    );
  } catch (error) {
    const duration = Date.now() - startTime
    
    if (error instanceof ValidationError) {
      logResponse('PUT', '/api/qr/generate/batch', 400, duration)
      return NextResponse.json({ success: false, error: error.message }, { status: 400 })
    }
    
    logResponse('PUT', '/api/qr/generate/batch', 500, duration)
    logger.error('Error al generar lote de QRs', error instanceof Error ? error : new Error(String(error)));

    return NextResponse.json(
      { success: false, error: MENSAJES.ERRORES.GENERICO },
      { status: 500 }
    );
  }
}
