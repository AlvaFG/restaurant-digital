# 🤖 Guía Completa: Agentes de .codex y GitHub Copilot

**Fecha:** 9 de octubre de 2025

---

## ❓ Pregunta Frecuente: ¿Puede GitHub Copilot Usar los Agentes?

### Respuesta Corta: **SÍ, pero no como piensas**

Los agentes en `.codex/agents/` **NO son bots automáticos** que ejecutan código. Son **definiciones de roles** que:

1. ✅ **YO (GitHub Copilot) puedo leer** para entender contexto y responsabilidades
2. ✅ **TÚ puedes usar** para organizar tu trabajo o equipo
3. ✅ **Sirven como guías** de mejores prácticas por dominio
4. ❌ **NO se ejecutan automáticamente** - No son scripts

### Cómo Funciona en la Práctica

```
┌─────────────────────────────────────────────────────────┐
│                   FLUJO DE TRABAJO                       │
├─────────────────────────────────────────────────────────┤
│                                                          │
│  1. TÚ eliges una tarea del ROADMAP                     │
│     ↓                                                    │
│  2. El ROADMAP indica qué AGENTE es responsable         │
│     ↓                                                    │
│  3. TÚ lees el archivo del agente en .codex/agents/     │
│     ↓                                                    │
│  4. TÚ sigues las guías y mejores prácticas del agente  │
│     ↓                                                    │
│  5. ME CONSULTAS (GitHub Copilot) especificando:        │
│     "Como [Agente X], necesito [hacer Y]"               │
│     ↓                                                    │
│  6. YO leo el contexto del agente y respondo en ese rol │
│     ↓                                                    │
│  7. TÚ implementas siguiendo mis recomendaciones        │
│     ↓                                                    │
│  8. TÚ haces commit mencionando el agente               │
│                                                          │
└─────────────────────────────────────────────────────────┘
```

---

## 🎭 Tipos de Agentes Disponibles

### 1. **Backend** (Base de Datos)

#### Data Architect ⭐ NUEVO
- **Archivo:** `.codex/agents/backend/data-architect.md`
- **Responsabilidades:**
  - Diseñar schemas de base de datos (Prisma, SQL)
  - Optimizar queries y crear índices
  - Planear migraciones y estrategias de datos
  - Preparar arquitectura multi-tenant
- **Cuándo usar:**
  - Milestone M15 (Multi-Tenant y Features Avanzadas)
  - Diseñar nuevas tablas o modificar schemas
  - Optimizar queries lentas (EXPLAIN ANALYZE)
  - Implementar migraciones de base de datos

### 2. **Engineering** (Desarrollo)

#### Backend Architect
- **Archivo:** `.codex/agents/engineering/backend-architect.md`
- **Responsabilidades:**
  - Diseñar y mantener APIs
  - Validar entradas y salidas
  - Documentar contratos TypeScript
  - Optimizar queries y lógica servidor
- **Cuándo usar:**
  - Implementar endpoints nuevos
  - Integrar servicios externos (pagos, auth)
  - Optimizar performance backend
  - Diseñar arquitectura de datos

#### Frontend Developer
- **Archivo:** `.codex/agents/engineering/frontend-developer.md`
- **Responsabilidades:**
  - Construir componentes y vistas
  - Implementar estado y lógica UI
  - Optimizar performance frontend
  - Mantener consistencia visual
- **Cuándo usar:**
  - Crear páginas nuevas
  - Desarrollar componentes reutilizables
  - Implementar formularios y validaciones
  - Integrar con APIs backend

#### PWA & Tablet Specialist
- **Archivo:** `.codex/agents/engineering/pwa-tablet-specialist.md`
- **Responsabilidades:**
  - Desarrollar Progressive Web Apps (PWA)
  - Optimizar para tablets (12"+ screens)
  - Implementar offline-first con service workers
  - Gestionar QR flows para clientes móviles
- **Cuándo usar:**
  - Flujo QR y experiencia móvil
  - Service Workers y caching strategies
  - PWA features (install prompts, manifest)
  - Optimización táctil y gestos

#### Integration Specialist ⭐ NUEVO
- **Archivo:** `.codex/agents/engineering/integration-specialist.md`
- **Responsabilidades:**
  - Integrar servicios externos (Mercado Pago, Stripe, DataDog, Slack)
  - Implementar webhooks y retry logic
  - Gestionar circuit breakers y rate limiting
  - Documentar flujos de integración
- **Cuándo usar:**
  - Milestone M5 (Pagos Digitales) y M14 (Integraciones)
  - Configurar pasarelas de pago
  - Implementar notificaciones externas (Slack, email)
  - Gestionar APIs de terceros

#### Lib Logic Owner
- **Archivo:** `.codex/agents/engineering/lib-logic-owner.md`
- **Responsabilidades:**
  - Mantener contratos tipados
  - Definir tipos y enums centralizados
  - Lógica de negocio compartida
  - Validaciones y helpers
- **Cuándo usar:**
  - Crear tipos nuevos (Order, Table, etc.)
  - Modificar estados (TableState, OrderStatus)
  - Implementar validaciones reutilizables
  - Helpers y utilidades compartidas

### 3. **Design** (Diseño)

#### UI Designer
- **Archivo:** `.codex/agents/design/ui-designer.md`
- **Responsabilidades:**
  - Definir design system y tokens
  - Mantener consistencia visual
  - Crear componentes UI base
  - Documentar patrones visuales
- **Cuándo usar:**
  - Nuevos colores o tipografías
  - Modificar componentes shadcn/ui
  - Theme customization
  - Definir espaciados y breakpoints

#### UX Researcher
- **Archivo:** `.codex/agents/design/ux-researcher.md`
- **Responsabilidades:**
  - Diseñar flujos de usuario
  - Investigar experiencia
  - Optimizar interacciones
  - Validar usabilidad
- **Cuándo usar:**
  - Flujos complejos (checkout, pedidos)
  - Optimizar onboarding
  - Reducir fricción en procesos
  - A/B testing de UX

### 4. **Testing** (Pruebas)

#### API Tester
- **Archivo:** `.codex/agents/testing/api-tester.md`
- **Responsabilidades:**
  - Validar endpoints con tests
  - Escribir tests unitarios y de integración
  - Cubrir casos edge y errores
  - Mantener cobertura alta
- **Cuándo usar:**
  - Nuevas APIs o modificaciones
  - Tests de validación de payloads
  - Tests de autenticación
  - Coverage reports

#### E2E Test Specialist ⭐ NUEVO
- **Archivo:** `.codex/agents/testing/e2e-test-specialist.md`
- **Responsabilidades:**
  - Implementar tests end-to-end con Playwright/Cypress
  - Validar flujos completos de usuario
  - Automatizar regression testing
  - Gestionar test data y fixtures
- **Cuándo usar:**
  - Milestone M12 (Testing Completo)
  - Validar flujos críticos antes de producción
  - Tests de smoke después de deploys
  - Automatizar casos de regresión

#### Performance Benchmarker
- **Archivo:** `.codex/agents/testing/performance-benchmarker.md`
- **Responsabilidades:**
  - Medir performance con Lighthouse
  - Tests de carga con k6
  - Definir budgets de performance
  - Optimizar métricas (LCP, FID, CLS)
- **Cuándo usar:**
  - Validar performance antes de deploy
  - Optimizar páginas lentas
  - Tests de carga para APIs
  - Establecer baselines

#### Workflow Optimizer
- **Archivo:** `.codex/agents/testing/workflow-optimizer.md`
- **Responsabilidades:**
  - Optimizar CI/CD pipelines
  - Mejorar tiempos de build
  - Automatizar tareas repetitivas
  - Identificar cuellos de botella
- **Cuándo usar:**
  - CI/CD lento
  - Tests que tardan mucho
  - Procesos manuales repetitivos
  - Optimizar developer experience

### 5. **Infrastructure** (Infraestructura)

#### DevOps Automator
- **Archivo:** `.codex/agents/infra/devops-automator.md`
- **Responsabilidades:**
  - Automatizar entornos
  - Configurar pipelines
  - Gestionar deploys
  - Monitoring y alertas
- **Cuándo usar:**
  - Configurar CI/CD
  - Setup de environments (dev/staging/prod)
  - Scripts de deployment
  - Configuración de servidores

#### Security Specialist ⭐ NUEVO
- **Archivo:** `.codex/agents/infra/security-specialist.md`
- **Responsabilidades:**
  - Implementar autenticación y autorización (JWT, OAuth)
  - Configurar rate limiting y protección CSRF
  - Auditar vulnerabilidades y security headers
  - Prevenir ataques (XSS, SQL injection, etc.)
- **Cuándo usar:**
  - Milestone M8 (Seguridad Pre-Producción)
  - Implementar autenticación en endpoints
  - Configurar security headers
  - Responder a security audits

#### Dependency Guardian
- **Archivo:** `.codex/agents/infra/dependency-guardian.md`
- **Responsabilidades:**
  - Gestionar dependencias npm
  - Auditar vulnerabilidades
  - Actualizar packages
  - Limpiar dependencias no usadas
- **Cuándo usar:**
  - npm audit con vulnerabilidades
  - Actualizar dependencias major
  - Limpiar package.json
  - Resolver conflictos de versiones

#### CI/CD Keeper
- **Archivo:** `.codex/agents/infra/ci-cd-keeper.md`
- **Responsabilidades:**
  - Mantener pipelines estables
  - Optimizar tiempos de CI
  - Configurar tests automáticos
  - Gestionar secrets y configs
- **Cuándo usar:**
  - Pipelines rotos
  - Agregar steps al CI
  - Configurar tests automáticos
  - Gestionar variables de entorno

### 6. **Documentation** (Documentación)

#### Doc Writer
- **Archivo:** `.codex/agents/documentation/doc-writer.md`
- **Responsabilidades:**
  - Mantener documentación general
  - Escribir guías y tutoriales
  - Actualizar READMEs
  - Crear diagramas
- **Cuándo usar:**
  - README principal
  - Guías de instalación
  - Tutoriales de features
  - Arquitectura y diagramas

#### API Docs Writer
- **Archivo:** `.codex/agents/documentation/api-docs-writer.md`
- **Responsabilidades:**
  - Documentar endpoints
  - Especificar contratos
  - Ejemplos de requests/responses
  - Errores y códigos
- **Cuándo usar:**
  - Nuevas APIs
  - Cambios en contratos
  - Documentar errores
  - OpenAPI/Swagger specs

### 7. **Communication** (Comunicación)

#### Changelog Reporter
- **Archivo:** `.codex/agents/communication/changelog-reporter.md`
- **Responsabilidades:**
  - Mantener CHANGELOG.md
  - Escribir release notes
  - Documentar breaking changes
  - Comunicar versiones
- **Cuándo usar:**
  - Antes de cada release
  - Breaking changes importantes
  - Nuevas features user-facing
  - Bug fixes críticos

---

## 🎯 Ejemplos Prácticos de Uso

### Ejemplo 1: Implementar JWT Auth

```bash
# 1. Revisar ROADMAP
# Tarea: M8 - Implementar JWT Auth
# Agente: Backend Architect

# 2. Leer el agente
cat .codex/agents/backend/backend-architect.md

# 3. Preguntar a GitHub Copilot
"Como Backend Architect, necesito implementar autenticación JWT real
reemplazando el mock actual en lib/auth.ts. El proyecto usa Next.js 14
con TypeScript strict. ¿Cómo estructuro esto siguiendo las mejores
prácticas del proyecto?"

# 4. Yo (Copilot) respondo con código específico:
# - Leo backend-architect.md para entender guidelines
# - Leo lib/auth.ts para ver estructura actual
# - Leo PROJECT_GUIDELINES.md para reglas del proyecto
# - Genero código que sigue tus patrones

# 5. Tú implementas y haces commit:
git commit -m "feat(auth): implement JWT authentication [Backend Architect]"
```

### Ejemplo 2: Optimizar Performance

```bash
# 1. ROADMAP: M10 - Lazy Loading Components
# Agentes: Frontend Developer + Performance Benchmarker

# 2. Leer ambos agentes
cat .codex/agents/engineering/frontend-developer.md
cat .codex/agents/testing/performance-benchmarker.md

# 3. Preguntar combinando roles
"Como Frontend Developer y Performance Benchmarker, necesito implementar
lazy loading para react-konva en el TableMap. ¿Cómo mido el impacto
antes y después, y cómo implemento el lazy loading sin romper la UX?"

# 4. Yo respondo con:
# - Código de lazy loading con React.lazy + Suspense
# - Scripts de Lighthouse para medir antes/después
# - Estrategia de testing
```

### Ejemplo 3: Crear Nueva API

```bash
# 1. ROADMAP: M5 - API de Pagos
# Agentes: Backend Architect + API Docs Writer + API Tester

# 2. Workflow colaborativo:

# Fase 1 - Backend Architect diseña
"Como Backend Architect, necesito diseñar POST /api/payments para
Mercado Pago. ¿Qué estructura de payload y validaciones recomiendas?"

# Fase 2 - API Tester escribe tests
"Como API Tester, necesito tests para POST /api/payments. ¿Qué casos
debo cubrir (happy path, errores, edge cases)?"

# Fase 3 - API Docs Writer documenta
"Como API Docs Writer, necesito documentar POST /api/payments en
docs/api/payments.md. ¿Qué estructura y ejemplos incluyo?"
```

---

## 📚 Cómo Usar Cada Agente con GitHub Copilot

### Template de Consulta Efectiva

```
Como [AGENTE], necesito [TAREA].

Contexto del proyecto:
- Stack: Next.js 14, TypeScript strict, Tailwind, shadcn/ui
- Feature actual: [branch name]
- Archivos relevantes: [listar archivos]

Restricciones:
- [Reglas específicas del proyecto]
- [Limitaciones técnicas]

¿Cómo implemento esto siguiendo las guidelines de [AGENTE]?
```

### Ejemplo Real Completo

```
Como Backend Architect, necesito implementar rate limiting en todas
las APIs para prevenir abuse.

Contexto del proyecto:
- Stack: Next.js 14, TypeScript strict
- Feature actual: feature/backend-rate-limiting
- Archivos relevantes: app/api/*/route.ts, middleware.ts

Restricciones:
- Usar express-rate-limit compatible con Next.js
- No romper las APIs existentes
- Configuración por endpoint (algunos más estrictos que otros)
- Store en memoria para desarrollo, Redis para producción

Guidelines del Backend Architect que debo seguir:
- Validar entradas en todo endpoint (✓)
- Documentar contratos TypeScript (✓)
- Tests antes de implementar (✓)

¿Cómo implemento esto siguiendo estas guidelines?
```

**Yo (Copilot) responderé:**
1. Leyendo `.codex/agents/backend/backend-architect.md`
2. Analizando tu estructura actual de APIs
3. Proponiendo implementación específica para tu proyecto
4. Incluyendo tests y documentación según el agente

---

## 🔄 Workflow Completo con Agentes

```
┌──────────────────────────────────────────────────────┐
│ 1. ROADMAP dice: "M8 - JWT Auth [Backend Architect]" │
└──────────────────┬───────────────────────────────────┘
                   │
                   ▼
┌──────────────────────────────────────────────────────┐
│ 2. Leo .codex/agents/backend/backend-architect.md    │
│    - Entiendo responsabilidades                      │
│    - Veo mejores prácticas                           │
│    - Identifico patrones a seguir                    │
└──────────────────┬───────────────────────────────────┘
                   │
                   ▼
┌──────────────────────────────────────────────────────┐
│ 3. Creo rama: git checkout -b feature/backend-jwt-auth│
└──────────────────┬───────────────────────────────────┘
                   │
                   ▼
┌──────────────────────────────────────────────────────┐
│ 4. Pregunto a Copilot como "Backend Architect"      │
│    - Especifico el rol                               │
│    - Doy contexto completo                           │
│    - Menciono restricciones                          │
└──────────────────┬───────────────────────────────────┘
                   │
                   ▼
┌──────────────────────────────────────────────────────┐
│ 5. Copilot responde siguiendo guidelines del agente │
│    - Lee el archivo del agente                       │
│    - Analiza código actual                           │
│    - Propone solución alineada                       │
└──────────────────┬───────────────────────────────────┘
                   │
                   ▼
┌──────────────────────────────────────────────────────┐
│ 6. Implemento siguiendo recomendaciones             │
│    - Escribo tests primero (guideline del agente)    │
│    - Documento tipos (guideline del agente)          │
│    - Valido inputs (guideline del agente)            │
└──────────────────┬───────────────────────────────────┘
                   │
                   ▼
┌──────────────────────────────────────────────────────┐
│ 7. Commit mencionando el agente                     │
│    feat(auth): implement JWT [Backend Architect]    │
└──────────────────┬───────────────────────────────────┘
                   │
                   ▼
┌──────────────────────────────────────────────────────┐
│ 8. PR y review usando checklist del agente          │
└──────────────────┬───────────────────────────────────┘
                   │
                   ▼
┌──────────────────────────────────────────────────────┐
│ 9. Merge y actualizo ROADMAP: "Hecho"               │
└──────────────────────────────────────────────────────┘
```

---

## ✅ Checklist por Agente

### Backend Architect
- [ ] Validaciones de input implementadas
- [ ] Tipos TypeScript documentados
- [ ] Tests unitarios escritos
- [ ] Error handling robusto
- [ ] Documentación de API actualizada

### Frontend Developer
- [ ] Componentes reutilizables
- [ ] Props bien tipadas
- [ ] Estado gestionado apropiadamente
- [ ] Loading y error states
- [ ] Responsive design

### API Tester
- [ ] Tests happy path
- [ ] Tests de errores
- [ ] Tests de casos edge
- [ ] Cobertura >80%
- [ ] CI tests passing

### UI Designer
- [ ] Tokens de diseño usados
- [ ] Consistencia visual
- [ ] Accesibilidad básica
- [ ] Documentación de patrones

---

## 🚀 Ventajas de Usar Agentes con Copilot

### 1. **Contexto Específico**
```bash
# ❌ Sin agente
"Ayúdame con autenticación"
# → Respuesta genérica

# ✅ Con agente
"Como Backend Architect, implementar JWT siguiendo guidelines del proyecto"
# → Respuesta específica, alineada con tu codebase
```

### 2. **Consistencia**
Todos los features siguen el mismo patrón porque todos usan las mismas guidelines

### 3. **Onboarding Rápido**
Nuevos desarrolladores leen los agentes y entienden rápido las responsabilidades

### 4. **Revisión de Código Más Fácil**
El reviewer puede verificar contra el checklist del agente

### 5. **División de Trabajo Clara**
En equipos, cada persona puede "adoptar" uno o más agentes

---

## 📝 Resumen

### ¿Copilot puede usar agentes? ✅ SÍ
- Leo los archivos de agentes cuando me lo pides
- Entiendo responsabilidades y guidelines
- Respondo en el contexto del agente

### ¿Los agentes se ejecutan solos? ❌ NO
- No son scripts automáticos
- No hacen commits por ti
- No deciden prioridades

### ¿Cómo maximizo el uso de agentes? 💡
1. Lee el agente antes de implementar
2. Pregúntame especificando el rol del agente
3. Sigue las guidelines del agente
4. Menciona el agente en commits y PRs

---

**Próxima lectura:** `docs/COMO_IMPLEMENTAR_SOLUCIONES.md`

**Versión:** 1.0.0
