# 📋 FASE 6: PWA & Offline - Plan de Implementación

> **Objetivo:** Convertir el sistema en Progressive Web App con funcionalidad offline completa
> 
> **Fecha de inicio:** Noviembre 3, 2025  
> **Duración estimada:** 3-4 semanas (4 sprints)  
> **Prioridad:** 🔴 Alta

---

## 🎯 Objetivos Estratégicos

### Business Goals
1. **Resiliencia:** Funcionalidad completa sin conexión a internet
2. **Engagement:** +40% con push notifications
3. **Velocidad:** 60% más rápido en cargas repetidas (cache)
4. **Instalación:** >20% de usuarios instalan la app

### Technical Goals
1. **Offline-first:** Service Worker con cache inteligente
2. **Sync:** Sincronización automática bidireccional
3. **Push:** Notificaciones en tiempo real
4. **PWA Score:** >90 en Lighthouse

### User Experience Goals
1. **Sin interrupciones:** El usuario no nota la pérdida de conexión
2. **Feedback claro:** Indicadores de estado de sincronización
3. **Instalable:** Experiencia nativa en mobile/desktop
4. **Performante:** Time to Interactive <2s (offline)

---

## 📊 Métricas de Éxito

| Métrica | Baseline (Fase 5) | Target (Fase 6) | Método de Medición |
|---------|-------------------|-----------------|-------------------|
| **Offline Usage** | 0% | >30% | Analytics events |
| **Install Rate** | 0% | >20% | PWA install tracking |
| **Cache Hit Rate** | 0% | >80% | Service Worker stats |
| **Sync Success** | N/A | >95% | Background sync logs |
| **Time to Interactive (cached)** | ~1.5s | <2s | Lighthouse |
| **Push Engagement** | 0% | >25% | Notification clicks |
| **Lighthouse PWA Score** | 30 | >90 | Lighthouse CI |

---

## 🏗️ Arquitectura PWA

### Stack Tecnológico

```
PWA Stack:
├── Service Worker
│   ├── Workbox 7.0 (Google's PWA toolkit)
│   ├── Cache Strategies (Network First, Cache First, Stale-While-Revalidate)
│   └── Background Sync API
│
├── Local Storage
│   ├── IndexedDB (Dexie.js wrapper)
│   ├── LocalStorage (tokens, preferences)
│   └── Cache API (assets, responses)
│
├── Push Notifications
│   ├── Web Push API (frontend)
│   ├── Supabase Functions (backend)
│   └── VAPID keys (authentication)
│
└── Manifest & Assets
    ├── manifest.json (app metadata)
    ├── Icons (192x192, 512x512, maskable)
    └── Splash screens (iOS, Android)
```

### Dependencias Nuevas

```json
{
  "dependencies": {
    "workbox-webpack-plugin": "^7.3.0",
    "workbox-window": "^7.3.0",
    "dexie": "^4.0.0",
    "dexie-react-hooks": "^1.1.7",
    "web-push": "^3.6.0"
  },
  "devDependencies": {
    "workbox-cli": "^7.3.0",
    "@types/web-push": "^3.6.0"
  }
}
```

### Configuración Next.js

```javascript
// next.config.mjs
import withPWA from '@ducanh2912/next-pwa';

const pwaConfig = {
  dest: 'public',
  disable: process.env.NODE_ENV === 'development',
  register: true,
  skipWaiting: true,
  runtimeCaching: [
    {
      urlPattern: /^https:\/\/.*\.supabase\.co\/.*$/,
      handler: 'NetworkFirst',
      options: {
        cacheName: 'supabase-api',
        expiration: {
          maxEntries: 200,
          maxAgeSeconds: 60 * 60 // 1 hour
        }
      }
    },
    {
      urlPattern: /\.(png|jpg|jpeg|svg|gif|webp)$/,
      handler: 'CacheFirst',
      options: {
        cacheName: 'images',
        expiration: {
          maxEntries: 100,
          maxAgeSeconds: 60 * 60 * 24 * 30 // 30 days
        }
      }
    }
  ]
};

export default withPWA(pwaConfig)(nextConfig);
```

---

## 📅 Plan de Sprints

### Sprint 1: Service Worker & Cache (Semana 1)
**Objetivo:** Implementar Service Worker con estrategias de cache básicas

#### Tareas Técnicas

##### T1.1: Configuración de Workbox ⚙️
- **Descripción:** Instalar y configurar Workbox en Next.js
- **Archivos:**
  - `next.config.mjs` - Agregar configuración PWA
  - `public/sw.js` - Service Worker base
  - `.env.local` - Variables de configuración
- **Aceptación:**
  - [ ] Workbox instalado y configurando
  - [ ] Service Worker registrado correctamente
  - [ ] DevTools muestra SW activo
- **Estimación:** 4 horas
- **Dependencias:** Ninguna
- **Asignado:** Backend Dev

##### T1.2: Cache de Assets Estáticos 📦
- **Descripción:** Precache de JS, CSS, imágenes y fonts
- **Archivos:**
  - `public/sw.js` - Estrategia CacheFirst
  - `lib/pwa/cache-config.ts` - Configuración de cache
- **Estrategia:**
  ```javascript
  // CacheFirst para assets inmutables
  registerRoute(
    /\.(js|css|woff2)$/,
    new CacheFirst({
      cacheName: 'static-assets',
      plugins: [
        new ExpirationPlugin({
          maxEntries: 60,
          maxAgeSeconds: 30 * 24 * 60 * 60, // 30 days
        }),
      ],
    })
  );
  ```
- **Aceptación:**
  - [ ] Assets cacheados en primera visita
  - [ ] Segunda visita carga desde cache
  - [ ] Cache limita a 60 entries
- **Estimación:** 3 horas
- **Dependencias:** T1.1
- **Asignado:** Frontend Dev

##### T1.3: Cache de API Responses 🌐
- **Descripción:** NetworkFirst para APIs de Supabase
- **Archivos:**
  - `public/sw.js` - Estrategia NetworkFirst
  - `lib/pwa/api-cache.ts` - Helpers de cache
- **Estrategia:**
  ```javascript
  // NetworkFirst para datos frescos
  registerRoute(
    ({ url }) => url.origin === 'https://supabase.co',
    new NetworkFirst({
      cacheName: 'api-cache',
      networkTimeoutSeconds: 3,
      plugins: [
        new ExpirationPlugin({
          maxEntries: 200,
          maxAgeSeconds: 60 * 60, // 1 hour
        }),
      ],
    })
  );
  ```
- **Aceptación:**
  - [ ] API responses cacheadas
  - [ ] Fallback a cache si offline
  - [ ] Timeout de 3 segundos
- **Estimación:** 4 horas
- **Dependencias:** T1.1
- **Asignado:** Backend Dev

##### T1.4: Indicador de Estado Online/Offline 🔴🟢
- **Descripción:** UI que muestra el estado de conexión
- **Archivos:**
  - `components/connection-status.tsx` - Nuevo componente
  - `app/layout.tsx` - Integrar indicador
  - `hooks/use-online-status.ts` - Hook personalizado
- **Comportamiento:**
  - 🟢 Online: Sin indicador (por defecto)
  - 🟡 Sincronizando: Badge amarillo
  - 🔴 Offline: Banner rojo con mensaje
- **Aceptación:**
  - [ ] Detecta cambios de conexión
  - [ ] UI actualiza en tiempo real
  - [ ] Toast notification al cambiar estado
- **Estimación:** 3 horas
- **Dependencias:** Ninguna
- **Asignado:** Frontend Dev

##### T1.5: Testing de Cache 🧪
- **Descripción:** Tests unitarios e integración
- **Archivos:**
  - `tests/pwa/service-worker.test.ts` - Tests de SW
  - `tests/pwa/cache-strategies.test.ts` - Tests de cache
- **Test Cases:**
  - Service Worker se registra correctamente
  - Assets se cachean en primera visita
  - API responses usan NetworkFirst
  - Fallback a cache cuando offline
- **Aceptación:**
  - [ ] 100% coverage de lógica PWA
  - [ ] Tests pasan en CI/CD
  - [ ] Coverage >90% en módulos PWA
- **Estimación:** 4 horas
- **Dependencias:** T1.1, T1.2, T1.3
- **Asignado:** QA Dev

#### Entregables Sprint 1
- ✅ Service Worker funcionando
- ✅ Cache de assets estáticos
- ✅ Cache de API responses
- ✅ Indicador de estado online/offline
- ✅ Tests de cache (>90% coverage)

#### Definition of Done Sprint 1
- [ ] Service Worker registrado y activo
- [ ] Assets se sirven desde cache
- [ ] API responses cacheadas con NetworkFirst
- [ ] Indicador de conexión funcional
- [ ] Tests passing (>90% coverage)
- [ ] Code review aprobado
- [ ] Documentación actualizada

---

### Sprint 2: Offline Data & Sync (Semana 2)
**Objetivo:** Implementar persistencia local y sincronización bidireccional

#### Tareas Técnicas

##### T2.1: Configuración de IndexedDB (Dexie) 🗄️
- **Descripción:** Setup de base de datos local
- **Archivos:**
  - `lib/db/local-db.ts` - Esquema de Dexie
  - `lib/db/migrations.ts` - Migraciones
- **Esquema:**
  ```typescript
  // Tablas locales
  class LocalDB extends Dexie {
    orders!: Table<Order>;
    tables!: Table<TableData>;
    menuItems!: Table<MenuItem>;
    syncQueue!: Table<SyncOperation>;
    
    constructor() {
      super('restaurant-local-db');
      this.version(1).stores({
        orders: '++id, tableId, status, createdAt',
        tables: '++id, zoneId, status, lastSync',
        menuItems: '++id, categoryId, available',
        syncQueue: '++id, type, status, createdAt'
      });
    }
  }
  ```
- **Aceptación:**
  - [ ] IndexedDB inicializa correctamente
  - [ ] Esquema con índices optimizados
  - [ ] Migrations system en lugar
- **Estimación:** 4 horas
- **Dependencias:** Ninguna
- **Asignado:** Backend Dev

##### T2.2: Sync Queue para Operaciones Offline 📝
- **Descripción:** Cola de operaciones pendientes de sincronización
- **Archivos:**
  - `lib/sync/sync-queue.ts` - Gestión de cola
  - `lib/sync/sync-operations.ts` - Tipos de operaciones
- **Operaciones Soportadas:**
  - `CREATE_ORDER` - Pedido creado offline
  - `UPDATE_TABLE_STATUS` - Cambio de estado de mesa
  - `UPDATE_ORDER_STATUS` - Cambio de estado de pedido
  - `CREATE_PAYMENT` - Registro de pago
- **Flujo:**
  ```typescript
  // Usuario hace acción offline
  async function createOrderOffline(order: Order) {
    // 1. Guardar en IndexedDB
    await localDB.orders.add(order);
    
    // 2. Agregar a sync queue
    await localDB.syncQueue.add({
      type: 'CREATE_ORDER',
      payload: order,
      status: 'pending',
      createdAt: new Date()
    });
    
    // 3. Intentar sync si está online
    if (navigator.onLine) {
      await processSyncQueue();
    }
  }
  ```
- **Aceptación:**
  - [ ] Operaciones offline se encolan
  - [ ] Queue persiste en IndexedDB
  - [ ] Retry automático al reconectar
- **Estimación:** 6 horas
- **Dependencias:** T2.1
- **Asignado:** Backend Dev

##### T2.3: Background Sync API 🔄
- **Descripción:** Sincronización automática en background
- **Archivos:**
  - `public/sw.js` - Background sync event
  - `lib/sync/background-sync.ts` - Lógica de sync
- **Implementación:**
  ```javascript
  // Service Worker
  self.addEventListener('sync', event => {
    if (event.tag === 'sync-operations') {
      event.waitUntil(processSyncQueue());
    }
  });
  
  // Cliente registra sync
  async function scheduleBackgroundSync() {
    const registration = await navigator.serviceWorker.ready;
    await registration.sync.register('sync-operations');
  }
  ```
- **Aceptación:**
  - [ ] Background sync se registra
  - [ ] Queue se procesa automáticamente
  - [ ] Retry con exponential backoff
- **Estimación:** 5 horas
- **Dependencias:** T2.2
- **Asignado:** Backend Dev

##### T2.4: Conflict Resolution 🔀
- **Descripción:** Resolver conflictos en sincronización bidireccional
- **Archivos:**
  - `lib/sync/conflict-resolver.ts` - Lógica de resolución
  - `lib/sync/merge-strategies.ts` - Estrategias de merge
- **Estrategias:**
  - **Last Write Wins (LWW):** Para cambios simples (status)
  - **Client Wins:** Para creaciones offline
  - **Server Wins:** Para datos maestros (menú)
  - **Manual Resolution:** Para conflictos complejos (UI)
- **Ejemplo:**
  ```typescript
  async function resolveConflict(
    local: Order,
    remote: Order
  ): Promise<Order> {
    // Si el servidor tiene cambios más recientes
    if (remote.updatedAt > local.updatedAt) {
      return remote; // Server wins
    }
    
    // Si hay cambios no conflictivos, merge
    if (canMerge(local, remote)) {
      return merge(local, remote);
    }
    
    // Si hay conflicto irreconciliable, UI
    return await showConflictDialog(local, remote);
  }
  ```
- **Aceptación:**
  - [ ] Conflictos se detectan
  - [ ] Estrategias funcionan correctamente
  - [ ] UI para conflictos manuales
- **Estimación:** 6 horas
- **Dependencias:** T2.2, T2.3
- **Asignado:** Backend Dev

##### T2.5: UI de Estado de Sincronización 📊
- **Descripción:** Panel que muestra operaciones pendientes
- **Archivos:**
  - `components/sync-status-panel.tsx` - Componente
  - `app/configuracion/sync/page.tsx` - Página de config
- **Features:**
  - Lista de operaciones pendientes
  - Progress bar de sincronización
  - Botón de "Forzar Sync"
  - Historial de sync (últimas 24h)
- **Aceptación:**
  - [ ] Panel muestra operaciones en cola
  - [ ] Progress en tiempo real
  - [ ] Retry manual de operaciones fallidas
- **Estimación:** 5 horas
- **Dependencias:** T2.2
- **Asignado:** Frontend Dev

##### T2.6: Testing de Sincronización 🧪
- **Descripción:** Tests de sync y conflict resolution
- **Archivos:**
  - `tests/sync/sync-queue.test.ts`
  - `tests/sync/conflict-resolution.test.ts`
  - `tests/e2e/offline-sync.spec.ts`
- **Test Cases:**
  - Operaciones se encolan offline
  - Sync automático al reconectar
  - Conflict resolution funciona
  - UI refleja estado correcto
- **Aceptación:**
  - [ ] Tests unitarios >90% coverage
  - [ ] E2E test de flujo completo offline→sync
  - [ ] Tests pasan en CI/CD
- **Estimación:** 5 horas
- **Dependencias:** T2.1-T2.5
- **Asignado:** QA Dev

#### Entregables Sprint 2
- ✅ IndexedDB configurado (Dexie)
- ✅ Sync queue para operaciones offline
- ✅ Background Sync API implementado
- ✅ Conflict resolution strategies
- ✅ UI de estado de sincronización
- ✅ Tests de sync (>90% coverage)

#### Definition of Done Sprint 2
- [ ] IndexedDB funcional con schema correcto
- [ ] Operaciones offline se encolan y sincronizan
- [ ] Background sync activo
- [ ] Conflictos se resuelven automáticamente
- [ ] UI muestra estado de sync
- [ ] Tests passing (>90% coverage)
- [ ] Code review aprobado
- [ ] Documentación actualizada

---

### Sprint 3: Push Notifications (Semana 3)
**Objetivo:** Implementar sistema de notificaciones push

#### Tareas Técnicas

##### T3.1: Backend de Push Notifications (Supabase) 📡
- **Descripción:** API para enviar push notifications
- **Archivos:**
  - `supabase/functions/send-push/index.ts` - Edge function
  - `supabase/migrations/20250103_push_subscriptions.sql` - Tabla
- **Schema:**
  ```sql
  CREATE TABLE push_subscriptions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id),
    tenant_id UUID REFERENCES tenants(id),
    endpoint TEXT NOT NULL,
    keys JSONB NOT NULL,
    device_info JSONB,
    created_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(user_id, endpoint)
  );
  
  -- RLS policies
  ALTER TABLE push_subscriptions ENABLE ROW LEVEL SECURITY;
  CREATE POLICY "Users manage own subscriptions"
    ON push_subscriptions FOR ALL
    USING (auth.uid() = user_id);
  ```
- **Edge Function:**
  ```typescript
  // supabase/functions/send-push/index.ts
  import webpush from 'web-push';
  
  webpush.setVapidDetails(
    'mailto:admin@restaurant.com',
    process.env.VAPID_PUBLIC_KEY!,
    process.env.VAPID_PRIVATE_KEY!
  );
  
  Deno.serve(async (req) => {
    const { userId, title, body, data } = await req.json();
    
    // Get user subscriptions
    const { data: subs } = await supabase
      .from('push_subscriptions')
      .select('*')
      .eq('user_id', userId);
    
    // Send to all devices
    await Promise.all(subs.map(sub =>
      webpush.sendNotification(sub, JSON.stringify({
        title, body, data
      }))
    ));
    
    return new Response('OK');
  });
  ```
- **Aceptación:**
  - [ ] Tabla push_subscriptions creada
  - [ ] Edge function desplegada
  - [ ] VAPID keys configuradas
- **Estimación:** 5 horas
- **Dependencias:** Ninguna
- **Asignado:** Backend Dev

##### T3.2: Frontend - Subscription Management 🔔
- **Descripción:** Lógica para suscribir usuarios a push
- **Archivos:**
  - `lib/push/push-manager.ts` - Gestión de push
  - `hooks/use-push-notifications.ts` - Hook
- **Implementación:**
  ```typescript
  export async function subscribeToPush() {
    // Request permission
    const permission = await Notification.requestPermission();
    if (permission !== 'granted') return null;
    
    // Get SW registration
    const registration = await navigator.serviceWorker.ready;
    
    // Subscribe
    const subscription = await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY)
    });
    
    // Save to Supabase
    await supabase.from('push_subscriptions').insert({
      user_id: user.id,
      tenant_id: tenant.id,
      endpoint: subscription.endpoint,
      keys: subscription.toJSON().keys
    });
    
    return subscription;
  }
  ```
- **Aceptación:**
  - [ ] Request permission UI/UX
  - [ ] Subscription se guarda en Supabase
  - [ ] Unsubscribe funcional
- **Estimación:** 4 horas
- **Dependencias:** T3.1
- **Asignado:** Frontend Dev

##### T3.3: Service Worker - Push Event Handler 📨
- **Descripción:** Manejar notificaciones entrantes
- **Archivos:**
  - `public/sw.js` - Push event listener
- **Implementación:**
  ```javascript
  self.addEventListener('push', event => {
    const data = event.data.json();
    
    const options = {
      body: data.body,
      icon: '/icons/icon-192x192.png',
      badge: '/icons/badge-72x72.png',
      data: data.data,
      actions: [
        { action: 'view', title: 'Ver' },
        { action: 'dismiss', title: 'Cerrar' }
      ],
      vibrate: [200, 100, 200],
      tag: data.tag || 'default'
    };
    
    event.waitUntil(
      self.registration.showNotification(data.title, options)
    );
  });
  
  self.addEventListener('notificationclick', event => {
    event.notification.close();
    
    if (event.action === 'view') {
      clients.openWindow(event.notification.data.url);
    }
  });
  ```
- **Aceptación:**
  - [ ] Notificaciones se muestran
  - [ ] Click abre la app en URL correcta
  - [ ] Actions funcionan
- **Estimación:** 3 horas
- **Dependencias:** T3.1, T3.2
- **Asignado:** Frontend Dev

##### T3.4: Triggers para Notificaciones Automáticas 🤖
- **Descripción:** Enviar push en eventos importantes
- **Archivos:**
  - `supabase/functions/trigger-new-order/index.ts`
  - `supabase/functions/trigger-table-alert/index.ts`
- **Eventos con Notificación:**
  - **Nuevo pedido:** Staff recibe push
  - **Mesa necesita atención:** Staff recibe push
  - **Pedido listo:** Cliente recibe push (si app instalada)
  - **Pago confirmado:** Staff recibe push
- **Ejemplo - Trigger de Nuevo Pedido:**
  ```typescript
  // Database trigger
  CREATE OR REPLACE FUNCTION notify_new_order()
  RETURNS TRIGGER AS $$
  BEGIN
    -- Invoke edge function to send push
    PERFORM http_post(
      'https://[project].supabase.co/functions/v1/send-push',
      json_build_object(
        'userId', (SELECT id FROM staff WHERE role = 'waiter'),
        'title', 'Nuevo Pedido',
        'body', 'Mesa ' || NEW.table_id || ' tiene un nuevo pedido',
        'data', json_build_object('orderId', NEW.id)
      )
    );
    RETURN NEW;
  END;
  $$ LANGUAGE plpgsql;
  
  CREATE TRIGGER on_order_created
    AFTER INSERT ON orders
    FOR EACH ROW
    EXECUTE FUNCTION notify_new_order();
  ```
- **Aceptación:**
  - [ ] Triggers funcionan correctamente
  - [ ] Push enviados en tiempo real
  - [ ] No spam (rate limiting)
- **Estimación:** 6 horas
- **Dependencias:** T3.1, T3.2, T3.3
- **Asignado:** Backend Dev

##### T3.5: UI de Configuración de Notificaciones ⚙️
- **Descripción:** Panel para gestionar preferencias
- **Archivos:**
  - `app/configuracion/notificaciones/page.tsx` - Página
  - `components/notification-preferences.tsx` - Form
- **Settings:**
  - ✅ Activar/Desactivar push
  - ✅ Tipos de notificaciones
    - [ ] Nuevos pedidos
    - [ ] Alertas de mesa
    - [ ] Cambios de estado
    - [ ] Pagos confirmados
  - ✅ No molestar (horarios)
  - ✅ Dispositivos suscritos
- **Aceptación:**
  - [ ] UI intuitiva y accesible
  - [ ] Configuración persiste
  - [ ] Respeta preferencias
- **Estimación:** 4 horas
- **Dependencias:** T3.2
- **Asignado:** Frontend Dev

##### T3.6: Testing de Push Notifications 🧪
- **Descripción:** Tests de push end-to-end
- **Archivos:**
  - `tests/push/subscription.test.ts`
  - `tests/push/notifications.test.ts`
  - `tests/e2e/push-flow.spec.ts`
- **Test Cases:**
  - Subscription flow completo
  - Notificaciones se reciben
  - Click en notificación navega correctamente
  - Preferencias se respetan
  - Triggers envían push
- **Aceptación:**
  - [ ] Tests unitarios >90% coverage
  - [ ] E2E test de flujo completo
  - [ ] Tests pasan en CI/CD
- **Estimación:** 4 hours
- **Dependencias:** T3.1-T3.5
- **Asignado:** QA Dev

#### Entregables Sprint 3
- ✅ Backend de push (Supabase)
- ✅ Subscription management (frontend)
- ✅ Push event handler (SW)
- ✅ Triggers automáticos
- ✅ UI de configuración
- ✅ Tests de push (>90% coverage)

#### Definition of Done Sprint 3
- [ ] Backend de push funcionando
- [ ] Usuarios pueden suscribirse
- [ ] Notificaciones se reciben y muestran
- [ ] Triggers automáticos activos
- [ ] UI de configuración funcional
- [ ] Tests passing (>90% coverage)
- [ ] Code review aprobado
- [ ] Documentación actualizada

---

### Sprint 4: Install Prompt & Polish (Semana 4)
**Objetivo:** Install prompt personalizado y optimizaciones finales

#### Tareas Técnicas

##### T4.1: Manifest.json Completo 📱
- **Descripción:** Configurar manifest para instalación
- **Archivos:**
  - `public/manifest.json` - App manifest
  - `app/layout.tsx` - Link a manifest
- **Contenido:**
  ```json
  {
    "name": "Restaurant Management System",
    "short_name": "Restaurant",
    "description": "Sistema de gestión integral para restaurantes",
    "start_url": "/dashboard",
    "display": "standalone",
    "background_color": "#ffffff",
    "theme_color": "#0ea5e9",
    "orientation": "portrait-primary",
    "icons": [
      {
        "src": "/icons/icon-72x72.png",
        "sizes": "72x72",
        "type": "image/png",
        "purpose": "any"
      },
      {
        "src": "/icons/icon-96x96.png",
        "sizes": "96x96",
        "type": "image/png",
        "purpose": "any"
      },
      {
        "src": "/icons/icon-128x128.png",
        "sizes": "128x128",
        "type": "image/png",
        "purpose": "any"
      },
      {
        "src": "/icons/icon-144x144.png",
        "sizes": "144x144",
        "type": "image/png",
        "purpose": "any"
      },
      {
        "src": "/icons/icon-152x152.png",
        "sizes": "152x152",
        "type": "image/png",
        "purpose": "any"
      },
      {
        "src": "/icons/icon-192x192.png",
        "sizes": "192x192",
        "type": "image/png",
        "purpose": "any"
      },
      {
        "src": "/icons/icon-384x384.png",
        "sizes": "384x384",
        "type": "image/png",
        "purpose": "any"
      },
      {
        "src": "/icons/icon-512x512.png",
        "sizes": "512x512",
        "type": "image/png",
        "purpose": "any"
      },
      {
        "src": "/icons/maskable-icon-512x512.png",
        "sizes": "512x512",
        "type": "image/png",
        "purpose": "maskable"
      }
    ],
    "screenshots": [
      {
        "src": "/screenshots/dashboard.png",
        "sizes": "1280x720",
        "type": "image/png",
        "form_factor": "wide"
      },
      {
        "src": "/screenshots/salon.png",
        "sizes": "750x1334",
        "type": "image/png",
        "form_factor": "narrow"
      }
    ],
    "categories": ["business", "food", "productivity"],
    "shortcuts": [
      {
        "name": "Dashboard",
        "url": "/dashboard",
        "icons": [{ "src": "/icons/dashboard-96x96.png", "sizes": "96x96" }]
      },
      {
        "name": "Nuevo Pedido",
        "url": "/pedidos/nuevo",
        "icons": [{ "src": "/icons/order-96x96.png", "sizes": "96x96" }]
      },
      {
        "name": "Salón",
        "url": "/salon",
        "icons": [{ "src": "/icons/salon-96x96.png", "sizes": "96x96" }]
      }
    ]
  }
  ```
- **Aceptación:**
  - [ ] Manifest válido (validador online)
  - [ ] Todos los iconos generados
  - [ ] Screenshots incluidos
- **Estimación:** 3 horas
- **Dependencias:** Ninguna
- **Asignado:** Frontend Dev

##### T4.2: Generación de Iconos y Assets 🎨
- **Descripción:** Crear todos los iconos y splash screens
- **Herramienta:** [PWA Asset Generator](https://github.com/elegantapp/pwa-asset-generator)
- **Tareas:**
  ```bash
  # Instalar herramienta
  npm install -g pwa-asset-generator
  
  # Generar desde logo SVG
  pwa-asset-generator public/logo.svg public/icons \
    --icon-only \
    --favicon \
    --maskable \
    --type png
  
  # Generar splash screens
  pwa-asset-generator public/logo.svg public/splash \
    --splash-only \
    --type png \
    --background "#0ea5e9"
  ```
- **Assets Generados:**
  - 9 iconos (72x72 hasta 512x512)
  - 1 maskable icon (512x512)
  - Favicon (16x16, 32x32, 48x48)
  - Splash screens (iOS y Android)
- **Aceptación:**
  - [ ] Todos los tamaños generados
  - [ ] Iconos optimizados (<50KB cada uno)
  - [ ] Maskable icon cumple safe zone
- **Estimación:** 2 horas
- **Dependencias:** T4.1
- **Asignado:** Designer/Frontend

##### T4.3: Install Prompt Personalizado 📲
- **Descripción:** Prompt custom para instalar PWA
- **Archivos:**
  - `components/install-prompt.tsx` - Modal/Banner
  - `hooks/use-install-prompt.ts` - Hook
- **Implementación:**
  ```typescript
  export function useInstallPrompt() {
    const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
    const [isInstallable, setIsInstallable] = useState(false);
    
    useEffect(() => {
      const handler = (e: Event) => {
        e.preventDefault();
        setDeferredPrompt(e);
        setIsInstallable(true);
      };
      
      window.addEventListener('beforeinstallprompt', handler);
      return () => window.removeEventListener('beforeinstallprompt', handler);
    }, []);
    
    const promptInstall = async () => {
      if (!deferredPrompt) return false;
      
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      
      if (outcome === 'accepted') {
        setIsInstallable(false);
        // Track analytics
        analytics.track('pwa_installed');
      }
      
      setDeferredPrompt(null);
      return outcome === 'accepted';
    };
    
    return { isInstallable, promptInstall };
  }
  ```
- **UX:**
  - Banner discreto después de 2 minutos
  - "Instalar App" en menú de configuración
  - Onboarding explicando beneficios
  - No mostrar más de 3 veces
- **Aceptación:**
  - [ ] Prompt se muestra correctamente
  - [ ] Instalación funciona (Android/Desktop)
  - [ ] No es intrusivo
- **Estimación:** 4 horas
- **Dependencias:** T4.1, T4.2
- **Asignado:** Frontend Dev

##### T4.4: iOS Install Instructions 🍎
- **Descripción:** Instrucciones para instalar en iOS (no tiene beforeinstallprompt)
- **Archivos:**
  - `components/ios-install-guide.tsx` - Guía visual
- **Contenido:**
  1. Detectar si es Safari iOS
  2. Mostrar modal con pasos ilustrados:
     - Tap en botón "Compartir" (ícono cuadrado con flecha)
     - Scroll y tap en "Agregar a Inicio"
     - Tap en "Agregar"
  3. GIF animado mostrando el proceso
- **Aceptación:**
  - [ ] Detecta iOS Safari correctamente
  - [ ] Instrucciones claras con imágenes
  - [ ] No se muestra en otros navegadores
- **Estimación:** 3 horas
- **Dependencias:** T4.1, T4.2
- **Asignado:** Frontend Dev

##### T4.5: Lighthouse PWA Audit & Optimizations 🚀
- **Descripción:** Optimizar para pasar Lighthouse PWA audit
- **Archivos:**
  - `lighthouse-config.json` - Config CI
  - `.github/workflows/lighthouse-ci.yml` - CI/CD
- **Checklist Lighthouse PWA:**
  - [ ] ✅ Fast and reliable
    - [ ] Page load fast (FCP <2s)
    - [ ] Offline fallback configured
    - [ ] 200 on offline pages
  - [ ] ✅ Installable
    - [ ] Valid manifest.json
    - [ ] Icons 192x192 y 512x512
    - [ ] Service Worker registered
    - [ ] HTTPS enabled
  - [ ] ✅ PWA Optimized
    - [ ] Splash screen configured
    - [ ] Theme color set
    - [ ] Viewport meta tag
    - [ ] Apple touch icon
- **Target Score:** >90/100
- **Aceptación:**
  - [ ] Lighthouse PWA score >90
  - [ ] All PWA criteria passing
  - [ ] CI runs Lighthouse on PRs
- **Estimación:** 4 horas
- **Dependencias:** T4.1-T4.4
- **Asignado:** Frontend Dev

##### T4.6: Analytics de PWA 📊
- **Descripción:** Tracking de métricas PWA
- **Archivos:**
  - `lib/analytics/pwa-analytics.ts` - Events
- **Eventos a Trackear:**
  ```typescript
  // Instalación
  analytics.track('pwa_install_prompt_shown');
  analytics.track('pwa_installed');
  analytics.track('pwa_install_dismissed');
  
  // Uso
  analytics.track('pwa_launched', { source: 'home_screen' });
  analytics.track('offline_mode_activated');
  analytics.track('sync_completed', { operations: 5 });
  
  // Push
  analytics.track('push_permission_requested');
  analytics.track('push_permission_granted');
  analytics.track('push_notification_received');
  analytics.track('push_notification_clicked');
  ```
- **Dashboard:** Vercel Analytics + custom events
- **Aceptación:**
  - [ ] Todos los eventos trackean
  - [ ] Dashboard muestra métricas
  - [ ] Cumple GDPR (consent)
- **Estimación:** 3 horas
- **Dependencias:** T4.3
- **Asignado:** Frontend Dev

##### T4.7: Documentación de PWA 📚
- **Descripción:** Documentar features y uso de PWA
- **Archivos:**
  - `docs/pwa/README.md` - Overview
  - `docs/pwa/installation.md` - Guía de instalación
  - `docs/pwa/offline-mode.md` - Offline features
  - `docs/pwa/push-notifications.md` - Push setup
- **Contenido:**
  - Arquitectura de Service Worker
  - Estrategias de cache
  - Flujo de sincronización
  - Setup de push notifications
  - Troubleshooting común
- **Aceptación:**
  - [ ] Documentación completa
  - [ ] Diagramas incluidos
  - [ ] Ejemplos de código
- **Estimación:** 4 horas
- **Dependencias:** T4.1-T4.6
- **Asignado:** Tech Writer/Dev

##### T4.8: Testing Final & E2E 🧪
- **Descripción:** Tests end-to-end de PWA completa
- **Archivos:**
  - `tests/e2e/pwa-install.spec.ts`
  - `tests/e2e/pwa-offline-flow.spec.ts`
  - `tests/e2e/pwa-push.spec.ts`
- **Test Scenarios:**
  1. **Install Flow:**
     - Prompt aparece
     - Instalación exitosa
     - App lanza desde home screen
  2. **Offline Flow:**
     - Usuario crea pedido offline
     - Pedido se encola
     - Al reconectar, se sincroniza
     - Sin pérdida de datos
  3. **Push Flow:**
     - Suscripción a push
     - Recepción de notificación
     - Click navega a destino
- **Aceptación:**
  - [ ] Todos los E2E tests pasan
  - [ ] Coverage >85% en PWA modules
  - [ ] Tests pasan en CI/CD
- **Estimación:** 6 horas
- **Dependencias:** T4.1-T4.7
- **Asignado:** QA Dev

#### Entregables Sprint 4
- ✅ Manifest.json completo
- ✅ Iconos y assets generados
- ✅ Install prompt personalizado
- ✅ iOS install instructions
- ✅ Lighthouse PWA score >90
- ✅ Analytics de PWA
- ✅ Documentación completa
- ✅ Tests E2E de PWA

#### Definition of Done Sprint 4
- [ ] Manifest válido y completo
- [ ] Todos los iconos generados
- [ ] Install prompt funcional
- [ ] iOS instructions claras
- [ ] Lighthouse PWA >90
- [ ] Analytics tracking
- [ ] Documentación completa
- [ ] Tests E2E passing
- [ ] Code review aprobado
- [ ] Listo para production

---

## 📋 Checklist de Completitud

### Funcionalidades Core
- [ ] Service Worker registrado y activo
- [ ] Cache de assets estáticos (CacheFirst)
- [ ] Cache de API responses (NetworkFirst)
- [ ] Indicador de estado online/offline
- [ ] IndexedDB configurado (Dexie)
- [ ] Sync queue para operaciones offline
- [ ] Background Sync API funcionando
- [ ] Conflict resolution strategies
- [ ] UI de estado de sincronización
- [ ] Backend de push notifications
- [ ] Subscription management (frontend)
- [ ] Push event handler (Service Worker)
- [ ] Triggers automáticos de notificaciones
- [ ] UI de configuración de notificaciones
- [ ] Manifest.json completo
- [ ] Iconos y splash screens generados
- [ ] Install prompt personalizado
- [ ] iOS install instructions
- [ ] Lighthouse PWA score >90
- [ ] Analytics de PWA

### Testing
- [ ] Tests unitarios Service Worker
- [ ] Tests de cache strategies
- [ ] Tests de sync queue
- [ ] Tests de conflict resolution
- [ ] Tests de push notifications
- [ ] Tests E2E de install flow
- [ ] Tests E2E de offline flow
- [ ] Tests E2E de push flow
- [ ] Coverage >90% en módulos PWA
- [ ] Performance tests (Lighthouse CI)

### Documentación
- [ ] docs/pwa/README.md
- [ ] docs/pwa/installation.md
- [ ] docs/pwa/offline-mode.md
- [ ] docs/pwa/push-notifications.md
- [ ] API docs actualizadas
- [ ] README.md actualizado
- [ ] CHANGELOG.md actualizado

### Deployment
- [ ] Variables de entorno (VAPID keys)
- [ ] Supabase migrations aplicadas
- [ ] Edge functions desplegadas
- [ ] Service Worker en producción
- [ ] Manifest servido correctamente
- [ ] HTTPS habilitado
- [ ] Monitoring activo

---

## 🎯 Criterios de Aceptación Final

### Performance
- ✅ Lighthouse PWA score >90/100
- ✅ Time to Interactive (cached) <2s
- ✅ Cache hit rate >80%
- ✅ Sync success rate >95%

### Funcionalidad
- ✅ Modo offline funciona sin errores
- ✅ Sincronización automática al reconectar
- ✅ Push notifications se reciben
- ✅ Install flow funcional (Android/Desktop)
- ✅ iOS install instructions claras

### Calidad
- ✅ Tests passing (>90% coverage PWA)
- ✅ 0 errors en consola
- ✅ 0 warnings críticos
- ✅ Code review aprobado
- ✅ Documentación completa

### User Experience
- ✅ Indicador de estado de conexión claro
- ✅ Feedback visual durante sincronización
- ✅ Notificaciones no invasivas
- ✅ Install prompt no intrusivo
- ✅ Experiencia fluida offline→online

---

## 📊 Métricas de Seguimiento

### Daily Tracking
- ⏱️ **Velocity:** Story points completados por día
- 🐛 **Bugs:** Nuevos vs resueltos
- ✅ **Tasks:** Completadas vs pendientes
- 📈 **Progress:** % de sprint completado

### Weekly Review
- 🎯 **Scope:** ¿Se mantiene el alcance?
- ⚠️ **Risks:** Nuevos riesgos identificados
- 🚧 **Blockers:** Impedimentos activos
- 📊 **Burndown:** ¿Vamos on track?

### Sprint Retrospective
- 🎉 **What went well:** Éxitos del sprint
- 😓 **What didn't:** Problemas encontrados
- 💡 **Action items:** Mejoras para siguiente sprint
- 📈 **Velocity trend:** Velocidad histórica

---

## 🚨 Riesgos y Mitigaciones

### Riesgo 1: Complejidad de Sincronización
- **Probabilidad:** Alta
- **Impacto:** Alto
- **Descripción:** Conflictos complejos en sync bidireccional
- **Mitigación:**
  - Empezar con estrategias simples (LWW)
  - Validar con usuarios en staging
  - Plan B: UI para resolución manual

### Riesgo 2: Compatibilidad iOS
- **Probabilidad:** Media
- **Impacto:** Medio
- **Descripción:** iOS Safari tiene limitaciones PWA
- **Mitigación:**
  - Detectar capabilities del navegador
  - Fallback graceful para features no soportadas
  - UI alternativa para iOS (install instructions)

### Riesgo 3: Storage Limits
- **Probabilidad:** Media
- **Impacto:** Medio
- **Descripción:** IndexedDB limitado a ~50MB
- **Mitigación:**
  - Estrategia de expiration agresiva
  - Limitar data cacheada (últimos 7 días)
  - UI para limpiar cache manual

### Riesgo 4: Push Notification Spam
- **Probabilidad:** Baja
- **Impacto:** Alto
- **Descripción:** Demasiadas notificaciones molestan usuarios
- **Mitigación:**
  - Rate limiting en backend
  - Configuración granular de preferencias
  - "No molestar" mode

### Riesgo 5: Battery Drain
- **Probabilidad:** Baja
- **Impacto:** Medio
- **Descripción:** Background sync consume batería
- **Mitigación:**
  - Optimizar frecuencia de sync
  - Sync solo con WiFi (opcional)
  - Monitoring de battery API

---

## 📞 Equipo y Roles

### Core Team
- **Tech Lead:** Responsable de arquitectura y decisiones técnicas
- **Backend Dev:** Service Worker, sync, push backend
- **Frontend Dev:** UI/UX, componentes, hooks
- **QA Engineer:** Tests, E2E, quality assurance
- **DevOps:** CI/CD, deployment, monitoring

### Stakeholders
- **Product Owner:** Define prioridades y acepta features
- **Designer:** Iconos, assets, UX de install
- **Tech Writer:** Documentación técnica

---

## 🎓 Recursos de Aprendizaje

### Documentación Oficial
- [MDN - Progressive Web Apps](https://developer.mozilla.org/en-US/docs/Web/Progressive_web_apps)
- [Google - Workbox](https://developer.chrome.com/docs/workbox/)
- [web.dev - PWA](https://web.dev/progressive-web-apps/)

### Herramientas
- [Lighthouse](https://developers.google.com/web/tools/lighthouse) - Auditoría PWA
- [PWA Builder](https://www.pwabuilder.com/) - Generador de assets
- [Web Push Codelab](https://web.dev/push-notifications-web-push-protocol/) - Tutorial push

### Ejemplos de Código
- [Workbox Recipes](https://developers.google.com/web/tools/workbox/modules/workbox-recipes)
- [PWA Examples](https://pwa.rocks/) - Showcase de PWAs

---

## 📝 Notas Adicionales

### Consideraciones de Producción
- **HTTPS obligatorio:** PWA solo funciona en HTTPS
- **VAPID keys:** Generar y guardar en secrets manager
- **Storage quota:** Monitorear uso de IndexedDB
- **Error tracking:** Sentry para errores de Service Worker

### Mejoras Futuras (Post Fase 6)
- **Periodic Background Sync:** Sync programado (experimental)
- **Web Share API:** Compartir desde la app
- **Media Session API:** Control de media en notificaciones
- **Badging API:** Badge en icono de app (experimental)

---

## ✅ Sign-off

Al completar la Fase 6, este documento debe ser firmado por:

- [ ] **Tech Lead:** Arquitectura aprobada
- [ ] **Product Owner:** Features aceptadas
- [ ] **QA Lead:** Calidad verificada
- [ ] **DevOps:** Deployment exitoso

---

**Fecha de creación:** Noviembre 3, 2025  
**Última actualización:** Noviembre 3, 2025  
**Versión:** 1.0  
**Estado:** 📋 En Planificación

---

**Siguiente paso:** Sprint 1 kickoff - Service Worker & Cache
