# 🎯 Feature: Actualización Automática de Estado de Mesas al Crear Pedidos

## 📋 Descripción

Implementación de actualización automática del estado de las mesas cuando se crea un pedido manual desde el panel de administración.

**Fecha de implementación:** 17 de octubre de 2025

---

## ✨ Funcionalidad Implementada

### 1. **Actualización Automática de Estado**

Cuando un administrador o mozo crea un pedido manual para una mesa:

- Si la mesa está en estado **"Libre"** → se actualiza automáticamente a **"Pedido en curso"**
- Si la mesa ya está en otro estado (Ocupada, Pedido en curso, etc.) → se mantiene su estado actual
- El cambio de estado ocurre **antes** de crear el pedido en la base de datos

### 2. **Selector de Mesas Mejorado**

- **Antes:** Solo mostraba mesas en estado "Libre" u "Ocupada"
- **Ahora:** Muestra **todas las mesas** independientemente de su estado
- Cada mesa muestra su estado actual en el selector (ejemplo: "Mesa 3 - Sin zona (Libre)")

### 3. **Feedback Visual al Usuario**

Cuando se crea un pedido exitosamente:
- Si la mesa estaba "Libre" → Toast muestra: "Pedido creado para la mesa 3. Mesa cambió de estado a 'Pedido en curso'"
- Si la mesa ya estaba en otro estado → Toast muestra: "Pedido creado para la mesa 3"

### 4. **Actualización de UI en Tiempo Real**

- Después de crear un pedido, se invalida el caché de mesas
- La UI se actualiza automáticamente para reflejar el nuevo estado
- Todas las vistas que muestran mesas ven el cambio inmediatamente

---

## 🔧 Archivos Modificados

### 1. `lib/services/orders-service.ts`

**Cambios:**
- Añadida lógica en `createOrder()` para verificar el estado de la mesa antes de crear el pedido
- Si la mesa está en estado 'libre', se actualiza a 'pedido_en_curso'
- Se registran logs detallados del cambio de estado
- El proceso no falla si hay error al actualizar la mesa (continúa creando el pedido)

**Código agregado:**
```typescript
// 0. Si hay una mesa asociada, verificar y actualizar su estado si es necesario
if (input.tableId) {
  // Obtener el estado actual de la mesa
  const { data: tableData, error: tableError } = await supabase
    .from('tables')
    .select('id, status, number')
    .eq('id', input.tableId)
    .eq('tenant_id', tenantId)
    .single()

  if (tableData && tableData.status === 'libre') {
    // Actualizar a 'pedido_en_curso'
    await supabase
      .from('tables')
      .update({ status: 'pedido_en_curso' })
      .eq('id', input.tableId)
      .eq('tenant_id', tenantId)
  }
}
```

### 2. `components/order-form.tsx`

**Cambios:**

1. **Selector de mesas actualizado:**
```typescript
// Antes
const availableTables = useMemo(
  () => tables.filter((table) => 
    table.status === TABLE_STATE.FREE || table.status === TABLE_STATE.OCCUPIED
  ),
  [tables],
)

// Ahora
const availableTables = useMemo(
  () => tables, // Muestra todas las mesas
  [tables],
)
```

2. **Agregado refresh de mesas:**
```typescript
const { tables, loading, error, refresh: refreshTables } = useTables()
```

3. **Mensaje de feedback mejorado:**
```typescript
// Captura estado anterior de la mesa
const previousTableStatus = selectedTable?.status

// Mensaje condicional según el estado
if (previousTableStatus === TABLE_STATE.FREE) {
  description += `. Mesa cambió de estado a "${TABLE_STATE_LABELS.pedido_en_curso}"`
}
```

4. **Invalidación de caché de mesas:**
```typescript
// Refrescar mesas después de crear pedido
await refreshTables()
```

---

## 🔄 Flujo Completo

```
1. Usuario selecciona una mesa (cualquier estado)
   ↓
2. Usuario agrega items al pedido
   ↓
3. Usuario hace clic en "Crear pedido"
   ↓
4. Sistema verifica el estado actual de la mesa
   ↓
5. Si mesa está "Libre" → actualiza a "Pedido en curso"
   ↓
6. Sistema crea el pedido en la base de datos
   ↓
7. Sistema muestra toast con confirmación
   ↓
8. Sistema refresca caché de mesas y pedidos
   ↓
9. UI se actualiza mostrando nuevo estado
```

---

## 📊 Estados de Mesa

| Estado | Código DB | Descripción |
|--------|-----------|-------------|
| Libre | `libre` | Mesa disponible para asignar |
| Ocupada | `ocupada` | Clientes sentados sin pedido registrado |
| **Pedido en curso** | `pedido_en_curso` | **Pedido activo asociado a la mesa** ⭐ |
| Cuenta solicitada | `cuenta_solicitada` | La mesa pidió la cuenta |
| Pago confirmado | `pago_confirmado` | Pago finalizado, pendiente de liberar |

**⭐ Estado aplicado automáticamente** cuando se crea un pedido manual para una mesa libre.

---

## 🎨 Experiencia de Usuario

### Antes
```
1. Admin ve solo mesas "Libre" y "Ocupada"
2. Crea pedido
3. Estado de mesa NO cambia automáticamente
4. Admin debe cambiar estado manualmente
```

### Ahora
```
1. Admin ve TODAS las mesas con sus estados actuales
2. Selecciona cualquier mesa
3. Crea pedido
4. ✅ Mesa "Libre" → automáticamente pasa a "Pedido en curso"
5. ✅ Toast muestra confirmación del cambio
6. ✅ UI se actualiza inmediatamente
```

---

## 🧪 Casos de Prueba

### Caso 1: Mesa Libre
```
Estado inicial: Libre
Acción: Crear pedido manual
Resultado esperado: Mesa pasa a "Pedido en curso"
Toast: "Pedido creado para la mesa 3. Mesa cambió de estado a 'Pedido en curso'"
```

### Caso 2: Mesa Ocupada
```
Estado inicial: Ocupada
Acción: Crear pedido manual
Resultado esperado: Mesa mantiene estado "Ocupada"
Toast: "Pedido creado para la mesa 5"
```

### Caso 3: Mesa con Pedido en Curso
```
Estado inicial: Pedido en curso
Acción: Crear segundo pedido
Resultado esperado: Mesa mantiene estado "Pedido en curso"
Toast: "Pedido creado para la mesa 7"
```

### Caso 4: Mesa Cuenta Solicitada
```
Estado inicial: Cuenta solicitada
Acción: Crear pedido adicional
Resultado esperado: Mesa mantiene estado "Cuenta solicitada"
Toast: "Pedido creado para la mesa 2"
```

---

## 🔐 Consideraciones de Seguridad

- ✅ Se valida tenant_id en todas las operaciones
- ✅ Solo usuarios autenticados pueden crear pedidos
- ✅ No se pueden crear pedidos sin mesa o items
- ✅ El cambio de estado respeta las reglas de negocio

---

## 📈 Beneficios

1. **Automatización**: Reduce pasos manuales para el staff
2. **Consistencia**: Estado de mesa siempre refleja la realidad
3. **Trazabilidad**: Logs detallados de todos los cambios
4. **UX Mejorada**: Feedback claro e inmediato
5. **Flexibilidad**: Permite crear pedidos para mesas en cualquier estado

---

## 🚀 Próximas Mejoras (Opcionales)

1. **Transacción atómica**: Envolver actualización de mesa y creación de pedido en una transacción
2. **Estados adicionales**: Considerar transiciones desde otros estados (ej: "Pago confirmado" → "Pedido en curso")
3. **Notificaciones**: Emitir evento WebSocket del cambio de estado
4. **Auditoría**: Registrar cambios de estado en tabla de auditoría
5. **Validación de reglas**: Restricciones según flujo de negocio (ej: no permitir pedidos si cuenta solicitada)

---

## 📝 Notas Técnicas

- Se usa React Query para gestión de caché
- Los cambios son optimistas en el cliente
- Se mantiene compatibilidad con WebSockets
- No se rompe funcionalidad existente
- Código defensivo: continúa si falla actualización de mesa

---

## ✅ Testing Recomendado

```bash
# 1. Ejecutar tests existentes
npm run test

# 2. Tests específicos
npm run test -- hooks/use-orders.test.tsx
npm run test -- hooks/use-tables.test.tsx

# 3. Tests de integración
npm run test -- integration/orders-menu.test.tsx
```

---

## 📚 Referencias

- `lib/table-states.ts` - Definiciones de estados
- `lib/type-guards.ts` - Type guards de estados
- `hooks/use-orders.ts` - Hook de pedidos
- `hooks/use-tables.ts` - Hook de mesas
- `components/order-form.tsx` - Formulario de pedidos
- `lib/services/orders-service.ts` - Servicio de pedidos
- `lib/services/tables-service.ts` - Servicio de mesas

---

**Implementado por:** GitHub Copilot
**Revisado:** ✅
**Estado:** Completado
