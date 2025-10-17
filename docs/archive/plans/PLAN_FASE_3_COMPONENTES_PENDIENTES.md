# Plan de Ejecución: Componentes Pendientes - Fase 3

**Fecha:** 2024  
**Estado:** Planificado  
**Componentes:** 3 pendientes de migración a hooks

---

## 📊 Resumen Ejecutivo

### Situación Actual
- **Completado:** 6/9 componentes migrados (67%)
- **Pendiente:** 3 componentes con bloqueos técnicos específicos
- **Hooks Disponibles:** useTables, useZones, useOrders, useMenu, usePayments

### Componentes Pendientes
1. **`table-map.tsx`** (691 líneas) - Mapa interactivo Konva
2. **`alerts-center.tsx`** (302 líneas) - Centro de alertas
3. **`notification-bell.tsx`** (173 líneas) - Campana de notificaciones

---

## 🎯 Tarea 1: Crear Hook `useAlerts`

**Prioridad:** ALTA (Desbloquea 2 componentes)  
**Estimación:** 3-4 horas  
**Complejidad:** Media-Alta

### Contexto Técnico

#### Estado Actual
```typescript
// En lib/mock-data.ts (línea 631)
export class AlertService {
  static async createAlert(tableId: string, type: Alert["type"], message: string): Promise<Alert>
  static async acknowledgeAlert(alertId: string): Promise<void>
  static async getActiveAlerts(): Promise<Alert[]>
}

// MOCK_ALERTS usado directamente
export const MOCK_ALERTS: Alert[] = [...]
```

#### Tipo Alert Actual
```typescript
export interface Alert {
  id: string
  tableId: string
  type: "llamar_mozo" | "pedido_entrante" | "quiere_pagar_efectivo" | "pago_aprobado"
  createdAt: Date
  acknowledged?: boolean
  message: string
}
```

#### Bloqueo Principal
- ❌ **NO existe tabla `alerts` en Supabase**
- ❌ AlertService es clase estática, no compatible con hooks
- ❌ Usa socket.io para real-time (eventos: alert.created, alert.updated, alert.acknowledged)

---

### Paso 1.1: Crear Tabla `alerts` en Supabase

**Estimación:** 30 minutos

#### SQL Migration
```sql
-- Create alerts table
CREATE TABLE public.alerts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  table_id UUID NOT NULL REFERENCES public.tables(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('llamar_mozo', 'pedido_entrante', 'quiere_pagar_efectivo', 'pago_aprobado')),
  message TEXT NOT NULL,
  acknowledged BOOLEAN NOT NULL DEFAULT false,
  acknowledged_at TIMESTAMPTZ,
  acknowledged_by UUID REFERENCES public.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- RLS Policies
ALTER TABLE public.alerts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view alerts in their tenant"
  ON public.alerts FOR SELECT
  USING (tenant_id = current_setting('app.tenant_id', true)::uuid);

CREATE POLICY "Users can create alerts in their tenant"
  ON public.alerts FOR INSERT
  WITH CHECK (tenant_id = current_setting('app.tenant_id', true)::uuid);

CREATE POLICY "Users can update alerts in their tenant"
  ON public.alerts FOR UPDATE
  USING (tenant_id = current_setting('app.tenant_id', true)::uuid)
  WITH CHECK (tenant_id = current_setting('app.tenant_id', true)::uuid);

-- Indexes
CREATE INDEX idx_alerts_tenant_id ON public.alerts(tenant_id);
CREATE INDEX idx_alerts_table_id ON public.alerts(table_id);
CREATE INDEX idx_alerts_acknowledged ON public.alerts(acknowledged);
CREATE INDEX idx_alerts_created_at ON public.alerts(created_at DESC);

-- Updated_at trigger
CREATE TRIGGER set_updated_at
  BEFORE UPDATE ON public.alerts
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
```

#### Acción
1. Crear archivo: `supabase/migrations/YYYYMMDDHHMMSS_create_alerts_table.sql`
2. Ejecutar migración: `npx supabase db push`
3. Regenerar tipos: `npx supabase gen types typescript --project-id [ID] > lib/supabase/database.types.ts`

---

### Paso 1.2: Crear Servicio `alerts-service.ts`

**Estimación:** 1 hora

#### Estructura del Servicio
```typescript
// lib/services/alerts-service.ts
import { createClient } from "@/lib/supabase/client"
import type { Database } from "@/lib/supabase/database.types"

type Alert = Database['public']['Tables']['alerts']['Row']
type AlertInsert = Database['public']['Tables']['alerts']['Insert']
type AlertUpdate = Database['public']['Tables']['alerts']['Update']

export async function fetchAlerts(tenantId: string): Promise<Alert[]> {
  const supabase = createClient()
  
  const { data, error } = await supabase
    .from('alerts')
    .select('*')
    .eq('tenant_id', tenantId)
    .order('created_at', { ascending: false })
  
  if (error) throw error
  return data ?? []
}

export async function fetchActiveAlerts(tenantId: string): Promise<Alert[]> {
  const supabase = createClient()
  
  const { data, error } = await supabase
    .from('alerts')
    .select('*')
    .eq('tenant_id', tenantId)
    .eq('acknowledged', false)
    .order('created_at', { ascending: false })
  
  if (error) throw error
  return data ?? []
}

export async function createAlert(
  tenantId: string,
  payload: Omit<AlertInsert, 'id' | 'tenant_id' | 'created_at' | 'updated_at'>
): Promise<Alert> {
  const supabase = createClient()
  
  const { data, error } = await supabase
    .from('alerts')
    .insert({ ...payload, tenant_id: tenantId })
    .select()
    .single()
  
  if (error) throw error
  return data
}

export async function acknowledgeAlert(
  alertId: string,
  userId: string
): Promise<Alert> {
  const supabase = createClient()
  
  const { data, error } = await supabase
    .from('alerts')
    .update({
      acknowledged: true,
      acknowledged_at: new Date().toISOString(),
      acknowledged_by: userId
    })
    .eq('id', alertId)
    .select()
    .single()
  
  if (error) throw error
  return data
}

export async function deleteAlert(alertId: string): Promise<void> {
  const supabase = createClient()
  
  const { error } = await supabase
    .from('alerts')
    .delete()
    .eq('id', alertId)
  
  if (error) throw error
}
```

#### Acción
1. Crear archivo: `lib/services/alerts-service.ts`
2. Implementar funciones CRUD
3. Validar tipos con TypeScript

---

### Paso 1.3: Crear Hook `useAlerts`

**Estimación:** 1.5 horas

#### Estructura del Hook
```typescript
// hooks/use-alerts.ts
"use client"

import { useEffect, useState } from "react"
import { useAuth } from "@/contexts/auth-context"
import {
  fetchAlerts,
  fetchActiveAlerts,
  createAlert as createAlertService,
  acknowledgeAlert as acknowledgeAlertService,
  deleteAlert as deleteAlertService
} from "@/lib/services/alerts-service"
import type { Database } from "@/lib/supabase/database.types"

type Alert = Database['public']['Tables']['alerts']['Row']
type AlertInsert = Database['public']['Tables']['alerts']['Insert']

interface UseAlertsOptions {
  activeOnly?: boolean
  autoRefresh?: boolean
}

interface UseAlertsReturn {
  alerts: Alert[]
  activeAlerts: Alert[]
  isLoading: boolean
  error: Error | null
  createAlert: (payload: Omit<AlertInsert, 'id' | 'tenant_id' | 'created_at' | 'updated_at'>) => Promise<void>
  acknowledgeAlert: (alertId: string) => Promise<void>
  deleteAlert: (alertId: string) => Promise<void>
  refresh: () => Promise<void>
}

export function useAlerts(options: UseAlertsOptions = {}): UseAlertsReturn {
  const { activeOnly = false, autoRefresh = true } = options
  const { user } = useAuth()
  const tenantId = user?.tenant_id

  const [alerts, setAlerts] = useState<Alert[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  const loadAlerts = async () => {
    if (!tenantId) {
      setAlerts([])
      setIsLoading(false)
      return
    }

    try {
      setError(null)
      const data = activeOnly
        ? await fetchActiveAlerts(tenantId)
        : await fetchAlerts(tenantId)
      setAlerts(data)
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to fetch alerts'))
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    loadAlerts()
  }, [tenantId, activeOnly])

  const createAlert = async (
    payload: Omit<AlertInsert, 'id' | 'tenant_id' | 'created_at' | 'updated_at'>
  ) => {
    if (!tenantId) throw new Error('No tenant ID')

    const newAlert = await createAlertService(tenantId, payload)
    if (autoRefresh) await loadAlerts()
  }

  const acknowledgeAlert = async (alertId: string) => {
    if (!user?.id) throw new Error('No user ID')

    await acknowledgeAlertService(alertId, user.id)
    if (autoRefresh) await loadAlerts()
  }

  const deleteAlert = async (alertId: string) => {
    await deleteAlertService(alertId)
    if (autoRefresh) await loadAlerts()
  }

  const activeAlerts = alerts.filter(alert => !alert.acknowledged)

  return {
    alerts,
    activeAlerts,
    isLoading,
    error,
    createAlert,
    acknowledgeAlert,
    deleteAlert,
    refresh: loadAlerts
  }
}
```

#### Acción
1. Crear archivo: `hooks/use-alerts.ts`
2. Implementar lógica del hook siguiendo patrón de otros hooks
3. Validar TypeScript sin errores

---

### Paso 1.4: Testing del Hook

**Estimación:** 30 minutos

#### Tests a Realizar
1. ✅ Hook se monta sin errores
2. ✅ Carga alertas activas correctamente
3. ✅ `createAlert` inserta y refresca
4. ✅ `acknowledgeAlert` marca como atendida
5. ✅ `deleteAlert` elimina correctamente
6. ✅ Auto-refresh funciona después de mutaciones

#### Comando
```powershell
npm test -- use-alerts.test.ts
```

---

## 🎯 Tarea 2: Migrar `alerts-center.tsx`

**Prioridad:** MEDIA  
**Estimación:** 1 hora  
**Complejidad:** Baja (una vez creado useAlerts)

### Estado Actual

#### Imports Legados
```typescript
import {
  ALERT_PRIORITIES,
  ALERT_TYPE_COLORS,
  ALERT_TYPE_LABELS,
  AlertService,       // ❌ Clase estática
  MOCK_ALERTS,        // ❌ Mock data
  MOCK_TABLES,        // ❌ Mock data
  type Alert,
} from "@/lib/mock-data"
```

#### Lógica Actual
```typescript
// Manual state management
const [alerts, setAlerts] = useState<Alert[]>(() => {
  const snapshot = getReadyAlerts(lastReadyPayload)
  return snapshot ?? cloneAlerts(MOCK_ALERTS)  // ❌ Fallback a mock
})

// Manual refresh
const handleRefresh = async () => {
  const data = await AlertService.getActiveAlerts()  // ❌ Clase estática
  setAlerts(cloneAlerts(data))
}

// Manual acknowledge
const handleAcknowledge = async (alertId: string) => {
  await AlertService.acknowledgeAlert(alertId)  // ❌ Clase estática
  emit("alert.acknowledged", { alertId, acknowledged: true })
}
```

---

### Paso 2.1: Refactorizar a useAlerts Hook

**Estimación:** 45 minutos

#### Nuevos Imports
```typescript
import { useAlerts } from "@/hooks/use-alerts"
import { useTables } from "@/hooks/use-tables"
import {
  ALERT_PRIORITIES,
  ALERT_TYPE_COLORS,
  ALERT_TYPE_LABELS,
  type Alert,
} from "@/lib/mock-data"  // Solo tipos y constantes
```

#### Nueva Lógica
```typescript
export function AlertsCenter() {
  const { alerts, activeAlerts, acknowledgeAlert, isLoading, error } = useAlerts()
  const { tables } = useTables()
  const { toast } = useToast()
  
  const [filter, setFilter] = useState<"all" | Alert["type"]>("all")

  // Crear índice de mesas
  const tablesIndex = useMemo(() => {
    const lookup = new Map<string, { number?: number }>()
    tables.forEach((table) => {
      lookup.set(table.id, { number: table.number })
    })
    return lookup
  }, [tables])

  // Filtrar y ordenar
  const filteredActiveAlerts = filter === "all" 
    ? activeAlerts 
    : activeAlerts.filter((alert) => alert.type === filter)
    
  const sortedActiveAlerts = [...filteredActiveAlerts].sort(
    (a, b) => ALERT_PRIORITIES[a.type] - ALERT_PRIORITIES[b.type],
  )

  const handleAcknowledge = async (alertId: string) => {
    try {
      await acknowledgeAlert(alertId)
      toast({
        title: "Alerta confirmada",
        description: "La alerta ha sido marcada como atendida",
      })
    } catch (error) {
      toast({
        title: "Error",
        description: "No se pudo confirmar la alerta",
        variant: "destructive",
      })
    }
  }

  // ... resto del componente sin cambios
}
```

#### Cambios Clave
1. ✅ Eliminar `AlertService` imports
2. ✅ Eliminar `MOCK_ALERTS` y `MOCK_TABLES` imports
3. ✅ Reemplazar `AlertService.getActiveAlerts()` por `useAlerts()`
4. ✅ Reemplazar `AlertService.acknowledgeAlert()` por hook mutation
5. ✅ Usar `useTables()` para mapeo de mesa ID → número
6. ✅ Eliminar lógica manual de socket (useAlerts lo maneja)

---

### Paso 2.2: Ajustar Tipos de Alert

**Estimación:** 15 minutos

#### Problema
```typescript
// Mock usa Date
createdAt: Date

// Supabase usa string (timestamptz)
created_at: string
```

#### Solución
```typescript
// Crear adapter si es necesario
const getTimeAgo = (dateString: string) => {
  const date = new Date(dateString)
  const minutes = Math.floor((Date.now() - date.getTime()) / 60000)
  // ... resto de lógica
}
```

---

## 🎯 Tarea 3: Migrar `notification-bell.tsx`

**Prioridad:** MEDIA  
**Estimación:** 45 minutos  
**Complejidad:** Baja (similar a alerts-center.tsx)

### Estado Actual

#### Imports Legados
```typescript
import { 
  AlertService,  // ❌ Clase estática
  MOCK_ALERTS,   // ❌ Mock data
  MOCK_TABLES,   // ❌ Mock data
  type Alert 
} from "@/lib/mock-data"
```

#### Lógica Actual
```typescript
const [alerts, setAlerts] = useState<Alert[]>(() => {
  const snapshot = getReadyAlerts(lastReadyPayload)
  return snapshot ?? cloneAlerts(MOCK_ALERTS)  // ❌ Fallback a mock
})

const handleAcknowledge = async (alertId: string) => {
  await AlertService.acknowledgeAlert(alertId)  // ❌ Clase estática
  emit("alert.acknowledged", { alertId, acknowledged: true })
}
```

---

### Paso 3.1: Refactorizar a useAlerts Hook

**Estimación:** 30 minutos

#### Nuevos Imports
```typescript
import { useAlerts } from "@/hooks/use-alerts"
import { useTables } from "@/hooks/use-tables"
import type { Alert } from "@/lib/mock-data"  // Solo tipo
```

#### Nueva Lógica
```typescript
export function NotificationBell() {
  const { activeAlerts, acknowledgeAlert } = useAlerts({ activeOnly: true })
  const { tables } = useTables()
  const { isConnected, isReconnecting } = useSocket()

  const tablesIndex = useMemo(() => {
    const lookup = new Map<string, { number?: number }>()
    tables.forEach((table) => {
      lookup.set(table.id, { number: table.number })
    })
    return lookup
  }, [tables])

  const handleAcknowledge = async (alertId: string) => {
    try {
      await acknowledgeAlert(alertId)
    } catch (error) {
      console.error("[notification-bell] Error acknowledging alert", error)
    }
  }

  const recentAlerts = activeAlerts.slice(0, 5)

  // ... resto del componente sin cambios en JSX
}
```

#### Cambios Clave
1. ✅ Eliminar `AlertService` import
2. ✅ Eliminar `MOCK_ALERTS` y `MOCK_TABLES` imports
3. ✅ Reemplazar estado manual con `useAlerts({ activeOnly: true })`
4. ✅ Usar `useTables()` para mapeo de mesas
5. ✅ Eliminar lógica de socket manual

---

### Paso 3.2: Testing

**Estimación:** 15 minutos

#### Tests a Realizar
1. ✅ Badge muestra cantidad correcta de alertas
2. ✅ Dropdown muestra últimas 5 alertas
3. ✅ Click en "Marcar como atendida" llama a `acknowledgeAlert`
4. ✅ Link a `/alertas` funciona

---

## 🎯 Tarea 4: Migrar `table-map.tsx`

**Prioridad:** BAJA (Complejo, puede ser Fase 4)  
**Estimación:** 4-6 horas  
**Complejidad:** ALTA

### Contexto Técnico

#### Estado Actual
- **Líneas:** 691
- **Librería:** Konva (canvas rendering)
- **Componentes Konva:** Stage, Layer, Rect, Circle, Text, Group
- **Features:** 
  - Drag & drop de mesas
  - Modo edición (admin only)
  - Layout persistente
  - Real-time socket updates
  - Zoom/pan del canvas

#### Imports Legados
```typescript
import type { Table, TableMapLayout } from "@/lib/mock-data"
import { MOCK_TABLE_LAYOUT, MOCK_TABLES } from "@/lib/mock-data"
import { fetchLayout, persistLayout } from "@/lib/table-service"
```

#### Bloqueos Principales
1. ❌ **Type Mismatch:** Mock `Table` vs Supabase `Table`
   ```typescript
   // Mock Table
   interface Table {
     seats: number
     zone: string
   }
   
   // Supabase Table
   interface Table {
     capacity: number
     zone_id: string
   }
   ```

2. ❌ **TableMapLayout:** No existe en Supabase
   ```typescript
   interface TableMapLayout {
     nodes: Array<{
       id: string
       tableId: string
       x: number
       y: number
       width: number
       height: number
       shape: "rect" | "circle"
     }>
     bounds: { width: number; height: number }
   }
   ```

3. ❌ **Konva Refs:** Manejo complejo de estado con refs
   ```typescript
   const stageRef = useRef<Konva.Stage>(null)
   // Drag handlers, transform events, etc.
   ```

---

### Decisión: Postponer para Fase 4

**Razones:**
1. **Complejidad Alta:** Requiere crear tabla `table_layouts` en Supabase
2. **Type Refactoring:** Necesita normalizar tipos entre mock y DB
3. **Konva Integration:** Requiere testing extensivo de canvas
4. **No Crítico:** Funcionalidad admin-only, bajo impacto en operaciones diarias
5. **Fase 3 Ya Completa:** 6/9 componentes core migrados exitosamente

**Alternativa Temporal:**
- Mantener `table-map.tsx` usando MOCK_* data por ahora
- Documentar como "legacy component" en FASE_3_COMPLETADA.md
- Planificar migración completa en Fase 4 (Optimización y Refinamiento)

---

### Plan Futuro (Fase 4)

#### Paso 4.1: Crear Tabla `table_layouts`
```sql
CREATE TABLE public.table_layouts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  name TEXT NOT NULL DEFAULT 'default',
  layout JSONB NOT NULL,  -- Almacena nodes y bounds
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
```

#### Paso 4.2: Normalizar Tipos Table
- Crear type adapters para transformar Supabase → Konva
- Actualizar todos los componentes para usar `capacity` en vez de `seats`
- Actualizar todos los componentes para usar `zone_id` en vez de `zone`

#### Paso 4.3: Crear Hook `useTableLayout`
```typescript
function useTableLayout(tenantId: string): {
  layout: TableMapLayout | null
  updateLayout: (layout: TableMapLayout) => Promise<void>
  isLoading: boolean
  error: Error | null
}
```

#### Paso 4.4: Refactorizar table-map.tsx
- Reemplazar MOCK_TABLES con `useTables()`
- Reemplazar fetchLayout/persistLayout con `useTableLayout()`
- Validar drag & drop sigue funcionando
- Testing extensivo de Konva interactions

---

## 📋 Orden de Ejecución Recomendado

### Sprint 1: Infraestructura de Alertas (3-4 horas)
1. ✅ **Crear tabla `alerts` en Supabase** (30 min)
   - Ejecutar migration SQL
   - Regenerar tipos TypeScript
   - Validar RLS policies

2. ✅ **Crear `alerts-service.ts`** (1 hora)
   - Implementar CRUD functions
   - Validar tipos con Supabase
   - Testing manual con Supabase Studio

3. ✅ **Crear `useAlerts` hook** (1.5 horas)
   - Implementar lógica de fetching
   - Implementar mutations
   - Auto-refresh después de mutations
   - Testing unitario

4. ✅ **Testing de integración** (30 min)
   - Validar hook con datos reales
   - Validar RLS funciona correctamente
   - Verificar auto-refresh

### Sprint 2: Migración de Componentes (1.5 horas)
5. ✅ **Migrar `alerts-center.tsx`** (45 min)
   - Reemplazar AlertService con useAlerts
   - Reemplazar MOCK_TABLES con useTables
   - Validar UI no rompe
   - Testing manual

6. ✅ **Migrar `notification-bell.tsx`** (30 min)
   - Reemplazar AlertService con useAlerts
   - Reemplazar MOCK_TABLES con useTables
   - Validar dropdown funciona
   - Testing manual

7. ✅ **Testing de integración completa** (15 min)
   - Crear alerta desde QR code
   - Verificar aparece en ambos componentes
   - Marcar como atendida desde notification-bell
   - Verificar desaparece de alerts-center

### Sprint 3: Documentación (30 min)
8. ✅ **Actualizar documentación**
   - Actualizar FASE_3_COMPLETADA.md
   - Documentar esquema de alerts
   - Documentar useAlerts API
   - Crear checklist de testing

---

## 🎯 Métricas Esperadas Post-Migración

### Fase 3 Completa (8/9 componentes)
- ✅ **Componentes migrados:** 8/9 (89%)
- ✅ **Componentes pendientes:** 1 (table-map.tsx pospuesto)
- ✅ **Hooks creados:** 6 (useTables, useZones, useOrders, useMenu, usePayments, useAlerts)
- ✅ **Reducción de código:** ~500 líneas
- ✅ **useEffect eliminados:** ~15
- ✅ **Imports legados eliminados:** ~22

### Nuevas Capacidades
- ✅ **Alertas persistentes:** Datos guardados en Supabase
- ✅ **Historial de alertas:** Ver alertas atendidas
- ✅ **Auditoría:** Saber quién atendió cada alerta
- ✅ **Multi-tenant:** Alertas aisladas por tenant

---

## ⚠️ Consideraciones Importantes

### Alertas y Real-time
- **Socket.io:** Mantener eventos de socket para actualizaciones en vivo
- **Fallback:** useAlerts debe funcionar sin socket (polling)
- **Optimistic Updates:** Considerar actualizar UI antes de respuesta del servidor

### Tipos y Compatibilidad
- **Alert.type:** Mantener mismo enum que mock-data.ts
- **Alert.createdAt:** Convertir string → Date en componentes si es necesario
- **Table lookup:** Usar useTables() para mapear table_id → table.number

### Testing
- **Unit Tests:** Hooks (useAlerts)
- **Integration Tests:** Componentes con hooks
- **E2E Tests:** Flujo completo de alerta (crear → mostrar → atender)

### Rollback Plan
- **Git branch:** Trabajar en `feature/alerts-migration`
- **Backup:** Mantener AlertService en mock-data.ts hasta validar
- **Feature flag:** Considerar flag para switch entre old/new system

---

## 📚 Recursos y Referencias

### Documentación Existente
- `docs/FASE_3_COMPLETADA.md` - Patrones y lecciones de componentes ya migrados
- `docs/FASE_3_PROGRESO.md` - Tracking de progreso
- `hooks/use-tables.ts` - Ejemplo de hook pattern a seguir
- `lib/services/tables-service.ts` - Ejemplo de servicio Supabase

### Comandos Útiles
```powershell
# Regenerar tipos Supabase
npx supabase gen types typescript --project-id [ID] > lib/supabase/database.types.ts

# Ejecutar migration
npx supabase db push

# Testing
npm test -- use-alerts.test.ts

# Type checking
npx tsc --noEmit

# Linting
npm run lint
```

---

## ✅ Checklist de Completación

### Infraestructura
- [ ] Tabla `alerts` creada en Supabase
- [ ] RLS policies validadas
- [ ] Tipos TypeScript regenerados
- [ ] `alerts-service.ts` implementado
- [ ] `useAlerts` hook creado
- [ ] Tests de hook pasando

### Componentes
- [ ] `alerts-center.tsx` migrado
- [ ] `notification-bell.tsx` migrado
- [ ] Imports legados eliminados
- [ ] TypeScript sin errores
- [ ] Testing manual completo

### Documentación
- [ ] FASE_3_COMPLETADA.md actualizado
- [ ] API de useAlerts documentada
- [ ] Esquema de alerts documentado
- [ ] Checklist de testing creado

### Validación
- [ ] Alertas se crean desde QR code
- [ ] Alertas aparecen en notification-bell
- [ ] Alertas aparecen en alerts-center
- [ ] Acknowledge funciona desde ambos componentes
- [ ] Historial de alertas funciona
- [ ] Real-time con socket.io funciona
- [ ] Auto-refresh después de mutations

---

## 🚀 Conclusión

### Prioridad Inmediata
1. **Crear useAlerts hook** (desbloquea 2 componentes)
2. **Migrar alerts-center.tsx**
3. **Migrar notification-bell.tsx**

### Decisión table-map.tsx
- **Postponer para Fase 4** por complejidad y bajo impacto
- Requiere refactoring estructural de tipos
- No crítico para operaciones diarias

### Timeline Estimado
- **Infraestructura de alertas:** 3-4 horas
- **Migración de componentes:** 1.5 horas
- **Documentación:** 30 minutos
- **TOTAL:** 5-6 horas de trabajo enfocado

### Resultado Final Fase 3
- **8/9 componentes migrados (89%)**
- **6 hooks disponibles**
- **Sistema de alertas persistente**
- **Preparado para Fase 4 (Optimización)**

---

**Documento creado:** 2024  
**Última actualización:** 2024  
**Responsable:** Equipo de Desarrollo  
**Estado:** ✅ Listo para ejecución
