# Changelog

Todos los cambios notables de este proyecto serán documentados en este archivo.

El formato está basado en [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
y este proyecto adhiere a [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### En progreso
- Ordenamiento QR para clientes (M6)
- Mejoras de performance en stores
- Optimización de WebSocket reconnection

---

## [0.5.0] - 2025-01-09

### M5 - Integración de Pagos (MercadoPago)

#### Added
- **Payment Integration**
  - MercadoPago payment provider con Checkout Pro
  - `PaymentStore` para gestión de pagos con persistencia en archivo
  - `PaymentService` para lógica de negocio de pagos
  - API endpoints: `/api/payment` (GET, POST), `/api/payment/[id]` (GET)
  - Webhook endpoint: `/api/webhook/mercadopago` con signature validation

- **Frontend Components**
  - `CheckoutButton` - Botón de pago integrado con loading states
  - `PaymentModal` - Modal de checkout con redirección a MercadoPago
  - Payment result pages: `/payment/success`, `/payment/failure`, `/payment/pending`
  - `usePayment` hook para gestión de estado de pagos

- **Real-time Updates**
  - Eventos WebSocket para actualizaciones de pagos: `payment:created`, `payment:updated`
  - Sincronización automática del estado de pagos en UI

- **Documentation**
  - API documentation: `docs/api/payments.md`
  - Payment flow diagram: `docs/diagrams/payment-flow.md`
  - Setup guide para MercadoPago
  - PR checklist específico de pagos

#### Changed
- `OrdersPanel` ahora incluye botón de pago para pedidos pendientes
- WebSocket event types extendidos con eventos de pagos
- `order-service.ts` actualizado con lógica de transición de estados

#### Fixed
- Type safety en payment-related types (eliminación de `any`)
- Error handling mejorado en payment flows
- Validación de webhooks de MercadoPago

#### Security
- Webhook signature validation implementada
- Secrets movidos a variables de entorno
- No se exponen access tokens en frontend

---

## [0.4.0] - 2024-12-XX

### M4 - Analytics y Reportes

#### Added
- Dashboard de analytics con métricas clave
- API endpoint `/api/analytics/covers` para datos de ocupación
- Componente `AnalyticsDashboard` con gráficos interactivos
- Filtros por rango de fecha
- Métricas: ocupación promedio, tiempo de rotación, revenue

#### Changed
- Sidebar navigation actualizado con sección de Analítica
- `table-store` extendido con tracking de covers

---

## [0.3.0] - 2024-11-XX

### M3 - Sistema de Pedidos

#### Added
- **Orders Management**
  - `OrderStore` con persistencia y validaciones
  - API endpoint `/api/order` (GET, POST, PATCH)
  - Order status workflow: pendiente → preparando → servido → completado
  - Validación de stock
  - Cálculo automático de totales, descuentos, propinas, impuestos

- **Frontend Components**
  - `OrdersPanel` - Panel principal de gestión de pedidos
  - `OrderForm` - Formulario de creación de pedidos
  - Real-time order updates via WebSocket

- **Menu Integration**
  - API endpoints `/api/menu/*` para gestión de menú
  - `MenuStore` con categorías, items, allergens
  - Stock management

#### Changed
- WebSocket events extendidos: `order:created`, `order:updated`, `order:status_changed`
- Table states sincronizados con pedidos

#### Tests
- Suite completo de tests para orders API (17 tests)
- Tests de validación de payload
- Tests de transiciones de estado
- Tests de integración con mesas

---

## [0.2.0] - 2024-10-XX

### M2 - Gestión de Mesas

#### Added
- **Table Management**
  - `TableStore` con state machine para transiciones
  - API endpoints `/api/tables/*` para CRUD de mesas
  - Table layout editor con drag & drop
  - Estados de mesa: libre → reservada → ocupada → cuenta_solicitada → pagando → libre

- **Components**
  - `TableList` - Lista de mesas con filtros
  - `TableMap` - Vista visual del salón
  - `SalonLiveView` - Vista en tiempo real del salón
  - Editor de layout de mesas

- **Real-time Features**
  - WebSocket integration para actualizaciones en tiempo real
  - Eventos: `table:created`, `table:updated`, `table:state_changed`

#### Tests
- Tests de table API (4 tests)
- Tests de state transitions
- Tests de table layout

---

## [0.1.0] - 2024-09-XX

### M1 - Estructura Base

#### Added
- **Project Setup**
  - Next.js 14.2 con App Router
  - TypeScript 5 con strict mode
  - Tailwind CSS + shadcn/ui components
  - Vitest + React Testing Library setup
  - ESLint configuration

- **Authentication**
  - `AuthContext` para gestión de sesión
  - `ProtectedRoute` component
  - Login page con mock authentication
  - Middleware para protección de rutas

- **Core Components**
  - `DashboardLayout` - Layout principal con sidebar
  - `SidebarNav` - Navegación lateral
  - `LoadingSpinner` - Componente de carga
  - `ErrorBoundary` - Manejo de errores

- **Infrastructure**
  - Socket.io integration setup
  - Mock data utilities
  - Basic routing structure
  - Global styles y theme

#### Documentation
- PROJECT_GUIDELINES.md
- PROJECT_OVERVIEW.md
- AGENTS.md para GitHub Copilot

---

## Leyenda

- `Added` - Nuevas funcionalidades
- `Changed` - Cambios en funcionalidades existentes
- `Deprecated` - Funcionalidades que serán removidas
- `Removed` - Funcionalidades removidas
- `Fixed` - Bug fixes
- `Security` - Mejoras de seguridad
- `Tests` - Adiciones o cambios en tests

---

**Formato de versiones**: MAJOR.MINOR.PATCH
- **MAJOR**: Cambios incompatibles de API
- **MINOR**: Nuevas funcionalidades (backwards compatible)
- **PATCH**: Bug fixes (backwards compatible)
