/**
 * @vitest-environment jsdom
 */

import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import {
  isPushSupported,
  getNotificationPermission,
  requestNotificationPermission,
  subscribeToPush,
  unsubscribeFromPush,
  getPushSubscription,
} from '@/lib/push/push-manager';

// Mock Service Worker API
const mockServiceWorkerRegistration = {
  pushManager: {
    getSubscription: vi.fn(),
    subscribe: vi.fn(),
  },
  showNotification: vi.fn(),
};

const mockPushSubscription = {
  endpoint: 'https://fcm.googleapis.com/fcm/send/test-endpoint',
  keys: {
    p256dh: 'test-p256dh-key',
    auth: 'test-auth-key',
  },
  unsubscribe: vi.fn(),
  toJSON: vi.fn(() => ({
    endpoint: 'https://fcm.googleapis.com/fcm/send/test-endpoint',
    keys: {
      p256dh: 'test-p256dh-key',
      auth: 'test-auth-key',
    },
  })),
};

describe('Push Manager - Support Detection', () => {
  beforeEach(() => {
    // Reset global mocks
    vi.clearAllMocks();
  });

  it('should detect push support when all APIs are available', () => {
    Object.defineProperty(global, 'navigator', {
      value: {
        serviceWorker: {},
      },
      writable: true,
    });

    Object.defineProperty(global.window, 'PushManager', {
      value: class PushManager {},
      writable: true,
    });

    Object.defineProperty(global.window, 'Notification', {
      value: class Notification {},
      writable: true,
    });

    expect(isPushSupported()).toBe(true);
  });

  it('should detect no push support when serviceWorker is missing', () => {
    Object.defineProperty(global, 'navigator', {
      value: {},
      writable: true,
    });

    expect(isPushSupported()).toBe(false);
  });

  it('should detect no push support when PushManager is missing', () => {
    Object.defineProperty(global, 'navigator', {
      value: {
        serviceWorker: {},
      },
      writable: true,
    });

    Object.defineProperty(global.window, 'PushManager', {
      value: undefined,
      writable: true,
    });

    expect(isPushSupported()).toBe(false);
  });
});

describe('Push Manager - Permissions', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    
    // Setup push support
    Object.defineProperty(global, 'navigator', {
      value: {
        serviceWorker: {
          ready: Promise.resolve(mockServiceWorkerRegistration),
        },
      },
      writable: true,
    });

    Object.defineProperty(global.window, 'Notification', {
      value: {
        permission: 'default',
        requestPermission: vi.fn(),
      },
      writable: true,
    });
  });

  it('should return current notification permission', () => {
    (window.Notification as any).permission = 'granted';
    expect(getNotificationPermission()).toBe('granted');

    (window.Notification as any).permission = 'denied';
    expect(getNotificationPermission()).toBe('denied');

    (window.Notification as any).permission = 'default';
    expect(getNotificationPermission()).toBe('default');
  });

  it('should request notification permission', async () => {
    const requestPermission = vi.fn().mockResolvedValue('granted');
    (window.Notification as any).requestPermission = requestPermission;

    const result = await requestNotificationPermission();

    expect(requestPermission).toHaveBeenCalled();
    expect(result).toBe('granted');
  });

  it('should handle permission denial', async () => {
    const requestPermission = vi.fn().mockResolvedValue('denied');
    (window.Notification as any).requestPermission = requestPermission;

    const result = await requestNotificationPermission();

    expect(result).toBe('denied');
  });
});

describe('Push Manager - Subscription', () => {
  beforeEach(() => {
    vi.clearAllMocks();

    // Setup environment
    Object.defineProperty(global, 'navigator', {
      value: {
        serviceWorker: {
          ready: Promise.resolve(mockServiceWorkerRegistration),
        },
      },
      writable: true,
    });

    Object.defineProperty(global.window, 'Notification', {
      value: {
        permission: 'granted',
        requestPermission: vi.fn().mockResolvedValue('granted'),
      },
      writable: true,
    });

    Object.defineProperty(global, 'process', {
      value: {
        env: {
          NEXT_PUBLIC_VAPID_PUBLIC_KEY: 'test-vapid-public-key',
        },
      },
      writable: true,
    });
  });

  it('should get existing subscription', async () => {
    mockServiceWorkerRegistration.pushManager.getSubscription.mockResolvedValue(
      mockPushSubscription
    );

    const subscription = await getPushSubscription();

    expect(mockServiceWorkerRegistration.pushManager.getSubscription).toHaveBeenCalled();
    expect(subscription).toBe(mockPushSubscription);
  });

  it('should return null when no subscription exists', async () => {
    mockServiceWorkerRegistration.pushManager.getSubscription.mockResolvedValue(null);

    const subscription = await getPushSubscription();

    expect(subscription).toBeNull();
  });

  it('should create new subscription', async () => {
    mockServiceWorkerRegistration.pushManager.getSubscription.mockResolvedValue(null);
    mockServiceWorkerRegistration.pushManager.subscribe.mockResolvedValue(mockPushSubscription);

    const subscription = await subscribeToPush();

    expect(mockServiceWorkerRegistration.pushManager.subscribe).toHaveBeenCalledWith(
      expect.objectContaining({
        userVisibleOnly: true,
        applicationServerKey: expect.any(Uint8Array),
      })
    );
    expect(subscription).toBe(mockPushSubscription);
  });

  it('should not subscribe if permission denied', async () => {
    (window.Notification as any).permission = 'denied';

    const subscription = await subscribeToPush();

    expect(subscription).toBeNull();
    expect(mockServiceWorkerRegistration.pushManager.subscribe).not.toHaveBeenCalled();
  });

  it('should unsubscribe from push', async () => {
    mockServiceWorkerRegistration.pushManager.getSubscription.mockResolvedValue(
      mockPushSubscription
    );
    mockPushSubscription.unsubscribe.mockResolvedValue(true);

    const result = await unsubscribeFromPush();

    expect(mockPushSubscription.unsubscribe).toHaveBeenCalled();
    expect(result).toBe(true);
  });

  it('should return true when unsubscribing with no active subscription', async () => {
    mockServiceWorkerRegistration.pushManager.getSubscription.mockResolvedValue(null);

    const result = await unsubscribeFromPush();

    expect(result).toBe(true);
  });
});

describe('Push Manager - Error Handling', () => {
  beforeEach(() => {
    vi.clearAllMocks();

    Object.defineProperty(global, 'navigator', {
      value: {
        serviceWorker: {
          ready: Promise.resolve(mockServiceWorkerRegistration),
        },
      },
      writable: true,
    });

    Object.defineProperty(global.window, 'Notification', {
      value: {
        permission: 'granted',
      },
      writable: true,
    });
  });

  it('should handle subscription errors gracefully', async () => {
    mockServiceWorkerRegistration.pushManager.subscribe.mockRejectedValue(
      new Error('Subscription failed')
    );

    const subscription = await subscribeToPush();

    expect(subscription).toBeNull();
  });

  it('should handle unsubscribe errors gracefully', async () => {
    mockServiceWorkerRegistration.pushManager.getSubscription.mockResolvedValue(
      mockPushSubscription
    );
    mockPushSubscription.unsubscribe.mockRejectedValue(new Error('Unsubscribe failed'));

    const result = await unsubscribeFromPush();

    expect(result).toBe(false);
  });

  it('should handle missing VAPID key', async () => {
    Object.defineProperty(global, 'process', {
      value: {
        env: {
          NEXT_PUBLIC_VAPID_PUBLIC_KEY: undefined,
        },
      },
      writable: true,
    });

    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    const subscription = await subscribeToPush();

    expect(subscription).toBeNull();
    expect(consoleSpy).toHaveBeenCalledWith(
      expect.stringContaining('VAPID public key not configured')
    );

    consoleSpy.mockRestore();
  });
});

describe('Push Manager - Edge Cases', () => {
  it('should handle browser without service worker support', async () => {
    Object.defineProperty(global, 'navigator', {
      value: {},
      writable: true,
    });

    expect(isPushSupported()).toBe(false);
    
    const subscription = await subscribeToPush();
    expect(subscription).toBeNull();
  });

  it('should handle service worker registration failure', async () => {
    Object.defineProperty(global, 'navigator', {
      value: {
        serviceWorker: {
          ready: Promise.reject(new Error('SW registration failed')),
        },
      },
      writable: true,
    });

    const subscription = await subscribeToPush();
    expect(subscription).toBeNull();
  });

  it('should handle permission prompt dismissal (default state)', async () => {
    Object.defineProperty(global.window, 'Notification', {
      value: {
        permission: 'default',
        requestPermission: vi.fn().mockResolvedValue('default'),
      },
      writable: true,
    });

    const result = await requestNotificationPermission();
    expect(result).toBe('default');
  });
});
