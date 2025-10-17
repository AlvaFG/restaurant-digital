# 🚀 Plan de Implementación Completo - Sistema Avanzado de Gestión de Mesas

## 📊 Estado del Proyecto

**Fecha:** 17 de octubre de 2025  
**Estado General:** 🟡 En Progreso (30% completado)  
**Prioridad:** Alta

---

## ✅ Fase 1: BASE DE DATOS (COMPLETADO)

### 1.1 Tabla de Auditoría ✅
**Archivo:** `supabase/migrations/20251017000001_create_table_audit.sql`

**Implementado:**
- ✅ Tabla `table_status_audit` con todos los campos
- ✅ Índices optimizados para consultas rápidas
- ✅ Row Level Security (RLS) configurado
- ✅ Función `log_table_status_change()` para registros automáticos
- ✅ Función `calculate_previous_state_duration()` para métricas
- ✅ Vistas `table_status_changes_summary` y `recent_table_status_changes`
- ✅ Triggers para `updated_at`
- ✅ Policies para aislamiento multi-tenant

**Beneficios:**
- Trazabilidad completa de todos los cambios
- Cálculo automático de duración en cada estado
- Consultas optimizadas con índices
- Seguridad y aislamiento por tenant

### 1.2 Funciones RPC para Transacciones Atómicas ✅
**Archivo:** `supabase/migrations/20251017000002_create_atomic_functions.sql`

**Implementado:**
- ✅ Función `create_order_with_table_update()` - Transacción atómica completa
- ✅ Función `validate_table_status_transition()` - Validación de transiciones
- ✅ Función `update_table_status_safe()` - Actualización segura con validación
- ✅ Manejo automático de rollback en caso de error
- ✅ Tests integrados en SQL

**Beneficios:**
- Garantiza consistencia de datos (todo o nada)
- Previene estados inconsistentes
- Rollback automático en errores
- Lock pesimista para evitar race conditions

---

## ✅ Fase 2: SERVICIOS TYPESCRIPT (COMPLETADO)

### 2.1 Servicio de Auditoría ✅
**Archivo:** `lib/services/audit-service.ts`

**Implementado:**
- ✅ `logTableStatusChange()` - Registrar cambios
- ✅ `getTableAuditHistory()` - Historial por mesa
- ✅ `getAuditRecords()` - Consultas con filtros
- ✅ `getRecentChanges()` - Cambios recientes
- ✅ `getTableStatistics()` - Estadísticas detalladas
- ✅ `getTenantAuditSummary()` - Resumen por tenant
- ✅ `exportAuditToCSV()` - Exportación de datos
- ✅ Funciones de utilidad (formateo, colores, etc.)

**Funcionalidades:**
```typescript
// Registrar cambio
await logTableStatusChange({
  tenantId: '...',
  tableId: '...',
  tableNumber: '3',
  previousStatus: 'libre',
  newStatus: 'pedido_en_curso',
  reason: 'Pedido creado'
})

// Obtener estadísticas
const stats = await getTableStatistics(tableId, tenantId)
// Retorna: total de cambios, duración promedio, distribución de estados, horas pico
```

### 2.2 Módulo de Reglas de Negocio ✅
**Archivo:** `lib/business-rules/table-rules.ts`

**Implementado:**
- ✅ `validateOrderCreation()` - Validación completa antes de crear pedido
- ✅ `validateStatusTransition()` - Validar cambios de estado
- ✅ `checkOperatingHours()` - Verificar horario de operación
- ✅ `checkTableAvailability()` - Disponibilidad de mesa
- ✅ `checkTableCapacity()` - Capacidad suficiente
- ✅ `checkUserPermissions()` - Permisos por rol
- ✅ `validateOrderLimits()` - Límites de pedido
- ✅ `canReleaseTable()` - Verificar si se puede liberar
- ✅ `getRecommendedAction()` - Sugerencia de acción
- ✅ `estimateServiceTime()` - Tiempo estimado

**Reglas Implementadas:**
1. ✅ Horarios de operación (11:00 - 23:00)
2. ✅ Máximo 3 pedidos activos por mesa
3. ✅ Máximo 50 items por pedido
4. ✅ Validación de capacidad de mesa
5. ✅ Validación de transiciones de estado
6. ✅ Control de permisos por rol
7. ✅ Límites de monto de pedido
8. ✅ Prevención de estados bloqueados

**Uso:**
```typescript
// Validar antes de crear pedido
const validation = TableBusinessRules.validateOrderCreation(
  table,
  user,
  { partySize: 4 }
)

if (!validation.valid) {
  throw new Error(validation.error)
}
```

---

## 🟡 Fase 3: INTEGRACIÓN (PENDIENTE - 40%)

### 3.1 Integrar Transacciones en orders-service.ts ⏳
**Estado:** Pendiente  
**Prioridad:** Alta

**Tareas:**
1. Modificar `createOrder()` para usar función RPC
2. Adaptar parámetros al formato esperado por la función
3. Manejar respuesta de la transacción atómica
4. Actualizar manejo de errores

**Código a implementar:**
```typescript
// En orders-service.ts
export async function createOrder(input: CreateOrderInput, tenantId: string) {
  const supabase = createBrowserClient()

  try {
    // Validar reglas de negocio ANTES de llamar a la función
    const table = await getTableData(input.tableId, tenantId)
    const validation = TableBusinessRules.validateOrderCreation(table, currentUser, {
      partySize: input.partySize
    })
    
    if (!validation.valid) {
      throw new Error(validation.error)
    }

    // Llamar a función RPC de transacción atómica
    const { data, error } = await supabase.rpc('create_order_with_table_update', {
      p_tenant_id: tenantId,
      p_table_id: input.tableId,
      p_order_data: { ...orderData },
      p_order_items: orderItems,
      p_discounts: discounts,
      p_taxes: taxes,
      p_user_id: currentUser.id
    })

    if (error) throw error

    // Emitir evento WebSocket
    await emitTableStatusChanged(data)

    return { data: data.order_id, error: null }
  } catch (error) {
    logger.error('Error en transacción de pedido', error)
    return { data: null, error }
  }
}
```

### 3.2 Integrar Auditoría ⏳
**Estado:** Pendiente  
**Prioridad:** Media

**Tareas:**
1. Importar `audit-service` en `orders-service`
2. Llamar a `logTableStatusChange()` después de crear pedidos
3. Integrar auditoría en `tables-service`
4. Registrar cambios manuales de estado

**Nota:** La función RPC ya registra automáticamente en auditoría, pero cambios manuales necesitan integración.

### 3.3 Integrar Validaciones en Componentes ⏳
**Estado:** Pendiente  
**Prioridad:** Media

**Tareas:**
1. Actualizar `OrderForm` para validar antes de enviar
2. Mostrar mensajes de error específicos
3. Deshabilitar botón "Crear pedido" si validación falla
4. Agregar tooltips con razones de bloqueo

---

## 🔴 Fase 4: WEBSOCKETS (PENDIENTE - 0%)

### 4.1 Servicio de WebSocket ⏳
**Archivo a crear:** `lib/services/socket-notifications.ts`

**Funciones necesarias:**
```typescript
export async function emitTableStatusChanged(data: {
  tenantId: string
  tableId: string
  tableNumber: string
  previousStatus: string
  newStatus: string
  orderId?: string
}) {
  // Emitir a todos los clientes conectados del tenant
  socket.to(`tenant:${tenantId}`).emit('table:status_changed', data)
}

export async function emitOrderCreated(data: {
  tenantId: string
  orderId: string
  tableId: string
  orderNumber: string
}) {
  socket.to(`tenant:${tenantId}`).emit('order:created', data)
}
```

### 4.2 Integrar en Orders Service ⏳
**Tareas:**
1. Importar servicio de WebSocket
2. Emitir eventos después de operaciones exitosas
3. Configurar canales por tenant

### 4.3 Cliente WebSocket en React ⏳
**Tareas:**
1. Crear hook `useTableStatusWebSocket`
2. Escuchar eventos de cambios
3. Invalidar queries de React Query automáticamente
4. Mostrar notificaciones toast

---

## 🔴 Fase 5: COMPONENTES UI (PENDIENTE - 0%)

### 5.1 Hook useTableAudit ⏳
**Archivo a crear:** `hooks/use-table-audit.ts`

```typescript
export function useTableAudit(tableId?: string) {
  const { tenant } = useAuth()
  const queryClient = useQueryClient()

  const { data: auditHistory, isLoading } = useQuery({
    queryKey: ['table-audit', tenant?.id, tableId],
    queryFn: async () => {
      if (!tableId || !tenant?.id) return []
      const { data } = await getTableAuditHistory(tableId, tenant.id)
      return data
    },
    enabled: !!(tableId && tenant?.id)
  })

  return {
    auditHistory,
    loading: isLoading
  }
}
```

### 5.2 Componente TableAuditHistory ⏳
**Archivo a crear:** `components/table-audit-history.tsx`

**Funcionalidades:**
- Timeline de cambios de estado
- Información de usuario que hizo el cambio
- Duración en cada estado
- Razón del cambio
- Link a pedido relacionado
- Filtros por fecha, estado, usuario
- Exportar a CSV

**Vista prevista:**
```
┌────────────────────────────────────────────┐
│ Historial de Mesa 3                        │
├────────────────────────────────────────────┤
│ 📅 17/10/2025 - 14:30                      │
│ 🟢 Libre → 🔵 Pedido en curso              │
│ 👤 Juan Pérez (Mozo)                       │
│ ⏱️  Duración: 45 minutos                    │
│ 📝 Pedido creado (ORD-000123)              │
├────────────────────────────────────────────┤
│ 📅 17/10/2025 - 15:15                      │
│ 🔵 Pedido en curso → 🟣 Cuenta solicitada  │
│ 👤 Cliente (QR)                            │
│ ⏱️  Duración: 35 minutos                    │
│ 📝 Cliente solicitó la cuenta              │
└────────────────────────────────────────────┘
```

### 5.3 Panel de Auditoría en Dashboard ⏳
**Tareas:**
1. Agregar pestaña "Auditoría" en configuración
2. Vista de cambios recientes
3. Gráficos de estadísticas
4. Exportación de reportes

---

## 🔴 Fase 6: TESTING (PENDIENTE - 0%)

### 6.1 Tests Unitarios ⏳
**Archivos a crear:**
- `lib/business-rules/__tests__/table-rules.test.ts`
- `lib/services/__tests__/audit-service.test.ts`

**Tests necesarios:**
1. Validación de horarios
2. Validación de transiciones
3. Validación de capacidad
4. Validación de permisos
5. Registro de auditoría
6. Consultas de auditoría

### 6.2 Tests de Integración ⏳
**Tests necesarios:**
1. Crear pedido con transacción atómica
2. Rollback en caso de error
3. Registro automático en auditoría
4. WebSocket emite eventos correctos

---

## 📚 DOCUMENTACIÓN

### Documentos Creados:
1. ✅ `docs/FEATURE_AUTO_UPDATE_TABLE_STATUS.md` - Feature original
2. ✅ `docs/IMPLEMENTATION_SUMMARY_TABLE_STATUS.md` - Resumen de implementación
3. ✅ `docs/TESTING_GUIDE_TABLE_STATUS.md` - Guía de pruebas
4. 🟡 `docs/ADVANCED_FEATURES_GUIDE.md` - Esta guía (en progreso)

### Documentos Pendientes:
- ⏳ Guía de uso de API de auditoría
- ⏳ Guía de reglas de negocio
- ⏳ Diagrama de arquitectura completo
- ⏳ Guía de WebSockets

---

## 📊 Resumen Ejecutivo

### ✅ Completado (30%)

| Component | Status | Files |
|-----------|--------|-------|
| Tabla de Auditoría | ✅ | `20251017000001_create_table_audit.sql` |
| Funciones RPC | ✅ | `20251017000002_create_atomic_functions.sql` |
| Servicio de Auditoría | ✅ | `lib/services/audit-service.ts` |
| Reglas de Negocio | ✅ | `lib/business-rules/table-rules.ts` |

### 🟡 En Progreso (40%)

| Component | Status | Pending Tasks |
|-----------|--------|---------------|
| Integración Orders Service | ⏳ | Usar RPC, aplicar validaciones |
| Integración Tables Service | ⏳ | Usar auditoría en cambios manuales |
| Componente OrderForm | ⏳ | Validaciones pre-submit |

### 🔴 Pendiente (30%)

| Component | Status | Estimated Effort |
|-----------|--------|------------------|
| WebSocket Service | ⏳ | 2-3 horas |
| Hook useTableAudit | ⏳ | 1 hora |
| Componente TableAuditHistory | ⏳ | 2-3 horas |
| Tests | ⏳ | 3-4 horas |

---

## 🎯 Próximos Pasos Recomendados

### Opción A: Implementación Completa
Continuar con todas las fases pendientes (8-10 horas de trabajo)

### Opción B: Implementación Mínima Viable (MVP)
1. ✅ Migrar base de datos (ya completado)
2. ⏳ Integrar transacciones en orders-service (1 hora)
3. ⏳ Probar funcionalidad básica (30 min)
4. ⏳ Deploy y validación (30 min)

**Total MVP: ~2 horas adicionales**

### Opción C: Implementación Gradual
1. **Semana 1:** Transacciones y validaciones (completar Fase 3)
2. **Semana 2:** WebSockets (Fase 4)
3. **Semana 3:** Componentes UI (Fase 5)
4. **Semana 4:** Tests y refinamiento (Fase 6)

---

## 🚀 Comandos para Ejecutar Migraciones

```bash
# 1. Conectar a Supabase
npx supabase login

# 2. Aplicar migraciones
npx supabase db push

# O manualmente en Supabase Dashboard:
# - Ir a SQL Editor
# - Copiar contenido de 20251017000001_create_table_audit.sql
# - Ejecutar
# - Copiar contenido de 20251017000002_create_atomic_functions.sql
# - Ejecutar

# 3. Verificar que se aplicaron
npx supabase db diff
```

---

## 💡 Beneficios de la Implementación Completa

1. **Consistencia de Datos** 🔒
   - Transacciones atómicas garantizan integridad
   - No más estados inconsistentes

2. **Trazabilidad Total** 📋
   - Historial completo de cambios
   - Auditoría para compliance

3. **Validación Robusta** ✅
   - Reglas de negocio centralizadas
   - Prevención de errores

4. **Tiempo Real** ⚡
   - WebSockets para sincronización
   - Experiencia multi-usuario mejorada

5. **Insights y Análisis** 📊
   - Estadísticas de uso
   - Identificación de cuellos de botella
   - Optimización de operaciones

---

## ❓ ¿Qué Sigue?

Tienes tres opciones:

1. **Continuar con implementación completa**
   - Implementaré todos los archivos pendientes
   - ~8-10 horas de trabajo
   - Sistema completo y robusto

2. **Implementar MVP**
   - Solo lo esencial para funcionar
   - ~2 horas de trabajo
   - Puedes agregar features después

3. **Revisar y decidir**
   - Analizas lo implementado
   - Decides qué features necesitas primero
   - Implementación gradual

**¿Qué prefieres? 🤔**
