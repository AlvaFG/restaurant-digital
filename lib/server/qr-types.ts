/**
 * QR Types - Type definitions for QR code generation and validation
 * 
 * @module qr-types
 * @version 1.0.0
 */

/**
 * QR Token payload structure (JWT)
 */
export interface QRTokenPayload {
  /** Table identifier */
  tableId: string
  /** Table number for display */
  tableNumber: number
  /** Restaurant zone */
  zone: string
  /** Token issued at timestamp */
  iat: number
  /** Token expiry timestamp */
  exp: number
  /** Token issuer */
  iss: string
  /** Token type identifier */
  type: 'qr-table-access'
}

/**
 * QR Generation options
 */
export interface QRGenerationOptions {
  /** QR code size in pixels (default: 300) */
  size?: number
  /** Error correction level (default: 'M') */
  errorCorrectionLevel?: 'L' | 'M' | 'Q' | 'H'
  /** QR code margin in modules (default: 4) */
  margin?: number
  /** Color for dark modules */
  color?: {
    dark?: string
    light?: string
  }
}

/**
 * Generated QR code data
 */
export interface GeneratedQRCode {
  /** Base64 encoded QR code image (PNG) */
  qrCodeBase64: string
  /** Data URL for direct use in img src */
  qrCodeDataURL: string
  /** Full URL to access the QR page */
  accessUrl: string
  /** JWT token embedded in the QR */
  token: string
  /** Token expiry date */
  expiresAt: Date
  /** Table information */
  table: {
    id: string
    number: number
    zone: string
  }
}

/**
 * QR Validation result
 */
export interface QRValidationResult {
  /** Whether the QR token is valid */
  valid: boolean
  /** Error message if invalid */
  error?: string
  /** Error code for programmatic handling */
  errorCode?: QRValidationErrorCode
  /** Decoded token payload if valid */
  payload?: QRTokenPayload
  /** Table data if valid */
  tableData?: {
    id: string
    number: number
    zone: string
    status: string
    seats: number
  }
}

/**
 * QR Validation error codes
 */
export enum QRValidationErrorCode {
  TOKEN_EXPIRED = 'TOKEN_EXPIRED',
  TOKEN_INVALID = 'TOKEN_INVALID',
  TOKEN_MALFORMED = 'TOKEN_MALFORMED',
  TABLE_NOT_FOUND = 'TABLE_NOT_FOUND',
  TABLE_UNAVAILABLE = 'TABLE_UNAVAILABLE',
  SIGNATURE_INVALID = 'SIGNATURE_INVALID',
}

/**
 * QR Metadata stored in table
 */
export interface QRMetadata {
  /** JWT token */
  token: string
  /** Token expiry date */
  expiresAt: Date
  /** QR code generation date */
  generatedAt: Date
  /** Number of times QR has been scanned */
  scanCount?: number
  /** Last scan timestamp */
  lastScannedAt?: Date | null
}

/**
 * Batch QR generation request
 */
export interface BatchQRGenerationRequest {
  /** Table IDs to generate QRs for */
  tableIds: string[]
  /** Options for QR generation */
  options?: QRGenerationOptions
}

/**
 * Batch QR generation result
 */
export interface BatchQRGenerationResult {
  /** Successfully generated QRs */
  success: GeneratedQRCode[]
  /** Failed generations */
  failed: Array<{
    tableId: string
    error: string
  }>
  /** Summary */
  summary: {
    total: number
    successful: number
    failed: number
  }
}

// Legacy exports for backward compatibility
export type QRCodeResult = GeneratedQRCode
export type ValidationResult = QRValidationResult
