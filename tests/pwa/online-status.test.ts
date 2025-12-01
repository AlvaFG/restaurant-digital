/**
 * Online Status Hook Tests
 * Tests for useOnlineStatus hook
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { useOnlineStatus, checkOnlineStatus, waitForOnline } from '@/hooks/use-online-status';

// Mock navigator.onLine
const mockNavigatorOnline = (isOnline: boolean) => {
  Object.defineProperty(navigator, 'onLine', {
    writable: true,
    value: isOnline,
  });
};

describe('useOnlineStatus', () => {
  beforeEach(() => {
    // Reset to online state
    mockNavigatorOnline(true);
    vi.clearAllTimers();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('should initialize with online status', () => {
    mockNavigatorOnline(true);
    const { result } = renderHook(() => useOnlineStatus());

    expect(result.current.isOnline).toBe(true);
    expect(result.current.status).toBe('online');
  });

  it('should initialize with offline status', () => {
    mockNavigatorOnline(false);
    const { result } = renderHook(() => useOnlineStatus());

    expect(result.current.isOnline).toBe(false);
    expect(result.current.status).toBe('offline');
  });

  it('should detect online event', async () => {
    const { result } = renderHook(() => useOnlineStatus());

    act(() => {
      mockNavigatorOnline(false);
      window.dispatchEvent(new Event('offline'));
    });

    await waitFor(() => {
      expect(result.current.isOnline).toBe(false);
      expect(result.current.status).toBe('offline');
    });

    // Wait a bit before triggering online event
    await act(async () => {
      mockNavigatorOnline(true);
      window.dispatchEvent(new Event('online'));
      // Wait for the syncing state to be set
      await new Promise(resolve => setTimeout(resolve, 100));
    });

    // Check that it transitions through syncing or ends up online
    // (timing can vary in tests)
    await waitFor(() => {
      expect(result.current.isOnline).toBe(true);
      expect(['syncing', 'online']).toContain(result.current.status);
    });
  });

  it('should track last online timestamp', async () => {
    const { result } = renderHook(() => useOnlineStatus());

    act(() => {
      mockNavigatorOnline(true);
      window.dispatchEvent(new Event('online'));
    });

    await waitFor(() => {
      expect(result.current.lastOnline).toBeInstanceOf(Date);
    });
  });

  it('should track last offline timestamp', async () => {
    const { result } = renderHook(() => useOnlineStatus());

    act(() => {
      mockNavigatorOnline(false);
      window.dispatchEvent(new Event('offline'));
    });

    await waitFor(() => {
      expect(result.current.lastOffline).toBeInstanceOf(Date);
    });
  });
});

describe('checkOnlineStatus', () => {
  it('should return true when online', () => {
    mockNavigatorOnline(true);
    expect(checkOnlineStatus()).toBe(true);
  });

  it('should return false when offline', () => {
    mockNavigatorOnline(false);
    expect(checkOnlineStatus()).toBe(false);
  });
});

describe('waitForOnline', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('should resolve immediately if already online', async () => {
    mockNavigatorOnline(true);
    const result = await waitForOnline();
    expect(result).toBe(true);
  });

  it('should wait for online event', async () => {
    mockNavigatorOnline(false);
    
    const promise = waitForOnline(5000);

    setTimeout(() => {
      mockNavigatorOnline(true);
      window.dispatchEvent(new Event('online'));
    }, 1000);

    vi.runAllTimers();

    const result = await promise;
    expect(result).toBe(true);
  });

  it('should timeout if not online within limit', async () => {
    mockNavigatorOnline(false);
    
    const promise = waitForOnline(1000);
    vi.advanceTimersByTime(1000);

    const result = await promise;
    expect(result).toBe(false);
  });
});
