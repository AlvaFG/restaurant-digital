# Sistema de Gestión para Restaurantes

> Sistema de gestión integral para restaurantes con funcionalidades de pedidos en tiempo real, pagos en línea, administración de mesas y analíticas.

[![Next.js](https://img.shields.io/badge/Next.js-14.2-black)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue)](https://www.typescriptlang.org/)
[![Production Ready](https://img.shields.io/badge/status-production%20ready-brightgreen)](./PROJECT_STATUS.md)
[![Licencia](https://img.shields.io/badge/licencia-MIT-green)](./LICENSE)

## 🚀 Quick Start

```bash
# 1. Clonar e instalar
git clone https://github.com/AlvaFG/restaurant-digital.git
cd restaurant-digital
npm install

# 2. Configurar entorno
cp .env.example .env.local
# Editar .env.local con tus credenciales

# 3. Iniciar desarrollo
npm run dev
# → http://localhost:3000
```

## 📊 Estado del Proyecto

**✅ Production Ready** - Ver [Estado Completo](./PROJECT_STATUS.md)

- **168 tests** (100% passing, 92.71% coverage)
- **Bundle optimizado** (87.6 kB, -69% vs baseline)
- **TypeScript strict** (100% type-safe)
- **6 sprints completados** (M1-M6)

## 🍽️ Características Principales

- **📋 Gestión de Pedidos**: Sistema de pedidos en tiempo real con WebSocket
- **💳 Pagos en Línea**: Integración con MercadoPago (Checkout Pro)
- **🪑 Administración de Mesas**: Control completo del estado de mesas y salón
- **📊 Analíticas**: Dashboards y reportes de ocupación y ventas
- **📱 Pedidos por QR**: Los clientes pueden ordenar escaneando códigos QR
- **🔔 Alertas**: Sistema de notificaciones en tiempo real
- **👥 Gestión de Usuarios**: Control de roles y permisos
- **🎨 Tematización**: Personalización de marca y colores
- **🔐 Autenticación**: Integración con Supabase Auth

## 🚀 Inicio Rápido

### Prerrequisitos

- Node.js 18+ 
- npm, pnpm o yarn
- Cuenta de Supabase (para autenticación y base de datos)

### Instalación

```bash
# 1. Clonar el repositorio
git clone https://github.com/AlvaFG/restaurant-digital.git
cd restaurant-digital

# 2. Instalar dependencias
npm install

# 3. Configurar variables de entorno
cp .env.example .env.local
# Editar .env.local con tus credenciales de Supabase y MercadoPago

# 4. Iniciar servidor de desarrollo
npm run dev

# 5. Abrir en navegador
# http://localhost:3000
```

## 🛠️ Stack Tecnológico

**Frontend:** Next.js 14.2 • React 18 • TypeScript 5 • Tailwind CSS 4  
**Backend:** Supabase (PostgreSQL) • Supabase Auth • RLS  
**State:** React Query v5 • Optimistic Updates  
**Pagos:** MercadoPago Checkout Pro  
**Testing:** Vitest • Playwright • 168 tests

Ver [documentación completa](./docs/docs_index.md) para detalles técnicos.

---

## 📚 Documentación

### 📖 Acceso Rápido
- **[� Índice Completo](./DOCS_INDEX.md)** - 🌟 Navegación guiada por toda la documentación
- **[�📊 Estado del Proyecto](./PROJECT_STATUS.md)** - Visión general y métricas actuales
- **[�️ Roadmap](./ROADMAP.md)** - Planificación y próximas funcionalidades
- **[🤝 Guía de Contribución](./CONTRIBUTING.md)** - Cómo contribuir al proyecto
- **[📝 Changelog](./CHANGELOG.md)** - Historial de cambios por versión

### 🎯 Por Rol
- **Desarrollador:** [Quick Start](#-quick-start) → [DOCS_INDEX](./DOCS_INDEX.md)
- **Product:** [PROJECT_STATUS](./PROJECT_STATUS.md) → [ROADMAP](./ROADMAP.md)
- **QA:** [Testing](#-testing--quality) → [docs/guia/testing.md](./docs/guia/testing.md)

---

## 🧪 Testing & Quality

```bash
# Ejecutar tests (168 tests)
npm run test

# Tests con coverage (92.71% functions)
npm run test -- --coverage

# Lint y type checking
npm run lint
npm run build
```

**Métricas Actuales:**
- ✅ 168 tests (100% passing)
- ✅ 92.71% function coverage
- ✅ 0 TypeScript errors
- ✅ 0 ESLint errors
- ✅ Production build OK

Ver [resultados completos](./PROJECT_STATUS.md#-métricas-de-calidad) para más detalles.

---

## 📁 Estructura del Proyecto

```
restaurant-management/
├── app/              # Next.js App Router (páginas y API routes)
├── components/       # Componentes React + shadcn/ui
├── contexts/         # React Contexts (Auth, etc.)
├── hooks/            # Custom React Hooks
├── lib/              # Utilidades y lógica de negocio
├── docs/             # 📚 Documentación completa
│   ├── setup/        # Guías de instalación
│   ├── architecture/ # Arquitectura del sistema
│   ├── api/          # Documentación de APIs
│   ├── guia/         # Guías prácticas
│   └── historial/    # Sprints y reportes históricos
├── supabase/         # Migraciones y config
└── tests/            # Tests (Vitest + Playwright)
```

---

## 🔐 Variables de Entorno

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=tu_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=tu_key
SUPABASE_SERVICE_ROLE_KEY=tu_service_key

# MercadoPago
MERCADOPAGO_ACCESS_TOKEN=tu_token
NEXT_PUBLIC_MERCADOPAGO_PUBLIC_KEY=tu_public_key

# App
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

Ver [guía completa de variables](./docs/setup/environment-variables.md).

---

## 🤝 Contribuir

Las contribuciones son bienvenidas! Ver [CONTRIBUTING.md](./CONTRIBUTING.md) para:
- Convenciones de código
- Flujo de Pull Request
- Estándares de testing
- Guía de estilo

---

## 📄 Licencia

Este proyecto está bajo la licencia MIT. Ver [LICENSE](./LICENSE) para detalles.

---

## 👥 Autor

**Álvaro** - [@AlvaFG](https://github.com/AlvaFG)

---

**Hecho con ❤️ para la industria gastronómica**

---

**Versión:** 1.0.0  
**Última actualización:** Noviembre 3, 2025  
**Estado:** ✅ [Production Ready](./PROJECT_STATUS.md)
