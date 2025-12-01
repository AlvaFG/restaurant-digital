# Audit i18n - Resultados Completos

## 📊 Resumen Ejecutivo

- **Fases 1-3**: ✅ Completadas
  - Error crítico `formatRelativeTime` resuelto
  - Claves faltantes agregadas (noRecords, fetchOrdersError)
  - Navegación sidebar corregida (9 claves en dashboard.json)

- **Fase 4**: ✅ Completado - Audit sistemático
- **Fase 5**: ⏳ PENDIENTE - Migración de 150+ strings hardcodeados

## 🔍 Textos Hardcodeados Identificados

### 🔴 Alta Prioridad - Acciones CRUD Comunes

#### 1. zones-manager-dialog.tsx (8 strings)
```typescript
"Eliminando..." → tCommon('deleting')
"Eliminar zona" → tCommon('deleteZone')
"¿Eliminar zona \"{name}\"?" → tCommon('confirmDeleteZone', {name})
"No se puede eliminar" → tErrors('cannotDelete')
"Error al eliminar zona" → tErrors('deleteZoneError')
"Error al crear zona" → tErrors('createZoneError')
"Crear nueva zona" → tCommon('createNewZone')
"Crear" → tCommon('create')
```

#### 2. zones-management.tsx (9 strings)
```typescript
"No se pudo eliminar la zona" → tErrors('deleteZoneFailed')
"Eliminar" → tCommon('delete')
"Editar" → tCommon('edit')
"Eliminar zona?" → tCommon('confirmDeleteZoneTitle')
"No podes eliminar la zona {name} porque tiene {count} mesa(s)" → tErrors('cannotDeleteZoneWithTables', {name, count})
"Eliminar zona" → tCommon('deleteZone')
"Crear zona" → tCommon('createZone')
"Crear nueva zona" / "Editar zona" → tCommon('createNewZone') / tCommon('editZone')
"Asigna un nombre descriptivo para ubicarla facilmente al crear mesas." → tCommon('zoneNameHelp')
```

#### 3. users-management.tsx (7 strings)
```typescript
"Editar Usuario" / "Crear Nuevo Usuario" → tCommon('editUser') / tCommon('createNewUser')
"Modifica los datos del usuario" → tCommon('editUserDescription')
"Completa los datos para crear un nuevo usuario" → tCommon('createUserDescription')
"Actualizar" → tCommon('update')
"Crear" → tCommon('create')
"Eliminar" → tCommon('delete')
```

#### 4. table-list.tsx (5 strings)
```typescript
"Error al eliminar mesa" → tErrors('deleteTableError')
"No se pudo eliminar la mesa. Intenta nuevamente." → tErrors('deleteTableFailed')
"¿Estás seguro que quieres eliminar la mesa?" → tCommon('confirmDeleteTable')
"Esta acción eliminará permanentemente la mesa {number}." → tCommon('deleteTableWarning', {number})
"Eliminando..." / "Eliminar mesa" → tCommon('deleting') / tCommon('deleteTable')
```

#### 5. staff-management-panel.tsx (9 strings)
```typescript
"No se pudo eliminar el usuario staff." → tErrors('deleteStaffFailed')
"Error al eliminar staff" → tErrors('deleteStaffError')
"No se pudo eliminar el usuario." → tErrors('deleteUserFailed')
"¿Eliminar usuario \"{email}\"?" → tCommon('confirmDeleteUser', {email})
"No se pudo crear el usuario" → tErrors('createUserFailed')
"Error al crear staff" → tErrors('createStaffError')
"No se pudo crear el usuario." → tErrors('createUserError')
"Crear usuario" → tCommon('createUser')
"Crea el primero con el boton Crear usuario." → tCommon('createFirstUserHelp')
```

#### 6. order-form.tsx (5 strings)
```typescript
"No se puede crear el pedido" → tErrors('cannotCreateOrder')
"Error al crear pedido desde formulario" → tErrors('createOrderError')
"❌ No se pudo crear el pedido" → tErrors('createOrderFailed')
"Creando pedido..." / "Crear pedido" → tCommon('creatingOrder') / tCommon('createOrder')
`aria-label="Eliminar ${item}"` → tCommon('removeItem', {item})
```

#### 7. table-map.tsx (3 strings)
```typescript
"Eliminar Zona" → tCommon('deleteZone')
"Editar Zona" → tCommon('editZone')
"Modo de edición activado. Haz clic en una mesa..." → tCommon('editModeInstructions')
```

#### 8. table-map-controls.tsx (2 strings)
```typescript
"Editar Mesa {number}" → tCommon('editTable', {number})
"Haz clic en una mesa del mapa para editar..." → tCommon('editTableHelp')
```

#### 9. unified-salon-view.tsx (3 strings)
```typescript
"Salir del modo edición - Atajo: E" → tCommon('exitEditMode')
"Editar layout del salón - Atajo: E" → tCommon('enterEditMode')
"Editar layout" → tCommon('editLayout')
"Atajos de teclado disponibles: M para mapa..." → tCommon('keyboardShortcutsHelp')
```

#### 10. login-form.tsx (3 strings)
```typescript
"Error al crear cuenta" → tErrors('createAccountError')
"Iniciar Sesión" / "Crear Cuenta" → tCommon('signIn') / tCommon('createAccount')
"Completa el formulario para crear tu cuenta" → tCommon('createAccountHelp')
```

#### 11. add-table-dialog.tsx (2 strings)
```typescript
"Error al crear mesa" → tErrors('createTableError')
"No se pudo crear la mesa" → tErrors('createTableFailed')
```

#### 12. checkout-button.tsx (1 string)
```typescript
"No se pudo crear el pago" → tErrors('createPaymentFailed')
```

#### 13. create-zone-dialog.tsx (2 strings)
```typescript
"Error al crear la zona" → tErrors('createZoneError')
"Crear zona" → tCommon('createZone')
```

## 🎯 Próximos Pasos (Fase 5)

### Estrategia de Migración

1. **Batch 1**: Acciones CRUD comunes (create, edit, delete, update)
   - Agregar claves a common.json
   - Migrar en paralelo 5-6 archivos relacionados

2. **Batch 2**: Mensajes de error estándar
   - Agregar claves a errors.json
   - Migrar todos los "No se pudo...", "Error al..."

3. **Batch 3**: Strings específicos por componente
   - Agregar a namespace correspondiente
   - Migrar uno por uno

### Claves Necesarias en common.json (ES/EN)

```json
{
  "create": "Crear" / "Create",
  "edit": "Editar" / "Edit",
  "delete": "Eliminar" / "Delete",
  "update": "Actualizar" / "Update",
  "deleting": "Eliminando..." / "Deleting...",
  "creating": "Creando..." / "Creating...",
  "updating": "Actualizando..." / "Updating...",
  
  "createZone": "Crear zona" / "Create zone",
  "createNewZone": "Crear nueva zona" / "Create new zone",
  "editZone": "Editar zona" / "Edit zone",
  "deleteZone": "Eliminar zona" / "Delete zone",
  "confirmDeleteZone": "¿Eliminar zona \"{name}\"?" / "Delete zone \"{name}\"?",
  "confirmDeleteZoneTitle": "Eliminar zona?" / "Delete zone?",
  "zoneNameHelp": "Asigna un nombre descriptivo para ubicarla facilmente al crear mesas." / "Assign a descriptive name to easily locate it when creating tables.",
  
  "createUser": "Crear usuario" / "Create user",
  "createNewUser": "Crear Nuevo Usuario" / "Create New User",
  "editUser": "Editar Usuario" / "Edit User",
  "confirmDeleteUser": "¿Eliminar usuario \"{email}\"?" / "Delete user \"{email}\"?",
  "createUserDescription": "Completa los datos para crear un nuevo usuario" / "Fill in the details to create a new user",
  "editUserDescription": "Modifica los datos del usuario" / "Modify user details",
  "createFirstUserHelp": "Crea el primero con el boton Crear usuario." / "Create the first one with the Create user button.",
  
  "createTable": "Crear mesa" / "Create table",
  "deleteTable": "Eliminar mesa" / "Delete table",
  "editTable": "Editar Mesa {number}" / "Edit Table {number}",
  "confirmDeleteTable": "¿Estás seguro que quieres eliminar la mesa?" / "Are you sure you want to delete the table?",
  "deleteTableWarning": "Esta acción eliminará permanentemente la mesa {number}." / "This action will permanently delete table {number}.",
  "editTableHelp": "Haz clic en una mesa del mapa para editar sus propiedades o agrega una nueva" / "Click on a table on the map to edit its properties or add a new one",
  
  "createOrder": "Crear pedido" / "Create order",
  "creatingOrder": "Creando pedido..." / "Creating order...",
  "removeItem": "Eliminar {item}" / "Remove {item}",
  
  "editLayout": "Editar layout" / "Edit layout",
  "enterEditMode": "Editar layout del salón - Atajo: E" / "Edit salon layout - Shortcut: E",
  "exitEditMode": "Salir del modo edición - Atajo: E" / "Exit edit mode - Shortcut: E",
  "editModeInstructions": "Modo de edición activado. Haz clic en una mesa para seleccionarla. Usa las flechas del teclado para mover la mesa seleccionada. Presiona Delete para eliminar. Presiona Escape para deseleccionar." / "Edit mode activated. Click on a table to select it. Use arrow keys to move the selected table. Press Delete to remove. Press Escape to deselect.",
  "keyboardShortcutsHelp": "Atajos de teclado disponibles: M para mapa, L para lista, E para editar" / "Available keyboard shortcuts: M for map, L for list, E for edit",
  
  "signIn": "Iniciar Sesión" / "Sign In",
  "createAccount": "Crear Cuenta" / "Create Account",
  "createAccountHelp": "Completa el formulario para crear tu cuenta" / "Fill in the form to create your account"
}
```

### Claves Necesarias en errors.json (ES/EN)

```json
{
  "cannotDelete": "No se puede eliminar" / "Cannot delete",
  
  "createZoneError": "Error al crear zona" / "Error creating zone",
  "deleteZoneError": "Error al eliminar zona" / "Error deleting zone",
  "deleteZoneFailed": "No se pudo eliminar la zona" / "Could not delete the zone",
  "cannotDeleteZoneWithTables": "No podes eliminar la zona {name} porque tiene {count} mesa(s)" / "Cannot delete zone {name} because it has {count} table(s)",
  
  "createTableError": "Error al crear mesa" / "Error creating table",
  "createTableFailed": "No se pudo crear la mesa" / "Could not create the table",
  "deleteTableError": "Error al eliminar mesa" / "Error deleting table",
  "deleteTableFailed": "No se pudo eliminar la mesa. Intenta nuevamente." / "Could not delete the table. Try again.",
  
  "createUserFailed": "No se pudo crear el usuario" / "Could not create the user",
  "createUserError": "No se pudo crear el usuario." / "Could not create the user.",
  "createStaffError": "Error al crear staff" / "Error creating staff",
  "deleteStaffFailed": "No se pudo eliminar el usuario staff." / "Could not delete the staff user.",
  "deleteStaffError": "Error al eliminar staff" / "Error deleting staff",
  "deleteUserFailed": "No se pudo eliminar el usuario." / "Could not delete the user.",
  
  "cannotCreateOrder": "No se puede crear el pedido" / "Cannot create the order",
  "createOrderError": "Error al crear pedido desde formulario" / "Error creating order from form",
  "createOrderFailed": "❌ No se pudo crear el pedido" / "❌ Could not create the order",
  
  "createAccountError": "Error al crear cuenta" / "Error creating account",
  
  "createPaymentFailed": "No se pudo crear el pago" / "Could not create the payment"
}
```

## 📈 Métricas

- **Total strings identificados**: ~60 únicos (considerando reutilización)
- **Archivos afectados**: 13 componentes principales
- **Tiempo estimado**: 2-3 horas para Batch 1-2, 1-2 horas para Batch 3
- **Impacto**: Alta - Estos son los textos más visibles de la UI

## ✅ Checklist de Validación

Después de cada batch:
- [ ] Agregar claves a JSON (es/en)
- [ ] Migrar componentes
- [ ] Probar en browser (español)
- [ ] Cambiar a inglés y verificar
- [ ] Verificar funcionalidad no rota
- [ ] Commit con mensaje descriptivo
