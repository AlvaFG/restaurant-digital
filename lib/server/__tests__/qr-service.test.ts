/**
 * QR Service Tests
 */

import { describe, it, expect, beforeAll, vi } from 'vitest';
import jwt from 'jsonwebtoken';

const TEST_SECRET = 'test-secret-key';

// Set env vars before importing
process.env.QR_JWT_SECRET = TEST_SECRET;
process.env.NEXT_PUBLIC_APP_URL = 'http://localhost:3000';

// Mock del logger
vi.mock('@/lib/logger', () => ({
  logger: {
    info: vi.fn(),
    debug: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
  },
}));

import {
  generateQRCode,
  validateQRToken,
  refreshQRToken,
  getQRMetadata,
  isTokenExpired,
} from '../qr-service';

describe('QR Service', () => {
  beforeAll(() => {
    // Ensure env vars are set
    process.env.QR_JWT_SECRET = TEST_SECRET;
    process.env.NEXT_PUBLIC_APP_URL = 'http://localhost:3000';
  });

  describe('generateQRCode', () => {
    it('should generate QR code with valid JWT token', async () => {
      const tableId = '5';
      const result = await generateQRCode(tableId);

      expect(result).toHaveProperty('qrCode');
      expect(result).toHaveProperty('url');
      expect(result).toHaveProperty('token');
      expect(result).toHaveProperty('expiresAt');

      // Verify QR code is base64 data URL
      expect(result.qrCode).toMatch(/^data:image\/png;base64,/);

      // Verify URL format
      expect(result.url).toBe(
        `http://localhost:3000/qr/validate?token=${result.token}`
      );

      // Verify token is valid JWT
      const decoded = jwt.verify(result.token, TEST_SECRET) as { tableId: string; sessionId: string };
      expect(decoded.tableId).toBe(tableId);
      expect(decoded.sessionId).toMatch(/^qr_/);
    });

    it('should generate unique session IDs for same table', async () => {
      const tableId = '5';
      const result1 = await generateQRCode(tableId);
      const result2 = await generateQRCode(tableId);

      const decoded1 = jwt.decode(result1.token) as { sessionId: string };
      const decoded2 = jwt.decode(result2.token) as { sessionId: string };

      expect(decoded1.sessionId).not.toBe(decoded2.sessionId);
    });

    it('should set expiration to 24 hours from now', async () => {
      const tableId = '5';
      const result = await generateQRCode(tableId);

      const now = Date.now();
      const expiresAt = result.expiresAt.getTime();
      const expectedExpiry = now + 24 * 60 * 60 * 1000;

      // Allow 1 second tolerance
      expect(Math.abs(expiresAt - expectedExpiry)).toBeLessThan(1000);
    });
  });

  describe('validateQRToken', () => {
    it('should validate correct token', async () => {
      const tableId = '5';
      const { token } = await generateQRCode(tableId);

      const result = validateQRToken(token);

      expect(result.valid).toBe(true);
      expect(result.metadata).toBeDefined();
      expect(result.metadata!.tableId).toBe(tableId);
      expect(result.error).toBeUndefined();
    });

    it('should reject expired token', () => {
      const tableId = '5';
      const expiredToken = jwt.sign(
        { tableId, sessionId: 'test' },
        TEST_SECRET,
        { expiresIn: '-1h' }
      );

      const result = validateQRToken(expiredToken);

      expect(result.valid).toBe(false);
      expect(result.error).toBe('Token expired');
    });

    it('should reject token with invalid signature', () => {
      const tableId = '5';
      const badToken = jwt.sign(
        { tableId, sessionId: 'test' },
        'wrong-secret',
        { expiresIn: '1h' }
      );

      const result = validateQRToken(badToken);

      expect(result.valid).toBe(false);
      expect(result.error).toBe('Invalid token');
    });

    it('should reject malformed token', () => {
      const result = validateQRToken('not-a-valid-token');

      expect(result.valid).toBe(false);
      expect(result.error).toBe('Invalid token');
    });
  });

  describe('refreshQRToken', () => {
    it('should generate new token for table', async () => {
      const tableId = '5';
      const newToken = await refreshQRToken(tableId);

      expect(newToken).toBeDefined();

      const decoded = jwt.verify(newToken, TEST_SECRET) as { tableId: string; sessionId: string };
      expect(decoded.tableId).toBe(tableId);
      expect(decoded.sessionId).toMatch(/^qr_/);
    });

    it('should generate different tokens on each refresh', async () => {
      const tableId = '5';
      const token1 = await refreshQRToken(tableId);
      const token2 = await refreshQRToken(tableId);

      expect(token1).not.toBe(token2);

      const decoded1 = jwt.decode(token1) as { sessionId: string };
      const decoded2 = jwt.decode(token2) as { sessionId: string };

      expect(decoded1.sessionId).not.toBe(decoded2.sessionId);
    });
  });

  describe('getQRMetadata', () => {
    it('should extract metadata from valid token', async () => {
      const tableId = '5';
      const { token } = await generateQRCode(tableId);

      const metadata = getQRMetadata(token);

      expect(metadata).not.toBeNull();
      expect(metadata!.tableId).toBe(tableId);
      expect(metadata!.sessionId).toMatch(/^qr_/);
      expect(metadata!.exp).toBeDefined();
      expect(metadata!.iat).toBeDefined();
    });

    it('should return null for invalid token', () => {
      const metadata = getQRMetadata('invalid-token');
      expect(metadata).toBeNull();
    });

    it('should extract metadata from expired token', () => {
      const tableId = '5';
      const expiredToken = jwt.sign(
        { tableId, sessionId: 'test' },
        TEST_SECRET,
        { expiresIn: '-1h' }
      );

      const metadata = getQRMetadata(expiredToken);

      // Should still extract metadata even if expired
      expect(metadata).not.toBeNull();
      expect(metadata!.tableId).toBe(tableId);
    });
  });

  describe('isTokenExpired', () => {
    it('should return false for valid token', async () => {
      const tableId = '5';
      const { token } = await generateQRCode(tableId);

      expect(isTokenExpired(token)).toBe(false);
    });

    it('should return true for expired token', () => {
      const tableId = '5';
      const expiredToken = jwt.sign(
        { tableId, sessionId: 'test' },
        TEST_SECRET,
        { expiresIn: '-1h' }
      );

      expect(isTokenExpired(expiredToken)).toBe(true);
    });

    it('should return true for invalid token', () => {
      expect(isTokenExpired('invalid-token')).toBe(true);
    });
  });
});
