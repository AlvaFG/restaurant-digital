# Project Overview – Restaurante Digital (Tablets + QR)

Este documento describe la visión global del proyecto, tecnologías principales, arquitectura y estructura del repositorio.

---

## 1. Objetivo
Desarrollar un sistema digital para restaurantes que permita a los clientes:
- Ver el menú en tablets o mediante un QR desde su celular (PWA).
- Hacer pedidos directamente desde la mesa.
- Realizar pagos digitales de forma rápida y segura (**pago único**).
- Registrar la cantidad de cubiertos por mesa para métricas.
- Generar métricas para el administrador: ventas por categoría/producto y cubiertos atendidos.

Staff y administradores podrán:
- Ver estados de mesa (`libre`, `ocupada`, `pago`).
- Recibir notificaciones cuando los clientes llamen al mozo o paguen.
- Marcar mesas como libres.
- Configurar el menú, categorías y precios.
- Acceder a reportes y analíticas.

---

## 2. Stack Tecnológico

### Frontend
- **Framework**: React + Next.js (SSR y PWA).
- **Styling**: TailwindCSS + tokens definidos por UI Designer.
- **UI components**: Storybook para catálogo y pruebas visuales.
- **Estado**: Zustand o Redux Toolkit para manejo local.
- **PWA**: soporte offline, instalable en móviles.

### Mobile (Tablet App)
- **Framework**: Flutter (Android en modo kiosk, futuro soporte iOS).
- **Features clave**:
  - Modo kiosk (pantalla bloqueada).
  - Integración con APIs de backend.
  - Soporte NFC para pagos (Google Pay, Apple Pay).

### Backend
- **Framework**: Node.js + NestJS (arquitectura modular).
- **DB**: PostgreSQL (consistencia, relaciones).
- **ORM**: Prisma.
- **Auth**: JWT tokens ligados al `mesaId`.
- **Real-time**: WebSockets (llamadas de mozo, actualización de estado de mesa).
- **Docs**: OpenAPI (Swagger).

### Infraestructura
- **Contenedores**: Docker + Docker Compose.
- **CI/CD**: GitHub Actions (lint, test, build, deploy).
- **Despliegue inicial**: VPS / cloud (DigitalOcean, AWS ECS/EKS, o Railway como opción rápida).
- **Monitoring**: Grafana + Prometheus.

---

## 3. Estados de Mesa
- `libre`: mesa disponible.
- `ocupada`: pedido en curso.
- `pago`: pago confirmado, staff/admin deben limpiar y luego marcan la mesa como libre.

Cada pedido incluye **cantidad de cubiertos** seleccionada al inicio.

---

## 4. Analíticas
- **Cubiertos**: total diario, filtrado por mesa o período.
- **Ventas**:
  - Por categoría (ej. bebidas, entradas, principales).
  - Por producto específico.
  - Por precio promedio.

Reportes estarán disponibles en el **panel admin**.

---

## 5. Estructura de Repositorio

apps/
admin-panel/ # Panel web para staff y admin
tablet-android/ # App Flutter para tablets
pwa-client/ # PWA accesible desde QR

packages/
ui/ # Componentes de interfaz (React, tokens, Storybook)
lib/ # Lógica de negocio, contratos tipados
api/ # Backend (NestJS + Prisma)

docs/
api/ # OpenAPI, guías de integración
ux/ # Flujos y wireframes
design-system/ # Tokens de UI y estilos
analytics/ # Definición de métricas y reportes

infra/
docker/ # Dockerfiles y docker-compose
ci/ # Pipelines CI/CD
scripts/ # Scripts de despliegue y utilidades

.codex/
agents/ # Roles genéricos de Codex CLI
AGENTS.md
PROJECT_OVERVIEW.md
PROJECT_GUIDELINES.md
STYLE_GUIDE.md
BRANCHING.md
WORKFLOWS.md


---

## 6. Convenciones
- **Commits**: Conventional Commits.
- **Versionado**: SemVer (`major.minor.patch`).
- **Branches**: main (estable), dev (integración), feature/*.
- **Tests**:
  - Unit tests en lib y backend.
  - E2E para flujos clave (pedido, pago, cambio de mesa).
- **Docs**: en Markdown, dentro de `docs/`.

---

## 7. Integraciones Externas
- **Pagos**: Google Pay API, Apple Pay, Mercado Pago, Modo, Stripe.
- **QR**: generación de códigos con librerías estándar en backend.
- **Notificaciones staff**: WebSockets / push notifications.

---

## 8. Seguridad y Compliance
- PCI DSS en manejo de pagos.
- Tokens opacos para identificar sesiones de mesa.
- Logs de auditoría para pedidos, pagos y cambios de estado de mesa.
- Sanitización y validación de entradas/salidas en backend.

---

## 9. Roadmap Inicial
1. **MVP Backend + Admin Panel** (APIs, mesas, productos, staff).
2. **PWA Cliente (QR)** con pedidos y pagos básicos.
3. **Tablet App (Android)** con mismas features que la PWA.
4. **Métricas**: cubiertos + ventas en admin panel.
5. **Pagos avanzados**: soporte NFC y wallets digitales.
