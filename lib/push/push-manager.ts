/**
 * Push Notifications Manager
 * Handles push notification subscriptions and permissions
 */

'use client';

// VAPID public key - This should be generated and stored in environment variables
// Generate keys with: npx web-push generate-vapid-keys
const VAPID_PUBLIC_KEY = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || 
  'BEl62iUYgUivxIkv69yViEuiBIa-Ib9-SkvMeAtA3LFgDzkrxZJjSgSnfckjBJuBkr3qBUYIHBQFLXYp5Nksh8U';

/**
 * Check if push notifications are supported
 */
export function isPushSupported(): boolean {
  return (
    typeof window !== 'undefined' &&
    'serviceWorker' in navigator &&
    'PushManager' in window &&
    'Notification' in window
  );
}

/**
 * Get current notification permission status
 */
export function getNotificationPermission(): NotificationPermission {
  if (!isPushSupported()) return 'denied';
  return Notification.permission;
}

/**
 * Request notification permission
 */
export async function requestNotificationPermission(): Promise<NotificationPermission> {
  if (!isPushSupported()) {
    console.warn('⚠️ Push notifications not supported');
    return 'denied';
  }

  try {
    const permission = await Notification.requestPermission();
    console.log('📱 Notification permission:', permission);
    return permission;
  } catch (error) {
    console.error('❌ Failed to request notification permission:', error);
    return 'denied';
  }
}

/**
 * Convert VAPID key to Uint8Array
 */
function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding)
    .replace(/\-/g, '+')
    .replace(/_/g, '/');

  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);

  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

/**
 * Subscribe to push notifications
 */
export async function subscribeToPush(): Promise<PushSubscription | null> {
  if (!isPushSupported()) {
    console.warn('⚠️ Push notifications not supported');
    return null;
  }

  try {
    // Request permission first
    const permission = await requestNotificationPermission();
    if (permission !== 'granted') {
      console.log('⏭️ Permission not granted');
      return null;
    }

    // Get service worker registration
    const registration = await navigator.serviceWorker.ready;

    // Check for existing subscription
    let subscription = await registration.pushManager.getSubscription();
    
    if (subscription) {
      console.log('✅ Already subscribed to push');
      return subscription;
    }

    // Subscribe to push
    subscription = await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY) as BufferSource,
    });

    console.log('✅ Subscribed to push notifications');
    return subscription;
  } catch (error) {
    console.error('❌ Failed to subscribe to push:', error);
    return null;
  }
}

/**
 * Unsubscribe from push notifications
 */
export async function unsubscribeFromPush(): Promise<boolean> {
  if (!isPushSupported()) {
    return false;
  }

  try {
    const registration = await navigator.serviceWorker.ready;
    const subscription = await registration.pushManager.getSubscription();

    if (subscription) {
      await subscription.unsubscribe();
      console.log('✅ Unsubscribed from push notifications');
      return true;
    }

    return false;
  } catch (error) {
    console.error('❌ Failed to unsubscribe from push:', error);
    return false;
  }
}

/**
 * Get current push subscription
 */
export async function getPushSubscription(): Promise<PushSubscription | null> {
  if (!isPushSupported()) {
    return null;
  }

  try {
    const registration = await navigator.serviceWorker.ready;
    return await registration.pushManager.getSubscription();
  } catch (error) {
    console.error('❌ Failed to get push subscription:', error);
    return null;
  }
}

/**
 * Save subscription to database
 */
export async function savePushSubscription(
  subscription: PushSubscription,
  userId: string,
  tenantId: string
): Promise<boolean> {
  try {
    const { createBrowserClient } = await import('@/lib/supabase/client');
    const supabase = createBrowserClient();

    const subscriptionJson = subscription.toJSON();

    // Note: push_subscriptions table exists in DB but types need to be regenerated
    // Run: npx supabase gen types typescript --project-id <project-id> > lib/supabase/database.types.ts
    const { error } = await (supabase as any)
      .from('push_subscriptions')
      .upsert({
        user_id: userId,
        tenant_id: tenantId,
        endpoint: subscription.endpoint,
        keys: subscriptionJson.keys,
        user_agent: navigator.userAgent,
      }, {
        onConflict: 'user_id,endpoint',
      });

    if (error) {
      console.error('❌ Failed to save subscription:', error);
      return false;
    }

    console.log('✅ Subscription saved to database');
    return true;
  } catch (error) {
    console.error('❌ Failed to save subscription:', error);
    return false;
  }
}

/**
 * Remove subscription from database
 */
export async function removePushSubscription(
  userId: string,
  endpoint: string
): Promise<boolean> {
  try {
    const { createBrowserClient } = await import('@/lib/supabase/client');
    const supabase = createBrowserClient();

    // TODO: Create push_subscriptions table in Supabase
    const { error } = await (supabase as any)
      .from('push_subscriptions')
      .delete()
      .eq('user_id', userId)
      .eq('endpoint', endpoint);

    if (error) {
      console.error('❌ Failed to remove subscription:', error);
      return false;
    }

    console.log('✅ Subscription removed from database');
    return true;
  } catch (error) {
    console.error('❌ Failed to remove subscription:', error);
    return false;
  }
}

/**
 * Test push notification (sends a test notification)
 */
export async function sendTestNotification(): Promise<boolean> {
  if (!isPushSupported()) {
    return false;
  }

  const permission = getNotificationPermission();
  if (permission !== 'granted') {
    console.warn('⚠️ Notification permission not granted');
    return false;
  }

  try {
    const registration = await navigator.serviceWorker.ready;
    
    await registration.showNotification('Test Notification', {
      body: 'This is a test notification from Restaurant Management System',
      icon: '/icon-192x192.png',
      badge: '/icon-192x192.png',
      tag: 'test-notification',
      requireInteraction: false,
    });

    console.log('✅ Test notification sent');
    return true;
  } catch (error) {
    console.error('❌ Failed to send test notification:', error);
    return false;
  }
}
