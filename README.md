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
- **Tiempo Real**: WebSocket para actualizaciones en vivo
- **Pagos**: [MercadoPago](https://www.mercadopago.com.ar/) (Checkout Pro)
- **Testing**: [Vitest](https://vitest.dev/) + [Playwright](https://playwright.dev/)

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

```bash
# Ejecutar todos los tests unitarios
npm run test

# Tests con cobertura
npm run test -- --coverage

# Tests en modo watch
npm run test -- --watch

# Tests E2E con Playwright
npm run test:e2e

# Tests E2E con interfaz
npm run test:e2e:ui

# Linter
npm run lint

# Build de producción
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

**Versión:** 1.0.0  
**Última actualización:** Octubre 2025  
**Estado:** ✅ Producción
