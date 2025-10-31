# Plan de Acción - Mejora de Botones con Integración Supabase

**Fecha de creación**: 31 de Octubre de 2025  
**Basado en**: RELEVAMIENTO_BOTONES_SUPABASE_RESULTADOS.md  
**Sprint objetivo**: Siguientes 2-3 sprints

---

## Resumen Ejecutivo

Este plan de acción prioriza las 15 tareas identificadas en el relevamiento de botones, organizadas por impacto y esfuerzo. Se estima **40-60 horas** de trabajo total.

### Timeline General

```
Sprint 1 (2 semanas):  Items 🔴 Urgentes (1-3)
Sprint 2 (2 semanas):  Items 🟡 Importantes (4-6)
Sprint 3 (1 semana):   Items 🟢 Mejoras (7-9)
Ongoing:               Items de calidad (10-15)
```

---

## 🔴 Sprint 1: Issues Críticos (Semanas 1-2)

### TAREA 1: Implementar CRUD Completo del Menú

**Prioridad**: 🔴 CRÍTICA  
**Impacto**: Alto - Funcionalidad bloqueante  
**Esfuerzo**: 16 horas  
**Responsable**: Backend + Frontend Dev  
**Deadline**: Fin de Sprint 1

#### Descripción
El módulo de menú actualmente solo muestra datos pero no permite crear, editar ni eliminar items. Esto bloquea la gestión del restaurante.

#### Archivos a Modificar
- `app/menu/page.tsx` (handlers)
- **Crear**: `components/menu-item-dialog.tsx` (formulario)
- **Crear**: `components/menu-category-dialog.tsx` (categorías)
- **Crear**: `hooks/use-menu.ts` (lógica de negocio)
- `lib/supabase/database.types.ts` (verificar tipos)

#### Subtareas

##### 1.1 Crear Hook `useMenu` (4 horas)
```typescript
// hooks/use-menu.ts
export function useMenu() {
  const [items, setItems] = useState<MenuItem[]>([])
  const [categories, setCategories] = useState<MenuCategory[]>([])
  const [loading, setLoading] = useState(false)
  
  const createItem = async (data: CreateItemInput) => { /* ... */ }
  const updateItem = async (id: string, data: UpdateItemInput) => { /* ... */ }
  const deleteItem = async (id: string) => { /* ... */ }
  
  const createCategory = async (data: CreateCategoryInput) => { /* ... */ }
  const updateCategory = async (id: string, data: UpdateCategoryInput) => { /* ... */ }
  const deleteCategory = async (id: string) => { /* ... */ }
  
  return { items, categories, loading, createItem, updateItem, deleteItem, createCategory, updateCategory, deleteCategory }
}
```

**Checklist**:
- [ ] Implementar `createItem` con validaciones
- [ ] Implementar `updateItem` con validaciones
- [ ] Implementar `deleteItem` con confirmación
- [ ] Implementar CRUD de categorías
- [ ] Manejo de errores con try-catch
- [ ] Loading states
- [ ] Tipos TypeScript completos

##### 1.2 Crear Componente de Formulario de Item (4 horas)
```typescript
// components/menu-item-dialog.tsx
interface MenuItemDialogProps {
  item?: MenuItem // undefined para crear, con valor para editar
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess?: (item: MenuItem) => void
}
```

**Campos del formulario**:
- Nombre (required, max 100 chars)
- Descripción (optional, max 500 chars)
- Precio (required, number, min 0)
- Categoría (required, select)
- Disponible (boolean, default true)
- Tags (array, optional)
- Imagen (opcional, upload - Fase 2)

**Checklist**:
- [ ] Formulario con validaciones
- [ ] Preview de datos
- [ ] Loading state en submit
- [ ] Manejo de errores
- [ ] Integración con `useMenu`

##### 1.3 Crear Componente de Formulario de Categoría (3 horas)
```typescript
// components/menu-category-dialog.tsx
interface MenuCategoryDialogProps {
  category?: MenuCategory
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess?: (category: MenuCategory) => void
}
```

**Campos**:
- Nombre (required)
- Descripción (optional)
- Orden (number, para sorting)

**Checklist**:
- [ ] Formulario simple
- [ ] Validaciones
- [ ] Integración con `useMenu`

##### 1.4 Integrar con Página de Menú (3 horas)

**Modificar** `app/menu/page.tsx`:

```typescript
const { items, categories, createItem, updateItem, deleteItem } = useMenu()

const handleAddItem = () => {
  setEditingItem(null)
  setShowItemDialog(true)
}

const handleEditItem = (item: MenuItem) => {
  setEditingItem(item)
  setShowItemDialog(true)
}

const handleDeleteItem = (item: MenuItem) => {
  setItemToDelete(item)
  setShowDeleteDialog(true)
}

const confirmDelete = async () => {
  if (!itemToDelete) return
  
  setIsDeleting(true)
  try {
    await deleteItem(itemToDelete.id)
    toast({ title: "Item eliminado" })
    setItemToDelete(null)
  } catch (error) {
    toast({ title: "Error", variant: "destructive" })
  } finally {
    setIsDeleting(false)
  }
}
```

**Checklist**:
- [ ] Reemplazar handlers stub por reales
- [ ] Agregar estados necesarios
- [ ] Integrar dialogs
- [ ] AlertDialog para eliminación
- [ ] Tests manuales completos

##### 1.5 Testing y Validación (2 horas)

**Casos de prueba**:
- [ ] Crear item con datos válidos
- [ ] Crear item con datos inválidos (validación)
- [ ] Editar item existente
- [ ] Eliminar item (con confirmación)
- [ ] Crear categoría
- [ ] Eliminar categoría con items (debe fallar o reasignar)
- [ ] Manejo de errores de red
- [ ] Manejo de errores de permisos (RLS)

#### Criterios de Aceptación
- ✅ Se pueden crear items del menú
- ✅ Se pueden editar items existentes
- ✅ Se pueden eliminar items (con confirmación)
- ✅ Se pueden gestionar categorías
- ✅ Validaciones funcionan correctamente
- ✅ Loading states visibles
- ✅ Mensajes de error descriptivos
- ✅ Toast notifications en todas las acciones

#### Riesgos
- ⚠️ Permisos RLS pueden no estar configurados correctamente
- ⚠️ Esquema de BD puede necesitar ajustes

---

### TAREA 2: Integrar Gestión de Usuarios con Supabase

**Prioridad**: 🔴 ALTA  
**Impacto**: Alto - Datos no persisten  
**Esfuerzo**: 8 horas  
**Responsable**: Backend Dev  
**Deadline**: Fin de Sprint 1

#### Descripción
El componente `users-management.tsx` actualmente usa mock data. Necesita integrarse con Supabase para persistir datos reales.

#### Archivos a Modificar
- `components/users-management.tsx`
- **Crear**: `hooks/use-users.ts` (opcional, recomendado)
- Verificar: Tabla `users` en Supabase
- Verificar: Políticas RLS para `users`

#### Subtareas

##### 2.1 Crear/Verificar Tabla de Usuarios (2 horas)

**Schema esperado**:
```sql
-- users table (puede ya existir via Supabase Auth)
create table if not exists public.users (
  id uuid primary key references auth.users(id) on delete cascade,
  email text unique not null,
  name text not null,
  role text not null check (role in ('admin', 'staff')),
  active boolean default true,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

-- RLS Policies
alter table public.users enable row level security;

-- Solo admins pueden ver todos los usuarios
create policy "Admins can view all users"
  on public.users for select
  using (
    exists (
      select 1 from public.users
      where id = auth.uid() and role = 'admin'
    )
  );

-- Solo admins pueden crear usuarios
create policy "Admins can create users"
  on public.users for insert
  with check (
    exists (
      select 1 from public.users
      where id = auth.uid() and role = 'admin'
    )
  );

-- Solo admins pueden actualizar usuarios
create policy "Admins can update users"
  on public.users for update
  using (
    exists (
      select 1 from public.users
      where id = auth.uid() and role = 'admin'
    )
  );

-- Solo admins pueden eliminar usuarios
create policy "Admins can delete users"
  on public.users for delete
  using (
    exists (
      select 1 from public.users
      where id = auth.uid() and role = 'admin'
    )
  );
```

**Checklist**:
- [ ] Verificar/crear tabla `users`
- [ ] Configurar RLS policies
- [ ] Testear políticas con diferentes roles
- [ ] Documentar estructura

##### 2.2 Crear Hook `useUsers` (2 horas)

```typescript
// hooks/use-users.ts
import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { logger } from '@/lib/logger'

export function useUsers() {
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<Error | null>(null)
  const supabase = createClient()
  
  const loadUsers = async () => {
    setLoading(true)
    setError(null)
    try {
      const { data, error: fetchError } = await supabase
        .from('users')
        .select('*')
        .order('created_at', { ascending: false })
      
      if (fetchError) throw fetchError
      setUsers(data || [])
    } catch (err) {
      logger.error('Error loading users', err as Error)
      setError(err as Error)
    } finally {
      setLoading(false)
    }
  }
  
  const createUser = async (userData: CreateUserInput) => {
    // Implementar con Auth Admin API
    // Nota: Crear usuario en auth.users Y en public.users
  }
  
  const updateUser = async (userId: string, updates: UpdateUserInput) => {
    // ...
  }
  
  const deleteUser = async (userId: string) => {
    // Validar que no sea el último admin
    // ...
  }
  
  useEffect(() => {
    loadUsers()
  }, [])
  
  return { users, loading, error, createUser, updateUser, deleteUser, reload: loadUsers }
}
```

**Checklist**:
- [ ] Implementar `loadUsers`
- [ ] Implementar `createUser` (con Supabase Auth Admin)
- [ ] Implementar `updateUser`
- [ ] Implementar `deleteUser` con validaciones
- [ ] Validar último admin
- [ ] Manejo de errores
- [ ] Tipos TypeScript

##### 2.3 Integrar Hook en Componente (3 horas)

**Modificar** `components/users-management.tsx`:

```typescript
// Reemplazar useState de mock data
const { users, loading, createUser, updateUser, deleteUser } = useUsers()

const handleCreateUser = async () => {
  if (!formData.name || !formData.email) {
    toast({ title: 'Completa todos los campos', variant: 'destructive' })
    return
  }
  
  setIsSubmitting(true)
  try {
    await createUser(formData)
    toast({ title: 'Usuario creado' })
    setIsDialogOpen(false)
    resetForm()
  } catch (error) {
    toast({
      title: 'Error al crear usuario',
      description: error instanceof Error ? error.message : 'Error desconocido',
      variant: 'destructive'
    })
  } finally {
    setIsSubmitting(false)
  }
}

// Similar para update y delete
```

**Checklist**:
- [ ] Reemplazar handlers mock
- [ ] Agregar validaciones
- [ ] Loading states
- [ ] Confirmación de eliminación con AlertDialog
- [ ] Validar último admin en UI
- [ ] Tests manuales

##### 2.4 Testing (1 hora)

**Casos de prueba**:
- [ ] Listar usuarios (con permisos admin)
- [ ] Listar usuarios (sin permisos - debe fallar)
- [ ] Crear usuario con datos válidos
- [ ] Crear usuario con email duplicado (debe fallar)
- [ ] Editar usuario
- [ ] Intentar eliminar último admin (debe fallar)
- [ ] Eliminar usuario no-admin
- [ ] Manejo de errores de red

#### Criterios de Aceptación
- ✅ Los datos persisten en Supabase
- ✅ Solo admins pueden gestionar usuarios
- ✅ No se puede eliminar el último admin
- ✅ Validaciones funcionan
- ✅ Loading y error states
- ✅ RLS policies protegen los datos

---

### TAREA 3: Completar Funcionalidad "Invitar la Casa"

**Prioridad**: 🔴 MEDIA-ALTA  
**Impacto**: Medio - TODO en producción  
**Esfuerzo**: 4 horas  
**Responsable**: Backend Dev  
**Deadline**: Fin de Sprint 1

#### Descripción
Actualmente solo cambia el estado de la mesa a "libre", pero debería registrar la transacción como cortesía para auditoría y reporting.

#### Archivos a Modificar
- `components/table-list.tsx`
- `hooks/use-tables.ts`
- **Verificar**: Tabla `transactions` o crear si no existe

#### Subtareas

##### 3.1 Crear/Verificar Tabla de Transacciones (1 hora)

```sql
create table if not exists public.transactions (
  id uuid primary key default uuid_generate_v4(),
  table_id uuid references public.tables(id) on delete cascade,
  type text not null check (type in ('sale', 'courtesy', 'void')),
  amount numeric(10,2) default 0,
  reason text,
  created_by uuid references public.users(id),
  created_at timestamp with time zone default now()
);

create index idx_transactions_table_id on public.transactions(table_id);
create index idx_transactions_type on public.transactions(type);
create index idx_transactions_created_at on public.transactions(created_at);
```

**Checklist**:
- [ ] Verificar/crear tabla
- [ ] Configurar RLS
- [ ] Agregar índices

##### 3.2 Implementar `inviteHouse` en Hook (2 horas)

```typescript
// hooks/use-tables.ts
const inviteHouse = async (tableId: string, reason?: string) => {
  const supabase = createClient()
  
  try {
    // 1. Crear registro de transacción
    const { error: txError } = await supabase
      .from('transactions')
      .insert({
        table_id: tableId,
        type: 'courtesy',
        amount: 0,
        reason: reason || 'Invitación de la casa',
        created_by: (await supabase.auth.getUser()).data.user?.id
      })
    
    if (txError) throw txError
    
    // 2. Actualizar estado de mesa
    const { error: updateError } = await supabase
      .from('tables')
      .update({ 
        status: 'libre',
        updated_at: new Date().toISOString()
      })
      .eq('id', tableId)
    
    if (updateError) throw updateError
    
    // 3. Actualizar estado local
    setTables(prev => prev.map(t => 
      t.id === tableId ? { ...t, status: 'libre' } : t
    ))
    
  } catch (error) {
    logger.error('Error inviting house', error as Error)
    throw error
  }
}
```

**Checklist**:
- [ ] Implementar lógica completa
- [ ] Crear transacción
- [ ] Actualizar estado de mesa
- [ ] Logging completo
- [ ] Manejo de errores

##### 3.3 Actualizar Componente (1 hora)

```typescript
// components/table-list.tsx
const handleInviteHouse = async () => {
  if (!selectedTable) return
  
  setIsProcessingAction(true)
  try {
    logger.info('Invitando la casa', { 
      tableId: selectedTable.id,
      tableNumber: selectedTable.number,
      userId: user?.id
    })
    
    // ✅ Usar nueva función completa
    await inviteHouse(selectedTable.id, 'Cortesía del restaurante')
    
    logger.info('Casa invitada exitosamente')
    
    // ✅ Agregar toast
    toast({
      title: 'Mesa invitada',
      description: `La mesa ${selectedTable.number} fue marcada como cortesía.`
    })
    
    setShowInviteDialog(false)
    setSelectedTableId(null)
  } catch (actionError) {
    logger.error('Error al invitar la casa', actionError as Error)
    
    // ✅ Toast de error
    toast({
      title: 'Error',
      description: 'No se pudo registrar la invitación. Intenta nuevamente.',
      variant: 'destructive'
    })
  } finally {
    setIsProcessingAction(false)
  }
}
```

**Checklist**:
- [ ] Usar función `inviteHouse` del hook
- [ ] Agregar toast de éxito
- [ ] Agregar toast de error
- [ ] Remover TODO comment

#### Criterios de Aceptación
- ✅ Se crea registro de transacción tipo "courtesy"
- ✅ Mesa se marca como libre
- ✅ Se registra usuario que ejecutó la acción
- ✅ Logging completo para auditoría
- ✅ Feedback visual al usuario

---

## 🟡 Sprint 2: Issues Importantes (Semanas 3-4)

### TAREA 4: Estandarizar Confirmaciones (AlertDialog)

**Prioridad**: 🟡 MEDIA  
**Impacto**: Medio - UX inconsistente  
**Esfuerzo**: 2 horas  
**Responsable**: Frontend Dev

#### Archivos a Modificar
- `components/staff-management-panel.tsx`

#### Implementación

```typescript
// Reemplazar
const confirmation = window.confirm(`¿Queres eliminar...?`)

// Por
const [staffToDelete, setStaffToDelete] = useState<StaffUser | null>(null)

<AlertDialog open={!!staffToDelete} onOpenChange={(open) => !open && setStaffToDelete(null)}>
  <AlertDialogContent>
    <AlertDialogHeader>
      <AlertDialogTitle>¿Eliminar usuario "{staffToDelete?.email}"?</AlertDialogTitle>
      <AlertDialogDescription>
        Esta acción no se puede deshacer. El usuario será eliminado permanentemente.
      </AlertDialogDescription>
    </AlertDialogHeader>
    <AlertDialogFooter>
      <AlertDialogCancel disabled={isDeleting}>Cancelar</AlertDialogCancel>
      <AlertDialogAction 
        onClick={confirmDelete}
        disabled={isDeleting}
        className="bg-destructive hover:bg-destructive/90"
      >
        {isDeleting ? "Eliminando..." : "Eliminar"}
      </AlertDialogAction>
    </AlertDialogFooter>
  </AlertDialogContent>
</AlertDialog>
```

**Checklist**:
- [ ] Reemplazar `window.confirm()`
- [ ] Agregar estado para item a eliminar
- [ ] Agregar loading state
- [ ] Deshabilitar botones durante operación

---

### TAREA 5: Agregar Confirmación a Toggle Active

**Prioridad**: 🟡 BAJA-MEDIA  
**Impacto**: Bajo - Prevención  
**Esfuerzo**: 1 hora  
**Responsable**: Frontend Dev

#### Implementación

```typescript
const [staffToToggle, setStaffToToggle] = useState<{id: string, active: boolean} | null>(null)

const confirmToggle = async () => {
  if (!staffToToggle) return
  // Implementar toggle con loading state
}

// AlertDialog para confirmar desactivación
<AlertDialog open={!!staffToToggle && !staffToToggle.active}>
  <AlertDialogTitle>¿Desactivar usuario?</AlertDialogTitle>
  <AlertDialogDescription>
    Este usuario no podrá acceder al sistema hasta que lo reactives.
    Las sesiones activas se cerrarán.
  </AlertDialogDescription>
</AlertDialog>
```

---

### TAREA 6: Auditar y Reforzar Políticas RLS

**Prioridad**: 🟡 ALTA  
**Impacto**: Alto - Seguridad  
**Esfuerzo**: 4 horas  
**Responsable**: Backend Dev

#### Tablas a Auditar
- [ ] `zones` - Solo admins pueden DELETE
- [ ] `tables` - Solo admins pueden DELETE
- [ ] `users` - Solo admins pueden modificar
- [ ] `menu_items` - Solo admins pueden modificar
- [ ] `menu_categories` - Solo admins pueden modificar
- [ ] `staff` - Solo admins pueden gestionar
- [ ] `transactions` - Solo lectura para staff, escritura para admins

#### Tests de Seguridad

```typescript
// tests/security/rls.test.ts
describe('RLS Policies - DELETE operations', () => {
  it('should prevent staff from deleting zones', async () => {
    const { error } = await supabaseStaff
      .from('zones')
      .delete()
      .eq('id', testZoneId)
    
    expect(error).toBeTruthy()
    expect(error?.message).toContain('permission denied')
  })
  
  // ... más tests
})
```

---

## 🟢 Sprint 3: Mejoras (Semana 5)

### TAREA 7: Agregar Tests Unitarios a Componentes Críticos

**Esfuerzo**: 8 horas  
**Responsable**: QA + Dev

**Componentes prioritarios**:
1. `zones-manager-dialog.tsx` (2h)
2. `table-list.tsx` (3h)
3. `staff-management-panel.tsx` (2h)
4. Hooks: `useTables`, `useZones` (1h)

---

### TAREA 8: Mejorar Logging y Auditoría

**Esfuerzo**: 3 horas  
**Responsable**: Backend Dev

**Objetivos**:
- Estandarizar formato de logs
- Agregar logs faltantes en componentes
- Crear tabla de auditoría en BD (opcional)

---

### TAREA 9: Documentar Patrones y Best Practices

**Esfuerzo**: 2 horas  
**Responsable**: Tech Lead

**Entregables**:
- Guía de patrones (basado en relevamiento)
- Templates de componentes
- Checklist para PRs

---

## Ongoing: Calidad de Código

### TAREA 10-15: Items de Mantenimiento

- [ ] Refactorizar código duplicado
- [ ] Mejorar manejo de errores consistente
- [ ] Agregar JSDoc a funciones complejas
- [ ] Optimizar re-renders innecesarios
- [ ] Mejorar accesibilidad (ARIA labels)
- [ ] Code review de componentes legacy

---

## Métricas de Éxito

### KPIs Sprint 1
- [ ] 3/3 tareas críticas completadas
- [ ] 0 bugs P0 en producción
- [ ] Cobertura de tests > 60% en código nuevo

### KPIs Sprint 2
- [ ] 3/3 tareas importantes completadas
- [ ] 100% confirmaciones con AlertDialog
- [ ] RLS policies auditadas y documentadas

### KPIs Sprint 3
- [ ] Cobertura de tests > 80%
- [ ] Documentación técnica completa
- [ ] 0 TODOs en código producción

---

## Recursos Necesarios

### Equipo
- 1 Backend Developer (20h/semana)
- 1 Frontend Developer (15h/semana)
- 1 QA Engineer (5h/semana - Sprint 3)
- 1 Tech Lead (3h/semana - reviews)

### Herramientas
- Supabase Dashboard (configuración)
- VS Code + extensiones
- Jest + React Testing Library
- Storybook (opcional - documentación de componentes)

---

## Riesgos y Mitigaciones

### Riesgo 1: Esquema de BD no coincide con expectativas
**Probabilidad**: Media  
**Impacto**: Alto  
**Mitigación**: Auditar esquema antes de Sprint 1, ajustar si es necesario

### Riesgo 2: RLS policies bloquean operaciones válidas
**Probabilidad**: Media  
**Impacto**: Alto  
**Mitigación**: Tests exhaustivos con diferentes roles, tener rollback plan

### Riesgo 3: Estimaciones de esfuerzo incorrectas
**Probabilidad**: Alta  
**Impacto**: Medio  
**Mitigación**: Buffer del 20% en cada tarea, re-evaluar al final de Sprint 1

### Riesgo 4: Falta de tiempo del equipo
**Probabilidad**: Media  
**Impacto**: Medio  
**Mitigación**: Priorizar tareas 🔴, postponer 🟢 si es necesario

---

## Comunicación

### Daily Standup
- Progreso de tareas
- Blockers identificados
- Decisiones técnicas necesarias

### Weekly Review
- Demo de funcionalidades completadas
- Actualización de métricas
- Ajuste de prioridades si es necesario

### Sprint Retrospective
- Qué funcionó bien
- Qué mejorar
- Action items para próximo sprint

---

## Checklist de Implementación

### Pre-Sprint 1
- [ ] Revisar este plan con el equipo
- [ ] Crear tickets en sistema de tracking
- [ ] Asignar responsables
- [ ] Configurar ambiente de desarrollo
- [ ] Auditar esquema de BD actual

### Durante Sprint 1
- [ ] Daily standups
- [ ] Code reviews de cada PR
- [ ] Tests manuales de cada feature
- [ ] Actualizar documentación

### Post-Sprint 1
- [ ] Retrospectiva
- [ ] Actualizar métricas
- [ ] Planificar Sprint 2
- [ ] Comunicar progreso a stakeholders

---

**Última actualización**: 31 de Octubre de 2025  
**Próxima revisión**: Final de Sprint 1
