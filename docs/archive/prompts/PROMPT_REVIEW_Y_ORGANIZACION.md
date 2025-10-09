# PROMPT: Review Completo y Organización del Proyecto

## 🎯 Objetivo

Realizar un **review exhaustivo** de todo el trabajo realizado hasta ahora (M1-M5), identificar y corregir errores, inconsistencias y problemas potenciales, y **reorganizar la estructura de documentación** del proyecto para mantenerla limpia y profesional.

---

## 📋 FASE 1: AUDITORÍA DE CÓDIGO (2-3 horas)

### 1.1 Revisión de Build y Tests

**Objetivo**: Asegurar que el proyecto compila sin errores y los tests funcionan.

```powershell
# 1. Verificar build
npm run build

# 2. Ejecutar linter
npm run lint

# 3. Ejecutar tests
npm run test

# 4. Verificar tipos TypeScript
npx tsc --noEmit
```

**Acciones**:
- [ ] Documentar todos los errores encontrados
- [ ] Clasificar errores por severidad (crítico, alto, medio, bajo)
- [ ] Crear plan de corrección priorizado

---

### 1.2 Análisis de Errores en Consola

**Buscar**:
- `console.log` statements en código de producción
- `console.error` sin manejo adecuado
- `@ts-ignore` o `@ts-expect-error` sin justificación
- `any` types sin documentación

```bash
# Buscar console.log en código
grep -r "console.log" --include="*.ts" --include="*.tsx" app/ components/ lib/ hooks/

# Buscar any types
grep -r ": any" --include="*.ts" --include="*.tsx" app/ components/ lib/ hooks/

# Buscar ts-ignore
grep -r "@ts-ignore\|@ts-expect-error" --include="*.ts" --include="*.tsx" app/ components/ lib/ hooks/
```

**Acciones**:
- [ ] Listar todos los `console.log` encontrados
- [ ] Decidir cuáles eliminar vs cuáles convertir en logs apropiados
- [ ] Documentar o eliminar todos los `any` types
- [ ] Justificar o eliminar todos los `ts-ignore`

---

### 1.3 Revisión de Dependencias

```powershell
# Verificar vulnerabilidades
npm audit

# Ver dependencias desactualizadas
npm outdated

# Analizar tamaño del bundle
npm run build
```

**Acciones**:
- [ ] Listar vulnerabilidades de seguridad
- [ ] Identificar dependencias no utilizadas
- [ ] Documentar dependencias críticas para actualizar
- [ ] Crear plan de actualización segura

---

### 1.4 Revisión de Código por Feature

#### **Feature: Pagos (M5)**

**Archivos a revisar**:
```
lib/server/payment-store.ts
lib/server/payment-service.ts
lib/server/providers/mercadopago-provider.ts
lib/server/providers/payment-gateway-interface.ts
app/api/payment/route.ts
app/api/webhook/mercadopago/route.ts
hooks/use-payment.ts
components/checkout-button.tsx
components/payment-modal.tsx
app/(public)/payment/success/page.tsx
app/(public)/payment/failure/page.tsx
app/(public)/payment/pending/page.tsx
```

**Checklist**:
- [ ] **Seguridad**: ¿Webhook signature validation implementada correctamente?
- [ ] **Seguridad**: ¿Secrets en .env y no hardcodeados?
- [ ] **Error Handling**: ¿Todos los try-catch necesarios?
- [ ] **Types**: ¿Interfaces correctas sin `any`?
- [ ] **Performance**: ¿File I/O optimizado (evitar lecturas innecesarias)?
- [ ] **UX**: ¿Loading states en todos los botones?
- [ ] **UX**: ¿Mensajes de error user-friendly?
- [ ] **Testing**: ¿Tests cubren casos edge?
- [ ] **Logs**: ¿Logging apropiado para debugging producción?
- [ ] **WebSocket**: ¿Eventos emitidos correctamente?
- [ ] **Cleanup**: ¿No hay código comentado o TODOs sin resolver?

#### **Feature: Orders Panel**

**Archivos a revisar**:
```
components/orders-panel.tsx
components/order-form.tsx
lib/order-service.ts
app/api/order/route.ts
```

**Checklist**:
- [ ] **Integration**: ¿Integración con pagos correcta?
- [ ] **State Management**: ¿Estado sincronizado con WebSocket?
- [ ] **Performance**: ¿Re-renders optimizados?
- [ ] **UX**: ¿Feedback visual para todas las acciones?
- [ ] **Data Validation**: ¿Validación en cliente y servidor?

#### **Feature: WebSocket / Real-time**

**Archivos a revisar**:
```
lib/socket.ts
lib/socket-events.ts
lib/socket-client-utils.ts
hooks/use-socket.ts
app/api/socket/route.ts
```

**Checklist**:
- [ ] **Connection Management**: ¿Reconexión automática?
- [ ] **Memory Leaks**: ¿Cleanup de listeners en useEffect?
- [ ] **Error Handling**: ¿Manejo de desconexiones?
- [ ] **Types**: ¿Eventos tipados correctamente?
- [ ] **Performance**: ¿Throttling/debouncing si es necesario?

---

### 1.5 Revisión de Tests

**Tests a revisar**:
```
lib/server/__tests__/payment-store.test.ts
lib/__tests__/*.test.ts
app/api/__tests__/*.test.ts
```

**Problemas conocidos**:
- `payment-store.test.ts` tiene **24+ errores de TypeScript**
- Necesita refactoring para pasar type checking

**Acciones**:
- [ ] Ejecutar todos los tests: `npm run test`
- [ ] Listar todos los tests que fallan
- [ ] Identificar tests con type errors
- [ ] Decidir: ¿refactorizar o eliminar tests problemáticos?
- [ ] Asegurar cobertura mínima de 70% en código crítico

---

## 📁 FASE 2: REORGANIZACIÓN DE DOCUMENTACIÓN (1-2 horas)

### 2.1 Análisis de Archivos .md Actuales

**Ubicaciones actuales**:

```
ROOT (18 archivos .md):
├── AGENTS.md
├── ANALISIS_PROBLEMAS_RESTANTES.md
├── ESTRATEGIA_M5_COMPLETA.md
├── IMPLEMENTACION_SOLUCIONES_RESUMEN.md
├── LIMPIEZA_COMPLETADA.md
├── M4_ESTADO_ACTUAL.md
├── PLAN_LIMPIEZA_OPTIMIZACION.md
├── POR_QUE_TESTS_BLOQUEADOS.md
├── PROJECT_GUIDELINES.md
├── PROJECT_OVERVIEW.md
├── PROMPT_M4_COMPLETO.md
├── PROMPT_M5_FASE1_RESEARCH.md
├── PROMPT_M5_FASE2_BACKEND.md
├── PROMPT_M5_FASE3_FRONTEND.md
├── PROMPT_M5_FASE4_TESTING.md
├── PROMPT_SOLUCION_COMPLETA.md
├── ROADMAP.md
├── ROADMAP_UPDATED.md
└── TESTS_DESBLOQUEADOS_REPORTE.md

docs/ (scattered):
├── api/
│   ├── analytics-covers.md
│   ├── menu.md
│   ├── order-endpoint.md
│   ├── orders.md
│   └── payments.md
├── checklists/
│   └── payment-pr-checklist.md
├── diagrams/
│   └── payment-flow.md
├── features/
│   └── orders-panel.md
├── integrations/
│   └── realtime-sockets.md
├── payments/
│   ├── implementation-plan.md
│   ├── payment-architecture.md
│   ├── payment-gateway-comparison.md
│   └── setup-guide.md
├── prompts/
│   └── salon-editor-unificado.md
├── COMO_IMPLEMENTAR_SOLUCIONES.md
├── GUIA_AGENTES_COPILOT.md
├── qr-flow.md
└── ux-product-opportunities.md

.codex/ (muchos archivos):
├── AGENTS.md (duplicado)
├── BRANCHING.md
├── PROJECT_GUIDELINES.md (duplicado)
├── PROJECT_OVERVIEW.md (duplicado)
├── STYLE_GUIDE.md
├── WORKFLOWS.md
└── agents/ (30+ archivos de agentes)
```

**Problemas identificados**:
1. **18 archivos .md en root** (debería haber máximo 3-4)
2. **Duplicación**: `AGENTS.md`, `PROJECT_GUIDELINES.md`, `PROJECT_OVERVIEW.md` están en root y `.codex/`
3. **Falta README.md principal** en root
4. **Archivos temporales** de análisis/prompts mezclados con documentación permanente
5. **Inconsistencia** en organización de `docs/`

---

### 2.2 Nueva Estructura Propuesta

```
ROOT/ (solo archivos esenciales):
├── README.md                          ⭐ NUEVO - Overview del proyecto
├── CHANGELOG.md                       ⭐ NUEVO - Historial de cambios
├── CONTRIBUTING.md                    ⭐ NUEVO - Guía para contribuidores
├── LICENSE                            (si aplica)
└── .env.example                       (ya existe)

docs/
├── README.md                          ⭐ NUEVO - Índice de documentación
├── setup/                             ⭐ NUEVO
│   ├── installation.md
│   ├── environment-variables.md
│   └── development.md
├── architecture/                      ⭐ REORGANIZADO
│   ├── overview.md                    (de PROJECT_OVERVIEW.md)
│   ├── database-schema.md
│   ├── folder-structure.md
│   └── tech-stack.md
├── api/                               ✅ Ya existe, limpiar
│   ├── README.md                      ⭐ NUEVO - Índice APIs
│   ├── analytics.md                   (renombrar analytics-covers.md)
│   ├── menu.md                        ✅ Ya existe
│   ├── orders.md                      ✅ Ya existe
│   ├── payments.md                    ✅ Ya existe
│   └── tables.md                      ⭐ NUEVO
├── features/                          ✅ Ya existe
│   ├── README.md                      ⭐ NUEVO - Índice features
│   ├── orders-panel.md                ✅ Ya existe
│   ├── payments-integration.md        ⭐ MOVER de docs/payments/
│   ├── qr-ordering.md                 (mover qr-flow.md)
│   ├── realtime-updates.md            (mover integrations/realtime-sockets.md)
│   └── salon-editor.md                (mover prompts/salon-editor-unificado.md)
├── diagrams/                          ✅ Ya existe
│   ├── README.md                      ⭐ NUEVO
│   ├── payment-flow.md                ✅ Ya existe
│   ├── order-flow.md                  ⭐ NUEVO
│   └── architecture.md                ⭐ NUEVO
├── guidelines/                        ⭐ NUEVO - Unificar reglas
│   ├── coding-standards.md            (de PROJECT_GUIDELINES.md)
│   ├── git-workflow.md                (de .codex/BRANCHING.md)
│   ├── style-guide.md                 (de .codex/STYLE_GUIDE.md)
│   └── agents-guide.md                (de AGENTS.md + GUIA_AGENTES_COPILOT.md)
├── checklists/                        ✅ Ya existe
│   ├── payment-pr-checklist.md        ✅ Ya existe
│   └── general-pr-checklist.md        ⭐ NUEVO
├── roadmap/                           ⭐ NUEVO - Planificación
│   ├── milestones.md                  (unificar ROADMAP.md + ROADMAP_UPDATED.md)
│   ├── completed-work.md              ⭐ NUEVO
│   └── future-plans.md                ⭐ NUEVO
└── archive/                           ⭐ NUEVO - Docs históricos
    ├── M4_ESTADO_ACTUAL.md
    ├── LIMPIEZA_COMPLETADA.md
    ├── TESTS_DESBLOQUEADOS_REPORTE.md
    ├── ANALISIS_PROBLEMAS_RESTANTES.md
    ├── PLAN_LIMPIEZA_OPTIMIZACION.md
    ├── IMPLEMENTACION_SOLUCIONES_RESUMEN.md
    ├── ESTRATEGIA_M5_COMPLETA.md
    ├── POR_QUE_TESTS_BLOQUEADOS.md
    └── prompts/                       ⭐ NUEVO - Archivos PROMPT_*
        ├── PROMPT_M4_COMPLETO.md
        ├── PROMPT_M5_FASE1_RESEARCH.md
        ├── PROMPT_M5_FASE2_BACKEND.md
        ├── PROMPT_M5_FASE3_FRONTEND.md
        ├── PROMPT_M5_FASE4_TESTING.md
        └── PROMPT_SOLUCION_COMPLETA.md

.codex/                                ✅ Mantener para GitHub Copilot
├── AGENTS.md
├── PROJECT_GUIDELINES.md
├── PROJECT_OVERVIEW.md
├── WORKFLOWS.md
└── agents/                            ✅ Mantener estructura
```

---

### 2.3 Plan de Reorganización

#### **Paso 1: Crear nuevos README.md**

```markdown
# ROOT/README.md
- Descripción breve del proyecto
- Tech stack
- Quick start
- Links a documentación clave
- Status badges (build, tests, coverage)

# docs/README.md
- Índice completo de toda la documentación
- Categorías: Setup, Architecture, API, Features, Guidelines

# docs/api/README.md
- Lista de todas las APIs disponibles
- Convenciones de API
- Autenticación/Autorización

# docs/features/README.md
- Lista de features implementados
- Roadmap de features
```

#### **Paso 2: Mover archivos a docs/archive/**

Mover estos archivos históricos/temporales:
```
ROOT/M4_ESTADO_ACTUAL.md                    → docs/archive/
ROOT/LIMPIEZA_COMPLETADA.md                 → docs/archive/
ROOT/TESTS_DESBLOQUEADOS_REPORTE.md         → docs/archive/
ROOT/ANALISIS_PROBLEMAS_RESTANTES.md        → docs/archive/
ROOT/PLAN_LIMPIEZA_OPTIMIZACION.md          → docs/archive/
ROOT/IMPLEMENTACION_SOLUCIONES_RESUMEN.md   → docs/archive/
ROOT/ESTRATEGIA_M5_COMPLETA.md              → docs/archive/
ROOT/POR_QUE_TESTS_BLOQUEADOS.md            → docs/archive/
ROOT/PROMPT_*.md                             → docs/archive/prompts/
```

#### **Paso 3: Reorganizar docs/**

```bash
# Crear nuevas carpetas
mkdir docs/setup
mkdir docs/architecture
mkdir docs/guidelines
mkdir docs/roadmap
mkdir docs/archive
mkdir docs/archive/prompts

# Mover archivos existentes
mv docs/qr-flow.md docs/features/qr-ordering.md
mv docs/integrations/realtime-sockets.md docs/features/realtime-updates.md
mv docs/prompts/salon-editor-unificado.md docs/features/salon-editor.md

# Renombrar/consolidar
mv docs/api/analytics-covers.md docs/api/analytics.md

# Consolidar payments docs
# (mantener solo docs/api/payments.md y docs/diagrams/payment-flow.md)
# Archivar docs/payments/ antiguo
```

#### **Paso 4: Consolidar duplicados**

**AGENTS.md**:
- Mantener `ROOT/AGENTS.md` (para GitHub Copilot Edits)
- Mantener `.codex/AGENTS.md` (para GitHub Copilot Chat)
- Son diferentes propósitos, OK duplicar

**PROJECT_GUIDELINES.md**:
- Consolidar `ROOT/PROJECT_GUIDELINES.md` + `.codex/PROJECT_GUIDELINES.md`
- Crear `docs/guidelines/coding-standards.md` más detallado
- Mantener `.codex/PROJECT_GUIDELINES.md` para Copilot

**PROJECT_OVERVIEW.md**:
- Mover contenido a `docs/architecture/overview.md`
- Mantener `.codex/PROJECT_OVERVIEW.md` para Copilot
- Eliminar `ROOT/PROJECT_OVERVIEW.md`

**ROADMAP**:
- Unificar `ROADMAP.md` + `ROADMAP_UPDATED.md`
- Crear `docs/roadmap/milestones.md` consolidado
- Eliminar duplicados en root

#### **Paso 5: Limpiar docs/payments/**

Actualmente:
```
docs/payments/
├── implementation-plan.md        (obsoleto, ya implementado)
├── payment-architecture.md       (útil, mover a docs/architecture/)
├── payment-gateway-comparison.md (útil, mover a docs/archive/)
└── setup-guide.md                (consolidar con docs/api/payments.md)
```

**Acciones**:
```bash
mv docs/payments/payment-architecture.md docs/architecture/
mv docs/payments/payment-gateway-comparison.md docs/archive/
# Consolidar setup-guide.md en docs/api/payments.md (sección "Setup")
# Eliminar implementation-plan.md (ya completado)
rm -rf docs/payments/
```

#### **Paso 6: Actualizar links internos**

Después de mover archivos, actualizar todos los links:
```bash
# Buscar todos los links markdown rotos
grep -r "]\(" --include="*.md" docs/

# Actualizar manualmente cada link
# Formato: [Texto](../nueva/ruta.md)
```

---

### 2.4 Archivos a Eliminar Completamente

**Candidatos para eliminación** (confirmar antes):
- `docs/payments/implementation-plan.md` - Ya implementado
- `docs/api/order-endpoint.md` - Duplicado con `orders.md`?
- `docs/prompts/` - Mover a archive
- `docs/COMO_IMPLEMENTAR_SOLUCIONES.md` - Temporal, archivar

---

## 🔍 FASE 3: CODE REVIEW DETALLADO (2-3 horas)

### 3.1 Revisión de Seguridad

**Checklist de Seguridad**:

```typescript
// ❌ MAL - Secrets hardcodeados
const apiKey = "TEST-12345678";

// ✅ BIEN - Usar env vars
const apiKey = process.env.MERCADOPAGO_ACCESS_TOKEN;
if (!apiKey) throw new Error("Missing MERCADOPAGO_ACCESS_TOKEN");
```

**Auditoría**:
- [ ] Buscar strings que parezcan API keys: `grep -rE "['\"][A-Z0-9_]{20,}['\"]" --include="*.ts" --include="*.tsx"`
- [ ] Verificar `.env.local` en `.gitignore`
- [ ] Verificar `.env.example` tiene todas las vars necesarias
- [ ] Revisar webhook signature validation
- [ ] Revisar que no se logueen datos sensibles

---

### 3.2 Revisión de Performance

**Puntos críticos**:

1. **File I/O en stores**:
```typescript
// ❌ MAL - Leer archivo en cada get()
get(id: string) {
  const data = JSON.parse(fs.readFileSync('data.json'));
  return data[id];
}

// ✅ BIEN - Cache en memoria
private cache: Map<string, T> = new Map();
get(id: string) {
  return this.cache.get(id);
}
```

2. **React re-renders**:
```typescript
// ❌ MAL - Re-render innecesario
const Orders = () => {
  const [data, setData] = useState([]);
  
  // Esta función se recrea en cada render
  const handleClick = () => { ... };
  
  return <Button onClick={handleClick} />;
};

// ✅ BIEN - Memoización
const Orders = () => {
  const [data, setData] = useState([]);
  
  const handleClick = useCallback(() => { ... }, []);
  
  return <Button onClick={handleClick} />;
};
```

**Acciones**:
- [ ] Revisar todos los file reads en stores
- [ ] Verificar uso de `useMemo` y `useCallback` en componentes grandes
- [ ] Revisar WebSocket listeners por memory leaks
- [ ] Analizar bundle size: `npm run build -- --analyze` (si configurado)

---

### 3.3 Revisión de Error Handling

**Patrón consistente**:

```typescript
// ✅ BIEN - Error handling completo
async function createPayment(data: PaymentData) {
  try {
    // Validación
    if (!data.orderId) {
      throw new ValidationError("orderId is required");
    }
    
    // Lógica
    const result = await externalAPI.call(data);
    
    // Logging
    logger.info("Payment created", { paymentId: result.id });
    
    return result;
    
  } catch (error) {
    // Log específico
    if (error instanceof ValidationError) {
      logger.warn("Validation failed", { error: error.message });
    } else {
      logger.error("Payment creation failed", { error });
    }
    
    // Re-throw o return error response
    throw new AppError("Failed to create payment", { cause: error });
  }
}
```

**Acciones**:
- [ ] Verificar que todos los `async` functions tienen try-catch
- [ ] Verificar que los errores se propagan correctamente
- [ ] Revisar mensajes de error user-friendly en UI
- [ ] Verificar logging apropiado (no loguear PII)

---

### 3.4 Revisión de Types

**Buscar problemas**:

```bash
# Buscar any types
grep -rn ": any" --include="*.ts" --include="*.tsx" app/ components/ lib/ hooks/

# Buscar ts-ignore
grep -rn "@ts-ignore\|@ts-expect-error" --include="*.ts" --include="*.tsx" app/ components/ lib/ hooks/

# Buscar as unknown as
grep -rn "as unknown as" --include="*.ts" --include="*.tsx" app/ components/ lib/ hooks/
```

**Patrón recomendado**:

```typescript
// ❌ EVITAR
function process(data: any) { ... }

// ✅ MEJOR - Usar unknown y type guards
function process(data: unknown) {
  if (!isValidData(data)) {
    throw new Error("Invalid data");
  }
  // Ahora TypeScript sabe que data es válido
  return data.someProperty;
}

function isValidData(data: unknown): data is ValidData {
  return (
    typeof data === 'object' &&
    data !== null &&
    'someProperty' in data
  );
}
```

---

## 🧪 FASE 4: TESTING AUDIT (1-2 horas)

### 4.1 Ejecutar Suite Completo

```powershell
# Ejecutar todos los tests
npm run test

# Con coverage
npm run test -- --coverage

# Solo un archivo
npm run test -- payment-store.test.ts
```

**Documentar**:
- [ ] Total de tests: ___
- [ ] Tests passing: ___
- [ ] Tests failing: ___
- [ ] Coverage total: ___%
- [ ] Coverage crítico (lib/server): ___%

---

### 4.2 Arreglar Tests Rotos

**Test conocido roto**: `lib/server/__tests__/payment-store.test.ts`

**Errores**:
```
- Type mismatches: Missing fields (tableId, currency, externalId)
- Wrong PaymentStatus type
- list() return type incorrect
```

**Opciones**:
1. **Refactorizar test** para coincidir con tipos reales
2. **Simplificar test** para solo testear lo crítico
3. **Eliminar test** si es demasiado complejo (temporal)

**Decisión recomendada**: Opción 2 - Simplificar

```typescript
// Test simplificado que pasa type checking
describe('PaymentStore', () => {
  it('should create payment with all required fields', async () => {
    const payment = await paymentStore.create({
      orderId: 'order-1',
      tableId: 'table-1',
      amount: 1000,
      currency: 'ARS',
      provider: 'mercadopago',
      externalId: 'mp-123',
      status: PaymentStatus.PENDING
    });
    
    expect(payment.id).toBeDefined();
    expect(payment.status).toBe(PaymentStatus.PENDING);
  });
});
```

---

### 4.3 Tests Faltantes Críticos

**Identificar gaps**:
- [ ] Payment webhook validation
- [ ] Payment status transitions
- [ ] Order creation flow
- [ ] WebSocket event emission
- [ ] Error handling edge cases

**Priorizar**:
1. **Alta prioridad**: Webhook, payment creation, error handling
2. **Media prioridad**: Status transitions, WebSocket
3. **Baja prioridad**: UI components (pueden ser E2E)

---

## 📝 FASE 5: CREAR DOCUMENTACIÓN NUEVA (1-2 horas)

### 5.1 README.md Principal

```markdown
# Restaurant Management System

## 🍽️ Descripción
Sistema de gestión integral para restaurantes con funcionalidades de:
- 📋 Gestión de pedidos en tiempo real
- 💳 Pagos online integrados (MercadoPago)
- 🪑 Administración de mesas y salón
- 📊 Analytics y reportes
- 📱 Ordenamiento QR para clientes

## 🚀 Quick Start

\`\`\`bash
# 1. Instalar dependencias
npm install

# 2. Configurar variables de entorno
cp .env.example .env.local
# Editar .env.local con tus credentials

# 3. Iniciar servidor de desarrollo
npm run dev

# 4. Abrir en navegador
http://localhost:3000
\`\`\`

## 🛠️ Tech Stack
- **Framework**: Next.js 14.2.32 (App Router)
- **Language**: TypeScript 5
- **Styling**: Tailwind CSS + shadcn/ui
- **Realtime**: Socket.io (WebSocket)
- **Payments**: MercadoPago Checkout Pro
- **Testing**: Vitest + React Testing Library

## 📚 Documentación
- [Setup Guide](docs/setup/installation.md)
- [Architecture](docs/architecture/overview.md)
- [API Reference](docs/api/README.md)
- [Features](docs/features/README.md)
- [Contributing](CONTRIBUTING.md)

## 📊 Estado del Proyecto
- ✅ M1: Estructura base y autenticación
- ✅ M2: Gestión de mesas
- ✅ M3: Sistema de pedidos
- ✅ M4: Analytics y reportes
- ✅ M5: Integración de pagos
- 🚧 M6: Ordenamiento QR (en progreso)

## 🧪 Testing

\`\`\`bash
# Ejecutar tests
npm run test

# Con coverage
npm run test -- --coverage

# Linter
npm run lint
\`\`\`

## 📄 Licencia
MIT

## 👥 Autores
- Álvaro - [GitHub](https://github.com/AlvaFG)
```

---

### 5.2 CHANGELOG.md

```markdown
# Changelog

## [Unreleased]

### M5 - Payment Integration (2025-01-09)

#### Added
- MercadoPago payment integration (Checkout Pro)
- Payment API endpoints (`/api/payment`, `/api/webhook/mercadopago`)
- Payment UI components (CheckoutButton, PaymentModal)
- Payment success/failure/pending pages
- Real-time payment status updates via WebSocket
- Comprehensive payment API documentation

#### Changed
- OrdersPanel now includes payment button
- WebSocket events extended with `payment:updated`

#### Fixed
- Type safety in payment store
- Error handling in payment flows

### M4 - Analytics (2024-12-XX)

...
```

---

### 5.3 CONTRIBUTING.md

```markdown
# Contributing Guide

## 🌿 Branching Strategy
- `main`: Production branch
- `develop`: Integration branch (if using)
- `feature/*`: Feature branches
- `hotfix/*`: Emergency fixes

## 📝 Commit Convention
Use [Conventional Commits](https://www.conventionalcommits.org/):

\`\`\`
feat(scope): add new feature
fix(scope): fix bug
docs(scope): update documentation
refactor(scope): refactor code
test(scope): add tests
chore(scope): maintenance tasks
\`\`\`

Examples:
- `feat(payments): add mercadopago integration`
- `fix(orders): resolve duplicate order bug`
- `docs(api): update payments endpoint documentation`

## ✅ Pull Request Checklist
Before creating a PR:
- [ ] Code passes linter: `npm run lint`
- [ ] All tests pass: `npm run test`
- [ ] Build succeeds: `npm run build`
- [ ] Types are correct: `npx tsc --noEmit`
- [ ] Documentation updated
- [ ] No console.logs in production code
- [ ] Changes tested manually

## 🧪 Testing Guidelines
- Unit tests for business logic (lib/server/)
- Integration tests for API routes
- Component tests for complex UI
- E2E tests for critical user flows

## 📖 Documentation
- Update relevant docs in `docs/`
- Add API documentation for new endpoints
- Create diagrams for complex flows
- Update README if needed
```

---

## 🎯 FASE 6: ACCIÓN Y VALIDACIÓN FINAL (1 hora)

### 6.1 Ejecutar Reorganización

```powershell
# 1. Crear nueva estructura
New-Item -ItemType Directory -Path "docs/setup", "docs/architecture", "docs/guidelines", "docs/roadmap", "docs/archive", "docs/archive/prompts"

# 2. Mover archivos
# (Ejecutar comandos de sección 2.3)

# 3. Crear README.md files
# (Usar contenido de sección 5)

# 4. Commit cambios
git add .
git commit -m "docs: reorganize documentation structure

- Move historical/temporary docs to docs/archive/
- Create new README.md in root and key docs folders
- Add CHANGELOG.md and CONTRIBUTING.md
- Consolidate duplicate documentation
- Establish clear docs/ folder structure"
```

---

### 6.2 Validar Links

```bash
# Buscar links rotos
grep -r "]\(" --include="*.md" docs/ | while read line; do
  # Extraer path del link
  # Verificar que archivo existe
done
```

O usar herramienta:
```bash
npm install -g markdown-link-check
find docs/ -name "*.md" -exec markdown-link-check {} \;
```

---

### 6.3 Final Checklist

**Pre-merge validation**:
- [ ] `npm run lint` - 0 errors
- [ ] `npm run build` - success
- [ ] `npm run test` - all passing (o documentar failing tests)
- [ ] `npx tsc --noEmit` - 0 type errors
- [ ] Documentación reorganizada
- [ ] README.md actualizado
- [ ] CHANGELOG.md creado
- [ ] Links internos validados
- [ ] Archivos duplicados eliminados
- [ ] Root folder limpio (max 5-6 archivos)

---

## 📋 DELIVERABLES

Al finalizar este prompt, debes tener:

1. **Reporte de Auditoría** (`REPORTE_AUDITORIA_COMPLETA.md`):
   - Errores encontrados por categoría
   - Problemas de seguridad identificados
   - Performance issues
   - Tests failing con plan de acción
   - Recomendaciones priorizadas

2. **Estructura de Documentación Limpia**:
   - Root folder con max 5 archivos
   - `docs/` bien organizado por categorías
   - `docs/archive/` con documentos históricos
   - README.md completos en folders clave

3. **Nuevos Documentos**:
   - `README.md` principal
   - `CHANGELOG.md`
   - `CONTRIBUTING.md`
   - `docs/README.md` (índice)

4. **Código Corregido**:
   - Tests críticos pasando
   - Type errors resueltos
   - Console.logs eliminados
   - Seguridad validada

5. **Commit de Reorganización**:
   - Mensaje claro de conventional commit
   - Todos los movimientos documentados
   - Links actualizados

---

## ⏱️ Tiempo Estimado Total: 7-10 horas

- Fase 1 (Auditoría): 2-3h
- Fase 2 (Reorganización docs): 1-2h
- Fase 3 (Code review): 2-3h
- Fase 4 (Testing audit): 1-2h
- Fase 5 (Docs nueva): 1-2h
- Fase 6 (Validación): 1h

---

## 🚀 Próximos Pasos Después del Review

Una vez completado este review y reorganización:
1. Merge de branch `feature/backend-payments-mercadopago` a `main`
2. Deploy a staging para validación
3. Testing manual completo con usuarios
4. Deploy a producción
5. Continuar con M6 (QR Ordering) con proyecto limpio

---

## 📞 Soporte

Si encuentras problemas durante el review:
- Documentar en `REPORTE_AUDITORIA_COMPLETA.md`
- Priorizar por impacto (crítico > alto > medio > bajo)
- Crear issues en GitHub para tracking
- Discutir soluciones complejas antes de implementar

---

**Autor**: GitHub Copilot  
**Fecha**: 2025-10-09  
**Versión**: 1.0.0  
**Estado**: Ready for execution
