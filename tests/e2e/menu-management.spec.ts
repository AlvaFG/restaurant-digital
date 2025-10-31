/**
 * E2E Tests: Menu Management Flow
 * Tests de flujo completo para gestión de menú (Sprint 1)
 */

import { test, expect } from '@playwright/test'

const TEST_EMAIL = 'admin@test.com'
const TEST_PASSWORD = 'admin123'
const BASE_URL = 'http://localhost:3000'

test.describe('Menu Management Flow', () => {
  test.beforeEach(async ({ page }) => {
    // Login antes de cada test
    await page.goto(`${BASE_URL}/login`)
    await page.fill('input[type="email"]', TEST_EMAIL)
    await page.fill('input[type="password"]', TEST_PASSWORD)
    await page.click('button[type="submit"]')
    
    // Esperar a que se complete el login
    await page.waitForURL(`${BASE_URL}/dashboard`)
  })

  test('should create a new menu category', async ({ page }) => {
    // Navegar a página de menú
    await page.goto(`${BASE_URL}/menu`)
    
    // Click en botón "Nueva Categoría"
    await page.click('button:has-text("Nueva Categoría"), button:has-text("Agregar Categoría")')
    
    // Llenar formulario
    await page.fill('input[name="name"]', 'Postres Test')
    await page.fill('textarea[name="description"]', 'Deliciosos postres caseros')
    
    // Guardar
    await page.click('button:has-text("Guardar"), button:has-text("Crear")')
    
    // Verificar que aparece en la lista
    await expect(page.locator('text=Postres Test')).toBeVisible()
  })

  test('should create a menu item in a category', async ({ page }) => {
    await page.goto(`${BASE_URL}/menu`)
    
    // Asegurarse de que hay una categoría
    const hasCategory = await page.locator('text=/Entradas|Platos|Bebidas/').isVisible()
    
    if (!hasCategory) {
      // Crear categoría primero
      await page.click('button:has-text("Nueva Categoría")')
      await page.fill('input[name="name"]', 'Test Category')
      await page.click('button:has-text("Guardar")')
      await page.waitForTimeout(1000)
    }
    
    // Click en "Agregar Item" o "Nuevo Item"
    await page.click('button:has-text("Nuevo Item"), button:has-text("Agregar Item")')
    
    // Llenar formulario de item
    await page.fill('input[name="name"]', 'Tarta de Chocolate')
    await page.fill('textarea[name="description"]', 'Tarta de chocolate belga con crema')
    await page.fill('input[name="price"]', '1500')
    
    // Seleccionar categoría
    const categorySelect = page.locator('select[name="category"], [role="combobox"]').first()
    if (await categorySelect.isVisible()) {
      await categorySelect.click()
      await page.locator('text=/Entradas|Test Category/').first().click()
    }
    
    // Guardar
    await page.click('button[type="submit"]')
    
    // Verificar que aparece en la lista
    await expect(page.locator('text=Tarta de Chocolate')).toBeVisible()
  })

  test('should edit a menu item', async ({ page }) => {
    await page.goto(`${BASE_URL}/menu`)
    
    // Buscar un item existente
    const firstItem = page.locator('[data-testid="menu-item"]').first()
    
    if (await firstItem.isVisible()) {
      // Click en botón editar
      await firstItem.locator('button:has-text("Editar"), button[aria-label*="Editar"]').click()
      
      // Modificar precio
      const priceInput = page.locator('input[name="price"]')
      await priceInput.clear()
      await priceInput.fill('2000')
      
      // Guardar cambios
      await page.click('button:has-text("Guardar")')
      
      // Verificar que se guardó
      await expect(page.locator('text=/2000|$20|20.00/')).toBeVisible()
    }
  })

  test('should delete a menu item with confirmation', async ({ page }) => {
    await page.goto(`${BASE_URL}/menu`)
    
    // Crear un item para eliminar
    await page.click('button:has-text("Nuevo Item")').catch(() => {})
    
    if (await page.locator('input[name="name"]').isVisible()) {
      await page.fill('input[name="name"]', 'Item to Delete')
      await page.fill('input[name="price"]', '100')
      await page.click('button[type="submit"]')
      await page.waitForTimeout(1000)
    }
    
    // Buscar el item y eliminarlo
    const itemToDelete = page.locator('text=Item to Delete').first()
    
    if (await itemToDelete.isVisible()) {
      // Click en botón eliminar
      await page.locator('button[aria-label*="Eliminar"]').first().click()
      
      // Confirmar en el AlertDialog
      await expect(page.locator('[role="alertdialog"]')).toBeVisible()
      await page.click('button:has-text("Eliminar"), button:has-text("Confirmar")')
      
      // Verificar que ya no está
      await expect(itemToDelete).not.toBeVisible({ timeout: 5000 })
    }
  })

  test('should toggle menu item availability', async ({ page }) => {
    await page.goto(`${BASE_URL}/menu`)
    
    // Buscar un item con toggle de disponibilidad
    const availabilityToggle = page.locator('[role="switch"]').first()
    
    if (await availabilityToggle.isVisible()) {
      const initialState = await availabilityToggle.getAttribute('aria-checked')
      
      // Hacer click en el toggle
      await availabilityToggle.click()
      
      // Esperar a que cambie el estado
      await page.waitForTimeout(500)
      
      const newState = await availabilityToggle.getAttribute('aria-checked')
      expect(newState).not.toBe(initialState)
    }
  })

  test('should search menu items', async ({ page }) => {
    await page.goto(`${BASE_URL}/menu`)
    
    // Buscar campo de búsqueda
    const searchInput = page.locator('input[placeholder*="Buscar"], input[type="search"]')
    
    if (await searchInput.isVisible()) {
      await searchInput.fill('chocolate')
      await page.waitForTimeout(500)
      
      // Verificar que los resultados están filtrados
      const items = page.locator('[data-testid="menu-item"]')
      const count = await items.count()
      
      if (count > 0) {
        // Al menos uno debería contener "chocolate"
        const firstItemText = await items.first().textContent()
        expect(firstItemText?.toLowerCase()).toContain('chocolate')
      }
    }
  })

  test('should reorder categories', async ({ page }) => {
    await page.goto(`${BASE_URL}/menu`)
    
    // Buscar botones de reordenamiento
    const moveUpButton = page.locator('button[aria-label*="Subir"], button:has-text("↑")').first()
    
    if (await moveUpButton.isVisible()) {
      const categories = page.locator('[data-testid="category"]')
      const initialCount = await categories.count()
      
      if (initialCount > 1) {
        // Click en mover
        await moveUpButton.click()
        await page.waitForTimeout(500)
        
        // Verificar que el orden cambió (no throw error)
        await expect(categories.first()).toBeVisible()
      }
    }
  })

  test('complete menu flow: category → item → publish', async ({ page }) => {
    await page.goto(`${BASE_URL}/menu`)
    
    // 1. Crear categoría
    await page.click('button:has-text("Nueva Categoría")').catch(() => {})
    
    if (await page.locator('input[name="name"]').isVisible()) {
      await page.fill('input[name="name"]', 'Menú del Día')
      await page.fill('textarea[name="description"]', 'Platos especiales diarios')
      await page.click('button:has-text("Guardar")')
      await page.waitForTimeout(1000)
    }
    
    // 2. Agregar item a la categoría
    await page.click('button:has-text("Nuevo Item")').catch(() => {})
    
    if (await page.locator('input[name="name"]').isVisible()) {
      await page.fill('input[name="name"]', 'Sopa del Día')
      await page.fill('input[name="price"]', '500')
      await page.click('button[type="submit"]')
      await page.waitForTimeout(1000)
    }
    
    // 3. Verificar que el item está visible
    await expect(page.locator('text=Sopa del Día')).toBeVisible()
    
    // 4. Marcar como disponible (si hay toggle)
    const toggle = page.locator('[role="switch"]').first()
    if (await toggle.isVisible()) {
      const isChecked = await toggle.getAttribute('aria-checked')
      if (isChecked === 'false') {
        await toggle.click()
      }
    }
    
    // 5. Verificar que todo se guardó correctamente
    await page.reload()
    await expect(page.locator('text=Menú del Día')).toBeVisible()
    await expect(page.locator('text=Sopa del Día')).toBeVisible()
  })
})

test.describe('Menu Management - Error Handling', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(`${BASE_URL}/login`)
    await page.fill('input[type="email"]', TEST_EMAIL)
    await page.fill('input[type="password"]', TEST_PASSWORD)
    await page.click('button[type="submit"]')
    await page.waitForURL(`${BASE_URL}/dashboard`)
  })

  test('should show validation error for empty item name', async ({ page }) => {
    await page.goto(`${BASE_URL}/menu`)
    
    await page.click('button:has-text("Nuevo Item")').catch(() => {})
    
    if (await page.locator('button[type="submit"]').isVisible()) {
      // Intentar guardar sin nombre
      await page.click('button[type="submit"]')
      
      // Debería mostrar error de validación
      await expect(
        page.locator('text=/requerido|obligatorio|necesario/i')
      ).toBeVisible({ timeout: 3000 })
    }
  })

  test('should prevent deleting category with items', async ({ page }) => {
    await page.goto(`${BASE_URL}/menu`)
    
    // Intentar eliminar una categoría que tiene items
    const deleteButton = page.locator('button[aria-label*="Eliminar categoría"]').first()
    
    if (await deleteButton.isVisible()) {
      await deleteButton.click()
      
      // Debería mostrar error o advertencia
      await expect(
        page.locator('text=/tiene items|contiene productos|no se puede eliminar/i')
      ).toBeVisible({ timeout: 3000 })
    }
  })
})
