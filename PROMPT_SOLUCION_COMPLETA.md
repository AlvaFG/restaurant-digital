# 🔧 Prompt Completo: Solución de Todos los Problemas de Tests

**Proyecto:** Restaurant Management System  
**Branch:** feature/test-api-orders  
**Fecha:** 9 de octubre de 2025  
**Estado Actual:** 50/60 tests passing (83%)  
**Objetivo:** Resolver todos los problemas y llegar a 58-60/60 tests (97-100%)

---

## 📋 Contexto del Proyecto

### **Stack Tecnológico:**
- Next.js 14 con App Router
- React 18.3.1
- TypeScript (strict mode)
- Vitest 3.2.4 para testing
- shadcn/ui components
- Tailwind CSS

### **Estado Actual de Tests:**
```
✅ 50 tests passing (83%)
❌ 10 tests failing (17%)
✅ 9/12 test suites passed
⏱️ 8.5 segundos
```

### **APIs Críticas:**
✅ orders-api.test.ts → 100% passing  
✅ menu-api.test.ts → 100% passing  
✅ tables-api.test.ts → 100% passing  
✅ order-service.test.ts → 100% passing  

---

## 🎯 Problemas a Resolver

### **Problema #1: order-form.tsx - Select Import Faltante** 🔴 CRÍTICO

**Severidad:** Alta  
**Tiempo estimado:** 5 minutos  
**Tests afectados:** 3  
**Impacto:** Componente completamente roto  

#### **Descripción:**
El componente `components/order-form.tsx` usa componentes de Select (línea 201) pero no los importa, causando `ReferenceError: Select is not defined` en runtime y tests.

#### **Ubicación del Error:**
- **Archivo:** `components/order-form.tsx`
- **Línea:** 201
- **Código problemático:**
```tsx
<Select disabled={isSubmitting} value={selectedTableId} onValueChange={setSelectedTableId}>
  <SelectTrigger>
    <SelectValue placeholder="Selecciona una mesa" />
  </SelectTrigger>
  <SelectContent>
    <SelectItem>...</SelectItem>
  </SelectContent>
</Select>
```

#### **Imports Actuales (líneas 1-33):**
```tsx
"use client"

import { useCallback, useEffect, useMemo, useState, useId } from "react"
import { useOrdersPanelContext } from "@/app/pedidos/_providers/orders-panel-provider"
import { MOCK_MENU_CATEGORIES, MOCK_MENU_ITEMS, type MenuItem, type Table } from "@/lib/mock-data"
import { createOrder, OrderServiceError } from "@/lib/order-service"
import type { CreateOrderPayload } from "@/lib/server/order-types"
import { TABLE_STATE, TABLE_STATE_LABELS } from "@/lib/table-states"
import { fetchTables } from "@/lib/table-service"
import { cn } from "@/lib/utils"
import { LoadingSpinner } from "@/components/loading-spinner"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ScrollArea } from "@/components/ui/scroll-area"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command"
import { Label } from "@/components/ui/label"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Separator } from "@/components/ui/separator"
import { useToast } from "@/hooks/use-toast"
import { Check, ChevronDown, Minus, Plus, ShoppingCart, X } from "lucide-react"
```

#### **Solución Requerida:**
Agregar el import de Select después de la línea de ScrollArea (línea 15):

```tsx
import { ScrollArea } from "@/components/ui/scroll-area"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  DropdownMenu,
```

#### **Tests que se desbloquearán:**
1. `muestra toast de exito, resetea formulario y respeta spinner`
2. `muestra toast destructivo en errores 4xx y conserva datos`
3. `refresca el panel cuando los sockets estan deshabilitados`

#### **Validación:**
Después del fix, ejecutar:
```bash
npm test app/pedidos/__tests__/order-form.test.tsx
```

**Resultado esperado:** 3 tests más pasan → 53/60 (88%)

---

### **Problema #2: menu-page.test.tsx - Tests vs Implementación** 🟠 MEDIO

**Severidad:** Media  
**Tiempo estimado:** 1-2 horas  
**Tests afectados:** 5  
**Impacto:** Tests no validan funcionalidad real  

#### **Descripción:**
Los tests esperan que la página de menú muestre un catálogo completo con items (Empanada criolla, Limonada fresca, etc.), pero la implementación actual renderiza un placeholder de "Solo disponible para administradores".

#### **Tests Fallidos:**
1. `renderiza el catálogo de menú`
2. `permite filtrar por categoría`
3. `muestra el estado de error y reintenta la carga`
4. `gestiona cantidades en el carrito`
5. `deshabilita la acción para platos no disponibles`

#### **Output Real vs Esperado:**

**Real:**
```html
<div class="text-center">
  <p class="text-lg font-medium text-muted-foreground">Gestión de Menú</p>
  <p class="text-sm text-muted-foreground">Solo disponible para administradores</p>
</div>
```

**Esperado:**
```html
<!-- Debería mostrar items del menú -->
<p>Empanada criolla</p>
<button>Agregar al pedido</button>
<p>Limonada fresca</p>
```

#### **Archivo de Tests:**
`app/menu/__tests__/menu-page.test.tsx`

#### **Archivo de Implementación:**
`app/menu/page.tsx`

#### **Diagnóstico Necesario:**

**Opción A - Bug en Página:** Si el placeholder NO debería mostrarse en tests
1. Verificar `app/menu/page.tsx`
2. Revisar si hay condición de autenticación/permisos
3. Mockear autenticación en tests
4. O remover restricción de admin

**Opción B - Tests Obsoletos:** Si el placeholder ES el comportamiento correcto
1. Actualizar tests para validar placeholder
2. O eliminar tests obsoletos
3. Documentar cambio de diseño

#### **Pasos de Investigación:**

1. **Revisar app/menu/page.tsx:**
```bash
# Buscar condiciones que muestran placeholder
grep -n "Solo disponible para administradores" app/menu/page.tsx
```

2. **Verificar si hay AuthContext o permisos:**
```bash
grep -n "AuthContext\|useAuth\|admin\|permission" app/menu/page.tsx
```

3. **Revisar cómo se supone que funcione:**
```bash
# Ver el mock de datos
cat lib/mock-data.ts | grep -A 10 "MOCK_MENU"
```

#### **Soluciones Posibles:**

**Si es bug de autenticación:**
```tsx
// En app/menu/__tests__/menu-page.test.tsx
// Agregar mock de AuthContext antes de render

vi.mock("@/contexts/auth-context", () => ({
  useAuth: () => ({
    user: { id: "1", role: "admin" },
    isAuthenticated: true,
  }),
}))
```

**Si es cambio intencional de diseño:**
```tsx
// Actualizar test para validar nuevo comportamiento
it("muestra placeholder para usuarios no admin", async () => {
  await renderMenuPage()
  expect(screen.getByText("Solo disponible para administradores")).toBeInTheDocument()
})
```

#### **Validación:**
```bash
npm test app/menu/__tests__/menu-page.test.tsx
```

**Resultado esperado:** 5 tests más pasan → 55/60 (92%)

---

### **Problema #3: socket-client.test.ts - Mock Behavior** 🟡 BAJO

**Severidad:** Baja  
**Tiempo estimado:** 30 minutos  
**Tests afectados:** 2  
**Impacto:** No afecta funcionalidad en producción  

#### **Descripción:**
El MockSocketClient no simula la conexión instantánea que el test espera. Los tests asumen que `isConnected` es `true` inmediatamente después de `connect()`, pero el mock devuelve `false`.

#### **Tests Fallidos:**
1. `connects immediately with the mock implementation`
2. `dispatches emitted events to listeners`

#### **Archivo:**
`lib/__tests__/socket-client.test.ts`

#### **Código del Test:**
```typescript
it("connects immediately with the mock implementation", () => {
  socketClient.connect()
  
  expect(socketClient.isConnected).toBe(true)  // ❌ Espera true, obtiene false
  const state = socketClient.getState()
  expect(state.isReady).toBe(true)
})
```

#### **Problema:**
El MockSocketClient en `lib/socket.ts` no marca `isConnected = true` inmediatamente en `connect()`.

#### **Ubicación del Mock:**
`lib/socket.ts` - Clase `MockSocketClient`

#### **Solución:**

**Opción A - Actualizar Mock (Recomendado):**
```typescript
// En lib/socket.ts, clase MockSocketClient
connect() {
  if (this.connectionState.isConnected) {
    return
  }
  
  this.connectionState.isConnected = true  // ✅ Agregar esta línea
  this.connectionState.isReady = true
  
  // Emitir socket.ready inmediatamente
  const readyPayload = buildMockReadyPayload()
  const envelope = {
    event: "socket.ready" as const,
    payload: readyPayload,
    ts: nowIso(),
  }
  
  // Simular dispatch inmediato
  this.pendingListeners.forEach((callback) => {
    if (callback.event === "socket.ready") {
      callback.handler(envelope)
    }
  })
}
```

**Opción B - Actualizar Tests:**
```typescript
it("connects with the mock implementation", async () => {
  socketClient.connect()
  
  // Esperar un tick para que el mock se establezca
  await new Promise(resolve => setTimeout(resolve, 0))
  
  expect(socketClient.isConnected).toBe(true)
  const state = socketClient.getState()
  expect(state.isReady).toBe(true)
})
```

#### **Validación:**
```bash
npm test lib/__tests__/socket-client.test.ts
```

**Resultado esperado:** 2 tests más pasan → 60/60 (100%) ✅

---

## 🚀 Plan de Ejecución Completo

### **Fase 1: Fix Crítico (5 minutos)** 🔴

```bash
# 1. Arreglar import de Select en order-form.tsx
# Agregar línea en components/order-form.tsx después de línea 15:
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

# 2. Ejecutar tests
npm test app/pedidos/__tests__/order-form.test.tsx

# 3. Verificar resultado
# Esperado: 3 tests pasan (antes fallaban)
```

**Checkpoint:** 53/60 tests (88%)

---

### **Fase 2: Investigación y Fix de Menu Page (1-2 horas)** 🟠

```bash
# 1. Revisar implementación actual
code app/menu/page.tsx

# 2. Identificar causa del placeholder
#    - ¿Hay check de autenticación?
#    - ¿Hay check de permisos?
#    - ¿Es feature incompleta?

# 3. Decidir estrategia:
#    A) Mockear autenticación en tests
#    B) Actualizar tests para validar placeholder
#    C) Completar implementación de página

# 4. Aplicar fix elegido

# 5. Ejecutar tests
npm test app/menu/__tests__/menu-page.test.tsx

# 6. Verificar resultado
# Esperado: 5 tests pasan o se actualizan correctamente
```

**Checkpoint:** 58/60 tests (97%)

---

### **Fase 3: Fix de Socket Mock (30 minutos)** 🟡 OPCIONAL

```bash
# 1. Revisar MockSocketClient en lib/socket.ts
code lib/socket.ts

# 2. Actualizar método connect() para marcar isConnected = true

# 3. O actualizar tests para esperar async

# 4. Ejecutar tests
npm test lib/__tests__/socket-client.test.ts

# 5. Verificar resultado
# Esperado: 2 tests pasan
```

**Checkpoint:** 60/60 tests (100%) ✅

---

## 📝 Script Completo de Ejecución

```bash
# ===================================
# FASE 1: FIX CRÍTICO (5 MIN)
# ===================================

# 1. Abrir archivo
code components/order-form.tsx

# 2. Agregar import después de línea 15:
#    import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

# 3. Guardar y ejecutar tests
npm test app/pedidos/__tests__/order-form.test.tsx

# ✅ Esperado: 3/3 tests passed


# ===================================
# FASE 2: MENU PAGE (1-2 HORAS)
# ===================================

# 1. Investigar página
code app/menu/page.tsx

# 2. Revisar tests
code app/menu/__tests__/menu-page.test.tsx

# 3. Buscar referencias a auth/admin
grep -rn "admin\|auth" app/menu/

# 4. Decidir estrategia y aplicar fix

# 5. Ejecutar tests
npm test app/menu/__tests__/menu-page.test.tsx

# ✅ Esperado: 5/5 tests passed or updated


# ===================================
# FASE 3: SOCKET MOCK (30 MIN) [OPCIONAL]
# ===================================

# 1. Editar mock
code lib/socket.ts

# 2. En clase MockSocketClient, método connect(), agregar:
#    this.connectionState.isConnected = true

# 3. Ejecutar tests
npm test lib/__tests__/socket-client.test.ts

# ✅ Esperado: 2/2 tests passed


# ===================================
# VALIDACIÓN FINAL
# ===================================

# Ejecutar todos los tests
npm test

# ✅ Objetivo: 58-60/60 tests passing (97-100%)
```

---

## ✅ Criterios de Éxito

### **Mínimo Aceptable (Fase 1):**
- ✅ order-form.tsx fix aplicado
- ✅ 53/60 tests passing (88%)
- ✅ Componente order-form funcional
- ✅ 0 uncaught exceptions

### **Target Intermedio (Fase 1 + 2):**
- ✅ order-form.tsx fix aplicado
- ✅ menu-page problema resuelto
- ✅ 58/60 tests passing (97%)
- ✅ Componentes críticos funcionan

### **Target Completo (Todas las fases):**
- ✅ Todos los fixes aplicados
- ✅ 60/60 tests passing (100%)
- ✅ 0 problemas conocidos
- ✅ M4 completamente validado

---

## 🎯 Prioridades

### **URGENTE (Hacer ahora):**
1. 🔴 Fix Select import en order-form.tsx

### **IMPORTANTE (Hacer después):**
2. 🟠 Resolver menu-page tests

### **OPCIONAL (Si hay tiempo):**
3. 🟡 Fix socket-client mock

---

## 📊 Métricas de Progreso

### **Antes de ejecutar prompt:**
```
Test Suites: 9 passed, 3 failed, 12 total
Tests:       50 passed, 10 failed, 60 total
Success Rate: 83%
```

### **Después de Fase 1:**
```
Test Suites: 10 passed, 2 failed, 12 total
Tests:       53 passed, 7 failed, 60 total
Success Rate: 88%
```

### **Después de Fase 2:**
```
Test Suites: 11 passed, 1 failed, 12 total
Tests:       58 passed, 2 failed, 60 total
Success Rate: 97%
```

### **Después de Fase 3:**
```
Test Suites: 12 passed, 0 failed, 12 total ✅
Tests:       60 passed, 0 failed, 60 total ✅
Success Rate: 100% 🎉
```

---

## 🔍 Debugging Tips

### **Si order-form tests siguen fallando:**
```bash
# Verificar que el import se agregó correctamente
grep "Select" components/order-form.tsx | head -n 5

# Limpiar cache de Vitest
rm -rf node_modules/.vitest

# Re-ejecutar
npm test app/pedidos/__tests__/order-form.test.tsx
```

### **Si menu-page tests siguen fallando:**
```bash
# Ver output real del componente
npm test app/menu/__tests__/menu-page.test.tsx -- --reporter=verbose

# Revisar si hay mocks faltantes
grep -n "vi.mock" app/menu/__tests__/menu-page.test.tsx
```

### **Si socket-client tests siguen fallando:**
```bash
# Ver estado del mock
grep -A 20 "class MockSocketClient" lib/socket.ts

# Verificar que isConnected se establece
grep -n "isConnected" lib/socket.ts | grep -v "//"
```

---

## 📚 Referencias

### **Archivos Clave:**
- `components/order-form.tsx` - Componente con Select faltante
- `components/ui/select.tsx` - Componente shadcn Select
- `app/menu/page.tsx` - Página de menú con placeholder
- `app/menu/__tests__/menu-page.test.tsx` - Tests de menú
- `lib/socket.ts` - Cliente socket con mock
- `lib/__tests__/socket-client.test.ts` - Tests de socket

### **Documentación:**
- shadcn/ui Select: https://ui.shadcn.com/docs/components/select
- Vitest: https://vitest.dev/
- Testing Library: https://testing-library.com/react

---

## 🎉 Resultado Final Esperado

```bash
npm test

# Output esperado:
✓ app/api/__tests__/menu-api.test.ts (X tests)
✓ app/api/__tests__/orders-api.test.ts (X tests)
✓ app/api/__tests__/tables-api.test.ts (X tests)
✓ app/menu/__tests__/menu-page.test.tsx (X tests)
✓ app/pedidos/__tests__/order-form.test.tsx (X tests) ✅ FIXED
✓ app/pedidos/__tests__/orders-panel.test.tsx (X tests)
✓ app/pedidos/__tests__/use-orders-panel.test.tsx (X tests)
✓ lib/__tests__/order-service.test.ts (X tests)
✓ lib/__tests__/socket-client.test.ts (X tests) ✅ FIXED
✓ lib/__tests__/table-store.test.ts (X tests)
✓ lib/server/__tests__/socket-bus.test.ts (X tests)
✓ lib/server/__tests__/socket-payloads.test.ts (X tests)

Test Files  12 passed (12) ✅
Tests       60 passed (60) ✅
Duration    ~8-10s
```

---

**¡Prompt completo listo para ejecutar!** 🚀

**Siguiente paso:** Comenzar con Fase 1 (5 minutos) para fix crítico del Select import.
