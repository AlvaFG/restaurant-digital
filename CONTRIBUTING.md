# Contributing to Restaurant Management System

¡Gracias por tu interés en contribuir! Este documento proporciona las guías y convenciones para contribuir al proyecto.

## 📋 Tabla de Contenidos

- [Código de Conducta](#código-de-conducta)
- [Cómo Contribuir](#cómo-contribuir)
- [Branching Strategy](#branching-strategy)
- [Commit Conventions](#commit-conventions)
- [Pull Request Process](#pull-request-process)
- [Coding Standards](#coding-standards)
- [Testing Guidelines](#testing-guidelines)
- [Documentation](#documentation)

---

## 📜 Código de Conducta

Este proyecto se rige por un código de conducta implícito de respeto mutuo, colaboración constructiva y profesionalismo. Esperamos que todos los contribuidores:

- Sean respetuosos y considerados
- Acepten críticas constructivas
- Se enfoquen en lo mejor para el proyecto
- Muestren empatía hacia otros contribuidores

---

## 🤝 Cómo Contribuir

### Reportar Bugs

1. Verifica que el bug no haya sido reportado antes en [Issues](https://github.com/AlvaFG/restaurant-digital/issues)
2. Crea un nuevo issue usando el template de bug report
3. Incluye:
   - Descripción clara del problema
   - Pasos para reproducir
   - Comportamiento esperado vs actual
   - Screenshots si aplica
   - Información del entorno (OS, browser, Node version)

### Sugerir Features

1. Verifica que la feature no haya sido sugerida antes
2. Crea un issue con el template de feature request
3. Describe:
   - El problema que resuelve
   - La solución propuesta
   - Alternativas consideradas
   - Mockups o diagramas si aplica

### Contribuir Código

1. **Fork** el repositorio
2. **Clone** tu fork: `git clone https://github.com/YOUR_USERNAME/restaurant-digital.git`
3. **Crea un branch** desde `main`: `git checkout -b feature/your-feature-name`
4. **Implementa** tus cambios siguiendo las [Coding Standards](#coding-standards)
5. **Escribe tests** para tus cambios
6. **Verifica** que todo pase: `npm run lint && npm run test && npm run build`
7. **Commit** tus cambios siguiendo [Commit Conventions](#commit-conventions)
8. **Push** a tu fork: `git push origin feature/your-feature-name`
9. **Abre un Pull Request** siguiendo el [PR Process](#pull-request-process)

---

## 🌿 Branching Strategy

### Branch Types

- **`main`**: Production branch - siempre deployable
- **`feature/*`**: Feature branches - nuevas funcionalidades
  - Ejemplo: `feature/payment-integration`, `feature/qr-ordering`
- **`fix/*`**: Bug fix branches
  - Ejemplo: `fix/payment-webhook-validation`, `fix/table-state-transition`
- **`hotfix/*`**: Emergency fixes para producción
  - Ejemplo: `hotfix/security-patch`, `hotfix/critical-bug`
- **`refactor/*`**: Refactoring branches
  - Ejemplo: `refactor/payment-store`, `refactor/components-structure`
- **`docs/*`**: Documentation-only changes
  - Ejemplo: `docs/api-reference`, `docs/setup-guide`

### Branch Naming

- Usa **lowercase** y **kebab-case**
- Incluye el **tipo** de branch (feature/fix/etc)
- Usa nombres **descriptivos** pero **concisos**
- Evita nombres genéricos como `fix/bug` o `feature/update`

**Buenos ejemplos:**
```
feature/mercadopago-integration
fix/order-validation-bug
refactor/payment-store-architecture
docs/payment-api-reference
```

**Malos ejemplos:**
```
new-feature
fix
update-code
branch-1
```

---

## 📝 Commit Conventions

Seguimos [Conventional Commits](https://www.conventionalcommits.org/) para mantener un historial limpio y generar CHANGELOGs automáticamente.

### Formato

```
<type>(<scope>): <subject>

[optional body]

[optional footer]
```

### Types

- **`feat`**: Nueva funcionalidad
- **`fix`**: Bug fix
- **`docs`**: Cambios en documentación
- **`style`**: Cambios de formato (no afectan lógica)
- **`refactor`**: Refactoring de código (sin cambios funcionales)
- **`test`**: Agregar o modificar tests
- **`chore`**: Mantenimiento (deps, config, scripts)
- **`perf`**: Mejoras de performance
- **`ci`**: Cambios en CI/CD

### Scopes

Indica el módulo o feature afectado:

- `payments`, `orders`, `tables`, `menu`, `auth`, `analytics`
- `api`, `ui`, `components`, `hooks`, `lib`, `store`
- `docs`, `tests`, `build`, `ci`

### Subject

- Usa **imperativo** presente: "add" no "added" ni "adds"
- **Lowercase** (minúsculas)
- **No punto final**
- Máximo **50 caracteres**
- Describe **qué** cambia, no **por qué** (eso va en el body)

### Examples

```bash
# Features
feat(payments): add mercadopago checkout integration
feat(orders): implement real-time order updates
feat(menu): add allergen filtering

# Fixes
fix(payments): validate webhook signature correctly
fix(tables): resolve state transition bug
fix(api): handle missing orderId in POST /api/order

# Documentation
docs(api): update payments endpoint documentation
docs(setup): add environment variables guide
docs(architecture): create payment flow diagram

# Refactoring
refactor(payment-store): extract file I/O to separate module
refactor(components): unify button component variants

# Tests
test(payments): add webhook validation tests
test(orders): increase coverage to 80%

# Chores
chore(deps): update next to 14.2.32
chore(lint): fix unused variable warnings
```

### Body y Footer (opcional)

**Body**:
- Explica **por qué** se hizo el cambio
- Describe el **contexto** o **problema** que resuelve
- Usa bullet points si hay múltiples cambios

**Footer**:
- Referencias a issues: `Closes #123`, `Fixes #456`
- Breaking changes: `BREAKING CHANGE: description`

**Ejemplo completo**:
```
feat(payments): add mercadopago webhook validation

- Implement HMAC signature verification
- Add error logging for invalid webhooks
- Update payment status on valid notifications

This ensures that only legitimate MercadoPago webhooks
are processed, preventing potential security issues.

Closes #45
```

---

## 🔀 Pull Request Process

### Before Creating PR

**Checklist obligatorio**:

- [ ] El código compila sin errores: `npm run build`
- [ ] Todos los tests pasan: `npm run test`
- [ ] No hay errores de lint: `npm run lint`
- [ ] No hay errores de TypeScript: `npx tsc --noEmit`
- [ ] Los cambios están documentados (si aplica)
- [ ] Se agregaron tests para nuevas funcionalidades
- [ ] No hay `console.log` en código de producción
- [ ] Las variables de entorno están documentadas en `.env.example`

### PR Template

```markdown
## Descripción

[Descripción clara de qué cambia este PR]

## Tipo de cambio

- [ ] Bug fix
- [ ] Nueva feature
- [ ] Breaking change
- [ ] Documentación

## ¿Cómo se probó?

[Describe los tests realizados - automáticos y manuales]

## Checklist

- [ ] Mi código sigue las guías de estilo del proyecto
- [ ] He realizado self-review de mi código
- [ ] He comentado código complejo o no obvio
- [ ] He actualizado la documentación relevante
- [ ] Mis cambios no generan nuevos warnings
- [ ] He agregado tests que prueban mi fix/feature
- [ ] Los tests nuevos y existentes pasan localmente
- [ ] He actualizado `.env.example` si agregué vars

## Screenshots (si aplica)

[Screenshots de cambios visuales]

## Issues relacionados

Closes #[issue number]
```

### Proceso de Review

1. Al menos **1 approval** requerido antes de merge
2. Todos los **CI checks** deben pasar
3. **Resolver todos los comments** antes de merge
4. Usar **Squash and Merge** para mantener historial limpio
5. Borrar branch después de merge

---

## 💻 Coding Standards

### TypeScript

- **Strict mode** habilitado - no `any` types
- Usar **interfaces** para shapes complejos
- Usar **type guards** para validaciones
- Documentar tipos complejos con JSDoc

```typescript
// ✅ BIEN
interface PaymentData {
  orderId: string;
  amount: number;
  currency: string;
}

function processPayment(data: PaymentData): Promise<Payment> {
  // ...
}

// ❌ MAL
function processPayment(data: any) {
  // ...
}
```

### React / Next.js

- Usar **Server Components** por defecto (Next.js 14)
- Agregar `'use client'` solo cuando sea necesario
- Preferir **function components** sobre class components
- Usar **hooks** apropiadamente (dependencias correctas)
- Extraer lógica compleja a **custom hooks**

```typescript
// ✅ BIEN
'use client'

export function OrderForm() {
  const [loading, setLoading] = useState(false)
  
  const handleSubmit = useCallback(async () => {
    // ...
  }, [/* dependencies */])
  
  return <form onSubmit={handleSubmit}>...</form>
}
```

### Naming Conventions

- **Components**: `PascalCase` - `OrderForm`, `PaymentModal`
- **Hooks**: `camelCase` con prefijo `use` - `usePayment`, `useSocket`
- **Utilities**: `camelCase` - `formatCurrency`, `validateEmail`
- **Constants**: `UPPER_SNAKE_CASE` - `PAYMENT_STATUS`, `API_BASE_URL`
- **Files/Folders**: `kebab-case` - `order-form.tsx`, `payment-service.ts`
- **Types/Interfaces**: `PascalCase` - `Payment`, `OrderStatus`

### Imports

- Orden: node, third-party, local
- Usar alias `@/` para imports locales
- Agrupar imports por tipo

```typescript
// ✅ BIEN
import { useCallback, useState } from 'react'
import { useRouter } from 'next/navigation'

import { Button } from '@/components/ui/button'
import { usePayment } from '@/hooks/use-payment'
import { formatCurrency } from '@/lib/utils'
```

### Styling

- Preferir **Tailwind utility classes** inline
- Extraer patterns repetidos a **components**
- Usar **CSS variables** para tematización
- Seguir convenciones de **shadcn/ui**

```tsx
// ✅ BIEN
<button className="px-4 py-2 bg-primary text-primary-foreground rounded-md">
  Click me
</button>

// Patterns repetidos → extraer a component
<Button>Click me</Button>
```

### Error Handling

- Siempre **try-catch** en async functions
- Usar **custom error classes** con codes
- Loguear errores apropiadamente (no PII)
- Mostrar mensajes **user-friendly** en UI

```typescript
// ✅ BIEN
try {
  const payment = await createPayment(data)
  return payment
} catch (error) {
  if (error instanceof ValidationError) {
    logger.warn('Validation failed', { error: error.message })
    throw new AppError('Invalid payment data', { cause: error })
  }
  logger.error('Payment creation failed', { error })
  throw new AppError('Failed to create payment')
}
```

---

## 🧪 Testing Guidelines

### Coverage Goals

- **Critical paths**: 80%+ coverage (payment flows, orders)
- **Business logic**: 70%+ coverage (stores, services)
- **UI Components**: 50%+ coverage (complex components)
- **Utilities**: 90%+ coverage (pure functions)

### Test Structure

```typescript
describe('PaymentStore', () => {
  describe('create', () => {
    it('should create payment with valid data', async () => {
      // Arrange
      const data = { orderId: '123', amount: 1000 }
      
      // Act
      const payment = await paymentStore.create(data)
      
      // Assert
      expect(payment.id).toBeDefined()
      expect(payment.status).toBe('pending')
    })
  })
})
```

### Qué Testear

**Unit Tests**:
- Business logic en stores y services
- Utilidades y helpers
- Custom hooks (con `@testing-library/react-hooks`)

**Integration Tests**:
- API routes (request → response)
- Component + hooks interactions
- WebSocket event flows

**Component Tests**:
- Rendering correcto
- User interactions (clicks, inputs)
- Estado local
- Props validation

### Qué NO Testear

- Implementaciones de third-party libraries
- Código trivial (getters/setters simples)
- Tipos de TypeScript (el compilador los valida)

---

## 📚 Documentation

### Cuándo Documentar

- **Siempre**: APIs públicas, componentes reutilizables
- **Cuando sea complejo**: Algoritmos no obvios, lógica de negocio
- **Nuevas features**: Documentar en `docs/features/`
- **Breaking changes**: Actualizar `CHANGELOG.md` y migration guides

### Dónde Documentar

- **README.md**: Overview, quick start, basic usage
- **CHANGELOG.md**: Historial de cambios
- **docs/api/**: Documentación de API endpoints
- **docs/features/**: Features y cómo usarlos
- **docs/architecture/**: Diseño y decisiones técnicas
- **Code comments**: Explicar "por qué", no "qué"

### JSDoc

Usar JSDoc para funciones complejas:

```typescript
/**
 * Creates a payment and initiates checkout with payment provider.
 * 
 * @param params - Payment creation parameters
 * @param params.orderId - The order ID to associate with payment
 * @param params.amount - Amount in cents (e.g., 1000 = $10.00)
 * @returns Promise resolving to created payment with checkout URL
 * @throws {PaymentError} If payment creation fails
 * 
 * @example
 * ```ts
 * const payment = await createPayment({
 *   orderId: 'order-123',
 *   amount: 5000,
 *   currency: 'ARS'
 * })
 * ```
 */
export async function createPayment(params: CreatePaymentParams): Promise<Payment> {
  // ...
}
```

---

## 🚀 Release Process

1. Actualizar `CHANGELOG.md` con cambios del release
2. Bump version en `package.json` (semver)
3. Create release branch: `release/v0.5.0`
4. Tag release: `git tag -a v0.5.0 -m "Release v0.5.0"`
5. Merge a `main`
6. Deploy a producción
7. Create GitHub Release con notas del CHANGELOG

---

## ❓ Preguntas

Si tienes preguntas o necesitas ayuda:

1. Revisa la [documentación existente](docs/)
2. Busca en [issues cerrados](https://github.com/AlvaFG/restaurant-digital/issues?q=is%3Aissue+is%3Aclosed)
3. Abre un [nuevo issue](https://github.com/AlvaFG/restaurant-digital/issues/new) con label `question`

---

## 📞 Contacto

- **Maintainer**: Álvaro - [@AlvaFG](https://github.com/AlvaFG)
- **Repository**: [restaurant-digital](https://github.com/AlvaFG/restaurant-digital)

---

**¡Gracias por contribuir!** 🎉
