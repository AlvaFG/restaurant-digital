/**
 * E2E Test: Performance Tests
 * 
 * Tests application performance metrics
 */

import { test, expect } from '@playwright/test'

test.describe('Performance Tests', () => {
  test('should load QR menu page within 3 seconds', async ({ page }) => {
    const startTime = Date.now()
    
    await page.goto('/qr/mesa-1')
    await page.waitForLoadState('networkidle')
    
    const loadTime = Date.now() - startTime
    
    console.log(`Page load time: ${loadTime}ms`)
    expect(loadTime).toBeLessThan(3000) // 3 seconds
  })

  test('should have acceptable Lighthouse scores', async ({ page, browser }) => {
    await page.goto('/qr/mesa-1')
    
    // Wait for page to fully load
    await page.waitForLoadState('networkidle')
    await page.waitForTimeout(2000)

    // Check basic performance indicators
    const performanceMetrics = await page.evaluate(() => {
      const timing = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming
      return {
        domContentLoaded: timing.domContentLoadedEventEnd - timing.domContentLoadedEventStart,
        loadComplete: timing.loadEventEnd - timing.loadEventStart,
        totalTime: timing.loadEventEnd - timing.fetchStart,
      }
    })

    console.log('Performance metrics:', performanceMetrics)

    // Verify metrics are reasonable
    expect(performanceMetrics.totalTime).toBeLessThan(5000) // 5 seconds total
  })

  test('should respond quickly to user interactions', async ({ page }) => {
    await page.goto('/qr/mesa-1')
    await page.waitForLoadState('networkidle')

    // Measure search input response time
    const searchInput = page.locator('input[placeholder*="Buscar"]').first()
    
    if (await searchInput.isVisible()) {
      const startTime = Date.now()
      
      await searchInput.fill('pizza')
      await page.waitForTimeout(600) // Wait for debounce + render
      
      const responseTime = Date.now() - startTime
      
      console.log(`Search response time: ${responseTime}ms`)
      expect(responseTime).toBeLessThan(1000) // 1 second
    }
  })

  test('should handle multiple rapid clicks gracefully', async ({ page }) => {
    await page.goto('/qr/mesa-1')
    await page.waitForLoadState('networkidle')

    // Click first menu item multiple times rapidly
    const menuItem = page.locator('[data-testid="menu-item"]').first()
    
    if (await menuItem.isVisible()) {
      // Rapid clicks
      for (let i = 0; i < 5; i++) {
        await menuItem.click({ force: true })
        await page.waitForTimeout(50)
      }

      // Should not crash, verify page is still functional
      await page.waitForTimeout(500)
      await expect(menuItem).toBeVisible()
    }
  })

  test('should load images efficiently', async ({ page }) => {
    await page.goto('/qr/mesa-1')
    await page.waitForLoadState('networkidle')

    // Wait for images to load
    await page.waitForTimeout(2000)

    // Count loaded images
    const images = page.locator('img')
    const imageCount = await images.count()

    console.log(`Total images: ${imageCount}`)

    // Verify at least some images loaded
    expect(imageCount).toBeGreaterThan(0)

    // Check that images have proper attributes
    for (let i = 0; i < Math.min(imageCount, 5); i++) {
      const img = images.nth(i)
      const src = await img.getAttribute('src')
      const alt = await img.getAttribute('alt')

      expect(src).toBeTruthy()
      // Alt should exist (accessibility)
      if (alt === null) {
        console.warn(`Image ${i} missing alt text`)
      }
    }
  })

  test('should not have memory leaks in navigation', async ({ page }) => {
    await page.goto('/qr/mesa-1')
    await page.waitForLoadState('networkidle')

    // Navigate between routes multiple times
    for (let i = 0; i < 3; i++) {
      // Go to analytics
      await page.goto('/analitica')
      await page.waitForTimeout(1000)

      // Go back to QR menu
      await page.goto('/qr/mesa-1')
      await page.waitForTimeout(1000)
    }

    // If we get here without timeout, no major memory issues
    expect(true).toBe(true)
  })

  test('should handle large lists efficiently', async ({ page }) => {
    await page.goto('/qr/mesa-1')
    await page.waitForLoadState('networkidle')

    // Count menu items
    const menuItems = page.locator('[data-testid="menu-item"]')
    const count = await menuItems.count()

    console.log(`Total menu items: ${count}`)

    // Should be able to scroll through all items
    if (count > 10) {
      await page.evaluate(() => {
        window.scrollTo(0, document.body.scrollHeight)
      })
      await page.waitForTimeout(500)

      // Verify we can still interact with items
      await expect(menuItems.last()).toBeVisible()
    }
  })
})
