# Guía: Ejecutar Migraciones SQL en Supabase

**Fecha**: 31 de Octubre de 2025  
**Objetivo**: Aplicar auditoría y refuerzo de políticas RLS  
**Duración estimada**: 15-20 minutos

---

## 📋 Pre-requisitos

- [x] Acceso a Supabase Dashboard
- [x] Proyecto ID: `vblbngnajogwypvkfjsr`
- [x] Rol de administrador en Supabase
- [ ] Backup de base de datos (recomendado)

---

## 🔄 Paso 1: Hacer Backup (RECOMENDADO)

### Por qué hacer backup:
El script de refuerzo modifica políticas RLS existentes. Si algo sale mal, puedes restaurar.

### Cómo hacer backup:

1. Ir a: https://supabase.com/dashboard/project/vblbngnajogwypvkfjsr
2. Menu lateral → **Database** → **Backups**
3. Click en: **"Create manual backup"**
4. Esperar confirmación (1-2 minutos)

✅ **Checkpoint**: Backup creado exitosamente

---

## 🔍 Paso 2: Ejecutar Script de Auditoría

### Objetivo:
Ver el estado actual de las políticas RLS antes de hacer cambios.

### Instrucciones:

1. **Abrir SQL Editor**
   - Menu lateral → **SQL Editor**
   - Click: **"New query"**

2. **Copiar el script de auditoría**
   - Abrir archivo: `supabase/migrations/20251031000002_audit_rls_policies.sql`
   - Seleccionar TODO el contenido (Ctrl+A)
   - Copiar (Ctrl+C)

3. **Pegar en SQL Editor**
   - Pegar en el editor (Ctrl+V)
   - Verificar que se haya copiado todo (debe tener ~134 líneas)

4. **Ejecutar**
   - Click en: **"Run"** (o F5)
   - Esperar resultados

### Resultados esperados:

Deberías ver **8 tablas de resultados**:

#### Tabla 1: Tablas con RLS
Verifica que todas tengan "✅ ENABLED"

#### Tabla 2: Lista de políticas
Muestra todas las políticas existentes por tabla

#### Tabla 3: Tablas vulnerables
**Esperado**: Ninguna tabla sin políticas (vacío)

#### Tabla 4: Políticas DELETE
Lista quién puede eliminar en cada tabla

#### Tabla 5: Políticas INSERT
Lista validaciones de inserción

#### Tabla 6: Aislamiento por tenant
Verifica que todas tengan "✅ Tenant isolation active"

#### Tabla 7: Funciones helper
Debe mostrar:
- `current_tenant_id`
- `current_user_role`
- `is_admin`
- `is_staff`

#### Tabla 8: Resumen estadístico
Muestra conteo total de tablas y políticas

### ⚠️ Si encuentras problemas:

**Problema**: "function current_tenant_id() does not exist"
- **Solución**: Primero ejecutar `20251011000002_enable_rls.sql`

**Problema**: Tablas sin políticas en Tabla 3
- **Solución**: Anotar cuáles son y continuar con precaución

✅ **Checkpoint**: Auditoría ejecutada, resultados revisados

---

## 🔒 Paso 3: Ejecutar Script de Refuerzo de Seguridad

### ⚠️ IMPORTANTE:
Este script **MODIFICA** políticas existentes. Asegúrate de tener el backup del Paso 1.

### Instrucciones:

1. **Nueva query en SQL Editor**
   - Click: **"New query"** (o + en la pestaña)

2. **Copiar el script de refuerzo**
   - Abrir archivo: `supabase/migrations/20251031000003_strengthen_rls_policies.sql`
   - Seleccionar TODO el contenido (Ctrl+A)
   - Copiar (Ctrl+C)

3. **Revisar el script antes de ejecutar**
   - Pegar en el editor (Ctrl+V)
   - **LEER** los comentarios del script
   - Verificar que se haya copiado completo (~279 líneas)

4. **Ejecutar con precaución**
   - Click en: **"Run"** (o F5)
   - Esperar a que termine (puede tomar 5-10 segundos)

### Resultados esperados:

Deberías ver mensajes tipo:
```
CREATE FUNCTION
CREATE POLICY
DROP POLICY (si existe)
COMMENT
```

**NO deberías ver**:
- ❌ ERROR: syntax error
- ❌ ERROR: permission denied
- ❌ ERROR: relation does not exist

### Si ves errores:

**Error**: "policy already exists"
- **Solución**: Normal, el script usa `DROP POLICY IF EXISTS`, continuar

**Error**: "function is_admin() does not exist"
- **Solución**: Ejecutar primero `20251012000002_hierarchical_roles.sql`

**Error**: "table X does not exist"
- **Solución**: Esa tabla no se creó aún, comentar esas líneas y continuar

✅ **Checkpoint**: Script de refuerzo ejecutado sin errores críticos

---

## 🔍 Paso 4: Verificar Cambios Aplicados

### Re-ejecutar auditoría:

1. Volver a la pestaña del script de auditoría (Paso 2)
2. Click en **"Run"** nuevamente
3. Comparar resultados con la primera ejecución

### Cambios esperados:

#### Tabla 4 (Políticas DELETE):
Ahora debería mostrar:
- `zones_delete_admin_only` → "✅ Admin only"
- `tables_delete_admin_only` → "✅ Admin only"
- `orders_delete_admin_only` → "✅ Admin only"
- `payments_delete_admin_only` → "✅ Admin only"
- `audit_logs_no_delete` → "❌ Unrestricted" (pero USING (false))

#### Tabla 7 (Funciones helper):
Debe incluir ahora:
- `is_manager` (nueva)

✅ **Checkpoint**: Cambios verificados correctamente

---

## 🔄 Paso 5: Regenerar Tipos TypeScript

### Por qué:
La migración `20251031000001_add_payment_type.sql` agregó el campo `type` a `payments`. Necesitamos regenerar los tipos.

### Opción A: Usando Supabase CLI (RECOMENDADO)

```powershell
# En PowerShell, en la raíz del proyecto
npx supabase gen types typescript --project-id vblbngnajogwypvkfjsr > lib/supabase/database.types.ts
```

### Opción B: Usando comando npm (si existe)

```powershell
npm run update-types
```

### Opción C: Manual (si las anteriores fallan)

1. Ir a: https://supabase.com/dashboard/project/vblbngnajogwypvkfjsr/settings/api
2. Copiar la URL del proyecto y la anon key
3. Usar el generador de tipos online de Supabase

### Verificar tipos generados:

```powershell
# Ver si el archivo se actualizó
Get-Content lib/supabase/database.types.ts | Select-String "type.*payments"
```

Deberías ver el nuevo campo `type` en la interfaz de `payments`.

✅ **Checkpoint**: Tipos TypeScript regenerados

---

## ✅ Paso 6: Verificar que el Servidor Funcione

### Reiniciar servidor de desarrollo:

```powershell
# Si ya está corriendo, detenerlo con Ctrl+C
# Luego iniciar nuevamente
npm run dev
```

### Verificar compilación:

Deberías ver:
```
✓ Ready in 2-3s
○ Local: http://localhost:3000
```

**NO deberías ver**:
- ❌ Error: Cannot find module
- ❌ Type error: Property 'type' does not exist

### Probar en el navegador:

1. Ir a: http://localhost:3000
2. Verificar que carga sin errores
3. Abrir consola del navegador (F12)
4. Verificar que no haya errores en rojo

✅ **Checkpoint**: Servidor funcionando correctamente

---

## 🧪 Paso 7: Testing Rápido de Seguridad (Opcional pero Recomendado)

### Test 1: Verificar que staff NO pueda eliminar zonas

**SQL a ejecutar en Supabase** (simulando usuario staff):

```sql
-- Conectarse como staff (cambiar el ID por uno real)
SET LOCAL app.current_tenant_id = '<tu-tenant-id>';
SET LOCAL request.jwt.claims = '{"sub": "<staff-user-id>", "role": "authenticated"}';

-- Intentar eliminar una zona (DEBE FALLAR)
DELETE FROM zones WHERE id = '<alguna-zona-id>';
```

**Resultado esperado**: 
```
ERROR: new row violates row-level security policy
```

### Test 2: Intentar eliminar audit_logs como admin (DEBE FALLAR)

```sql
-- Conectarse como admin
SET LOCAL app.current_tenant_id = '<tu-tenant-id>';
-- Simular admin

-- Intentar eliminar log (DEBE FALLAR incluso como admin)
DELETE FROM audit_logs LIMIT 1;
```

**Resultado esperado**:
```
ERROR: new row violates row-level security policy
```

✅ **Checkpoint**: Políticas funcionando correctamente

---

## 📊 Resumen de Cambios Aplicados

### Políticas DELETE reforzadas:

| Tabla | Antes | Después | Estado |
|-------|-------|---------|--------|
| zones | Staff podía | Solo admin | ✅ |
| tables | Staff podía | Solo admin | ✅ |
| menu_categories | Todos | Admin + Manager | ✅ |
| menu_items | Todos | Admin + Manager | ✅ |
| orders | Staff podía | Solo admin | ✅ |
| payments | Staff podía | Solo admin | ✅ |
| audit_logs | Admin podía | **NADIE** | ✅ |
| table_status_audit | Sin política | **NADIE** | ✅ |

### Funciones agregadas:

- ✅ `is_manager()` - Verifica si es admin o manager

### Tipos TypeScript:

- ✅ Campo `type` agregado a `payments` table
- ✅ Tipos regenerados desde Supabase

---

## 🚨 Troubleshooting

### Problema: No puedo hacer backup
**Solución**: Continuar sin backup (bajo tu responsabilidad) o usar `pg_dump` manual

### Problema: Script de auditoría falla
**Solución**: Ejecutar primero las migraciones base:
1. `20251011000002_enable_rls.sql`
2. `20251012000002_hierarchical_roles.sql`

### Problema: Script de refuerzo falla en una tabla
**Solución**: Comentar las líneas de esa tabla específica y continuar con las demás

### Problema: Tipos TypeScript no se regeneran
**Solución**: Usar tipos existentes con `as any` temporalmente:
```typescript
type: 'courtesy' as any
```

### Problema: Servidor no compila después de cambios
**Solución**: 
1. Borrar `.next` folder
2. `npm run build`
3. Verificar errores específicos

---

## ✅ Checklist Final

Marca cada item cuando lo completes:

- [ ] Backup de base de datos creado
- [ ] Script de auditoría ejecutado y revisado
- [ ] Script de refuerzo ejecutado sin errores críticos
- [ ] Auditoría re-ejecutada para verificar cambios
- [ ] Tipos TypeScript regenerados
- [ ] Servidor de desarrollo reiniciado
- [ ] Servidor compila sin errores
- [ ] Tests de seguridad ejecutados (opcional)
- [ ] Sin errores en consola del navegador

---

## 🎉 ¡Completado!

Si todos los checkpoints están marcados, has completado exitosamente:

✅ Auditoría de políticas RLS  
✅ Refuerzo de seguridad aplicado  
✅ Sistema funcionando con nuevas políticas  
✅ Tipos TypeScript actualizados  

**Próximo paso**: Testing manual de funcionalidades o deploy a producción.

---

## 📞 Ayuda

Si encuentras algún problema que no está en troubleshooting:
1. Revisar logs de Supabase Dashboard
2. Verificar que todas las migraciones previas estén aplicadas
3. Consultar documentación de Supabase RLS
4. Pedir ayuda al equipo de desarrollo

---

**Fecha de ejecución**: ___________  
**Ejecutado por**: ___________  
**Resultado**: ___________  
**Notas adicionales**: ___________
