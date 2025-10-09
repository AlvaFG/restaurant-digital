# AGENTS Directory

Este documento lista todos los agentes definidos en `.codex/agents/`, con una breve descripción de sus roles.

**Última actualización:** 9 de octubre de 2025  
**Total de agentes:** 21

---

## Engineering (6 agentes)

### Core Development
- **frontend-developer** → Construye componentes y vistas de UI. Interfaces modernas, accesibles y rápidas.
- **backend-architect** → Diseña y mantiene APIs y lógica de servidor. Arquitectura escalable y performante.
- **lib-logic-owner** → Mantiene contratos tipados y lógica de negocio compartida. TypeScript strict, validators.
- **integration-specialist** → Integra servicios externos (Mercado Pago, Stripe, DataDog, Slack). Webhooks, retry logic.

### Specialized
- **pwa-tablet-specialist** → PWA, tablets, QR mobile, offline-first. Optimización para dispositivos táctiles.
  - _(Anteriormente: mobile-app-builder)_

## Backend (1 agente)
- **data-architect** → Diseña schemas de DB, migraciones, optimización de queries. Multi-tenant, escalabilidad.

## Design (2 agentes)
- **ui-designer** → Define design system, tokens y lineamientos visuales. Mantiene consistencia.
- **ux-researcher** → Investiga y diseña flujos de interacción. Optimiza experiencia de usuario.

## Documentation (3 agentes)
- **doc-writer** → Mantiene documentación general del proyecto. READMEs, guías, diagramas.
- **api-docs-writer** → Documenta APIs y contratos. Endpoints, payloads, ejemplos.
- **knowledge-base-curator** → Organiza y actualiza la base de conocimiento. Centraliza información.

## Testing (4 agentes)
- **api-tester** → Valida endpoints con pruebas automáticas. Tests unitarios e integración de APIs.
- **e2e-test-specialist** → Tests end-to-end con Playwright/Cypress. Flujos completos de usuario.
- **workflow-optimizer** → Optimiza pipelines y flujos de desarrollo. CI/CD performance.
- **performance-benchmarker** → Mide y asegura performance dentro de budgets. Lighthouse, k6.

## Infra (4 agentes)
- **devops-automator** → Automatiza entornos y pipelines. Deployment, monitoring, scripts.
- **security-specialist** → Seguridad de aplicaciones web. JWT, rate limiting, headers, audits.
- **ci-cd-keeper** → Mantiene pipelines de CI/CD confiables. GitHub Actions, Azure DevOps.
- **dependency-guardian** → Administra dependencias y vulnerabilidades. npm audit, actualizaciones.

## Communication (2 agentes)
- **changelog-reporter** → Mantiene changelogs claros y release notes. Versionado, breaking changes.
- **cross-team-notifier** → Comunica cambios que afectan a múltiples roles. Coordinación de equipo.

---

## Agentes por Milestone

### M4 - Pedidos y Notificaciones
- api-tester, backend-architect, frontend-developer, lib-logic-owner, devops-automator

### M5 - Pagos Digitales
- **integration-specialist** ⭐, backend-architect, frontend-developer, e2e-test-specialist, security-specialist

### M8 - Seguridad Pre-Producción
- **security-specialist** ⭐, backend-architect, dependency-guardian, devops-automator

### M9 - Limpieza Técnica
- **dependency-guardian** ⭐, devops-automator, doc-writer

### M10 - Performance
- **performance-benchmarker** ⭐, frontend-developer, workflow-optimizer

### M11 - Accesibilidad
- frontend-developer, ux-researcher, ui-designer

### M12 - Testing Completo
- **e2e-test-specialist** ⭐, api-tester, workflow-optimizer

### M13 - Refactoring
- lib-logic-owner, frontend-developer, doc-writer

### M14 - Integraciones
- **integration-specialist** ⭐, devops-automator

### M15 - Features Avanzadas
- **data-architect** ⭐, backend-architect, pwa-tablet-specialist

---

## Cambios Recientes

### 9 de octubre de 2025:
- ✅ Renombrado: `mobile-app-builder` → `pwa-tablet-specialist`
- ✅ Movido: `devops-automator` de `engineering/` a `infra/`
- ✅ Nuevo: `security-specialist` (infra/) - Para M8
- ✅ Nuevo: `e2e-test-specialist` (testing/) - Para M12
- ✅ Nuevo: `data-architect` (backend/) - Para diseño de DB y M15
- ✅ Nuevo: `integration-specialist` (engineering/) - Para M5 y M14
- ❌ Eliminado: Carpeta `.codex/agents/backend/` (contenía archivo de sesión vieja)

---

## Cómo Usar los Agentes

Ver documentación completa en: `docs/GUIA_AGENTES_COPILOT.md`

### Consulta Ejemplo:
```
Como [AGENTE], necesito [TAREA].
Contexto: [archivos, stack, restricciones]
¿Cómo implemento esto siguiendo las guidelines del proyecto?
```

### Commits:
```bash
git commit -m "feat(auth): implement JWT [Security Specialist]"
```
