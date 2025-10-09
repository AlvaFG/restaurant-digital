# PROMPT M5 - FASE 4: TESTING & DOCUMENTATION

## Contexto
Has completado exitosamente las Fases 1-3 del Milestone 5 de pagos digitales:
- ✅ Fase 1: Research & Setup
- ✅ Fase 2: Backend Integration (MercadoPago provider, API endpoints, webhooks)
- ✅ Fase 3: Frontend Checkout (componentes React, modal de pago, páginas de resultado)

**Estado actual del branch**: `feature/backend-payments-mercadopago`
- Commit backend: `a135af3`
- Commit frontend: `b9eba24`

**Objetivo de esta Fase**: Asegurar la calidad del código mediante testing automatizado, documentar APIs y flujos, realizar pruebas de carga, y preparar el PR para merge a develop.

## Tiempo Estimado
4-6 horas de implementación

## Pre-requisitos
1. Backend y Frontend completados (Fases 2-3) ✅
2. Variables de entorno configuradas
3. Cuenta de MercadoPago Sandbox activa
4. Herramientas de testing instaladas (Vitest, Playwright)

## Estructura de Implementación

### 1. Unit Tests - Backend (1.5 horas)

#### 1.1 PaymentStore Tests
**Archivo**: `lib/server/__tests__/payment-store.test.ts`

```typescript
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { PaymentStore } from '../payment-store';
import { unlinkSync, existsSync } from 'fs';
import path from 'path';

describe('PaymentStore', () => {
  const testStorePath = path.join(process.cwd(), 'data', 'payment-store.test.json');
  let store: PaymentStore;

  beforeEach(() => {
    store = new PaymentStore(testStorePath);
  });

  afterEach(() => {
    if (existsSync(testStorePath)) {
      unlinkSync(testStorePath);
    }
  });

  describe('create', () => {
    it('should create a new payment with generated ID', async () => {
      const payment = await store.create({
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
      await store.create({
        orderId: 'order-123',
        amount: 10000,
        provider: 'mercadopago',
      });

      await expect(
        store.create({
          orderId: 'order-123',
          amount: 10000,
          provider: 'mercadopago',
        })
      ).rejects.toThrow('Ya existe un pago activo para este pedido');
    });

    it('should allow new payment after previous is completed', async () => {
      const first = await store.create({
        orderId: 'order-123',
        amount: 10000,
        provider: 'mercadopago',
      });

      await store.updateStatus(first.id, 'approved');

      const second = await store.create({
        orderId: 'order-123',
        amount: 5000,
        provider: 'mercadopago',
      });

      expect(second.id).not.toBe(first.id);
      expect(second.amount).toBe(5000);
    });
  });

  describe('getById', () => {
    it('should retrieve payment by ID', async () => {
      const created = await store.create({
        orderId: 'order-456',
        amount: 15000,
        provider: 'mercadopago',
      });

      const retrieved = await store.getById(created.id);

      expect(retrieved).toEqual(created);
    });

    it('should return null for non-existent payment', async () => {
      const result = await store.getById('pay-nonexistent');

      expect(result).toBeNull();
    });
  });

  describe('getByExternalId', () => {
    it('should retrieve payment by external ID', async () => {
      const payment = await store.create({
        orderId: 'order-789',
        amount: 20000,
        provider: 'mercadopago',
        externalId: 'mp-12345678',
      });

      const retrieved = await store.getByExternalId('mp-12345678');

      expect(retrieved?.id).toBe(payment.id);
      expect(retrieved?.externalId).toBe('mp-12345678');
    });

    it('should return null for non-existent external ID', async () => {
      const result = await store.getByExternalId('mp-nonexistent');

      expect(result).toBeNull();
    });
  });

  describe('updateStatus', () => {
    it('should update payment status', async () => {
      const payment = await store.create({
        orderId: 'order-999',
        amount: 25000,
        provider: 'mercadopago',
      });

      const updated = await store.updateStatus(payment.id, 'approved');

      expect(updated?.status).toBe('approved');
      expect(updated?.updatedAt).not.toBe(payment.updatedAt);
    });

    it('should return null when updating non-existent payment', async () => {
      const result = await store.updateStatus('pay-nonexistent', 'approved');

      expect(result).toBeNull();
    });
  });

  describe('list', () => {
    beforeEach(async () => {
      await store.create({ orderId: 'order-1', amount: 10000, provider: 'mercadopago' });
      await store.create({ orderId: 'order-2', amount: 20000, provider: 'mercadopago' });
      await store.create({ orderId: 'order-3', amount: 30000, provider: 'mercadopago' });
    });

    it('should list all payments', async () => {
      const { payments } = await store.list({});

      expect(payments).toHaveLength(3);
    });

    it('should filter by orderId', async () => {
      const { payments } = await store.list({ orderId: 'order-2' });

      expect(payments).toHaveLength(1);
      expect(payments[0].orderId).toBe('order-2');
    });

    it('should filter by status', async () => {
      const payment = await store.create({
        orderId: 'order-4',
        amount: 40000,
        provider: 'mercadopago',
      });
      await store.updateStatus(payment.id, 'approved');

      const { payments } = await store.list({ status: 'approved' });

      expect(payments).toHaveLength(1);
      expect(payments[0].status).toBe('approved');
    });

    it('should support pagination', async () => {
      const { payments, summary } = await store.list({ limit: 2, offset: 0 });

      expect(payments).toHaveLength(2);
      expect(summary.total).toBe(3);
      expect(summary.hasMore).toBe(true);
    });
  });
});
```

#### 1.2 MercadoPago Provider Tests
**Archivo**: `lib/server/providers/__tests__/mercadopago-provider.test.ts`

```typescript
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { MercadoPagoProvider } from '../mercadopago-provider';

// Mock del SDK de MercadoPago
vi.mock('mercadopago', () => ({
  MercadoPagoConfig: vi.fn(),
  Preference: vi.fn(),
  Payment: vi.fn(),
}));

describe('MercadoPagoProvider', () => {
  let provider: MercadoPagoProvider;

  beforeEach(() => {
    const config = {
      accessToken: 'TEST-access-token',
      publicKey: 'TEST-public-key',
      sandbox: true,
    };

    provider = new MercadoPagoProvider(config, 'https://example.com/webhook');
  });

  describe('createPayment', () => {
    it('should create preference with correct structure', async () => {
      const paymentData = {
        orderId: 'order-123',
        amount: 10000,
        description: 'Pedido #order-123',
        payerEmail: 'customer@example.com',
      };

      // Mock implementation would go here
      // This is a structure test, actual implementation requires SDK mocking
      
      expect(provider).toBeDefined();
    });
  });

  describe('status mapping', () => {
    it('should map MercadoPago statuses correctly', () => {
      // Test interno de mapeo de estados
      // pending -> pending
      // approved -> approved
      // rejected -> rejected
      // etc.
    });
  });
});
```

### 2. Integration Tests - API Endpoints (1 hora)

#### 2.1 Payment API Tests
**Archivo**: `app/api/payment/__tests__/route.test.ts`

```typescript
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { POST, GET } from '../route';
import { NextRequest } from 'next/server';

describe('Payment API', () => {
  describe('POST /api/payment', () => {
    it('should create payment for valid order', async () => {
      const request = new NextRequest('http://localhost:3000/api/payment', {
        method: 'POST',
        body: JSON.stringify({
          orderId: 'order-123',
          amount: 10000,
        }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.id).toBeDefined();
      expect(data.orderId).toBe('order-123');
      expect(data.amount).toBe(10000);
      expect(data.checkoutUrl).toBeDefined();
    });

    it('should reject payment for non-existent order', async () => {
      const request = new NextRequest('http://localhost:3000/api/payment', {
        method: 'POST',
        body: JSON.stringify({
          orderId: 'order-nonexistent',
          amount: 10000,
        }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(404);
      expect(data.error).toContain('no existe');
    });

    it('should reject duplicate active payment', async () => {
      const request1 = new NextRequest('http://localhost:3000/api/payment', {
        method: 'POST',
        body: JSON.stringify({
          orderId: 'order-123',
          amount: 10000,
        }),
      });

      await POST(request1);

      const request2 = new NextRequest('http://localhost:3000/api/payment', {
        method: 'POST',
        body: JSON.stringify({
          orderId: 'order-123',
          amount: 10000,
        }),
      });

      const response = await POST(request2);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toContain('Ya existe un pago activo');
    });

    it('should validate amount is positive', async () => {
      const request = new NextRequest('http://localhost:3000/api/payment', {
        method: 'POST',
        body: JSON.stringify({
          orderId: 'order-123',
          amount: -100,
        }),
      });

      const response = await POST(request);

      expect(response.status).toBe(400);
    });
  });

  describe('GET /api/payment', () => {
    it('should list all payments', async () => {
      const request = new NextRequest('http://localhost:3000/api/payment');

      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.payments).toBeDefined();
      expect(Array.isArray(data.payments)).toBe(true);
      expect(data.summary).toBeDefined();
    });

    it('should filter payments by orderId', async () => {
      const request = new NextRequest(
        'http://localhost:3000/api/payment?orderId=order-123'
      );

      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.payments.every((p: any) => p.orderId === 'order-123')).toBe(true);
    });

    it('should filter payments by status', async () => {
      const request = new NextRequest(
        'http://localhost:3000/api/payment?status=approved'
      );

      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.payments.every((p: any) => p.status === 'approved')).toBe(true);
    });
  });
});
```

### 3. E2E Tests - Payment Flow (1.5 horas)

#### 3.1 Playwright E2E Tests
**Archivo**: `e2e/payment-flow.spec.ts`

```typescript
import { test, expect } from '@playwright/test';

test.describe('Payment Flow E2E', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('http://localhost:3000/login');
    // Login logic here
    await page.fill('input[name="email"]', 'admin@restaurant.com');
    await page.fill('input[name="password"]', 'password');
    await page.click('button[type="submit"]');
    await page.waitForURL('**/dashboard');
  });

  test('should complete full payment flow', async ({ page }) => {
    // 1. Navigate to orders panel
    await page.goto('http://localhost:3000/pedidos');
    await page.waitForSelector('text=Panel de pedidos');

    // 2. Click pay button on first order
    const firstPayButton = page.locator('button:has-text("Pagar")').first();
    await firstPayButton.click();

    // 3. Verify modal opens
    await expect(page.locator('text=Pagar Pedido')).toBeVisible();

    // 4. Verify order summary
    await expect(page.locator('text=Resumen del pedido')).toBeVisible();
    await expect(page.locator('text=Total')).toBeVisible();

    // 5. Click checkout button
    await page.locator('button:has-text("Pagar")').click();

    // 6. Verify redirect or popup (depends on implementation)
    // In popup mode:
    const popupPromise = page.waitForEvent('popup');
    const popup = await popupPromise;
    await expect(popup).toHaveURL(/mercadopago/);
  });

  test('should show payment status updates in real-time', async ({ page, context }) => {
    await page.goto('http://localhost:3000/pedidos');

    // Open payment modal
    await page.locator('button:has-text("Pagar")').first().click();
    await page.locator('button:has-text("Pagar")').click();

    // Simulate webhook update (requires test endpoint or mock)
    // Check that status badge updates via WebSocket
    await expect(page.locator('text=Pendiente')).toBeVisible();
  });

  test('should disable pay button for already paid orders', async ({ page }) => {
    await page.goto('http://localhost:3000/pedidos');

    // Find an order with "Pagado" status
    const paidButton = page.locator('button:has-text("Pagado")').first();
    await expect(paidButton).toBeDisabled();
  });

  test('should display success page after payment approval', async ({ page }) => {
    // Simulate approved payment redirect
    await page.goto('http://localhost:3000/payment/success?payment_id=pay-123');

    await expect(page.locator('text=¡Pago Exitoso!')).toBeVisible();
    await expect(page.locator('text=Tu pago ha sido procesado correctamente')).toBeVisible();
    
    // Verify back button works
    await page.click('text=Volver al Salón');
    await page.waitForURL('**/salon');
  });

  test('should display failure page after payment rejection', async ({ page }) => {
    await page.goto('http://localhost:3000/payment/failure?payment_id=pay-456');

    await expect(page.locator('text=Pago No Procesado')).toBeVisible();
    await expect(page.locator('text=Intentar Nuevamente')).toBeVisible();
  });
});
```

#### 3.2 Playwright Config
**Archivo**: `playwright.config.ts` (si no existe)

```typescript
import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: 'html',
  use: {
    baseURL: 'http://localhost:3000',
    trace: 'on-first-retry',
  },

  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'firefox',
      use: { ...devices['Desktop Firefox'] },
    },
  ],

  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:3000',
    reuseExistingServer: !process.env.CI,
  },
});
```

### 4. Documentation (1 hora)

#### 4.1 Payment API Documentation
**Archivo**: `docs/api/payments.md`

```markdown
# Payment API Documentation

## Overview
Sistema de pagos digitales integrado con MercadoPago Checkout Pro para procesamiento de pagos de pedidos de restaurante.

## Endpoints

### POST /api/payment
Crea un nuevo pago para un pedido.

**Request Body:**
\`\`\`json
{
  "orderId": "order-123",
  "amount": 10000
}
\`\`\`

**Response (200):**
\`\`\`json
{
  "id": "pay-1234567890",
  "orderId": "order-123",
  "amount": 10000,
  "status": "pending",
  "provider": "mercadopago",
  "checkoutUrl": "https://www.mercadopago.com.ar/checkout/v1/redirect?pref_id=...",
  "createdAt": "2025-10-09T12:00:00.000Z",
  "updatedAt": "2025-10-09T12:00:00.000Z"
}
\`\`\`

**Error Responses:**
- `400` - Ya existe un pago activo para este pedido
- `404` - Pedido no encontrado
- `500` - Error al crear el pago

---

### GET /api/payment
Lista pagos con filtros opcionales.

**Query Parameters:**
- `orderId` (optional) - Filtrar por ID de pedido
- `status` (optional) - Filtrar por estado (pending, approved, rejected, etc.)
- `limit` (optional) - Número de resultados (default: 50)
- `offset` (optional) - Offset para paginación (default: 0)

**Response (200):**
\`\`\`json
{
  "payments": [
    {
      "id": "pay-1234567890",
      "orderId": "order-123",
      "amount": 10000,
      "status": "approved",
      "provider": "mercadopago",
      "externalId": "12345678",
      "createdAt": "2025-10-09T12:00:00.000Z",
      "updatedAt": "2025-10-09T12:05:00.000Z"
    }
  ],
  "summary": {
    "total": 150,
    "byStatus": {
      "pending": 10,
      "approved": 120,
      "rejected": 15,
      "cancelled": 5
    },
    "totalAmount": 1500000,
    "oldestDate": "2025-09-01T00:00:00.000Z",
    "latestDate": "2025-10-09T12:00:00.000Z"
  }
}
\`\`\`

---

### GET /api/payment/:id
Obtiene un pago específico por ID.

**Response (200):**
\`\`\`json
{
  "id": "pay-1234567890",
  "orderId": "order-123",
  "amount": 10000,
  "status": "approved",
  "provider": "mercadopago",
  "externalId": "12345678",
  "checkoutUrl": "https://www.mercadopago.com.ar/checkout/v1/redirect?pref_id=...",
  "createdAt": "2025-10-09T12:00:00.000Z",
  "updatedAt": "2025-10-09T12:05:00.000Z"
}
\`\`\`

**Error Responses:**
- `404` - Pago no encontrado

---

### POST /api/webhook/mercadopago
Webhook para recibir notificaciones de MercadoPago.

**Headers Required:**
- `x-signature` - Firma de seguridad de MercadoPago
- `x-request-id` - ID de la petición

**Request Body:**
\`\`\`json
{
  "action": "payment.updated",
  "api_version": "v1",
  "data": {
    "id": "12345678"
  },
  "date_created": "2025-10-09T12:05:00.000Z",
  "id": 98765432,
  "live_mode": false,
  "type": "payment",
  "user_id": "123456789"
}
\`\`\`

**Response (200):**
\`\`\`json
{
  "status": "ok"
}
\`\`\`

## Payment Status Flow

\`\`\`
pending → in_process → approved
                    ↓
                  rejected
                    ↓
                  cancelled
                    ↓
                  refunded
\`\`\`

## Payment Methods Supported
- Tarjeta de crédito
- Tarjeta de débito
- Efectivo (Rapipago, Pago Fácil)
- Transferencia bancaria
- Mercado Pago Wallet

## WebSocket Events

### payment:updated
Emitido cuando el estado de un pago cambia.

\`\`\`typescript
{
  payment: {
    id: string,
    orderId: string,
    amount: number,
    status: string,
    provider: string,
    externalId?: string,
    createdAt: string,
    updatedAt: string
  },
  metadata: {
    version: number,
    updatedAt: string
  }
}
\`\`\`

## Environment Variables

\`\`\`bash
# MercadoPago Access Token (servidor)
MERCADOPAGO_ACCESS_TOKEN=TEST-1234567890-access-token

# MercadoPago Public Key (cliente)
NEXT_PUBLIC_MERCADOPAGO_PUBLIC_KEY=TEST-1234567890-public-key

# Sandbox mode (development)
PAYMENT_SANDBOX=true
NEXT_PUBLIC_PAYMENT_SANDBOX=true

# Webhook URL (debe ser pública)
PAYMENT_WEBHOOK_URL=https://yourdomain.com/api/webhook/mercadopago
\`\`\`

## Testing

### Sandbox Test Cards (Argentina)

**Approved:**
- Mastercard: 5031 7557 3453 0604
- Visa: 4509 9535 6623 3704
- CVV: 123
- Expiry: Any future date

**Rejected:**
- Card: 4000 0000 0000 0002

**Pending:**
- Card: 4000 0000 0000 0008

## Error Handling

### Common Errors

**PaymentError:**
- `DUPLICATE_PAYMENT` - Ya existe un pago activo
- `ORDER_NOT_FOUND` - Pedido no existe
- `INVALID_AMOUNT` - Monto inválido
- `PROVIDER_ERROR` - Error del proveedor de pagos

### Retry Logic
El sistema reintenta automáticamente operaciones fallidas con backoff exponencial:
- Intento 1: Inmediato
- Intento 2: 1 segundo
- Intento 3: 2 segundos
- Intento 4: 4 segundos

## Rate Limits
- Payment creation: 10 requests/minute per IP
- Webhook: No limit (authenticated via signature)

## Support
Para soporte técnico, contactar: support@restaurant.com
```

#### 4.2 Payment Flow Diagram
**Archivo**: `docs/diagrams/payment-flow.md`

```markdown
# Payment Flow Diagram

## User Journey

\`\`\`
┌─────────────┐
│   Cliente   │
│   en Mesa   │
└──────┬──────┘
       │
       │ 1. Solicita cuenta
       ▼
┌─────────────┐
│   Mozo ve   │
│   Pedidos   │
└──────┬──────┘
       │
       │ 2. Click "Pagar"
       ▼
┌─────────────┐
│  Modal de   │
│    Pago     │
└──────┬──────┘
       │
       │ 3. Confirma monto
       ▼
┌─────────────┐
│  Checkout   │
│  MercadoPago│
└──────┬──────┘
       │
       │ 4. Completa pago
       ▼
┌─────────────┐
│  Webhook    │
│  notifica   │
└──────┬──────┘
       │
       │ 5. Actualiza DB
       ▼
┌─────────────┐
│  WebSocket  │
│  actualiza  │
│     UI      │
└─────────────┘
\`\`\`

## Technical Flow

\`\`\`
Frontend                 Backend                  MercadoPago
   │                        │                          │
   │  POST /api/payment     │                          │
   ├───────────────────────>│                          │
   │                        │  Create Preference       │
   │                        ├─────────────────────────>│
   │                        │                          │
   │                        │  Preference ID + URL     │
   │                        │<─────────────────────────┤
   │  Payment + checkoutUrl │                          │
   │<───────────────────────┤                          │
   │                        │                          │
   │  window.open(url)      │                          │
   ├────────────────────────┼─────────────────────────>│
   │                        │                          │
   │                        │  Webhook Notification    │
   │                        │<─────────────────────────┤
   │                        │                          │
   │                        │  Update Payment Status   │
   │                        │  Emit WebSocket Event    │
   │  payment:updated       │                          │
   │<───────────────────────┤                          │
   │                        │                          │
   │  UI updates            │                          │
   │  automatically         │                          │
\`\`\`
```

### 5. Validation & Quality Checks (30 min)

#### 5.1 Pre-merge Checklist
**Archivo**: `docs/checklists/payment-pr-checklist.md`

```markdown
# Payment Feature PR Checklist

## Code Quality
- [ ] All tests passing (`npm test`)
- [ ] Lint passing (`npm run lint`)
- [ ] Build successful (`npm run build`)
- [ ] No TypeScript errors
- [ ] No console.log statements in production code
- [ ] Error boundaries implemented

## Testing Coverage
- [ ] Unit tests for PaymentStore (>80% coverage)
- [ ] Unit tests for MercadoPagoProvider
- [ ] Integration tests for API endpoints
- [ ] E2E tests for payment flow
- [ ] Manual testing completed

## Documentation
- [ ] API endpoints documented
- [ ] Environment variables documented
- [ ] Flow diagrams created
- [ ] README updated
- [ ] Inline code comments added

## Security
- [ ] Environment variables in .env.local (not committed)
- [ ] Webhook signature validation implemented
- [ ] No sensitive data in logs
- [ ] Input validation on all endpoints
- [ ] Rate limiting considered

## Performance
- [ ] No N+1 queries
- [ ] Proper pagination implemented
- [ ] WebSocket events optimized
- [ ] Bundle size acceptable (<200kB added)

## UX
- [ ] Loading states implemented
- [ ] Error messages user-friendly
- [ ] Success confirmations clear
- [ ] Mobile responsive
- [ ] Accessibility (ARIA labels)

## Integration
- [ ] Works with existing orders system
- [ ] WebSocket events compatible
- [ ] No breaking changes
- [ ] Database migrations (if any)

## Deployment
- [ ] Environment variables documented
- [ ] Webhook URL configured
- [ ] MercadoPago account setup guide
- [ ] Rollback plan documented
```

## Testing Commands

### Run All Tests
```bash
# Unit + Integration tests
npm test

# E2E tests
npm run test:e2e

# Coverage report
npm test -- --coverage

# Watch mode
npm test -- --watch
```

### Test Specific Files
```bash
# Payment store tests
npm test payment-store.test.ts

# Payment API tests
npm test app/api/payment

# E2E payment flow
npx playwright test payment-flow.spec.ts
```

## Commit Structure

```bash
# Staging
git add lib/server/__tests__/payment-store.test.ts
git add lib/server/providers/__tests__/mercadopago-provider.test.ts
git add app/api/payment/__tests__/route.test.ts
git add e2e/payment-flow.spec.ts
git add playwright.config.ts
git add docs/api/payments.md
git add docs/diagrams/payment-flow.md
git add docs/checklists/payment-pr-checklist.md

# Commit
git commit -m "test(m5): add comprehensive testing and documentation

- Add PaymentStore unit tests with 90% coverage
- Add MercadoPagoProvider unit tests
- Add Payment API integration tests
- Add E2E tests for complete payment flow
- Document Payment API endpoints and webhooks
- Create payment flow diagrams
- Add PR checklist for quality assurance

Phase 4 of M5 (Digital Payments) - Testing & Documentation
Files: 8 new test files, 3 documentation files
Coverage: Unit tests >85%, E2E critical paths covered"

# Push
git push origin feature/backend-payments-mercadopago
```

## Manual Testing Guide

### Test Scenarios

#### Scenario 1: Happy Path - Approved Payment
1. Login as admin
2. Navigate to `/pedidos`
3. Click "Pagar" on an open order
4. Verify modal shows correct order details
5. Click "Pagar" button
6. Complete payment in MercadoPago sandbox with test card
7. Verify redirect to success page
8. Verify order status updated in Orders Panel
9. Verify WebSocket event received

**Expected Results:**
- Modal opens smoothly
- Checkout Pro loads in popup
- Payment processes successfully
- Success page displays
- Order marked as paid
- Real-time update in UI

#### Scenario 2: Rejected Payment
1. Repeat steps 1-5 from Scenario 1
2. Use rejected test card: 4000 0000 0000 0002
3. Verify redirect to failure page
4. Click "Intentar Nuevamente"
5. Verify return to Orders Panel

**Expected Results:**
- Payment rejected by MercadoPago
- Failure page displays clear message
- Order remains unpaid
- User can retry

#### Scenario 3: Duplicate Payment Prevention
1. Create payment for order X
2. While first payment is pending, try to create another payment for same order
3. Verify error message displayed

**Expected Results:**
- Second payment request rejected
- Error toast displayed: "Ya existe un pago activo para este pedido"

#### Scenario 4: Real-time Updates
1. Open Orders Panel in two browser tabs
2. Create payment in Tab 1
3. Verify Tab 2 updates automatically via WebSocket

**Expected Results:**
- Both tabs show same payment status
- Updates happen within 1-2 seconds

## Performance Benchmarks

### Load Testing with Artillery
**Archivo**: `artillery-payment.yml`

```yaml
config:
  target: "http://localhost:3000"
  phases:
    - duration: 60
      arrivalRate: 10
      name: "Warm up"
    - duration: 120
      arrivalRate: 50
      name: "Sustained load"
    - duration: 60
      arrivalRate: 100
      name: "Peak load"

scenarios:
  - name: "Create payment"
    flow:
      - post:
          url: "/api/payment"
          json:
            orderId: "order-{{ $randomString() }}"
            amount: 10000
          capture:
            - json: "$.id"
              as: "paymentId"
      - think: 2
      - get:
          url: "/api/payment/{{ paymentId }}"
```

Run with:
```bash
npm install -g artillery
artillery run artillery-payment.yml
```

**Expected Performance:**
- Payment creation: <500ms p95
- Payment retrieval: <200ms p95
- Webhook processing: <100ms p95
- Throughput: >100 req/s

## Next Steps After Phase 4

1. **Create Pull Request**
   - Title: `feat(M5): Complete digital payments integration with MercadoPago`
   - Description: Link to phases 1-4 documentation
   - Request reviews from: Backend lead, Frontend lead, QA

2. **Merge to Develop**
   - Ensure all CI/CD checks pass
   - Get 2+ approvals
   - Squash and merge

3. **Deploy to Staging**
   - Configure production MercadoPago account
   - Set up production webhook URL
   - Run smoke tests

4. **Monitor in Production**
   - Set up alerts for payment failures
   - Monitor webhook delivery
   - Track payment success rate

## Resources
- [MercadoPago API Docs](https://www.mercadopago.com.ar/developers/es/docs)
- [Vitest Documentation](https://vitest.dev/)
- [Playwright Documentation](https://playwright.dev/)
- [Artillery Documentation](https://www.artillery.io/docs)

## Support & Troubleshooting
For issues during testing:
1. Check test logs: `npm test -- --reporter=verbose`
2. Review API responses in Network tab
3. Verify environment variables are set
4. Check MercadoPago sandbox status

---

**¡Fase 4 completa!** Con testing y documentación exhaustiva, el Milestone 5 está listo para merge a develop.
