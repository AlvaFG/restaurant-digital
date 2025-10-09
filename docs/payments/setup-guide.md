# Payment Integration Setup Guide

## Guía de Configuración para Integración de Pagos

Esta guía describe cómo configurar las credenciales y entorno de desarrollo para el sistema de pagos digitales.

---

## 📋 Índice

1. [Mercado Pago Setup](#mercado-pago-setup)
2. [Variables de Entorno](#variables-de-entorno)
3. [Testing en Sandbox](#testing-en-sandbox)
4. [Validación de Setup](#validación-de-setup)
5. [Troubleshooting](#troubleshooting)

---

## 🟦 Mercado Pago Setup

### 1. Crear Cuenta de Desarrollador

1. **Registrarse en Mercado Pago Developers:**
   - Visitar: https://www.mercadopago.com.ar/developers
   - Crear cuenta o ingresar con cuenta existente
   - Completar datos de perfil de desarrollador

2. **Acceder al Dashboard:**
   - Ir a: https://www.mercadopago.com.ar/developers/panel
   - Seleccionar "Mis aplicaciones" > "Crear aplicación"
   - Elegir nombre descriptivo: `RestaurantManagement-{ENV}` (ej: `RestaurantManagement-Dev`)

3. **Tipos de Aplicación:**
   - **Checkout Pro**: Para QR y links de pago (recomendado para este proyecto)
   - **Checkout API**: Para integrar formulario de pago custom (futuro)

### 2. Obtener Credenciales

#### Credenciales de Prueba (Sandbox)

1. En el panel, ir a "Credenciales" > "Credenciales de prueba"
2. Copiar:
   - **Public Key (TEST)**: `TEST-xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx`
   - **Access Token (TEST)**: `TEST-xxxxxxxxxxxxxxxxxxxx-xxxxx-xxxxxxxxxxxx`

#### Credenciales de Producción

1. En el panel, ir a "Credenciales" > "Credenciales de producción"
2. **Requisitos:**
   - Cuenta verificada
   - Documentación empresarial aprobada
   - Certificación de seguridad (para datos sensibles)

3. Copiar:
   - **Public Key (PROD)**: `APP_USR-xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx`
   - **Access Token (PROD)**: `APP_USR-xxxxxxxxxxxxxxxxxxxx-xxxxx-xxxxxxxxxxxx`

### 3. Configurar Webhooks

Los webhooks son críticos para recibir notificaciones de estado de pagos.

1. **Ir a Configuración de Webhooks:**
   - Panel > Tu aplicación > Webhooks
   - Click "Configurar notificaciones"

2. **URL del Webhook:**
   - **Dev**: `https://your-dev-domain.ngrok.io/api/webhook/mercadopago`
   - **Staging**: `https://staging.turestaurante.com/api/webhook/mercadopago`
   - **Prod**: `https://turestaurante.com/api/webhook/mercadopago`

3. **Eventos a Suscribir:**
   - ✅ `payment` (requerido)
   - ✅ `merchant_order` (opcional, para órden completa)

4. **Obtener Secret del Webhook:**
   - Mercado Pago genera automáticamente
   - Copiar el `x-signature` secret para validar requests

### 4. Configurar IPs Permitidas (Producción)

Para seguridad en producción, configurar IP whitelist:

1. Panel > Seguridad > IPs permitidas
2. Agregar IPs de tus servidores de producción
3. **Nota:** Esto NO aplica en sandbox

### 5. Habilitar Checkout Pro

1. Panel > Tu aplicación > Configuración
2. Habilitar:
   - ✅ **Checkout Pro** (links de pago)
   - ✅ **QR Código** (pagos presenciales)
3. Configurar URLs de retorno:
   - Success: `https://turestaurante.com/payment/success`
   - Failure: `https://turestaurante.com/payment/failure`
   - Pending: `https://turestaurante.com/payment/pending`

---

## 🔐 Variables de Entorno

### Archivo `.env.local` (Development)

Crear archivo `.env.local` en la raíz del proyecto:

```bash
# =============================================================================
# MERCADO PAGO CREDENTIALS (TEST)
# =============================================================================

# Public Key (para frontend)
NEXT_PUBLIC_MP_PUBLIC_KEY=TEST-xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx

# Access Token (para backend)
MP_ACCESS_TOKEN=TEST-xxxxxxxxxxxxxxxxxxxx-xxxxx-xxxxxxxxxxxx

# Webhook Secret (para validar firmas)
MP_WEBHOOK_SECRET=xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx

# Entorno de Mercado Pago
MP_ENVIRONMENT=sandbox

# =============================================================================
# PAYMENT CONFIGURATION
# =============================================================================

# Provider por defecto
PAYMENT_DEFAULT_PROVIDER=mercadopago

# URLs de retorno (development)
NEXT_PUBLIC_PAYMENT_SUCCESS_URL=http://localhost:3000/payment/success
NEXT_PUBLIC_PAYMENT_FAILURE_URL=http://localhost:3000/payment/failure
NEXT_PUBLIC_PAYMENT_PENDING_URL=http://localhost:3000/payment/pending

# URL base para webhooks (usar ngrok en dev)
PAYMENT_WEBHOOK_BASE_URL=https://your-ngrok-url.ngrok.io

# Timeout para llamadas a provider (ms)
PAYMENT_PROVIDER_TIMEOUT=10000

# =============================================================================
# PAYMENT FEATURE FLAGS
# =============================================================================

# Habilitar QR payments
NEXT_PUBLIC_ENABLE_QR_PAYMENTS=true

# Habilitar múltiples métodos de pago
NEXT_PUBLIC_ENABLE_MULTIPLE_PAYMENT_METHODS=true

# Habilitar financiación
NEXT_PUBLIC_ENABLE_FINANCING=false

# =============================================================================
# LOGGING & OBSERVABILITY
# =============================================================================

# Nivel de logging para payments
PAYMENT_LOG_LEVEL=debug

# Habilitar logs de webhooks
PAYMENT_LOG_WEBHOOKS=true
```

### Archivo `.env.production` (Production)

```bash
# =============================================================================
# MERCADO PAGO CREDENTIALS (PROD)
# =============================================================================

NEXT_PUBLIC_MP_PUBLIC_KEY=APP_USR-xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx
MP_ACCESS_TOKEN=APP_USR-xxxxxxxxxxxxxxxxxxxx-xxxxx-xxxxxxxxxxxx
MP_WEBHOOK_SECRET=xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
MP_ENVIRONMENT=production

# =============================================================================
# PAYMENT CONFIGURATION
# =============================================================================

PAYMENT_DEFAULT_PROVIDER=mercadopago
NEXT_PUBLIC_PAYMENT_SUCCESS_URL=https://turestaurante.com/payment/success
NEXT_PUBLIC_PAYMENT_FAILURE_URL=https://turestaurante.com/payment/failure
NEXT_PUBLIC_PAYMENT_PENDING_URL=https://turestaurante.com/payment/pending
PAYMENT_WEBHOOK_BASE_URL=https://turestaurante.com
PAYMENT_PROVIDER_TIMEOUT=15000

# =============================================================================
# PAYMENT FEATURE FLAGS
# =============================================================================

NEXT_PUBLIC_ENABLE_QR_PAYMENTS=true
NEXT_PUBLIC_ENABLE_MULTIPLE_PAYMENT_METHODS=true
NEXT_PUBLIC_ENABLE_FINANCING=true

# =============================================================================
# LOGGING & OBSERVABILITY
# =============================================================================

PAYMENT_LOG_LEVEL=info
PAYMENT_LOG_WEBHOOKS=true
```

### Validar Variables de Entorno

Agregar validación en `lib/server/payment-config.ts`:

```typescript
export function validatePaymentConfig() {
  const required = [
    'MP_ACCESS_TOKEN',
    'NEXT_PUBLIC_MP_PUBLIC_KEY',
    'MP_WEBHOOK_SECRET',
  ]

  const missing = required.filter(key => !process.env[key])

  if (missing.length > 0) {
    throw new Error(
      `Missing required payment environment variables: ${missing.join(', ')}`
    )
  }
}
```

---

## 🧪 Testing en Sandbox

### Cuentas de Prueba

Mercado Pago provee cuentas de prueba para simular compradores y vendedores.

#### Generar Usuarios de Prueba

1. **Via API:**
   ```bash
   curl -X POST \
     -H "Content-Type: application/json" \
     -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
     "https://api.mercadopago.com/users/test_user" \
     -d '{
       "site_id": "MLA"
     }'
   ```

2. **Respuesta:**
   ```json
   {
     "id": 123456789,
     "nickname": "TESTUSER123456",
     "password": "qatest1234",
     "site_status": "active",
     "email": "test_user_123456@testuser.com"
   }
   ```

3. **Tipos de Usuarios:**
   - **test_user (comprador)**: Para simular pagos
   - **test_user (vendedor)**: Para recibir pagos (no necesario en este proyecto)

### Tarjetas de Prueba

#### Tarjetas de Crédito - Argentina (Visa/Mastercard)

| Tarjeta           | Número                | CVV | Fecha   | Resultado          |
|-------------------|-----------------------|-----|---------|--------------------|
| Visa              | `4509 9535 6623 3704` | 123 | 11/25   | ✅ Aprobado        |
| Mastercard        | `5031 7557 3453 0604` | 123 | 11/25   | ✅ Aprobado        |
| Amex              | `3711 803032 57522`   | 1234| 11/25   | ✅ Aprobado        |
| Visa (rechazada)  | `4509 9535 6623 3704` | 123 | 11/25   | ❌ Fondos insuf.   |
| Mastercard (rec.) | `5031 7557 3453 0604` | 123 | 11/25   | ❌ Rechazada       |

#### Configurar Resultado del Pago

El resultado depende del **monto** ingresado:

| Monto (ARS) | Resultado                       |
|-------------|---------------------------------|
| 1.00 - 999  | ✅ Aprobado                     |
| 1000+       | ❌ Fondos insuficientes         |
| 1001        | ❌ Tarjeta sin autorización     |
| 1002        | ❌ Tarjeta deshabilitada        |
| 1003        | ❌ Pago rechazado (fraude)      |
| 1004        | ❌ Pago rechazado (otros)       |

**Ejemplo:**
- Pagar **$500 ARS** → ✅ Aprobado
- Pagar **$1000 ARS** → ❌ Fondos insuficientes

#### Datos del Titular de Prueba

Usar datos ficticios coherentes:

```
Nombre: APRO
Apellido: BADO
DNI: 12345678
Email: test_user@testuser.com
```

### Probar Flujo Completo

1. **Crear payment via API:**
   ```bash
   curl -X POST http://localhost:3000/api/payment \
     -H "Content-Type: application/json" \
     -d '{
       "orderId": "order-123",
       "returnUrl": "http://localhost:3000/payment/success"
     }'
   ```

2. **Abrir `checkoutUrl` en navegador**

3. **Completar pago con tarjeta de prueba:**
   - Tarjeta: `4509 9535 6623 3704`
   - CVV: `123`
   - Fecha: `11/25`
   - Monto: `$500` (para aprobado)

4. **Verificar webhook recibido:**
   ```bash
   # Ver logs del servidor
   npm run dev
   
   # Debería mostrar:
   # [WEBHOOK] Received payment notification
   # [WEBHOOK] Payment completed: pmt-xxx
   ```

5. **Consultar estado del payment:**
   ```bash
   curl http://localhost:3000/api/payment/pmt-xxx
   ```

   Debería retornar `status: "completed"`

---

## ✅ Validación de Setup

### Checklist de Configuración

- [ ] Cuenta de Mercado Pago Developers creada
- [ ] Aplicación creada en el panel
- [ ] Credenciales de TEST copiadas
- [ ] Archivo `.env.local` creado con credenciales
- [ ] Variables de entorno cargadas correctamente
- [ ] ngrok instalado y configurado (para webhooks en dev)
- [ ] Usuarios de prueba generados
- [ ] Tarjetas de prueba validadas
- [ ] Webhook configurado en Mercado Pago
- [ ] Flujo de pago completo probado end-to-end

### Script de Validación

Ejecutar en terminal para validar configuración:

```bash
# Verificar variables de entorno
npm run check-payment-config

# Testear conexión con Mercado Pago
npm run test-mp-connection

# Validar webhook signature
npm run test-webhook-signature
```

---

## 🛠️ Troubleshooting

### Problema: "Invalid credentials"

**Causa:** Access token incorrecto o expirado

**Solución:**
1. Verificar que el token comience con `TEST-` (sandbox) o `APP_USR-` (prod)
2. Regenerar credenciales en el panel de Mercado Pago
3. Actualizar `.env.local`
4. Reiniciar servidor: `npm run dev`

### Problema: "Webhook not received"

**Causa:** URL no accesible desde Internet

**Solución en Dev:**
1. Instalar ngrok: `npm install -g ngrok`
2. Exponer puerto local: `ngrok http 3000`
3. Copiar URL pública: `https://xxxx.ngrok.io`
4. Actualizar webhook URL en Mercado Pago panel
5. Actualizar `PAYMENT_WEBHOOK_BASE_URL` en `.env.local`

**Solución en Prod:**
1. Verificar que tu dominio sea público
2. Verificar que endpoint `/api/webhook/mercadopago` responda 200 OK
3. Verificar firewall/security groups permitan tráfico desde IPs de Mercado Pago

### Problema: "Payment stuck in pending"

**Causa:** Webhook no procesado correctamente

**Solución:**
1. Verificar logs del servidor: `npm run dev`
2. Verificar firma del webhook: `x-signature` header
3. Verificar que el endpoint retorne `200 OK` en < 5s
4. Mercado Pago reintenta webhooks hasta 3 veces

### Problema: "Invalid webhook signature"

**Causa:** `MP_WEBHOOK_SECRET` incorrecto

**Solución:**
1. Ir a Panel > Tu aplicación > Webhooks
2. Regenerar secret
3. Copiar nuevo secret a `.env.local`
4. Reiniciar servidor

### Problema: "Test payment not working"

**Causa:** Usando tarjeta de producción en sandbox

**Solución:**
1. Verificar que `MP_ENVIRONMENT=sandbox` en `.env.local`
2. Usar tarjetas de prueba oficiales de Mercado Pago
3. Usar monto < $1000 para aprobación
4. Verificar que usuario de prueba exista

---

## 📚 Recursos Adicionales

### Documentación Oficial

- **Mercado Pago Developers:** https://www.mercadopago.com.ar/developers
- **API Reference:** https://www.mercadopago.com.ar/developers/es/reference
- **Checkout Pro:** https://www.mercadopago.com.ar/developers/es/docs/checkout-pro/landing
- **Webhooks:** https://www.mercadopago.com.ar/developers/es/docs/your-integrations/notifications/webhooks
- **Testing:** https://www.mercadopago.com.ar/developers/es/docs/integration-test

### Postman Collections

- **Official MP Collection:** https://www.mercadopago.com.ar/developers/es/docs/checkout-pro/additional-content/postman

### Support

- **Soporte técnico:** https://www.mercadopago.com.ar/developers/es/support
- **Forum de desarrolladores:** https://www.mercadopago.com.ar/developers/es/community

---

## 🔄 Próximos Pasos

Después de completar este setup, continuar con:

1. **Fase 2 - Backend:** Implementar `lib/server/payment-store.ts`, providers, API endpoints
2. **Fase 3 - Frontend:** Crear UI de checkout, integrar SDK de Mercado Pago
3. **Fase 4 - Testing:** E2E tests, validación de webhooks, load testing

Ver `docs/payments/implementation-plan.md` para detalles completos.
