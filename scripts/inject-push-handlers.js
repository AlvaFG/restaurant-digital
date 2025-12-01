/**
 * Inject Push Notification Handlers into Service Worker
 * Run after build: node scripts/inject-push-handlers.js
 */

const fs = require('fs');
const path = require('path');

const SW_PATH = path.join(__dirname, '..', 'public', 'sw.js');

const PUSH_HANDLERS = `

// ============================================
// PUSH NOTIFICATIONS HANDLERS (Auto-injected)
// ============================================

self.addEventListener('push', (event) => {
  console.log('📩 Push notification received');

  if (!event.data) {
    console.log('⚠️ Push event has no data');
    return;
  }

  try {
    const data = event.data.json();
    console.log('📦 Push data:', data);

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
      requireInteraction: false,
      actions,
    };

    event.waitUntil(
      self.registration.showNotification(title, options)
    );
  } catch (error) {
    console.error('❌ Error parsing push notification:', error);
    event.waitUntil(
      self.registration.showNotification('Nueva notificación', {
        body: 'Ha llegado una nueva notificación',
        icon: '/icon-192x192.png',
      })
    );
  }
});

self.addEventListener('notificationclick', (event) => {
  console.log('🖱️ Notification clicked:', event);

  event.notification.close();

  const data = event.notification.data || {};
  const action = event.action;

  let urlToOpen = '/dashboard';

  if (action === 'view') {
    if (data.orderId) {
      urlToOpen = \`/pedidos/\${data.orderId}\`;
    } else if (data.tableId) {
      urlToOpen = \`/mesas/\${data.tableId}\`;
    } else if (data.url) {
      urlToOpen = data.url;
    }
  } else if (action === 'dismiss') {
    return;
  } else {
    if (data.url) {
      urlToOpen = data.url;
    } else if (data.orderId) {
      urlToOpen = \`/pedidos/\${data.orderId}\`;
    } else if (data.tableId) {
      urlToOpen = \`/mesas/\${data.tableId}\`;
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
            if ('focus' in client) {
              await client.focus();
            }
            if ('navigate' in client) {
              await client.navigate(urlToOpen);
            }
            return;
          }
        } catch (e) {
          // Ignore invalid URLs
        }
      }

      if (self.clients.openWindow) {
        await self.clients.openWindow(urlToOpen);
      }
    })()
  );
});

self.addEventListener('notificationclose', (event) => {
  console.log('🔕 Notification closed:', event.notification.tag);
});

console.log('✅ Push notification handlers registered');

`;

function injectPushHandlers() {
  try {
    // Check if SW exists
    if (!fs.existsSync(SW_PATH)) {
      console.log('⚠️  Service Worker not found. Run build first.');
      console.log('   Expected path:', SW_PATH);
      return;
    }

    // Read current SW content
    let swContent = fs.readFileSync(SW_PATH, 'utf8');

    // Check if already injected
    if (swContent.includes('PUSH NOTIFICATIONS HANDLERS')) {
      console.log('✅ Push handlers already injected in Service Worker');
      return;
    }

    // Inject handlers at the end
    swContent += PUSH_HANDLERS;

    // Write back
    fs.writeFileSync(SW_PATH, swContent, 'utf8');

    console.log('✅ Successfully injected push notification handlers into Service Worker');
    console.log('📁 Updated:', SW_PATH);
  } catch (error) {
    console.error('❌ Error injecting push handlers:', error);
    process.exit(1);
  }
}

// Run if called directly
if (require.main === module) {
  injectPushHandlers();
}

module.exports = { injectPushHandlers };
