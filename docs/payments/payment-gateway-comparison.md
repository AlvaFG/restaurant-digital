# Comparación de Pasarelas de Pago

**Fecha:** 9 de octubre de 2025  
**Objetivo:** Seleccionar la mejor pasarela de pago para Restaurant Digital  
**Mercado objetivo:** Argentina y LATAM

---

## Criterios de Evaluación

### 1. Mercado Pago
**Proveedor:** MercadoLibre  
**Cobertura:** Argentina, Brasil, Chile, Colombia, México, Perú, Uruguay

**Ventajas:**
- ✅ **Principal en Argentina y LATAM** - Más del 80% de adopción en Argentina
- ✅ **Amplia adopción local** - Usuarios ya tienen cuenta/app instalada
- ✅ **Integración con QR nativo** - QR Mercado Pago es estándar de facto
- ✅ **Checkout Pro (hosted)** - PCI-DSS compliant out-of-the-box
- ✅ **Wallet integration** - Pago directo desde app de Mercado Pago
- ✅ **Múltiples métodos de pago:**
  - Tarjetas de crédito/débito
  - Transferencia bancaria
  - Efectivo (Rapipago, Pago Fácil)
  - Mercado Crédito
- ✅ **Cuotas sin interés** - Promociones bancarias automáticas
- ✅ **Documentación en español**

**Desventajas:**
- ⚠️ Documentación menos robusta que Stripe
- ⚠️ SDK menos maduro en TypeScript
- ⚠️ Limitado fuera de LATAM
- ⚠️ Dashboard menos pulido
- ⚠️ Webhooks pueden tener delays ocasionales

**Costos:**
- **Checkout Pro:** ~4.99% + $X por transacción
- **API (Checkout Transparente):** ~3.99% + $X por transacción
- **QR:** ~3.99% + $X por transacción
- Sin costos de setup
- Sin costos mensuales
- Acreditación: 14-21 días

**Links útiles:**
- SDK Node.js: https://github.com/mercadopago/sdk-nodejs
- Documentación: https://www.mercadopago.com.ar/developers/es/docs
- Sandbox: https://www.mercadopago.com.ar/developers/panel/credentials
- Status page: https://status.mercadopago.com/

**Tarjetas de prueba:**
- ✅ Aprobada: 5031 7557 3453 0604 (APRO)
- ❌ Rechazada: 5031 4332 1540 6351 (OTHE)
- ⏳ Pendiente: 5031 4332 1540 6351 (PEND)
- CVV: 123
- Fecha: Cualquier fecha futura

---

### 2. Stripe
**Proveedor:** Stripe Inc  
**Cobertura:** 46+ países (incluyendo Argentina desde 2021)

**Ventajas:**
- ✅ **Mejor documentación del mercado** - Ejemplos completos y actualizados
- ✅ **SDK muy maduro** - TypeScript first-class support
- ✅ **Dashboard excelente** - Testing, logs, analytics integrados
- ✅ **Webhooks robustos** - Retry automático, idempotencia built-in
- ✅ **Features avanzados:**
  - Subscripciones
  - Facturación automática
  - Fraud detection (Stripe Radar)
  - Payment Links
  - Checkout Sessions
- ✅ **Developer experience superior**
- ✅ **Escalabilidad** - Usado por Shopify, Slack, Amazon
- ✅ **Ecosystem rico** - Apps, plugins, integraciones

**Desventajas:**
- ⚠️ Menor adopción en Argentina (< 15%)
- ⚠️ Usuarios menos familiarizados
- ⚠️ Algunos métodos de pago locales no disponibles
- ⚠️ Puede requerir cuenta bancaria en USD
- ⚠️ Conversión de moneda con fee adicional

**Costos:**
- **Pagos:** ~2.9% + $0.30 USD por transacción
- Sin costos mensuales en plan base
- Features avanzados: requiere Stripe Billing
- Acreditación: 7 días
- Conversión ARS → USD: fee adicional

**Links útiles:**
- SDK Node.js: https://github.com/stripe/stripe-node
- Documentación: https://stripe.com/docs
- Sandbox: https://dashboard.stripe.com/test/dashboard
- Status page: https://status.stripe.com/

**Tarjetas de prueba:**
- ✅ Aprobada: 4242 4242 4242 4242
- ❌ Rechazada: 4000 0000 0000 0002
- ⏳ Requiere autenticación: 4000 0025 0000 3155
- CVV: Cualquier 3 dígitos
- Fecha: Cualquier fecha futura

---

## Matriz de Comparación

| Criterio | Mercado Pago | Stripe | Ganador |
|----------|--------------|--------|---------|
| **Adopción Argentina** | 🟢 80%+ | 🟡 15% | Mercado Pago |
| **UX Usuario Final** | 🟢 Excelente | 🟡 Bueno | Mercado Pago |
| **Developer Experience** | 🟡 Bueno | 🟢 Excelente | Stripe |
| **Documentación** | 🟡 Buena | 🟢 Excelente | Stripe |
| **SDK TypeScript** | 🟡 Funcional | 🟢 Maduro | Stripe |
| **Costos** | 🟡 3.99-4.99% | 🟢 2.9% + $0.30 | Stripe |
| **Métodos de pago locales** | 🟢 Completo | 🔴 Limitado | Mercado Pago |
| **QR nativo** | 🟢 Sí | 🔴 No | Mercado Pago |
| **Tiempo de acreditación** | 🔴 14-21 días | 🟢 7 días | Stripe |
| **Escalabilidad internacional** | 🔴 LATAM only | 🟢 Global | Stripe |
| **Dashboard** | 🟡 Funcional | 🟢 Excelente | Stripe |
| **Webhooks reliability** | 🟡 Bueno | 🟢 Excelente | Stripe |

---

## Recomendación Final

### Para MVP y mercado argentino: **Mercado Pago** 🏆

**Razones estratégicas:**

1. **Adopción del mercado (80%+)**
   - Usuarios ya tienen cuenta configurada
   - App instalada en mayoría de smartphones
   - Confianza establecida en el ecosistema

2. **Experiencia de usuario superior**
   - Checkout más rápido (1-click con wallet)
   - Métodos de pago familiares
   - QR code integrado nativamente

3. **Menor fricción en onboarding**
   - No requiere explicar nueva plataforma
   - Soporte en español
   - Menor tasa de abandonos en checkout

4. **Métodos de pago locales**
   - Mercado Crédito (financiación)
   - Cuotas sin interés
   - Efectivo en puntos de pago

5. **Integración con QR**
   - El proyecto ya contempla flujo QR
   - Mercado Pago QR es estándar de facto
   - Experiencia seamless para cliente

### Para escalabilidad internacional: **Stripe como fallback** 🌎

**Estrategia recomendada:**

#### Fase 1 (M5 Actual): Mercado Pago
- Implementar como pasarela principal
- Cubrir 90% de casos de uso en Argentina
- Validar modelo de negocio

#### Fase 2 (Futuro - M15): Agregar Stripe
- Habilitar para clientes internacionales
- Fallback si Mercado Pago falla
- Prepara expansión regional

#### Arquitectura: Patrón Strategy
```typescript
interface PaymentProvider {
  createPayment(...): Promise<Payment>
  // Interface común para ambas pasarelas
}

class MercadoPagoProvider implements PaymentProvider { }
class StripeProvider implements PaymentProvider { }

// Selección dinámica basada en región/config
const provider = selectProvider(region)
```

---

## Plan de Implementación Recomendado

### Milestone 5 (Ahora): Mercado Pago
- **Tiempo:** 3-4 días
- **Prioridad:** ALTA
- **Cobertura:** Argentina 100%

**Tareas:**
1. Integrar SDK Mercado Pago
2. Implementar Checkout Pro
3. Configurar webhooks
4. Testing completo
5. Documentación

### Milestone 15 (Futuro): Stripe
- **Tiempo:** 2-3 días
- **Prioridad:** BAJA
- **Cobertura:** Internacional

**Tareas:**
1. Abstraer PaymentService
2. Implementar Stripe adapter
3. Selector de pasarela por región
4. Testing multi-provider
5. Documentación

---

## Riesgos y Mitigaciones

### Riesgo 1: Webhooks de Mercado Pago con delay
**Probabilidad:** Media  
**Impacto:** Medio  
**Mitigación:**
- Implementar polling de fallback
- Retry logic en procesamiento
- Timeout configurable

### Riesgo 2: Cambios en fees de Mercado Pago
**Probabilidad:** Baja  
**Impacto:** Medio  
**Mitigación:**
- Abstracción de provider preparada
- Stripe como plan B
- Monitorear costos en analytics

### Riesgo 3: Downtime de Mercado Pago
**Probabilidad:** Muy baja  
**Impacto:** Alto  
**Mitigación:**
- Modo degradado: manual payment entry
- Status page monitoring
- Alertas automáticas

---

## Conclusión

**Decisión: Implementar Mercado Pago en M5** ✅

**Justificación:**
- Mejor fit para mercado objetivo
- Mayor probabilidad de conversión
- Menor fricción de usuario
- QR nativo integrado

**Roadmap:**
- **M5:** Mercado Pago (principal)
- **M15:** Stripe (internacional/fallback)
- **M16:** Multi-provider abstraction

---

**Fecha de revisión sugerida:** Enero 2026 (post-lanzamiento)  
**Criterio de cambio:** Si adopción internacional > 30%

**Elaborado por:** Backend Architect  
**Revisado por:** Product Owner  
**Aprobado para implementación:** ✅ Proceder con Fase 2
