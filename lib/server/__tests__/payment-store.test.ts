import { describe, it, expect, beforeEach, afterEach, beforeAll, afterAll, vi } from 'vitest';
import { paymentStore } from '../payment-store';
import type { Payment } from '../payment-types';
import fs from 'fs/promises';
import { mkdirSync, existsSync, unlinkSync } from 'fs';
import path from 'path';

// Mock socket-bus to prevent client-side import errors
vi.mock('@/lib/server/socket-bus', () => ({
  getSocketBus: vi.fn(() => ({
    publish: vi.fn(),
  })),
  assertServerOnly: vi.fn(),
}));

const TEST_STORE_DIR = path.join(process.cwd(), 'data', '__test__');
const TEST_STORE_PATH = path.join(TEST_STORE_DIR, 'payment-store.json');

describe('PaymentStore', () => {
  beforeAll(() => {
    // Ensure test directory exists (synchronous to avoid race conditions)
    if (!existsSync(TEST_STORE_DIR)) {
      mkdirSync(TEST_STORE_DIR, { recursive: true });
    }
  });

  beforeEach(() => {
    // Clean and invalidate cache before each test
    paymentStore.invalidateCache();
    // Ensure directory still exists
    if (!existsSync(TEST_STORE_DIR)) {
      mkdirSync(TEST_STORE_DIR, { recursive: true });
    }
    // Remove test file if exists
    if (existsSync(TEST_STORE_PATH)) {
      unlinkSync(TEST_STORE_PATH);
    }
  });

  afterEach(async () => {
    // Cleanup after tests
    paymentStore.invalidateCache();
  });

  afterAll(async () => {
    // Final cleanup
    try {
      await fs.unlink(TEST_STORE_PATH);
    } catch {
      // Ignore
    }
  });

  describe('create', () => {
    it('should create a new payment with generated ID', async () => {
      const payment = await paymentStore.create({
        orderId: 'order-123',
        tableId: 'table-1',
        amount: 10000,
        currency: 'ARS',
        provider: 'mercadopago',
        externalId: 'mp-test-123',
      });

      expect(payment.id).toMatch(/^pmt-\d+-\d{3}-[a-f0-9]{8}$/);
      expect(payment.orderId).toBe('order-123');
      expect(payment.tableId).toBe('table-1');
      expect(payment.amount).toBe(10000);
      expect(payment.currency).toBe('ARS');
      expect(payment.status).toBe('pending');
      expect(payment.provider).toBe('mercadopago');
      expect(payment.externalId).toBe('mp-test-123');
    });

    it('should prevent duplicate active payments for same order', async () => {
      await paymentStore.create({
        orderId: 'order-duplicate-test',
        tableId: 'table-1',
        amount: 10000,
        currency: 'ARS',
        provider: 'mercadopago',
        externalId: 'mp-dup-1',
      });

      await expect(
        paymentStore.create({
          orderId: 'order-duplicate-test',
          tableId: 'table-1',
          amount: 10000,
          currency: 'ARS',
          provider: 'mercadopago',
          externalId: 'mp-dup-2',
        })
      ).rejects.toThrow('Order already has an active payment');
    });

    it('should allow new payment after previous is completed', async () => {
      const first = await paymentStore.create({
        orderId: 'order-sequential',
        tableId: 'table-1',
        amount: 10000,
        currency: 'ARS',
        provider: 'mercadopago',
        externalId: 'mp-seq-1',
      });

      // Complete first payment: pending -> processing -> completed
      await paymentStore.updateStatus(first.id, 'processing');
      await paymentStore.updateStatus(first.id, 'completed');

      const second = await paymentStore.create({
        orderId: 'order-sequential',
        tableId: 'table-1',
        amount: 5000,
        currency: 'ARS',
        provider: 'mercadopago',
        externalId: 'mp-seq-2',
      });

      expect(second.id).not.toBe(first.id);
      expect(second.amount).toBe(5000);
    });
  });

  describe('getById', () => {
    it('should retrieve payment by ID', async () => {
      const created = await paymentStore.create({
        orderId: 'order-456',
        tableId: 'table-2',
        amount: 15000,
        currency: 'ARS',
        provider: 'mercadopago',
        externalId: 'mp-456',
      });

      const retrieved = await paymentStore.getById(created.id);

      expect(retrieved).toEqual(created);
    });

    it('should return null for non-existent payment', async () => {
      const result = await paymentStore.getById('pmt-nonexistent');

      expect(result).toBeNull();
    });
  });

  describe('getByExternalId', () => {
    it('should retrieve payment by external ID', async () => {
      const payment = await paymentStore.create({
        orderId: 'order-789',
        tableId: 'table-3',
        amount: 20000,
        currency: 'ARS',
        provider: 'mercadopago',
        externalId: 'mp-12345678',
      });

      const retrieved = await paymentStore.getByExternalId('mp-12345678');

      expect(retrieved?.id).toBe(payment.id);
      expect(retrieved?.externalId).toBe('mp-12345678');
    });

    it('should return null for non-existent external ID', async () => {
      const result = await paymentStore.getByExternalId('mp-nonexistent');

      expect(result).toBeNull();
    });
  });

  describe('updateStatus', () => {
    it('should update payment status with valid transition', async () => {
      const payment = await paymentStore.create({
        orderId: 'order-999',
        tableId: 'table-4',
        amount: 25000,
        currency: 'ARS',
        provider: 'mercadopago',
        externalId: 'mp-999',
      });

      const updated = await paymentStore.updateStatus(payment.id, 'processing');

      expect(updated.status).toBe('processing');
      expect(updated.updatedAt).not.toEqual(payment.updatedAt);
    });

    it('should throw error for invalid status transition', async () => {
      const payment = await paymentStore.create({
        orderId: 'order-invalid',
        tableId: 'table-5',
        amount: 10000,
        currency: 'ARS',
        provider: 'mercadopago',
        externalId: 'mp-invalid',
      });

      await expect(
        paymentStore.updateStatus(payment.id, 'completed')
      ).rejects.toThrow('Invalid status transition: pending -> completed');
    });

    it('should throw error when updating non-existent payment', async () => {
      await expect(
        paymentStore.updateStatus('pmt-nonexistent', 'completed')
      ).rejects.toThrow('Payment not found: pmt-nonexistent');
    });
  });

  describe('list', () => {
    beforeEach(async () => {
      await paymentStore.create({ 
        orderId: 'order-list-1', 
        tableId: 'table-1',
        amount: 10000, 
        currency: 'ARS',
        provider: 'mercadopago',
        externalId: 'mp-list-1',
      });
      await paymentStore.create({ 
        orderId: 'order-list-2', 
        tableId: 'table-2',
        amount: 20000, 
        currency: 'ARS',
        provider: 'mercadopago',
        externalId: 'mp-list-2',
      });
      await paymentStore.create({ 
        orderId: 'order-list-3', 
        tableId: 'table-3',
        amount: 30000, 
        currency: 'ARS',
        provider: 'mercadopago',
        externalId: 'mp-list-3',
      });
    });

    it('should list all payments', async () => {
      const payments = await paymentStore.list({});

      expect(payments.length).toBeGreaterThanOrEqual(3);
    });

    it('should filter by orderId', async () => {
      const payments = await paymentStore.list({ orderId: 'order-list-2' });

      expect(payments.length).toBeGreaterThanOrEqual(1);
      expect(payments[0].orderId).toBe('order-list-2');
    });

    it('should filter by status', async () => {
      const payment = await paymentStore.create({
        orderId: 'order-status-filter',
        tableId: 'table-4',
        amount: 40000,
        currency: 'ARS',
        provider: 'mercadopago',
        externalId: 'mp-status',
      });
      
      // Complete payment: pending -> processing -> completed
      await paymentStore.updateStatus(payment.id, 'processing');
      await paymentStore.updateStatus(payment.id, 'completed');

      const payments = await paymentStore.list({ status: 'completed' });

      expect(payments.length).toBeGreaterThanOrEqual(1);
      expect(payments.every((p: Payment) => p.status === 'completed')).toBe(true);
    });

    it('should support pagination', async () => {
      const payments = await paymentStore.list({ limit: 2 });

      expect(payments.length).toBeLessThanOrEqual(2);
    });
  });
});
