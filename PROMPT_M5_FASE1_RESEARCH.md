# 🔍 PROMPT EJECUTABLE: M5 Fase 1 - Research & Setup de Pagos

**Fecha de creación:** 9 de octubre de 2025  
**Branch objetivo:** `feature/research-payments`  
**Fase:** 1 de 4 (Research & Setup)  
**Tiempo estimado:** 2-3 horas  
**Agentes responsables:** Backend Architect + API Docs Writer

---

## 📋 CONTEXTO

### Estado Actual del Proyecto:
- ✅ **M4 completado:** Sistema de pedidos con WebSocket funcionando
- ✅ **Order Store:** Manejo de órdenes con estados y versioning
- ✅ **Table Store:** Estados de mesa implementados
- 🎯 **Objetivo M5:** Integrar pagos digitales para completar el flujo

### ¿Por qué esta fase?
Antes de implementar, necesitamos:
1. Investigar opciones de pasarelas de pago para Argentina/LATAM
2. Definir arquitectura de integración
3. Diseñar modelos de datos para pagos
4. Crear documentación técnica base

---

## 🎯 OBJETIVO FASE 1

Investigar, documentar y preparar la base técnica para integración de pagos digitales.

### Definition of Done:
- [ ] Documento de comparación de pasarelas (Mercado Pago vs Stripe)
- [ ] Arquitectura de integración definida
- [ ] Modelos TypeScript para Payment diseñados
- [ ] Plan de implementación documentado
- [ ] Credenciales de prueba configuradas
- [ ] Documento de seguridad y compliance

---

## 📝 TAREA #1: Investigar Pasarelas de Pago

### Objetivo:
Comparar Mercado Pago y Stripe para elegir la mejor opción para el proyecto.

### Paso 1: Crear documento de comparación

**Archivo:** `docs/payments/payment-gateway-comparison.md`

**Contenido sugerido:**

```markdown
# Comparación de Pasarelas de Pago

## Criterios de Evaluación

### 1. Mercado Pago
**Ventajas:**
- ✅ Principal en Argentina y LATAM
- ✅ Amplia adopción local
- ✅ Integración con QR nativo
- ✅ Checkout Pro (hosted)
- ✅ Wallet integration

**Desventajas:**
- ⚠️ Documentación menos robusta que Stripe
- ⚠️ SDK menos maduro
- ⚠️ Limitado fuera de LATAM

**Costos:**
- Checkout Pro: ~4.99% + $X por transacción
- API: ~3.99% + $X por transacción
- Sin costos de setup

**Links útiles:**
- SDK Node.js: https://github.com/mercadopago/sdk-nodejs
- Docs: https://www.mercadopago.com.ar/developers/es/docs
- Sandbox: https://www.mercadopago.com.ar/developers/panel/credentials

---

### 2. Stripe
**Ventajas:**
- ✅ Mejor documentación del mercado
- ✅ SDK muy maduro
- ✅ TypeScript first-class support
- ✅ Webhooks robustos
- ✅ Dashboard excelente

**Desventajas:**
- ⚠️ Menor adopción en Argentina
- ⚠️ Puede requerir más configuración local
- ⚠️ Algunos métodos de pago locales no disponibles

**Costos:**
- Pagos: ~2.9% + $0.30 USD por transacción
- Sin costos mensuales
- Features avanzados: requiere plan

**Links útiles:**
- SDK Node.js: https://github.com/stripe/stripe-node
- Docs: https://stripe.com/docs
- Sandbox: https://dashboard.stripe.com/test/dashboard

---

## Recomendación

### Para MVP y mercado argentino: **Mercado Pago**
**Razones:**
1. Mayor adopción en el mercado objetivo
2. Mejor experiencia para usuarios locales
3. Integración QR nativa
4. Menor fricción en onboarding

### Para escalabilidad internacional: **Stripe como fallback**
**Estrategia:**
- Implementar Mercado Pago primero (M5 Fase 2-3)
- Agregar Stripe como segunda opción (M5 Fase 4 o futuro)
- Usar patrón Strategy para abstraer pasarela

---

## Plan de Implementación

### Fase 2: Backend Integration (Mercado Pago)
- Instalar SDK de Mercado Pago
- Crear service de pagos abstracto
- Implementar MercadoPago adapter
- Configurar webhooks

### Fase 3: Frontend Checkout
- Componente de checkout
- Integración con Checkout Pro
- Estados de pago en UI
- Manejo de errores

### Fase 4: Testing & Docs
- Tests E2E de flujo completo
- Documentación de API
- Guía de configuración
```

---

## 📝 TAREA #2: Diseñar Arquitectura de Pagos

### Objetivo:
Definir cómo se integrará el sistema de pagos con la arquitectura existente.

### Paso 1: Crear diagrama de arquitectura

**Archivo:** `docs/payments/payment-architecture.md`

**Contenido:**

```markdown
# Arquitectura de Sistema de Pagos

## Componentes

### 1. Payment Service (lib/payment-service.ts)
**Responsabilidad:** Abstracción de pasarelas de pago

```typescript
interface PaymentProvider {
  createPayment(order: Order, options: PaymentOptions): Promise<Payment>
  getPaymentStatus(paymentId: string): Promise<PaymentStatus>
  processWebhook(payload: unknown): Promise<WebhookResult>
  cancelPayment(paymentId: string): Promise<void>
}

class MercadoPagoProvider implements PaymentProvider {
  // Implementación específica de Mercado Pago
}

class StripeProvider implements PaymentProvider {
  // Implementación específica de Stripe
}
```

### 2. Payment Store (lib/server/payment-store.ts)
**Responsabilidad:** Persistencia de transacciones

```typescript
interface Payment {
  id: string
  orderId: string
  tableId: string
  provider: 'mercadopago' | 'stripe'
  status: 'pending' | 'processing' | 'completed' | 'failed' | 'refunded'
  amount: number
  currency: string
  externalId: string // ID de la pasarela
  metadata: PaymentMetadata
  createdAt: Date
  updatedAt: Date
  completedAt?: Date
}

interface PaymentMetadata {
  method: 'credit_card' | 'debit_card' | 'qr' | 'wallet'
  customerEmail?: string
  reference?: string
  webhookAttempts?: number
}
```

### 3. API Endpoints

#### POST /api/payment
Crear intención de pago
```typescript
Request: {
  orderId: string
  provider?: 'mercadopago' | 'stripe'
  returnUrl?: string
}

Response: {
  paymentId: string
  checkoutUrl: string // URL para redirigir al usuario
  status: 'pending'
}
```

#### GET /api/payment/:id
Consultar estado de pago

#### POST /api/payment/webhook
Recibir notificaciones de pasarelas

### 4. Flujo de Estados

```
Order (pendiente) 
  ↓
Payment (pending) → Usuario paga en checkout → Payment (processing)
  ↓                                                ↓
Webhook recibido                                  Webhook confirmación
  ↓                                                ↓
Payment (completed) → Order (paymentStatus: pagado) → Table (cuenta_solicitada → libre)
```

### 5. Integración con Orden Store

**Modificaciones necesarias en order-store.ts:**
- Agregar campo `paymentId?: string` a StoredOrder
- Nuevo método: `markOrderAsPaid(orderId: string, paymentId: string)`
- Emitir evento WebSocket: `order.payment.updated`

---

## Seguridad

### Variables de Entorno Requeridas
```bash
# Mercado Pago
MERCADOPAGO_ACCESS_TOKEN=TEST-xxxx
MERCADOPAGO_PUBLIC_KEY=TEST-xxxx
MERCADOPAGO_WEBHOOK_SECRET=xxx

# Stripe (futuro)
STRIPE_SECRET_KEY=sk_test_xxx
STRIPE_PUBLISHABLE_KEY=pk_test_xxx
STRIPE_WEBHOOK_SECRET=whsec_xxx

# General
PAYMENT_PROVIDER=mercadopago # o 'stripe'
PAYMENT_RETURN_URL=http://localhost:3000/payment/success
PAYMENT_WEBHOOK_URL=https://tu-dominio.com/api/payment/webhook
```

### Validación de Webhooks
- ✅ Verificar firma de webhook
- ✅ Validar IP de origen (whitelist de pasarela)
- ✅ Idempotencia: no procesar el mismo webhook 2 veces
- ✅ Logging de todos los webhooks recibidos

---

## Compliance

### PCI-DSS
- ✅ **NO almacenar datos de tarjeta** - usar checkout hosted
- ✅ Usar HTTPS en producción
- ✅ Logs sin información sensible

### GDPR / Ley de Protección de Datos
- ✅ Almacenar solo metadata necesaria
- ✅ Permitir eliminación de datos de pago
- ✅ Encriptar IDs externos
```

---

## 📝 TAREA #3: Crear Modelos TypeScript

### Objetivo:
Definir tipos e interfaces para el sistema de pagos.

### Paso 1: Crear archivo de tipos

**Archivo:** `lib/server/payment-types.ts`

```typescript
// Payment Provider Types
export type PaymentProvider = 'mercadopago' | 'stripe'

export type PaymentStatus = 
  | 'pending'      // Pago creado, esperando confirmación
  | 'processing'   // En proceso de validación
  | 'completed'    // Pago exitoso
  | 'failed'       // Pago rechazado
  | 'refunded'     // Pago reembolsado
  | 'cancelled'    // Pago cancelado por usuario/sistema

export type PaymentMethod = 
  | 'credit_card'
  | 'debit_card'
  | 'qr'
  | 'wallet'
  | 'bank_transfer'

// Payment Models
export interface Payment {
  id: string
  orderId: string
  tableId: string
  provider: PaymentProvider
  status: PaymentStatus
  amount: number
  currency: string
  externalId: string
  method?: PaymentMethod
  metadata?: PaymentMetadata
  createdAt: Date
  updatedAt: Date
  completedAt?: Date
  failureReason?: string
}

export interface PaymentMetadata {
  customerEmail?: string
  customerPhone?: string
  reference?: string
  webhookAttempts?: number
  webhookLastAttempt?: string
  checkoutUrl?: string
  returnUrl?: string
}

// API Request/Response Types
export interface CreatePaymentPayload {
  orderId: string
  provider?: PaymentProvider
  returnUrl?: string
  metadata?: {
    customerEmail?: string
    customerPhone?: string
  }
}

export interface CreatePaymentResponse {
  data: {
    paymentId: string
    checkoutUrl: string
    status: PaymentStatus
    expiresAt?: string
  }
  metadata: {
    provider: PaymentProvider
    createdAt: string
  }
}

export interface GetPaymentResponse {
  data: Payment
  metadata: {
    provider: PaymentProvider
  }
}

// Payment Provider Interface
export interface PaymentProviderOptions {
  accessToken: string
  publicKey?: string
  webhookSecret?: string
  sandbox?: boolean
}

export interface CreatePaymentOptions {
  amount: number
  currency: string
  orderId: string
  description?: string
  customerEmail?: string
  returnUrl?: string
  metadata?: Record<string, string>
}

export interface WebhookPayload {
  provider: PaymentProvider
  event: string
  data: unknown
  signature?: string
}

export interface WebhookResult {
  paymentId: string
  status: PaymentStatus
  externalId: string
  processed: boolean
}

// Payment Store Types
export interface PaymentStoreData {
  payments: Payment[]
  metadata: {
    version: number
    updatedAt: string
  }
}

// Errors
export class PaymentError extends Error {
  constructor(
    message: string,
    public code: string,
    public status: number,
    public meta?: Record<string, unknown>
  ) {
    super(message)
    this.name = 'PaymentError'
  }
}
```

---

## 📝 TAREA #4: Configurar Credenciales de Prueba

### Objetivo:
Obtener acceso a sandbox de Mercado Pago para testing.

### Paso 1: Crear cuenta de desarrollador

1. Ir a: https://www.mercadopago.com.ar/developers
2. Crear cuenta o hacer login
3. Ir a "Credenciales"
4. Copiar:
   - Access Token de prueba
   - Public Key de prueba

### Paso 2: Crear archivo .env.local

**Archivo:** `.env.local` (agregar al .gitignore)

```bash
# Payment Configuration
PAYMENT_PROVIDER=mercadopago
PAYMENT_SANDBOX=true

# Mercado Pago Test Credentials
MERCADOPAGO_ACCESS_TOKEN=TEST-xxxx-replace-with-your-token
MERCADOPAGO_PUBLIC_KEY=TEST-xxxx-replace-with-your-key
MERCADOPAGO_WEBHOOK_SECRET=replace-with-webhook-secret

# URLs
NEXT_PUBLIC_APP_URL=http://localhost:3000
PAYMENT_RETURN_URL=http://localhost:3000/payment/success
PAYMENT_FAILURE_URL=http://localhost:3000/payment/failure
```

### Paso 3: Documentar en README

**Archivo:** `docs/payments/setup-guide.md`

```markdown
# Guía de Configuración de Pagos

## Requisitos Previos
- Cuenta de Mercado Pago (Argentina)
- Acceso a credenciales de prueba

## Setup Local

1. **Obtener credenciales:**
   - Ir a https://www.mercadopago.com.ar/developers
   - Navegar a "Credenciales"
   - Copiar Access Token y Public Key de **TEST**

2. **Configurar variables de entorno:**
   ```bash
   cp .env.example .env.local
   # Editar .env.local con tus credenciales
   ```

3. **Instalar SDK (Fase 2):**
   ```bash
   npm install mercadopago
   ```

4. **Configurar Webhook (Fase 3):**
   - Usar ngrok para exponer localhost
   - Configurar URL en panel de Mercado Pago

## Testing

### Tarjetas de Prueba Mercado Pago
- ✅ Aprobada: 5031 7557 3453 0604
- ❌ Rechazada: 5031 4332 1540 6351
- ⏳ Pendiente: 5031 4332 1540 6351

### Datos de prueba
- CVV: 123
- Fecha: cualquier fecha futura
- Nombre: APRO (aprobada) o OTHE (rechazada)
```

---

## 📝 TAREA #5: Crear Plan de Implementación

### Objetivo:
Detallar las siguientes fases de M5.

**Archivo:** `docs/payments/implementation-plan.md`

```markdown
# Plan de Implementación M5 - Pagos Digitales

## Fase 1: Research & Setup ✅ (esta fase)
**Tiempo:** 2-3 horas  
**Entregables:**
- [x] Comparación de pasarelas
- [x] Arquitectura definida
- [x] Modelos TypeScript
- [x] Credenciales configuradas
- [x] Documentación base

---

## Fase 2: Backend Integration (Próximo prompt)
**Branch:** `feature/backend-payments-mercadopago`  
**Tiempo:** 6-8 horas  
**Agentes:** Backend Architect + Lib Logic Owner

**Tareas:**
1. Instalar SDK Mercado Pago
2. Crear PaymentService abstracto
3. Implementar MercadoPagoProvider
4. Crear Payment Store (persistencia)
5. Implementar API endpoints:
   - POST /api/payment
   - GET /api/payment/:id
   - POST /api/payment/webhook
6. Integrar con Order Store
7. Emitir eventos WebSocket
8. Tests unitarios del backend

**Archivos a crear:**
- `lib/payment-service.ts`
- `lib/server/payment-store.ts`
- `lib/server/mercadopago-provider.ts`
- `app/api/payment/route.ts`
- `app/api/payment/[id]/route.ts`
- `app/api/payment/webhook/route.ts`

---

## Fase 3: Frontend Checkout (Tercer prompt)
**Branch:** `feature/ui-payment-checkout`  
**Tiempo:** 8-10 horas  
**Agentes:** Frontend Dev + UI Designer

**Tareas:**
1. Crear componente PaymentCheckout
2. Integración con Checkout Pro de Mercado Pago
3. Vista de confirmación de pago
4. Manejo de estados (pending, success, failure)
5. Vista de historial de pagos
6. Actualizar OrdersPanel con info de pagos
7. Tests de componentes

**Archivos a crear:**
- `components/payment-checkout.tsx`
- `components/payment-status.tsx`
- `app/payment/success/page.tsx`
- `app/payment/failure/page.tsx`
- Tests correspondientes

---

## Fase 4: Testing & Docs (Cuarto prompt)
**Branch:** `feature/test-e2e-payments`  
**Tiempo:** 4-6 horas  
**Agentes:** API Tester + Workflow Optimizer + API Docs Writer

**Tareas:**
1. Tests E2E del flujo completo:
   - Crear orden → Iniciar pago → Webhook → Orden pagada
2. Tests de edge cases (fallas, timeouts, webhooks duplicados)
3. Documentar API de pagos completa
4. Guía de troubleshooting
5. Performance testing

**Archivos a crear:**
- `app/api/__tests__/payment-api.test.ts`
- `lib/__tests__/payment-service.test.ts`
- Tests E2E con Playwright
- `docs/api/payment-endpoint.md`

---

## Estimación Total M5
- **Fase 1 (Research):** 3 horas
- **Fase 2 (Backend):** 8 horas
- **Fase 3 (Frontend):** 10 horas
- **Fase 4 (Testing):** 6 horas
- **TOTAL:** ~27 horas (~3-4 días de trabajo)

---

## Criterios de Éxito M5 Completo

- [ ] Usuario puede pagar orden desde QR
- [ ] Usuario puede pagar orden desde staff panel
- [ ] Webhooks procesan correctamente
- [ ] Estados de orden se actualizan automáticamente
- [ ] Mesa se libera tras pago exitoso
- [ ] Historial de pagos accesible
- [ ] Tests E2E passing
- [ ] Documentación completa
- [ ] Manejo robusto de errores
```

---

## ✅ CHECKLIST FASE 1

Antes de considerar esta fase completa:

- [ ] ✅ Documento de comparación creado (`docs/payments/payment-gateway-comparison.md`)
- [ ] ✅ Arquitectura documentada (`docs/payments/payment-architecture.md`)
- [ ] ✅ Tipos TypeScript creados (`lib/server/payment-types.ts`)
- [ ] ✅ Credenciales de prueba obtenidas y configuradas
- [ ] ✅ `.env.local` creado con variables de entorno
- [ ] ✅ Setup guide creado (`docs/payments/setup-guide.md`)
- [ ] ✅ Plan de implementación documentado (`docs/payments/implementation-plan.md`)
- [ ] ✅ Commit con mensaje descriptivo

---

## 📦 COMANDOS A EJECUTAR

```powershell
# Crear estructura de carpetas
cd c:\Users\alvar\Downloads\restaurantmanagement
New-Item -Path "docs\payments" -ItemType Directory -Force

# Crear archivos de documentación
# (copiar contenidos de este prompt a cada archivo)

# Crear archivo de tipos
New-Item -Path "lib\server\payment-types.ts" -ItemType File -Force

# Commit
git checkout -b feature/research-payments
git add .
git commit -m "docs(m5): research and architecture for payment integration

- Add payment gateway comparison (Mercado Pago vs Stripe)
- Define payment system architecture
- Create TypeScript payment types
- Setup test credentials configuration
- Document implementation plan for phases 2-4

SCOPE: M5 Phase 1 - Research & Setup
AGENTS: Backend Architect + API Docs Writer"

git push origin feature/research-payments
```

---

## 🎯 SIGUIENTE PASO

Una vez completada esta fase:
1. Revisar y aprobar la arquitectura propuesta
2. Ejecutar **PROMPT_M5_FASE2_BACKEND.md** para integración backend
3. Validar que las credenciales de Mercado Pago funcionan

---

## 💡 NOTAS IMPORTANTES

### ¿Por qué empezar con Research?
- ✅ Evita retrabajos por decisiones apresuradas
- ✅ Define arquitectura antes de codificar
- ✅ Permite validar con stakeholders
- ✅ Documenta decisiones técnicas

### ¿Por qué Mercado Pago primero?
- ✅ Mayor adopción en Argentina (mercado objetivo)
- ✅ Mejor UX para usuarios locales
- ✅ QR nativo integrado
- ✅ Stripe como fallback futuro

### Seguridad desde el inicio
- ✅ NO almacenar datos de tarjeta
- ✅ Usar checkout hosted (PCI-DSS compliant)
- ✅ Validar webhooks con firma
- ✅ Idempotencia en procesamiento

---

**FIN FASE 1**  
**Status:** Ready to Execute  
**Tiempo estimado:** 2-3 horas  
**Siguiente:** PROMPT_M5_FASE2_BACKEND.md
