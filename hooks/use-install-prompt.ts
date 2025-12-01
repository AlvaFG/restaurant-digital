/**
 * useInstallPrompt Hook
 * Manages PWA install prompt and installation state
 */

'use client';

import { useState, useEffect, useCallback } from 'react';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed'; platform: string }>;
}

export interface UseInstallPromptReturn {
  isInstallable: boolean;
  isInstalled: boolean;
  promptInstall: () => Promise<boolean>;
  dismissPrompt: () => void;
  platform: 'android' | 'ios' | 'desktop' | 'unknown';
}

export function useInstallPrompt(): UseInstallPromptReturn {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isInstallable, setIsInstallable] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);
  const [platform, setPlatform] = useState<'android' | 'ios' | 'desktop' | 'unknown'>('unknown');

  // Detect platform
  useEffect(() => {
    const userAgent = window.navigator.userAgent.toLowerCase();
    const isIOS = /iphone|ipad|ipod/.test(userAgent);
    const isAndroid = /android/.test(userAgent);
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches;
    
    if (isIOS) {
      setPlatform('ios');
      // Check if already installed on iOS
      if (isStandalone || (window.navigator as any).standalone) {
        setIsInstalled(true);
      }
    } else if (isAndroid) {
      setPlatform('android');
    } else {
      setPlatform('desktop');
    }

    // Check if already installed (for Chrome/Edge)
    if (isStandalone) {
      setIsInstalled(true);
    }
  }, []);

  // Listen for beforeinstallprompt event
  useEffect(() => {
    const handler = (e: Event) => {
      e.preventDefault();
      const promptEvent = e as BeforeInstallPromptEvent;
      setDeferredPrompt(promptEvent);
      setIsInstallable(true);
      console.log('✅ PWA install prompt available');
    };

    window.addEventListener('beforeinstallprompt', handler);

    return () => {
      window.removeEventListener('beforeinstallprompt', handler);
    };
  }, []);

  // Listen for app installed event
  useEffect(() => {
    const handler = () => {
      setIsInstalled(true);
      setIsInstallable(false);
      setDeferredPrompt(null);
      console.log('✅ PWA installed successfully');
    };

    window.addEventListener('appinstalled', handler);

    return () => {
      window.removeEventListener('appinstalled', handler);
    };
  }, []);

  // Prompt install
  const promptInstall = useCallback(async (): Promise<boolean> => {
    if (!deferredPrompt) {
      console.log('⚠️ No install prompt available');
      return false;
    }

    try {
      // Show the install prompt
      await deferredPrompt.prompt();

      // Wait for the user to respond
      const { outcome } = await deferredPrompt.userChoice;

      console.log(`User response: ${outcome}`);

      if (outcome === 'accepted') {
        console.log('✅ User accepted the install prompt');
        setIsInstallable(false);
        setDeferredPrompt(null);
        return true;
      } else {
        console.log('❌ User dismissed the install prompt');
        return false;
      }
    } catch (error) {
      console.error('Error showing install prompt:', error);
      return false;
    }
  }, [deferredPrompt]);

  // Dismiss prompt (hide UI without installing)
  const dismissPrompt = useCallback(() => {
    setIsInstallable(false);
    // Keep deferredPrompt in case user wants to install later
    console.log('ℹ️ Install prompt dismissed by user');
  }, []);

  return {
    isInstallable,
    isInstalled,
    promptInstall,
    dismissPrompt,
    platform,
  };
}

/**
 * Check if device supports PWA installation
 */
export function isPWAInstallSupported(): boolean {
  // Check if beforeinstallprompt is supported
  if ('BeforeInstallPromptEvent' in window) {
    return true;
  }

  // Check for iOS standalone mode
  const isIOS = /iphone|ipad|ipod/.test(window.navigator.userAgent.toLowerCase());
  if (isIOS && !((window.navigator as any).standalone)) {
    return true;
  }

  return false;
}
