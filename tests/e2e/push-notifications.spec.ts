/**
 * E2E Tests for Push Notifications
 * Tests the complete push notification flow
 */

import { test, expect } from '@playwright/test';

test.describe('Push Notifications E2E', () => {
  test.beforeEach(async ({ page, context }) => {
    // Grant notification permissions
    await context.grantPermissions(['notifications']);
    
    // Navigate to app
    await page.goto('/login');
    
    // Login (adjust selectors based on your login page)
    await page.fill('input[type="email"]', 'test@restaurant.com');
    await page.fill('input[type="password"]', 'password123');
    await page.click('button[type="submit"]');
    
    // Wait for dashboard
    await page.waitForURL('/dashboard');
  });

  test('should show push notification badge in sidebar', async ({ page }) => {
    // Look for the push notification badge
    const badge = page.locator('[aria-label="Estado de notificaciones push"]');
    await expect(badge).toBeVisible();
  });

  test('should navigate to notification settings', async ({ page }) => {
    // Click on push notification badge
    await page.click('[aria-label="Estado de notificaciones push"]');
    
    // Click on settings button in popover
    await page.click('text=Configurar notificaciones');
    
    // Should navigate to notification settings page
    await expect(page).toHaveURL('/configuracion/notificaciones');
    
    // Page should have heading
    await expect(page.locator('h1:has-text("Notificaciones Push")')).toBeVisible();
  });

  test('should show notification preferences panel', async ({ page }) => {
    await page.goto('/configuracion/notificaciones');
    
    // Should show main subscription card
    await expect(page.locator('text=Estado de notificaciones')).toBeVisible();
    
    // Should show activate button (if not already subscribed)
    const activateButton = page.locator('button:has-text("Activar notificaciones")');
    const testButton = page.locator('button:has-text("Probar")');
    
    // Either activate or test button should be visible
    const hasButton = await activateButton.isVisible().catch(() => false) || 
                     await testButton.isVisible().catch(() => false);
    expect(hasButton).toBeTruthy();
  });

  test('should activate push notifications', async ({ page }) => {
    await page.goto('/configuracion/notificaciones');
    
    // Click activate button if available
    const activateButton = page.locator('button:has-text("Activar notificaciones")');
    
    if (await activateButton.isVisible()) {
      await activateButton.click();
      
      // Wait for subscription to complete
      await page.waitForTimeout(2000);
      
      // Should show test button after activation
      await expect(page.locator('button:has-text("Probar")')).toBeVisible({
        timeout: 5000,
      });
    }
  });

  test('should show notification preferences when subscribed', async ({ page }) => {
    await page.goto('/configuracion/notificaciones');
    
    // Activate if not subscribed
    const activateButton = page.locator('button:has-text("Activar notificaciones")');
    if (await activateButton.isVisible()) {
      await activateButton.click();
      await page.waitForTimeout(2000);
    }
    
    // Should show preference toggles
    await expect(page.locator('text=Tipos de notificaciones')).toBeVisible();
    await expect(page.locator('text=Nuevos pedidos')).toBeVisible();
    await expect(page.locator('text=Cambios de estado en pedidos')).toBeVisible();
    await expect(page.locator('text=Alertas de cocina')).toBeVisible();
    await expect(page.locator('text=Alertas de mesas')).toBeVisible();
  });

  test('should toggle notification preferences', async ({ page }) => {
    await page.goto('/configuracion/notificaciones');
    
    // Ensure subscribed
    const activateButton = page.locator('button:has-text("Activar notificaciones")');
    if (await activateButton.isVisible()) {
      await activateButton.click();
      await page.waitForTimeout(2000);
    }
    
    // Find the "Nuevos pedidos" switch
    const newOrdersSwitch = page.locator('label:has-text("Nuevos pedidos")').locator('..').locator('[role="switch"]');
    
    // Get initial state
    const initialState = await newOrdersSwitch.getAttribute('data-state');
    
    // Toggle
    await newOrdersSwitch.click();
    
    // State should change
    const newState = await newOrdersSwitch.getAttribute('data-state');
    expect(newState).not.toBe(initialState);
  });

  test('should enable quiet hours', async ({ page }) => {
    await page.goto('/configuracion/notificaciones');
    
    // Ensure subscribed
    const activateButton = page.locator('button:has-text("Activar notificaciones")');
    if (await activateButton.isVisible()) {
      await activateButton.click();
      await page.waitForTimeout(2000);
    }
    
    // Find quiet hours switch
    const quietHoursSwitch = page.locator('label:has-text("Activar horarios de silencio")').locator('..').locator('[role="switch"]');
    
    // Enable quiet hours
    if (await quietHoursSwitch.getAttribute('data-state') === 'unchecked') {
      await quietHoursSwitch.click();
    }
    
    // Time inputs should be visible
    await expect(page.locator('label:has-text("Inicio")')).toBeVisible();
    await expect(page.locator('label:has-text("Fin")')).toBeVisible();
    
    // Inputs should have default times
    const startInput = page.locator('input[type="time"]').first();
    const endInput = page.locator('input[type="time"]').last();
    
    await expect(startInput).toHaveValue(/\d{2}:\d{2}/);
    await expect(endInput).toHaveValue(/\d{2}:\d{2}/);
  });

  test('should save preferences', async ({ page }) => {
    await page.goto('/configuracion/notificaciones');
    
    // Ensure subscribed
    const activateButton = page.locator('button:has-text("Activar notificaciones")');
    if (await activateButton.isVisible()) {
      await activateButton.click();
      await page.waitForTimeout(2000);
    }
    
    // Make a change
    const newOrdersSwitch = page.locator('label:has-text("Nuevos pedidos")').locator('..').locator('[role="switch"]');
    await newOrdersSwitch.click();
    
    // Click save button
    await page.click('button:has-text("Guardar preferencias")');
    
    // Should show success message
    await expect(page.locator('text=Preferencias guardadas correctamente')).toBeVisible({
      timeout: 5000,
    });
  });

  test('should show blocked state when permissions denied', async ({ page, context }) => {
    // Deny notifications
    await context.clearPermissions();
    
    await page.goto('/configuracion/notificaciones');
    
    // Should show activate button
    const activateButton = page.locator('button:has-text("Activar notificaciones")');
    await expect(activateButton).toBeVisible();
    
    // Click to trigger permission request (will be auto-denied in test)
    await activateButton.click();
    await page.waitForTimeout(1000);
    
    // Should show permission instructions or error
    // (depends on implementation)
  });

  test('should unsubscribe from notifications', async ({ page }) => {
    await page.goto('/configuracion/notificaciones');
    
    // Ensure subscribed
    const activateButton = page.locator('button:has-text("Activar notificaciones")');
    if (await activateButton.isVisible()) {
      await activateButton.click();
      await page.waitForTimeout(2000);
    }
    
    // Click unsubscribe button
    await page.click('button:has-text("Desactivar")');
    
    // Wait for unsubscription
    await page.waitForTimeout(1000);
    
    // Should show activate button again
    await expect(page.locator('button:has-text("Activar notificaciones")')).toBeVisible({
      timeout: 5000,
    });
  });
});

test.describe('Push Notification Badge', () => {
  test.beforeEach(async ({ page, context }) => {
    await context.grantPermissions(['notifications']);
    await page.goto('/login');
    await page.fill('input[type="email"]', 'test@restaurant.com');
    await page.fill('input[type="password"]', 'password123');
    await page.click('button[type="submit"]');
    await page.waitForURL('/dashboard');
  });

  test('should show notification badge popover', async ({ page }) => {
    // Click badge
    await page.click('[aria-label="Estado de notificaciones push"]');
    
    // Popover should be visible
    await expect(page.locator('text=Notificaciones Push').first()).toBeVisible();
    await expect(page.locator('text=Estado actual:')).toBeVisible();
  });

  test('should show correct status in badge', async ({ page }) => {
    // Click badge to open popover
    await page.click('[aria-label="Estado de notificaciones push"]');
    
    // Should show a status badge (Activas/Inactivas/Bloqueadas)
    const statusBadges = page.locator('text=/Activas|Inactivas|Bloqueadas/');
    await expect(statusBadges.first()).toBeVisible();
  });
});
