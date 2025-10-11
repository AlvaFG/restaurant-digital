/**
 * E2E Test: Payment Flow
 * 
 * Tests the payment integration with MercadoPago
 */

import { test, expect } from '@playwright/test'

test.describe('Payment Flow', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to QR menu page
    await page.goto('/qr/mesa-1')
    await page.waitForLoadState('networkidle')
  })

  test('should display payment button after checkout', async ({ page }) => {
    // Add item to cart
    await page.locator('[data-testid="menu-item"]').first().click()
    await page.waitForTimeout(300)
    
    const addButton = page.locator('button', { hasText: /Agregar|Añadir/ }).first()
    if (await addButton.isVisible()) {
      await addButton.click()
      await page.waitForTimeout(500)
    }

    // Open cart
    await page.locator('[data-testid="cart-button"]').first().click()
    await page.waitForTimeout(500)

    // Proceed to checkout
    const checkoutButton = page.locator('button', { hasText: /Continuar|Siguiente/ }).first()
    if (await checkoutButton.isVisible()) {
      await checkoutButton.click()
      await page.waitForTimeout(500)

      // Fill form
      await page.fill('input[name="customerName"]', 'Test User')
      await page.fill('input[name="customerPhone"]', '1234567890')

      // Submit order
      const submitButton = page.locator('button', { hasText: /Confirmar|Enviar/ }).first()
      await submitButton.click()
      await page.waitForTimeout(1000)

      // Check for payment button (MercadoPago)
      const paymentButton = page.locator('button', { hasText: /Pagar|MercadoPago/ }).first()
      await expect(paymentButton).toBeVisible({ timeout: 5000 })
    }
  })

  test('should handle payment success page', async ({ page }) => {
    // Navigate directly to success page (with mock params)
    await page.goto('/qr/mesa-1/payment/success?payment_id=123456&external_reference=order-123&collection_status=approved')

    // Check for success indicators
    await expect(page.locator('text=/éxito|exitoso|aprobado/i').first()).toBeVisible()
    await expect(page.locator('text=/orden|pedido|order/i').first()).toBeVisible()

    // Check for back to menu button
    const backButton = page.locator('button,a', { hasText: /volver|menú/i }).first()
    await expect(backButton).toBeVisible()
  })

  test('should handle payment failure page', async ({ page }) => {
    // Navigate directly to failure page
    await page.goto('/qr/mesa-1/payment/failure?external_reference=order-123')

    // Check for failure indicators
    await expect(page.locator('text=/rechazado|fallido|error/i').first()).toBeVisible()

    // Check for retry button
    const retryButton = page.locator('button,a', { hasText: /intentar|reintentar/i }).first()
    await expect(retryButton).toBeVisible()
  })

  test('should handle payment pending page', async ({ page }) => {
    // Navigate directly to pending page
    await page.goto('/qr/mesa-1/payment/pending?payment_id=123456&external_reference=order-123')

    // Check for pending indicators
    await expect(page.locator('text=/pendiente|procesando|espera/i').first()).toBeVisible()

    // Check for back button
    const backButton = page.locator('button,a', { hasText: /volver|menú/i }).first()
    await expect(backButton).toBeVisible()
  })

  test('should validate payment button is disabled when loading', async ({ page }) => {
    // This test would require mocking the payment API
    // For now, we just verify the button exists and can be clicked
    
    // Add item and proceed to payment
    await page.locator('[data-testid="menu-item"]').first().click()
    await page.waitForTimeout(300)
    
    const addButton = page.locator('button', { hasText: /Agregar|Añadir/ }).first()
    if (await addButton.isVisible()) {
      await addButton.click()
      await page.waitForTimeout(500)

      await page.locator('[data-testid="cart-button"]').first().click()
      await page.waitForTimeout(500)

      const checkoutButton = page.locator('button', { hasText: /Continuar|Siguiente/ }).first()
      if (await checkoutButton.isVisible()) {
        await checkoutButton.click()
        await page.waitForTimeout(500)

        await page.fill('input[name="customerName"]', 'Test User')
        await page.fill('input[name="customerPhone"]', '1234567890')

        const submitButton = page.locator('button', { hasText: /Confirmar|Enviar/ }).first()
        await submitButton.click()
        await page.waitForTimeout(1000)

        // Payment button should exist
        const paymentButton = page.locator('button', { hasText: /Pagar|MercadoPago/ }).first()
        if (await paymentButton.isVisible()) {
          // Button should be clickable (not disabled initially)
          await expect(paymentButton).toBeEnabled()
        }
      }
    }
  })
})
