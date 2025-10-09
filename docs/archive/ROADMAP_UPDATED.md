# ROADMAP ACTUALIZADO - Restaurant Digital
**Última actualización:** 9 de octubre de 2025 - 17:30 hrs  
**Basado en:** Análisis técnico completo del proyecto

---

## 📊 Estado Actual del Proyecto: ~75% completado

### Milestones Completados ✅
- ✅ **M1:** Setup inicial & base técnica
- ✅ **M2:** Core de mesas
- ✅ **M3:** Menú digital (tablet + QR)
- ✅ **M4:** Pedidos y notificaciones (100%) - ¡Completado!

---

## 🔴 FASE CRÍTICA: Seguridad y Estabilización Pre-Producción

| Milestone | Tarea | Rama | Responsable | Prioridad | Estado |
|-----------|-------|------|-------------|-----------|--------|
| **M4 - Pedidos** | ~~Completar notificaciones WebSocket en tiempo real~~ | `feature/test-api-orders` | Lib Logic Owner | ALTA | ✅ Completado |
| **M4 - Pedidos** | ~~Implementar emisión de eventos en order-store~~ | `feature/test-api-orders` | Backend Architect | ALTA | ✅ Completado |
| **M4 - Pedidos** | ~~Validar integración real-time end-to-end~~ | `feature/test-api-orders` | API Tester | ALTA | ✅ Completado |
| **M4 - Pedidos** | ~~Ejecutar tests (58/60 passing - 96.7%)~~ | `feature/test-api-orders` | API Tester | ALTA | ✅ Completado |
| **M4 - Pedidos** | ~~Documentar API de órdenes completa~~ | `feature/test-api-orders` | API Docs Writer | ALTA | ✅ Completado |
| **M8 - Seguridad Pre-Prod** | Reemplazar auth mock con JWT real | `feature/backend-jwt-auth` | Backend Architect | **CRÍTICA** | Pendiente |
| **M8 - Seguridad Pre-Prod** | Implementar rate limiting en APIs | `feature/backend-rate-limiting` | Backend Architect | **CRÍTICA** | Pendiente |
| **M8 - Seguridad Pre-Prod** | Agregar headers de seguridad (CSP, HSTS, etc.) | `feature/infra-security-headers` | DevOps Automator | **CRÍTICA** | Pendiente |
| **M8 - Seguridad Pre-Prod** | Configurar CORS y validación de tokens | `feature/backend-cors-config` | Backend Architect | **CRÍTICA** | Pendiente |
| **M8 - Seguridad Pre-Prod** | Audit de dependencias y actualización | `feature/infra-dependency-audit` | Dependency Guardian | ALTA | Pendiente |
| **M9 - Limpieza Técnica** | Remover dependencias no utilizadas (Vue, Svelte, Remix) | `feature/infra-clean-dependencies` | Dependency Guardian | ALTA | Pendiente |
| **M9 - Limpieza Técnica** | Eliminar pnpm-lock.yaml y unificar a npm | `feature/infra-npm-only` | DevOps Automator | MEDIA | Pendiente |
| **M9 - Limpieza Técnica** | Fixear versiones en package.json (quitar "latest") | `feature/infra-lock-versions` | Dependency Guardian | ALTA | Pendiente |

---

## 🟡 FASE PRINCIPAL: Pagos y Features Core

| Milestone | Tarea | Rama | Responsable | Prioridad | Estado |
|-----------|-------|------|-------------|-----------|--------|
| **M5 - Pagos digitales** | Investigar y configurar SDK Mercado Pago | `feature/research-mercadopago` | Backend Architect | ALTA | Pendiente |
| **M5 - Pagos digitales** | Integrar backend API de Mercado Pago | `feature/backend-payments-mercadopago` | Backend Architect | ALTA | Pendiente |
| **M5 - Pagos digitales** | Crear componente de checkout en frontend | `feature/ui-payment-checkout` | Frontend Dev + UI Designer | ALTA | Pendiente |
| **M5 - Pagos digitales** | Implementar flujo de cambio de estado post-pago | `feature/lib-payment-state-flow` | Lib Logic Owner | ALTA | Pendiente |
| **M5 - Pagos digitales** | Tests E2E completos de flujo de pago | `feature/test-e2e-payments` | API Tester + Workflow Optimizer | **CRÍTICA** | Pendiente |
| **M5 - Pagos digitales** | Documentar API de pagos | `feature/docs-payments-api` | API Docs Writer | MEDIA | Pendiente |
| **M5 - Pagos digitales** | Agregar Stripe como fallback internacional | `feature/backend-payments-stripe` | Backend Architect | BAJA | Pendiente |

---

## 🟢 FASE DE OPTIMIZACIÓN: Performance y UX

| Milestone | Tarea | Rama | Responsable | Prioridad | Estado |
|-----------|-------|------|-------------|-----------|--------|
| **M10 - Performance** | Implementar lazy loading para React Konva y charts | `feature/frontend-lazy-loading` | Frontend Dev | MEDIA | Pendiente |
| **M10 - Performance** | Configurar Service Worker para offline-first | `feature/frontend-service-worker` | Frontend Dev + Mobile App Builder | MEDIA | Pendiente |
| **M10 - Performance** | Optimizar imágenes en public/ y configurar Next/Image | `feature/frontend-image-optimization` | Frontend Dev | MEDIA | Pendiente |
| **M10 - Performance** | Implementar caché HTTP y estrategia de invalidación | `feature/backend-http-cache` | Backend Architect | MEDIA | Pendiente |
| **M10 - Performance** | Separar Server Components de Client Components | `feature/frontend-rsc-optimization` | Frontend Dev | BAJA | Pendiente |
| **M11 - Accesibilidad** | Agregar skip links y navegación por teclado | `feature/frontend-a11y-keyboard` | Frontend Dev + UX Researcher | MEDIA | Pendiente |
| **M11 - Accesibilidad** | Validar contraste WCAG 2.1 AA en toda la UI | `feature/frontend-a11y-contrast` | UI Designer + Frontend Dev | MEDIA | Pendiente |
| **M11 - Accesibilidad** | Implementar soporte para lectores de pantalla | `feature/frontend-a11y-screen-readers` | Frontend Dev | MEDIA | Pendiente |
| **M11 - Accesibilidad** | Agregar tests de accesibilidad con axe-core | `feature/test-a11y-axe` | API Tester | BAJA | Pendiente |

---

## 🔵 FASE DE CONSOLIDACIÓN: Testing y Refactoring

| Milestone | Tarea | Rama | Responsable | Prioridad | Estado |
|-----------|-------|------|-------------|-----------|--------|
| **M12 - Testing Completo** | Configurar Playwright/Cypress para E2E | `feature/test-e2e-setup` | API Tester | ALTA | Pendiente |
| **M12 - Testing Completo** | Tests E2E: Login → Dashboard → Crear pedido | `feature/test-e2e-orders-complete` | API Tester | ALTA | Pendiente |
| **M12 - Testing Completo** | Tests E2E: QR → Productos → Confirmar | `feature/test-e2e-qr-flow` | API Tester + Mobile App Builder | ALTA | Pendiente |
| **M12 - Testing Completo** | Tests E2E: Cambios de estado de mesa | `feature/test-e2e-table-states` | API Tester | MEDIA | Pendiente |
| **M12 - Testing Completo** | Tests unitarios de AuthService | `feature/test-auth-service` | API Tester | MEDIA | Pendiente |
| **M12 - Testing Completo** | Aumentar cobertura a 80%+ | `feature/test-coverage-80` | API Tester | MEDIA | Pendiente |
| **M13 - Refactoring** | Dividir lib/mock-data.ts por dominio | `feature/refactor-mock-data-split` | Lib Logic Owner | MEDIA | Pendiente |
| **M13 - Refactoring** | Extraer sub-componentes de orders-panel.tsx | `feature/refactor-orders-panel` | Frontend Dev | BAJA | Pendiente |
| **M13 - Refactoring** | Extraer sub-componentes de table-map.tsx | `feature/refactor-table-map` | Frontend Dev | BAJA | Pendiente |
| **M13 - Refactoring** | Documentar hooks con JSDoc | `feature/docs-hooks-jsdoc` | Doc Writer | BAJA | Pendiente |

---

## 📚 FASE DE DOCUMENTACIÓN: Guías y Deploy

| Milestone | Tarea | Rama | Responsable | Prioridad | Estado |
|-----------|-------|------|-------------|-----------|--------|
| **M6 - Analíticas (completar)** | Filtros por producto/categoría en dashboard | `feature/backend-product-analytics` | Backend Architect | MEDIA | Pendiente |
| **M6 - Analíticas (completar)** | Exportación de reportes CSV/PDF | `feature/backend-export-reports` | Backend Architect + Frontend Dev | MEDIA | Pendiente |
| **M6 - Analíticas (completar)** | Dashboard por sucursal | `feature/frontend-branch-analytics` | Frontend Dev | BAJA | Pendiente |
| **M7 - Docs (completar)** | README principal exhaustivo | `feature/docs-main-readme` | Doc Writer | MEDIA | Pendiente |
| **M7 - Docs (completar)** | Guía de instalación y deployment | `feature/docs-setup-guide` | Doc Writer + DevOps Automator | ALTA | Pendiente |
| **M7 - Docs (completar)** | Diagramas de arquitectura (C4, secuencia) | `feature/docs-architecture-diagrams` | Doc Writer + Backend Architect | MEDIA | Pendiente |
| **M7 - Docs (completar)** | Changelog automático | `feature/infra-changelog-automation` | Changelog Reporter | BAJA | Pendiente |
| **M7 - Docs (completar)** | Guía de contribución | `feature/docs-contributing-guide` | Doc Writer | BAJA | Pendiente |
| **M7 - Docs (completar)** | Tests de performance con Lighthouse | `feature/test-performance-lighthouse` | Performance Benchmarker | MEDIA | Pendiente |

---

## 🚀 FASE AVANZADA: Integraciones y Escalabilidad

| Milestone | Tarea | Rama | Responsable | Prioridad | Estado |
|-----------|-------|------|-------------|-----------|--------|
| **M14 - Integraciones** | Integrar DataDog para logging | `feature/infra-datadog-logging` | DevOps Automator | BAJA | Pendiente |
| **M14 - Integraciones** | Integrar notificaciones Slack | `feature/backend-slack-notifications` | Backend Architect | BAJA | Pendiente |
| **M14 - Integraciones** | Configurar Google Pay | `feature/backend-payments-googlepay` | Backend Architect + Mobile App Builder | BAJA | Pendiente |
| **M15 - Features Avanzadas** | Sistema de multi-idioma (i18n) | `feature/frontend-i18n` | Frontend Dev | BAJA | Pendiente |
| **M15 - Features Avanzadas** | Multi-tenant robusto | `feature/backend-multitenant` | Backend Architect | BAJA | Pendiente |
| **M15 - Features Avanzadas** | Modo offline completo con sync | `feature/frontend-offline-sync` | Frontend Dev + Mobile App Builder | BAJA | Pendiente |
| **M15 - Features Avanzadas** | PWA con notificaciones push | `feature/frontend-pwa-notifications` | Mobile App Builder | BAJA | Pendiente |
| **M16 - DevOps Avanzado** | Pipeline CI/CD completo (dev/staging/prod) | `feature/infra-cicd-complete` | CI/CD Keeper + DevOps Automator | MEDIA | Pendiente |
| **M16 - DevOps Avanzado** | Monitoring y alertas con DataDog | `feature/infra-monitoring-alerts` | DevOps Automator | MEDIA | Pendiente |
| **M16 - DevOps Avanzado** | Backup automatizado | `feature/infra-backup-automation` | DevOps Automator | MEDIA | Pendiente |

---

## 📅 Timeline Sugerido

### Sprint 1-2 (Próximas 2-3 semanas): 🔴 CRÍTICO
- ✅ ~~Finalizar M4 (WebSockets + validación real-time)~~ **COMPLETADO**
- 🔄 M8 completo (Seguridad pre-producción) **EN PROGRESO**
- ⏳ M9 completo (Limpieza técnica)
- **Objetivo:** Código listo para beta interna

### Sprint 3-5 (1-2 meses): 🟡 CORE
- ✅ M5 completo (Pagos digitales)
- ✅ M12 parcial (E2E setup + tests críticos)
- **Objetivo:** Funcionalidad completa para beta pública

### Sprint 6-8 (2-3 meses): 🟢 OPTIMIZACIÓN
- ✅ M10 completo (Performance)
- ✅ M11 completo (Accesibilidad)
- ✅ M13 parcial (Refactoring importante)
- ✅ M6 completo (Analíticas)
- **Objetivo:** Producto pulido para producción

### Sprint 9+ (3-6 meses): 🔵 CONSOLIDACIÓN Y AVANZADO
- ✅ M7 completo (Documentación)
- ✅ M12 completo (Testing 80%+)
- ✅ M14-M16 (Integraciones y escalabilidad)
- **Objetivo:** Producto enterprise-ready

---

## 🎯 Hitos Clave (Gates)

| Gate | Criterio | Timeline |
|------|----------|----------|
| **Beta Interna** | M4 + M8 + M9 completados | Semana 3 |
| **Beta Pública** | M5 + Tests E2E críticos | Mes 2 |
| **Producción v1.0** | M10 + M11 + M6 + Docs básicas | Mes 3 |
| **Enterprise Ready** | 80% coverage + Integraciones + Multi-tenant | Mes 6 |

---

## 📝 Notas de Implementación

### Priorización Dinámica
- Las tareas **CRÍTICAS** bloquean el avance a producción
- Las tareas **ALTA** son necesarias para funcionalidad completa
- Las tareas **MEDIA** mejoran calidad y experiencia
- Las tareas **BAJA** son nice-to-have o largo plazo

### Estrategia de Ramas
- Seguir convención: `feature/`, `fix/`, `refactor/`, `test/`, `docs/`
- Milestone 8 (Seguridad) puede trabajarse en paralelo con M5
- M10-M11 (Optimización) pueden iniciarse antes de finalizar M5

### Agentes Responsables
- Todos los agentes definidos en `.codex/agents/` están asignados
- Colaboración entre agentes es clave (ejemplo: Frontend + UI Designer)
- DevOps + Backend deben coordinarse para seguridad

---

**Próxima revisión del ROADMAP:** Al finalizar Milestone 8 (Seguridad Pre-Prod)
