# 🎯 PLAN DE SOLUCIÓN: Problema de Zonas No Visibles

## 📊 Resumen Ejecutivo

Se ha creado un sistema completo de diagnóstico para resolver el problema de zonas que no se muestran en la interfaz, a pesar de existir en Supabase.

## 🛠️ Herramientas Creadas

### 1. Endpoint de Diagnóstico API
**Ruta:** `/api/debug/zones`
- Verifica autenticación del usuario
- Extrae tenant_id
- Consulta zonas con y sin RLS
- Identifica el problema específico
- Retorna JSON con diagnóstico completo

### 2. Panel Visual de Diagnóstico
**Ruta:** `/diagnostic`
- Interfaz gráfica para ejecutar diagnóstico
- Muestra resultados paso a paso
- Indica claramente el problema y solución
- Incluye datos detallados expandibles

### 3. Logging Detallado
Se agregaron console.log en:
- `lib/zones-service.ts` → `[fetchZones]`
- `app/api/zones/route.ts` → `[GET /api/zones]`
- `lib/server/zones-store.ts` → `[listZones]`

### 4. Scripts SQL
**Archivo:** `scripts/fix-zones-rls.sql`
- Diagnostica políticas RLS existentes
- Elimina políticas problemáticas
- Crea políticas correctas
- Incluye verificación y testing

### 5. Documentación Completa
**Archivo:** `docs/DIAGNOSTICO_ZONAS.md`
- Guía paso a paso
- Explicación de la arquitectura
- Soluciones para cada problema posible
- Checklist de verificación

## 🚀 PASOS PARA RESOLVER EL PROBLEMA

### Paso 1: Ejecutar Diagnóstico Automático

1. **Inicia el servidor de desarrollo:**
   ```powershell
   npm run dev
   ```

2. **Navega a la página de diagnóstico:**
   ```
   http://localhost:3000/diagnostic
   ```

3. **Haz clic en "Ejecutar Diagnóstico"**

4. **Lee la conclusión** que te indicará el problema específico

### Paso 2: Revisar Console del Navegador

1. Abre DevTools (F12)
2. Ve a la pestaña Console
3. Navega a `/mesas`
4. Busca los logs con prefijos:
   - `[fetchZones]`
   - `[GET /api/zones]`
   - `[listZones]`

### Paso 3: Aplicar la Solución Según el Diagnóstico

#### PROBLEMA A: Usuario sin tenant_id

**Síntoma:** Diagnóstico muestra "Usuario sin tenant asignado"

**Solución:**
1. Ve a Supabase Dashboard
2. Ejecuta esta query para verificar el usuario:
   ```sql
   SELECT id, tenant_id, email, role, active 
   FROM users 
   WHERE email = 'tu-email@ejemplo.com';
   ```
3. Si el usuario tiene tenant_id en la tabla pero no en session:
   - El problema está en el flujo de autenticación
   - Verifica que `/api/auth/me` retorne el tenant_id correctamente

#### PROBLEMA B: Políticas RLS Bloqueando Acceso

**Síntoma:** Diagnóstico muestra zonas con Service Role pero no con cliente normal

**Solución:**
1. Ve a Supabase Dashboard → SQL Editor
2. Copia y pega el contenido de `scripts/fix-zones-rls.sql`
3. Ejecuta el script completo
4. Esto recreará las políticas RLS correctas
5. Vuelve a la aplicación y recarga `/mesas`

#### PROBLEMA C: No hay zonas creadas

**Síntoma:** Diagnóstico muestra 0 zonas

**Solución:**
1. En la aplicación, navega a `/mesas`
2. Haz clic en "Crear zona"
3. Ingresa el nombre (ej: "Salón Principal")
4. Haz clic en "Guardar zona"

### Paso 4: Verificar la Solución

1. Recarga la página `/mesas`
2. Deberías ver las zonas listadas
3. El botón "Agregar mesa" debe mostrar las zonas en el dropdown
4. No debe aparecer el error "No se pudieron cargar las mesas"

## 🔍 DIAGNÓSTICOS ESPECÍFICOS

### Verificar tenant_id en sesión actual

**En Console del navegador:**
```javascript
const res = await fetch('/api/auth/me');
const data = await res.json();
console.log('User tenant_id:', data.data.user.tenant_id);
console.log('Tenant:', data.data.tenant);
```

### Verificar datos en Supabase

**En Supabase SQL Editor:**
```sql
-- Ver zonas existentes
SELECT id, tenant_id, name, active, created_at 
FROM zones 
ORDER BY created_at;

-- Ver tu usuario
SELECT id, tenant_id, name, email, role, active 
FROM users 
WHERE email = 'tu-email@ejemplo.com';

-- Ver políticas RLS
SELECT policyname, cmd, qual 
FROM pg_policies 
WHERE tablename = 'zones';
```

### Verificar que RLS está habilitado

**En Supabase SQL Editor:**
```sql
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public' AND tablename = 'zones';
```

Si `rowsecurity` es `false`, ejecuta:
```sql
ALTER TABLE zones ENABLE ROW LEVEL SECURITY;
```

## 📋 CHECKLIST DE VERIFICACIÓN

- [ ] Servidor de desarrollo corriendo (`npm run dev`)
- [ ] Usuario autenticado en la aplicación
- [ ] Diagnóstico ejecutado en `/diagnostic`
- [ ] Console del navegador revisada
- [ ] tenant_id presente en `/api/auth/me`
- [ ] RLS habilitado en tabla zones
- [ ] Políticas RLS correctas ejecutadas
- [ ] Zonas visibles en `/mesas`
- [ ] Dropdown de zonas funciona en "Agregar mesa"

## 🎯 CAUSAS RAÍZ IDENTIFICADAS

### 1. Políticas RLS Incorrectas o Ausentes
- **Probabilidad:** 🔴 ALTA
- **Impacto:** Las zonas existen pero no se muestran
- **Solución:** Ejecutar `scripts/fix-zones-rls.sql`

### 2. tenant_id No Disponible
- **Probabilidad:** 🟡 MEDIA
- **Impacto:** API rechaza peticiones
- **Solución:** Verificar autenticación y user_metadata

### 3. Error en Flujo de Datos
- **Probabilidad:** 🟢 BAJA
- **Impacto:** Errores en console
- **Solución:** Revisar logs detallados

## 📞 SIGUIENTE NIVEL DE SOPORTE

Si después de seguir todos los pasos el problema persiste:

1. **Captura screenshots de:**
   - Resultado del diagnóstico en `/diagnostic`
   - Console del navegador con logs
   - Tabla zones en Supabase
   - Políticas RLS en Supabase

2. **Comparte el JSON completo de:**
   - `/api/debug/zones`
   - `/api/auth/me`

3. **Verifica variables de entorno:**
   ```
   NEXT_PUBLIC_SUPABASE_URL=...
   NEXT_PUBLIC_SUPABASE_ANON_KEY=...
   SUPABASE_SERVICE_ROLE_KEY=...
   ```

## 🎉 RESULTADO ESPERADO

Después de aplicar las soluciones:

1. ✅ La página `/mesas` muestra las zonas
2. ✅ El filtro de zonas funciona correctamente
3. ✅ El botón "Crear zona" crea zonas exitosamente
4. ✅ El botón "Agregar mesa" muestra zonas en el dropdown
5. ✅ Las mesas se agrupan por zona correctamente
6. ✅ No aparecen mensajes de error

---

**Creado:** ${new Date().toISOString()}
**Versión:** 1.0.0
