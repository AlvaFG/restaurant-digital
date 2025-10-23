# 📚 Guía de Uso - Sistema de Auditoría y Notificaciones en Tiempo Real

## 🎯 Resumen

Este sistema proporciona auditoría completa de cambios de estado de mesas, transacciones atómicas y notificaciones en tiempo real.

---

## 📦 Componentes Implementados

### 1. Hook `useTableAudit`

Hook principal para consultar historial de auditoría.

#### Uso Básico

```typescript
import { useTableAudit } from '@/hooks/use-table-audit';

function MyComponent() {
  const { data: auditRecords, isLoading } = useTableAudit({
    tenantId: 'your-tenant-id',
    tableId: 'specific-table-id', // opcional
  });

  if (isLoading) return <div>Cargando...</div>;

  return (
    <div>
      {auditRecords?.map(record => (
        <div key={record.id}>
          {record.table_number}: {record.previous_status} → {record.new_status}
        </div>
      ))}
    </div>
  );
}
```

#### Hooks Disponibles

##### `useRecentTableChanges`
Obtiene cambios de las últimas 24 horas:

```typescript
const { data: recentChanges } = useRecentTableChanges(tenantId);
```

##### `useTableStatusSummary`
Estadísticas agregadas por mesa:

```typescript
const { data: summary } = useTableStatusSummary(tenantId);
// Retorna: total_changes, days_with_changes, avg_duration_seconds, last_change_at
```

##### `useTableHistory`
Historial completo de una mesa con joins:

```typescript
const { data: history } = useTableHistory(tableId);
// Incluye información de usuario (email) y pedido (order_number)
```

##### `useLogTableStatusChange`
Registrar cambio manualmente:

```typescript
const logChange = useLogTableStatusChange();

function handleManualChange() {
  logChange.mutate({
    tenantId: 'xxx',
    tableId: 'yyy',
    tableNumber: '5',
    previousStatus: 'libre',
    newStatus: 'ocupada',
    reason: 'Cliente llegó sin reserva',
  });
}
```

##### `useAverageDurationByStatus`
Duración promedio en cada estado:

```typescript
const { data: avgDurations } = useAverageDurationByStatus(tableId);
// Retorna: [{status, average_seconds, average_minutes, occurrences}]
```

##### `useTableTimeline`
Timeline de cambios en un período:

```typescript
const { data: timeline } = useTableTimeline(tableId, 7); // últimos 7 días
```

---

### 2. Componente `TableAuditHistory`

Componente visual completo para mostrar historial de una mesa.

#### Uso

```typescript
import { TableAuditHistory } from '@/components/table-audit-history';

function TableDetailPage({ tableId }: { tableId: string }) {
  return (
    <TableAuditHistory 
      tableId={tableId}
      tableNumber="5"
      showStatistics={true}
    />
  );
}
```

#### Características

- **Timeline Visual**: Línea de tiempo con dots de colores por estado
- **Estadísticas**: Cards con métricas clave (total cambios, días activos, duración promedio)
- **Filtros**: Ver últimos 7, 14 o 30 días
- **3 Tabs**:
  - **Timeline**: Vista cronológica visual
  - **Estadísticas**: Duración promedio por estado
  - **Detalles**: Historial completo con usuario y pedido

---

### 3. Servicio `socketNotifications`

Sistema de notificaciones en tiempo real usando Supabase Realtime.

#### Uso con Hooks React

##### Escuchar cambios de estado de mesas

```typescript
import { useTableStatusNotifications } from '@/lib/services/socket-notifications';

function Dashboard() {
  const { user } = useAuth();

  useTableStatusNotifications(
    user?.tenant_id,
    (event) => {
      console.log('Mesa cambió de estado:', event.payload);
      // Mostrar notificación toast
      toast.success(
        `Mesa ${event.payload.table_number}: ${event.payload.previous_status} → ${event.payload.new_status}`
      );
    }
  );

  return <div>Dashboard con notificaciones en vivo</div>;
}
```

##### Escuchar creación de pedidos

```typescript
import { useOrderNotifications } from '@/lib/services/socket-notifications';

function KitchenDisplay() {
  const { user } = useAuth();

  useOrderNotifications(
    user?.tenant_id,
    (event) => {
      console.log('Nuevo pedido:', event.payload);
      // Actualizar lista de pedidos
      playNotificationSound();
      refetchOrders();
    }
  );

  return <div>Pantalla de cocina</div>;
}
```

##### Escuchar cambios de una mesa específica

```typescript
import { useSingleTableNotifications } from '@/lib/services/socket-notifications';

function TableMonitor({ tableId }: { tableId: string }) {
  useSingleTableNotifications(
    tableId,
    (event) => {
      console.log('Estado actualizado:', event.payload.new_status);
      // Actualizar UI
    }
  );

  return <div>Monitor de mesa individual</div>;
}
```

#### Uso Directo (sin hooks)

```typescript
import { socketNotifications } from '@/lib/services/socket-notifications';

// Suscribirse
const unsubscribe = socketNotifications.subscribeToTableStatusChanges(
  tenantId,
  (event) => {
    console.log('Evento:', event);
  }
);

// Desuscribirse más tarde
unsubscribe();

// Desuscribirse de todo
socketNotifications.unsubscribeAll();

// Ver estado de conexión
const status = socketNotifications.getConnectionStatus();
console.log(status); // { 'table-status-changes:xxx': 'joined', ... }
```

---

## 🔄 Flujo Completo de Trabajo

### Crear Pedido con Auditoría Automática

```typescript
import { createOrderWithTableUpdate } from '@/lib/services/orders-service';

async function handleCreateOrder(orderData) {
  const result = await createOrderWithTableUpdate({
    tenantId: user.tenant_id,
    tableId: selectedTable.id,
    orderData: {
      status: 'abierto',
      payment_status: 'pendiente',
      source: 'staff',
      subtotal_cents: 5000,
      total_cents: 5000,
    },
    orderItems: [
      {
        menu_item_id: 'item-uuid',
        name: 'Pizza Margarita',
        quantity: 1,
        unit_price_cents: 5000,
        total_cents: 5000,
      }
    ],
  });

  // result.table_status_changed será true si la mesa estaba libre
  // Automáticamente:
  // 1. Crea el pedido
  // 2. Cambia mesa de "libre" → "pedido_en_curso"
  // 3. Registra en table_status_audit
  // 4. Dispara notificación Realtime
}
```

### Dashboard con Notificaciones y Auditoría

```typescript
'use client';

import { useTableStatusNotifications } from '@/lib/services/socket-notifications';
import { useRecentTableChanges } from '@/hooks/use-table-audit';
import { toast } from 'sonner';

export function LiveDashboard() {
  const { user } = useAuth();
  const { data: recentChanges } = useRecentTableChanges(user?.tenant_id);

  // Notificaciones en tiempo real
  useTableStatusNotifications(user?.tenant_id, (event) => {
    toast.info(
      `Mesa ${event.payload.table_number} ahora está ${event.payload.new_status}`,
      {
        description: event.payload.reason || 'Cambio automático',
      }
    );

    // Actualizar queries
    queryClient.invalidateQueries(['recent-table-changes']);
    queryClient.invalidateQueries(['tables']);
  });

  return (
    <div>
      <h2>Cambios Recientes (24h)</h2>
      {recentChanges?.map(change => (
        <div key={change.id}>
          Mesa {change.table_number}: {change.previous_status} → {change.new_status}
          <br />
          <small>{new Date(change.changed_at).toLocaleString()}</small>
        </div>
      ))}
    </div>
  );
}
```

---

## 🎨 Ejemplo: Página de Detalle de Mesa

```typescript
'use client';

import { TableAuditHistory } from '@/components/table-audit-history';
import { useSingleTableNotifications } from '@/lib/services/socket-notifications';
import { useTable } from '@/hooks/use-tables';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';

export default function TableDetailPage({ params }: { params: { id: string } }) {
  const { data: table } = useTable(params.id);

  // Notificaciones en tiempo real para esta mesa
  useSingleTableNotifications(params.id, (event) => {
    toast.success(`Estado actualizado: ${event.payload.new_status}`);
  });

  if (!table) return <div>Cargando...</div>;

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Mesa {table.number}</h1>
          <Badge>{table.status}</Badge>
        </div>
      </div>

      {/* Historial Completo */}
      <TableAuditHistory 
        tableId={params.id}
        tableNumber={table.number}
        showStatistics={true}
      />
    </div>
  );
}
```

---

## 📊 Queries SQL Útiles

### Ver últimos cambios con detalles
```sql
SELECT * FROM recent_table_status_changes
ORDER BY changed_at DESC
LIMIT 20;
```

### Estadísticas por mesa
```sql
SELECT * FROM table_status_changes_summary
ORDER BY total_changes DESC;
```

### Mesas con más tiempo en un estado
```sql
SELECT 
  table_number,
  new_status,
  duration_seconds / 60 as duration_minutes,
  changed_at
FROM table_status_audit
WHERE duration_seconds > 3600 -- más de 1 hora
ORDER BY duration_seconds DESC;
```

### Cambios de estado por usuario
```sql
SELECT 
  u.email,
  COUNT(*) as total_changes,
  AVG(tsa.duration_seconds) as avg_duration
FROM table_status_audit tsa
JOIN users u ON tsa.changed_by = u.id
GROUP BY u.email
ORDER BY total_changes DESC;
```

---

## 🚀 Casos de Uso Comunes

### 1. Dashboard de Monitoreo en Vivo
```typescript
const { data: summary } = useTableStatusSummary(tenantId);
useTableStatusNotifications(tenantId, (event) => {
  // Actualizar UI automáticamente
  queryClient.invalidateQueries(['table-status-summary']);
});
```

### 2. Alertas de Tiempo Excesivo
```typescript
const { data: timeline } = useTableTimeline(tableId, 1); // últimas 24h

useEffect(() => {
  if (timeline) {
    const lastChange = timeline[timeline.length - 1];
    const minutesInCurrentState = 
      (Date.now() - new Date(lastChange.changed_at).getTime()) / 60000;
    
    if (minutesInCurrentState > 60) {
      toast.warning(`Mesa ${tableId} lleva más de 1 hora en ${lastChange.new_status}`);
    }
  }
}, [timeline]);
```

### 3. Reportes de Rotación
```typescript
const { data: avgDurations } = useAverageDurationByStatus(tableId);

// Calcular rotación diaria
const avgTotalMinutes = avgDurations?.reduce(
  (sum, stat) => sum + stat.average_minutes, 0
) || 0;

const estimatedTablesPerDay = (16 * 60) / avgTotalMinutes; // 16 horas de servicio
```

---

## ⚠️ Consideraciones Importantes

1. **Límites de Realtime**: Supabase tiene límites de conexiones simultáneas
2. **Invalidación de Cache**: Usa `queryClient.invalidateQueries` después de notificaciones
3. **Memoria**: Desuscribirse correctamente para evitar memory leaks
4. **Permisos RLS**: Asegúrate que el usuario tenga `tenant_id` válido
5. **Tamaño de Auditoría**: Considerar archivar registros antiguos (>6 meses)

---

## 🐛 Troubleshooting

### Las notificaciones no llegan
```typescript
// Verificar estado de conexión
import { socketNotifications } from '@/lib/services/socket-notifications';
console.log(socketNotifications.getConnectionStatus());
```

### Queries lentas
```typescript
// Los índices ya están creados, pero verifica:
// idx_table_audit_table_id
// idx_table_audit_tenant_id
// idx_table_audit_changed_at
```

### Memoria creciendo
```typescript
// Asegúrate de limpiar en unmount
useEffect(() => {
  return () => {
    socketNotifications.unsubscribeAll();
  };
}, []);
```

---

## 📝 Próximas Mejoras

- [ ] Exportar reportes en PDF
- [ ] Gráficos de ocupación (Chart.js)
- [ ] Predicción de demanda con ML
- [ ] Integración con calendario de reservas
- [ ] Notificaciones push móviles

---

¡Sistema completo y listo para producción! 🎉
