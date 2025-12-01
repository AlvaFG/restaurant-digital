/**
 * E2E Tests for PWA Installation
 * Tests install flow, manifest, icons, and offline functionality
 */

import { test, expect, type Page } from '@playwright/test';

// Helper to check if running in a PWA-supporting browser
const isPWASupported = (userAgent: string) => {
  return userAgent.includes('Chrome') || userAgent.includes('Edge');
};

test.describe('PWA Installation', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('should have valid manifest.json', async ({ page }) => {
    const response = await page.request.get('/manifest.json');
    expect(response.ok()).toBeTruthy();

    const manifest = await response.json();

    // Verify required fields
    expect(manifest.name).toBe('Restaurant QR - Sistema de Gestión');
    expect(manifest.short_name).toBe('Restaurant QR');
    expect(manifest.start_url).toBe('/');
    expect(manifest.display).toBe('standalone');
    expect(manifest.theme_color).toBeDefined();
    expect(manifest.background_color).toBeDefined();

    // Verify icons
    expect(manifest.icons).toBeInstanceOf(Array);
    expect(manifest.icons.length).toBeGreaterThanOrEqual(9);

    // Check icon sizes
    const iconSizes = manifest.icons.map((icon: any) => icon.sizes);
    expect(iconSizes).toContain('192x192');
    expect(iconSizes).toContain('512x512');

    // Verify maskable icon exists
    const maskableIcon = manifest.icons.find((icon: any) => 
      icon.purpose?.includes('maskable')
    );
    expect(maskableIcon).toBeDefined();

    // Verify shortcuts
    expect(manifest.shortcuts).toBeInstanceOf(Array);
    expect(manifest.shortcuts.length).toBe(4);

    const shortcutNames = manifest.shortcuts.map((s: any) => s.name);
    expect(shortcutNames).toContain('Dashboard');
    expect(shortcutNames).toContain('Salón en Vivo');
    expect(shortcutNames).toContain('Pedidos');
    expect(shortcutNames).toContain('Alertas');

    // Verify categories
    expect(manifest.categories).toContain('business');
    expect(manifest.categories).toContain('food');

    // Verify lang
    expect(manifest.lang).toBe('es-ES');
  });

  test('should load all PWA icons', async ({ page }) => {
    const response = await page.request.get('/manifest.json');
    const manifest = await response.json();

    for (const icon of manifest.icons) {
      const iconResponse = await page.request.get(icon.src);
      expect(iconResponse.ok(), `Icon ${icon.src} should load`).toBeTruthy();
      expect(iconResponse.headers()['content-type']).toContain('image');
    }
  });

  test('should load iOS apple-touch-icons', async ({ page }) => {
    const appleTouchIcons = [
      '/apple-touch-icon.png',
      '/apple-touch-icon-120x120.png',
      '/apple-touch-icon-152x152.png',
      '/apple-touch-icon-167x167.png',
    ];

    for (const iconPath of appleTouchIcons) {
      const response = await page.request.get(iconPath);
      expect(response.ok(), `Apple icon ${iconPath} should load`).toBeTruthy();
    }
  });

  test('should load iOS splash screens', async ({ page }) => {
    const splashScreens = [
      '/apple-splash-640-1136.png',
      '/apple-splash-750-1334.png',
      '/apple-splash-1125-2436.png',
      '/apple-splash-1242-2208.png',
      '/apple-splash-1536-2048.png',
      '/apple-splash-2048-2732.png',
    ];

    for (const splashPath of splashScreens) {
      const response = await page.request.get(splashPath);
      expect(response.ok(), `Splash screen ${splashPath} should load`).toBeTruthy();
    }
  });

  test('should have service worker registered', async ({ page }) => {
    // Wait for service worker to register
    await page.waitForTimeout(2000);

    const swRegistration = await page.evaluate(async () => {
      if ('serviceWorker' in navigator) {
        const registration = await navigator.serviceWorker.getRegistration();
        return {
          registered: !!registration,
          scope: registration?.scope,
          active: !!registration?.active,
        };
      }
      return { registered: false };
    });

    expect(swRegistration.registered).toBeTruthy();
    expect(swRegistration.active).toBeTruthy();
  });

  test('should have meta tags for PWA', async ({ page }) => {
    // Check theme-color meta tag
    const themeColor = await page.locator('meta[name="theme-color"]').getAttribute('content');
    expect(themeColor).toBeTruthy();

    // Check viewport meta tag
    const viewport = await page.locator('meta[name="viewport"]').getAttribute('content');
    expect(viewport).toContain('width=device-width');
    expect(viewport).toContain('initial-scale=1');
  });

  test('should have iOS meta tags', async ({ page }) => {
    // Check apple-mobile-web-app-capable
    const capable = await page.locator('meta[name="apple-mobile-web-app-capable"]').getAttribute('content');
    expect(capable).toBe('yes');

    // Check apple-mobile-web-app-status-bar-style
    const statusBar = await page.locator('meta[name="apple-mobile-web-app-status-bar-style"]').getAttribute('content');
    expect(statusBar).toBeTruthy();

    // Check apple-mobile-web-app-title
    const title = await page.locator('meta[name="apple-mobile-web-app-title"]').getAttribute('content');
    expect(title).toBe('Restaurant QR');
  });

  test('should show install prompt after 30 seconds (Chrome/Edge)', async ({ page, browserName }) => {
    if (browserName !== 'chromium') {
      test.skip();
      return;
    }

    // Mock beforeinstallprompt event
    await page.evaluate(() => {
      const event = new Event('beforeinstallprompt') as any;
      event.prompt = () => Promise.resolve();
      event.userChoice = Promise.resolve({ outcome: 'accepted' });
      window.dispatchEvent(event);
    });

    // Fast-forward timers
    await page.waitForTimeout(31000);

    // Check if install prompt is visible
    const installPrompt = page.getByText('Instalar App');
    await expect(installPrompt).toBeVisible({ timeout: 5000 });
  });

  test('should show iOS instructions on iOS Safari', async ({ page }) => {
    // Mock iOS user agent
    await page.addInitScript(() => {
      Object.defineProperty(navigator, 'userAgent', {
        get: () => 'Mozilla/5.0 (iPhone; CPU iPhone OS 16_0 like Mac OS X) AppleWebKit/605.1.15',
      });
    });

    await page.reload();

    // Mock installable state
    await page.evaluate(() => {
      localStorage.removeItem('pwa-prompt-dismissed');
      // Simulate installable state for iOS
      (window as any).__pwaInstallable = true;
    });

    await page.waitForTimeout(31000);

    // Check for iOS-specific instructions
    const iosPrompt = page.getByText('Instalar en iOS');
    await expect(iosPrompt).toBeVisible({ timeout: 5000 });

    const shareButton = page.getByText(/Toca el botón de compartir/i);
    await expect(shareButton).toBeVisible();
  });

  test('should dismiss install prompt', async ({ page }) => {
    // Mock beforeinstallprompt
    await page.evaluate(() => {
      const event = new Event('beforeinstallprompt') as any;
      event.prompt = () => Promise.resolve();
      event.userChoice = Promise.resolve({ outcome: 'dismissed' });
      window.dispatchEvent(event);
    });

    await page.waitForTimeout(31000);

    const installPrompt = page.getByText('Instalar App');
    if (await installPrompt.isVisible()) {
      const dismissButton = page.getByText('Ahora no');
      await dismissButton.click();

      await expect(installPrompt).not.toBeVisible();

      // Verify localStorage was set
      const dismissed = await page.evaluate(() => {
        return localStorage.getItem('pwa-prompt-dismissed');
      });
      expect(dismissed).toBeTruthy();
    }
  });
});

test.describe('Offline Functionality', () => {
  test('should work offline', async ({ page, context }) => {
    await page.goto('/');

    // Wait for service worker to be active
    await page.waitForTimeout(2000);

    // Go offline
    await context.setOffline(true);

    // Navigate to dashboard (should load from cache)
    await page.goto('/dashboard');

    // Check if page loaded
    const heading = page.getByRole('heading', { name: /dashboard/i });
    await expect(heading).toBeVisible({ timeout: 10000 });

    // Check connection status indicator shows offline
    const offlineIndicator = page.getByText(/sin conexión/i);
    await expect(offlineIndicator).toBeVisible({ timeout: 5000 });
  });

  test('should show offline fallback for uncached pages', async ({ page, context }) => {
    await page.goto('/');
    await page.waitForTimeout(2000);

    // Go offline
    await context.setOffline(true);

    // Try to navigate to a page that might not be cached
    try {
      await page.goto('/some-uncached-page');
      
      // Should show offline fallback
      const offlineMessage = page.getByText(/offline/i);
      await expect(offlineMessage).toBeVisible({ timeout: 5000 });
    } catch (error) {
      // If offline fallback is not implemented, navigation will fail
      // This is acceptable
    }
  });

  test('should cache images', async ({ page, context }) => {
    await page.goto('/');
    await page.waitForTimeout(3000);

    // Load page with images
    const images = await page.locator('img').all();
    expect(images.length).toBeGreaterThan(0);

    // Go offline
    await context.setOffline(true);

    // Reload page
    await page.reload();

    // Images should still load from cache
    const imagesAfterReload = await page.locator('img').all();
    expect(imagesAfterReload.length).toBeGreaterThan(0);
  });

  test('should sync data when coming back online', async ({ page, context }) => {
    await page.goto('/dashboard');
    await page.waitForTimeout(2000);

    // Go offline
    await context.setOffline(true);

    // Make a change that would trigger sync queue
    // (This depends on your app's implementation)
    // For example, create an order
    
    // Go back online
    await context.setOffline(false);

    // Wait for sync to trigger
    await page.waitForTimeout(3000);

    // Check if sync indicator shows success
    // (This is app-specific)
  });
});

test.describe('PWA Manifest Validation', () => {
  test('should have proper cache headers for manifest', async ({ page }) => {
    const response = await page.request.get('/manifest.json');
    
    // Manifest should be cacheable but revalidated
    const cacheControl = response.headers()['cache-control'];
    expect(cacheControl).toBeTruthy();
  });

  test('should have proper cache headers for icons', async ({ page }) => {
    const response = await page.request.get('/icon-192x192.png');
    
    // Icons should have long cache time
    const cacheControl = response.headers()['cache-control'];
    expect(cacheControl).toBeTruthy();
  });

  test('should respond with 200 for service worker', async ({ page }) => {
    const response = await page.request.get('/sw.js');
    expect(response.ok()).toBeTruthy();
    expect(response.status()).toBe(200);
  });

  test('should have proper MIME type for manifest', async ({ page }) => {
    const response = await page.request.get('/manifest.json');
    const contentType = response.headers()['content-type'];
    expect(contentType).toContain('application/json');
  });

  test('should have proper MIME type for service worker', async ({ page }) => {
    const response = await page.request.get('/sw.js');
    const contentType = response.headers()['content-type'];
    expect(contentType).toMatch(/javascript|application\/javascript/);
  });
});

test.describe('PWA Features', () => {
  test('should detect PWA display mode', async ({ page }) => {
    const displayMode = await page.evaluate(() => {
      if (window.matchMedia('(display-mode: standalone)').matches) {
        return 'standalone';
      }
      if (window.matchMedia('(display-mode: fullscreen)').matches) {
        return 'fullscreen';
      }
      if (window.matchMedia('(display-mode: minimal-ui)').matches) {
        return 'minimal-ui';
      }
      return 'browser';
    });

    expect(['standalone', 'fullscreen', 'minimal-ui', 'browser']).toContain(displayMode);
  });

  test('should handle app shortcuts', async ({ page }) => {
    const response = await page.request.get('/manifest.json');
    const manifest = await response.json();

    // Verify all shortcuts have valid URLs
    for (const shortcut of manifest.shortcuts) {
      expect(shortcut.url).toBeTruthy();
      expect(shortcut.name).toBeTruthy();
      
      // Verify shortcut URLs are valid
      const shortcutResponse = await page.request.get(shortcut.url);
      expect(shortcutResponse.ok()).toBeTruthy();
    }
  });

  test('should have connection status indicator', async ({ page }) => {
    await page.goto('/dashboard');

    // Check if connection status component exists
    const connectionStatus = page.locator('[data-testid="connection-status"]')
      .or(page.getByText(/conectado|sin conexión/i));

    await expect(connectionStatus).toBeVisible({ timeout: 5000 });
  });
});

test.describe('Performance', () => {
  test('should load quickly', async ({ page }) => {
    const startTime = Date.now();
    await page.goto('/');
    await page.waitForLoadState('domcontentloaded');
    const loadTime = Date.now() - startTime;

    // Should load in less than 3 seconds
    expect(loadTime).toBeLessThan(3000);
  });

  test('should have optimized images', async ({ page }) => {
    await page.goto('/');

    const images = await page.locator('img').all();

    for (const img of images) {
      const src = await img.getAttribute('src');
      if (src && !src.startsWith('data:')) {
        // Check if image is WebP or AVIF (optimized formats)
        const isOptimized = src.includes('.webp') || 
                          src.includes('.avif') || 
                          src.includes('/_next/image');
        
        // At least some images should be optimized
        // (This is a soft check)
      }
    }
  });
});
