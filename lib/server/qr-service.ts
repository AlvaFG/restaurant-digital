/**
 * QR Service
 * Generación y validación de códigos QR con tokens JWT para mesas
 */

import QRCode from 'qrcode';
import jwt from 'jsonwebtoken';
import { randomBytes } from 'crypto';
import type { QRCodeResult, QRMetadata, ValidationResult, QRTokenPayload } from './qr-types';
import { logger } from '@/lib/logger';

const getJWTSecret = () => process.env.QR_JWT_SECRET || 'default-secret-change-in-production';
const TOKEN_EXPIRY = '24h';
const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

/**
 * Genera un código QR con token JWT único para una mesa
 */
export async function generateQRCode(tableId: string): Promise<QRCodeResult> {
  try {
    // Generar session ID único
    const sessionId = `qr_${Date.now()}_${randomBytes(8).toString('hex')}`;

    // Crear JWT token
    const token = jwt.sign(
      {
        tableId,
        sessionId,
      },
      getJWTSecret(),
      {
        expiresIn: TOKEN_EXPIRY,
      }
    );

    // Decodificar para obtener fecha de expiración
    const decoded = jwt.decode(token) as QRTokenPayload;
    const expiresAt = new Date(decoded.exp * 1000);

    // URL de validación
    const url = `${APP_URL}/qr/validate?token=${token}`;

    // Generar QR code como base64
    const qrCode = await QRCode.toDataURL(url, {
      errorCorrectionLevel: 'H',
      type: 'image/png',
      width: 300,
      margin: 1,
    });

    logger.info('QR code generated', { tableId, sessionId, expiresAt });

    return {
      qrCode,
      url,
      token,
      expiresAt,
    };
  } catch (error) {
    logger.error('Failed to generate QR code', error instanceof Error ? error : new Error(String(error)), { tableId });
    throw new Error('Failed to generate QR code');
  }
}

/**
 * Valida un token JWT de QR
 */
export function validateQRToken(token: string): ValidationResult {
  try {
    const decoded = jwt.verify(token, getJWTSecret()) as QRTokenPayload;

    logger.debug('QR token validated', { 
      tableId: decoded.tableId, 
      sessionId: decoded.sessionId 
    });

    return {
      valid: true,
      metadata: {
        tableId: decoded.tableId,
        sessionId: decoded.sessionId,
        exp: decoded.exp,
        iat: decoded.iat,
      },
    };
  } catch (error) {
    if (error instanceof jwt.TokenExpiredError) {
      logger.warn('QR token expired', { token: token.substring(0, 20) });
      return {
        valid: false,
        error: 'Token expired',
      };
    }

    if (error instanceof jwt.JsonWebTokenError) {
      logger.warn('Invalid QR token', { token: token.substring(0, 20) });
      return {
        valid: false,
        error: 'Invalid token',
      };
    }

    logger.error('QR token validation error', error instanceof Error ? error : new Error(String(error)));
    return {
      valid: false,
      error: 'Validation error',
    };
  }
}

/**
 * Refresca un token JWT generando uno nuevo
 */
export async function refreshQRToken(tableId: string): Promise<string> {
  try {
    const sessionId = `qr_${Date.now()}_${randomBytes(8).toString('hex')}`;

    const token = jwt.sign(
      {
        tableId,
        sessionId,
      },
      getJWTSecret(),
      {
        expiresIn: TOKEN_EXPIRY,
      }
    );

    logger.info('QR token refreshed', { tableId, sessionId });

    return token;
  } catch (error) {
    logger.error('Failed to refresh QR token', error instanceof Error ? error : new Error(String(error)), { tableId });
    throw new Error('Failed to refresh token');
  }
}

/**
 * Extrae metadata del token sin validar firma (para debug)
 */
export function getQRMetadata(token: string): QRMetadata | null {
  try {
    const decoded = jwt.decode(token) as QRTokenPayload;
    
    if (!decoded) {
      return null;
    }

    return {
      tableId: decoded.tableId,
      sessionId: decoded.sessionId,
      exp: decoded.exp,
      iat: decoded.iat,
    };
  } catch (error) {
    logger.error('Failed to decode QR token', error instanceof Error ? error : new Error(String(error)));
    return null;
  }
}

/**
 * Verifica si un token está expirado sin validar firma
 */
export function isTokenExpired(token: string): boolean {
  const metadata = getQRMetadata(token);
  if (!metadata) {
    return true;
  }

  const now = Math.floor(Date.now() / 1000);
  return now > metadata.exp;
}
