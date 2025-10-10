/**
 * QR Types
 * Tipos para el sistema de QR ordering
 */

export interface QRCodeResult {
  qrCode: string; // Base64 data URL
  url: string; // URL pública del QR
  token: string; // JWT token
  expiresAt: Date; // Fecha de expiración
}

export interface QRMetadata {
  tableId: string;
  sessionId: string;
  exp: number; // Timestamp de expiración
  iat: number; // Timestamp de emisión
}

export interface ValidationResult {
  valid: boolean;
  error?: string;
  metadata?: QRMetadata;
}

export interface QRTokenPayload {
  tableId: string;
  sessionId: string;
  exp: number;
  iat: number;
}
