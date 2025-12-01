/**
 * Service Worker Registration
 * Handles SW registration and lifecycle events
 */

'use client';

import { useEffect } from 'react';

export function usePWA() {
  useEffect(() => {
    if (
      typeof window !== 'undefined' &&
      'serviceWorker' in navigator &&
      process.env.NODE_ENV === 'production'
    ) {
      // Service Worker is automatically registered by next-pwa
      // This hook is for listening to SW events and updates

      navigator.serviceWorker.ready.then((registration) => {
        console.log('✅ Service Worker registered:', registration.scope);

        // Listen for updates
        registration.addEventListener('updatefound', () => {
          const newWorker = registration.installing;
          if (newWorker) {
            console.log('🔄 Service Worker update found');
            
            newWorker.addEventListener('statechange', () => {
              if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                // New service worker available
                console.log('✨ New Service Worker installed, refresh to update');
                
                // Optionally show a toast/notification to user
                if (typeof window !== 'undefined' && 'Notification' in window) {
                  // You can trigger a UI notification here
                }
              }
            });
          }
        });
      });

      // Listen for controller change (new SW activated)
      navigator.serviceWorker.addEventListener('controllerchange', () => {
        console.log('🔄 Service Worker controller changed');
      });

      // Handle messages from service worker
      navigator.serviceWorker.addEventListener('message', (event) => {
        console.log('📨 Message from Service Worker:', event.data);
        
        if (event.data && event.data.type === 'CACHE_UPDATED') {
          console.log('✅ Cache updated:', event.data.cacheName);
        }
      });
    }
  }, []);
}

/**
 * Check if Service Worker is supported
 */
export function isPWASupported(): boolean {
  return typeof window !== 'undefined' && 'serviceWorker' in navigator;
}

/**
 * Get Service Worker registration
 */
export async function getSWRegistration(): Promise<ServiceWorkerRegistration | null> {
  if (!isPWASupported()) return null;
  
  try {
    return await navigator.serviceWorker.ready;
  } catch (error) {
    console.error('Error getting SW registration:', error);
    return null;
  }
}

/**
 * Force Service Worker update
 */
export async function updateServiceWorker(): Promise<boolean> {
  const registration = await getSWRegistration();
  
  if (!registration) return false;
  
  try {
    await registration.update();
    console.log('✅ Service Worker update triggered');
    return true;
  } catch (error) {
    console.error('Error updating Service Worker:', error);
    return false;
  }
}
