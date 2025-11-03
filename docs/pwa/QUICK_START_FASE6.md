# 🚀 Quick Start - Fase 6: PWA Implementation

> **Guía rápida** para agentes que trabajarán en la Fase 6
> 
> **Para plan completo:** Ver [FASE_6_PLAN.md](../FASE_6_PLAN.md)  
> **Para arquitectura:** Ver [ARQUITECTURA_PWA.md](./ARQUITECTURA_PWA.md)

---

## 🎯 Objetivo de la Fase

Convertir el Restaurant Management System en una **Progressive Web App** con:
- ✅ Funcionalidad offline completa
- ✅ Sincronización automática
- ✅ Push notifications
- ✅ Instalable como app nativa

---

## 📋 Checklist del Agente

Antes de empezar, asegúrate de tener:

- [ ] Acceso al repositorio
- [ ] Credenciales de Supabase
- [ ] Node.js 18+ instalado
- [ ] Navegador con DevTools (Chrome/Edge)
- [ ] Leer [FASE_6_PLAN.md](../FASE_6_PLAN.md) completo
- [ ] Entender [ARQUITECTURA_PWA.md](./ARQUITECTURA_PWA.md)

---

## 🗓️ Roadmap de 4 Semanas

```
Semana 1: Service Worker + Cache
├── T1.1: Configurar Workbox
├── T1.2: Cache de assets estáticos
├── T1.3: Cache de API responses
├── T1.4: Indicador online/offline
└── T1.5: Tests de cache

Semana 2: Offline Data + Sync
├── T2.1: Configurar IndexedDB (Dexie)
├── T2.2: Sync queue
├── T2.3: Background Sync API
├── T2.4: Conflict resolution
├── T2.5: UI de sincronización
└── T2.6: Tests de sync

Semana 3: Push Notifications
├── T3.1: Backend push (Supabase)
├── T3.2: Subscription management
├── T3.3: Push event handler
├── T3.4: Triggers automáticos
├── T3.5: UI de configuración
└── T3.6: Tests de push

Semana 4: Install + Polish
├── T4.1: Manifest.json
├── T4.2: Iconos y assets
├── T4.3: Install prompt
├── T4.4: iOS instructions
├── T4.5: Lighthouse audit
├── T4.6: Analytics
├── T4.7: Documentación
└── T4.8: Tests E2E
```

---

## 🛠️ Setup Inicial

### 1. Instalar Dependencias

```bash
# Dependencias PWA
npm install --save \
  workbox-webpack-plugin@^7.3.0 \
  workbox-window@^7.3.0 \
  dexie@^4.0.0 \
  dexie-react-hooks@^1.1.7 \
  web-push@^3.6.0

# DevDependencies
npm install --save-dev \
  workbox-cli@^7.3.0 \
  @types/web-push@^3.6.0
```

### 2. Configurar Workbox en Next.js

```bash
# Instalar plugin de Next.js para PWA
npm install --save @ducanh2912/next-pwa
```

Agregar a `next.config.mjs`:
```javascript
import withPWA from '@ducanh2912/next-pwa';

const pwaConfig = {
  dest: 'public',
  disable: process.env.NODE_ENV === 'development',
  register: true,
  skipWaiting: true,
};

export default withPWA(pwaConfig)(nextConfig);
```

### 3. Crear Estructura de Carpetas

```bash
mkdir -p lib/pwa
mkdir -p lib/sync
mkdir -p lib/push
mkdir -p lib/db
mkdir -p public/icons
mkdir -p tests/pwa
mkdir -p docs/pwa
```

### 4. Variables de Entorno

Agregar a `.env.local`:
```env
# PWA
NEXT_PUBLIC_VAPID_PUBLIC_KEY=tu_vapid_public_key
VAPID_PRIVATE_KEY=tu_vapid_private_key

# Service Worker
NEXT_PUBLIC_SW_URL=/sw.js
NEXT_PUBLIC_CACHE_VERSION=v1
```

Generar VAPID keys:
```bash
npx web-push generate-vapid-keys
```

---

## 📝 Tareas por Sprint

### Sprint 1: Service Worker (Semana 1)

#### Archivos a Crear

**T1.1: Configuración Workbox**
```
next.config.mjs (modificar)
public/sw.js (nuevo)
lib/pwa/sw-config.ts (nuevo)
```

**T1.2: Cache de Assets**
```
lib/pwa/cache-strategies.ts (nuevo)
lib/pwa/cache-config.ts (nuevo)
```

**T1.3: Cache de APIs**
```
lib/pwa/api-cache.ts (nuevo)
```

**T1.4: Indicador Online/Offline**
```
components/connection-status.tsx (nuevo)
hooks/use-online-status.ts (nuevo)
app/layout.tsx (modificar)
```

**T1.5: Tests**
```
tests/pwa/service-worker.test.ts (nuevo)
tests/pwa/cache-strategies.test.ts (nuevo)
```

#### Comandos Útiles

```bash
# Verificar Service Worker
# DevTools > Application > Service Workers

# Limpiar cache
# DevTools > Application > Storage > Clear site data

# Test Service Worker
npm test -- tests/pwa/service-worker.test.ts

# Build para probar SW (no funciona en dev)
npm run build
npm run start
```

---

### Sprint 2: Sync (Semana 2)

#### Archivos a Crear

**T2.1: IndexedDB**
```
lib/db/local-db.ts (nuevo)
lib/db/migrations.ts (nuevo)
lib/db/types.ts (nuevo)
```

**T2.2: Sync Queue**
```
lib/sync/sync-queue.ts (nuevo)
lib/sync/sync-operations.ts (nuevo)
lib/sync/types.ts (nuevo)
```

**T2.3: Background Sync**
```
lib/sync/background-sync.ts (nuevo)
public/sw.js (modificar - agregar sync event)
```

**T2.4: Conflict Resolution**
```
lib/sync/conflict-resolver.ts (nuevo)
lib/sync/merge-strategies.ts (nuevo)
components/conflict-dialog.tsx (nuevo)
```

**T2.5: UI de Sync**
```
components/sync-status-panel.tsx (nuevo)
app/configuracion/sync/page.tsx (nuevo)
```

**T2.6: Tests**
```
tests/sync/sync-queue.test.ts (nuevo)
tests/sync/conflict-resolution.test.ts (nuevo)
tests/e2e/offline-sync.spec.ts (nuevo)
```

#### Comandos Útiles

```bash
# Inspeccionar IndexedDB
# DevTools > Application > Storage > IndexedDB

# Simular offline
# DevTools > Network > Offline checkbox

# Test sync
npm test -- tests/sync/

# E2E test offline
npm run test:e2e -- tests/e2e/offline-sync.spec.ts
```

---

### Sprint 3: Push (Semana 3)

#### Archivos a Crear

**T3.1: Backend Push**
```
supabase/functions/send-push/index.ts (nuevo)
supabase/migrations/20250103_push_subscriptions.sql (nuevo)
```

**T3.2: Subscription Management**
```
lib/push/push-manager.ts (nuevo)
hooks/use-push-notifications.ts (nuevo)
```

**T3.3: Push Handler**
```
public/sw.js (modificar - agregar push event)
```

**T3.4: Triggers**
```
supabase/functions/trigger-new-order/index.ts (nuevo)
supabase/functions/trigger-table-alert/index.ts (nuevo)
supabase/migrations/20250103_push_triggers.sql (nuevo)
```

**T3.5: UI Config**
```
app/configuracion/notificaciones/page.tsx (nuevo)
components/notification-preferences.tsx (nuevo)
```

**T3.6: Tests**
```
tests/push/subscription.test.ts (nuevo)
tests/push/notifications.test.ts (nuevo)
tests/e2e/push-flow.spec.ts (nuevo)
```

#### Comandos Útiles

```bash
# Deploy Supabase functions
supabase functions deploy send-push

# Aplicar migraciones
supabase db push

# Test push localmente
supabase functions serve send-push

# Verificar subscriptions
# DevTools > Application > Service Workers > Push Messaging

# Test push
npm test -- tests/push/
```

---

### Sprint 4: Install (Semana 4)

#### Archivos a Crear

**T4.1: Manifest**
```
public/manifest.json (nuevo)
app/layout.tsx (modificar - agregar link)
```

**T4.2: Assets**
```
public/icons/* (generar con pwa-asset-generator)
public/splash/* (generar)
```

**T4.3: Install Prompt**
```
components/install-prompt.tsx (nuevo)
hooks/use-install-prompt.ts (nuevo)
```

**T4.4: iOS Instructions**
```
components/ios-install-guide.tsx (nuevo)
```

**T4.5: Lighthouse**
```
lighthouse-config.json (nuevo)
.github/workflows/lighthouse-ci.yml (nuevo)
```

**T4.6: Analytics**
```
lib/analytics/pwa-analytics.ts (nuevo)
```

**T4.7: Docs**
```
docs/pwa/installation.md (nuevo)
docs/pwa/offline-mode.md (nuevo)
docs/pwa/push-notifications.md (nuevo)
```

**T4.8: E2E Tests**
```
tests/e2e/pwa-install.spec.ts (nuevo)
tests/e2e/pwa-offline-flow.spec.ts (nuevo)
tests/e2e/pwa-push.spec.ts (nuevo)
```

#### Comandos Útiles

```bash
# Generar iconos
pwa-asset-generator public/logo.svg public/icons \
  --icon-only --favicon --maskable --type png

# Validar manifest
# https://manifest-validator.appspot.com/

# Lighthouse audit
npx lighthouse http://localhost:3000 --view

# Lighthouse CI
npm run lighthouse-ci

# E2E completo
npm run test:e2e
```

---

## 🧪 Testing Checklist

### Funcionalidad

- [ ] Service Worker se registra correctamente
- [ ] Assets se sirven desde cache
- [ ] API responses cacheadas con NetworkFirst
- [ ] Indicador de conexión funciona
- [ ] Operaciones offline se encolan
- [ ] Sincronización automática al reconectar
- [ ] Conflictos se resuelven correctamente
- [ ] Push notifications se reciben
- [ ] Install prompt aparece
- [ ] App se instala correctamente

### Performance

- [ ] Lighthouse PWA score >90
- [ ] Time to Interactive <2s (cached)
- [ ] Cache hit rate >80%
- [ ] Sync success rate >95%

### Compatibilidad

- [ ] Chrome Desktop ✅
- [ ] Chrome Android ✅
- [ ] Edge Desktop ✅
- [ ] Firefox Desktop ✅
- [ ] Safari Desktop ⚠️ (limitado)
- [ ] Safari iOS ⚠️ (limitado)

---

## 🐛 Debugging

### Service Worker

```javascript
// Ver estado de SW
navigator.serviceWorker.getRegistration().then(reg => {
  console.log('SW:', reg);
  console.log('Active:', reg?.active?.state);
  console.log('Waiting:', reg?.waiting);
});

// Forzar actualización de SW
navigator.serviceWorker.getRegistration().then(reg => {
  reg?.update();
});

// Limpiar todo y empezar de cero
navigator.serviceWorker.getRegistrations().then(regs => {
  regs.forEach(reg => reg.unregister());
});
caches.keys().then(keys => {
  keys.forEach(key => caches.delete(key));
});
```

### IndexedDB

```javascript
// Inspeccionar DB
import { db } from '@/lib/db/local-db';

// Ver todas las orders
const orders = await db.orders.toArray();
console.log('Orders:', orders);

// Ver sync queue
const queue = await db.syncQueue.toArray();
console.log('Queue:', queue);

// Limpiar DB
await db.delete();
```

### Push Notifications

```javascript
// Ver subscription
navigator.serviceWorker.ready.then(reg => {
  reg.pushManager.getSubscription().then(sub => {
    console.log('Subscription:', sub);
  });
});

// Test notification local
navigator.serviceWorker.ready.then(reg => {
  reg.showNotification('Test', {
    body: 'Esta es una notificación de prueba',
    icon: '/icons/icon-192x192.png'
  });
});
```

---

## 📊 Métricas de Progreso

### Daily Standup Template

```markdown
### Ayer completé:
- [x] T1.1: Configuración de Workbox
- [x] T1.2: Cache de assets estáticos

### Hoy trabajaré en:
- [ ] T1.3: Cache de API responses
- [ ] T1.4: Indicador online/offline

### Bloqueadores:
- Ninguno / Esperando review de PR #123
```

### Sprint Review Template

```markdown
## Sprint 1 Review - Service Worker

### ✅ Completado:
- Service Worker registrado
- Cache de assets
- Cache de APIs
- Indicador de conexión
- Tests >90% coverage

### 📊 Métricas:
- 5/5 tareas completadas
- 18/20 story points
- 0 bugs críticos
- Coverage: 92%

### 🚧 Pendiente para Sprint 2:
- Configurar IndexedDB
- Implementar sync queue
```

---

## 📚 Recursos

### Documentación
- [Plan Completo](../FASE_6_PLAN.md)
- [Arquitectura PWA](./ARQUITECTURA_PWA.md)
- [MDN - Service Workers](https://developer.mozilla.org/en-US/docs/Web/API/Service_Worker_API)
- [Workbox Docs](https://developers.google.com/web/tools/workbox)

### Tools
- [Lighthouse](https://developers.google.com/web/tools/lighthouse)
- [PWA Builder](https://www.pwabuilder.com/)
- [Manifest Validator](https://manifest-validator.appspot.com/)
- [Web Push Tester](https://web-push-codelab.glitch.me/)

### Templates
- [Service Worker Template](./templates/sw-template.js)
- [IndexedDB Schema](./templates/db-schema.ts)
- [Push Handler](./templates/push-handler.js)

---

## 🤝 Comunicación

### Reportar Issues
1. Revisar issues existentes en GitHub
2. Crear nuevo issue con template
3. Incluir logs y screenshots
4. Etiquetar con `fase-6` y `pwa`

### Pull Requests
1. Branch desde `main`: `feat/fase6-t1.1-workbox`
2. Commits descriptivos: `feat(pwa): add workbox configuration`
3. PR con checklist de testing
4. Request review de Tech Lead
5. Merge después de approval + CI passing

### Daily Sync
- **Hora:** 10:00 AM
- **Duración:** 15 min
- **Formato:** Ayer, Hoy, Bloqueadores
- **Canal:** Slack #fase-6

---

## ✅ Definition of Done

Una tarea está completa cuando:

- [ ] Código implementado según especificación
- [ ] Tests escritos y passing (>90% coverage)
- [ ] Documentación actualizada
- [ ] Code review aprobado
- [ ] CI/CD passing (lint, tests, build)
- [ ] Funciona en staging
- [ ] Screenshot/video de demo (si aplica)

---

## 🎉 Success Criteria

La Fase 6 está completa cuando:

- [ ] Lighthouse PWA score >90
- [ ] Todas las tareas completadas (32/32)
- [ ] Tests passing (>90% coverage)
- [ ] Documentación completa
- [ ] Deploy en production
- [ ] Métricas baselines establecidas
- [ ] Sign-off de stakeholders

---

**Última actualización:** Noviembre 3, 2025  
**Próxima revisión:** Semanal (lunes 10:00 AM)

**¿Preguntas?** Contactar a Tech Lead o abrir issue en GitHub.

---

**¡Éxito en la implementación! 🚀**
