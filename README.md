# Restaurant Management System

> Sistema de gestión integral para restaurantes con funcionalidades de pedidos en tiempo real, pagos online, administración de mesas y analytics.

[![Next.js](https://img.shields.io/badge/Next.js-14.2-black)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue)](https://www.typescriptlang.org/)
[![License](https://img.shields.io/badge/license-MIT-green)](./LICENSE)

## 🍽️ Características

- **📋 Gestión de Pedidos**: Sistema de pedidos en tiempo real con WebSocket
- **💳 Pagos Online**: Integración con MercadoPago (Checkout Pro)
- **🪑 Administración de Mesas**: Control completo del estado de mesas y salón
- **📊 Analytics**: Dashboards y reportes de ocupación y ventas
- **📱 Ordenamiento QR**: Los clientes pueden ordenar escaneando códigos QR
- **🔔 Alertas**: Sistema de notificaciones en tiempo real
- **👥 Gestión de Usuarios**: Control de roles y permisos
- **🎨 Tematización**: Personalización de marca y colores

## 🚀 Quick Start

### Prerequisitos

- Node.js 18+ 
- npm o pnpm

### Instalación

```bash
# 1. Clonar el repositorio
git clone https://github.com/AlvaFG/restaurant-digital.git
cd restaurant-digital

# 2. Instalar dependencias
npm install

# 3. Configurar variables de entorno
cp .env.example .env.local
# Editar .env.local con tus credenciales

# 4. Iniciar servidor de desarrollo
npm run dev

# 5. Abrir en navegador
# http://localhost:3000
```

## 🛠️ Tech Stack

- **Framework**: [Next.js 14.2](https://nextjs.org/) (App Router)
- **Language**: [TypeScript 5](https://www.typescriptlang.org/)
- **Styling**: [Tailwind CSS](https://tailwindcss.com/) + [shadcn/ui](https://ui.shadcn.com/)
- **Realtime**: [Socket.io](https://socket.io/) (WebSocket)
- **Payments**: [MercadoPago](https://www.mercadopago.com.ar/) (Checkout Pro)
- **Testing**: [Vitest](https://vitest.dev/) + [React Testing Library](https://testing-library.com/)

## 📁 Estructura del Proyecto

```
restaurant-management/
├── app/                    # Next.js App Router (pages & API routes)
│   ├── dashboard/          # Dashboard principal
│   ├── pedidos/            # Gestión de pedidos
│   ├── mesas/              # Gestión de mesas
│   ├── menu/               # Gestión de menú
│   ├── usuarios/           # Gestión de usuarios
│   ├── analitica/          # Analytics y reportes
│   └── api/                # API routes
├── components/             # Componentes React
│   └── ui/                 # Componentes UI primitivos (shadcn)
├── contexts/               # React Contexts (Auth, etc.)
├── hooks/                  # Custom React hooks
├── lib/                    # Utilidades y lógica de negocio
│   ├── server/             # Lógica del servidor (stores, services)
│   └── __tests__/          # Tests unitarios
├── docs/                   # Documentación del proyecto
├── public/                 # Assets estáticos
└── styles/                 # Estilos globales
```

## 📚 Documentación

- **[Setup Guide](docs/setup/installation.md)** - Guía de instalación detallada
- **[Architecture](docs/architecture/overview.md)** - Arquitectura del sistema
- **[API Reference](docs/api/README.md)** - Documentación de APIs
- **[Features](docs/features/README.md)** - Documentación de features
- **[Contributing](CONTRIBUTING.md)** - Guía para contribuidores

## 📊 Estado del Proyecto

- ✅ **M1**: Estructura base y autenticación
- ✅ **M2**: Gestión de mesas
- ✅ **M3**: Sistema de pedidos
- ✅ **M4**: Analytics y reportes
- ✅ **M5**: Integración de pagos (MercadoPago)
- 🚧 **M6**: Ordenamiento QR (en progreso)

Ver [Roadmap completo](docs/roadmap/milestones.md) para más detalles.

## 🧪 Testing

```bash
# Ejecutar todos los tests
npm run test

# Tests con coverage
npm run test -- --coverage

# Tests en modo watch
npm run test -- --watch

# Linter
npm run lint

# Build de producción
npm run build
```

## 📊 Coverage Actual

- **Total**: 58 passing / 73 tests
- **Status**: 
  - ✅ Build: Passing
  - ⚠️ Tests: 15 failing (payment-store file I/O, socket-client mocks)
  - ✅ Lint: 1 warning (unused var in test)

## 🔐 Variables de Entorno

Crear archivo `.env.local` basado en `.env.example`:

```env
# MercadoPago
MERCADOPAGO_ACCESS_TOKEN=your_access_token
MERCADOPAGO_PUBLIC_KEY=your_public_key
NEXT_PUBLIC_MERCADOPAGO_PUBLIC_KEY=your_public_key

# WebSocket
NEXT_PUBLIC_SOCKET_URL=http://localhost:3000

# App
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

Ver [Environment Variables Guide](docs/setup/environment-variables.md) para más detalles.

## 🤝 Contribuir

Las contribuciones son bienvenidas! Por favor lee [CONTRIBUTING.md](CONTRIBUTING.md) para conocer nuestras convenciones y proceso de PR.

### Flujo de contribución

1. Fork el proyecto
2. Crea una feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit tus cambios (`git commit -m 'feat(scope): add amazing feature'`)
4. Push al branch (`git push origin feature/AmazingFeature`)
5. Abre un Pull Request

## 📄 Licencia

Este proyecto está bajo la licencia MIT. Ver [LICENSE](LICENSE) para más detalles.

## 👥 Autores

- **Álvaro** - [AlvaFG](https://github.com/AlvaFG)

## 🙏 Agradecimientos

- [Next.js](https://nextjs.org/) por el excelente framework
- [shadcn/ui](https://ui.shadcn.com/) por los componentes UI
- [MercadoPago](https://www.mercadopago.com.ar/) por la integración de pagos
- [Vercel](https://vercel.com/) por el hosting

---

**Hecho con ❤️ para la industria gastronómica**
