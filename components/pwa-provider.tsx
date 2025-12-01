/**
 * PWA Provider
 * Handles Service Worker registration and PWA lifecycle
 */

'use client';

import { usePWA } from '@/lib/pwa';
import { useEffect } from 'react';
import { initLocalDB } from '@/lib/db';
import { initBackgroundSync, cleanupBackgroundSync } from '@/lib/sync/background-sync';

export function PWAProvider({ children }: { children: React.ReactNode }) {
  // Register and listen to Service Worker events
  usePWA();

  useEffect(() => {
    // Log PWA status
    if (typeof window !== 'undefined') {
      console.log('🚀 PWA Provider initialized');
      console.log('📱 Service Worker support:', 'serviceWorker' in navigator);
      console.log('🔔 Push support:', 'PushManager' in window);
      console.log('💾 Cache API support:', 'caches' in window);
      console.log('🗄️ IndexedDB support:', 'indexedDB' in window);
      console.log('🔄 Background Sync support:', 'SyncManager' in window);
      
      // Initialize local database
      initLocalDB().then((success) => {
        if (success) {
          console.log('✅ Local database ready');
          
          // Initialize background sync after DB is ready
          initBackgroundSync().catch((error) => {
            console.error('❌ Failed to initialize background sync:', error);
          });
        }
      });
    }
    
    // Cleanup on unmount
    return () => {
      cleanupBackgroundSync();
    };
  }, []);

  return <>{children}</>;
}
