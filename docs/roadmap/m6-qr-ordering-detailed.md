# M6 - QR Ordering System
## Roadmap Detallado y Tareas

**Versión**: 1.0.0  
**Fecha Inicio**: 2025-10-11  
**Fecha Estimada**: 2025-11-15  
**Branch**: `feature/qr-ordering`  
**Prioridad**: 🔴 Alta

---

## 📋 Índice

1. [Resumen Ejecutivo](#resumen-ejecutivo)
2. [Arquitectura del Sistema](#arquitectura-del-sistema)
3. [Épicas y Tareas](#épicas-y-tareas)
4. [Cronograma](#cronograma)
5. [Criterios de Aceptación](#criterios-de-aceptación)
6. [Riesgos y Mitigaciones](#riesgos-y-mitigaciones)

---

## 🎯 Resumen Ejecutivo

### Objetivo
Permitir que los clientes escaneen un código QR en su mesa y realicen pedidos directamente desde su dispositivo móvil sin necesidad de registrarse, mejorando la experiencia del cliente y reduciendo tiempos de atención.

### Beneficios Clave
- ⚡ **Reducción de tiempos**: -40% tiempo de toma de pedidos
- 📱 **Experiencia mejorada**: Self-service mobile-first
- 💰 **Más ventas**: Upselling automatizado
- 👥 **Staff liberado**: Más tiempo para atención personalizada
- 📊 **Data valiosa**: Analytics de comportamiento de clientes

### Métricas de Éxito
- Tiempo de orden: <2 minutos desde QR scan hasta confirmación
- Tasa de completitud: >85% de carritos completados
- Performance: <2s carga inicial en 3G
- Error rate: <1% en flujo completo

---

## 🏗️ Arquitectura del Sistema

### Flujo General

```
Cliente → Escanea QR → Valida Mesa → Ve Menú → Agrega Items → 
→ Revisa Carrito → Confirma Orden → Pago (opcional) → Confirmación → 
→ Tracking en Tiempo Real
```

### Componentes Principales

1. **QR Generator Service** - Generación y gestión de códigos QR
2. **Session Manager** - Gestión de sesiones temporales sin auth
3. **Mobile Menu View** - Vista optimizada del menú
4. **Cart Management** - Carrito de compras en localStorage
5. **Order Flow** - Proceso de checkout simplificado
6. **Real-time Updates** - WebSocket para estado de pedidos

---

## 📦 Épicas y Tareas

---

## **ÉPICA 1: QR Code Infrastructure**
**Duración**: 3 días  
**Prioridad**: 🔴 Crítica  
**Dependencias**: Ninguna

### Tareas

#### **1.1 - QR Code Generation System**
**Responsable**: Backend  
**Tiempo estimado**: 1 día

**Descripción**: Implementar sistema de generación de códigos QR únicos por mesa con validación de tiempo y seguridad.

**Subtareas**:
- [ ] Instalar librería `qrcode` o `qr-code-generator`
- [ ] Crear `/lib/server/qr-service.ts`
  - [ ] `generateQR(tableId, options)` - Generar QR code
  - [ ] `validateQRToken(token)` - Validar token del QR
  - [ ] `refreshQRToken(tableId)` - Regenerar token si expiró
  - [ ] `getQRMetadata(token)` - Obtener info de mesa desde token
- [ ] Implementar JWT para tokens QR
  - [ ] Payload: `{ tableId, sessionId, exp, iat }`
  - [ ] Expiración: 24 horas (renovable)
- [ ] Agregar campo `qrToken` y `qrTokenExpiry` a Table schema
- [ ] API endpoint: `POST /api/qr/generate`
  - Request: `{ tableId: string }`
  - Response: `{ qrCode: string (base64), url: string, token: string, expiresAt: Date }`

**Archivos**:
- `lib/server/qr-service.ts` (nuevo)
- `lib/server/qr-types.ts` (nuevo)
- `app/api/qr/generate/route.ts` (nuevo)
- `lib/server/table-store.ts` (modificar - agregar campos QR)

**Tests**:
- `lib/server/__tests__/qr-service.test.ts`
  - [ ] Genera QR válido con JWT
  - [ ] Valida token correcto
  - [ ] Rechaza token expirado
  - [ ] Rechaza token inválido
  - [ ] Maneja tableId inexistente

**Criterios de Aceptación**:
- ✅ Genera QR code con imagen base64
- ✅ Token JWT firmado y verificable
- ✅ Expira después de 24 horas
- ✅ Tests pasan (>90% coverage)

---

#### **1.2 - QR Validation & Session Management**
**Responsable**: Backend  
**Tiempo estimado**: 1.5 días

**Descripción**: Sistema de validación de QR y creación de sesiones temporales para clientes sin registro.

**Subtareas**:
- [ ] Crear `/lib/server/session-manager.ts`
  - [ ] `createGuestSession(tableId)` - Nueva sesión de invitado
  - [ ] `getSession(sessionId)` - Recuperar sesión
  - [ ] `extendSession(sessionId)` - Extender tiempo de sesión
  - [ ] `invalidateSession(sessionId)` - Cerrar sesión
  - [ ] `cleanupExpiredSessions()` - Limpieza automática
- [ ] Implementar store de sesiones en memoria (Redis-like)
  - [ ] TTL: 2 horas por sesión
  - [ ] Renovación automática con actividad
  - [ ] Máximo 5 sesiones por mesa simultáneas
- [ ] API endpoint: `POST /api/qr/validate`
  - Request: `{ token: string }`
  - Response: `{ valid: boolean, tableId: string, sessionId: string, tableData: Table }`
- [ ] Rate limiting por IP
  - [ ] Max 10 validaciones por minuto
  - [ ] Max 50 validaciones por hora

**Archivos**:
- `lib/server/session-manager.ts` (nuevo)
- `lib/server/session-types.ts` (nuevo)
- `lib/server/session-store.ts` (nuevo)
- `app/api/qr/validate/route.ts` (nuevo)
- `middleware.ts` (modificar - agregar rate limiting)

**Tests**:
- `lib/server/__tests__/session-manager.test.ts`
  - [ ] Crea sesión válida
  - [ ] Recupera sesión existente
  - [ ] Expira sesión después de TTL
  - [ ] Limita sesiones por mesa
  - [ ] Limpieza automática funciona

**Criterios de Aceptación**:
- ✅ Valida QR y crea sesión
- ✅ Sesión expira después de inactividad
- ✅ Rate limiting funciona
- ✅ Tests pasan

---

#### **1.3 - QR Management UI (Admin)**
**Responsable**: Frontend  
**Tiempo estimado**: 0.5 días

**Descripción**: Interfaz para que el staff genere, descargue e imprima códigos QR de mesas.

**Subtareas**:
- [ ] Agregar botón "Generar QR" en `/mesas`
- [ ] Modal `GenerateQRModal`
  - [ ] Preview del QR code
  - [ ] Botón "Descargar PNG"
  - [ ] Botón "Descargar PDF" (con info de mesa)
  - [ ] Botón "Imprimir"
  - [ ] URL pública del QR
- [ ] Batch generation: generar QRs de todas las mesas
- [ ] Template para impresión
  - [ ] Logo del restaurante
  - [ ] Número/nombre de mesa
  - [ ] QR code
  - [ ] Instrucciones breves

**Archivos**:
- `components/generate-qr-modal.tsx` (nuevo)
- `components/qr-print-template.tsx` (nuevo)
- `app/mesas/page.tsx` (modificar)

**Tests**:
- Manual testing de impresión
- Verificar descarga de imágenes

**Criterios de Aceptación**:
- ✅ Genera y muestra QR
- ✅ Descarga funciona (PNG y PDF)
- ✅ Impresión se ve bien
- ✅ Batch generation funciona

---

## **ÉPICA 2: Mobile Menu Experience**
**Duración**: 4 días  
**Prioridad**: 🔴 Crítica  
**Dependencias**: Épica 1 (QR validation)

### Tareas

#### **2.1 - Mobile Menu Layout & Navigation**
**Responsable**: Frontend  
**Tiempo estimado**: 1.5 días

**Descripción**: Vista mobile-first del menú optimizada para dispositivos táctiles y conexiones lentas.

**Subtareas**:
- [ ] Crear `/app/(public)/qr/[tableId]/page.tsx`
  - [ ] Layout mobile-first
  - [ ] Sin auth requerida
  - [ ] Validación de QR en carga inicial
- [ ] Header sticky
  - [ ] Logo/nombre del restaurante
  - [ ] Número de mesa
  - [ ] Botón de carrito con badge de cantidad
- [ ] Navegación de categorías
  - [ ] Tabs horizontales scrollables
  - [ ] Filtro rápido por disponibilidad
  - [ ] Búsqueda de items
- [ ] Lista de items
  - [ ] Cards compactas con imagen
  - [ ] Precio destacado
  - [ ] Badges: "Popular", "Nuevo", "Agotado"
  - [ ] Iconos de alérgenos
  - [ ] Virtual scrolling para performance
- [ ] Item detail modal
  - [ ] Imagen grande
  - [ ] Descripción completa
  - [ ] Modificadores (tamaño, extras)
  - [ ] Contador de cantidad
  - [ ] Botón "Agregar al carrito"

**Archivos**:
- `app/(public)/qr/[tableId]/page.tsx` (nuevo)
- `app/(public)/qr/[tableId]/layout.tsx` (nuevo)
- `app/(public)/qr/_components/mobile-menu-header.tsx` (nuevo)
- `app/(public)/qr/_components/menu-category-tabs.tsx` (nuevo)
- `app/(public)/qr/_components/menu-item-card.tsx` (nuevo)
- `app/(public)/qr/_components/item-detail-modal.tsx` (nuevo)
- `app/(public)/qr/_hooks/use-qr-session.ts` (nuevo)

**Tests**:
- `app/(public)/qr/__tests__/menu-page.test.tsx`
  - [ ] Renderiza correctamente
  - [ ] Filtra por categoría
  - [ ] Búsqueda funciona
  - [ ] Modal de detalle abre/cierra

**Criterios de Aceptación**:
- ✅ Carga en <2s en 3G
- ✅ Touch-friendly (botones >44px)
- ✅ Categorías scroll horizontal
- ✅ Items se ven bien en todos los tamaños
- ✅ Lighthouse mobile score >90

---

#### **2.2 - Shopping Cart Management**
**Responsable**: Frontend  
**Tiempo estimado**: 1 día

**Descripción**: Carrito de compras persistente en localStorage con gestión de items y cantidades.

**Subtareas**:
- [ ] Crear `/app/(public)/qr/_hooks/use-cart.ts`
  - [ ] `addItem(item, modifiers, quantity)`
  - [ ] `removeItem(itemId)`
  - [ ] `updateQuantity(itemId, quantity)`
  - [ ] `clearCart()`
  - [ ] `getTotal()`
  - [ ] Persistencia en localStorage
  - [ ] Sincronización entre tabs
- [ ] Cart sidebar/drawer
  - [ ] Lista de items agregados
  - [ ] Modificadores por item
  - [ ] Contador inline de cantidad
  - [ ] Subtotal por item
  - [ ] Total general
  - [ ] Botón "Vaciar carrito"
  - [ ] Botón "Confirmar pedido"
- [ ] Empty state
  - [ ] Ilustración
  - [ ] Mensaje motivacional
  - [ ] Botón "Ver menú"
- [ ] Validaciones
  - [ ] Items disponibles
  - [ ] Stock disponible
  - [ ] Cantidad mínima/máxima

**Archivos**:
- `app/(public)/qr/_hooks/use-cart.ts` (nuevo)
- `app/(public)/qr/_components/cart-drawer.tsx` (nuevo)
- `app/(public)/qr/_components/cart-item.tsx` (nuevo)
- `app/(public)/qr/_components/cart-summary.tsx` (nuevo)
- `app/(public)/qr/_types/cart.ts` (nuevo)

**Tests**:
- `app/(public)/qr/__tests__/use-cart.test.tsx`
  - [ ] Agrega items correctamente
  - [ ] Actualiza cantidades
  - [ ] Calcula total correcto
  - [ ] Persiste en localStorage
  - [ ] Limpia carrito

**Criterios de Aceptación**:
- ✅ Persiste entre recargas
- ✅ Sincroniza entre tabs
- ✅ Calcula totales correctamente
- ✅ Valida stock antes de agregar
- ✅ Tests pasan

---

#### **2.3 - Item Customization & Modifiers**
**Responsable**: Frontend  
**Tiempo estimado**: 1 día

**Descripción**: Sistema de personalización de items con modificadores, extras y notas especiales.

**Subtareas**:
- [ ] Modal de customización
  - [ ] Selección de tamaño (radio buttons)
  - [ ] Extras (checkboxes con precio)
  - [ ] Nivel de cocción (select)
  - [ ] Ingredientes a remover (chips)
  - [ ] Notas especiales (textarea)
  - [ ] Preview de precio total
- [ ] Validación de combinaciones
  - [ ] Modificadores requeridos
  - [ ] Máximo de extras
  - [ ] Restricciones de alergenos
- [ ] Presets comunes
  - [ ] "Sin cebolla"
  - [ ] "Extra queso"
  - [ ] "Término medio"

**Archivos**:
- `app/(public)/qr/_components/item-customization-modal.tsx` (nuevo)
- `app/(public)/qr/_components/modifier-group.tsx` (nuevo)
- `app/(public)/qr/_types/modifiers.ts` (nuevo)

**Tests**:
- Manual testing de combinaciones
- Validación de precios

**Criterios de Aceptación**:
- ✅ Modificadores funcionan
- ✅ Precio se actualiza dinámicamente
- ✅ Validaciones de alergenos
- ✅ Notas se guardan

---

#### **2.4 - Performance Optimization**
**Responsable**: Frontend  
**Tiempo estimado**: 0.5 días

**Descripción**: Optimizar carga y rendimiento para conexiones móviles lentas.

**Subtareas**:
- [ ] Implementar image optimization
  - [ ] Next/Image con placeholders
  - [ ] Lazy loading de imágenes
  - [ ] WebP con fallback
  - [ ] Blur placeholders
- [ ] Code splitting
  - [ ] Dynamic imports para modales
  - [ ] Lazy load de categorías
- [ ] Caching strategy
  - [ ] Service Worker para offline
  - [ ] Cache de imágenes
  - [ ] Stale-while-revalidate
- [ ] Bundle optimization
  - [ ] Tree shaking
  - [ ] Minificación
  - [ ] Compression

**Archivos**:
- `next.config.mjs` (modificar)
- `public/sw.js` (nuevo - service worker)

**Tests**:
- Lighthouse audit (target >90)
- Manual testing en 3G throttling

**Criterios de Aceptación**:
- ✅ First Load JS <200KB
- ✅ LCP <2.5s en 3G
- ✅ Lighthouse score >90
- ✅ Funciona offline (cache)

---

## **ÉPICA 3: Checkout & Order Flow**
**Duración**: 3 días  
**Prioridad**: 🔴 Crítica  
**Dependencias**: Épica 2

### Tareas

#### **3.1 - Checkout Form & Validation**
**Responsable**: Frontend  
**Tiempo estimado**: 1 día

**Descripción**: Formulario de checkout simplificado con validaciones y confirmación.

**Subtareas**:
- [ ] Crear `/app/(public)/qr/[tableId]/checkout/page.tsx`
- [ ] Formulario de contacto (opcional)
  - [ ] Nombre (opcional)
  - [ ] Número de mesa (prellenado)
  - [ ] Notas adicionales
- [ ] Resumen del pedido
  - [ ] Lista de items
  - [ ] Subtotal
  - [ ] Propina sugerida (10%, 15%, 20%, custom)
  - [ ] Total
- [ ] Opciones de pago
  - [ ] "Pagar ahora" (MercadoPago)
  - [ ] "Pagar en mesa" (default)
- [ ] Validaciones
  - [ ] Carrito no vacío
  - [ ] Mesa válida y disponible
  - [ ] Items disponibles en stock
- [ ] Confirmación
  - [ ] Modal de resumen
  - [ ] Botón "Confirmar pedido"
  - [ ] Loading state durante submit

**Archivos**:
- `app/(public)/qr/[tableId]/checkout/page.tsx` (nuevo)
- `app/(public)/qr/_components/checkout-form.tsx` (nuevo)
- `app/(public)/qr/_components/tip-selector.tsx` (nuevo)
- `app/(public)/qr/_components/order-summary.tsx` (nuevo)

**Tests**:
- `app/(public)/qr/__tests__/checkout.test.tsx`
  - [ ] Valida carrito vacío
  - [ ] Calcula propina correctamente
  - [ ] Submit exitoso

**Criterios de Aceptación**:
- ✅ Formulario simple y claro
- ✅ Cálculos correctos
- ✅ Validaciones funcionan
- ✅ UX fluida

---

#### **3.2 - Order Submission & Confirmation**
**Responsable**: Backend + Frontend  
**Tiempo estimado**: 1 día

**Descripción**: API y flujo de creación de pedidos desde QR con confirmación al cliente.

**Subtareas**:
- [ ] API endpoint: `POST /api/qr/order`
  - Request: `{ sessionId, tableId, items, tip?, notes?, paymentMethod }`
  - Response: `{ orderId, estimatedTime, orderNumber }`
  - Validaciones: stock, mesa disponible, sesión válida
  - Crear orden en OrderStore
  - Actualizar estado de mesa
  - Emitir evento WebSocket
- [ ] Página de confirmación
  - [ ] Número de pedido (grande)
  - [ ] Tiempo estimado
  - [ ] Resumen del pedido
  - [ ] Botón "Ver estado"
  - [ ] Mensaje de agradecimiento
- [ ] Notificación al staff
  - [ ] Notificación en tiempo real
  - [ ] Sonido de alerta
  - [ ] Badge en sidebar

**Archivos**:
- `app/api/qr/order/route.ts` (nuevo)
- `app/(public)/qr/[tableId]/confirmed/page.tsx` (nuevo)
- `lib/server/qr-order-service.ts` (nuevo)

**Tests**:
- `app/api/__tests__/qr-order.test.ts`
  - [ ] Crea orden correctamente
  - [ ] Valida stock
  - [ ] Rechaza sesión inválida
  - [ ] Actualiza mesa

**Criterios de Aceptación**:
- ✅ Orden se crea correctamente
- ✅ Staff recibe notificación
- ✅ Cliente ve confirmación
- ✅ Tests pasan

---

#### **3.3 - Real-time Order Tracking**
**Responsable**: Frontend  
**Tiempo estimado**: 1 día

**Descripción**: Vista de seguimiento en tiempo real del estado del pedido para el cliente.

**Subtareas**:
- [ ] Crear `/app/(public)/qr/[tableId]/tracking/[orderId]/page.tsx`
- [ ] Timeline de estados
  - [ ] Pedido recibido ✅
  - [ ] En preparación 🍳
  - [ ] Listo para servir ✨
  - [ ] Servido 🎉
- [ ] Actualización en tiempo real
  - [ ] WebSocket connection
  - [ ] Auto-refresh cada 30s (fallback)
- [ ] Información adicional
  - [ ] Tiempo estimado restante
  - [ ] Items del pedido
  - [ ] Opción de llamar mesero
- [ ] Notificaciones
  - [ ] "Tu pedido está listo"
  - [ ] Push notifications (opcional)

**Archivos**:
- `app/(public)/qr/[tableId]/tracking/[orderId]/page.tsx` (nuevo)
- `app/(public)/qr/_components/order-timeline.tsx` (nuevo)
- `app/(public)/qr/_hooks/use-order-tracking.ts` (nuevo)

**Tests**:
- Manual testing de WebSocket
- Verificar estados

**Criterios de Aceptación**:
- ✅ Muestra estado actual
- ✅ Actualiza en tiempo real
- ✅ Timeline visual claro
- ✅ Tiempo estimado visible

---

## **ÉPICA 4: Payment Integration (Optional)**
**Duración**: 2 días  
**Prioridad**: 🟡 Media  
**Dependencias**: Épica 3, M5 completado

### Tareas

#### **4.1 - QR Payment Flow**
**Responsable**: Backend + Frontend  
**Tiempo estimado**: 1 día

**Descripción**: Integrar flujo de pagos online desde QR usando MercadoPago.

**Subtareas**:
- [ ] Reutilizar componentes de M5
  - [ ] `PaymentModal`
  - [ ] `CheckoutButton`
- [ ] Adaptar para flujo QR
  - [ ] Sin login requerido
  - [ ] Email opcional del cliente
  - [ ] Redirect URLs específicas de QR
- [ ] API endpoint: `POST /api/qr/payment/create`
  - Request: `{ orderId, sessionId, customerEmail? }`
  - Response: `{ checkoutUrl, paymentId }`
- [ ] Success/failure pages
  - [ ] `/qr/[tableId]/payment/success`
  - [ ] `/qr/[tableId]/payment/failure`

**Archivos**:
- `app/api/qr/payment/create/route.ts` (nuevo)
- `app/(public)/qr/[tableId]/payment/success/page.tsx` (nuevo)
- `app/(public)/qr/[tableId]/payment/failure/page.tsx` (nuevo)

**Tests**:
- Reutilizar tests de M5
- Validar flujo QR específico

**Criterios de Aceptación**:
- ✅ Integración funciona
- ✅ Redirect correcto
- ✅ Orden se marca como pagada

---

#### **4.2 - Split Bill Feature**
**Responsable**: Frontend  
**Tiempo estimado**: 1 día

**Descripción**: Permitir dividir la cuenta entre múltiples personas.

**Subtareas**:
- [ ] Modal "Dividir cuenta"
  - [ ] Número de personas
  - [ ] División equitativa
  - [ ] División por items
  - [ ] División custom
- [ ] Cálculo automático
  - [ ] Monto por persona
  - [ ] Propina proporcional
- [ ] Múltiples pagos
  - [ ] Cada persona paga su parte
  - [ ] Tracking de pagos parciales

**Archivos**:
- `app/(public)/qr/_components/split-bill-modal.tsx` (nuevo)
- `app/(public)/qr/_hooks/use-split-bill.ts` (nuevo)

**Tests**:
- Manual testing de cálculos
- Validar múltiples pagos

**Criterios de Aceptación**:
- ✅ División funciona correctamente
- ✅ Cálculos precisos
- ✅ UX clara

---

## **ÉPICA 5: Admin Management & Analytics**
**Duración**: 2 días  
**Prioridad**: 🟢 Baja  
**Dependencias**: Épicas 1-3

### Tareas

#### **5.1 - QR Order Dashboard**
**Responsable**: Frontend  
**Tiempo estimado**: 1 día

**Descripción**: Dashboard para staff ver y gestionar pedidos QR en tiempo real.

**Subtareas**:
- [ ] Agregar tab "Pedidos QR" en `/pedidos`
- [ ] Vista de pedidos QR
  - [ ] Badge "QR" en cada pedido
  - [ ] Indicador de sesión guest
  - [ ] Origen del pedido (mesa/QR)
- [ ] Filtros adicionales
  - [ ] Solo pedidos QR
  - [ ] Por mesa
  - [ ] Por tiempo
- [ ] Estadísticas QR
  - [ ] Total pedidos QR del día
  - [ ] Ticket promedio QR vs tradicional
  - [ ] Tiempo promedio de orden

**Archivos**:
- `app/pedidos/page.tsx` (modificar)
- `components/qr-orders-tab.tsx` (nuevo)

**Tests**:
- Manual testing

**Criterios de Aceptación**:
- ✅ Diferencia pedidos QR
- ✅ Estadísticas visibles
- ✅ Filtros funcionan

---

#### **5.2 - QR Analytics & Insights**
**Responsable**: Backend + Frontend  
**Tiempo estimado**: 1 día

**Descripción**: Analytics específicos de uso de QR y comportamiento de clientes.

**Subtareas**:
- [ ] Métricas QR
  - [ ] Scans por mesa
  - [ ] Tasa de conversión (scan → orden)
  - [ ] Tiempo promedio en menú
  - [ ] Items más ordenados vía QR
  - [ ] Horarios pico de uso QR
- [ ] Dashboard de QR Analytics
  - [ ] Gráficos de uso
  - [ ] Comparativa QR vs tradicional
  - [ ] Mesas más activas
- [ ] Export de datos
  - [ ] CSV de pedidos QR
  - [ ] Reporte semanal

**Archivos**:
- `app/analitica/qr/page.tsx` (nuevo)
- `lib/server/qr-analytics.ts` (nuevo)
- `app/api/analytics/qr/route.ts` (nuevo)

**Tests**:
- Validar cálculos

**Criterios de Aceptación**:
- ✅ Métricas precisas
- ✅ Gráficos informativos
- ✅ Export funciona

---

## **ÉPICA 6: Testing & Quality Assurance**
**Duración**: 2 días  
**Prioridad**: 🔴 Crítica  
**Dependencias**: Todas las épicas anteriores

### Tareas

#### **6.1 - Unit & Integration Tests**
**Responsable**: QA + Devs  
**Tiempo estimado**: 1 día

**Subtareas**:
- [ ] Tests de QR Service (80% coverage)
- [ ] Tests de Session Manager (90% coverage)
- [ ] Tests de Cart Hook (90% coverage)
- [ ] Tests de Order API (90% coverage)
- [ ] Tests de componentes críticos

**Criterios**:
- ✅ Coverage >85%
- ✅ Todos los tests pasan

---

#### **6.2 - E2E Testing**
**Responsable**: QA  
**Tiempo estimado**: 0.5 días

**Subtareas**:
- [ ] Flujo completo: Scan → Menu → Cart → Checkout → Confirm
- [ ] Testing en dispositivos reales
  - [ ] iPhone (Safari)
  - [ ] Android (Chrome)
  - [ ] Tablet
- [ ] Performance testing
  - [ ] 3G throttling
  - [ ] Lighthouse audit

**Criterios**:
- ✅ Flujo funciona end-to-end
- ✅ Sin errores en consola
- ✅ Lighthouse >90

---

#### **6.3 - User Acceptance Testing**
**Responsable**: Product + QA  
**Tiempo estimado**: 0.5 días

**Subtareas**:
- [ ] Testing con usuarios reales
- [ ] Feedback de UX
- [ ] Ajustes finales

**Criterios**:
- ✅ Feedback positivo
- ✅ Issues críticos resueltos

---

## 📅 Cronograma

```
Semana 1 (Oct 11-17):
├─ Día 1-3: Épica 1 - QR Infrastructure
└─ Día 4-5: Épica 2 - Mobile Menu (inicio)

Semana 2 (Oct 18-24):
├─ Día 1-2: Épica 2 - Mobile Menu (fin)
└─ Día 3-5: Épica 3 - Checkout & Order Flow

Semana 3 (Oct 25-31):
├─ Día 1-2: Épica 4 - Payment Integration (opcional)
└─ Día 3-5: Épica 5 - Admin & Analytics

Semana 4 (Nov 1-7):
├─ Día 1-2: Épica 6 - Testing & QA
└─ Día 3-5: Buffer para ajustes

Semana 5 (Nov 8-15):
├─ Día 1-3: Pilot testing en restaurante
├─ Día 4-5: Fixes y ajustes finales
└─ Go Live!
```

---

## ✅ Criterios de Aceptación Global

### Must Have (Bloqueantes)
- ✅ Cliente puede escanear QR y ver menú
- ✅ Cliente puede agregar items al carrito
- ✅ Cliente puede confirmar pedido
- ✅ Staff recibe pedido en tiempo real
- ✅ Tests pasan (>85% coverage)
- ✅ Performance: <2s carga en 3G
- ✅ Lighthouse mobile >90

### Should Have (Importantes)
- ✅ Customización de items con modificadores
- ✅ Tracking en tiempo real del pedido
- ✅ Pago online integrado
- ✅ Analytics de uso QR

### Nice to Have (Opcionales)
- ⭕ Split bill
- ⭕ Recomendaciones de items
- ⭕ Programa de fidelidad
- ⭕ Push notifications

---

## ⚠️ Riesgos y Mitigaciones

| Riesgo | Probabilidad | Impacto | Mitigación |
|--------|--------------|---------|------------|
| UX mobile no intuitiva | Media | Alto | User testing temprano, iteraciones rápidas |
| Performance en 3G lenta | Alta | Alto | Optimización agresiva, lazy loading, caching |
| Stock desincronizado | Media | Medio | Validación en múltiples puntos, webhooks |
| Sesiones expiran prematuramente | Baja | Medio | TTL generoso (2h), renovación automática |
| QR codes no escanean bien | Baja | Alto | Testing con múltiples readers, tamaño adecuado |
| Múltiples personas en misma mesa | Media | Bajo | Permitir múltiples sesiones, identificador único |

---

## 📊 Definición de Done

Una tarea está **DONE** cuando:
- ✅ Código implementado y funcional
- ✅ Tests escritos y pasando
- ✅ Code review aprobado
- ✅ Documentación actualizada
- ✅ QA testing pasado
- ✅ Merged a branch principal

---

## 🚀 Go-Live Checklist

### Pre-Launch
- [ ] Todos los tests pasan
- [ ] Performance audit pasado
- [ ] Security audit completado
- [ ] Documentation completa
- [ ] Staff training realizado
- [ ] Pilot test en 1 mesa exitoso

### Launch Day
- [ ] QR codes impresos y colocados
- [ ] Staff briefed
- [ ] Monitoring activo
- [ ] Hotline lista para soporte

### Post-Launch (Semana 1)
- [ ] Monitorear métricas diarias
- [ ] Recolectar feedback
- [ ] Iterar rápido en issues
- [ ] Celebrar éxitos 🎉

---

**Versión del documento**: 1.0.0  
**Última actualización**: 2025-10-10  
**Próxima revisión**: Al completar cada épica
