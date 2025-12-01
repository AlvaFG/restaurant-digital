# Integración de Push Notifications en Service Worker

Como usamos `@ducanh2912/next-pwa` que genera automáticamente el Service Worker, necesitamos agregar manualmente los event listeners de push después de que el SW se genere.

## Opción 1: Modificar el SW generado (Temporal - solo para testing)

Después de hacer build, edita `public/sw.js` y agrega al final:

```javascript
// ============================================
// PUSH NOTIFICATIONS HANDLERS
// ============================================

self.addEventListener('push', (event) => {
  console.log('📩 Push notification received');

  if (!event.data) return;

  try {
    const data = event.data.json();
    const {
      title = 'Nueva notificación',
      body = '',
      icon = '/icon-192x192.png',
      badge = '/badge-72x72.png',
      image,
      tag,
      data: notificationData = {},
      actions = [],
    } = data;

    const options = {
      body,
      icon,
      badge,
      image,
      tag,
      data: notificationData,
      vibrate: [200, 100, 200],
      actions,
    };

    event.waitUntil(
      self.registration.showNotification(title, options)
    );
  } catch (error) {
    console.error('❌ Error showing notification:', error);
  }
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  const data = event.notification.data || {};
  const action = event.action;

  let urlToOpen = '/dashboard';

  if (action === 'view') {
    if (data.orderId) {
      urlToOpen = `/pedidos/${data.orderId}`;
    } else if (data.tableId) {
      urlToOpen = `/mesas/${data.tableId}`;
    } else if (data.url) {
      urlToOpen = data.url;
    }
  } else if (action !== 'dismiss') {
    if (data.url) {
      urlToOpen = data.url;
    } else if (data.orderId) {
      urlToOpen = `/pedidos/${data.orderId}`;
    } else if (data.tableId) {
      urlToOpen = `/mesas/${data.tableId}`;
    }
  }

  event.waitUntil(
    (async () => {
      const allClients = await self.clients.matchAll({
        type: 'window',
        includeUncontrolled: true,
      });

      for (const client of allClients) {
        try {
          const clientUrl = new URL(client.url);
          if (clientUrl.origin === self.location.origin) {
            await client.focus();
            if (client.navigate) await client.navigate(urlToOpen);
            return;
          }
        } catch (e) {}
      }

      if (self.clients.openWindow) {
        await self.clients.openWindow(urlToOpen);
      }
    })()
  );
});

console.log('✅ Push notification handlers registered');
```

## Opción 2: Build script automático (Recomendado)

Crea un script que modifique el SW después del build.

Ver: `scripts/inject-push-handlers.js`

## Opción 3: Custom SW con Workbox (Avanzado)

Si quieres un SW completamente personalizado, necesitas:

1. Desactivar el SW auto-generado de next-pwa
2. Crear tu propio `public/sw.js` con Workbox
3. Importar estrategias de cache manualmente

Referencia: `public/sw-custom.js`

## Testing en Desarrollo

Para testear push notifications en desarrollo:

1. Usa HTTPS o localhost
2. Activa el SW manualmente:
   ```javascript
   if ('serviceWorker' in navigator) {
     navigator.serviceWorker.register('/sw.js')
   }
   ```
3. Usa Chrome DevTools > Application > Service Workers
4. Envía push test desde DevTools o usando el hook `sendTestNotification()`

## Verificar que funciona

1. Ir a Chrome DevTools > Application > Service Workers
2. Verificar que el SW está activo
3. Click en "Push" para simular una notificación
4. O usar el botón "Test" en el panel de configuración de notificaciones
