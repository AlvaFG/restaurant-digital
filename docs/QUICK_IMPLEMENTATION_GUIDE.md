# ⚡ Guía Rápida de Implementación MVP

## 🎯 Objetivo
Tener el sistema funcionando con transacciones atómicas, auditoría y validaciones en **2-3 horas**.

---

## ✅ PASO 1: APLICAR MIGRACIONES (15 minutos)

### Opción A: Via Dashboard (Más fácil)
```
1. Ir a: https://supabase.com/dashboard
2. Seleccionar tu proyecto
3. Ir a: SQL Editor
4. Nuevo query
5. Copiar TODO el contenido de:
   supabase/migrations/20251017000001_create_table_audit.sql
6. Click en "RUN"
7. Esperar confirmación (✓)

8. Repetir con:
   supabase/migrations/20251017000002_create_atomic_functions.sql
9. Click en "RUN"
10. Esperar confirmación (✓)
```

### Opción B: Via CLI
```bash
cd c:\Users\alvar\Downloads\restaurantmanagement
npx supabase db push
```

### Verificar que Funcionó
```sql
-- En SQL Editor, ejecutar:
SELECT COUNT(*) FROM table_status_audit;
-- Debe retornar: 0 (tabla vacía pero existe)

SELECT create_order_with_table_update;
-- Debe mostrar la función
```

---

## ✅ PASO 2: MODIFICAR orders-service.ts (1 hora)

### 2.1 Importar Servicios y Reglas

**Ubicación:** `lib/services/orders-service.ts`  
**Línea:** Top del archivo (después de imports existentes)

```typescript
// AGREGAR ESTOS IMPORTS:
import { TableBusinessRules } from '@/lib/business-rules/table-rules'
import { logTableStatusChange } from '@/lib/services/audit-service'
```

### 2.2 Reemplazar Función createOrder

**Buscar:** La función actual `export async function createOrder(`

**Reemplazar con:**

```typescript
export async function createOrder(input: CreateOrderInput, tenantId: string) {
  const supabase = createBrowserClient()

  try {
    // NUEVA LÓGICA CON VALIDACIONES Y TRANSACCIÓN ATÓMICA

    // 1. Obtener datos de la mesa
    const { data: tableData, error: tableError } = await supabase
      .from('tables')
      .select('*')
      .eq('id', input.tableId)
      .eq('tenant_id', tenantId)
      .single()

    if (tableError || !tableData) {
      throw new Error('Mesa no encontrada')
    }

    // 2. Obtener usuario actual
    const { data: { user } } = await supabase.auth.getUser()
    const { data: userData } = await supabase
      .from('users')
      .select('*')
      .eq('id', user?.id)
      .single()

    // 3. VALIDAR REGLAS DE NEGOCIO
    const validation = TableBusinessRules.validateOrderCreation(
      tableData,
      userData,
      {
        partySize: input.items.length, // O usa un campo específico si lo tienes
        source: input.source
      }
    )

    if (!validation.valid) {
      throw new Error(validation.error)
    }

    // 4. Obtener información de items del menú
    const menuItemIds = input.items.map(item => item.menuItemId)
    const { data: menuItems, error: menuError } = await supabase
      .from('menu_items')
      .select('id, name, price_cents')
      .in('id', menuItemIds)
      .eq('tenant_id', tenantId)

    if (menuError) throw menuError
    if (!menuItems || menuItems.length === 0) {
      throw new Error('No se encontraron items del menú')
    }

    // 5. Calcular totales (mantener tu lógica existente)
    const menuItemsMap = new Map(menuItems.map(item => [item.id, item]))
    let subtotalCents = 0
    const orderItemsArray: any[] = []

    for (const item of input.items) {
      const menuItem = menuItemsMap.get(item.menuItemId)
      if (!menuItem) continue

      const unitPrice = menuItem.price_cents
      const modifiersTotal = item.modifiers?.reduce((sum, mod) => sum + mod.priceCents, 0) || 0
      const totalPrice = (unitPrice + modifiersTotal) * item.quantity

      subtotalCents += totalPrice

      orderItemsArray.push({
        menu_item_id: item.menuItemId,
        name: menuItem.name,
        quantity: item.quantity,
        unit_price_cents: unitPrice,
        total_cents: totalPrice,
        notes: item.notes || null,
        modifiers: item.modifiers || null,
        discount: item.discount || null,
      })
    }

    // Aplicar descuentos y taxes (mantener lógica existente)
    let discountTotalCents = 0
    const orderDiscounts: any[] = []
    for (const discount of input.discounts || []) {
      let discountAmount = 0
      if (discount.type === 'percentage') {
        discountAmount = Math.round(subtotalCents * (discount.value / 100))
      } else {
        discountAmount = discount.value
      }
      discountTotalCents += discountAmount
      orderDiscounts.push({
        type: discount.type,
        value: discount.value,
        amount_cents: discountAmount,
        code: discount.code,
        reason: discount.reason
      })
    }

    let taxTotalCents = 0
    const orderTaxes: any[] = []
    for (const tax of input.taxes || []) {
      const taxAmount = tax.amountCents || Math.round((subtotalCents - discountTotalCents) * (tax.rate || 0))
      taxTotalCents += taxAmount
      orderTaxes.push({
        code: tax.code,
        name: tax.name,
        rate: tax.rate,
        amount_cents: taxAmount
      })
    }

    const totalCents = subtotalCents - discountTotalCents + taxTotalCents + (input.tipCents || 0) + (input.serviceChargeCents || 0)

    // 6. VALIDAR LÍMITES DE PEDIDO
    const limitsValidation = TableBusinessRules.validateOrderLimits(
      input.items.length,
      totalCents
    )

    if (!limitsValidation.valid) {
      throw new Error(limitsValidation.error)
    }

    // 7. LLAMAR A FUNCIÓN RPC DE TRANSACCIÓN ATÓMICA
    const { data: rpcResult, error: rpcError } = await supabase.rpc(
      'create_order_with_table_update',
      {
        p_tenant_id: tenantId,
        p_table_id: input.tableId,
        p_order_data: {
          status: 'abierto',
          payment_status: 'pendiente',
          source: input.source || 'staff',
          subtotal_cents: subtotalCents,
          discount_total_cents: discountTotalCents,
          tax_total_cents: taxTotalCents,
          tip_cents: input.tipCents || 0,
          service_charge_cents: input.serviceChargeCents || 0,
          total_cents: totalCents,
          notes: input.notes,
          customer_data: input.customerData
        },
        p_order_items: orderItemsArray,
        p_discounts: orderDiscounts,
        p_taxes: orderTaxes,
        p_user_id: user?.id || null
      }
    )

    if (rpcError) throw rpcError

    logger.info('Pedido creado con transacción atómica', {
      orderId: rpcResult.order_id,
      orderNumber: rpcResult.order_number,
      tableStatusChanged: rpcResult.table_status_changed,
      previousStatus: rpcResult.previous_table_status,
      newStatus: rpcResult.new_table_status
    })

    // 8. Retornar resultado
    return {
      data: {
        id: rpcResult.order_id,
        order_number: rpcResult.order_number,
        table_status_changed: rpcResult.table_status_changed,
        previous_table_status: rpcResult.previous_table_status,
        new_table_status: rpcResult.new_table_status
      },
      error: null
    }

  } catch (error) {
    logger.error('Error al crear orden con transacción atómica', error as Error)
    return { data: null, error: error as Error }
  }
}
```

---

## ✅ PASO 3: ACTUALIZAR OrderForm (30 minutos)

**Ubicación:** `components/order-form.tsx`

### 3.1 Importar Reglas de Negocio

```typescript
// AGREGAR AL TOP:
import { TableBusinessRules } from '@/lib/business-rules/table-rules'
```

### 3.2 Modificar handleSubmit

**Buscar la función `handleSubmit`**

**Agregar ANTES de `createOrder`:**

```typescript
const handleSubmit = async () => {
  if (!selectedTableId || orderItems.length === 0) {
    // ... código existente ...
    return
  }

  // NUEVA VALIDACIÓN ANTES DE ENVIAR
  const selectedTable = tables.find((table) => table.id === selectedTableId)
  
  if (!selectedTable) {
    toast({
      title: "Error",
      description: "Mesa no encontrada",
      variant: "destructive",
    })
    return
  }

  // VALIDAR REGLAS DE NEGOCIO
  const validation = TableBusinessRules.validateOrderCreation(
    selectedTable,
    null, // O pasa el usuario si lo tienes disponible
    {
      partySize: orderItems.reduce((sum, item) => sum + item.quantity, 0),
      source: 'staff'
    }
  )

  if (!validation.valid) {
    toast({
      title: "No se puede crear el pedido",
      description: validation.error,
      variant: "destructive",
    })
    logger.warn('Validación de pedido falló', {
      code: validation.code,
      error: validation.error,
      tableId: selectedTableId
    })
    return
  }

  setIsSubmitting(true)
  
  try {
    // ... resto del código existente ...
```

---

## ✅ PASO 4: PROBAR (30 minutos)

### 4.1 Compilar
```bash
npm run build
```

Debe compilar sin errores.

### 4.2 Ejecutar en Desarrollo
```bash
npm run dev
```

### 4.3 Casos de Prueba

**Prueba 1: Crear pedido normal ✅**
```
1. Ir a Pedidos → Nuevo pedido
2. Seleccionar mesa "Libre"
3. Agregar items
4. Click en "Crear pedido"
5. Verificar: Toast de éxito con mensaje de cambio de estado
6. Verificar: Mesa ahora está "Pedido en curso"
```

**Prueba 2: Validación de horario ⚠️**
```
// Comentar temporalmente la validación de horario si estás fuera del horario:
// En table-rules.ts, línea ~150, comentar:
// return { valid: false, error: '...' }

// O cambiar OPERATING_HOURS para tu zona horaria
```

**Prueba 3: Validación de estado bloqueado ❌**
```
1. Cambiar manualmente una mesa a "Cuenta solicitada"
2. Intentar crear pedido para esa mesa
3. Verificar: Error "No se pueden crear pedidos..."
```

**Prueba 4: Ver auditoría 📋**
```sql
-- En Supabase SQL Editor:
SELECT * FROM table_status_audit 
ORDER BY changed_at DESC 
LIMIT 10;

-- Debe mostrar los cambios que hiciste
```

---

## ✅ PASO 5: VERIFICACIÓN FINAL (15 minutos)

### Checklist:
- [ ] Migraciones aplicadas sin errores
- [ ] `npm run build` exitoso
- [ ] Pedido se crea correctamente
- [ ] Mesa cambia de estado automáticamente
- [ ] Auditoría registra el cambio
- [ ] Validaciones funcionan
- [ ] No hay errores en console

### Comandos de Verificación:

```bash
# TypeScript OK
npx tsc --noEmit

# No hay errores de linting críticos
npm run lint

# Build exitoso
npm run build
```

---

## 🐛 TROUBLESHOOTING

### Error: "Function create_order_with_table_update does not exist"
```
Solución: Las migraciones no se aplicaron
→ Ir a Paso 1 y aplicar manualmente en Dashboard
```

### Error: "Table table_status_audit does not exist"
```
Solución: Primera migración no se aplicó
→ Copiar y pegar 20251017000001_create_table_audit.sql en SQL Editor
→ Click RUN
```

### Error: "Invalid transition"
```
Solución: La transición de estado no es válida
→ Verificar el estado actual de la mesa
→ Usar transiciones válidas (ver table-rules.ts)
```

### Error de compilación TypeScript
```
Solución: Faltan imports
→ Verificar que agregaste todos los imports en Paso 2.1 y 3.1
```

### Validación de horario bloqueando todo
```
Solución temporal: Comentar validación
→ En table-rules.ts, función checkOperatingHours()
→ Comentar el return de error
→ O ajustar OPERATING_HOURS a tu zona horaria
```

---

## 📊 RESULTADO ESPERADO

Después de estos pasos tendrás:

✅ Transacciones atómicas funcionando  
✅ Auditoría completa de cambios  
✅ Validaciones de reglas de negocio  
✅ Sistema robusto y consistente  
✅ Base sólida para agregar WebSockets y UI después

---

## ⏭️ SIGUIENTES PASOS (Opcionales)

Una vez que el MVP funcione, puedes agregar:

1. **WebSockets** (2-3 horas)
   - Notificaciones en tiempo real
   - Sincronización automática

2. **Componente de Auditoría** (2-3 horas)
   - Vista de historial
   - Gráficos y estadísticas

3. **Tests** (3-4 horas)
   - Tests unitarios
   - Tests de integración

---

## 💬 ¿NECESITAS AYUDA?

Si encuentras algún error:

1. Copia el mensaje de error completo
2. Indica en qué paso estás
3. Muestra el código que ejecutaste
4. Te ayudo a resolverlo

---

**¡Listo para empezar! 🚀**

**Tiempo estimado total: 2-3 horas**  
**Dificultad: Media**  
**Beneficio: Alto**

¿Empezamos? 😊
