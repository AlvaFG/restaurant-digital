# 🚀 Prompt de Implementación: M6 - QR Ordering System

**Versión**: 1.0.0  
**Fecha**: 2025-10-10  
**Branch objetivo**: `feature/qr-ordering-system`  
**Contexto**: Sistema de pedidos por QR con carrito compartido por mesa

---

## 📋 Contexto del Proyecto

Estás trabajando en un sistema de gestión de restaurantes construido con:
- **Frontend**: Next.js 14.2 (App Router), React 18, TypeScript 5 (strict mode)
- **Styling**: Tailwind CSS + shadcn/ui components
- **Backend**: Next.js API Routes, File-based stores (JSON persistence)
- **Real-time**: Socket.io (WebSocket via `lib/socket.ts`)
- **Testing**: Vitest + React Testing Library
- **Pagos**: MercadoPago Checkout Pro (M5 ya implementado)
- **Logging**: Sistema estructurado con `lib/logger.ts`

### Estado Actual
- ✅ M1-M5 completados (100%)
- ✅ Sistema de pagos funcionando con MercadoPago
- ✅ Gestión de mesas, órdenes, menú, usuarios
- ✅ WebSocket configurado y funcional
- ✅ Logging profesional implementado
- ✅ Tests pasando, lint limpio, build exitoso
- 🎯 **Próximo**: Implementar M6 - QR Ordering System

---

## 🎯 Objetivo de M6: QR Ordering System

Permitir que clientes escaneen un código QR en su mesa y realicen pedidos desde su dispositivo móvil sin necesidad de registro, usando un **carrito compartido por mesa** donde todos los comensales agregan items a una sola orden.

### Principios de Diseño

1. **Carrito Compartido por Mesa**: Una sola orden por mesa, todos los clientes contribuyen al mismo carrito
2. **Mobile-First**: Optimizado para dispositivos móviles y conexiones lentas (3G)
3. **Sin Registro**: Sesiones temporales sin necesidad de login
4. **Pago Único**: Una sola transacción por mesa, división offline entre comensales
5. **Sync en Tiempo Real**: Opcional con WebSocket para actualizar cambios en el carrito
6. **Performance**: <2s carga inicial en 3G, Lighthouse score >90

---

## 📦 Arquitectura del Sistema

### Flujo Completo

```
1. Staff genera QR único por mesa (Admin Panel)
   ↓
2. Cliente escanea QR en Mesa 5 → Valida token JWT
   ↓
3. Crea sesión temporal guest (2 horas TTL)
   ↓
4. Cliente ve menú mobile-first optimizado
   ↓
5. Agrega items al carrito compartido de Mesa 5
   ↓
6. Otros clientes en Mesa 5 ven los mismos items (sync)
   ↓
7. Cualquiera puede hacer checkout y pagar el total
   ↓
8. Una sola orden creada para toda la mesa
   ↓
9. Staff recibe notificación en tiempo real
   ↓
10. Cliente ve tracking del pedido en tiempo real
```

### Estructura de Datos Clave

```typescript
// QR Token (JWT)
{
  tableId: "5",
  sessionId: "unique_session_id",
  exp: timestamp + 24h,
  iat: timestamp
}

// Session (in-memory store)
{
  sessionId: "guest_abc123",
  tableId: "5",
  createdAt: Date,
  lastActivity: Date,
  ttl: 7200 // 2 horas en segundos
}

// Shared Table Order
{
  orderId: "ORD-001",
  tableId: "5",
  items: [
    { id: "item1", name: "Hamburguesa", price: 15, quantity: 2, modifiers: [...] },
    { id: "item2", name: "Papas", price: 5, quantity: 3 }
  ],
  addedBy: [  // Tracking opcional
    { sessionId: "guest_abc", itemIds: ["item1"] },
    { sessionId: "guest_xyz", itemIds: ["item2"] }
  ],
  subtotal: 45,
  tip: 0,
  total: 45,
  status: "pending" | "paid" | "preparing" | "ready" | "served" | "completed",
  createdAt: Date,
  updatedAt: Date
}
```

---

## 🏗️ Plan de Implementación

### FASE 1: QR Infrastructure (Backend + Admin UI)
**Duración estimada**: 2-3 días  
**Prioridad**: 🔴 Crítica (Bloqueante para el resto)

#### 1.1 - Instalar Dependencias

```bash
npm install qrcode jsonwebtoken
npm install -D @types/qrcode @types/jsonwebtoken
```

#### 1.2 - Crear QR Service

**Archivo**: `lib/server/qr-service.ts`

**Requisitos**:
- Generar códigos QR con tokens JWT únicos por mesa
- Validar tokens con verificación de firma y expiración
- Refrescar tokens expirados
- Extraer metadata del token (tableId, sessionId)

**Funciones principales**:
```typescript
export async function generateQRCode(tableId: string): Promise<QRCodeResult>
export function validateQRToken(token: string): ValidationResult
export async function refreshQRToken(tableId: string): Promise<string>
export function getQRMetadata(token: string): QRMetadata | null
```

**Configuración JWT**:
- Secret: Variable de entorno `QR_JWT_SECRET`
- Expiración: 24 horas (renovable)
- Payload: `{ tableId, sessionId, exp, iat }`

**Tests requeridos**: `lib/server/__tests__/qr-service.test.ts`
- Genera QR con JWT válido
- Valida token correcto
- Rechaza token expirado
- Rechaza token con firma inválida
- Maneja tableId inexistente

#### 1.3 - Crear Session Manager

**Archivo**: `lib/server/session-manager.ts`

**Requisitos**:
- Store en memoria (Map) con TTL de 2 horas
- Renovación automática con actividad
- Limpieza de sesiones expiradas (cada 10 minutos)
- Máximo 10 sesiones activas por mesa

**Funciones principales**:
```typescript
export function createGuestSession(tableId: string): Session
export function getSession(sessionId: string): Session | null
export function extendSession(sessionId: string): void
export function invalidateSession(sessionId: string): void
export function getTableSessions(tableId: string): Session[]
export function cleanupExpiredSessions(): number
```

**Tests requeridos**: `lib/server/__tests__/session-manager.test.ts`
- Crea sesión válida
- Recupera sesión existente
- Expira sesión después de TTL
- Limita sesiones por mesa
- Limpieza automática funciona
- Extensión de sesión actualiza lastActivity

#### 1.4 - APIs de QR

**Archivo**: `app/api/qr/generate/route.ts`

```typescript
// POST /api/qr/generate
// Request: { tableId: string }
// Response: { qrCode: string (base64), url: string, token: string, expiresAt: Date }
// Auth: Requiere staff authentication
```

**Archivo**: `app/api/qr/validate/route.ts`

```typescript
// POST /api/qr/validate
// Request: { token: string }
// Response: { valid: boolean, tableId: string, sessionId: string, tableData: Table }
// Rate limiting: 10 requests/minuto por IP
```

**Tests requeridos**: 
- `app/api/__tests__/qr-generate.test.ts`
- `app/api/__tests__/qr-validate.test.ts`

#### 1.5 - Actualizar Table Store

**Archivo**: `lib/server/table-store.ts` (modificar)

**Cambios**:
- Agregar campos al tipo `Table`: `qrToken?: string`, `qrTokenExpiry?: Date`
- Método `updateTableQR(tableId, token, expiry)`
- Método `getTableByQRToken(token)`

#### 1.6 - Admin UI: Generación de QRs

**Archivo**: `components/generate-qr-modal.tsx` (nuevo)

**Requisitos**:
- Modal que se abre desde el botón en cada mesa
- Preview del QR code (tamaño grande, 300x300px)
- Información de la mesa (número, nombre, zona)
- Botones de descarga:
  - PNG (solo QR)
  - PDF (QR + branding + instrucciones)
- Botón de impresión directa
- URL pública del QR (copiable)
- Indicador de expiración del token

**Archivo**: `components/qr-print-template.tsx` (nuevo)

**Requisitos**:
- Template A4 para impresión
- Logo del restaurante (top center)
- Número de mesa (grande, bold)
- QR code centrado (250x250px)
- Instrucciones breves (3-4 líneas)
- Diseño responsive para diferentes tamaños de impresión

**Archivo**: `app/mesas/page.tsx` (modificar)

**Cambios**:
- Agregar botón "QR 📱" en cada mesa card
- Al hacer click, abrir `GenerateQRModal`
- Agregar botón "Generar todos los QRs" (batch generation)

---

### FASE 2: Mobile Menu Experience (Frontend)
**Duración estimada**: 3-4 días  
**Prioridad**: 🔴 Crítica

#### 2.1 - Layout Público para QR

**Archivo**: `app/(public)/layout.tsx` (crear carpeta route group)

**Requisitos**:
- Layout sin autenticación
- Sin sidebar
- Header minimalista con logo
- Optimizado para mobile

**Archivo**: `app/(public)/qr/[tableId]/layout.tsx`

**Requisitos**:
- Layout específico para experiencia QR
- Sticky header con nombre de mesa
- Badge de carrito flotante (bottom-right)
- Sin navegación compleja

#### 2.2 - QR Validation & Redirect

**Archivo**: `app/(public)/qr/validate/page.tsx`

**Requisitos**:
- Página que recibe el token como query param: `/qr/validate?token=xxx`
- Valida token con API
- Si válido: crea sesión y redirige a `/qr/[tableId]`
- Si inválido: muestra error amigable
- Loading state durante validación
- Manejo de errores (QR expirado, mesa no existe, etc.)

#### 2.3 - Mobile Menu Page

**Archivo**: `app/(public)/qr/[tableId]/page.tsx`

**Requisitos principales**:
- Verificar sesión válida en mount
- Si no hay sesión: redirect a `/qr/validate`
- Layout mobile-first responsive
- Carga de menú optimizada
- Virtual scrolling para listas largas
- Lazy loading de imágenes

**Componente**: `app/(public)/qr/_components/mobile-menu-header.tsx`

**Requisitos**:
- Sticky header (position: fixed, top: 0)
- Logo + nombre del restaurante (left)
- Número de mesa (center, badge)
- Botón de carrito con badge de cantidad (right)
- Height: 64px, z-index: 50

**Componente**: `app/(public)/qr/_components/menu-category-tabs.tsx`

**Requisitos**:
- Scroll horizontal de categorías
- Sticky debajo del header
- Indicador visual de categoría activa
- Auto-scroll al seleccionar
- Touch-friendly (48px height mínimo)

**Componente**: `app/(public)/qr/_components/menu-item-card.tsx`

**Requisitos**:
- Card compacta pero touch-friendly
- Imagen (16:9 ratio, lazy loaded, blur placeholder)
- Nombre del item (font-semibold, 16px)
- Descripción corta (2 líneas max, truncate)
- Precio destacado (font-bold, 20px, color primary)
- Badges: "Popular", "Nuevo", "Agotado", "Vegetariano"
- Botón "+" grande (48x48px) para agregar rápido
- Click en card: abre modal de detalle

**Componente**: `app/(public)/qr/_components/item-detail-modal.tsx`

**Requisitos**:
- Modal full-screen en mobile
- Imagen grande (hero, 300px height)
- Nombre + descripción completa
- Precio base
- Selector de modificadores (si aplica)
- Contador de cantidad (- / number / +)
- Campo de notas especiales (textarea)
- Precio total calculado dinámicamente
- Botón "Agregar al carrito" (CTA, full-width)

#### 2.4 - Shared Cart System

**Archivo**: `app/(public)/qr/_hooks/use-shared-cart.ts`

**Requisitos**:
- Hook custom para gestionar carrito compartido
- Cargar orden activa de la mesa al montar
- Optimistic updates locales
- Sync con servidor después de cada acción
- WebSocket listener para updates de otros clientes
- Auto-refresh cada 30s (fallback si no hay WS)

**Funciones**:
```typescript
const { 
  order,           // Orden compartida actual
  isLoading,       // Estado de carga
  error,           // Errores
  addItem,         // Agregar item al carrito
  removeItem,      // Quitar item
  updateQuantity,  // Cambiar cantidad
  clearCart,       // Vaciar carrito
  refreshCart      // Forzar refresh
} = useSharedCart(tableId, sessionId);
```

**Componente**: `app/(public)/qr/_components/cart-drawer.tsx`

**Requisitos**:
- Drawer desde bottom (mobile) o right (desktop)
- Header: "Pedido de Mesa {X}" + botón cerrar
- Empty state si no hay items
- Lista de items con preview (imagen pequeña, nombre, precio, cantidad)
- Controles inline de cantidad (- / qty / +)
- Botón de eliminar por item
- Indicador opcional "Agregado por Cliente X" (si hay tracking)
- Subtotal en tiempo real
- Botón "Vaciar carrito" (con confirmación)
- Botón CTA: "Ir a pagar ${total}" (sticky bottom)
- Nota: "💡 Dividan la cuenta entre ustedes después del pago"

**Componente**: `app/(public)/qr/_components/cart-item.tsx`

**Requisitos**:
- Layout horizontal compacto
- Thumbnail 60x60px
- Nombre + modificadores (si tiene)
- Precio unitario y total
- Contador de cantidad inline
- Botón eliminar (icon, pequeño)
- Animación al actualizar cantidad

#### 2.5 - Item Customization

**Componente**: `app/(public)/qr/_components/item-customization-modal.tsx`

**Requisitos**:
- Mostrar modificadores disponibles del item
- Grupos de modificadores (ej: "Tamaño", "Extras", "Cocción")
- Radio buttons para single-choice (ej: tamaño)
- Checkboxes para multi-choice (ej: extras)
- Cada opción muestra precio adicional (+$X)
- Validación de modificadores requeridos
- Textarea para notas especiales
- Precio total actualizado en tiempo real
- Botón "Guardar cambios" o "Agregar"

#### 2.6 - Performance Optimization

**Tareas**:
- Configurar Next.js Image optimization
  - Usar `next/image` en todos los casos
  - Placeholders con blur
  - Lazy loading agresivo
  - Formatos modernos (WebP, AVIF)

- Code splitting
  - Dynamic imports para modales
  - Lazy load de componentes pesados
  - Route-based splitting automático

- Service Worker (opcional para v1)
  - Cache de imágenes del menú
  - Offline fallback
  - Stale-while-revalidate strategy

- Bundle optimization
  - Tree shaking habilitado
  - Minificación
  - Compression (gzip/brotli)

**Archivo**: `next.config.mjs` (modificar)

```javascript
images: {
  formats: ['image/webp', 'image/avif'],
  deviceSizes: [640, 750, 828, 1080, 1200],
  imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
}
```

**Validación**:
- Lighthouse audit >90 en mobile
- First Load JS <200KB
- LCP <2.5s en 3G throttling
- CLS <0.1
- FID <100ms

---

### FASE 3: Order Flow & Checkout (Frontend + Backend)
**Duración estimada**: 2-3 días  
**Prioridad**: 🔴 Crítica

#### 3.1 - APIs de Carrito Compartido

**Archivo**: `app/api/qr/table/[tableId]/order/route.ts`

```typescript
// GET: Obtener orden activa de la mesa
// Response: Order | { items: [], subtotal: 0 }

// POST: Crear nueva orden para la mesa
// Request: { sessionId: string }
// Response: Order
```

**Archivo**: `app/api/qr/table/[tableId]/cart/add/route.ts`

```typescript
// POST: Agregar item al carrito compartido
// Request: { item: OrderItem, sessionId: string }
// Response: Order (actualizada)
// Side effect: Emit WebSocket event 'table:{tableId}:cart:updated'
```

**Archivo**: `app/api/qr/table/[tableId]/cart/remove/route.ts`

```typescript
// POST: Quitar item del carrito
// Request: { itemId: string, sessionId: string }
// Response: Order (actualizada)
// Side effect: Emit WebSocket event
```

**Archivo**: `app/api/qr/table/[tableId]/cart/update/route.ts`

```typescript
// POST: Actualizar cantidad de item
// Request: { itemId: string, quantity: number, sessionId: string }
// Response: Order (actualizada)
// Side effect: Emit WebSocket event
```

**Validaciones en todas las APIs**:
- Sesión válida y no expirada
- Mesa existe y está disponible
- Items existen en el menú
- Stock disponible (si aplica)
- Rate limiting: 30 requests/minuto por sessionId

#### 3.2 - Checkout Page

**Archivo**: `app/(public)/qr/[tableId]/checkout/page.tsx`

**Requisitos**:
- Validar que haya items en el carrito
- Si carrito vacío: redirect a menu
- Resumen completo de la orden
- Formulario de contacto (opcional):
  - Nombre (opcional)
  - Número de mesa (pre-llenado, readonly)
  - Notas adicionales para cocina
- Selector de propina:
  - Botones: 10%, 15%, 20%
  - Input custom
  - Opción "Sin propina"
- Breakdown de totales:
  - Subtotal
  - Propina
  - Total final
- Opciones de pago:
  - "💳 Pagar ahora" (MercadoPago)
  - "💵 Pagar en mesa" (default)
- Términos y condiciones checkbox
- Loading state durante submit
- Error handling

**Componente**: `app/(public)/qr/_components/order-summary.tsx`

**Requisitos**:
- Lista colapsable de items
- Muestra: nombre, cantidad, precio, modificadores
- Precio total por item
- Subtotal calculado

**Componente**: `app/(public)/qr/_components/tip-selector.tsx`

**Requisitos**:
- Botones de porcentaje predefinido
- Input numérico para custom
- Muestra monto en $ en tiempo real
- Estado activo visual claro

#### 3.3 - Order Submission API

**Archivo**: `app/api/qr/order/create/route.ts`

```typescript
// POST: Confirmar y crear orden final
// Request: {
//   tableId: string,
//   sessionId: string,
//   items: OrderItem[],
//   tip?: number,
//   notes?: string,
//   paymentMethod: 'online' | 'at_table',
//   customerName?: string
// }
// Response: {
//   orderId: string,
//   orderNumber: number,
//   estimatedTime: string,
//   status: string
// }
```

**Lógica**:
1. Validar sesión y mesa
2. Validar items y stock
3. Crear orden en OrderStore
4. Actualizar estado de mesa a "occupied"
5. Si paymentMethod === 'online': crear payment intent
6. Emitir evento WebSocket: `orders:new`
7. Notificar al staff (WebSocket + opcional push)
8. Limpiar carrito temporal
9. Retornar orden creada

**Tests**: `app/api/__tests__/qr-order-create.test.ts`
- Crea orden correctamente
- Valida stock insuficiente
- Rechaza sesión inválida
- Actualiza mesa correctamente
- Emite eventos WebSocket

#### 3.4 - Confirmation Page

**Archivo**: `app/(public)/qr/[tableId]/confirmed/page.tsx`

**Requisitos**:
- Mostrar tras submit exitoso
- Número de orden (grande, destacado)
- Tiempo estimado de preparación
- Resumen del pedido (colapsable)
- Total pagado
- Estado actual: "Pedido recibido ✅"
- Botón "Ver estado en tiempo real"
- Botón "Hacer otro pedido" (vuelve al menú)
- Mensaje de agradecimiento personalizado
- Nota: "El staff te traerá tu pedido a Mesa {X}"

#### 3.5 - Real-time Order Tracking

**Archivo**: `app/(public)/qr/[tableId]/tracking/[orderId]/page.tsx`

**Requisitos**:
- Timeline vertical de estados
- Estados:
  1. Pedido recibido ✅ (completed)
  2. En preparación 🍳 (current/completed)
  3. Listo para servir ✨ (pending)
  4. Servido 🎉 (pending)
- Animaciones de transición entre estados
- Tiempo estimado restante (countdown)
- Lista de items del pedido
- Botón "Llamar mesero" (opcional)
- Auto-update con WebSocket
- Fallback: polling cada 30s

**Componente**: `app/(public)/qr/_components/order-timeline.tsx`

**Requisitos**:
- Timeline vertical con iconos
- Estados completados: check verde
- Estado actual: animación pulse
- Estados pendientes: gris
- Timestamps por estado

**Hook**: `app/(public)/qr/_hooks/use-order-tracking.ts`

```typescript
const { order, status, estimatedTime } = useOrderTracking(orderId, tableId);
```

---

### FASE 4: Payment Integration (Opcional - Reutilizar M5)
**Duración estimada**: 1 día  
**Prioridad**: 🟡 Media

#### 4.1 - Adaptar Payment Flow para QR

**Archivo**: `app/api/qr/payment/create/route.ts`

**Requisitos**:
- Reutilizar `MercadoPagoProvider` de M5
- Adaptar para órdenes QR (sin usuario registrado)
- Email opcional del cliente
- Redirect URLs específicas de QR

```typescript
// POST: Crear payment intent para orden QR
// Request: {
//   orderId: string,
//   sessionId: string,
//   customerEmail?: string
// }
// Response: {
//   checkoutUrl: string,
//   paymentId: string
// }
```

**Success page**: `app/(public)/qr/[tableId]/payment/success/page.tsx`
**Failure page**: `app/(public)/qr/[tableId]/payment/failure/page.tsx`

#### 4.2 - Webhook Handler

**Archivo**: `app/api/webhook/mercadopago/route.ts` (modificar)

**Cambios**:
- Detectar si el pago es de orden QR (via metadata)
- Actualizar orden correspondiente
- Emitir evento: `order:paid`
- Notificar al cliente (WebSocket a su sesión)

---

### FASE 5: Admin Management (Backend + Frontend)
**Duración estimada**: 1-2 días  
**Prioridad**: 🟢 Baja

#### 5.1 - QR Orders Dashboard

**Archivo**: `app/pedidos/page.tsx` (modificar)

**Cambios**:
- Agregar tab "Pedidos QR"
- Badge "QR" en órdenes que vienen de QR
- Filtro: "Solo QR" / "Solo tradicionales" / "Todos"
- Indicador de sesión guest
- Mostrar tableId prominente

**Componente**: `components/qr-order-badge.tsx`

**Requisitos**:
- Badge pequeño "📱 QR"
- Color distintivo
- Tooltip: "Pedido vía QR"

#### 5.2 - QR Analytics

**Archivo**: `app/analitica/qr/page.tsx` (nuevo)

**Requisitos**:
- Métricas:
  - Total scans de QR (por día/semana/mes)
  - Tasa de conversión (scan → orden)
  - Ticket promedio QR vs tradicional
  - Tiempo promedio desde scan hasta orden
  - Items más pedidos vía QR
  - Horarios pico de uso QR
  - Mesas más activas con QR
- Gráficos:
  - Line chart: Scans por hora
  - Bar chart: Órdenes por mesa
  - Pie chart: Distribución de métodos de pago
- Filtros por fecha
- Export a CSV

**Archivo**: `lib/server/qr-analytics.ts` (nuevo)

**Funciones**:
```typescript
export async function getQRScans(dateRange: DateRange): Promise<QRScan[]>
export async function getConversionRate(dateRange: DateRange): Promise<number>
export async function getAverageTicket(orderType: 'qr' | 'traditional'): Promise<number>
export async function getTopItemsByQR(limit: number): Promise<MenuItem[]>
export async function getQRUsageByHour(): Promise<HourlyUsage[]>
```

**API**: `app/api/analytics/qr/route.ts`

---

### FASE 6: Testing & Quality Assurance
**Duración estimada**: 2 días  
**Prioridad**: 🔴 Crítica

#### 6.1 - Unit Tests

**Requisitos de coverage**: >85%

**Archivos de test**:
- `lib/server/__tests__/qr-service.test.ts` (10+ tests)
- `lib/server/__tests__/session-manager.test.ts` (10+ tests)
- `app/(public)/qr/__tests__/use-shared-cart.test.tsx` (8+ tests)
- `app/(public)/qr/__tests__/use-order-tracking.test.tsx` (5+ tests)
- `app/api/__tests__/qr-generate.test.ts` (5+ tests)
- `app/api/__tests__/qr-validate.test.ts` (8+ tests)
- `app/api/__tests__/qr-order-create.test.ts` (10+ tests)

**Comando**: `npm test`

#### 6.2 - Integration Tests

**Escenarios**:
1. Flujo completo: Generate QR → Scan → Validate → Menu → Add items → Checkout → Confirm
2. Carrito compartido: Dos sesiones agregan items a misma mesa
3. Sync en tiempo real: Un cliente agrega, otro ve el update
4. Sesión expirada: Manejo de TTL
5. Stock agotado: Validación en checkout
6. Payment flow: Online y at_table

#### 6.3 - E2E Testing (Manual)

**Checklist**:
- [ ] Staff genera QR desde `/mesas`
- [ ] QR se descarga correctamente (PNG y PDF)
- [ ] Scan con cámara real redirige correctamente
- [ ] Validación de token funciona
- [ ] Menu se ve bien en mobile (iPhone, Android)
- [ ] Agregar items actualiza carrito
- [ ] Carrito se sincroniza entre clientes
- [ ] Checkout procesa correctamente
- [ ] Confirmation page se muestra
- [ ] Tracking en tiempo real funciona
- [ ] Staff ve la orden en dashboard
- [ ] Notificaciones aparecen
- [ ] Payment con MercadoPago funciona
- [ ] Webhook actualiza estado

**Dispositivos**:
- iPhone (Safari)
- Android (Chrome)
- Tablet (iPad)

#### 6.4 - Performance Testing

**Herramientas**:
- Lighthouse (Chrome DevTools)
- WebPageTest
- Network throttling (Chrome: Slow 3G)

**Targets**:
- Lighthouse score >90 (mobile)
- First Load JS <200KB
- LCP <2.5s en 3G
- CLS <0.1
- TTI <3.5s
- No errores en console

#### 6.5 - Accessibility Testing

**Checklist**:
- [ ] Todos los botones >44px (touch-friendly)
- [ ] Contraste suficiente (WCAG AA)
- [ ] Alt text en imágenes
- [ ] Labels en inputs
- [ ] Navegación con teclado funciona
- [ ] Screen reader compatible (VoiceOver, TalkBack)
- [ ] Focus visible en interactivos

---

## 🎨 Convenciones de Código

### TypeScript
- Usar `strict: true` siempre
- Preferir `interface` sobre `type` para objetos
- Definir tipos explícitos en parámetros y retornos de funciones
- Usar `readonly` donde sea apropiado

### React/Next.js
- Componentes funcionales con TypeScript
- Props interface exportada: `export interface ComponentNameProps`
- Usar `use client` solo cuando sea necesario (client components)
- Server components por default
- Hooks custom con prefijo `use`

### Naming
- Componentes: `PascalCase` (ej: `MobileMenuHeader`)
- Funciones/variables: `camelCase` (ej: `generateQRCode`)
- Archivos: `kebab-case` (ej: `mobile-menu-header.tsx`)
- Hooks: `use-hook-name.ts`
- Tests: `component-name.test.tsx`

### Imports
- Usar alias `@/` para paths absolutos
- Orden: node_modules → @/ → ../relative → ./relative
- Agrupar por tipo: types, components, hooks, utils

### Styling
- Tailwind utility classes inline
- Usar `cn()` helper de `lib/utils.ts` para clases condicionales
- No CSS modules ni styled-components
- Variables CSS para colores custom (en `globals.css`)

### Logging
- Usar `lib/logger.ts` en server-side
- Console.log solo en client-side desarrollo
- Niveles: debug, info, warn, error
- Incluir contexto: `logger.info('QR generated', { tableId, token })`

---

## 🔒 Seguridad y Validaciones

### JWT Tokens
- Secret seguro (32+ caracteres)
- Expiración razonable (24h)
- Validar firma siempre
- No incluir datos sensibles en payload

### Rate Limiting
- `/api/qr/validate`: 10 requests/min por IP
- `/api/qr/order/create`: 5 requests/min por sessionId
- Carrito operations: 30 requests/min por sessionId

### Input Validation
- Validar todos los inputs en APIs
- Sanitizar strings (prevent XSS)
- Validar tipos con Zod o similar
- Check de stock antes de crear orden
- Verificar sesión válida en cada request

### Session Security
- TTL de 2 horas
- Cleanup automático de expiradas
- Límite de sesiones por mesa (10)
- Token único por sesión
- No almacenar datos sensibles

---

## 📊 Métricas de Éxito

### Técnicas
- ✅ Tests passing: 100%
- ✅ Coverage: >85%
- ✅ Lighthouse score: >90
- ✅ Build time: <60s
- ✅ Zero console errors
- ✅ Lint passing

### Funcionales
- ✅ QR generation: <500ms
- ✅ Token validation: <200ms
- ✅ Menu load: <2s en 3G
- ✅ Add to cart: <300ms
- ✅ Order creation: <1s
- ✅ Real-time update latency: <500ms

### Negocio
- ✅ Tiempo de orden: <2 min (scan → confirm)
- ✅ Tasa de completitud: >85%
- ✅ Error rate: <1%
- ✅ Customer satisfaction: Score to be measured

---

## 🚀 Comandos Esenciales

```bash
# Desarrollo
npm run dev

# Testing
npm test                    # Run all tests
npm test -- --coverage      # With coverage report
npm test qr-service         # Test specific file

# Linting
npm run lint                # Check errors
npm run lint -- --fix       # Auto-fix

# Build
npm run build               # Production build
npm run start               # Serve production

# Type checking
npx tsc --noEmit            # Check types without build
```

---

## 📂 Estructura de Archivos Nueva

```
app/
  (public)/                         # Route group sin auth
    layout.tsx                      # Layout público
    qr/
      validate/
        page.tsx                    # QR validation page
      [tableId]/
        layout.tsx                  # QR experience layout
        page.tsx                    # Mobile menu
        checkout/
          page.tsx                  # Checkout
        confirmed/
          page.tsx                  # Confirmation
        tracking/
          [orderId]/
            page.tsx                # Order tracking
        payment/
          success/
            page.tsx
          failure/
            page.tsx
        _components/                # Private components
          mobile-menu-header.tsx
          menu-category-tabs.tsx
          menu-item-card.tsx
          item-detail-modal.tsx
          item-customization-modal.tsx
          cart-drawer.tsx
          cart-item.tsx
          order-summary.tsx
          tip-selector.tsx
          order-timeline.tsx
        _hooks/                     # Private hooks
          use-shared-cart.ts
          use-order-tracking.ts
          use-qr-session.ts
        _types/                     # Private types
          cart.ts
          order.ts
  api/
    qr/
      generate/
        route.ts
      validate/
        route.ts
      order/
        create/
          route.ts
      table/
        [tableId]/
          order/
            route.ts
          cart/
            add/
              route.ts
            remove/
              route.ts
            update/
              route.ts
      payment/
        create/
          route.ts
      __tests__/
        qr-generate.test.ts
        qr-validate.test.ts
        qr-order-create.test.ts
    analytics/
      qr/
        route.ts
  analitica/
    qr/
      page.tsx                      # QR analytics dashboard

components/
  generate-qr-modal.tsx
  qr-print-template.tsx
  qr-order-badge.tsx

lib/
  server/
    qr-service.ts
    qr-types.ts
    session-manager.ts
    session-types.ts
    session-store.ts
    qr-analytics.ts
    __tests__/
      qr-service.test.ts
      session-manager.test.ts

docs/
  roadmap/
    m6-qr-ordering-detailed.md      # Este roadmap
  prompts/
    m6-implementation-prompt.md     # Este prompt
```

---

## 🎯 Checklist Final de Implementación

### Pre-Implementation
- [ ] Leer este prompt completo
- [ ] Revisar M5 (payments) para entender integración
- [ ] Crear branch: `feature/qr-ordering-system`
- [ ] Instalar dependencias

### Fase 1: QR Infrastructure
- [ ] QR Service implementado y testeado
- [ ] Session Manager implementado y testeado
- [ ] APIs de generate y validate funcionando
- [ ] Table store actualizado
- [ ] Admin UI para generar QRs completo
- [ ] Tests passing (qr-service, session-manager)

### Fase 2: Mobile Menu
- [ ] Layout público creado
- [ ] QR validation page funcional
- [ ] Mobile menu page responsive
- [ ] Category tabs implementadas
- [ ] Item cards con lazy loading
- [ ] Item detail modal con customización
- [ ] Carrito compartido funcionando
- [ ] Cart drawer con sync
- [ ] Performance optimizado (Lighthouse >90)

### Fase 3: Order Flow
- [ ] APIs de carrito implementadas
- [ ] Checkout page completa
- [ ] Order creation API funcional
- [ ] Confirmation page
- [ ] Real-time tracking implementado
- [ ] WebSocket events funcionando
- [ ] Tests passing (order APIs)

### Fase 4: Payment (Opcional)
- [ ] Payment API adaptada
- [ ] Success/failure pages
- [ ] Webhook handler actualizado

### Fase 5: Admin
- [ ] QR orders visible en dashboard
- [ ] Filtros y badges implementados
- [ ] QR analytics dashboard (opcional)

### Fase 6: Testing & QA
- [ ] Unit tests >85% coverage
- [ ] Integration tests passing
- [ ] E2E manual testing completado
- [ ] Performance testing (Lighthouse >90)
- [ ] Accessibility testing
- [ ] No console errors
- [ ] Build passing
- [ ] Lint passing

### Post-Implementation
- [ ] Update CHANGELOG.md
- [ ] Update documentation
- [ ] Create PR con descripción completa
- [ ] Request code review
- [ ] Merge to main
- [ ] Deploy to staging
- [ ] User acceptance testing
- [ ] Deploy to production

---

## 🆘 Troubleshooting

### JWT Token Issues
- Verificar `QR_JWT_SECRET` en `.env`
- Usar librería `jsonwebtoken` correctamente
- Check expiration time (exp claim)

### Session Expiration
- TTL muy corto? Aumentar a 2 horas
- Cleanup muy agresivo? Ajustar intervalo
- Verificar renovación con actividad

### WebSocket Not Syncing
- Check socket.io connection
- Verificar eventos emitidos correctamente
- Console log para debug
- Fallback a polling si falla

### Performance Issues
- Verificar lazy loading de imágenes
- Check bundle size con `npm run build`
- Implementar virtual scrolling si hay muchos items
- Usar React.memo en componentes pesados

### Tests Failing
- Verificar mocks de filesystem
- Check mock de socket-bus
- Limpiar estado entre tests (beforeEach/afterEach)
- Validar que `.env.test` tenga variables necesarias

---

## 📚 Referencias

- [Next.js App Router Docs](https://nextjs.org/docs/app)
- [shadcn/ui Components](https://ui.shadcn.com/)
- [Tailwind CSS Docs](https://tailwindcss.com/docs)
- [Socket.io Client](https://socket.io/docs/v4/client-api/)
- [qrcode npm package](https://www.npmjs.com/package/qrcode)
- [jsonwebtoken npm package](https://www.npmjs.com/package/jsonwebtoken)
- [MercadoPago Docs](https://www.mercadopago.com.ar/developers/es/docs)
- [Vitest Docs](https://vitest.dev/)
- [React Testing Library](https://testing-library.com/react)

---

## 🎉 Criterios de Éxito para M6

M6 estará **COMPLETADO** cuando:

✅ Cliente puede escanear QR y ver menú mobile  
✅ Cliente puede agregar items al carrito compartido  
✅ Múltiples clientes en misma mesa ven el mismo carrito  
✅ Cliente puede hacer checkout y confirmar orden  
✅ Staff recibe orden en tiempo real  
✅ Cliente puede hacer tracking del pedido  
✅ Payment online funciona (opcional)  
✅ Admin puede generar y gestionar QRs  
✅ Tests passing >85% coverage  
✅ Performance: Lighthouse >90  
✅ Build passing, lint clean  
✅ Zero console errors en producción  

---

**¡Todo listo para empezar! 🚀**

**Siguiente paso**: Crear branch `feature/qr-ordering-system` y comenzar con Fase 1: QR Infrastructure.

**Pregunta clave antes de empezar**: ¿Quieres implementar WebSocket sync desde el inicio o prefieres empezar con polling simple y agregar WebSocket después?

**Recomendación**: Empezar con polling (más simple) y agregar WebSocket en Fase 2 una vez que el flujo básico funcione.
