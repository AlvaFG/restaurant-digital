/**
 * QR Service Tests - v2.0.0
 * Tests for QR generation, validation, and batch operations
 */

import { describe, it, expect, beforeAll, vi } from 'vitest';
import jwt from 'jsonwebtoken';

const TEST_SECRET = 'test-secret-key';

// Set env vars before importing
process.env.QR_JWT_SECRET = TEST_SECRET;
process.env.NEXT_PUBLIC_APP_URL = 'http://localhost:3000';

// Mock the logger
vi.mock('@/lib/logger', () => ({
  createLogger: () => ({
    info: vi.fn(),
    debug: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
  }),
}));

// Mock the table-store
vi.mock('../table-store', () => ({
  getTableById: vi.fn((tableId: string) => {
    // Mock table data
    const tableNumber = parseInt(tableId.split('-')[1] || '1', 10);
    if (tableId === 'nonexistent') return null;
    
    return Promise.resolve({
      id: tableId,
      number: tableNumber,
      zone: 'main',
      status: 'free',
      seats: 4,
      covers: {
        current: 0,
        total: 0,
        sessions: 0,
        lastUpdatedAt: null,
        lastSessionAt: null,
      },
    });
  }),
  updateTableQR: vi.fn(() => Promise.resolve()),
}));

import {
  generateQR,
  validateToken,
  refreshToken,
  getTokenMetadata,
  isTokenExpired,
  generateBatch,
} from '../qr-service';

describe('QR Service v2.0', () => {
  beforeAll(() => {
    // Ensure env vars are set
    process.env.QR_JWT_SECRET = TEST_SECRET;
    process.env.NEXT_PUBLIC_APP_URL = 'http://localhost:3000';
  });

  describe('generateQR', () => {
    it('should generate complete QR code data', async () => {
      const tableId = 'table-1';
      const result = await generateQR(tableId);

      // Check structure
      expect(result).toHaveProperty('qrCodeBase64');
      expect(result).toHaveProperty('qrCodeDataURL');
      expect(result).toHaveProperty('accessUrl');
      expect(result).toHaveProperty('token');
      expect(result).toHaveProperty('expiresAt');
      expect(result).toHaveProperty('table');

      // Check data formats
      expect(result.qrCodeDataURL).toMatch(/^data:image\/png;base64,/);
      expect(result.qrCodeBase64).not.toMatch(/^data:/); // Should not have prefix
      expect(result.accessUrl).toBe(
        `http://localhost:3000/qr/${tableId}?token=${result.token}`
      );

      // Check table data
      expect(result.table).toEqual({
        id: tableId,
        number: 1,
        zone: 'main',
      });

      // Verify token is valid JWT
      const decoded = jwt.verify(result.token, TEST_SECRET) as jwt.JwtPayload & {
        tableId: string;
        type: string;
        iss: string;
      };
      expect(decoded.tableId).toBe(tableId);
      expect(decoded.type).toBe('qr-table-access');
      expect(decoded.iss).toBe('restaurant-360');
    });

    it('should accept custom QR options', async () => {
      const tableId = 'table-2';
      const result = await generateQR(tableId, {
        size: 500,
        errorCorrectionLevel: 'H',
        margin: 2,
        color: {
          dark: '#FF0000',
          light: '#FFFFFF',
        },
      });

      expect(result).toHaveProperty('qrCodeBase64');
      expect(result.token).toBeDefined();
    });

    it('should set expiration to 24 hours from now', async () => {
      const tableId = 'table-3';
      const result = await generateQR(tableId);

      const now = Date.now();
      const expiresAt = result.expiresAt.getTime();
      const expectedExpiry = now + 24 * 60 * 60 * 1000;

      // Allow 2 second tolerance
      expect(Math.abs(expiresAt - expectedExpiry)).toBeLessThan(2000);
    });

    it('should throw error for nonexistent table', async () => {
      await expect(generateQR('nonexistent')).rejects.toThrow('Table not found');
    });

    it('should generate unique tokens for same table', async () => {
      const tableId = 'table-4';
      const result1 = await generateQR(tableId);
      const result2 = await generateQR(tableId);

      expect(result1.token).not.toBe(result2.token);

      const decoded1 = jwt.decode(result1.token) as jwt.JwtPayload & { jti: string };
      const decoded2 = jwt.decode(result2.token) as jwt.JwtPayload & { jti: string };

      // jti (JWT ID) should be different
      expect(decoded1.jti).toBeDefined();
      expect(decoded2.jti).toBeDefined();
      expect(decoded1.jti).not.toBe(decoded2.jti);
    });
  });

  describe('validateToken', () => {
    it('should validate correct token and return table data', async () => {
      const tableId = 'table-5';
      const { token } = await generateQR(tableId);

      const result = await validateToken(token);

      expect(result.valid).toBe(true);
      expect(result.error).toBeUndefined();
      expect(result.errorCode).toBeUndefined();
      expect(result.payload).toBeDefined();
      expect(result.payload?.tableId).toBe(tableId);
      expect(result.payload?.type).toBe('qr-table-access');
      expect(result.tableData).toBeDefined();
      expect(result.tableData?.id).toBe(tableId);
      expect(result.tableData?.number).toBe(5);
    });

    it('should reject expired token', async () => {
      const tableId = 'table-6';
      const expiredToken = jwt.sign(
        {
          tableId,
          tableNumber: 6,
          zone: 'main',
          type: 'qr-table-access',
        },
        TEST_SECRET,
        { expiresIn: '-1h', issuer: 'restaurant-360' }
      );

      const result = await validateToken(expiredToken);

      expect(result.valid).toBe(false);
      expect(result.error).toContain('expired');
      expect(result.errorCode).toBe('TOKEN_EXPIRED');
    });

    it('should reject token with invalid signature', async () => {
      const badToken = jwt.sign(
        {
          tableId: 'table-7',
          tableNumber: 7,
          zone: 'main',
          type: 'qr-table-access',
        },
        'wrong-secret',
        { expiresIn: '1h', issuer: 'restaurant-360' }
      );

      const result = await validateToken(badToken);

      expect(result.valid).toBe(false);
      expect(result.error).toBeDefined();
      expect(result.errorCode).toBe('TOKEN_INVALID');
    });

    it('should reject token with invalid type', async () => {
      const badToken = jwt.sign(
        {
          tableId: 'table-8',
          tableNumber: 8,
          zone: 'main',
          type: 'wrong-type',
        },
        TEST_SECRET,
        { expiresIn: '1h', issuer: 'restaurant-360' }
      );

      const result = await validateToken(badToken);

      expect(result.valid).toBe(false);
      expect(result.error).toContain('Invalid token type');
      expect(result.errorCode).toBe('TOKEN_INVALID');
    });

    it('should reject malformed token', async () => {
      const result = await validateToken('not-a-valid-token');

      expect(result.valid).toBe(false);
      expect(result.error).toBeDefined();
      expect(result.errorCode).toBe('TOKEN_MALFORMED');
    });
  });

  describe('refreshToken', () => {
    it('should generate new QR for table', async () => {
      const tableId = 'table-9';
      const result = await refreshToken(tableId);

      expect(result.token).toBeDefined();
      expect(result.qrCodeBase64).toBeDefined();

      const decoded = jwt.verify(result.token, TEST_SECRET) as jwt.JwtPayload & { tableId: string };
      expect(decoded.tableId).toBe(tableId);
    });

    it('should generate different tokens on each refresh', async () => {
      const tableId = 'table-10';
      const result1 = await refreshToken(tableId);
      const result2 = await refreshToken(tableId);

      expect(result1.token).not.toBe(result2.token);
    });
  });

  describe('getTokenMetadata', () => {
    it('should extract metadata from valid token', async () => {
      const tableId = 'table-11';
      const { token } = await generateQR(tableId);

      const metadata = getTokenMetadata(token);

      expect(metadata).not.toBeNull();
      expect(metadata!.tableId).toBe(tableId);
      expect(metadata!.tableNumber).toBe(11);
      expect(metadata!.zone).toBe('main');
      expect(metadata!.type).toBe('qr-table-access');
      expect(metadata!.iss).toBe('restaurant-360');
      expect(metadata!.exp).toBeDefined();
      expect(metadata!.iat).toBeDefined();
    });

    it('should return null for invalid token', () => {
      const metadata = getTokenMetadata('invalid-token');
      expect(metadata).toBeNull();
    });

    it('should extract metadata from expired token (no verification)', () => {
      const tableId = 'table-12';
      const expiredToken = jwt.sign(
        {
          tableId,
          tableNumber: 12,
          zone: 'main',
          type: 'qr-table-access',
        },
        TEST_SECRET,
        { expiresIn: '-1h', issuer: 'restaurant-360' }
      );

      const metadata = getTokenMetadata(expiredToken);

      // Should still extract metadata even if expired
      expect(metadata).not.toBeNull();
      expect(metadata!.tableId).toBe(tableId);
    });
  });

  describe('isTokenExpired', () => {
    it('should return false for valid token', async () => {
      const tableId = 'table-13';
      const { token } = await generateQR(tableId);

      expect(isTokenExpired(token)).toBe(false);
    });

    it('should return true for expired token', () => {
      const expiredToken = jwt.sign(
        {
          tableId: 'table-14',
          tableNumber: 14,
          zone: 'main',
          type: 'qr-table-access',
        },
        TEST_SECRET,
        { expiresIn: '-1h', issuer: 'restaurant-360' }
      );

      expect(isTokenExpired(expiredToken)).toBe(true);
    });

    it('should return true for invalid token', () => {
      expect(isTokenExpired('invalid-token')).toBe(true);
    });
  });

  describe('generateBatch', () => {
    it('should generate QRs for multiple tables', async () => {
      const tableIds = ['table-20', 'table-21', 'table-22'];
      const result = await generateBatch({ tableIds });

      expect(result.success).toHaveLength(3);
      expect(result.failed).toHaveLength(0);
      expect(result.summary.total).toBe(3);
      expect(result.summary.successful).toBe(3);
      expect(result.summary.failed).toBe(0);

      // Check each QR
      result.success.forEach((qr, index) => {
        expect(qr.table.id).toBe(tableIds[index]);
        expect(qr.token).toBeDefined();
        expect(qr.qrCodeBase64).toBeDefined();
      });
    });

    it('should handle mixed success and failures', async () => {
      const tableIds = ['table-30', 'nonexistent', 'table-31'];
      const result = await generateBatch({ tableIds });

      expect(result.success).toHaveLength(2);
      expect(result.failed).toHaveLength(1);
      expect(result.summary.total).toBe(3);
      expect(result.summary.successful).toBe(2);
      expect(result.summary.failed).toBe(1);

      // Check failure
      expect(result.failed[0].tableId).toBe('nonexistent');
      expect(result.failed[0].error).toContain('not found');
    });

    it('should apply custom options to all QRs in batch', async () => {
      const tableIds = ['table-40', 'table-41'];
      const result = await generateBatch({
        tableIds,
        options: {
          size: 400,
          errorCorrectionLevel: 'H',
        },
      });

      expect(result.success).toHaveLength(2);
      result.success.forEach((qr) => {
        expect(qr.qrCodeBase64).toBeDefined();
      });
    });
  });

  // Legacy compatibility tests
  describe('Legacy API compatibility', () => {
    it('should support generateQRCode legacy function', async () => {
      const { generateQRCode } = await import('../qr-service');
      const result = await generateQRCode('table-50');

      // Should have legacy format
      expect(result).toHaveProperty('qrCode');
      expect(result).toHaveProperty('url');
      expect(result).toHaveProperty('token');
      expect(result).toHaveProperty('expiresAt');

      expect(result.qrCode).toMatch(/^data:image\/png;base64,/);
    });

    it('should support validateQRToken legacy function', async () => {
      const { generateQRCode, validateQRToken } = await import('../qr-service');
      const { token } = await generateQRCode('table-51');

      const result = validateQRToken(token);

      expect(result.valid).toBe(true);
      expect(result.metadata).toBeDefined();
    });
  });
});
