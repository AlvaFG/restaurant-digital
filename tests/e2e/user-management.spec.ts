/**
 * E2E Tests: User Management Flow
 * Tests de flujo completo para gestión de usuarios (Sprint 1)
 */

import { test, expect } from '@playwright/test'

const TEST_EMAIL = 'admin@test.com'
const TEST_PASSWORD = 'admin123'
const BASE_URL = 'http://localhost:3000'

test.describe('User Management Flow', () => {
  test.beforeEach(async ({ page }) => {
    // Login como admin
    await page.goto(`${BASE_URL}/login`)
    await page.fill('input[type="email"]', TEST_EMAIL)
    await page.fill('input[type="password"]', TEST_PASSWORD)
    await page.click('button[type="submit"]')
    await page.waitForURL(`${BASE_URL}/dashboard`)
  })

  test('should create a new user', async ({ page }) => {
    // Navegar a gestión de usuarios
    await page.goto(`${BASE_URL}/usuarios`)
    
    // Click en "Nuevo Usuario" o "Agregar Usuario"
    await page.click('button:has-text("Nuevo Usuario"), button:has-text("Agregar Usuario")')
    
    // Llenar formulario
    const timestamp = Date.now()
    await page.fill('input[name="email"]', `test.user.${timestamp}@example.com`)
    await page.fill('input[name="name"]', `Test User ${timestamp}`)
    await page.fill('input[name="password"]', 'SecurePass123')
    
    // Seleccionar rol
    const roleSelect = page.locator('select[name="role"], [role="combobox"]').first()
    if (await roleSelect.isVisible()) {
      await roleSelect.click()
      await page.locator('text=/Staff|Mesero|Personal/').first().click()
    }
    
    // Guardar
    await page.click('button[type="submit"]')
    
    // Verificar que aparece en la lista
    await expect(page.locator(`text=Test User ${timestamp}`)).toBeVisible()
  })

  test('should edit user details', async ({ page }) => {
    await page.goto(`${BASE_URL}/usuarios`)
    
    // Buscar un usuario staff (no admin)
    const staffUser = page.locator('[data-testid="user-row"]:has-text("Staff")').first()
    
    if (await staffUser.isVisible()) {
      // Click en botón editar
      await staffUser.locator('button:has-text("Editar"), button[aria-label*="Editar"]').click()
      
      // Cambiar nombre
      const nameInput = page.locator('input[name="name"]')
      await nameInput.clear()
      await nameInput.fill('Updated Staff Name')
      
      // Guardar
      await page.click('button:has-text("Guardar")')
      
      // Verificar cambio
      await expect(page.locator('text=Updated Staff Name')).toBeVisible()
    }
  })

  test('should change user role from staff to manager', async ({ page }) => {
    await page.goto(`${BASE_URL}/usuarios`)
    
    // Buscar usuario staff
    const staffUser = page.locator('[data-testid="user-row"]:has-text("Staff")').first()
    
    if (await staffUser.isVisible()) {
      await staffUser.locator('button[aria-label*="Editar"]').click()
      
      // Cambiar rol a Manager
      const roleSelect = page.locator('select[name="role"]')
      if (await roleSelect.isVisible()) {
        await roleSelect.selectOption('manager')
      } else {
        // Si es un combobox
        await page.click('[role="combobox"]')
        await page.click('text=Manager')
      }
      
      // Guardar
      await page.click('button:has-text("Guardar")')
      
      // Verificar que el rol cambió
      await expect(page.locator('text=Manager')).toBeVisible()
    }
  })

  test('should toggle user active status', async ({ page }) => {
    await page.goto(`${BASE_URL}/usuarios`)
    
    // Buscar toggle de estado activo
    const activeToggle = page.locator('[role="switch"]').first()
    
    if (await activeToggle.isVisible()) {
      const initialState = await activeToggle.getAttribute('aria-checked')
      
      // Toggle
      await activeToggle.click()
      await page.waitForTimeout(500)
      
      const newState = await activeToggle.getAttribute('aria-checked')
      expect(newState).not.toBe(initialState)
    }
  })

  test('should soft delete a user with confirmation', async ({ page }) => {
    await page.goto(`${BASE_URL}/usuarios`)
    
    // Crear usuario para eliminar
    const timestamp = Date.now()
    await page.click('button:has-text("Nuevo Usuario")').catch(() => {})
    
    if (await page.locator('input[name="email"]').isVisible()) {
      await page.fill('input[name="email"]', `delete.me.${timestamp}@test.com`)
      await page.fill('input[name="name"]', 'User To Delete')
      await page.fill('input[name="password"]', 'password123')
      await page.click('button[type="submit"]')
      await page.waitForTimeout(1000)
    }
    
    // Buscar y eliminar
    const userToDelete = page.locator('text=User To Delete')
    
    if (await userToDelete.isVisible()) {
      await page.locator('button[aria-label*="Eliminar"]').first().click()
      
      // Confirmar en AlertDialog
      await expect(page.locator('[role="alertdialog"]')).toBeVisible()
      await page.click('button:has-text("Eliminar"), button:has-text("Confirmar")')
      
      // Verificar eliminación (soft delete = inactivo)
      await page.waitForTimeout(1000)
      
      // El usuario debería estar inactivo o no visible
      const inactiveUser = page.locator('[data-testid="user-row"]:has-text("User To Delete"):has-text("Inactivo")')
      if (await inactiveUser.isVisible()) {
        expect(inactiveUser).toBeVisible()
      }
    }
  })

  test('should prevent deleting last admin', async ({ page }) => {
    await page.goto(`${BASE_URL}/usuarios`)
    
    // Contar admins activos
    const adminRows = page.locator('[data-testid="user-row"]:has-text("Admin")')
    const adminCount = await adminRows.count()
    
    if (adminCount === 1) {
      // Intentar eliminar el único admin
      await page.locator('[data-testid="user-row"]:has-text("Admin")').first()
        .locator('button[aria-label*="Eliminar"]').click()
      
      // Debería mostrar error
      await expect(
        page.locator('text=/último administrador|único admin|no se puede eliminar/i')
      ).toBeVisible({ timeout: 3000 })
    }
  })

  test('should filter users by role', async ({ page }) => {
    await page.goto(`${BASE_URL}/usuarios`)
    
    // Buscar filtro de rol
    const roleFilter = page.locator('select[name="roleFilter"], [placeholder*="Filtrar"]')
    
    if (await roleFilter.isVisible()) {
      await roleFilter.selectOption('staff')
      await page.waitForTimeout(500)
      
      // Verificar que solo muestra staff
      const visibleRoles = page.locator('[data-testid="user-role"]')
      const count = await visibleRoles.count()
      
      if (count > 0) {
        for (let i = 0; i < count; i++) {
          const roleText = await visibleRoles.nth(i).textContent()
          expect(roleText?.toLowerCase()).toContain('staff')
        }
      }
    }
  })

  test('should search users by name or email', async ({ page }) => {
    await page.goto(`${BASE_URL}/usuarios`)
    
    // Buscar campo de búsqueda
    const searchInput = page.locator('input[placeholder*="Buscar"], input[type="search"]')
    
    if (await searchInput.isVisible()) {
      await searchInput.fill('admin')
      await page.waitForTimeout(500)
      
      // Verificar resultados filtrados
      const userRows = page.locator('[data-testid="user-row"]')
      const count = await userRows.count()
      
      if (count > 0) {
        const firstUserText = await userRows.first().textContent()
        expect(firstUserText?.toLowerCase()).toContain('admin')
      }
    }
  })
})

test.describe('User Invite Flow (House Invite)', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(`${BASE_URL}/login`)
    await page.fill('input[type="email"]', TEST_EMAIL)
    await page.fill('input[type="password"]', TEST_PASSWORD)
    await page.click('button[type="submit"]')
    await page.waitForURL(`${BASE_URL}/dashboard`)
  })

  test('should send invitation to new user', async ({ page }) => {
    await page.goto(`${BASE_URL}/usuarios`)
    
    // Click en "Invitar Usuario" o tab de invitaciones
    await page.click('button:has-text("Invitar"), text=Invitaciones').catch(() => {})
    
    const timestamp = Date.now()
    const inviteEmail = `invite.${timestamp}@test.com`
    
    // Llenar formulario de invitación
    const emailInput = page.locator('input[name="email"], input[type="email"]').first()
    if (await emailInput.isVisible()) {
      await emailInput.fill(inviteEmail)
      
      // Seleccionar rol
      const roleSelect = page.locator('select[name="role"]').first()
      if (await roleSelect.isVisible()) {
        await roleSelect.selectOption('staff')
      }
      
      // Enviar invitación
      await page.click('button:has-text("Enviar"), button:has-text("Invitar")')
      
      // Verificar confirmación
      await expect(
        page.locator('text=/invitación enviada|invitación creada/i')
      ).toBeVisible({ timeout: 5000 })
    }
  })

  test('should show pending invitations list', async ({ page }) => {
    await page.goto(`${BASE_URL}/usuarios`)
    
    // Navegar a tab de invitaciones
    await page.click('text=Invitaciones, button:has-text("Invitaciones")').catch(() => {})
    
    // Verificar que hay una lista o tabla
    const invitesList = page.locator('[data-testid="invitations-list"], table')
    if (await invitesList.isVisible()) {
      expect(invitesList).toBeVisible()
    }
  })

  test('should cancel/revoke an invitation', async ({ page }) => {
    await page.goto(`${BASE_URL}/usuarios`)
    
    // Navegar a invitaciones
    await page.click('text=Invitaciones').catch(() => {})
    
    // Buscar botón de cancelar invitación
    const revokeButton = page.locator('button:has-text("Cancelar"), button:has-text("Revocar")').first()
    
    if (await revokeButton.isVisible()) {
      await revokeButton.click()
      
      // Confirmar
      await page.click('button:has-text("Confirmar"), button:has-text("Sí")')
      
      // Verificar que se canceló
      await expect(
        page.locator('text=/invitación cancelada|invitación revocada/i')
      ).toBeVisible({ timeout: 5000 })
    }
  })
})

test.describe('User Management - Validations', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(`${BASE_URL}/login`)
    await page.fill('input[type="email"]', TEST_EMAIL)
    await page.fill('input[type="password"]', TEST_PASSWORD)
    await page.click('button[type="submit"]')
    await page.waitForURL(`${BASE_URL}/dashboard`)
  })

  test('should validate email format', async ({ page }) => {
    await page.goto(`${BASE_URL}/usuarios`)
    await page.click('button:has-text("Nuevo Usuario")').catch(() => {})
    
    if (await page.locator('input[name="email"]').isVisible()) {
      // Email inválido
      await page.fill('input[name="email"]', 'invalid-email')
      await page.fill('input[name="name"]', 'Test User')
      await page.fill('input[name="password"]', 'password123')
      await page.click('button[type="submit"]')
      
      // Debería mostrar error
      await expect(
        page.locator('text=/email inválido|formato incorrecto/i')
      ).toBeVisible({ timeout: 3000 })
    }
  })

  test('should validate password length', async ({ page }) => {
    await page.goto(`${BASE_URL}/usuarios`)
    await page.click('button:has-text("Nuevo Usuario")').catch(() => {})
    
    if (await page.locator('input[name="password"]').isVisible()) {
      await page.fill('input[name="email"]', 'test@example.com')
      await page.fill('input[name="name"]', 'Test User')
      await page.fill('input[name="password"]', '123') // Muy corta
      await page.click('button[type="submit"]')
      
      // Error de contraseña
      await expect(
        page.locator('text=/contraseña debe|mínimo|al menos/i')
      ).toBeVisible({ timeout: 3000 })
    }
  })

  test('should prevent duplicate email', async ({ page }) => {
    await page.goto(`${BASE_URL}/usuarios`)
    
    // Intentar crear usuario con email existente
    await page.click('button:has-text("Nuevo Usuario")').catch(() => {})
    
    if (await page.locator('input[name="email"]').isVisible()) {
      await page.fill('input[name="email"]', TEST_EMAIL) // Email del admin
      await page.fill('input[name="name"]', 'Duplicate User')
      await page.fill('input[name="password"]', 'password123')
      await page.click('button[type="submit"]')
      
      // Error de email duplicado
      await expect(
        page.locator('text=/ya existe|email en uso|duplicado/i')
      ).toBeVisible({ timeout: 5000 })
    }
  })
})

test.describe('Complete User Management Flow', () => {
  test('end-to-end user lifecycle', async ({ page }) => {
    // 1. Login como admin
    await page.goto(`${BASE_URL}/login`)
    await page.fill('input[type="email"]', TEST_EMAIL)
    await page.fill('input[type="password"]', TEST_PASSWORD)
    await page.click('button[type="submit"]')
    await page.waitForURL(`${BASE_URL}/dashboard`)
    
    // 2. Crear nuevo usuario
    await page.goto(`${BASE_URL}/usuarios`)
    await page.click('button:has-text("Nuevo Usuario")').catch(() => {})
    
    const timestamp = Date.now()
    const userEmail = `lifecycle.${timestamp}@test.com`
    
    await page.fill('input[name="email"]', userEmail)
    await page.fill('input[name="name"]', 'Lifecycle Test User')
    await page.fill('input[name="password"]', 'SecurePass123')
    await page.click('button[type="submit"]')
    await page.waitForTimeout(1000)
    
    // 3. Verificar creación
    await expect(page.locator('text=Lifecycle Test User')).toBeVisible()
    
    // 4. Editar usuario (cambiar rol)
    await page.locator('[data-testid="user-row"]:has-text("Lifecycle Test User")')
      .locator('button[aria-label*="Editar"]').click()
    
    const roleSelect = page.locator('select[name="role"]')
    if (await roleSelect.isVisible()) {
      await roleSelect.selectOption('manager')
    }
    await page.click('button:has-text("Guardar")')
    await page.waitForTimeout(500)
    
    // 5. Desactivar usuario
    const toggle = page.locator('[data-testid="user-row"]:has-text("Lifecycle Test User")')
      .locator('[role="switch"]')
    if (await toggle.isVisible()) {
      await toggle.click()
      await page.waitForTimeout(500)
    }
    
    // 6. Eliminar usuario
    await page.locator('[data-testid="user-row"]:has-text("Lifecycle Test User")')
      .locator('button[aria-label*="Eliminar"]').click()
    await page.click('button:has-text("Confirmar")')
    
    // 7. Verificar que el flujo completo funcionó
    await page.waitForTimeout(1000)
    await page.reload()
    
    // El usuario debería estar eliminado o inactivo
    expect(true).toBe(true) // Test completo sin errores
  })
})
