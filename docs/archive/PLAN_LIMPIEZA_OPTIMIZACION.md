# 🧹 Plan de Limpieza y Optimización del Proyecto

**Fecha:** 9 de octubre de 2025  
**Objetivo:** Eliminar lo innecesario, optimizar agentes, preparar para implementación

---

## 🗑️ PARTE 1: Limpieza - Qué Eliminar

### 1. Dependencias NO Utilizadas (CRÍTICO)

#### A Eliminar del `package.json`:

```json
// ❌ DEPENDENCIAS QUE NO SE USAN:
"@remix-run/react": "latest",        // Framework Remix - NO usado
"@sveltejs/kit": "^2.37.0",          // Framework Svelte - NO usado
"svelte": "latest",                   // Svelte - NO usado
"vue": "latest",                      // Vue - NO usado
"vue-router": "latest",               // Vue Router - NO usado
"canvas": "^3.2.0",                   // Canvas node - NO usado en el código

// ✅ DEPENDENCIAS QUE SÍ SE USAN (shadcn/ui components):
"embla-carousel-react": "latest",     // ✅ Usado en components/ui/carousel.tsx
"input-otp": "latest",                // ✅ Usado en components/ui/input-otp.tsx
"vaul": "latest",                     // ✅ Usado en components/ui/drawer.tsx
"tw-animate-css": "1.3.3",            // ⚠️ Revisar si se usa (devDep)
```

**Impacto:**
- ✅ Reduce `node_modules` significativamente (~200MB menos)
- ✅ Acelera `npm install` (~20-30% más rápido)
- ✅ Mejora seguridad (menos superficie de ataque, -6 packages)
- ✅ Evita confusión sobre qué stack usar (Next.js claro)
- ✅ Más profesional (sin dependencias fantasma)

---

### 2. Archivos Lock Duplicados (CRÍTICO)

#### A Eliminar:

```bash
❌ pnpm-lock.yaml    # El proyecto usa npm, no pnpm
```

**Razón:**
- El proyecto usa `npm` (según scripts y guidelines)
- Tener `pnpm-lock.yaml` confunde y puede causar conflictos
- Solo debe existir `package-lock.json`

---

### 3. Dependencias con "latest" (ALTA PRIORIDAD)

#### Problema Actual:
Muchas dependencias usan `"latest"` que es **riesgoso para producción**

```json
// ❌ MAL:
"chart.js": "latest",
"cmdk": "latest",
"embla-carousel-react": "latest",
// ... muchas más

// ✅ BIEN:
"chart.js": "^4.4.0",
"cmdk": "^0.2.0",
```

**Acción:**
- Lock todas las versiones a valores específicos
- Esto va en el Milestone M9 del ROADMAP

---

### 4. Archivos Potencialmente Innecesarios

#### A Revisar y Posiblemente Eliminar:

```bash
# ¿Qué son estos archivos?
.codex/agents/backend/2025-09-26.md   # ⚠️ Fecha específica - ¿Es sesión vieja?

# Documentos duplicados o temporales
ROADMAP.md (original)                  # ⚠️ Ahora tenemos ROADMAP_UPDATED.md
                                       #    ¿Eliminamos el viejo o mergeamos?
```

---

### 5. Código Legacy o Mock Innecesario (MEDIA PRIORIDAD)

#### Para Limpiar Después de Implementar Funcionalidad Real:

```typescript
// lib/auth.ts - Mock que se reemplazará con JWT
// → Después de M8, limpiar código mock comentado

// lib/mock-data.ts - Muy grande
// → Después de M13, estará dividido por dominio
```

---

## 🔧 PARTE 2: Optimización de Agentes

### Análisis de Agentes Existentes

#### ✅ Agentes BUENOS (mantener como están):
1. **backend-architect.md** (engineering) - Completo y claro
2. **frontend-developer.md** (engineering) - Bien definido
3. **lib-logic-owner.md** (engineering) - Rol único y necesario
4. **api-tester.md** (testing) - Específico y útil

#### ⚠️ Agentes a MEJORAR:

1. **mobile-app-builder.md** (engineering)
   - **Problema:** Nombre confuso - No hay "app" móvil separada
   - **Mejor nombre:** `pwa-tablet-specialist.md`
   - **Actualizar scope:** PWA, tablets, QR mobile, offline-first

2. **devops-automator.md** (engineering)
   - **Problema:** Está en `engineering/` pero debería estar en `infra/`
   - **Acción:** Mover a `.codex/agents/infra/devops-automator.md`

#### ❌ Agentes DUPLICADOS o CONFUSOS:

**Problema detectado:**
```
.codex/agents/backend/         # ← Solo tiene 1 archivo de sesión vieja
.codex/agents/engineering/backend-architect.md  # ← El agente real
```

**Acción:** 
- Eliminar carpeta `.codex/agents/backend/` completa
- backend-architect.md YA está en engineering/, no necesita carpeta propia

---

### Agentes NUEVOS a Agregar (Basado en Necesidades)

#### 1. **security-specialist.md** (infra/)
```markdown
# Rol: Security Specialist

## Propósito
Experto en seguridad de aplicaciones web, enfocado en prevención de vulnerabilidades.

## Responsabilidades
- Implementar autenticación y autorización robustas
- Configurar headers de seguridad
- Rate limiting y protección DDoS
- Auditoría de dependencias
- Validación de inputs y sanitización

## Cuándo Usar
- Implementar JWT/OAuth
- Configurar CORS y CSP
- Rate limiting en APIs
- Dependency audits
- Security headers

## Checklist
- [ ] Tokens seguros (JWT, refresh)
- [ ] Rate limiting configurado
- [ ] Headers de seguridad (CSP, HSTS, etc.)
- [ ] Inputs validados y sanitizados
- [ ] Secrets en variables de entorno
- [ ] npm audit limpio
```

**Justificación:** M8 (Seguridad) es CRÍTICO y necesita un agente dedicado

#### 2. **e2e-test-specialist.md** (testing/)
```markdown
# Rol: E2E Test Specialist

## Propósito
Especialista en tests end-to-end con Playwright/Cypress.

## Responsabilidades
- Configurar framework E2E
- Escribir tests de flujos completos
- Simular interacciones reales de usuario
- Tests cross-browser
- CI/CD integration

## Cuándo Usar
- Setup inicial de Playwright/Cypress
- Tests de flujos críticos (login, pedidos, pagos)
- Tests de regresión
- Validación pre-deploy

## Checklist
- [ ] Framework configurado
- [ ] Tests de flujos críticos
- [ ] Tests pasan en CI
- [ ] Screenshots/videos de fallos
- [ ] Cobertura de casos edge
```

**Justificación:** M12 (Tests E2E) es ALTA prioridad y específico

#### 3. **data-architect.md** (backend/)
```markdown
# Rol: Data Architect

## Propósito
Diseñar modelos de datos, schemas y estrategias de persistencia.

## Responsabilidades
- Diseñar schemas de DB
- Definir relaciones y constraints
- Estrategias de migración
- Optimización de queries
- Diseño de índices

## Cuándo Usar
- Diseñar nuevas tablas/colecciones
- Modificar schemas existentes
- Migraciones de datos
- Optimización de performance de DB
- Multi-tenant data isolation

## Checklist
- [ ] Schema documentado
- [ ] Migrations escritas
- [ ] Índices optimizados
- [ ] Constraints definidos
- [ ] Backup strategy
```

**Justificación:** Actualmente no hay nadie especializado en diseño de datos

#### 4. **integration-specialist.md** (engineering/)
```markdown
# Rol: Integration Specialist

## Propósito
Integrar servicios externos (pagos, notificaciones, analytics).

## Responsabilidades
- Integrar SDKs externos
- Gestionar webhooks
- Error handling de servicios externos
- Retry logic y circuit breakers
- Documentar integraciones

## Cuándo Usar
- Mercado Pago/Stripe integration
- Slack notifications
- DataDog logging
- Google Analytics
- Webhooks de terceros

## Checklist
- [ ] SDK configurado
- [ ] Secrets en environment
- [ ] Error handling robusto
- [ ] Retry logic implementado
- [ ] Webhooks validados
- [ ] Documentación de API externa
```

**Justificación:** M5 (Pagos) y M14 (Integraciones) necesitan este expertise

---

## 📋 PARTE 3: Plan de Acción

### Fase 1: Limpieza Inmediata (1-2 horas)

```bash
# 1. Eliminar pnpm-lock.yaml
rm pnpm-lock.yaml

# 2. Eliminar carpeta backend/ vieja
rm -rf .codex/agents/backend/

# 3. Crear rama para limpieza
git checkout -b feature/infra-clean-dependencies

# 4. Editar package.json (eliminar Vue, Svelte, Remix, canvas)
# → Usar replace_string_in_file

# 5. Reinstalar dependencias limpias
rm -rf node_modules package-lock.json
npm install

# 6. Verificar que todo sigue funcionando
npm run lint
npm run build
npm test

# 7. Commit y PR
git add .
git commit -m "chore(deps): remove unused dependencies

- Remove Vue, Svelte, Remix (not used)
- Remove canvas (not used)
- Remove pnpm-lock.yaml (project uses npm)
- Remove old .codex/agents/backend folder

[Dependency Guardian]"
```

### Fase 2: Lock de Versiones (30 min - 1 hora)

```bash
# En la misma rama o nueva:
git checkout -b feature/infra-lock-versions

# 1. Instalar npm-check-updates
npm install -g npm-check-updates

# 2. Revisar versiones actuales
ncu

# 3. Actualizar package.json con versiones específicas
# → Reemplazar todos los "latest" con versiones específicas

# 4. Reinstalar
npm install

# 5. Verificar
npm test
npm run build

# 6. Commit
git commit -m "chore(deps): lock dependency versions

Replace 'latest' with specific versions for production stability

[Dependency Guardian]"
```

### Fase 3: Optimizar Agentes (1-2 horas)

```bash
# 1. Mover devops-automator
mv .codex/agents/engineering/devops-automator.md .codex/agents/infra/

# 2. Renombrar mobile-app-builder
mv .codex/agents/engineering/mobile-app-builder.md \
   .codex/agents/engineering/pwa-tablet-specialist.md

# 3. Crear 4 agentes nuevos
# → security-specialist.md
# → e2e-test-specialist.md
# → data-architect.md
# → integration-specialist.md

# 4. Actualizar .codex/AGENTS.md con los cambios

# 5. Commit
git commit -m "refactor(agents): optimize agent structure

- Move devops-automator to infra/
- Rename mobile-app-builder to pwa-tablet-specialist
- Add security-specialist for M8 tasks
- Add e2e-test-specialist for M12 tasks
- Add data-architect for DB design
- Add integration-specialist for external services

[Doc Writer]"
```

### Fase 4: Actualizar Documentación (30 min)

```bash
# 1. Revisar documentos que mencionen cosas eliminadas
# → GUIA_AGENTES_COPILOT.md
# → ROADMAP_UPDATED.md

# 2. Actualizar referencias a agentes renombrados

# 3. Commit
git commit -m "docs: update after cleanup and agent optimization

[Doc Writer]"
```

---

## 🎯 Resumen de Cambios

### Eliminaciones:
- ❌ 6 dependencias no usadas (Vue, Svelte, Remix, canvas, etc.)
- ❌ pnpm-lock.yaml
- ❌ .codex/agents/backend/ (carpeta vieja)

### Mejoras:
- ✅ Versiones lockeadas (no más "latest")
- ✅ Agentes reorganizados (devops a infra/)
- ✅ Agentes renombrados (mobile → pwa-tablet)
- ✅ 4 agentes nuevos especializados

### Resultado Final:
- 🎯 Proyecto más limpio y mantenible
- 🎯 Dependencias seguras y específicas
- 🎯 Agentes optimizados para el roadmap actual
- 🎯 Menos confusión sobre qué usar

---

## ⚠️ Precauciones

### Antes de Eliminar Dependencias:

```bash
# Verificar que NO se usan:
grep -r "embla-carousel" . --exclude-dir=node_modules
grep -r "input-otp" . --exclude-dir=node_modules
grep -r "vaul" . --exclude-dir=node_modules
```

Si aparecen resultados, NO eliminarlas todavía.

### Backup antes de limpiar:

```bash
# Crear tag de respaldo
git tag backup-before-cleanup
git push origin backup-before-cleanup
```

---

## 📊 Impacto Esperado

### Métricas:

| Métrica | Antes | Después | Mejora |
|---------|-------|---------|--------|
| Dependencias totales | 62 | 56 | -10% (6 removidas) |
| Tamaño node_modules | ~800MB | ~600MB | -25% |
| npm install time | ~90s | ~60-70s | -25% |
| Frameworks incluidos | 4 (Next, Vue, Svelte, Remix) | 1 (Next.js) | -75% |
| Confusión de stack | Alta | Ninguna | ✅ |
| Seguridad (packages) | Media | Alta | ✅ |

---

## ✅ Checklist de Ejecución

### Antes de empezar:
- [ ] Commit actual y push (backup)
- [ ] Tag de respaldo creado
- [ ] Team notificado (si aplica)

### Limpieza:
- [ ] pnpm-lock.yaml eliminado
- [ ] Dependencias Vue/Svelte/Remix eliminadas
- [ ] Carpeta .codex/agents/backend eliminada
- [ ] Verificar grep de dependencias dudosas
- [ ] npm install exitoso
- [ ] npm test pasa
- [ ] npm run build pasa

### Lock de versiones:
- [ ] Todos los "latest" reemplazados
- [ ] package-lock.json actualizado
- [ ] Tests pasan con versiones lockeadas

### Agentes:
- [ ] devops-automator movido a infra/
- [ ] mobile-app-builder renombrado
- [ ] 4 agentes nuevos creados
- [ ] .codex/AGENTS.md actualizado
- [ ] GUIA_AGENTES_COPILOT.md actualizado

### Final:
- [ ] Todos los tests pasan
- [ ] Build exitoso
- [ ] Documentación actualizada
- [ ] PR creado
- [ ] ROADMAP actualizado (M9 marcado como "Hecho")

---

**Tiempo estimado total:** 3-5 horas  
**Prioridad:** ALTA (antes de empezar features nuevos)  
**Milestone:** M9 - Limpieza Técnica

