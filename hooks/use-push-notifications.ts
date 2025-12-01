/**
 * usePushNotifications Hook
 * React hook for managing push notification subscriptions
 */

'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  isPushSupported,
  getNotificationPermission,
  subscribeToPush,
  unsubscribeFromPush,
  getPushSubscription,
  savePushSubscription,
  removePushSubscription,
  sendTestNotification,
} from '@/lib/push/push-manager';

export interface UsePushNotificationsReturn {
  isSupported: boolean;
  permission: NotificationPermission;
  isSubscribed: boolean;
  isLoading: boolean;
  subscription: PushSubscription | null;
  subscribe: (userId: string, tenantId: string) => Promise<boolean>;
  unsubscribe: (userId: string) => Promise<boolean>;
  sendTest: () => Promise<boolean>;
  refreshStatus: () => Promise<void>;
}

export function usePushNotifications(): UsePushNotificationsReturn {
  const [isSupported, setIsSupported] = useState(false);
  const [permission, setPermission] = useState<NotificationPermission>('default');
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [subscription, setSubscription] = useState<PushSubscription | null>(null);

  // Check support and initial status
  const refreshStatus = useCallback(async () => {
    const supported = isPushSupported();
    setIsSupported(supported);

    if (!supported) return;

    const currentPermission = getNotificationPermission();
    setPermission(currentPermission);

    if (currentPermission === 'granted') {
      const sub = await getPushSubscription();
      setSubscription(sub);
      setIsSubscribed(sub !== null);
    }
  }, []);

  useEffect(() => {
    refreshStatus();
  }, [refreshStatus]);

  // Subscribe to push notifications
  const subscribe = useCallback(async (userId: string, tenantId: string): Promise<boolean> => {
    setIsLoading(true);
    try {
      const sub = await subscribeToPush();
      
      if (!sub) {
        console.log('⏭️ Failed to subscribe');
        return false;
      }

      // Save to database
      const saved = await savePushSubscription(sub, userId, tenantId);
      
      if (saved) {
        setSubscription(sub);
        setIsSubscribed(true);
        setPermission('granted');
        console.log('✅ Successfully subscribed to push notifications');
        return true;
      }

      return false;
    } catch (error) {
      console.error('❌ Subscribe error:', error);
      return false;
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Unsubscribe from push notifications
  const unsubscribe = useCallback(async (userId: string): Promise<boolean> => {
    setIsLoading(true);
    try {
      if (subscription) {
        await removePushSubscription(userId, subscription.endpoint);
      }

      const success = await unsubscribeFromPush();
      
      if (success) {
        setSubscription(null);
        setIsSubscribed(false);
        console.log('✅ Successfully unsubscribed from push notifications');
        return true;
      }

      return false;
    } catch (error) {
      console.error('❌ Unsubscribe error:', error);
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [subscription]);

  // Send test notification
  const sendTest = useCallback(async (): Promise<boolean> => {
    return await sendTestNotification();
  }, []);

  return {
    isSupported,
    permission,
    isSubscribed,
    isLoading,
    subscription,
    subscribe,
    unsubscribe,
    sendTest,
    refreshStatus,
  };
}

/**
 * Check if push notifications are enabled and granted
 */
export function usePushEnabled(): boolean {
  const { isSupported, permission, isSubscribed } = usePushNotifications();
  return isSupported && permission === 'granted' && isSubscribed;
}
