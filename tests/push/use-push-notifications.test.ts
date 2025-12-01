/**
 * @vitest-environment jsdom
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { usePushNotifications, usePushEnabled } from '@/hooks/use-push-notifications';

// Mock push-manager module
vi.mock('@/lib/push/push-manager', () => ({
  isPushSupported: vi.fn(() => true),
  getNotificationPermission: vi.fn(() => 'default'),
  subscribeToPush: vi.fn(),
  unsubscribeFromPush: vi.fn(),
  getPushSubscription: vi.fn(),
  savePushSubscription: vi.fn(),
  removePushSubscription: vi.fn(),
  sendTestNotification: vi.fn(),
}));

import * as pushManager from '@/lib/push/push-manager';

describe('usePushNotifications Hook', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should initialize with default values', () => {
    const { result } = renderHook(() => usePushNotifications());

    expect(result.current.isSupported).toBe(true);
    expect(result.current.permission).toBe('default');
    expect(result.current.isSubscribed).toBe(false);
    expect(result.current.isLoading).toBe(false);
    expect(result.current.subscription).toBeNull();
  });

  it('should detect unsupported browser', () => {
    vi.mocked(pushManager.isPushSupported).mockReturnValue(false);

    const { result } = renderHook(() => usePushNotifications());

    expect(result.current.isSupported).toBe(false);
  });

  it('should load existing subscription on mount', async () => {
    const mockSubscription = {
      endpoint: 'test-endpoint',
      toJSON: () => ({}),
    } as any;

    vi.mocked(pushManager.getNotificationPermission).mockReturnValue('granted');
    vi.mocked(pushManager.getPushSubscription).mockResolvedValue(mockSubscription);

    const { result } = renderHook(() => usePushNotifications());

    await waitFor(() => {
      expect(result.current.isSubscribed).toBe(true);
      expect(result.current.subscription).toBe(mockSubscription);
    });
  });

  it('should subscribe to push notifications', async () => {
    const mockSubscription = {
      endpoint: 'new-endpoint',
      toJSON: () => ({}),
    } as any;

    vi.mocked(pushManager.subscribeToPush).mockResolvedValue(mockSubscription);
    vi.mocked(pushManager.savePushSubscription).mockResolvedValue(true);

    const { result } = renderHook(() => usePushNotifications());

    await act(async () => {
      const success = await result.current.subscribe('user-id', 'tenant-id');
      expect(success).toBe(true);
    });

    expect(pushManager.subscribeToPush).toHaveBeenCalled();
    expect(pushManager.savePushSubscription).toHaveBeenCalledWith(
      mockSubscription,
      'user-id',
      'tenant-id'
    );
    expect(result.current.isSubscribed).toBe(true);
    expect(result.current.subscription).toBe(mockSubscription);
  });

  it('should handle subscription failure', async () => {
    vi.mocked(pushManager.subscribeToPush).mockResolvedValue(null);

    const { result } = renderHook(() => usePushNotifications());

    await act(async () => {
      const success = await result.current.subscribe('user-id', 'tenant-id');
      expect(success).toBe(false);
    });

    expect(result.current.isSubscribed).toBe(false);
  });

  it('should unsubscribe from push notifications', async () => {
    const mockSubscription = {
      endpoint: 'test-endpoint',
      toJSON: () => ({}),
    } as any;

    vi.mocked(pushManager.getPushSubscription).mockResolvedValue(mockSubscription);
    vi.mocked(pushManager.unsubscribeFromPush).mockResolvedValue(true);
    vi.mocked(pushManager.removePushSubscription).mockResolvedValue(true);

    const { result } = renderHook(() => usePushNotifications());

    // Wait for initial subscription to load
    await waitFor(() => {
      expect(result.current.subscription).toBe(mockSubscription);
    });

    await act(async () => {
      const success = await result.current.unsubscribe('user-id');
      expect(success).toBe(true);
    });

    expect(pushManager.unsubscribeFromPush).toHaveBeenCalled();
    expect(pushManager.removePushSubscription).toHaveBeenCalledWith(
      'user-id',
      'test-endpoint'
    );
    expect(result.current.isSubscribed).toBe(false);
    expect(result.current.subscription).toBeNull();
  });

  it('should send test notification', async () => {
    vi.mocked(pushManager.sendTestNotification).mockResolvedValue(true);

    const { result } = renderHook(() => usePushNotifications());

    await act(async () => {
      const success = await result.current.sendTest();
      expect(success).toBe(true);
    });

    expect(pushManager.sendTestNotification).toHaveBeenCalled();
  });

  it('should handle loading state during subscribe', async () => {
    let resolveSubscribe: any;
    const subscribePromise = new Promise((resolve) => {
      resolveSubscribe = resolve;
    });

    vi.mocked(pushManager.subscribeToPush).mockReturnValue(subscribePromise as any);

    const { result } = renderHook(() => usePushNotifications());

    act(() => {
      result.current.subscribe('user-id', 'tenant-id');
    });

    // Should be loading
    expect(result.current.isLoading).toBe(true);

    // Resolve subscription
    await act(async () => {
      resolveSubscribe({ endpoint: 'test', toJSON: () => ({}) });
      await subscribePromise;
    });

    // Should no longer be loading
    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });
  });

  it('should refresh subscription status', async () => {
    const mockSubscription = {
      endpoint: 'refreshed-endpoint',
      toJSON: () => ({}),
    } as any;

    vi.mocked(pushManager.getNotificationPermission).mockReturnValue('granted');
    vi.mocked(pushManager.getPushSubscription).mockResolvedValue(mockSubscription);

    const { result } = renderHook(() => usePushNotifications());

    await act(async () => {
      await result.current.refreshStatus();
    });

    await waitFor(() => {
      expect(result.current.subscription).toBe(mockSubscription);
      expect(result.current.isSubscribed).toBe(true);
    });
  });
});

describe('usePushEnabled Hook', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should return true when push is fully enabled', async () => {
    vi.mocked(pushManager.isPushSupported).mockReturnValue(true);
    vi.mocked(pushManager.getNotificationPermission).mockReturnValue('granted');
    vi.mocked(pushManager.getPushSubscription).mockResolvedValue({
      endpoint: 'test',
      toJSON: () => ({}),
    } as any);

    const { result } = renderHook(() => usePushEnabled());

    await waitFor(() => {
      expect(result.current).toBe(true);
    });
  });

  it('should return false when push is not supported', () => {
    vi.mocked(pushManager.isPushSupported).mockReturnValue(false);

    const { result } = renderHook(() => usePushEnabled());

    expect(result.current).toBe(false);
  });

  it('should return false when permission is denied', () => {
    vi.mocked(pushManager.isPushSupported).mockReturnValue(true);
    vi.mocked(pushManager.getNotificationPermission).mockReturnValue('denied');

    const { result } = renderHook(() => usePushEnabled());

    expect(result.current).toBe(false);
  });

  it('should return false when not subscribed', async () => {
    vi.mocked(pushManager.isPushSupported).mockReturnValue(true);
    vi.mocked(pushManager.getNotificationPermission).mockReturnValue('granted');
    vi.mocked(pushManager.getPushSubscription).mockResolvedValue(null);

    const { result } = renderHook(() => usePushEnabled());

    await waitFor(() => {
      expect(result.current).toBe(false);
    });
  });
});
