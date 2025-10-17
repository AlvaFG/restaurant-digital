# 🔧 FIX: Acceso a Tenant bloqueado por RLS

## 🎯 Problema identificado

El tenant **SÍ EXISTE** en la base de datos, pero las políticas de Row Level Security (RLS) impedían que el endpoint `/api/auth/me` lo accediera.

### Error original:
```
❌ GET http://localhost:3000/api/auth/me 401 (Unauthorized)
❌ Respuesta: {"error":"Configuración de tenant no encontrada"}
```

### Causa raíz:
El endpoint usaba el cliente Supabase con **Anon Key**, que respeta RLS. La política RLS de `tenants` requiere:

```sql
CREATE POLICY tenant_isolation_policy ON tenants
  FOR ALL
  USING (id = current_tenant_id());
```

Pero durante el login, el JWT **aún no tiene el `tenant_id`** (porque lo necesitamos obtener primero), creando un deadlock:
- Para obtener el tenant, necesitamos el tenant_id en el JWT
- Para poner el tenant_id en el JWT, necesitamos obtener el tenant primero

---

## ✅ Solución implementada

### 1. Creamos `createServiceRoleClient()` en `lib/supabase/server.ts`

Este cliente usa la **Service Role Key** que bypasea RLS:

```typescript
export function createServiceRoleClient() {
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  // ... crea cliente con service role
}
```

### 2. Actualizamos `/api/auth/me` para usar Service Role

**Solo para la búsqueda del tenant**, usamos el cliente admin:

```typescript
// Usar Service Role client para bypassear RLS al buscar tenant
const supabaseAdmin = createServiceRoleClient()

const { data: tenantDataArray } = await supabaseAdmin
  .from('tenants')
  .select('id, name, slug, settings')
  .eq('id', userDataTyped.tenant_id)
  .limit(1)
```

**El resto del endpoint sigue usando el cliente normal** (con RLS) para mantener la seguridad.

---

## 🚀 Pasos para aplicar el fix

### 1. Verificar variable de entorno

Asegúrate de tener `SUPABASE_SERVICE_ROLE_KEY` en tu archivo `.env.local`:

```bash
NEXT_PUBLIC_SUPABASE_URL=https://tu-proyecto.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGc...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGc...  # ⚠️ Esta es nueva/importante
```

**¿Dónde encontrar el Service Role Key?**
1. Ve a tu proyecto en https://supabase.com/dashboard
2. Settings → API
3. Sección "Project API keys"
4. Copia el valor de **"service_role" (secret)**

### 2. Reiniciar el servidor de desarrollo

**Detén el servidor actual** (Ctrl+C en la terminal donde corre `npm run dev`)

**Reinicia el servidor:**
```powershell
npm run dev
```

⚠️ **IMPORTANTE**: Next.js solo lee `.env.local` al iniciar, por eso necesitas reiniciar.

### 3. Probar el login

1. Recarga el navegador (F5)
2. Haz login con tus credenciales
3. Deberías ver en la consola:

```
✅ [AuthContext] Login completado exitosamente
🔄 SIGNED_IN detectado, cargando datos del usuario...
🔄 Llamando a /api/auth/me...
🔍 [/api/auth/me] Buscando tenant: 46824e99-1d3f-4a13-8e96-17797f6149af
✅ [/api/auth/me] Resultado de búsqueda de tenant: { found: true, ... }
✅ [/api/auth/me] Datos obtenidos exitosamente
✅ Respuesta de /api/auth/me: 200
✅ Renderizando Dashboard completo
```

---

## 🔍 Verificación

### Verificar que el Service Role Key esté disponible:

```powershell
# En PowerShell, desde la raíz del proyecto:
node -e "require('dotenv').config({ path: '.env.local' }); console.log('Service Role Key:', process.env.SUPABASE_SERVICE_ROLE_KEY ? 'CONFIGURADA ✅' : 'FALTA ❌')"
```

### Verificar que el tenant existe:

En Supabase Studio:
```sql
SELECT id, name, slug 
FROM tenants 
WHERE id = '46824e99-1d3f-4a13-8e96-17797f6149af';
```

Debe retornar 1 registro.

---

## 📊 Archivos modificados

### ✅ `lib/supabase/server.ts`
- ✅ Agregada función `createServiceRoleClient()`

### ✅ `app/api/auth/me/route.ts`
- ✅ Importado `createServiceRoleClient`
- ✅ Cambiada búsqueda de tenant para usar Service Role

---

## ⚠️ Notas de seguridad

### Service Role Key - ¿Es seguro?

**SÍ**, porque:

1. **Solo se usa en el servidor** - Nunca se expone al cliente
2. **Solo para esta operación específica** - Búsqueda inicial del tenant
3. **El resto del código usa Anon Key** - Respeta RLS normalmente
4. **Validamos la sesión primero** - Solo usuarios autenticados pueden llamar este endpoint

### ¿Por qué no usar Service Role para todo?

Bypassear RLS para todo sería **inseguro**. Solo lo usamos donde es absolutamente necesario:
- ✅ Obtener tenant inicial después de login
- ❌ No para queries normales de datos
- ❌ No para operaciones de usuarios

---

## 🎯 Resultado esperado

Después de aplicar este fix:

1. ✅ Login exitoso
2. ✅ `/api/auth/me` devuelve 200 OK con user + tenant
3. ✅ Dashboard carga correctamente con métricas
4. ✅ No más loading infinito
5. ✅ Logs limpios en consola

---

## 🐛 Troubleshooting

### "Missing Supabase Service Role environment variables"

**Causa**: Falta la variable `SUPABASE_SERVICE_ROLE_KEY`

**Solución**:
1. Agrégala a `.env.local`
2. Reinicia el servidor

### "Still getting 401"

**Causa**: El servidor no reinició o la key es incorrecta

**Solución**:
1. Verifica que la key sea la correcta (copia de Supabase Dashboard)
2. Asegúrate de reiniciar con `Ctrl+C` y luego `npm run dev`
3. Verifica que el archivo sea `.env.local` (no `.env`)

### "Tenant not found"

**Causa**: El tenant realmente no existe

**Solución**:
1. Ve a Supabase Studio → Table Editor → `tenants`
2. Verifica que existe el registro con ID: `46824e99-1d3f-4a13-8e96-17797f6149af`
3. Si no existe, créalo siguiendo `docs/SOLUCION_TENANT_FALTANTE.md`

---

**Status**: ✅ Fix implementado, esperando reinicio de servidor
**Tiempo estimado**: 1-2 minutos
**Próximo paso**: Reiniciar servidor y probar login
