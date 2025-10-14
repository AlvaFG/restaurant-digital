# 🔍 GUÍA DE DIAGNÓSTICO: Problema de Zonas No Visibles

## Problema Reportado
- Las zonas existen en Supabase (tabla `zones`) con 3 registros: "Bar", "Salón Principal", "Terraza"
- La interfaz muestra: "No se pudieron cargar las mesas. Intenta nuevamente."
- Al intentar crear mesa: "No hay zonas creadas. Crea una antes de agregar mesas."
- Al intentar crear zona: El diálogo se muestra pero no guarda

## Arquitectura del Sistema

### Flujo de Datos
```
1. Usuario accede a /mesas
   ↓
2. TableList component carga
   ↓
3. useEffect ejecuta loadTables()
   ↓
4. Llama fetchZones() desde zones-service.ts
   ↓
5. Hace GET a /api/zones
   ↓
6. API extrae tenant_id del usuario
   ↓
7. Llama listZones(tenantId) desde zones-store.ts
   ↓
8. Consulta Supabase con RLS activo
   ↓
9. Retorna zonas si RLS permite acceso
```

### Puntos Críticos Identificados

1. **tenant_id en user_metadata**
   - Ubicación: `/api/auth/me` y `getTenantIdFromUser()` en `/api/zones/route.ts`
   - Problema potencial: Si el usuario no tiene `tenant_id` en `user_metadata`, no puede acceder a las zonas

2. **Políticas RLS en tabla zones**
   - La consulta en `listZones()` usa el cliente normal (con RLS)
   - Si las políticas RLS no permiten SELECT, las zonas no se retornarán

3. **Manejo de errores**
   - Los errores pueden no estar siendo mostrados correctamente al usuario

## 🚀 PASOS PARA DIAGNÓSTICO

### Paso 1: Ejecutar Diagnóstico Automático

Abre tu navegador y navega a:
```
http://localhost:3000/api/debug/zones
```

Esto ejecutará un diagnóstico completo y te mostrará un JSON con:
- Estado de autenticación
- Presencia de tenant_id
- Zonas disponibles con y sin RLS
- Estado de la sesión
- Conclusión y solución sugerida

### Paso 2: Revisar Console del Navegador

1. Abre las DevTools (F12)
2. Ve a la pestaña Console
3. Recarga la página `/mesas`
4. Busca logs que comiencen con:
   - `[fetchZones]`
   - `[loadTables]`
   - `[GET /api/zones]`
   - `[listZones]`

### Paso 3: Revisar Supabase Dashboard

Ve a tu proyecto de Supabase:

**3.1 Verificar datos en tabla zones:**
```sql
SELECT id, tenant_id, name, active, created_at 
FROM zones 
ORDER BY created_at;
```

**3.2 Verificar políticas RLS:**
- Ve a: Authentication > Policies
- Tabla: `zones`
- Debe existir política SELECT que permita:
  ```sql
  -- Opción 1: Verificación directa
  tenant_id = auth.uid()
  
  -- Opción 2: Via tabla users
  tenant_id = (SELECT tenant_id FROM users WHERE id = auth.uid())
  ```

**3.3 Verificar usuario actual:**
```sql
SELECT id, tenant_id, name, email, role, active 
FROM users 
WHERE email = 'tu-email@ejemplo.com';
```

### Paso 4: Verificar tenant_id en sesión

Ejecuta en Console del navegador:
```javascript
// Ver datos de autenticación
const response = await fetch('/api/auth/me');
const data = await response.json();
console.log('Usuario:', data.data.user);
console.log('Tenant:', data.data.tenant);
```

## 🔧 SOLUCIONES POSIBLES

### Solución 1: tenant_id faltante en user_metadata

**Síntoma:** El diagnóstico muestra "Usuario sin tenant asignado"

**Causa:** El usuario no tiene `tenant_id` en `user_metadata`

**Solución:**
1. Actualizar el login para agregar `tenant_id` a `user_metadata`
2. O modificar `getTenantIdFromUser()` para buscar en tabla `users`

### Solución 2: Políticas RLS incorrectas

**Síntoma:** El diagnóstico muestra zonas con Service Role pero no con cliente normal

**Causa:** Las políticas RLS están bloqueando el acceso

**Solución:** Crear/actualizar política RLS en Supabase:

```sql
-- Eliminar política existente si hay problemas
DROP POLICY IF EXISTS "Users can view zones from their tenant" ON zones;

-- Crear nueva política correcta
CREATE POLICY "Users can view zones from their tenant" ON zones
  FOR SELECT
  USING (
    tenant_id IN (
      SELECT tenant_id FROM users WHERE id = auth.uid()
    )
  );
```

### Solución 3: Crear zonas desde Service Role

**Síntoma:** Las zonas no se guardan al usar el diálogo

**Causa:** Las políticas INSERT no permiten crear zonas

**Solución:** Verificar política INSERT:

```sql
CREATE POLICY "Staff can insert zones for their tenant" ON zones
  FOR INSERT
  WITH CHECK (
    tenant_id IN (
      SELECT tenant_id FROM users 
      WHERE id = auth.uid() 
      AND role = 'staff'
    )
  );
```

## 📊 CHECKLIST DE VERIFICACIÓN

- [ ] Usuario está autenticado (`/api/auth/me` retorna 200)
- [ ] Usuario tiene `tenant_id` en respuesta de `/api/auth/me`
- [ ] El `tenant_id` coincide con las zonas en Supabase
- [ ] Las zonas existen en tabla `zones` con el `tenant_id` correcto
- [ ] Existe política RLS SELECT en tabla `zones`
- [ ] La política RLS permite acceso basado en `tenant_id`
- [ ] El usuario tiene rol adecuado (`staff` o `admin`)
- [ ] La consulta en Console del navegador muestra los logs correctamente

## 🎯 PRÓXIMOS PASOS

Una vez ejecutado el diagnóstico:

1. **Si el problema es tenant_id:** Actualizar la autenticación
2. **Si el problema es RLS:** Actualizar políticas en Supabase
3. **Si el problema es otro:** Revisar logs detallados en Console

---

## 📝 Logs Importantes

Los logs ahora incluyen:
- `[fetchZones]` - Cliente
- `[GET /api/zones]` - API
- `[listZones]` - Servidor/Supabase
- Cada log incluye ✅ para éxito y ❌ para error

Busca estos logs en la consola del navegador para rastrear exactamente dónde falla el flujo.
