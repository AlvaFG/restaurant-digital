/**
 * useOnlineStatus Hook
 * Detects and tracks network connectivity status
 */

'use client';

import { useState, useEffect } from 'react';

export type ConnectionStatus = 'online' | 'offline' | 'syncing';

export interface OnlineStatusHook {
  isOnline: boolean;
  status: ConnectionStatus;
  lastOnline: Date | null;
  lastOffline: Date | null;
}

export function useOnlineStatus(): OnlineStatusHook {
  const [isOnline, setIsOnline] = useState<boolean>(true);
  const [status, setStatus] = useState<ConnectionStatus>('online');
  const [lastOnline, setLastOnline] = useState<Date | null>(null);
  const [lastOffline, setLastOffline] = useState<Date | null>(null);

  useEffect(() => {
    // Initialize with current navigator status
    if (typeof window !== 'undefined') {
      setIsOnline(navigator.onLine);
      setStatus(navigator.onLine ? 'online' : 'offline');
    }

    const handleOnline = () => {
      console.log('🟢 Network: ONLINE');
      setIsOnline(true);
      setStatus('syncing'); // Set to syncing temporarily
      setLastOnline(new Date());

      // After a short delay, set to online (simulate sync completion)
      setTimeout(() => {
        setStatus('online');
      }, 2000);
    };

    const handleOffline = () => {
      console.log('🔴 Network: OFFLINE');
      setIsOnline(false);
      setStatus('offline');
      setLastOffline(new Date());
    };

    // Add event listeners
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Check connection periodically (fallback for unreliable events)
    const intervalId = setInterval(() => {
      const currentlyOnline = navigator.onLine;
      if (currentlyOnline !== isOnline) {
        if (currentlyOnline) {
          handleOnline();
        } else {
          handleOffline();
        }
      }
    }, 5000); // Check every 5 seconds

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      clearInterval(intervalId);
    };
  }, [isOnline]);

  return {
    isOnline,
    status,
    lastOnline,
    lastOffline,
  };
}

/**
 * Check if currently online
 */
export function checkOnlineStatus(): boolean {
  if (typeof window === 'undefined') return true;
  return navigator.onLine;
}

/**
 * Wait for online status
 */
export function waitForOnline(timeout: number = 30000): Promise<boolean> {
  return new Promise((resolve) => {
    if (checkOnlineStatus()) {
      resolve(true);
      return;
    }

    const timeoutId = setTimeout(() => {
      window.removeEventListener('online', onlineHandler);
      resolve(false);
    }, timeout);

    const onlineHandler = () => {
      clearTimeout(timeoutId);
      window.removeEventListener('online', onlineHandler);
      resolve(true);
    };

    window.addEventListener('online', onlineHandler);
  });
}
