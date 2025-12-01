/**
 * Custom Service Worker for Push Notifications
 * Handles push events and notification clicks
 * 
 * This file extends the auto-generated SW from next-pwa
 */

/// <reference lib="webworker" />
declare const self: ServiceWorkerGlobalScope;

import { clientsClaim } from 'workbox-core';

// Take control of all clients immediately
clientsClaim();

// Skip waiting and activate immediately
self.skipWaiting();

/**
 * Handle incoming push notifications
 */
self.addEventListener('push', (event: PushEvent) => {
  console.log('📩 Push notification received:', event);

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

    const options: NotificationOptions = {
      body,
      icon,
      badge,
      image,
      tag,
      data: notificationData,
      vibrate: [200, 100, 200],
      requireInteraction: false,
      actions: actions.map((action: any) => ({
        action: action.action,
        title: action.title,
        icon: action.icon,
      })),
    };

    event.waitUntil(
      self.registration.showNotification(title, options)
    );
  } catch (error) {
    console.error('❌ Error parsing push notification:', error);
  }
});

/**
 * Handle notification clicks
 */
self.addEventListener('notificationclick', (event: NotificationEvent) => {
  console.log('🖱️ Notification clicked:', event);

  event.notification.close();

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

  event.waitUntil(
    (async () => {
      // Check if there's already a window open
      const allClients = await self.clients.matchAll({
        type: 'window',
        includeUncontrolled: true,
      });

      // Try to find an existing window with the same origin
      for (const client of allClients) {
        const clientUrl = new URL(client.url);
        if (clientUrl.origin === self.location.origin) {
          // Focus the existing window and navigate
          if ('focus' in client) {
            await client.focus();
          }
          if ('navigate' in client) {
            await (client as WindowClient).navigate(urlToOpen);
          }
          return;
        }
      }

      // No existing window, open a new one
      if (self.clients.openWindow) {
        await self.clients.openWindow(urlToOpen);
      }
    })()
  );
});

/**
 * Handle notification close (for analytics)
 */
self.addEventListener('notificationclose', (event: NotificationEvent) => {
  console.log('🔕 Notification closed:', event.notification.tag);
  
  // Optional: Send analytics event
  const data = event.notification.data || {};
  if (data.analyticsId) {
    // Could send to analytics service here
    console.log('📊 Notification dismissed:', data.analyticsId);
  }
});

/**
 * Handle push subscription change (e.g., expired subscription)
 */
self.addEventListener('pushsubscriptionchange', (event: any) => {
  console.log('🔄 Push subscription changed');

  event.waitUntil(
    (async () => {
      try {
        // Get VAPID public key from somewhere (could be cached)
        const response = await fetch('/api/vapid-public-key');
        const { publicKey } = await response.json();

        // Resubscribe
        const newSubscription = await self.registration.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: publicKey,
        });

        // Send new subscription to server
        await fetch('/api/push/subscribe', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(newSubscription),
        });

        console.log('✅ Resubscribed to push notifications');
      } catch (error) {
        console.error('❌ Failed to resubscribe:', error);
      }
    })()
  );
});

console.log('✅ Custom Service Worker with Push Notifications loaded');
