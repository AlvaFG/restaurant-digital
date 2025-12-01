/**
 * Push Notification Helpers for Service Worker
 * Import this in your custom SW or add inline
 */

/**
 * Handle push event
 */
export function handlePushEvent(event) {
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
      actions: actions.map((action) => ({
        action: action.action,
        title: action.title,
        icon: action.icon,
      })),
    };

    return self.registration.showNotification(title, options);
  } catch (error) {
    console.error('❌ Error parsing push notification:', error);
    return self.registration.showNotification('Nueva notificación', {
      body: 'Ha llegado una nueva notificación',
      icon: '/icon-192x192.png',
    });
  }
}

/**
 * Handle notification click
 */
export async function handleNotificationClick(event) {
  console.log('🖱️ Notification clicked');

  const data = event.notification.data || {};
  const action = event.action;

  // Determine URL based on action or data
  let urlToOpen = '/dashboard';

  if (action === 'view') {
    if (data.orderId) {
      urlToOpen = `/pedidos/${data.orderId}`;
    } else if (data.tableId) {
      urlToOpen = `/mesas/${data.tableId}`;
    } else if (data.url) {
      urlToOpen = data.url;
    }
  } else if (action === 'dismiss') {
    // Just close, don't open anything
    return;
  } else {
    // No action clicked, use default URL from data
    if (data.url) {
      urlToOpen = data.url;
    } else if (data.orderId) {
      urlToOpen = `/pedidos/${data.orderId}`;
    } else if (data.tableId) {
      urlToOpen = `/mesas/${data.tableId}`;
    }
  }

  // Check if there's already a window open
  const allClients = await self.clients.matchAll({
    type: 'window',
    includeUncontrolled: true,
  });

  // Try to find an existing window with the same origin
  for (const client of allClients) {
    try {
      const clientUrl = new URL(client.url);
      if (clientUrl.origin === self.location.origin) {
        // Focus the existing window and navigate
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

  // No existing window, open a new one
  if (self.clients.openWindow) {
    await self.clients.openWindow(urlToOpen);
  }
}

/**
 * Setup push notification handlers
 * Call this in your service worker
 */
export function setupPushHandlers() {
  self.addEventListener('push', (event) => {
    event.waitUntil(handlePushEvent(event));
  });

  self.addEventListener('notificationclick', (event) => {
    event.notification.close();
    event.waitUntil(handleNotificationClick(event));
  });

  self.addEventListener('notificationclose', (event) => {
    console.log('🔕 Notification closed:', event.notification.tag);
  });

  console.log('✅ Push notification handlers registered');
}
