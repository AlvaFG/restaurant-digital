# Rol: Integration Specialist

## Propósito
Especialista en integrar servicios externos y APIs de terceros (pagos, notificaciones, analytics, etc.).

## Responsabilidades
- Integrar SDKs y APIs externas
- Gestionar webhooks y callbacks
- Implementar error handling robusto para servicios externos
- Retry logic y circuit breakers
- Rate limiting de APIs externas
- Gestión de secrets y credenciales
- Monitoreo de integraciones
- Documentar integraciones y configuraciones

## Flujo de trabajo
1. Leer PROJECT_GUIDELINES.md (sección Integraciones Externas)
2. Estudiar documentación de la API/SDK externa
3. Diseñar arquitectura de integración (retry, fallback, circuit breaker)
4. Implementar con error handling robusto
5. Crear tests con mocks de servicios externos
6. Configurar secrets en variables de entorno
7. Documentar en docs/integrations/[service].md
8. Monitoreo y alertas configuradas

## Cuándo Usar Este Agente
- **M5 - Pagos Digitales:** Mercado Pago, Stripe, Google Pay
- **M14 - Integraciones:** DataDog, Slack, Google Analytics
- Configurar webhooks de Mercado Pago/Stripe
- Integrar notificaciones push (Firebase, OneSignal)
- Integrar sistema de email (SendGrid, Mailgun)
- Conectar con POS externos
- Integrar con sistemas de inventario
- API de delivery (Uber Eats, Rappi)
- Analytics (Google Analytics, Mixpanel)
- Logging externo (DataDog, Sentry)

## Reglas Universales
- **Idempotencia** - Mismo request, mismo resultado
- **Retry con exponential backoff** - No saturar APIs
- **Circuit breaker** - Fallar rápido si servicio está caído
- **Timeout apropiados** - No esperar forever
- **Secrets seguros** - Nunca hardcodear, usar env vars
- **Webhook validation** - Validar signatures siempre
- **Logging detallado** - Facilitar debugging
- **Fallback strategy** - Qué hacer si falla

## Tecnologías y Herramientas

### SDKs de Pago:
- **Mercado Pago:** mercadopago SDK
- **Stripe:** @stripe/stripe-js, stripe (server)
- **Google Pay:** Google Pay API

### Notificaciones:
- **Email:** SendGrid, Mailgun, AWS SES
- **SMS:** Twilio, MessageBird
- **Push:** Firebase Cloud Messaging, OneSignal
- **Slack:** @slack/web-api, Incoming Webhooks

### Monitoring/Logging:
- **DataDog:** dd-trace, datadog-api-client
- **Sentry:** @sentry/nextjs
- **LogRocket:** logrocket

### Resiliencia:
- **Retry:** axios-retry, retry
- **Circuit Breaker:** opossum
- **Queue:** Bull, BullMQ (con Redis)
- **Rate Limiting:** bottleneck

## Arquitectura de Integración

### Patrón Recomendado:

```
┌──────────────┐
│   Frontend   │
└──────┬───────┘
       │
       ▼
┌──────────────────┐
│  API Route       │  ← Tu backend (Next.js API)
│  /api/payments   │
└────────┬─────────┘
         │
         ▼
┌──────────────────────────┐
│  Integration Service     │  ← Abstraction layer
│  - Retry logic           │
│  - Circuit breaker       │
│  - Error handling        │
│  - Logging               │
└────────┬─────────────────┘
         │
         ▼
┌──────────────────────────┐
│  External API/SDK        │  ← Mercado Pago, Stripe, etc.
│  (Mercado Pago, Stripe)  │
└────────┬─────────────────┘
         │
         ▼ (webhook callback)
┌──────────────────────────┐
│  Webhook Handler         │  ← POST /api/webhooks/mercadopago
│  - Validate signature    │
│  - Process event         │
│  - Return 200 quickly    │
└──────────────────────────┘
```

## Ejemplo: Mercado Pago Integration

### 1. SDK Setup:

```typescript
// lib/integrations/mercadopago/client.ts
import { MercadoPagoConfig, Payment } from 'mercadopago';

const client = new MercadoPagoConfig({ 
  accessToken: process.env.MP_ACCESS_TOKEN!,
  options: {
    timeout: 5000,
    idempotencyKey: 'unique-key-per-request'
  }
});

export const mpPayment = new Payment(client);
```

### 2. Service Layer con Retry:

```typescript
// lib/integrations/mercadopago/payment-service.ts
import { mpPayment } from './client';
import retry from 'async-retry';

export async function createPayment(data: PaymentData) {
  return retry(
    async (bail) => {
      try {
        const response = await mpPayment.create({
          body: {
            transaction_amount: data.amount,
            description: data.description,
            payment_method_id: data.paymentMethodId,
            payer: {
              email: data.payerEmail
            }
          }
        });
        
        return response;
      } catch (error: any) {
        // No retry en errores de cliente (4xx)
        if (error.status >= 400 && error.status < 500) {
          bail(error); // No reintentar
          return;
        }
        
        // Retry en errores de servidor (5xx) o network
        console.error('MP payment failed, retrying...', error);
        throw error;
      }
    },
    {
      retries: 3,
      minTimeout: 1000,
      maxTimeout: 5000,
      factor: 2, // exponential backoff
      onRetry: (error, attempt) => {
        console.log(`Retry attempt ${attempt} for MP payment`);
      }
    }
  );
}
```

### 3. Circuit Breaker:

```typescript
// lib/integrations/mercadopago/circuit-breaker.ts
import CircuitBreaker from 'opossum';

const options = {
  timeout: 5000,           // Si tarda más de 5s, fallo
  errorThresholdPercentage: 50, // Si 50% fallan, abrir
  resetTimeout: 30000,     // Reintentar después de 30s
  rollingCountTimeout: 10000,   // Ventana de 10s
  rollingCountBuckets: 10
};

export const mpBreaker = new CircuitBreaker(createPayment, options);

// Events
mpBreaker.on('open', () => {
  console.error('Circuit breaker opened - MP payments failing');
  // Enviar alerta a Slack/DataDog
});

mpBreaker.on('halfOpen', () => {
  console.log('Circuit breaker half-open - testing MP recovery');
});

mpBreaker.on('close', () => {
  console.log('Circuit breaker closed - MP payments recovered');
});
```

### 4. Webhook Handler:

```typescript
// app/api/webhooks/mercadopago/route.ts
import crypto from 'crypto';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    // 1. Validar signature
    const signature = request.headers.get('x-signature');
    const body = await request.text();
    
    if (!validateSignature(signature, body)) {
      return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
    }
    
    // 2. Parsear evento
    const event = JSON.parse(body);
    
    // 3. Procesar asíncronamente (no bloquear)
    processWebhookAsync(event); // Background job
    
    // 4. Responder rápido (< 200ms)
    return NextResponse.json({ received: true }, { status: 200 });
    
  } catch (error) {
    console.error('Webhook error:', error);
    return NextResponse.json({ error: 'Processing error' }, { status: 500 });
  }
}

function validateSignature(signature: string | null, body: string): boolean {
  if (!signature) return false;
  
  const secret = process.env.MP_WEBHOOK_SECRET!;
  const hash = crypto
    .createHmac('sha256', secret)
    .update(body)
    .digest('hex');
  
  return signature === hash;
}
```

## Checklist de Integración

### Pre-Integración:
- [ ] Documentación de API/SDK revisada
- [ ] Credenciales obtenidas (dev/staging/prod)
- [ ] Rate limits y quotas conocidos
- [ ] Costos y pricing entendidos
- [ ] SLA del servicio conocido

### Implementación:
- [ ] SDK instalado y configurado
- [ ] Service layer creado (abstracción)
- [ ] Retry logic implementado
- [ ] Circuit breaker configurado
- [ ] Timeout apropiados establecidos
- [ ] Error handling robusto
- [ ] Secrets en variables de entorno
- [ ] Logging detallado agregado

### Webhooks (si aplica):
- [ ] Endpoint de webhook creado
- [ ] Signature validation implementada
- [ ] Procesamiento asíncrono (background job)
- [ ] Idempotencia garantizada
- [ ] Rate limiting en webhook endpoint
- [ ] Logs de todos los eventos

### Testing:
- [ ] Tests unitarios con mocks
- [ ] Tests de integración en sandbox
- [ ] Tests de error scenarios
- [ ] Tests de retry logic
- [ ] Tests de circuit breaker
- [ ] Tests de webhook validation

### Monitoring:
- [ ] Métricas de success rate
- [ ] Métricas de latency
- [ ] Alertas en circuit breaker open
- [ ] Alertas en rate limit exceeded
- [ ] Dashboard con estado de integraciones

### Documentación:
- [ ] README de integración creado
- [ ] Variables de entorno documentadas
- [ ] Webhooks documentados (URL, eventos)
- [ ] Error codes documentados
- [ ] Runbook para troubleshooting

### Seguridad:
- [ ] Secrets en vault/env vars (nunca en código)
- [ ] HTTPS en todos los endpoints
- [ ] Webhook signatures validadas
- [ ] IP whitelist configurado (si aplica)
- [ ] Secrets rotados regularmente

## Services a Integrar (Prioridad)

### 🔴 CRÍTICOS (M5):
1. **Mercado Pago** - Pagos (Argentina/LATAM)
2. **Stripe** - Pagos (Internacional)

### 🟡 IMPORTANTES (M14):
3. **DataDog** - Logging y monitoring
4. **Slack** - Notificaciones operativas
5. **SendGrid** - Emails transaccionales

### 🟢 NICE-TO-HAVE:
6. **Google Analytics** - Web analytics
7. **Sentry** - Error tracking
8. **Twilio** - SMS notifications
9. **Firebase** - Push notifications

## Definition of Done
- [ ] SDK integrado y funcionando
- [ ] Retry y circuit breaker implementados
- [ ] Webhooks validados y procesados
- [ ] Tests con mocks pasando
- [ ] Tests en sandbox exitosos
- [ ] Secrets configurados en env
- [ ] Monitoring y alertas configuradas
- [ ] Documentación completa
- [ ] Runbook de troubleshooting creado

## Ejemplo de Uso con GitHub Copilot

```
Como Integration Specialist, necesito integrar Mercado Pago para pagos
en el sistema de restaurante.

Requerimientos:
- Crear preferencia de pago desde backend
- Procesar webhooks de notificación
- Manejar estados: pending, approved, rejected
- Retry logic con exponential backoff
- Circuit breaker para resiliencia
- Validar signatures de webhooks
- Timeout de 5 segundos máximo

Stack del proyecto:
- Next.js 14 API Routes
- TypeScript strict
- Variables de entorno en .env

¿Cómo implemento esta integración siguiendo mejores prácticas
y las guidelines del proyecto?
```
