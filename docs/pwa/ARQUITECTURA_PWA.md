# 🏗️ Arquitectura PWA - Restaurant Management System

> **Documento técnico** de arquitectura para la implementación de Progressive Web App
> 
> **Relacionado:** [FASE_6_PLAN.md](./FASE_6_PLAN.md)  
> **Fecha:** Noviembre 3, 2025

---

## 📐 Visión General

La arquitectura PWA sigue un patrón **offline-first** con sincronización bidireccional y cache inteligente.

```
┌─────────────────────────────────────────────────────────────┐
│                        Cliente (Browser)                     │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐     │
│  │   Next.js    │  │    React     │  │   UI Layer   │     │
│  │   App Router │←→│    Query     │←→│  Components  │     │
│  └──────────────┘  └──────────────┘  └──────────────┘     │
│         ↕                  ↕                  ↕             │
│  ┌──────────────────────────────────────────────────┐     │
│  │           Service Worker (sw.js)                  │     │
│  │  ┌────────────┐ ┌────────────┐ ┌──────────────┐ │     │
│  │  │  Cache API │ │ Background │ │ Push Handler │ │     │
│  │  │  Strategies│ │    Sync    │ │              │ │     │
│  │  └────────────┘ └────────────┘ └──────────────┘ │     │
│  └──────────────────────────────────────────────────┘     │
│         ↕                  ↕                  ↕             │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐     │
│  │  Cache API   │  │  IndexedDB   │  │ LocalStorage │     │
│  │  (Responses) │  │   (Dexie)    │  │   (Tokens)   │     │
│  └──────────────┘  └──────────────┘  └──────────────┘     │
│                                                              │
└─────────────────────────────────────────────────────────────┘
                              ↕
                    ┌─────────────────┐
                    │     Network      │
                    └─────────────────┘
                              ↕
┌─────────────────────────────────────────────────────────────┐
│                    Backend (Supabase)                        │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐     │
│  │  PostgreSQL  │  │  Realtime    │  │ Edge Funcs   │     │
│  │  + RLS       │←→│  Broadcasts  │←→│ (Push API)   │     │
│  └──────────────┘  └──────────────┘  └──────────────┘     │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

---

## 🔧 Componentes Principales

### 1. Service Worker (sw.js)

**Responsabilidades:**
- Interceptar requests de red
- Aplicar estrategias de cache
- Manejar sincronización en background
- Procesar notificaciones push
- Gestionar actualizaciones de la app

**Lifecycle:**
```
Install → Waiting → Activate → Fetch/Push/Sync Events → Terminate
```

**Eventos:**
```javascript
// Install: Precache de assets críticos
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open('static-v1').then(cache =>
      cache.addAll([
        '/',
        '/dashboard',
        '/salon',
        '/manifest.json',
        '/icons/icon-192x192.png'
      ])
    )
  );
});

// Activate: Limpieza de caches viejos
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(
        keys
          .filter(key => key !== 'static-v1')
          .map(key => caches.delete(key))
      )
    )
  );
});

// Fetch: Aplicar estrategias de cache
self.addEventListener('fetch', event => {
  event.respondWith(handleFetch(event.request));
});

// Sync: Procesar cola de sincronización
self.addEventListener('sync', event => {
  if (event.tag === 'sync-queue') {
    event.waitUntil(processSyncQueue());
  }
});

// Push: Mostrar notificaciones
self.addEventListener('push', event => {
  const data = event.data.json();
  event.waitUntil(
    self.registration.showNotification(data.title, data.options)
  );
});
```

---

### 2. Cache Strategies

#### A. CacheFirst (Assets Estáticos)
**Uso:** JS, CSS, imágenes, fonts

```javascript
// Siempre intenta desde cache primero
async function cacheFirst(request) {
  const cached = await caches.match(request);
  if (cached) return cached;
  
  const response = await fetch(request);
  const cache = await caches.open('static-v1');
  cache.put(request, response.clone());
  
  return response;
}
```

**Ventajas:**
- ⚡ Ultra rápido (sin red)
- 💾 Funciona offline
- 📉 Reduce bandwidth

**Desventajas:**
- 🔄 No garantiza data fresca
- 💽 Usa storage

#### B. NetworkFirst (API Responses)
**Uso:** Datos de Supabase (orders, tables, menu)

```javascript
// Intenta red primero, fallback a cache
async function networkFirst(request, timeout = 3000) {
  try {
    const response = await Promise.race([
      fetch(request),
      new Promise((_, reject) =>
        setTimeout(() => reject('timeout'), timeout)
      )
    ]);
    
    const cache = await caches.open('api-v1');
    cache.put(request, response.clone());
    
    return response;
  } catch (error) {
    const cached = await caches.match(request);
    return cached || Response.error();
  }
}
```

**Ventajas:**
- 📊 Data siempre fresca (cuando online)
- 🔄 Fallback a cache offline
- ⏱️ Timeout configurable

**Desventajas:**
- 🐌 Más lento que CacheFirst
- 📡 Requiere red activa

#### C. StaleWhileRevalidate (Híbrido)
**Uso:** Data que cambia poco (menú, staff)

```javascript
// Responde con cache, actualiza en background
async function staleWhileRevalidate(request) {
  const cached = await caches.match(request);
  
  const fetchPromise = fetch(request).then(response => {
    const cache = await caches.open('stale-v1');
    cache.put(request, response.clone());
    return response;
  });
  
  return cached || fetchPromise;
}
```

**Ventajas:**
- ⚡ Respuesta instantánea
- 🔄 Data se actualiza en background
- 📊 Balance velocidad/frescura

**Desventajas:**
- 🔁 Doble request (cache + red)
- 💾 Usa más bandwidth

---

### 3. IndexedDB Schema (Dexie)

**Database:** `restaurant-local-db`

```typescript
export class LocalDB extends Dexie {
  // Tablas
  orders!: Table<Order>;
  tables!: Table<TableData>;
  menuItems!: Table<MenuItem>;
  syncQueue!: Table<SyncOperation>;
  
  constructor() {
    super('restaurant-local-db');
    
    // Schema versión 1
    this.version(1).stores({
      // Orders: pedidos locales y cacheados
      orders: '++id, tableId, status, createdAt, syncedAt',
      
      // Tables: estado de mesas
      tables: '++id, zoneId, status, lastSync',
      
      // MenuItems: catálogo de menú
      menuItems: '++id, categoryId, available, lastSync',
      
      // SyncQueue: operaciones pendientes
      syncQueue: '++id, type, status, priority, createdAt, retries'
    });
  }
}

export const db = new LocalDB();
```

**Índices:**
- `orders`: ID, tableId, status, createdAt (para queries rápidas)
- `syncQueue`: status, priority, createdAt (para procesamiento FIFO)

**Límites:**
- **Quota:** ~50MB (Chrome), ~100MB (Firefox)
- **Expiration:** 7 días sin uso
- **Cleanup:** Automático cuando >80% quota

---

### 4. Sync Queue

**Estados de Operación:**
```typescript
type SyncStatus = 
  | 'pending'      // Esperando sync
  | 'syncing'      // En proceso
  | 'completed'    // Exitosa
  | 'failed'       // Error
  | 'conflict';    // Conflicto detectado
```

**Tipos de Operación:**
```typescript
type SyncOperationType =
  | 'CREATE_ORDER'
  | 'UPDATE_ORDER_STATUS'
  | 'UPDATE_TABLE_STATUS'
  | 'CREATE_PAYMENT'
  | 'UPDATE_MENU_ITEM';
```

**Procesamiento:**
```typescript
async function processSyncQueue() {
  // 1. Obtener operaciones pendientes (ordenadas por prioridad y fecha)
  const operations = await db.syncQueue
    .where('status').equals('pending')
    .sortBy('priority', 'createdAt');
  
  // 2. Procesar secuencialmente (evitar race conditions)
  for (const op of operations) {
    try {
      // Marcar como "syncing"
      await db.syncQueue.update(op.id, { status: 'syncing' });
      
      // Ejecutar operación
      const result = await executeOperation(op);
      
      // Si exitosa, marcar como completed
      if (result.success) {
        await db.syncQueue.update(op.id, {
          status: 'completed',
          syncedAt: new Date()
        });
      } else if (result.conflict) {
        // Si hay conflicto, marcar y notificar
        await db.syncQueue.update(op.id, {
          status: 'conflict',
          conflictData: result.conflictData
        });
        showConflictDialog(op, result.conflictData);
      }
    } catch (error) {
      // Si falla, incrementar retries
      const retries = op.retries + 1;
      
      if (retries < MAX_RETRIES) {
        await db.syncQueue.update(op.id, {
          status: 'pending',
          retries,
          nextRetryAt: calculateBackoff(retries)
        });
      } else {
        await db.syncQueue.update(op.id, {
          status: 'failed',
          error: error.message
        });
      }
    }
  }
}
```

**Retry Strategy (Exponential Backoff):**
```typescript
function calculateBackoff(retries: number): Date {
  // 2^retries segundos (max 1 hora)
  const seconds = Math.min(Math.pow(2, retries), 3600);
  return new Date(Date.now() + seconds * 1000);
}

// Ejemplo:
// Retry 1: 2s
// Retry 2: 4s
// Retry 3: 8s
// Retry 4: 16s
// Retry 5: 32s
// Retry 6+: 3600s (1 hora)
```

---

### 5. Conflict Resolution

**Estrategias:**

#### A. Last Write Wins (LWW)
**Uso:** Cambios simples de estado

```typescript
function resolveConflictLWW(local: any, remote: any) {
  return local.updatedAt > remote.updatedAt ? local : remote;
}
```

#### B. Client Wins
**Uso:** Creaciones offline (pedidos, pagos)

```typescript
function resolveConflictClientWins(local: any, remote: any) {
  return local; // Siempre gana el cliente
}
```

#### C. Server Wins
**Uso:** Datos maestros (menú, configuración)

```typescript
function resolveConflictServerWins(local: any, remote: any) {
  return remote; // Siempre gana el servidor
}
```

#### D. Field-level Merge
**Uso:** Cambios no conflictivos en diferentes campos

```typescript
function resolveConflictMerge(local: any, remote: any) {
  return {
    ...remote,
    ...local,
    // Si hay conflicto en un campo, aplicar otra estrategia
    status: resolveFieldConflict('status', local.status, remote.status)
  };
}
```

#### E. Manual Resolution
**Uso:** Conflictos complejos o críticos

```typescript
async function resolveConflictManual(local: any, remote: any) {
  // Mostrar modal con ambas versiones
  const choice = await showConflictDialog({
    local,
    remote,
    options: ['Mantener local', 'Usar servidor', 'Combinar']
  });
  
  return choice === 'local' ? local :
         choice === 'remote' ? remote :
         await mergeManually(local, remote);
}
```

---

### 6. Push Notifications

**Arquitectura:**

```
┌──────────────┐                ┌──────────────┐
│   Cliente    │                │   Supabase   │
│   (Browser)  │                │  Edge Func   │
└──────────────┘                └──────────────┘
       │                               │
       │ 1. Subscribe to Push          │
       ├──────────────────────────────>│
       │                               │
       │ 2. Save Subscription          │
       │   (endpoint + keys)           │
       │<──────────────────────────────┤
       │                               │
       │                               │
       │    ... tiempo después ...     │
       │                               │
       │                               │
       │ 3. Trigger Event (new order)  │
       │                               │
       │                 ┌──────────────────┐
       │                 │  Database        │
       │                 │  Trigger         │
       │                 └────────┬─────────┘
       │                          │
       │                          │ 4. Invoke
       │                          │    send-push
       │                          ↓
       │                 ┌──────────────────┐
       │                 │  Web Push API    │
       │                 │  (Google/Mozilla)│
       │                 └────────┬─────────┘
       │                          │
       │ 5. Push Notification     │
       │<─────────────────────────┤
       │                          │
       ↓                          │
┌──────────────┐                 │
│ Service      │                 │
│ Worker       │                 │
│ (push event) │                 │
└──────────────┘                 │
       │                          │
       │ 6. Show Notification     │
       ↓                          │
┌──────────────┐                 │
│  User sees   │                 │
│  notification│                 │
└──────────────┘                 │
```

**VAPID Keys:**
```bash
# Generar keys (una sola vez)
npx web-push generate-vapid-keys

# Output:
# Public Key: BPx...
# Private Key: AbC...

# Guardar en Supabase Secrets
supabase secrets set VAPID_PUBLIC_KEY="BPx..."
supabase secrets set VAPID_PRIVATE_KEY="AbC..."
```

**Subscription Object:**
```json
{
  "endpoint": "https://fcm.googleapis.com/fcm/send/...",
  "expirationTime": null,
  "keys": {
    "p256dh": "BJy...",
    "auth": "k8T..."
  }
}
```

---

## 📊 Data Flow

### Flujo Online (Normal)

```
Usuario                React Query           Supabase
  │                         │                    │
  │ 1. Acción (crear pedido)│                    │
  ├────────────────────────>│                    │
  │                         │ 2. POST /orders    │
  │                         ├───────────────────>│
  │                         │                    │
  │                         │ 3. Success Response│
  │                         │<───────────────────┤
  │                         │                    │
  │                         │ 4. Invalidate cache│
  │                         ├─────────┐          │
  │                         │         │          │
  │                         │<────────┘          │
  │                         │                    │
  │ 5. UI actualizado       │                    │
  │<────────────────────────┤                    │
  │                         │                    │
  │                         │ 6. Realtime update │
  │                         │    (otros clientes)│
  │                         │<───────────────────┤
  │                         │                    │
```

### Flujo Offline

```
Usuario            React Query         IndexedDB        Sync Queue
  │                    │                   │                │
  │ 1. Acción offline  │                   │                │
  ├───────────────────>│                   │                │
  │                    │ 2. Guardar local  │                │
  │                    ├──────────────────>│                │
  │                    │                   │                │
  │                    │ 3. Encolar sync   │                │
  │                    │                   │                │
  │                    ├───────────────────────────────────>│
  │                    │                   │                │
  │ 4. UI actualizado  │                   │                │
  │    (optimistic)    │                   │                │
  │<───────────────────┤                   │                │
  │                    │                   │                │
  │    ... reconexión ...                  │                │
  │                    │                   │                │
  │                    │                   │ 5. Process queue│
  │                    │                   │<───────────────┤
  │                    │                   │                │
  │                    │ 6. Sync to server │                │
  │                    │<──────────────────┤                │
  │                    │                   │                │
  │                    │──────────────────────> Supabase    │
  │                    │                   │                │
  │                    │ 7. Confirm sync   │                │
  │                    │<──────────────────────             │
  │                    │                   │                │
  │ 8. Toast "Sincronizado"│               │                │
  │<───────────────────┤                   │                │
  │                    │                   │                │
```

---

## 🔒 Security Considerations

### 1. Service Worker Scope
- **Restringir scope:** Solo `/` o rutas específicas
- **HTTPS obligatorio:** PWA no funciona sin SSL
- **CSP headers:** Content Security Policy para SW

### 2. Cache Security
- **No cachear:** Tokens, passwords, PII
- **Expiración:** Cache limitado a 7 días
- **Limpieza:** Borrar cache al logout

### 3. Push Notifications
- **VAPID authentication:** Verificar origen de push
- **User consent:** Siempre pedir permiso explícito
- **Rate limiting:** Máximo 10 push/hora por usuario

### 4. IndexedDB
- **Encriptación:** Considerar crypto para data sensible
- **Quota management:** Monitorear y limpiar proactivamente
- **Access control:** Validar tenant_id en todas las queries

---

## 🎯 Performance Optimizations

### 1. Cache Priorization
```javascript
// Orden de precache (crítico primero)
const PRECACHE_URLS = [
  '/',                    // Landing
  '/dashboard',           // Dashboard
  '/salon',               // Salón (usado frecuentemente)
  '/manifest.json',       // Manifest
  '/icons/icon-192x192.png' // Icono principal
];
```

### 2. Lazy Loading
```javascript
// Registrar SW solo cuando idle
if ('requestIdleCallback' in window) {
  requestIdleCallback(() => {
    navigator.serviceWorker.register('/sw.js');
  });
} else {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js');
  });
}
```

### 3. Background Sync Throttling
```javascript
// Limitar frecuencia de sync (evitar battery drain)
const MIN_SYNC_INTERVAL = 60 * 1000; // 1 minuto
let lastSyncTime = 0;

async function throttledSync() {
  const now = Date.now();
  if (now - lastSyncTime < MIN_SYNC_INTERVAL) {
    console.log('Sync throttled, too soon');
    return;
  }
  
  lastSyncTime = now;
  await processSyncQueue();
}
```

### 4. Selective Caching
```javascript
// No cachear responses grandes o poco usadas
const shouldCache = (response) => {
  const size = response.headers.get('content-length');
  return size && parseInt(size) < 1024 * 1024; // < 1MB
};
```

---

## 📈 Monitoring & Analytics

### Métricas Clave

```typescript
// Service Worker Stats
interface SWStats {
  cacheHitRate: number;      // % requests servidas desde cache
  cacheMissRate: number;     // % requests que fueron a red
  averageResponseTime: number; // ms promedio de respuesta
  offlineRequests: number;   // requests manejadas offline
}

// Sync Stats
interface SyncStats {
  queueSize: number;         // Operaciones pendientes
  successRate: number;       // % operaciones exitosas
  averageSyncTime: number;   // ms promedio de sync
  conflictsDetected: number; // Conflictos encontrados
}

// Push Stats
interface PushStats {
  subscriptions: number;     // Usuarios suscritos
  delivered: number;         // Notificaciones entregadas
  clicked: number;           // Notificaciones clickeadas
  dismissed: number;         // Notificaciones cerradas
}
```

### Tracking Events

```typescript
// Eventos de Analytics
analytics.track('sw_registered');
analytics.track('sw_updated');
analytics.track('cache_hit', { url });
analytics.track('cache_miss', { url });
analytics.track('offline_request', { method, url });
analytics.track('sync_completed', { operations, time });
analytics.track('sync_failed', { operation, error });
analytics.track('push_received', { type });
analytics.track('push_clicked', { type, action });
```

---

## 🧪 Testing Strategy

### 1. Unit Tests (Service Worker)
```typescript
// Mockear Service Worker API
import { setupServer } from 'msw/node';

describe('Service Worker', () => {
  it('registers successfully', async () => {
    const registration = await navigator.serviceWorker.register('/sw.js');
    expect(registration).toBeDefined();
  });
  
  it('caches static assets', async () => {
    const cache = await caches.open('static-v1');
    const response = await cache.match('/dashboard');
    expect(response).toBeDefined();
  });
});
```

### 2. Integration Tests (Sync)
```typescript
describe('Sync Queue', () => {
  it('processes operations in order', async () => {
    await db.syncQueue.bulkAdd([
      { type: 'CREATE_ORDER', priority: 1 },
      { type: 'UPDATE_TABLE', priority: 2 },
    ]);
    
    await processSyncQueue();
    
    const completed = await db.syncQueue
      .where('status').equals('completed')
      .toArray();
    
    expect(completed).toHaveLength(2);
  });
});
```

### 3. E2E Tests (Playwright)
```typescript
test('offline flow', async ({ page, context }) => {
  // 1. Load app
  await page.goto('/dashboard');
  
  // 2. Go offline
  await context.setOffline(true);
  
  // 3. Create order
  await page.click('[data-testid="new-order"]');
  await page.fill('[name="items"]', 'Pizza');
  await page.click('[data-testid="submit"]');
  
  // 4. Verify queued
  const status = await page.textContent('[data-testid="sync-status"]');
  expect(status).toContain('1 operación pendiente');
  
  // 5. Go online
  await context.setOffline(false);
  
  // 6. Wait for sync
  await page.waitForSelector('[data-testid="sync-complete"]');
  
  // 7. Verify synced
  const orders = await page.textContent('[data-testid="orders-count"]');
  expect(orders).toContain('1 pedido');
});
```

---

## 📚 Referencias

- [Service Worker API - MDN](https://developer.mozilla.org/en-US/docs/Web/API/Service_Worker_API)
- [Cache API - MDN](https://developer.mozilla.org/en-US/docs/Web/API/Cache)
- [IndexedDB - MDN](https://developer.mozilla.org/en-US/docs/Web/API/IndexedDB_API)
- [Background Sync - web.dev](https://web.dev/background-sync/)
- [Push API - MDN](https://developer.mozilla.org/en-US/docs/Web/API/Push_API)
- [Workbox - Google](https://developers.google.com/web/tools/workbox)
- [Dexie.js - Documentation](https://dexie.org/)

---

**Versión:** 1.0  
**Última actualización:** Noviembre 3, 2025  
**Mantenedor:** Tech Lead
