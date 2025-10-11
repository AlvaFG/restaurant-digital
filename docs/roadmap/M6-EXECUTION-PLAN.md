# 🚀 M6 - QR Ordering System: Plan de Ejecución Completo

**Fecha de Inicio**: 2025-10-11  
**Fecha Objetivo**: 2025-11-15 (35 días)  
**Branch**: `feature/qr-ordering-system`  
**Responsable**: AlvaFG  
**Estado Actual**: 15% completado (Épica 2.3 ✅)

---

## 📊 Estado Actual del M6

### ✅ Completado (15%)
- ✅ **Épica 2.3**: Item Customization & Modifiers (100%)
  - Sistema completo de modificadores
  - 31 tests unitarios + 4 tests API
  - Documentación (850+ líneas)
  - Performance optimization (dynamic import)

### ⚠️ Parcialmente Completado (10%)
- ⚠️ **Épica 1.2**: Session Management (50%)
  - ✅ `use-qr-session.ts` hook implementado
  - ❌ Backend session store faltante
  - ❌ API de validación faltante

- ⚠️ **Épica 2.1**: Mobile Menu Layout (50%)
  - ✅ Página QR básica implementada
  - ❌ Tabs de categorías faltantes
  - ❌ Virtual scrolling faltante
  - ❌ Búsqueda faltante

- ⚠️ **Épica 2.2**: Shopping Cart (100%)
  - ✅ `use-qr-cart.ts` implementado completo
  - ✅ Persistencia localStorage
  - ✅ CustomizationId support

### ❌ Pendiente (75%)
- ❌ Épica 1.1, 1.3: QR Generation + Admin UI
- ❌ Épica 2.4: Performance final
- ❌ Épica 3: Checkout completo
- ❌ Épica 4: Payment (opcional)
- ❌ Épica 5: Admin & Analytics
- ❌ Épica 6: Testing & QA

---

## 🎯 Plan de Ejecución - 5 Semanas

### **SEMANA 1: Completar Infrastructure (Épica 1)**
**Objetivo**: Sistema QR funcional end-to-end  
**Días**: 5 días laborables  
**Prioridad**: 🔴 CRÍTICA

#### **Día 1-2: QR Generation System**
```typescript
// FASE 4.1: Backend QR Generation
Archivos a crear:
- lib/server/qr-service.ts (generación QR)
- lib/server/qr-types.ts (tipos)
- app/api/qr/generate/route.ts (API endpoint)
- lib/server/__tests__/qr-service.test.ts (tests)

Tareas:
[ ] Instalar dependencia: npm install qrcode
[ ] Crear QR service con JWT tokens
[ ] Implementar generación de QR codes (base64 + URL)
[ ] Agregar campos qrToken y qrTokenExpiry a Table
[ ] API POST /api/qr/generate { tableId } → { qrCode, url, token, expiresAt }
[ ] Tests: generación válida, expiración, tokens inválidos

Entregables:
✅ QR codes generables por mesa
✅ Tokens JWT seguros (24h expiry)
✅ 5 tests unitarios pasando

Validación:
- curl POST http://localhost:3000/api/qr/generate -d '{"tableId":"1"}'
- Verificar response con qrCode base64
```

#### **Día 2-3: Session Management Backend**
```typescript
// FASE 4.2: Backend Session Store
Archivos a crear:
- lib/server/session-store.ts (store en memoria)
- lib/server/session-manager.ts (lógica de negocio)
- lib/server/session-types.ts (tipos)
- app/api/qr/validate/route.ts (API validación)
- lib/server/__tests__/session-manager.test.ts

Tareas:
[ ] Implementar SessionStore (Map-based con TTL)
[ ] createGuestSession(tableId) → sessionId
[ ] getSession(sessionId) → session data
[ ] extendSession(sessionId) → refresh TTL
[ ] invalidateSession(sessionId) → cleanup
[ ] Cleanup automático de sesiones expiradas (setInterval)
[ ] API POST /api/qr/validate { token } → { valid, tableId, sessionId, table }
[ ] Rate limiting: 10 req/min por IP
[ ] Tests: crear, recuperar, expirar, limpiar

Entregables:
✅ Session store funcional
✅ TTL 2 horas con auto-renovación
✅ API de validación
✅ 8 tests pasando

Validación:
- curl POST http://localhost:3000/api/qr/validate -d '{"token":"eyJ..."}'
- Verificar sessionId en response
```

#### **Día 4-5: QR Management UI (Admin)**
```typescript
// FASE 4.3: Admin UI para QR
Archivos a crear:
- components/generate-qr-modal.tsx
- components/qr-print-template.tsx
- app/mesas/_components/qr-actions.tsx

Tareas:
[ ] Botón "Generar QR" en cada mesa (/mesas)
[ ] Modal GenerateQRModal:
  - Preview del QR code
  - Botón "Descargar PNG"
  - Botón "Descargar PDF"
  - Copiar URL al clipboard
  - Botón "Imprimir"
[ ] Batch generation: "Generar todos los QRs"
[ ] Print template con:
  - Logo del restaurante
  - Número de mesa grande
  - QR code centrado
  - Instrucciones de uso
  - URL de respaldo
[ ] Integrar con TableList component

Entregables:
✅ UI funcional en /mesas
✅ Descarga PNG/PDF funciona
✅ Impresión optimizada
✅ Batch generation operativo

Validación:
- Abrir /mesas
- Click "Generar QR" en mesa 1
- Descargar y verificar PNG
- Imprimir y verificar calidad
```

**🎯 Milestone Semana 1**: QR Infrastructure completa al 100%

---

### **SEMANA 2: Completar Mobile Menu (Épica 2.1 + 2.4)**
**Objetivo**: Menu mobile optimizado y performante  
**Días**: 5 días laborables  
**Prioridad**: 🔴 CRÍTICA

#### **Día 6-7: Mobile Menu Layout**
```typescript
// FASE 5.1: Optimizar Menu Mobile
Archivos a modificar:
- app/(public)/qr/[tableId]/page.tsx (refactor)
- app/(public)/qr/_components/qr-menu-header.tsx (nuevo)
- app/(public)/qr/_components/qr-category-tabs.tsx (nuevo)
- app/(public)/qr/_components/qr-search-bar.tsx (nuevo)

Tareas:
[ ] Header sticky mobile:
  - Logo/nombre del restaurante
  - Número de mesa
  - Badge de carrito con contador
  - Botón menú (hamburger)
[ ] Tabs de categorías horizontales:
  - Scroll horizontal con snap
  - Active state visual claro
  - Touch-friendly (min 44px height)
  - Sticky position
[ ] Barra de búsqueda:
  - Filtrado en tiempo real
  - Debounce 300ms
  - Highlights de resultados
  - Empty state amigable
[ ] Optimizar MenuItemCard:
  - Lazy loading de imágenes
  - Skeleton loading states
  - Touch feedback
  - Badges visuales (Popular, Agotado)
[ ] Virtual scrolling con react-window
[ ] Iconos de alérgenos más visuales

Entregables:
✅ Menu mobile-first optimizado
✅ Categorías tabs funcionales
✅ Búsqueda en tiempo real
✅ Performance mejorado

Validación:
- Abrir /qr/1 en mobile
- Scroll debe ser fluido (60fps)
- Búsqueda instantánea
- Tabs responsive
```

#### **Día 8: Performance Optimization**
```typescript
// FASE 5.2: Performance Final
Archivos a crear/modificar:
- public/sw.js (service worker)
- next.config.mjs (optimizaciones)
- app/(public)/qr/_components/* (lazy loading)

Tareas:
[ ] Service Worker para offline:
  - Cache de assets estáticos
  - Cache de imágenes del menu
  - Stale-while-revalidate strategy
  - Offline fallback page
[ ] Image optimization:
  - Convertir a WebP con fallback
  - Blur placeholders
  - Lazy loading agresivo
  - Responsive images (srcset)
[ ] Code splitting avanzado:
  - Dynamic imports para modales
  - Route-based splitting
  - Prefetch crítico solamente
[ ] Bundle optimization:
  - Tree shaking verificado
  - Analizar con @next/bundle-analyzer
  - Eliminar dependencies innecesarias
[ ] Compression:
  - Gzip/Brotli habilitado
  - Minificación agresiva

Entregables:
✅ Service Worker funcional
✅ First Load JS <200KB
✅ LCP <2.5s en 3G
✅ Lighthouse score >90

Validación:
- npm run build && npm run analyze
- Lighthouse audit en mobile
- Verificar offline mode funciona
```

#### **Día 9-10: Polish & Refinement**
```typescript
// FASE 5.3: UX Refinements
Tareas:
[ ] Loading states consistentes
[ ] Error boundaries en todos los componentes
[ ] Toast notifications user-friendly
[ ] Animaciones micro-interactions:
  - Agregar al carrito (bounce)
  - Tab change (slide)
  - Item expand (fade)
[ ] Accessibility:
  - ARIA labels correctos
  - Keyboard navigation
  - Screen reader support
  - Contrast ratio >4.5:1
[ ] Empty states:
  - Carrito vacío con CTA
  - Sin resultados de búsqueda
  - Menu no disponible
[ ] Testing manual en devices:
  - iPhone (Safari)
  - Android (Chrome)
  - Tablet (iPad)

Entregables:
✅ UX pulida y consistente
✅ A11y compliant
✅ Tested en 3+ devices

Validación:
- Testing con usuarios reales
- Feedback de UX positivo
```

**🎯 Milestone Semana 2**: Mobile Menu completo al 100%

---

### **SEMANA 3: Checkout & Order Flow (Épica 3)**
**Objetivo**: Flujo completo de pedido funcional  
**Días**: 5 días laborables  
**Prioridad**: 🔴 CRÍTICA

#### **Día 11-12: Checkout Form**
```typescript
// FASE 6.1: Checkout UI
Archivos a crear:
- app/(public)/qr/[tableId]/checkout/page.tsx
- app/(public)/qr/_components/checkout-form.tsx
- app/(public)/qr/_components/tip-selector.tsx
- app/(public)/qr/_components/order-summary.tsx
- app/(public)/qr/_hooks/use-checkout.ts

Tareas:
[ ] Página /qr/[tableId]/checkout
[ ] Formulario minimal:
  - Nombre (opcional)
  - Número de mesa (pre-filled, readonly)
  - Notas adicionales para el pedido (textarea)
[ ] Selector de propina:
  - Botones: 10%, 15%, 20%
  - Input custom
  - Opción "Sin propina"
[ ] Order Summary component:
  - Lista de items con modifiers
  - Subtotal
  - Propina
  - Total destacado
[ ] Opciones de pago:
  - Radio buttons: "Pagar en mesa" (default), "Pagar ahora"
[ ] Validaciones:
  - Carrito no vacío
  - Mesa válida
  - Items disponibles en stock (revalidación)
[ ] Botón "Confirmar Pedido":
  - Loading state
  - Disable on submit
  - Error handling

Entregables:
✅ Checkout form funcional
✅ Cálculos correctos
✅ UX clara y simple

Validación:
- Agregar items al carrito
- Ir a checkout
- Seleccionar propina
- Ver totales correctos
```

#### **Día 12-13: Order Submission API**
```typescript
// FASE 6.2: Backend Order Creation
Archivos a crear:
- app/api/qr/order/route.ts
- lib/server/qr-order-service.ts
- app/api/__tests__/qr-order.test.ts

Tareas:
[ ] API POST /api/qr/order:
  - Request: { sessionId, tableId, items, tip?, notes?, paymentMethod }
  - Validaciones:
    - Sesión válida y no expirada
    - Mesa existe y disponible
    - Items existen en menu
    - Stock disponible
  - Crear orden en OrderStore
  - Actualizar estado de mesa → "pedido_en_curso"
  - Generar orderNumber único
  - Calcular estimatedTime (15-30 min)
  - Emitir WebSocket event: "order:created"
  - Response: { orderId, orderNumber, estimatedTime }
[ ] QrOrderService:
  - validateQrOrder(sessionId, items)
  - createQrOrder(data)
  - notifyStaff(orderId)
[ ] Tests API:
  - Crea orden correctamente
  - Valida sesión
  - Valida stock
  - Rechaza items no disponibles
  - Calcula totales con propina
  - Actualiza mesa
  - Emite WebSocket

Entregables:
✅ API funcional
✅ Validaciones robustas
✅ WebSocket notifications
✅ 6 tests pasando

Validación:
- curl POST /api/qr/order con payload válido
- Verificar orden en DB
- Verificar mesa actualizada
- Verificar WebSocket event
```

#### **Día 13-14: Order Confirmation & Tracking**
```typescript
// FASE 6.3: Confirmation & Real-time
Archivos a crear:
- app/(public)/qr/[tableId]/confirmed/page.tsx
- app/(public)/qr/[tableId]/tracking/[orderId]/page.tsx
- app/(public)/qr/_components/order-timeline.tsx
- app/(public)/qr/_hooks/use-order-tracking.ts

Tareas:
[ ] Página de confirmación:
  - Número de pedido GRANDE
  - Checkmark animado
  - Tiempo estimado
  - Resumen del pedido
  - Botones:
    - "Ver estado" → /tracking/[orderId]
    - "Hacer otro pedido" → back to menu
  - Mensaje de agradecimiento
[ ] Página de tracking:
  - Timeline visual de estados:
    ✅ Pedido recibido
    🍳 En preparación
    ✨ Listo para servir
    🎉 Servido
  - Current state highlighted
  - Tiempo estimado restante
  - Lista de items
  - Botón "Llamar mesero" (crea alerta)
[ ] Real-time updates:
  - WebSocket connection
  - Subscribe a "order:updated"
  - Auto-update timeline
  - Fallback: polling cada 30s
[ ] Notifications:
  - Toast cuando estado cambia
  - "Tu pedido está listo!"
  - Sonido opcional

Entregables:
✅ Confirmación visual clara
✅ Tracking en tiempo real
✅ Timeline UX excelente

Validación:
- Confirmar pedido
- Ver confirmación
- Ir a tracking
- Cambiar estado desde admin
- Verificar update en tiempo real
```

#### **Día 15: Testing & Fixes**
```typescript
// FASE 6.4: Integration Testing
Tareas:
[ ] E2E test del flujo completo:
  - Scan QR → Menu → Add items → Checkout → Confirm → Track
[ ] Validar edge cases:
  - Items agotados durante checkout
  - Sesión expira durante pedido
  - Conexión perdida durante submit
  - Multiple orders misma mesa
[ ] Performance test:
  - 10 pedidos simultáneos
  - 100 items en menu
  - Conexión 3G
[ ] Fixes de bugs encontrados

Entregables:
✅ Flujo completo funcional
✅ Edge cases manejados
✅ Bugs críticos resueltos

Validación:
- Testing manual completo
- No errores en consola
- Performance aceptable
```

**🎯 Milestone Semana 3**: Checkout Flow completo al 100%

---

### **SEMANA 4: Payment, Admin & Analytics (Épicas 4+5)**
**Objetivo**: Features avanzadas y management  
**Días**: 5 días laborables  
**Prioridad**: 🟡 MEDIA (Épica 4 opcional)

#### **Día 16-17: QR Payment Integration** *(OPCIONAL)*
```typescript
// FASE 7.1: Payment Flow (si se requiere)
Archivos a crear:
- app/api/qr/payment/create/route.ts
- app/(public)/qr/[tableId]/payment/success/page.tsx
- app/(public)/qr/[tableId]/payment/failure/page.tsx

Tareas:
[ ] Reutilizar componentes de M5:
  - PaymentModal
  - CheckoutButton
  - Payment hooks
[ ] Adaptar para QR (sin login):
  - Email opcional del cliente
  - Redirect URLs específicas
  - Session-based payment
[ ] API POST /api/qr/payment/create:
  - Request: { orderId, sessionId, customerEmail? }
  - Crear payment en MercadoPago
  - Response: { checkoutUrl, paymentId }
[ ] Success/failure pages
[ ] Actualizar orden con payment status
[ ] WebSocket: "payment:completed"

Entregables:
✅ Pago online desde QR funcional
✅ Redirect correcto
✅ Orden marcada como pagada

⚠️ SKIP SI NO ES PRIORIDAD - Ir directo a Épica 5
```

#### **Día 17-18: Split Bill** *(OPCIONAL)*
```typescript
// FASE 7.2: Split Bill (si se requiere)
Archivos:
- app/(public)/qr/_components/split-bill-modal.tsx
- app/(public)/qr/_hooks/use-split-bill.ts

Tareas:
[ ] Modal "Dividir cuenta"
[ ] Opciones:
  - Por número de personas (equitativo)
  - Por items (seleccionar items)
  - Custom (monto manual)
[ ] Cálculo automático con propina
[ ] Múltiples checkouts
[ ] Tracking de pagos parciales

Entregables:
✅ Split bill funcional

⚠️ SKIP SI NO ES PRIORIDAD
```

#### **Día 18-19: QR Orders Dashboard**
```typescript
// FASE 8.1: Admin Dashboard
Archivos a modificar:
- app/pedidos/page.tsx
- components/orders-panel.tsx (agregar filtros)

Archivos a crear:
- app/pedidos/_components/qr-orders-tab.tsx
- app/pedidos/_components/qr-order-badge.tsx

Tareas:
[ ] Tab "Pedidos QR" en /pedidos
[ ] Badge "QR" visual en cada pedido QR
[ ] Filtros adicionales:
  - Solo pedidos QR
  - Por mesa
  - Por sesión
  - Por método de pago
[ ] Indicador de guest user
[ ] Quick actions:
  - Cambiar estado
  - Ver detalles de sesión
  - Contactar cliente (si dejó email)
[ ] Estadísticas inline:
  - Total QR del día
  - Ticket promedio QR
  - Tiempo promedio

Entregables:
✅ Dashboard funcional
✅ Filtros operativos
✅ Stats visibles

Validación:
- Crear pedido QR
- Ir a /pedidos
- Ver tab QR
- Verificar badge
- Filtrar solo QR
```

#### **Día 19-20: QR Analytics**
```typescript
// FASE 8.2: Analytics específicos QR
Archivos a crear:
- app/analitica/qr/page.tsx
- lib/server/qr-analytics.ts
- app/api/analytics/qr/route.ts

Tareas:
[ ] Métricas QR:
  - Total scans por día/semana/mes
  - Tasa de conversión (scan → orden)
  - Tiempo promedio en menu
  - Items más ordenados vía QR
  - Horarios pico de uso QR
  - Comparativa QR vs tradicional
  - Ticket promedio por canal
  - Abandono de carrito
[ ] Dashboard visual:
  - Gráfico de scans (línea)
  - Funnel de conversión
  - Top items QR (bar chart)
  - Heatmap por horario
  - Tabla de mesas más activas
[ ] Filtros:
  - Rango de fechas
  - Por mesa
  - Por categoría
[ ] Export a CSV

Entregables:
✅ Analytics completo
✅ Visualizaciones claras
✅ Export funcional

Validación:
- Generar datos de prueba
- Abrir /analitica/qr
- Verificar métricas correctas
- Export CSV
```

**🎯 Milestone Semana 4**: Features avanzadas completas

---

### **SEMANA 5: Testing, QA & Go-Live (Épica 6)**
**Objetivo**: Asegurar calidad y lanzar  
**Días**: 5 días laborables  
**Prioridad**: 🔴 CRÍTICA

#### **Día 21-22: Unit & Integration Tests**
```typescript
// FASE 9.1: Tests comprehensivos
Tareas:
[ ] QR Service tests (target 90%):
  - generateQR()
  - validateQRToken()
  - refreshQRToken()
[ ] Session Manager tests (target 95%):
  - createGuestSession()
  - extendSession()
  - cleanup()
[ ] Checkout flow tests:
  - use-checkout hook
  - Tip calculations
  - Order submission
[ ] API tests:
  - /api/qr/generate
  - /api/qr/validate
  - /api/qr/order
  - /api/analytics/qr
[ ] Component tests críticos:
  - QrMenuItemCard
  - CheckoutForm
  - OrderTimeline
[ ] Verificar coverage:
  - npm run test:coverage
  - Target: >85% coverage total

Entregables:
✅ >85% test coverage
✅ Todos los tests pasando
✅ 0 flaky tests

Validación:
- npm test
- Verificar report de coverage
- Todos los suites green
```

#### **Día 23: E2E Testing**
```typescript
// FASE 9.2: End-to-End Testing
Tareas:
[ ] Setup Playwright/Cypress
[ ] E2E test scenarios:
  1. Happy path completo:
     - Scan QR
     - Browse menu
     - Add items con customization
     - Checkout con propina
     - Confirm order
     - Track order
  2. Error scenarios:
     - QR expirado
     - Sesión inválida
     - Item agotado durante checkout
     - Network error durante submit
  3. Edge cases:
     - Multiple tabs misma mesa
     - Back button durante checkout
     - Refresh durante tracking
[ ] Performance testing:
  - Lighthouse CI setup
  - Métricas: LCP <2.5s, FID <100ms, CLS <0.1
  - Test en 3G throttling
[ ] Device testing:
  - iPhone 12/13 (Safari)
  - Samsung Galaxy (Chrome)
  - iPad (Safari)
  - Tablet Android

Entregables:
✅ E2E suite completo
✅ Performance benchmarks
✅ Device compatibility verified

Validación:
- npx playwright test
- Lighthouse score >90
- Tests en devices reales
```

#### **Día 24: User Acceptance Testing**
```typescript
// FASE 9.3: UAT & Beta Testing
Tareas:
[ ] Setup beta testing:
  - Imprimir 2-3 QRs de prueba
  - Configurar 1-2 mesas de test
  - Briefing al staff
[ ] Invitar beta testers:
  - 5-10 personas (staff + amigos)
  - Dar instrucciones claras
  - Preparar formulario de feedback
[ ] Scenarios de test:
  - Ordenar plato simple
  - Ordenar con customization
  - Agregar propina
  - Hacer pedido completo
  - Tracking en tiempo real
[ ] Recopilar feedback:
  - Usabilidad (1-5)
  - Claridad del flujo
  - Performance percibida
  - Bugs encontrados
  - Mejoras sugeridas
[ ] Análisis y priorización:
  - Bugs críticos → fix inmediato
  - Mejoras UX → evaluar
  - Nice-to-have → backlog

Entregables:
✅ Beta testing completado
✅ Feedback recopilado
✅ Bugs críticos resueltos

Validación:
- >80% feedback positivo
- 0 bugs bloqueantes
- UX score >4/5
```

#### **Día 25: Final Polish & Documentation**
```typescript
// FASE 9.4: Pre-Launch Checklist
Tareas:
[ ] Code cleanup:
  - Eliminar console.logs
  - Eliminar código comentado
  - Eliminar TODOs
  - Formatear código
  - ESLint 0 warnings
[ ] Documentation:
  - README actualizado
  - API documentation completa
  - User guide para staff
  - Troubleshooting guide
  - Video tutorial (opcional)
[ ] Security audit:
  - Revisar rate limiting
  - Validar JWT tokens
  - Verificar CORS
  - Input sanitization
  - SQL injection prevention
[ ] Performance final check:
  - npm run build
  - Analizar bundle size
  - Verificar no memory leaks
  - Load testing básico
[ ] Pre-launch checklist:
  - [ ] Tests passing ✅
  - [ ] Lighthouse >90 ✅
  - [ ] Security audit ✅
  - [ ] Documentation ✅
  - [ ] Staff training ✅
  - [ ] QRs impresos ✅
  - [ ] Backup plan ✅
  - [ ] Rollback plan ✅

Entregables:
✅ Código production-ready
✅ Documentation completa
✅ Pre-launch checklist completo

Validación:
- Review completo del código
- Checklist 100% completado
```

**🎯 Milestone Semana 5**: M6 completo y listo para producción!

---

## 📈 Tracking de Progreso

### Métricas Clave
```javascript
const m6Metrics = {
  // Development
  filesCreated: 0,      // Target: ~35 files
  filesModified: 0,     // Target: ~20 files
  linesOfCode: 0,       // Target: ~3500 LOC
  
  // Testing
  unitTests: 39,        // Actual (from Fase 3), Target: 80
  integrationTests: 4,  // Actual (from Fase 3), Target: 15
  e2eTests: 0,          // Target: 10
  testCoverage: 0,      // Target: 85%
  
  // Performance
  bundleSize: 254,      // Current KB, Target: <200KB
  lighthouseScore: 0,   // Target: >90
  loadTime3G: 0,        // Target: <2.5s
  
  // Features
  epicasCompleted: 1,   // (Épica 2.3), Target: 6
  tasksCompleted: 8,    // Target: 45
  progressPercent: 15,  // Target: 100%
}
```

### Dashboard de Progreso
```
M6 - QR ORDERING SYSTEM
═══════════════════════════════════════════════════════

ÉPICAS COMPLETADAS: 1/6 (17%)
████░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░

ÉPICA 1: QR Infrastructure        ░░░░░░░░░░   0% ❌
ÉPICA 2: Mobile Menu Experience   ████████░░  75% ⚠️
ÉPICA 3: Checkout & Order Flow    ░░░░░░░░░░   0% ❌
ÉPICA 4: Payment Integration      ░░░░░░░░░░   0% ❌ (opcional)
ÉPICA 5: Admin & Analytics        ░░░░░░░░░░   0% ❌
ÉPICA 6: Testing & QA             ███░░░░░░░  30% ⚠️

TESTS: 43/105 passing (41%)
COVERAGE: 45% (target: 85%)
LIGHTHOUSE: 0 (target: 90+)

TIEMPO RESTANTE: 20 días laborables
BURN RATE: ⚠️ Debe completar 1 épica cada 3 días
```

---

## 🚨 Riesgos y Mitigaciones

### Riesgos Críticos
| # | Riesgo | Probabilidad | Impacto | Mitigación | Owner |
|---|--------|--------------|---------|------------|-------|
| 1 | UX mobile confusa | 🟡 Media | 🔴 Alto | UAT temprano día 24, iteraciones rápidas | Dev |
| 2 | Performance <90 Lighthouse | 🟡 Media | 🔴 Alto | Optimización continua semana 2, no dejar para el final | Dev |
| 3 | Session management bugs | 🟢 Baja | 🔴 Alto | Tests robustos, timeout generoso (2h), logs extensivos | Dev |
| 4 | QR codes no escanean | 🟢 Baja | 🔴 Alto | Test con múltiples devices, tamaño adecuado (300x300px min) | QA |
| 5 | Scope creep (features extra) | 🔴 Alta | 🟡 Medio | Seguir plan estrictamente, parking lot para ideas | PM |
| 6 | Bugs en producción | 🟡 Media | 🟡 Medio | Testing exhaustivo semana 5, rollback plan, feature flags | Ops |

### Plan de Contingencia
```javascript
const contingencyPlan = {
  ifBehindSchedule: [
    "Mover Épica 4 (Payment) a M7",
    "Reducir Épica 5 (Analytics) a versión minimal",
    "Posponer features nice-to-have"
  ],
  ifBlockingBug: [
    "Crear hotfix branch",
    "Fix y deploy en <4 horas",
    "Comunicar a stakeholders",
    "Post-mortem"
  ],
  ifPerformanceIssues: [
    "Code splitting agresivo",
    "Lazy loading más features",
    "Reducir bundle dependencies",
    "CDN para assets pesados"
  ]
}
```

---

## ✅ Definition of Done - M6

El M6 está **DONE** cuando:

### Funcionalidad
- ✅ Cliente puede escanear QR y acceder al menu
- ✅ Cliente puede agregar items con customization
- ✅ Cliente puede completar checkout
- ✅ Cliente puede pagar (en mesa o online)
- ✅ Cliente puede trackear su pedido en tiempo real
- ✅ Staff recibe pedidos QR en tiempo real
- ✅ Staff puede generar/gestionar QR codes
- ✅ Admin puede ver analytics de QR

### Calidad
- ✅ >85% test coverage
- ✅ 0 bugs críticos
- ✅ <3 bugs menores
- ✅ Lighthouse mobile >90
- ✅ WCAG AA compliant
- ✅ Performance: LCP <2.5s en 3G

### Documentación
- ✅ README actualizado
- ✅ API docs completos
- ✅ User guide para staff
- ✅ Video tutorial
- ✅ Troubleshooting guide

### Deployment
- ✅ Branch merged a main
- ✅ CI/CD passing
- ✅ Feature flags configurados
- ✅ Monitoring configurado
- ✅ Rollback plan documentado

### Training
- ✅ Staff capacitado (>90% asistencia)
- ✅ User manual distribuido
- ✅ Support channel establecido
- ✅ FAQs creadas

---

## 🎉 Go-Live Plan

### Pre-Launch (Día 24-25)
```bash
# 1. Final testing
npm run test
npm run test:e2e
npm run build

# 2. Generate QR codes
- Imprimir QRs de todas las mesas
- Laminar y colocar en mesas

# 3. Staff training
- Briefing de 30 minutos
- Demo en vivo
- Q&A session

# 4. Monitoring setup
- Setup error tracking (Sentry)
- Setup analytics (GA4)
- Setup uptime monitoring
```

### Launch Day (Día 26)
```bash
# Soft Launch (Mesa 1-3 solamente)
08:00 - Colocar QRs en mesas piloto
09:00 - Monitorear primera orden
10:00 - Evaluar feedback inicial
12:00 - Ajustar si necesario

# Full Launch (Todas las mesas)
14:00 - Colocar todos los QRs
15:00 - Monitoreo activo
18:00 - Review de métricas
20:00 - Celebrar 🎉
```

### Post-Launch (Día 27-30)
```bash
# Week 1 Monitoring
- Metrics diarias
- Recopilar feedback
- Hotfixes si necesario
- Iterar mejoras

# Week 2-4
- Feature refinement
- Performance optimization
- Documentation updates
```

---

## 📞 Contacto y Recursos

**Project Lead**: AlvaFG  
**Repository**: [restaurant-digital](https://github.com/AlvaFG/restaurant-digital)  
**Branch**: `feature/qr-ordering-system`  
**Slack Channel**: #m6-qr-ordering (si existe)  
**Documentation**: `/docs/roadmap/`  

**Daily Standup**: 10:00 AM (opcional si es solo dev)  
**Weekly Review**: Viernes 16:00  

---

## 📚 Referencias y Recursos

### Librerías a Instalar
```bash
npm install qrcode                    # QR generation
npm install jsonwebtoken              # JWT tokens
npm install @types/jsonwebtoken --save-dev
npm install react-window              # Virtual scrolling
npm install @next/bundle-analyzer --save-dev
npm install playwright --save-dev     # E2E testing
```

### Documentation Links
- [QRCode.js Docs](https://github.com/soldair/node-qrcode)
- [JWT Best Practices](https://auth0.com/blog/a-look-at-the-latest-draft-for-jwt-bcp/)
- [Next.js Performance](https://nextjs.org/docs/advanced-features/measuring-performance)
- [Lighthouse CI](https://github.com/GoogleChrome/lighthouse-ci)
- [React Window](https://github.com/bvaughn/react-window)

### Inspiración UX
- [Uber Eats Mobile](https://ubereats.com) - Menu layout
- [DoorDash](https://doordash.com) - Checkout flow
- [Square Order](https://squareup.com/us/en/point-of-sale/order) - QR ordering

---

## 🔄 Actualización del Plan

Este plan se actualizará:
- ✏️ Diariamente: Progreso de tareas
- 📊 Semanalmente: Métricas y riesgos
- 🎯 Al completar épica: Retrospectiva

**Última actualización**: 2025-10-11  
**Próxima revisión**: 2025-10-18 (fin Semana 1)  
**Versión del plan**: 1.0.0

---

**¿Listo para comenzar? ¡Vamos con la FASE 4.1! 🚀**
