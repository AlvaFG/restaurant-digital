# Instrucciones de Deployment - Sprint 1

## ✅ Sprint 1 Completado

Se han implementado las 3 tareas críticas del Sprint 1:
1. ✅ CRUD completo del Menú
2. ✅ Integración de Usuarios con Supabase
3. ✅ Funcionalidad "Invitar la Casa" con registro de cortesías

---

## 🚀 Pasos para Deployment

### 1. Ejecutar Migración SQL (REQUERIDO)

La funcionalidad de "Invitar la Casa" requiere una nueva migración que agrega el campo `type` a la tabla `payments`.

**Opción A: Usando Supabase CLI**
```bash
supabase db push
```

**Opción B: Manualmente en Supabase Dashboard**
1. Ir a Supabase Dashboard → SQL Editor
2. Copiar y ejecutar el contenido de:
   ```
   supabase/migrations/20251031000001_add_payment_type.sql
   ```

**Contenido de la migración**:
- Agrega columna `type` a tabla `payments` (sale, courtesy, void)
- Agrega índice `idx_payments_type`
- Crea vista `v_payment_summary` para reporting
- Actualiza registros existentes a type='sale'

### 2. Regenerar Tipos TypeScript

Después de ejecutar la migración, regenerar los tipos:

```bash
# Opción A: Si tienes script configurado
npm run update-types

# Opción B: Usando Supabase CLI
npx supabase gen types typescript --project-id YOUR_PROJECT_ID > lib/supabase/database.types.ts
```

### 3. Verificar la Migración

Ejecutar queries de verificación en SQL Editor:

```sql
-- Verificar que existe el campo type
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'payments' AND column_name = 'type';

-- Verificar que existe la vista
SELECT * FROM v_payment_summary LIMIT 5;

-- Verificar índice
SELECT indexname, indexdef 
FROM pg_indexes 
WHERE tablename = 'payments' AND indexname = 'idx_payments_type';
```

---

## 🧪 Testing Manual

### Test 1: CRUD del Menú
1. Ir a `/menu`
2. **Crear categoría**:
   - Click "Nueva Categoría"
   - Ingresar nombre y descripción
   - Guardar
   - ✅ Verificar que aparece en la lista
3. **Crear item del menú**:
   - Click "Nuevo Item"
   - Completar formulario (nombre, descripción, precio, categoría)
   - Agregar tags opcionales
   - Guardar
   - ✅ Verificar que aparece en la lista
4. **Editar item**:
   - Click botón de editar
   - Modificar campos
   - Guardar
   - ✅ Verificar cambios
5. **Eliminar item**:
   - Click botón de eliminar
   - Confirmar en AlertDialog
   - ✅ Verificar que se eliminó

### Test 2: Gestión de Usuarios
1. Ir a `/usuarios`
2. **Crear usuario**:
   - Click "Nuevo Usuario"
   - Completar: nombre, email, contraseña, rol
   - Guardar
   - ✅ Verificar que aparece en la lista
3. **Email duplicado** (debe fallar):
   - Intentar crear usuario con email existente
   - ✅ Debe mostrar error "Ya existe un usuario con ese email"
4. **Editar usuario**:
   - Click botón de editar
   - Cambiar nombre o rol
   - Guardar
   - ✅ Verificar cambios
5. **Activar/Desactivar**:
   - Toggle switch de estado
   - ✅ Verificar cambio de badge y estado
6. **Eliminar último admin** (debe fallar):
   - Si solo hay 1 admin activo, intentar eliminarlo
   - ✅ Debe mostrar error
7. **Eliminar usuario staff**:
   - Click eliminar en usuario staff
   - Confirmar en AlertDialog
   - ✅ Verificar eliminación
8. **Verificar estadísticas**:
   - ✅ Cards muestran totales correctos

### Test 3: Invitar la Casa
1. Ir a `/salon` o donde se visualicen las mesas
2. **Preparar mesa con orden**:
   - Crear una orden en una mesa
   - Asegurarse que tenga items
   - Estado debe ser 'ocupada' o similar
3. **Aplicar cortesía**:
   - Click botón "Invitar Casa" (ícono Gift)
   - Confirmar en diálogo
   - ✅ Verificar:
     - Toast "Cortesía aplicada"
     - Mesa cambia a estado "libre"
     - Orden cambia a "pagado"
4. **Verificar en base de datos** (SQL Editor):
   ```sql
   -- Ver pagos de cortesía
   SELECT * FROM payments WHERE type = 'courtesy' ORDER BY created_at DESC LIMIT 5;
   
   -- Ver resumen
   SELECT * FROM v_payment_summary WHERE type = 'courtesy';
   ```

### Test 4: Persistencia
1. Realizar cambios (crear item, usuario, aplicar cortesía)
2. Refrescar página (F5)
3. ✅ Verificar que los cambios persisten

### Test 5: Permisos RLS
1. Iniciar sesión con usuario `staff` (no admin)
2. Intentar acceder a `/menu` o `/usuarios`
3. ✅ Debe redirigir o mostrar error de permisos

---

## ⚠️ TODOs para Producción

### Alta Prioridad
- [ ] Implementar API route para creación segura de usuarios (hash de contraseñas en servidor)
- [ ] Agregar permisos granulares para "Invitar Casa" (solo admins/managers)
- [ ] Implementar límite de cortesías por período

### Media Prioridad
- [ ] Dashboard de cortesías aplicadas
- [ ] Notificación por email cuando se aplica cortesía
- [ ] Sistema de cambio de contraseña para usuarios
- [ ] Sistema de reset de contraseña

### Baja Prioridad
- [ ] Tests unitarios (Sprint 3)
- [ ] Tests de integración (Sprint 3)
- [ ] Métricas y monitoring (Sprint 3)

---

## 📊 Archivos Modificados

### Creados
- `lib/services/users-service.ts` - Servicio de usuarios
- `hooks/use-users.ts` - Hook React Query para usuarios
- `components/menu-item-dialog.tsx` - Diálogo de items del menú
- `components/menu-category-dialog.tsx` - Diálogo de categorías
- `supabase/migrations/20251031000001_add_payment_type.sql` - Migración payments.type

### Modificados
- `components/users-management.tsx` - Reemplazado mock data por Supabase
- `app/menu/page.tsx` - Integrado CRUD completo
- `lib/services/payments-service.ts` - Agregada función `createCourtesyPayment`
- `hooks/use-tables.ts` - Agregada función `inviteHouse`
- `components/table-list.tsx` - Actualizado handler de "Invitar Casa"

---

## 🐛 Issues Conocidos

1. **Tipos TypeScript desactualizados**: Hasta que no se ejecute la migración y se regeneren los tipos, el campo `type` en payments usará `as any`. Esto es temporal y se resolverá con el paso 2.

2. **Contraseñas en cliente**: La creación de usuarios actualmente hashea contraseñas en el cliente (INSEGURO). Se debe implementar una API route en el servidor antes de producción.

3. **Sin límite de cortesías**: Actualmente cualquier admin puede aplicar cortesías ilimitadas. Se debe implementar control.

---

## 📞 Soporte

Si encuentras problemas durante el deployment:
1. Verifica los logs del servidor
2. Revisa la consola del navegador
3. Verifica los logs de Supabase
4. Confirma que la migración se ejecutó correctamente

---

**Fecha**: 31 de Octubre de 2025  
**Sprint**: 1 (Completado)  
**Próximo Sprint**: Sprint 2 - Standardización y Seguridad
