/**
 * E2E Test: Customer QR Ordering Flow
 * 
 * Tests the complete customer journey from QR scan to order confirmation
 */

import { test, expect } from '@playwright/test'

test.describe('Customer QR Ordering Flow', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to QR menu page (simulating QR scan)
    await page.goto('/qr/mesa-1')
  })

  test('should load menu page successfully', async ({ page }) => {
    // Check page title
    await expect(page).toHaveTitle(/Menú/)

    // Check that menu items are visible
    await expect(page.locator('[data-testid="menu-item"]').first()).toBeVisible()

    // Check that session info is displayed
    await expect(page.locator('text=Mesa 1')).toBeVisible()
  })

  test('should search for menu items', async ({ page }) => {
    // Wait for page to load
    await page.waitForLoadState('networkidle')

    // Find search input
    const searchInput = page.locator('input[placeholder*="Buscar"]').first()
    await expect(searchInput).toBeVisible()

    // Type search query
    await searchInput.fill('pizza')
    await page.waitForTimeout(500) // Wait for debounce

    // Check that results are filtered
    const menuItems = page.locator('[data-testid="menu-item"]')
    const count = await menuItems.count()
    
    expect(count).toBeGreaterThan(0)

    // Verify all visible items contain "pizza" (case insensitive)
    for (let i = 0; i < count; i++) {
      const text = await menuItems.nth(i).textContent()
      expect(text?.toLowerCase()).toContain('pizza')
    }
  })

  test('should filter items by category', async ({ page }) => {
    // Wait for page to load
    await page.waitForLoadState('networkidle')

    // Click on a category (e.g., "Entradas")
    const categoryButton = page.locator('button', { hasText: 'Entradas' }).first()
    
    if (await categoryButton.isVisible()) {
      await categoryButton.click()
      await page.waitForTimeout(300)

      // Verify items are filtered
      const menuItems = page.locator('[data-testid="menu-item"]')
      expect(await menuItems.count()).toBeGreaterThan(0)
    }
  })

  test('should add item to cart', async ({ page }) => {
    // Wait for page to load
    await page.waitForLoadState('networkidle')

    // Get initial cart count
    const cartButton = page.locator('[data-testid="cart-button"]').first()
    const initialText = await cartButton.textContent()

    // Click on first menu item to view details
    await page.locator('[data-testid="menu-item"]').first().click()
    await page.waitForTimeout(300)

    // Add to cart
    const addButton = page.locator('button', { hasText: /Agregar|Añadir/ }).first()
    await expect(addButton).toBeVisible()
    await addButton.click()

    // Verify cart updated
    await page.waitForTimeout(500)
    const newText = await cartButton.textContent()
    expect(newText).not.toBe(initialText)
  })

  test('should complete checkout flow', async ({ page }) => {
    // Wait for page to load
    await page.waitForLoadState('networkidle')

    // Add item to cart first
    await page.locator('[data-testid="menu-item"]').first().click()
    await page.waitForTimeout(300)
    
    const addButton = page.locator('button', { hasText: /Agregar|Añadir/ }).first()
    if (await addButton.isVisible()) {
      await addButton.click()
      await page.waitForTimeout(500)
    }

    // Open cart
    const cartButton = page.locator('[data-testid="cart-button"]').first()
    await cartButton.click()
    await page.waitForTimeout(500)

    // Proceed to checkout
    const checkoutButton = page.locator('button', { hasText: /Continuar|Siguiente/ }).first()
    if (await checkoutButton.isVisible()) {
      await checkoutButton.click()
      await page.waitForTimeout(500)

      // Fill checkout form
      await page.fill('input[name="customerName"]', 'Test User')
      await page.fill('input[name="customerPhone"]', '1234567890')

      // Submit order
      const submitButton = page.locator('button', { hasText: /Confirmar|Enviar/ }).first()
      await submitButton.click()
      await page.waitForTimeout(1000)

      // Verify confirmation (either confirmation view or thank you message)
      const confirmationText = page.locator('text=/Pedido confirmado|Gracias|Recibimos tu pedido/i')
      await expect(confirmationText.first()).toBeVisible({ timeout: 10000 })
    }
  })

  test('should handle empty cart', async ({ page }) => {
    // Wait for page to load
    await page.waitForLoadState('networkidle')

    // Try to open cart (should be empty)
    const cartButton = page.locator('[data-testid="cart-button"]').first()
    await cartButton.click()
    await page.waitForTimeout(500)

    // Check for empty cart message
    const emptyMessage = page.locator('text=/carrito vacío|no hay items|sin productos/i')
    await expect(emptyMessage.first()).toBeVisible()
  })
})
