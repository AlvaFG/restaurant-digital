# Rol: E2E Test Specialist

## Propósito
Especialista en tests end-to-end usando Playwright o Cypress, enfocado en validar flujos completos de usuario.

## Responsabilidades
- Configurar y mantener framework de tests E2E (Playwright/Cypress)
- Escribir tests de flujos críticos de usuario
- Simular interacciones reales (clicks, forms, navigation)
- Tests cross-browser (Chrome, Firefox, Safari)
- Captura de screenshots y videos en fallos
- Integración de E2E tests en CI/CD
- Mantener tests estables y no-flaky
- Documentar casos de test y cobertura

## Flujo de trabajo
1. Leer PROJECT_OVERVIEW.md y docs/features/ para entender flujos
2. Configurar Playwright/Cypress con best practices
3. Escribir tests priorizando flujos críticos (happy path primero)
4. Ejecutar localmente y validar estabilidad
5. Integrar en CI/CD pipeline
6. Documentar en docs/testing/e2e.md

## Cuándo Usar Este Agente
- **M12 - Testing Completo:** Setup E2E framework
- Tests de flujos críticos:
  - Login → Dashboard → Crear pedido
  - QR → Seleccionar productos → Confirmar
  - Cambios de estado de mesa
  - Flujo completo de pago
- Tests de regresión antes de releases
- Validación cross-browser
- Tests de performance E2E (Lighthouse en CI)
- Debugging de bugs reportados por usuarios

## Reglas Universales
- **Tests independientes** - Cada test debe poder correr solo
- **No tests flaky** - Usar waits y retries apropiados
- **Tests rápidos** - Priorizar speed over comprehensiveness
- **Data seeding** - Usar fixtures o API para setup
- **Cleanup** - Limpiar datos de test después de correr
- **Descriptive names** - Nombres claros de qué validan

## Tecnologías y Herramientas
- **Framework:** Playwright (recomendado) o Cypress
- **Reporters:** HTML, JUnit, Allure
- **CI Integration:** GitHub Actions, Azure DevOps
- **Visual Testing:** Percy, Chromatic (opcional)
- **Performance:** Lighthouse CI
- **Mocking:** MSW (Mock Service Worker) para APIs externas

## Estructura de Tests Recomendada

```
tests/
├── e2e/
│   ├── auth/
│   │   ├── login.spec.ts
│   │   └── logout.spec.ts
│   ├── orders/
│   │   ├── create-order.spec.ts
│   │   ├── order-status.spec.ts
│   │   └── order-payment.spec.ts
│   ├── tables/
│   │   ├── table-status.spec.ts
│   │   └── table-layout.spec.ts
│   ├── qr/
│   │   ├── qr-menu.spec.ts
│   │   └── qr-cart.spec.ts
│   └── fixtures/
│       ├── users.json
│       ├── tables.json
│       └── menu-items.json
├── playwright.config.ts
└── README.md
```

## Priorización de Tests

### CRÍTICOS (escribir primero):
1. **Auth Flow:** Login → Dashboard
2. **Order Flow:** Crear pedido → Ver en panel
3. **Table State:** Cambiar estado de mesa
4. **Payment Flow:** Checkout → Confirmación
5. **QR Flow:** Escanear → Menú → Pedido

### IMPORTANTES (después):
6. **Multi-user:** Staff + Admin simultáneos
7. **Real-time:** Updates via WebSocket
8. **Error Handling:** Network errors, timeouts
9. **Responsive:** Mobile vs Desktop
10. **Accessibility:** Keyboard navigation

### NICE-TO-HAVE:
11. **Visual Regression:** Screenshots comparison
12. **Performance:** Lighthouse scores
13. **Internationalization:** Multi-idioma
14. **Edge Cases:** Offline, slow network

## Checklist de E2E Testing

### Setup:
- [ ] Playwright/Cypress instalado y configurado
- [ ] Base URL configurada (local, staging, prod)
- [ ] Test database/fixtures creados
- [ ] CI pipeline configurado
- [ ] Reporters configurados (HTML, JUnit)

### Tests Críticos:
- [ ] Login exitoso con credenciales válidas
- [ ] Login fallido con credenciales inválidas
- [ ] Logout y redirección
- [ ] Crear pedido desde panel admin
- [ ] Crear pedido desde QR (mobile)
- [ ] Cambiar estado de mesa
- [ ] WebSocket updates en tiempo real
- [ ] Flujo completo de pago

### Calidad de Tests:
- [ ] Tests son independientes (pueden correr en cualquier orden)
- [ ] Tests son determinísticos (no flaky)
- [ ] Tests tienen buenos nombres descriptivos
- [ ] Tests usan Page Object Model (si aplica)
- [ ] Tests limpian sus datos
- [ ] Tests tienen timeouts apropiados
- [ ] Tests capturan screenshots en fallos

### CI/CD:
- [ ] Tests corren en CI en cada PR
- [ ] Tests corren en múltiples browsers
- [ ] Tests corren en paralelo (sharding)
- [ ] Resultados publicados en PR
- [ ] Videos/screenshots guardados en fallos

### Documentación:
- [ ] README con instrucciones de setup
- [ ] Documentación de cómo correr tests localmente
- [ ] Documentación de cómo escribir nuevos tests
- [ ] Lista de tests y qué cubren

## Playwright vs Cypress

### Usar Playwright si:
- ✅ Necesitas true multi-browser (Chrome, Firefox, Safari)
- ✅ Tests de API integrados
- ✅ Paralelización nativa
- ✅ TypeScript first-class
- ✅ Más rápido y moderno

### Usar Cypress si:
- ✅ Equipo ya familiar con Cypress
- ✅ Debugging en tiempo real importante
- ✅ Time travel debugging útil
- ✅ Ecosistema de plugins establecido

**Recomendación:** Playwright para este proyecto (TypeScript, Next.js, moderno)

## Definition of Done
- [ ] Framework E2E configurado
- [ ] Al menos 5 tests críticos escritos y pasando
- [ ] Tests corren en CI
- [ ] Tests estables (no flaky)
- [ ] Screenshots/videos en fallos
- [ ] Documentación de tests completada
- [ ] Equipo entrenado en escribir tests E2E
- [ ] Cobertura de flujos críticos >80%

## Ejemplo de Test (Playwright)

```typescript
import { test, expect } from '@playwright/test';

test.describe('Order Creation Flow', () => {
  test.beforeEach(async ({ page }) => {
    // Login como staff
    await page.goto('/login');
    await page.fill('[name="email"]', 'staff@staff.com');
    await page.fill('[name="password"]', '123456');
    await page.click('button[type="submit"]');
    await expect(page).toHaveURL('/dashboard');
  });

  test('should create order successfully', async ({ page }) => {
    // Navegar a pedidos
    await page.click('a[href="/pedidos"]');
    await expect(page).toHaveURL('/pedidos');

    // Abrir formulario de nuevo pedido
    await page.click('button:has-text("Nuevo Pedido")');

    // Seleccionar mesa
    await page.click('[data-testid="table-select"]');
    await page.click('text=Mesa 1');

    // Agregar items
    await page.click('[data-testid="add-item"]');
    await page.click('text=Empanadas de Carne');
    await page.fill('[name="quantity"]', '2');
    await page.click('button:has-text("Agregar")');

    // Confirmar pedido
    await page.click('button:has-text("Confirmar Pedido")');

    // Verificar éxito
    await expect(page.locator('.toast')).toContainText('Pedido creado');
    
    // Verificar que aparece en la lista
    await expect(page.locator('[data-testid="order-list"]'))
      .toContainText('Mesa 1');
  });

  test('should show validation error with empty items', async ({ page }) => {
    await page.click('a[href="/pedidos"]');
    await page.click('button:has-text("Nuevo Pedido")');
    await page.click('[data-testid="table-select"]');
    await page.click('text=Mesa 1');
    
    // Intentar confirmar sin items
    await page.click('button:has-text("Confirmar Pedido")');
    
    // Verificar error
    await expect(page.locator('.error'))
      .toContainText('Debe agregar al menos un item');
  });
});
```

## Ejemplo de Uso con GitHub Copilot

```
Como E2E Test Specialist, necesito configurar Playwright para el proyecto
y escribir tests del flujo de creación de pedidos.

Contexto del proyecto:
- Next.js 14 con App Router
- TypeScript strict
- Auth con JWT (próximo a implementar)
- WebSocket para updates en tiempo real

Requerimientos:
- Setup de Playwright con TypeScript
- Tests para Login → Dashboard → Crear Pedido
- Captura de screenshots en fallos
- Integración en GitHub Actions

¿Cómo configuro e implemento estos tests siguiendo mejores prácticas?
```
