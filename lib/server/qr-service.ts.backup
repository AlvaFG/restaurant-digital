/**
 * QR Service - QR code generation and validation
 * 
 * Handles JWT token generation, QR code creation, and validation logic
 * for the QR ordering system.
 * 
 * @module qr-service
 * @version 2.0.0
 */

import QRCode from 'qrcode';
import jwt from 'jsonwebtoken';
import { createLogger } from '@/lib/logger';
import { getTableById, updateTableQR } from './table-store';
import type {
  QRTokenPayload,
  QRGenerationOptions,
  GeneratedQRCode,
  QRValidationResult,
  BatchQRGenerationRequest,
  BatchQRGenerationResult,
  QRMetadata,
} from './qr-types';
import { QRValidationErrorCode } from './qr-types';

const logger = createLogger('qr-service');

// JWT Configuration
const getJWTSecret = () => process.env.QR_JWT_SECRET || process.env.JWT_SECRET || 'default-secret-change-in-production';
const JWT_ISSUER = 'restaurant-360';
const TOKEN_EXPIRY = '24h'; // 24 hours
const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

/**
 * Default QR generation options
 */
const DEFAULT_QR_OPTIONS: Required<Omit<QRGenerationOptions, 'color'>> & {
  color: { dark: string; light: string }
} = {
  size: 300,
  errorCorrectionLevel: 'M',
  margin: 4,
  color: {
    dark: '#000000',
    light: '#FFFFFF',
  },
};

// ============================================================================
// QR GENERATION
// ============================================================================

/**
 * Generate QR code for a table
 * 
 * @param tableId - Table identifier
 * @param options - QR generation options
 * @returns Generated QR code data
 * 
 * @example
 * ```typescript
 * const qr = await generateQR('table-1')
 * console.log(qr.accessUrl) // https://restaurant.com/qr/table-1?token=eyJ...
 * ```
 */
export async function generateQR(
  tableId: string,
  options: QRGenerationOptions = {}
): Promise<GeneratedQRCode> {
  logger.info(`[generateQR] Generating QR for table ${tableId}`);

  try {
    // Get table data
    const table = await getTableById(tableId);
    
    if (!table) {
      throw new Error(`Table not found: ${tableId}`);
    }

    // Generate JWT token
    const token = createToken(table.id, table.number, table.zone || 'main');
    const decoded = jwt.decode(token) as QRTokenPayload;

    // Build access URL - direct to table page with token
    const accessUrl = `${APP_URL}/qr/${tableId}?token=${token}`;

    // Merge options with defaults
    const qrOptions = {
      ...DEFAULT_QR_OPTIONS,
      ...options,
      color: {
        ...DEFAULT_QR_OPTIONS.color,
        ...options.color,
      },
    };

    // Generate QR code as data URL
    const qrCodeDataURL = await QRCode.toDataURL(accessUrl, {
      width: qrOptions.size,
      margin: qrOptions.margin,
      errorCorrectionLevel: qrOptions.errorCorrectionLevel,
      color: {
        dark: qrOptions.color.dark,
        light: qrOptions.color.light,
      },
    });

    // Extract base64 without data URL prefix
    const qrCodeBase64 = qrCodeDataURL.replace(/^data:image\/png;base64,/, '');

    const result: GeneratedQRCode = {
      qrCodeBase64,
      qrCodeDataURL,
      accessUrl,
      token,
      expiresAt: new Date(decoded.exp * 1000),
      table: {
        id: table.id,
        number: table.number,
        zone: table.zone || 'main',
      },
    };

    // Update table with QR metadata
    await updateTableQRMetadata(tableId, {
      token,
      expiresAt: result.expiresAt,
      generatedAt: new Date(),
      scanCount: 0,
      lastScannedAt: null,
    });

    logger.info(`[generateQR] QR generated successfully for table ${tableId}`);
    return result;
  } catch (error) {
    logger.error(
      `[generateQR] Error generating QR for table ${tableId}:`,
      error instanceof Error ? error : new Error(String(error))
    );
    throw error;
  }
}

/**
 * Generate QR codes for multiple tables (batch)
 * 
 * @param request - Batch generation request
 * @returns Batch generation results
 */
export async function generateBatch(
  request: BatchQRGenerationRequest
): Promise<BatchQRGenerationResult> {
  logger.info(`[generateBatch] Generating QRs for ${request.tableIds.length} tables`);

  const success: GeneratedQRCode[] = [];
  const failed: Array<{ tableId: string; error: string }> = [];

  for (const tableId of request.tableIds) {
    try {
      const qr = await generateQR(tableId, request.options);
      success.push(qr);
    } catch (error) {
      failed.push({
        tableId,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  const result: BatchQRGenerationResult = {
    success,
    failed,
    summary: {
      total: request.tableIds.length,
      successful: success.length,
      failed: failed.length,
    },
  };

  logger.info(`[generateBatch] Batch complete: ${success.length} success, ${failed.length} failed`);
  return result;
}

// ============================================================================
// QR VALIDATION
// ============================================================================

/**
 * Validate QR token and return table data
 * 
 * @param token - JWT token from QR scan
 * @returns Validation result with table data
 * 
 * @example
 * ```typescript
 * const result = await validateToken(token)
 * if (result.valid) {
 *   console.log('Table:', result.tableData)
 * }
 * ```
 */
export async function validateToken(token: string): Promise<QRValidationResult> {
  logger.info(`[validateToken] Validating token`);

  try {
    // Verify and decode token
    const decoded = jwt.verify(token, getJWTSecret(), {
      issuer: JWT_ISSUER,
    }) as QRTokenPayload;

    // Validate token type
    if (decoded.type !== 'qr-table-access') {
      logger.warn(`[validateToken] Invalid token type: ${decoded.type}`);
      return {
        valid: false,
        error: 'Invalid token type',
        errorCode: QRValidationErrorCode.TOKEN_INVALID,
      };
    }

    // Get table data
    const table = await getTableById(decoded.tableId);

    if (!table) {
      logger.warn(`[validateToken] Table not found: ${decoded.tableId}`);
      return {
        valid: false,
        error: 'Table not found',
        errorCode: QRValidationErrorCode.TABLE_NOT_FOUND,
      };
    }

    // Update scan count
    await incrementScanCount(decoded.tableId);

    logger.info(`[validateToken] Token valid for table ${decoded.tableId}`);
    return {
      valid: true,
      payload: decoded,
      tableData: {
        id: table.id,
        number: table.number,
        zone: table.zone || 'main',
        status: table.status,
        seats: table.seats || 4,
      },
    };
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : String(error);
    logger.warn(`[validateToken] Token validation failed: ${errorMsg}`);

    if (error instanceof jwt.TokenExpiredError) {
      return {
        valid: false,
        error: 'QR code has expired. Please request a new one from staff.',
        errorCode: QRValidationErrorCode.TOKEN_EXPIRED,
      };
    }

    if (error instanceof jwt.JsonWebTokenError) {
      // Check if it's actually malformed (not just invalid signature)
      const errorCode = error.message.includes('malformed') || error.message.includes('invalid token')
        ? QRValidationErrorCode.TOKEN_MALFORMED
        : QRValidationErrorCode.TOKEN_INVALID;
        
      return {
        valid: false,
        error: 'Invalid QR code. Please scan again or request a new one.',
        errorCode,
      };
    }

    return {
      valid: false,
      error: 'Failed to validate QR code. Please try again.',
      errorCode: QRValidationErrorCode.TOKEN_MALFORMED,
    };
  }
}

/**
 * Refresh QR token if expired or about to expire
 * 
 * @param tableId - Table identifier
 * @returns New QR code data
 */
export async function refreshToken(tableId: string): Promise<GeneratedQRCode> {
  logger.info(`[refreshToken] Refreshing token for table ${tableId}`);
  
  // Generate new QR (this will create a new token)
  return generateQR(tableId);
}

/**
 * Get QR metadata from token (decode without verification)
 * 
 * @param token - JWT token
 * @returns Decoded token payload
 */
export function getTokenMetadata(token: string): QRTokenPayload | null {
  try {
    const decoded = jwt.decode(token) as QRTokenPayload;
    return decoded;
  } catch (error) {
    logger.error(
      `[getTokenMetadata] Error decoding token:`,
      error instanceof Error ? error : new Error(String(error))
    );
    return null;
  }
}

/**
 * Check if token is expired (without verification)
 * 
 * @param token - JWT token
 * @returns True if expired
 */
export function isTokenExpired(token: string): boolean {
  const metadata = getTokenMetadata(token);
  if (!metadata || !metadata.exp) {
    return true;
  }

  const now = Math.floor(Date.now() / 1000);
  return now > metadata.exp;
}

// ============================================================================
// PRIVATE HELPERS
// ============================================================================

/**
 * Create JWT token for table access
 */
function createToken(tableId: string, tableNumber: number, zone: string): string {
  // Don't include iss in payload - jwt.sign will add it
  // Add random nonce to ensure uniqueness even if generated in same second
  const payload: Omit<QRTokenPayload, 'iat' | 'exp' | 'iss'> & { jti: string } = {
    tableId,
    tableNumber,
    zone,
    type: 'qr-table-access',
    jti: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`, // JWT ID for uniqueness
  };

  return jwt.sign(payload, getJWTSecret(), {
    expiresIn: TOKEN_EXPIRY,
    issuer: JWT_ISSUER,
  });
}

/**
 * Update table with QR metadata
 */
async function updateTableQRMetadata(
  tableId: string,
  metadata: QRMetadata
): Promise<void> {
  try {
    // Store QR token in table using existing updateTableQR function
    await updateTableQR(tableId, metadata.token, metadata.expiresAt);
  } catch (error) {
    logger.error(
      `[updateTableQRMetadata] Error updating metadata:`,
      error instanceof Error ? error : new Error(String(error))
    );
    // Don't throw - metadata update is non-critical
  }
}

/**
 * Increment scan count for table
 * Note: Scan counting is stored separately and will be implemented
 * when we add session management in Day 2-3
 */
async function incrementScanCount(tableId: string): Promise<void> {
  try {
    // TODO: Implement scan counting in session store (Day 2-3)
    logger.debug(`[incrementScanCount] Scan counted for table ${tableId}`);
  } catch (error) {
    logger.error(
      `[incrementScanCount] Error:`,
      error instanceof Error ? error : new Error(String(error))
    );
    // Don't throw - scan counting is non-critical
  }
}

// ============================================================================
// LEGACY EXPORTS (for backward compatibility)
// ============================================================================

/** @deprecated Use generateQR instead */
export async function generateQRCode(tableId: string) {
  const result = await generateQR(tableId);
  // Return in legacy format
  return {
    qrCode: result.qrCodeDataURL,
    url: result.accessUrl,
    token: result.token,
    expiresAt: result.expiresAt,
  };
}

/** @deprecated Use validateToken instead */
export function validateQRToken(token: string) {
  // Sync version for backward compatibility
  try {
    const decoded = jwt.verify(token, getJWTSecret()) as QRTokenPayload;
    return {
      valid: true,
      metadata: {
        tableId: decoded.tableId,
        tableNumber: decoded.tableNumber,
        zone: decoded.zone,
        exp: decoded.exp,
        iat: decoded.iat,
      },
    };
  } catch (error) {
    if (error instanceof jwt.TokenExpiredError) {
      return { valid: false, error: 'Token expired' };
    }
    if (error instanceof jwt.JsonWebTokenError) {
      return { valid: false, error: 'Invalid token' };
    }
    return { valid: false, error: 'Validation error' };
  }
}

/** @deprecated Use refreshToken instead */
export async function refreshQRToken(tableId: string): Promise<string> {
  const result = await refreshToken(tableId);
  return result.token;
}

/** @deprecated Use getTokenMetadata instead */
export function getQRMetadata(token: string) {
  return getTokenMetadata(token);
}
