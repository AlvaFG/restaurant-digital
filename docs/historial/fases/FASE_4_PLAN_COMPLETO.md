# 🚀 FASE 4 - PLAN COMPLETO

**Fecha de Creación:** 16 de Octubre de 2025  
**Estado:** 📋 **PLANIFICACIÓN**  
**Contexto:** Post-implementación exitosa del sistema de alertas en Fase 3

---

## 📊 Contexto: ¿Dónde Estamos?

### ✅ Lo que se Completó en Fase 3

#### Componentes Migrados: **8/9 (89%)**
1. ✅ `table-list.tsx` → useTables + useZones
2. ✅ `add-table-dialog.tsx` → useTables + useZones
3. ✅ `zones-management.tsx` → useZones
4. ✅ `salon-zones-panel.tsx` → useTables
5. ✅ `order-form.tsx` → useOrders + useTables + useMenu
6. ✅ `salon-live-view.tsx` → useOrders + useTables
7. ✅ `alerts-center.tsx` → useAlerts + useTables *(NUEVO)*
8. ✅ `notification-bell.tsx` → useAlerts + useTables *(NUEVO)*

#### Infraestructura Completada
- ✅ **6 Hooks Operacionales:**
  - `useTables` - Gestión de mesas
  - `useZones` - Gestión de zonas
  - `useOrders` - Gestión de pedidos
  - `useMenu` - Catálogo de menú
  - `useAuth` - Autenticación
  - `useAlerts` - **Sistema de alertas (nuevo)**

- ✅ **Servicios Supabase:**
  - `lib/services/tables-service.ts` (287 líneas, 9 funciones)
  - `lib/services/zones-service.ts` (237 líneas, 7 funciones)
  - `lib/services/orders-service.ts` (450+ líneas, 8 funciones)
  - `lib/services/menu-service.ts` (250+ líneas, 6 funciones)
  - `lib/services/payments-service.ts` (300+ líneas, 8 funciones)
  - `lib/services/alerts-service.ts` (265 líneas, 9 funciones) **NUEVO**

- ✅ **Base de Datos:**
  - Tabla `alerts` creada con RLS, índices, triggers
  - 14 tablas en total operacionales
  - Multi-tenancy funcionando correctamente

### 🔴 Componente Pendiente: **1/9 (11%)**

**`table-map.tsx`** - Componente visual complejo
- **Líneas:** 691
- **Tecnología:** React Konva (canvas interactivo)
- **Legacy usado:** `MOCK_TABLES`, `MOCK_TABLE_LAYOUT`, `table-service.ts` (legacy)
- **Funcionalidad:** Drag-and-drop visual de mesas en canvas
- **Complejidad:** 🔴 ALTA

---

## 🎯 Objetivos de la Fase 4

### Objetivo Principal
**Completar la migración al 100% y optimizar el sistema completo**

### Objetivos Específicos

1. **📦 Migración Completa (100%)**
   - Migrar `table-map.tsx` a arquitectura de hooks
   - Eliminar todas las dependencias legacy
   - Alcanzar 9/9 componentes migrados

2. **🧹 Limpieza de Código Legacy**
   - Eliminar archivos legacy innecesarios
   - Consolidar tipos duplicados
   - Remover imports no utilizados

3. **⚡ Optimización de Performance**
   - Implementar caché inteligente
   - Optimistic updates mejorados
   - Lazy loading estratégico
   - Code splitting

4. **✅ Testing y Validación**
   - Unit tests para hooks críticos
   - Integration tests para flujos
   - E2E tests para operaciones críticas
   - Testing del sistema de alertas

5. **📚 Documentación Completa**
   - Guías de desarrollo
   - API documentation
   - Migration guides
   - Best practices

---

## 📋 Plan Detallado de Fase 4

### **ETAPA 4.1: Migración de table-map.tsx** 🎨

#### Análisis del Componente

**Estado Actual:**
```typescript
// components/table-map.tsx (691 líneas)
import { MOCK_TABLE_LAYOUT, MOCK_TABLES } from "@/lib/mock-data"
import { fetchLayout, persistLayout } from "@/lib/table-service"

const [tables, setTables] = useState<Table[]>([])
const [layout, setLayout] = useState<TableMapLayout | null>(null)

useEffect(() => {
  const load = async () => {
    const response = await fetchLayout()
    setLayout(response.layout || MOCK_TABLE_LAYOUT)
    setTables(response.tables || MOCK_TABLES)
  }
  load()
}, [])
```

**Funcionalidades Críticas:**
- ✅ Drag-and-drop de mesas en canvas 2D
- ✅ Editor visual de layout (modo edición)
- ✅ Guardado de posiciones y configuraciones
- ✅ Undo/redo de cambios
- ✅ Añadir/eliminar mesas desde canvas
- ✅ Vista en tiempo real del estado de mesas
- ✅ Zonas visuales coloreadas

#### Estrategia de Migración

**Opción A: Crear useTableLayout hook** *(Recomendado)*

```typescript
// hooks/use-table-layout.ts
export function useTableLayout() {
  const { tables } = useTables()
  const [layout, setLayout] = useState<TableMapLayout | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  
  // Fetch layout from Supabase
  const fetchLayout = useCallback(async () => {
    const data = await fetchLayoutFromSupabase(tenantId)
    setLayout(data)
    setIsLoading(false)
  }, [tenantId])
  
  // Save layout to Supabase
  const saveLayout = useCallback(async (newLayout: TableMapLayout) => {
    await saveLayoutToSupabase(tenantId, newLayout)
    setLayout(newLayout)
  }, [tenantId])
  
  return {
    tables,        // From useTables
    layout,        // Local layout state
    isLoading,
    saveLayout,
    fetchLayout,
  }
}
```

**Migración del Componente:**
```typescript
// components/table-map.tsx (refactorizado)
import { useTables } from "@/hooks/use-tables"
import { useTableLayout } from "@/hooks/use-table-layout"

export function TableMap({ onTableClick, editable = false }: TableMapProps) {
  const { tables } = useTables()
  const { layout, isLoading, saveLayout } = useTableLayout()
  
  // Toda la lógica de Konva se mantiene igual
  // Solo cambia de dónde vienen los datos
  
  const handleSave = async () => {
    await saveLayout(layout)
    toast.success("Layout guardado")
  }
  
  return (
    // ... JSX de Konva sin cambios
  )
}
```

**Opción B: Integrar layout en useTables** *(Alternativa)*

```typescript
// hooks/use-tables.ts (extendido)
export function useTables() {
  // ... funcionalidad existente
  
  // Añadir gestión de layout
  const [layout, setLayout] = useState<TableMapLayout | null>(null)
  
  const fetchLayout = useCallback(async () => {
    // Fetch desde Supabase
  }, [tenantId])
  
  const saveLayout = useCallback(async (newLayout) => {
    // Save a Supabase
  }, [tenantId])
  
  return {
    // ... exports existentes
    layout,
    fetchLayout,
    saveLayout,
  }
}
```

#### Tareas de Migración

**Sub-tarea 4.1.1: Crear servicio de layouts**
- [ ] Crear `lib/services/layouts-service.ts`
- [ ] Funciones: `getLayout()`, `saveLayout()`, `deleteLayout()`
- [ ] Tipos: `TableMapLayout` migrados a `database.types.ts`

**Sub-tarea 4.1.2: Crear hook useTableLayout**
- [ ] Crear `hooks/use-table-layout.ts`
- [ ] Implementar fetch/save/delete
- [ ] Testing del hook

**Sub-tarea 4.1.3: Migrar table-map.tsx**
- [ ] Reemplazar imports legacy
- [ ] Usar `useTables` + `useTableLayout`
- [ ] Eliminar `MOCK_TABLE_LAYOUT` y `MOCK_TABLES`
- [ ] Probar drag-and-drop funciona
- [ ] Probar save/load funciona
- [ ] Probar undo/redo funciona

**Sub-tarea 4.1.4: Testing visual**
- [ ] Abrir `/salon` → Tab "Mapa"
- [ ] Activar modo edición
- [ ] Drag mesa a nueva posición
- [ ] Guardar layout
- [ ] Recargar página
- [ ] Verificar posiciones persisten

**Estimación:** 3-4 horas

---

### **ETAPA 4.2: Limpieza de Archivos Legacy** 🧹

#### Archivos a Revisar/Eliminar

**Categoría 1: Legacy Services (Verificar uso)**
```
lib/
├── ❓ table-service.ts      → Revisar si aún se usa en table-map.tsx
├── ❓ zones-service.ts      → Revisar si es duplicado de services/zones-service.ts
├── ❓ order-service.ts      → Probablemente legacy
├── ❓ menu-service.ts       → Probablemente legacy
├── ❓ payment-service.ts    → Probablemente legacy
└── ❓ alert-service.ts      → ELIMINAR (ya tenemos services/alerts-service.ts)
```

**Categoría 2: Mock Data**
```
lib/
└── ❓ mock-data.ts          → Mantener tipos, eliminar MOCK_* constants
```

**Categoría 3: Server Stores (Ya no se usan)**
```
lib/server/
├── ❌ order-store.ts        → ELIMINAR (todo en Supabase)
├── ❌ menu-store.ts         → ELIMINAR
├── ❌ table-store.ts        → ELIMINAR
├── ❌ zones-store.ts        → ELIMINAR
└── ❌ payment-store.ts      → ELIMINAR
```

**Categoría 4: Data Files Legacy**
```
data/
├── ❌ menu-store.json       → ELIMINAR
├── ❌ order-store.json      → ELIMINAR
└── ❌ table-store.json      → ELIMINAR
```

#### Plan de Limpieza

**Paso 1: Análisis de Dependencias**
```bash
# Buscar todos los imports de archivos legacy
grep -r "from.*lib/table-service" components/ app/
grep -r "from.*lib/server" components/ app/
grep -r "MOCK_TABLES\|MOCK_ZONES" components/ app/
```

**Paso 2: Migración de Últimos Usos**
- Identificar componentes que aún usen legacy
- Migrar uno por uno
- Validar con tests

**Paso 3: Eliminación Gradual**
- Eliminar archivos con 0 referencias
- Commit por cada archivo eliminado
- Verificar build exitoso

**Paso 4: Consolidación de Tipos**
- Mover todos los tipos a `database.types.ts`
- Eliminar tipos duplicados
- Crear type helpers si es necesario

**Estimación:** 2-3 horas

---

### **ETAPA 4.3: Optimización de Performance** ⚡

#### Problema 1: Re-renders Innecesarios

**Solución: React Query / SWR**
```bash
npm install @tanstack/react-query
```

```typescript
// hooks/use-tables.ts (con React Query)
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'

export function useTables(options?: UseTablesOptions) {
  const queryClient = useQueryClient()
  
  // Caché automático + deduplicación
  const { data: tables, isLoading, error } = useQuery({
    queryKey: ['tables', tenantId, options],
    queryFn: () => getTables(tenantId, options),
    staleTime: 30000, // 30 segundos
    refetchOnWindowFocus: true,
  })
  
  // Optimistic updates
  const createMutation = useMutation({
    mutationFn: (data) => createTable(tenantId, data),
    onMutate: async (newTable) => {
      // Cancelar queries en curso
      await queryClient.cancelQueries({ queryKey: ['tables'] })
      
      // Snapshot del valor anterior
      const previousTables = queryClient.getQueryData(['tables'])
      
      // Optimistic update
      queryClient.setQueryData(['tables'], (old) => [...old, newTable])
      
      return { previousTables }
    },
    onError: (err, newTable, context) => {
      // Rollback en caso de error
      queryClient.setQueryData(['tables'], context.previousTables)
    },
    onSuccess: () => {
      // Invalidar y refetch
      queryClient.invalidateQueries({ queryKey: ['tables'] })
    },
  })
  
  return {
    tables: tables ?? [],
    isLoading,
    error,
    createTable: createMutation.mutate,
  }
}
```

**Beneficios:**
- ✅ Caché automático entre componentes
- ✅ Deduplicación de requests
- ✅ Optimistic updates
- ✅ Rollback automático en errores
- ✅ Background refetch
- ✅ DevTools para debugging

#### Problema 2: Componentes Pesados

**Solución: Code Splitting y Lazy Loading**
```typescript
// app/salon/page.tsx
import dynamic from 'next/dynamic'
import { LoadingSpinner } from '@/components/loading-spinner'

// Lazy load del componente pesado
const TableMap = dynamic(
  () => import('@/components/table-map').then(mod => ({ default: mod.TableMap })),
  {
    loading: () => <LoadingSpinner />,
    ssr: false, // Canvas no funciona en SSR
  }
)

export default function SalonPage() {
  return (
    <Tabs defaultValue="estado">
      <TabsContent value="mapa">
        <TableMap editable onTableClick={handleClick} />
      </TabsContent>
    </Tabs>
  )
}
```

#### Problema 3: Renders Innecesarios en Listas

**Solución: Memoization**
```typescript
// components/table-list.tsx
import { memo, useMemo } from 'react'

const TableRow = memo(function TableRow({ table, onAction }: Props) {
  return (
    <TableRow>
      <TableCell>{table.number}</TableCell>
      {/* ... */}
    </TableRow>
  )
})

export function TableList() {
  const { tables } = useTables()
  
  // Memoizar cálculos pesados
  const sortedTables = useMemo(
    () => [...tables].sort((a, b) => a.number - b.number),
    [tables]
  )
  
  return sortedTables.map(table => (
    <TableRow key={table.id} table={table} onAction={handleAction} />
  ))
}
```

**Estimación:** 4-5 horas

---

### **ETAPA 4.4: Testing Completo** ✅

#### Unit Tests para Hooks

**Archivo:** `hooks/__tests__/use-alerts.test.ts`
```typescript
import { renderHook, waitFor } from '@testing-library/react'
import { useAlerts } from '../use-alerts'

describe('useAlerts', () => {
  it('should fetch alerts on mount', async () => {
    const { result } = renderHook(() => useAlerts())
    
    await waitFor(() => {
      expect(result.current.isLoading).toBe(false)
    })
    
    expect(result.current.alerts).toBeDefined()
  })
  
  it('should create alert successfully', async () => {
    const { result } = renderHook(() => useAlerts())
    
    await waitFor(() => !result.current.isLoading)
    
    await result.current.createAlert({
      table_id: 'test-id',
      type: 'llamar_mozo',
      message: 'Test alert'
    })
    
    expect(result.current.alerts).toHaveLength(1)
  })
})
```

#### Integration Tests

**Archivo:** `tests/integration/alerts-flow.test.tsx`
```typescript
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { AlertsCenter } from '@/components/alerts-center'

describe('Alerts Flow', () => {
  it('should create and acknowledge alert', async () => {
    render(<AlertsCenter />)
    
    // Esperar carga
    await waitFor(() => {
      expect(screen.queryByText('Cargando...')).not.toBeInTheDocument()
    })
    
    // Crear alerta
    const alertMessage = await screen.findByText('Mesa 5 solicita mozo')
    expect(alertMessage).toBeInTheDocument()
    
    // Confirmar alerta
    const confirmBtn = screen.getByRole('button', { name: /confirmar/i })
    fireEvent.click(confirmBtn)
    
    // Verificar movida a historial
    await waitFor(() => {
      expect(screen.queryByText('Mesa 5 solicita mozo')).not.toBeInTheDocument()
    })
  })
})
```

#### E2E Tests (Playwright)

**Archivo:** `tests/e2e/alerts.spec.ts`
```typescript
import { test, expect } from '@playwright/test'

test('complete alerts workflow', async ({ page }) => {
  // Login
  await page.goto('/login')
  await page.fill('[name=email]', 'admin@admin.com')
  await page.fill('[name=password]', '123456')
  await page.click('button[type=submit]')
  
  // Navegar a alertas
  await page.goto('/alertas')
  
  // Verificar carga de alertas
  await expect(page.locator('.alert-card')).toHaveCount(3)
  
  // Confirmar primera alerta
  await page.click('.alert-card:first-child button:has-text("Confirmar")')
  
  // Verificar desaparece de activas
  await expect(page.locator('.alert-card')).toHaveCount(2)
  
  // Verificar aparece en historial
  await page.click('button:has-text("Historial")')
  await expect(page.locator('.alert-card')).toHaveCount(1)
})
```

**Estimación:** 5-6 horas

---

### **ETAPA 4.5: Documentación Completa** 📚

#### Documentos a Crear/Actualizar

**1. Guía de Desarrollo con Hooks**
- `docs/guides/DEVELOPMENT_WITH_HOOKS.md`
- Cómo crear nuevos hooks
- Patrones y best practices
- Ejemplos de uso

**2. API Documentation**
- `docs/api/HOOKS_API.md`
- Documentación completa de cada hook
- Parámetros, retorno, ejemplos

**3. Migration Guide**
- `docs/guides/MIGRATION_GUIDE.md`
- Cómo migrar componentes legacy
- Checklist de migración
- Troubleshooting común

**4. Architecture Overview**
- `docs/architecture/HOOKS_ARCHITECTURE.md`
- Diagrama de flujo de datos
- Explicación de capas
- Decisiones de diseño

**5. Testing Guide**
- `docs/guides/TESTING_GUIDE.md`
- Cómo testear hooks
- Cómo testear componentes
- Setup de tests

**Estimación:** 3-4 horas

---

## 📊 Resumen de Fase 4

### Tareas Totales

| Etapa | Descripción | Estimación | Prioridad |
|-------|-------------|------------|-----------|
| 4.1 | Migración de table-map.tsx | 3-4 horas | 🔴 ALTA |
| 4.2 | Limpieza de archivos legacy | 2-3 horas | 🟡 MEDIA |
| 4.3 | Optimización de performance | 4-5 horas | 🟡 MEDIA |
| 4.4 | Testing completo | 5-6 horas | 🟢 BAJA |
| 4.5 | Documentación | 3-4 horas | 🟢 BAJA |
| **TOTAL** | | **17-22 horas** | |

### Hitos de Fase 4

- [ ] **Hito 1:** 9/9 componentes migrados (100%)
- [ ] **Hito 2:** 0 archivos legacy en uso
- [ ] **Hito 3:** React Query implementado
- [ ] **Hito 4:** 80%+ code coverage en tests
- [ ] **Hito 5:** Documentación completa publicada

---

## 🚦 Orden de Ejecución Recomendado

### Sprint 1 (Migración Completa) - Días 1-2
1. ✅ **Sub-tarea 4.1.1:** Crear layouts-service.ts
2. ✅ **Sub-tarea 4.1.2:** Crear useTableLayout hook
3. ✅ **Sub-tarea 4.1.3:** Migrar table-map.tsx
4. ✅ **Sub-tarea 4.1.4:** Testing visual del componente
5. ✅ **Checkpoint:** 9/9 componentes migrados ✨

### Sprint 2 (Limpieza y Optimización) - Días 3-4
6. ✅ **Etapa 4.2:** Eliminar archivos legacy
7. ✅ **Etapa 4.3:** Implementar React Query
8. ✅ **Etapa 4.3:** Code splitting y lazy loading
9. ✅ **Checkpoint:** Performance mejorado, código limpio

### Sprint 3 (Testing y Docs) - Días 5-6
10. ✅ **Etapa 4.4:** Unit tests para hooks
11. ✅ **Etapa 4.4:** Integration tests
12. ✅ **Etapa 4.4:** E2E tests críticos
13. ✅ **Etapa 4.5:** Documentación completa
14. ✅ **Checkpoint:** Sistema testeado y documentado

---

## 🎯 Criterios de Éxito

### Técnicos
- ✅ 9/9 componentes migrados (100%)
- ✅ 0 imports de archivos legacy
- ✅ 0 errores de TypeScript
- ✅ Build exitoso sin warnings
- ✅ Todos los tests pasando

### Performance
- ✅ Time to Interactive < 2s
- ✅ First Contentful Paint < 1s
- ✅ Lighthouse score > 90
- ✅ Bundle size reducido 15%+

### Código
- ✅ Code coverage > 80%
- ✅ 0 archivos legacy en uso
- ✅ Tipos 100% desde database.types.ts
- ✅ Linting sin errores

### Documentación
- ✅ 5 guías completas publicadas
- ✅ API docs para todos los hooks
- ✅ README actualizado
- ✅ Architecture diagrams creados

---

## 🔮 Post-Fase 4: ¿Qué Sigue?

### Fase 5: Features Avanzados
1. **Real-time Optimization**
   - WebSocket connection pooling
   - Optimistic UI updates mejorados
   - Conflict resolution

2. **Advanced Analytics**
   - Dashboard de métricas
   - Reportes automáticos
   - Predicciones con ML

3. **Mobile Apps**
   - React Native app para staff
   - PWA optimizado para tablets
   - Offline-first architecture

4. **Multi-tenant Enhancements**
   - Tenant switching UI
   - Per-tenant customization
   - White-label capabilities

---

## 📝 Notas Importantes

### Dependencias Críticas
- ✅ Sistema de alertas debe estar 100% operacional antes de empezar
- ✅ Testing manual de alertas completado
- ✅ Supabase stable y con buena performance

### Riesgos
- 🔴 **table-map.tsx:** Complejidad visual alta, requiere testing exhaustivo
- 🟡 **React Query:** Cambio arquitectónico, requiere refactor de todos los hooks
- 🟡 **Tests:** Pueden descubrir bugs existentes que necesiten fixes

### Recomendaciones
1. **Hacer backup antes de empezar Fase 4**
2. **Crear branch `feature/fase-4` separado**
3. **Commits pequeños y frecuentes**
4. **Testing manual después de cada sub-tarea**
5. **Code review antes de merge a main**

---

## 🎉 Conclusión

La Fase 4 representa el **cierre del ciclo de migración** iniciado en Fase 1. Al completarla, tendremos:

- ✨ **Sistema 100% moderno** con hooks y Supabase
- ✨ **0 código legacy** en producción
- ✨ **Performance optimizado** con caché inteligente
- ✨ **Tests completos** para confiabilidad
- ✨ **Documentación profesional** para el equipo

**¡Es el momento de cerrar con éxito esta transformación arquitectónica!** 🚀

---

**Última actualización:** 16 de Octubre de 2025  
**Versión:** 1.0  
**Autor:** Sistema de Planificación de Fases
