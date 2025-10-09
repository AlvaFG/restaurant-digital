import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { paymentStore } from '../payment-store';
import type { Payment } from '../payment-types';

describe('PaymentStore', () => {
  beforeEach(() => {
    // Invalidar cache before each test
    paymentStore.invalidateCache();
  });

  afterEach(() => {
    // Cleanup after tests
    paymentStore.invalidateCache();
  });

  describe('create', () => {
    it('should create a new payment with generated ID', async () => {
      const payment = await paymentStore.create({
        orderId: 'order-123',
        amount: 10000,
        provider: 'mercadopago',
      });

      expect(payment.id).toMatch(/^pay-\d+$/);
      expect(payment.orderId).toBe('order-123');
      expect(payment.amount).toBe(10000);
      expect(payment.status).toBe('pending');
      expect(payment.provider).toBe('mercadopago');
    });

    it('should prevent duplicate active payments for same order', async () => {
      await paymentStore.create({
        orderId: 'order-duplicate-test',
        amount: 10000,
        provider: 'mercadopago',
      });

      await expect(
        paymentStore.create({
          orderId: 'order-duplicate-test',
          amount: 10000,
          provider: 'mercadopago',
        })
      ).rejects.toThrow('Ya existe un pago activo para este pedido');
    });

    it('should allow new payment after previous is completed', async () => {
      const first = await paymentStore.create({
        orderId: 'order-sequential',
        amount: 10000,
        provider: 'mercadopago',
      });

      await paymentStore.updateStatus(first.id, 'approved');

      const second = await paymentStore.create({
        orderId: 'order-sequential',
        amount: 5000,
        provider: 'mercadopago',
      });

      expect(second.id).not.toBe(first.id);
      expect(second.amount).toBe(5000);
    });
  });

  describe('getById', () => {
    it('should retrieve payment by ID', async () => {
      const created = await paymentStore.create({
        orderId: 'order-456',
        amount: 15000,
        provider: 'mercadopago',
      });

      const retrieved = await paymentStore.getById(created.id);

      expect(retrieved).toEqual(created);
    });

    it('should return null for non-existent payment', async () => {
      const result = await paymentStore.getById('pay-nonexistent');

      expect(result).toBeNull();
    });
  });

  describe('getByExternalId', () => {
    it('should retrieve payment by external ID', async () => {
      const payment = await paymentStore.create({
        orderId: 'order-789',
        amount: 20000,
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
    it('should update payment status', async () => {
      const payment = await paymentStore.create({
        orderId: 'order-999',
        amount: 25000,
        provider: 'mercadopago',
      });

      const updated = await paymentStore.updateStatus(payment.id, 'approved');

      expect(updated?.status).toBe('approved');
      expect(updated?.updatedAt).not.toBe(payment.updatedAt);
    });

    it('should return null when updating non-existent payment', async () => {
      const result = await paymentStore.updateStatus('pay-nonexistent', 'approved');

      expect(result).toBeNull();
    });
  });

  describe('list', () => {
    beforeEach(async () => {
      await paymentStore.create({ orderId: 'order-list-1', amount: 10000, provider: 'mercadopago' });
      await paymentStore.create({ orderId: 'order-list-2', amount: 20000, provider: 'mercadopago' });
      await paymentStore.create({ orderId: 'order-list-3', amount: 30000, provider: 'mercadopago' });
    });

    it('should list all payments', async () => {
      const { payments } = await paymentStore.list({});

      expect(payments.length).toBeGreaterThanOrEqual(3);
    });

    it('should filter by orderId', async () => {
      const { payments } = await paymentStore.list({ orderId: 'order-list-2' });

      expect(payments.length).toBeGreaterThanOrEqual(1);
      expect(payments[0].orderId).toBe('order-list-2');
    });

    it('should filter by status', async () => {
      const payment = await paymentStore.create({
        orderId: 'order-status-filter',
        amount: 40000,
        provider: 'mercadopago',
      });
      await paymentStore.updateStatus(payment.id, 'approved');

      const { payments } = await paymentStore.list({ status: 'approved' });

      expect(payments.length).toBeGreaterThanOrEqual(1);
      expect(payments.every((p: Payment) => p.status === 'approved')).toBe(true);
    });

    it('should support pagination', async () => {
      const { payments, summary } = await paymentStore.list({ limit: 2, offset: 0 });

      expect(payments.length).toBeLessThanOrEqual(2);
      expect(summary.total).toBeGreaterThanOrEqual(3);
    });
  });
});
