# 📋 Guía: Crear Política RLS para INSERT en tabla zones

**Fecha**: Octubre 16, 2025, 9:15 PM  
**Objetivo**: Permitir que usuarios autenticados creen zonas en su tenant

---

## 🎯 Pasos a Seguir

### Paso 1: Abrir Supabase Dashboard

1. Ve a: **https://supabase.com/dashboard/project/vblbngnajogwypvkfjsr**
2. Inicia sesión si te lo pide

---

### Paso 2: Ir a SQL Editor

1. En el menú lateral izquierdo, busca el icono **"SQL Editor"** 
2. Click en **"SQL Editor"**
3. Click en **"+ New query"** (botón verde arriba a la derecha)

---

### Paso 3: Copiar y Pegar este SQL

Copia **TODO el bloque siguiente** y pégalo en el editor SQL:

```sql
-- Crear política INSERT para tabla zones
-- Permite que usuarios autenticados creen zonas en su tenant

CREATE POLICY "Users can insert zones in their tenant"
ON zones
FOR INSERT
TO authenticated
WITH CHECK (
  tenant_id IN (
    SELECT tenant_id 
    FROM users 
    WHERE id = auth.uid()
  )
);
```

---

### Paso 4: Ejecutar el SQL

1. Con el SQL pegado, presiona **Ctrl + Enter** 
   O click en el botón **"Run"** (esquina inferior derecha)

2. **Resultado esperado**:
   ```
   Success. No rows returned
   ```
   O un mensaje similar indicando éxito

---

### Paso 5: Verificar la Política (Opcional)

Para confirmar que se creó correctamente:

1. Ve a **"Table Editor"** en el menú lateral
2. Selecciona la tabla **"zones"**
3. Click en el icono **"RLS"** (candado, arriba a la derecha)
4. Deberías ver la nueva política:
   - **Name**: "Users can insert zones in their tenant"
   - **Command**: INSERT
   - **Roles**: authenticated

---

## ✅ Confirmación

Una vez ejecutado el SQL, **avísame con "listo"** y probaremos crear una zona desde la app.

---

## 🔍 ¿Qué hace esta política?

La política permite:
- ✅ Usuarios **autenticados** (logged in)
- ✅ Insertar en tabla **zones**
- ✅ Solo si el `tenant_id` coincide con su tenant en tabla `users`

**Seguridad**:
- ❌ Usuarios NO pueden crear zonas para otros tenants
- ❌ Usuarios NO autenticados no pueden crear zonas
- ✅ Multi-tenancy protegido

---

## 🆘 Si Hay Error

### Error: "policy already exists"
**Solución**: La política ya existe. Pasa al Paso 5 para verificar.

### Error: "permission denied"
**Solución**: Tu usuario necesita permisos de admin en Supabase. 
- Verifica que estás usando la cuenta correcta
- O usa la Opción A (deshabilitar RLS temporal)

### Error: "relation zones does not exist"
**Solución**: La tabla zones no existe en la base de datos.
- Verifica el nombre de la tabla
- Puede estar en un schema diferente

---

**Estado**: 🟢 ESPERANDO EJECUCIÓN  
**Siguiente**: Probar crear zona desde la app
