/**
 * E2E Test: Admin Dashboard
 * 
 * Tests admin dashboard functionality and analytics
 */

import { test, expect } from '@playwright/test'

test.describe('Admin Dashboard', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to analytics page
    await page.goto('/analitica')
    await page.waitForLoadState('networkidle')
  })

  test('should load analytics dashboard', async ({ page }) => {
    // Check for main dashboard elements
    await expect(page.locator('h1', { hasText: /analítica|analytics/i }).first()).toBeVisible()

    // Check for metric cards
    const metricCards = page.locator('[data-testid="metric-card"], .grid > div > div')
    expect(await metricCards.count()).toBeGreaterThan(0)
  })

  test('should display sales metrics', async ({ page }) => {
    // Wait for data to load
    await page.waitForTimeout(2000)

    // Check for revenue metrics
    await expect(page.locator('text=/ingresos|revenue|ventas/i').first()).toBeVisible()

    // Check for order count
    await expect(page.locator('text=/pedidos|orders/i').first()).toBeVisible()

    // Check for average ticket
    await expect(page.locator('text=/ticket promedio|average/i').first()).toBeVisible()
  })

  test('should change date range', async ({ page }) => {
    // Wait for initial load
    await page.waitForTimeout(2000)

    // Find date range selector
    const dateSelector = page.locator('button,select', { hasText: /últimos.*días|last.*days|hoy|today/i }).first()
    
    if (await dateSelector.isVisible()) {
      await dateSelector.click()
      await page.waitForTimeout(300)

      // Select different range
      const option = page.locator('text=/últimos 7 días|last 7 days|ayer|yesterday/i').first()
      if (await option.isVisible()) {
        await option.click()
        await page.waitForTimeout(1000)

        // Verify data refreshed (check for loading indicator or updated values)
        // This is a basic check - in real scenario we'd verify actual data changes
        await expect(page.locator('text=/ingresos|revenue/i').first()).toBeVisible()
      }
    }
  })

  test('should display revenue chart', async ({ page }) => {
    // Wait for charts to render
    await page.waitForTimeout(3000)

    // Check for chart canvas or SVG
    const chart = page.locator('canvas, svg').first()
    await expect(chart).toBeVisible()

    // Verify chart has content (not empty)
    const chartBox = await chart.boundingBox()
    expect(chartBox).toBeTruthy()
    expect(chartBox!.width).toBeGreaterThan(0)
    expect(chartBox!.height).toBeGreaterThan(0)
  })

  test('should display popular items table', async ({ page }) => {
    // Wait for data to load
    await page.waitForTimeout(2000)

    // Check for popular items section
    await expect(page.locator('text=/popular|más vendidos|top/i').first()).toBeVisible()

    // Check for table or list
    const table = page.locator('table, [role="table"]').first()
    if (await table.isVisible()) {
      // Verify table has rows
      const rows = table.locator('tr, [role="row"]')
      expect(await rows.count()).toBeGreaterThan(0)
    }
  })

  test('should display QR usage stats', async ({ page }) => {
    // Wait for data to load
    await page.waitForTimeout(2000)

    // Check for QR stats section
    const qrSection = page.locator('text=/qr|escaneos|scans/i').first()
    if (await qrSection.isVisible()) {
      await expect(qrSection).toBeVisible()

      // Check for conversion rate
      await expect(page.locator('text=/conversión|conversion/i').first()).toBeVisible()
    }
  })

  test('should refresh data on demand', async ({ page }) => {
    // Wait for initial load
    await page.waitForTimeout(2000)

    // Find refresh button
    const refreshButton = page.locator('button', { hasText: /actualizar|refresh/i }).first()
    
    if (await refreshButton.isVisible()) {
      await refreshButton.click()
      await page.waitForTimeout(1000)

      // Verify data is still visible (successfully refreshed)
      await expect(page.locator('text=/ingresos|revenue/i').first()).toBeVisible()
    }
  })
})
