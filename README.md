# Sistema de Gestión para Restaurantes

> Sistema de gestión integral para restaurantes con funcionalidades de pedidos en tiempo real, pagos en línea, administración de mesas y analíticas.

[![Next.js](https://img.shields.io/badge/Next.js-14.2-black)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue)](https://www.typescriptlang.org/)
[![Licencia](https://img.shields.io/badge/licencia-MIT-green)](./LICENSE)

## 🍽️ Características

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

- **Framework**: [Next.js 14.2](https://nextjs.org/) (App Router)
- **Lenguaje**: [TypeScript 5](https://www.typescriptlang.org/)
- **Estilos**: [Tailwind CSS 4](https://tailwindcss.com/) + [shadcn/ui](https://ui.shadcn.com/)
- **Base de Datos**: [Supabase](https://supabase.com/) (PostgreSQL)
- **Autenticación**: [Supabase Auth](https://supabase.com/auth)
- **State Management**: [React Query (TanStack Query)](https://tanstack.com/query) v5
- **Tiempo Real**: WebSocket para actualizaciones en vivo
- **Pagos**: [MercadoPago](https://www.mercadopago.com.ar/) (Checkout Pro)
- **Testing**: [Vitest](https://vitest.dev/) + [Playwright](https://playwright.dev/)

## ✅ Métricas de Calidad

### 🧪 Testing & Cobertura

- **168 tests** (143 unit + 25 integration)
- **92.71% function coverage** 🎯
- **88.18% branch coverage** (industry standard: 75%)
- **57.1% statement coverage**
- **100% passing** ✅
- **14.35s** execution time total

```bash
# Ejecutar tests con coverage
npm run test -- --coverage
```

Ver detalles completos en [Testing Results](./docs/TESTING_RESULTS.md)

### ⚡ Performance & Bundle

- **Bundle Shared**: 87.6 kB (< 100 kB target 🎯)
- **Middleware**: 67.3 kB
- **Code Splitting**: 6 heavy components optimized
- **Avg Page Size**: 1.6 kB (code split pages)
- **Production Build**: ✅ 60 routes generated
- **Bundle Reduction**: -69% vs baseline

**Code Splitting Implementado**:
- ✅ `TableMap` - Dynamic canvas rendering
- ✅ `OrdersPanel` + `OrderForm` - Order management
- ✅ `AnalyticsDashboard` - Charts & visualizations
- ✅ `QRManagementPanel` - QR generation & monitoring
- ✅ `ConfigurationPanel` - Complex configuration UI

Ver implementación en [Code Splitting Report](./docs/OPCION_A_COMPLETADA.md)

### 🚀 React Query Integration

- ✅ **Smart caching** (5min stale time)
- ✅ **Optimistic updates** (0ms UI latency)
- ✅ **80% reduction** in duplicate requests
- ✅ **Automatic deduplication** de queries
- ✅ **Background refetching** para datos frescos
- ✅ **Offline support** con cache persistence

**Hooks con React Query**:
- `useTables` - Gestión de mesas con optimistic updates
- `useZones` - Gestión de zonas del salón
- `useOrders` - Sistema de pedidos en tiempo real
- `useAlerts` - Notificaciones y alertas
- `useMenu` - Catálogo de productos
- `useTableLayout` - Layout visual del salón

Ver documentación completa en [React Query Migration](./docs/REACT_QUERY_MIGRATION.md)

### 📊 Métricas de Desarrollo

| Métrica | Valor | Benchmark |
|---------|-------|-----------|
| **Type Safety** | 100% | TypeScript strict mode |
| **Linting** | ESLint + Prettier | 0 errors |
| **Build Time** | ~45s | Next.js optimized |
| **Hot Reload** | <1s | Fast Refresh |
| **Test Coverage** | 92.71% functions | >80% standard |
| **Bundle Size** | 87.6 kB shared | <100 kB target |

## 📁 Estructura del Proyecto

```
restaurant-management/
├── app/                    # Next.js App Router (páginas y rutas API)
│   ├── (public)/           # Rutas públicas (QR, etc.)
│   ├── dashboard/          # Panel principal
│   ├── pedidos/            # Gestión de pedidos
│   ├── mesas/              # Gestión de mesas
│   ├── menu/               # Gestión de menú
│   ├── usuarios/           # Gestión de usuarios
│   ├── analitica/          # Analíticas y reportes
│   ├── login/              # Autenticación
│   └── api/                # Rutas API
├── components/             # Componentes React
│   └── ui/                 # Componentes UI primitivos (shadcn)
├── contexts/               # Contextos de React (Auth, etc.)
├── hooks/                  # Hooks personalizados de React
├── lib/                    # Utilidades y lógica de negocio
│   ├── server/             # Lógica del servidor (stores, servicios)
│   ├── supabase/           # Cliente y tipos de Supabase
│   ├── i18n/               # Internacionalización (español)
│   └── __tests__/          # Tests unitarios
├── docs/                   # Documentación del proyecto
│   ├── api/                # Documentación de APIs
│   ├── architecture/       # Arquitectura del sistema
│   ├── features/           # Documentación de funcionalidades
│   ├── guidelines/         # Guías y directrices
│   └── setup/              # Guías de instalación
├── public/                 # Assets estáticos
├── scripts/                # Scripts de utilidades
├── supabase/               # Migraciones y configuración de Supabase
└── tests/                  # Tests E2E (Playwright)
```

## 📚 Documentación

### 📖 Índice Principal
- **[📚 Índice de Documentación](docs/docs_index.md)** - ⭐ Punto de entrada principal a toda la documentación

### 🚀 Enlaces Rápidos
- **[Descripción General](docs/PROJECT_OVERVIEW.md)** - Vista general del proyecto
- **[Guía de Instalación](docs/setup/)** - Instalación detallada paso a paso
- **[Arquitectura](docs/architecture/)** - Arquitectura del sistema
- **[Referencia de API](docs/api/)** - Documentación de APIs
- **[Guías Prácticas](docs/guia/)** - Guías de implementación y mejores prácticas
- **[Referencias Técnicas](docs/referencias/)** - Roles, permisos, flujos
- **[Contribuir](CONTRIBUTING.md)** - Guía para contribuidores

### 📈 Reportes de Calidad
- **[Testing Results](./docs/TESTING_RESULTS.md)** - Resultados completos de testing (168 tests)
- **[Code Splitting Report](./docs/OPCION_A_COMPLETADA.md)** - Implementación y mejoras de performance
- **[React Query Migration](./docs/REACT_QUERY_MIGRATION.md)** - Migración a React Query v5
- **[Phase 4 Summary](./docs/FASE_4_PROXIMOS_PASOS.md)** - Resumen de Fase 4 (Testing + Performance)

### 📂 Documentación Organizada

La documentación está organizada en categorías:

```
docs/
├── docs_index.md          # 📚 Índice maestro
├── guia/                  # 📖 Guías prácticas
├── referencias/           # 📖 Documentación de referencia
├── setup/                 # 🔧 Instalación y configuración
├── architecture/          # 🏗️ Diseño del sistema
├── api/                   # 🔌 Documentación de APIs
├── features/              # ✨ Funcionalidades
├── database/              # 🗄️ Schema y migraciones
└── historial/             # 📜 Registro histórico
```

> **💡 Consejo**: Comienza por el [Índice de Documentación](docs/docs_index.md) para una navegación fácil.

## 📊 Estado del Proyecto

- ✅ **M1**: Estructura base y autenticación con Supabase
- ✅ **M2**: Gestión de mesas y zonas
- ✅ **M3**: Sistema de pedidos
- ✅ **M4**: Analíticas y reportes
- ✅ **M5**: Integración de pagos (MercadoPago)
- ✅ **M6**: Sistema de pedidos por QR completado

Ver [Roadmap completo](docs/roadmap/milestones.md) para más detalles.

## 🧪 Testing

### Ejecutar Tests

```bash
# Tests unitarios e integración (168 tests)
npm run test

# Tests con cobertura completa
npm run test -- --coverage

# Tests específicos de hooks
npm run test -- tests/hooks

# Tests de integración
npm run test -- tests/integration

# Tests en modo watch (desarrollo)
npm run test -- --watch

# Tests E2E con Playwright (opcional)
npm run test:e2e

# Tests E2E con interfaz visual
npm run test:e2e:ui
```

### Suites de Testing

#### Unit Tests (143 tests)
- `tests/hooks/use-tables.test.tsx` - 16 tests (gestión de mesas)
- `tests/hooks/use-zones.test.tsx` - 18 tests (gestión de zonas)
- `tests/hooks/use-orders.test.tsx` - 22 tests (sistema de pedidos)
- `tests/hooks/use-alerts.test.tsx` - 23 tests (sistema de alertas)
- `tests/hooks/use-menu.test.tsx` - 44 tests (catálogo de menú)
- `tests/hooks/use-table-layout.test.tsx` - 20 tests (layout del salón)

#### Integration Tests (25 tests)
- `tests/integration/tables-zones.test.tsx` - 8 tests (mesas + zonas)
- `tests/integration/orders-menu.test.tsx` - 8 tests (pedidos + menú)
- `tests/integration/alerts-orders.test.tsx` - 9 tests (alertas + pedidos)

### Quality Gates

✅ **All tests must pass** - 100% passing required  
✅ **Function coverage >90%** - Currently 92.71%  
✅ **Branch coverage >80%** - Currently 88.18%  
✅ **No type errors** - TypeScript strict mode  
✅ **No linting errors** - ESLint configured

```bash
# Verificar quality gates
npm run lint
npm run test -- --coverage
npm run build
```

## 🔐 Variables de Entorno

Crear archivo `.env.local` basado en `.env.example`:

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=tu_url_de_supabase
NEXT_PUBLIC_SUPABASE_ANON_KEY=tu_clave_anonima
SUPABASE_SERVICE_ROLE_KEY=tu_clave_de_servicio

# MercadoPago
MERCADOPAGO_ACCESS_TOKEN=tu_token_de_acceso
NEXT_PUBLIC_MERCADOPAGO_PUBLIC_KEY=tu_clave_publica

# Aplicación
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

Ver [Guía de Variables de Entorno](docs/setup/environment-variables.md) para más detalles.

## 🤝 Contribuir

¡Las contribuciones son bienvenidas! Por favor lee [CONTRIBUTING.md](CONTRIBUTING.md) para conocer nuestras convenciones y proceso de Pull Request.

### Flujo de contribución

1. Hacer fork del proyecto
2. Crear una rama de funcionalidad (`git checkout -b feature/CaracteristicaAsombrosa`)
3. Hacer commit de tus cambios (`git commit -m 'feat(scope): agregar característica asombrosa'`)
4. Hacer push a la rama (`git push origin feature/CaracteristicaAsombrosa`)
5. Abrir un Pull Request

## 🌍 Internacionalización

El proyecto está completamente en **español**, incluyendo:
- Interfaz de usuario
- Mensajes de error
- Logs del sistema
- Documentación
- Comentarios en el código

## 📄 Licencia

Este proyecto está bajo la licencia MIT. Ver [LICENSE](LICENSE) para más detalles.

## 👥 Autores

- **Álvaro** - [AlvaFG](https://github.com/AlvaFG)

## 🙏 Agradecimientos

- [Next.js](https://nextjs.org/) por el excelente framework
- [Supabase](https://supabase.com/) por la infraestructura de backend
- [shadcn/ui](https://ui.shadcn.com/) por los componentes UI
- [MercadoPago](https://www.mercadopago.com.ar/) por la integración de pagos
- [Vercel](https://vercel.com/) por el hosting

---

**Hecho con ❤️ para la industria gastronómica**

---

## 📈 Estado del Desarrollo

### Fase 4 Completada (98%) ✅

**Logros Recientes**:
- ✅ React Query v5 integrado en todos los hooks
- ✅ 168 tests implementados (100% passing)
- ✅ Code splitting en 6 componentes pesados
- ✅ Bundle optimizado: 87.6 kB shared (< 100 kB)
- ✅ Type guards completos para validación en runtime
- ✅ Production build exitoso (60 rutas)

**Métricas de Calidad**:
- Testing: 168 tests, 92.71% function coverage
- Performance: Bundle -69% vs baseline
- Type Safety: 100% TypeScript strict mode
- Build: 0 errors, production ready

Ver [Fase 4 Summary](./docs/FASE_4_PROXIMOS_PASOS.md) para detalles completos.

---

**Versión:** 1.0.0  
**Última actualización:** Octubre 16, 2025  
**Estado:** ✅ Production Ready
