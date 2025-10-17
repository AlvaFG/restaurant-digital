# Registro de Cambios# Changelog



Todos los cambios notables en este proyecto serán documentados en este archivo.Todos los cambios notables de este proyecto serán documentados en este archivo.



El formato está basado en [Keep a Changelog](https://keepachangelog.com/es/1.0.0/),El formato está basado en [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),

y este proyecto adhiere a [Versionado Semántico](https://semver.org/lang/es/).y este proyecto adhiere a [Semantic Versioning](https://semver.org/spec/v2.0.0.html).



## [1.0.0] - 2025-10-12## [Unreleased]



### 🎉 OPTIMIZACIÓN Y LIMPIEZA COMPLETA DEL PROYECTO### En progreso

- Ordenamiento QR para clientes (M6)

#### ♻️ Optimizado- Mejoras de performance en stores

- Optimización de WebSocket reconnection

**Código TypeScript**

- Eliminados más de 80 usos de `any` con tipos apropiados### Fixed

- Corregidos todos los imports sin uso- Todos los tests de payment-store pasando (14/14)

- Eliminadas variables declaradas pero no utilizadas- Eliminados console.logs en producción (34 instancias)

- Mejorada la inferencia de tipos en toda la aplicación- File I/O en payment-store con creación automática de directorios

- Agregadas interfaces explícitas para mejorar el mantenimiento

### Added

**Configuración de ESLint**- Sistema de logging estructurado (`lib/logger.ts`)

- Reglas actualizadas para mejor experiencia de desarrollo- Niveles de log apropiados: debug, info, warn, error

- Configuración de warnings vs errors más pragmática- Contexto estructurado en todos los logs

- Soporte para patterns comunes (variables con `_`)- Test utilities en `lib/server/__tests__/setup.ts`

- Mejor balance entre estricto y práctico- Documentación completa de resolución de deuda técnica



**Estructura del Proyecto**### Changed

- Reorganizada documentación en carpeta `/docs`- Migrado todo el logging de stores a sistema estructurado

- Archivos temporales y de auditoría movidos a `/docs/archive`- payment-store, order-store, table-store, menu-store, mercadopago-provider

- Estructura más clara y profesional- Tests de payment-store completamente reescritos con mejor aislamiento

- Eliminados archivos duplicados y obsoletos- Logger config con soporte para desarrollo y producción



**package.json**---

- Nombre actualizado: `restaurant-management-system`

- Versión actualizada a `1.0.0`## [0.5.0] - 2025-01-09

- Mejor organización de scripts

### M5 - Integración de Pagos (MercadoPago)

#### 📚 Documentación

#### Added

**README Principal**- **Payment Integration**

- Completamente reescrito en español  - MercadoPago payment provider con Checkout Pro

- Información actualizada sobre el stack tecnológico  - `PaymentStore` para gestión de pagos con persistencia en archivo

- Guías de instalación mejoradas  - `PaymentService` para lógica de negocio de pagos

- Sección de internacionalización agregada  - API endpoints: `/api/payment` (GET, POST), `/api/payment/[id]` (GET)

- Badges actualizados  - Webhook endpoint: `/api/webhook/mercadopago` con signature validation

- Estructura más clara y profesional

- **Frontend Components**

**CHANGELOG**  - `CheckoutButton` - Botón de pago integrado con loading states

- Traducido completamente al español  - `PaymentModal` - Modal de checkout con redirección a MercadoPago

- Historial completo de cambios desde M1 hasta M6  - Payment result pages: `/payment/success`, `/payment/failure`, `/payment/pending`

- Formato consistente y fácil de leer  - `usePayment` hook para gestión de estado de pagos

- Notas de versión agregadas

- **Real-time Updates**

**Organización de Docs**  - Eventos WebSocket para actualizaciones de pagos: `payment:created`, `payment:updated`

- Archivos `.md` de raíz movidos a `/docs`  - Sincronización automática del estado de pagos en UI

- Categorización por tipo (setup, features, architecture, etc.)

- Archivos obsoletos archivados- **Documentation**

- Índice mejorado  - API documentation: `docs/api/payments.md`

  - Payment flow diagram: `docs/diagrams/payment-flow.md`

#### 🌍 Internacionalización  - Setup guide para MercadoPago

  - PR checklist específico de pagos

**Sistema Completo en Español**

- README y toda la documentación principal#### Changed

- CHANGELOG y notas de versión- `OrdersPanel` ahora incluye botón de pago para pedidos pendientes

- Comentarios en el código actualizados- WebSocket event types extendidos con eventos de pagos

- Nombres de variables y funciones descriptivos en español donde aplica- `order-service.ts` actualizado con lógica de transición de estados

- Mensajes de commit y guías de contribución

#### Fixed

#### 🔧 Configuración- Type safety en payment-related types (eliminación de `any`)

- Error handling mejorado en payment flows

**ESLint**- Validación de webhooks de MercadoPago

- Reglas más permisivas para desarrollo

- Warnings en lugar de errors para algunos casos#### Security

- Mejor experiencia con shadcn/ui components- Webhook signature validation implementada

- Configuración para trabajo con Next.js 14- Secrets movidos a variables de entorno

- No se exponen access tokens en frontend

#### 🐛 Corregido

---

**TypeScript**

- Tipos corregidos en `lib/api-helpers.ts`## [0.4.0] - 2024-12-XX

- Tipos mejorados en `app/api/auth/login/route.ts`

- Tipos mejorados en `app/api/auth/register/route.ts`### M4 - Analytics y Reportes

- Tipos para respuestas de Supabase

- Eliminación de casteos inseguros#### Added

- Dashboard de analytics con métricas clave

**Imports y Exports**- API endpoint `/api/analytics/covers` para datos de ocupación

- Eliminados imports sin uso en toda la aplicación- Componente `AnalyticsDashboard` con gráficos interactivos

- Corregidos warnings de React Hooks- Filtros por rango de fecha

- Limpieza de dependencias circulares- Métricas: ocupación promedio, tiempo de rotación, revenue



#### 📝 Cambiado#### Changed

- Sidebar navigation actualizado con sección de Analítica

**Estructura de Archivos**- `table-store` extendido con tracking de covers

```

Antes:---

- 20+ archivos .md en la raíz

- Documentación dispersa## [0.3.0] - 2024-11-XX

- Archivos de debug mezclados

### M3 - Sistema de Pedidos

Después:

- Solo README, CHANGELOG y CONTRIBUTING en raíz#### Added

- Documentación organizada en /docs- **Orders Management**

- Archivos temporales en /docs/archive  - `OrderStore` con persistencia y validaciones

- Estructura profesional y mantenible  - API endpoint `/api/order` (GET, POST, PATCH)

```  - Order status workflow: pendiente → preparando → servido → completado

  - Validación de stock

**Configuración del Proyecto**  - Cálculo automático de totales, descuentos, propinas, impuestos

- `.eslintrc.json` actualizado con reglas pragmáticas

- `package.json` con nombre descriptivo- **Frontend Components**

- Configuración lista para producción  - `OrdersPanel` - Panel principal de gestión de pedidos

  - `OrderForm` - Formulario de creación de pedidos

---  - Real-time order updates via WebSocket



## [0.6.0] - 2025-01-10- **Menu Integration**

  - API endpoints `/api/menu/*` para gestión de menú

### M6 - Sistema de Pedidos por QR  - `MenuStore` con categorías, items, allergens

  - Stock management

#### ✨ Agregado

#### Changed

**Funcionalidad QR para Clientes**- WebSocket events extendidos: `order:created`, `order:updated`, `order:status_changed`

- Sistema completo de pedidos por código QR- Table states sincronizados con pedidos

- Interfaz pública sin autenticación requerida

- Carrito de compras persistente en localStorage#### Tests

- Validación de sesiones de mesa- Suite completo de tests para orders API (17 tests)

- Confirmación de pedidos con resumen- Tests de validación de payload

- Tests de transiciones de estado

**Componentes Públicos**- Tests de integración con mesas

- Página de escaneo QR `/qr/[tableId]`

- Formulario de checkout para clientes---

- Modal de personalización de items

- Página de confirmación de pedido## [0.2.0] - 2024-10-XX

- Validación de token QR

### M2 - Gestión de Mesas

**APIs**

- `/api/qr/validate` - Validación de tokens QR#### Added

- `/api/order/qr` - Creación de pedidos desde QR- **Table Management**

- Sistema de sesiones para mesas  - `TableStore` con state machine para transiciones

  - API endpoints `/api/tables/*` para CRUD de mesas

#### 🔒 Seguridad  - Table layout editor con drag & drop

- Validación de tokens QR  - Estados de mesa: libre → reservada → ocupada → cuenta_solicitada → pagando → libre

- Expiración de sesiones

- Sanitización de datos de cliente- **Components**

- Rate limiting en endpoints públicos  - `TableList` - Lista de mesas con filtros

  - `TableMap` - Vista visual del salón

---  - `SalonLiveView` - Vista en tiempo real del salón

  - Editor de layout de mesas

## [0.5.0] - 2025-01-09

- **Real-time Features**

### M5 - Integración de Pagos (MercadoPago)  - WebSocket integration para actualizaciones en tiempo real

  - Eventos: `table:created`, `table:updated`, `table:state_changed`

#### ✨ Agregado

#### Tests

**Integración de Pagos**- Tests de table API (4 tests)

- Integración completa con MercadoPago Checkout Pro- Tests de state transitions

- `PaymentStore` para gestión de pagos con persistencia- Tests de table layout

- `PaymentService` para lógica de negocio

- Endpoints de API: `/api/payment/*`---

- Webhook de MercadoPago con validación de firma

## [0.1.0] - 2024-09-XX

**Componentes Frontend**

- `CheckoutButton` - Botón de pago con estados de carga### M1 - Estructura Base

- `PaymentModal` - Modal de checkout

- Páginas de resultado: success, failure, pending#### Added

- Hook `usePayment` para gestión de estado- **Project Setup**

  - Next.js 14.2 con App Router

**Actualizaciones en Tiempo Real**  - TypeScript 5 con strict mode

- Eventos WebSocket para pagos: `payment:created`, `payment:updated`  - Tailwind CSS + shadcn/ui components

- Sincronización automática del estado de pagos  - Vitest + React Testing Library setup

  - ESLint configuration

#### 📚 Documentación

- Documentación de API de pagos- **Authentication**

- Diagrama de flujo de pagos  - `AuthContext` para gestión de sesión

- Guía de configuración de MercadoPago  - `ProtectedRoute` component

  - Login page con mock authentication

#### 🔒 Seguridad  - Middleware para protección de rutas

- Validación de firma de webhook

- Secrets en variables de entorno- **Core Components**

- Tokens no expuestos en frontend  - `DashboardLayout` - Layout principal con sidebar

  - `SidebarNav` - Navegación lateral

---  - `LoadingSpinner` - Componente de carga

  - `ErrorBoundary` - Manejo de errores

## [0.4.0] - 2024-12-XX

- **Infrastructure**

### M4 - Analíticas y Reportes  - Socket.io integration setup

  - Mock data utilities

#### ✨ Agregado  - Basic routing structure

  - Global styles y theme

**Dashboard de Analíticas**

- Métricas clave de ocupación y ventas#### Documentation

- API endpoint `/api/analytics/covers`- PROJECT_GUIDELINES.md

- Componente `AnalyticsDashboard` con gráficos- PROJECT_OVERVIEW.md

- Filtros por rango de fechas- AGENTS.md para GitHub Copilot

- Métricas: ocupación promedio, tiempo de rotación, ingresos

---

**Visualizaciones**

- Gráficos interactivos con recharts## Leyenda

- Datos en tiempo real

- Comparativas por períodos- `Added` - Nuevas funcionalidades

- `Changed` - Cambios en funcionalidades existentes

---- `Deprecated` - Funcionalidades que serán removidas

- `Removed` - Funcionalidades removidas

## [0.3.0] - 2024-11-XX- `Fixed` - Bug fixes

- `Security` - Mejoras de seguridad

### M3 - Sistema de Pedidos- `Tests` - Adiciones o cambios en tests



#### ✨ Agregado---



**Gestión de Pedidos****Formato de versiones**: MAJOR.MINOR.PATCH

- `OrderStore` con persistencia y validaciones- **MAJOR**: Cambios incompatibles de API

- API endpoint `/api/order` (GET, POST, PATCH)- **MINOR**: Nuevas funcionalidades (backwards compatible)

- Flujo de estados: pendiente → preparando → servido → completado- **PATCH**: Bug fixes (backwards compatible)

- Validación de stock
- Cálculo automático de totales

**Componentes Frontend**
- `OrdersPanel` - Panel principal de pedidos
- `OrderForm` - Formulario de creación
- Actualizaciones en tiempo real via WebSocket

**Integración de Menú**
- Endpoints `/api/menu/*` para gestión de menú
- `MenuStore` con categorías e items
- Gestión de stock

#### 🧪 Tests
- Suite completa de tests para API de pedidos (17 tests)
- Tests de validación de payload
- Tests de transiciones de estado

---

## [0.2.0] - 2024-10-XX

### M2 - Gestión de Mesas

#### ✨ Agregado

**Gestión de Mesas**
- `TableStore` con máquina de estados
- API endpoints `/api/tables/*` para CRUD
- Editor de layout con drag & drop
- Estados: libre → reservada → ocupada → cuenta_solicitada → pagando → libre

**Componentes**
- `TableList` - Lista de mesas con filtros
- `TableMap` - Vista visual del salón
- `SalonLiveView` - Vista en tiempo real
- Editor de layout de mesas

**Funcionalidad en Tiempo Real**
- Integración WebSocket para actualizaciones
- Eventos: `table:created`, `table:updated`, `table:state_changed`

---

## [0.1.0] - 2024-09-XX

### M1 - Estructura Base y Autenticación

#### ✨ Agregado

**Configuración del Proyecto**
- Next.js 14.2 con App Router
- TypeScript 5 con modo estricto
- Tailwind CSS + componentes shadcn/ui
- Configuración de Vitest + React Testing Library
- Integración con Supabase

**Autenticación**
- Integración con Supabase Auth
- `AuthContext` para gestión de sesión
- Componente `ProtectedRoute`
- Página de login y registro
- Middleware para protección de rutas

**Componentes Core**
- `DashboardLayout` - Layout principal con sidebar
- `SidebarNav` - Navegación lateral
- `LoadingSpinner` - Componente de carga
- `ErrorBoundary` - Manejo de errores
- Sistema de temas claro/oscuro

**Infraestructura**
- Configuración de WebSocket
- Utilidades de datos mock
- Estructura básica de rutas
- Estilos globales y tema

---

## Leyenda

- ✨ **Agregado** - Nuevas funcionalidades
- 📝 **Cambiado** - Cambios en funcionalidades existentes
- 🗑️ **Deprecado** - Funcionalidades que serán removidas
- ❌ **Removido** - Funcionalidades removidas
- 🐛 **Corregido** - Corrección de bugs
- 🔒 **Seguridad** - Mejoras de seguridad
- 🧪 **Tests** - Adiciones o cambios en tests
- ♻️ **Optimizado** - Mejoras de performance o código
- 📚 **Documentación** - Cambios en documentación
- 🌍 **Internacionalización** - Cambios de idioma o localización

---

**Formato de Versiones**: MAJOR.MINOR.PATCH
- **MAJOR**: Cambios incompatibles de API
- **MINOR**: Nuevas funcionalidades (compatible con versiones anteriores)
- **PATCH**: Correcciones de bugs (compatible con versiones anteriores)

---

**Mantenedor:** Álvaro (@AlvaFG)  
**Repositorio:** [restaurant-digital](https://github.com/AlvaFG/restaurant-digital)  
**Licencia:** MIT
