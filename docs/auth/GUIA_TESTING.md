# 🧪 Guía de Testing - Sistema de Autenticación

## 📋 Preparación

### 1. Verificar Configuración

```bash
# Verificar que el proyecto compile sin errores
npm run build

# Iniciar servidor de desarrollo
npm run dev
```

### 2. Verificar Variables de Entorno

Archivo `.env.local` debe contener:

```env
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGc...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGc...
```

⚠️ **NO debe existir:** `NEXT_PUBLIC_BYPASS_AUTH=true`

---

## 🧪 Tests Manuales

### Test 1: Registro de Usuario Nuevo ✅

**Objetivo:** Verificar que se puede crear una cuenta nueva.

**Pasos:**
1. Abrir http://localhost:3000/login
2. Click en "¿No tienes cuenta? Créala aquí"
3. Llenar formulario:
   - Nombre: "Test User"
   - Email: "test@ejemplo.com"
   - Contraseña: "Test123!"
   - Confirmar contraseña: "Test123!"
4. Click "Crear Cuenta"

**Resultado Esperado:**
- ✅ Se crea la cuenta
- ✅ Auto-login exitoso
- ✅ Redirect a `/dashboard`
- ✅ Navbar muestra nombre del usuario

**Resultado Fallido:**
- ❌ Error en consola
- ❌ Mensaje de error "Este email ya está registrado"
- ❌ No redirige a dashboard

---

### Test 2: Login con Credenciales Correctas ✅

**Objetivo:** Verificar login con usuario existente.

**Pasos:**
1. Abrir http://localhost:3000/login
2. Ingresar email y contraseña correctos
3. Click "Iniciar Sesión"

**Resultado Esperado:**
- ✅ Login exitoso
- ✅ Redirect a `/dashboard`
- ✅ Usuario y tenant cargados en contexto
- ✅ No hay errores en consola

**Verificación Adicional:**
```javascript
// En consola del navegador:
localStorage.getItem('restaurant_tenant')
// Debe retornar JSON con datos del tenant
```

---

### Test 3: Login con Credenciales Incorrectas ❌

**Objetivo:** Verificar manejo de errores en login.

**Pasos:**
1. Abrir http://localhost:3000/login
2. Ingresar email: "test@ejemplo.com"
3. Ingresar contraseña: "incorrecta"
4. Click "Iniciar Sesión"

**Resultado Esperado:**
- ✅ Muestra mensaje: "Correo o contraseña incorrectos"
- ✅ No redirige
- ✅ Formulario sigue visible
- ✅ No hay errores en consola (solo warning en red)

---

### Test 4: Validaciones del Formulario 📝

**Objetivo:** Verificar validaciones client-side.

#### 4.1 Email Inválido
**Pasos:**
1. Ingresar email: "notanemail"
2. Ingresar contraseña: "Test123!"
3. Click "Iniciar Sesión"

**Resultado Esperado:**
- ✅ Browser muestra error de validación HTML5
- ✅ No se envía request

#### 4.2 Contraseña Corta (Registro)
**Pasos:**
1. Modo registro
2. Contraseña: "12345" (menos de 6)
3. Click "Crear Cuenta"

**Resultado Esperado:**
- ✅ Muestra: "La contraseña debe tener al menos 6 caracteres"

#### 4.3 Contraseñas No Coinciden (Registro)
**Pasos:**
1. Modo registro
2. Contraseña: "Test123!"
3. Confirmar: "Test456!"
4. Click "Crear Cuenta"

**Resultado Esperado:**
- ✅ Muestra: "Las contraseñas no coinciden"

---

### Test 5: Persistencia de Sesión 🔄

**Objetivo:** Verificar que la sesión persiste al recargar.

**Pasos:**
1. Hacer login exitoso
2. Esperar a estar en `/dashboard`
3. Recargar página (F5)

**Resultado Esperado:**
- ✅ Permanece en `/dashboard`
- ✅ Usuario sigue logueado
- ✅ No redirige a `/login`
- ✅ Datos del usuario se cargan automáticamente

**Verificación Adicional:**
```javascript
// En Application -> Cookies
// Debe haber cookies de Supabase:
// - sb-xxxxx-auth-token
// - sb-xxxxx-auth-token.0
// - sb-xxxxx-auth-token.1
```

---

### Test 6: Logout ↪️

**Objetivo:** Verificar que logout funciona correctamente.

**Pasos:**
1. Estar logueado en `/dashboard`
2. Click en botón de Logout (o icono de usuario → Cerrar Sesión)
3. Confirmar logout

**Resultado Esperado:**
- ✅ Redirect a `/login`
- ✅ Cookies de Supabase eliminadas
- ✅ localStorage limpio (excepto preferencias UI)
- ✅ Mensaje de éxito (opcional)

**Verificación Adicional:**
```javascript
// En consola:
localStorage.getItem('restaurant_tenant')
// Debe retornar null

// Application -> Cookies
// Cookies de auth deben estar vacías o eliminadas
```

---

### Test 7: Protección de Rutas 🔒

**Objetivo:** Verificar que rutas protegidas solo son accesibles con sesión.

#### 7.1 Sin Sesión
**Pasos:**
1. Asegurar no estar logueado (hacer logout)
2. Intentar acceder manualmente a http://localhost:3000/dashboard

**Resultado Esperado:**
- ✅ Redirect automático a `/login`
- ✅ URL cambia a `/login`
- ✅ Middleware bloqueó el acceso

#### 7.2 Con Sesión
**Pasos:**
1. Hacer login
2. Navegar a http://localhost:3000/dashboard

**Resultado Esperado:**
- ✅ Acceso permitido
- ✅ Dashboard se muestra correctamente
- ✅ Componentes protegidos se renderizan

#### 7.3 Sesión Expirada
**Pasos:**
1. Estar logueado
2. En Application -> Cookies, eliminar manualmente las cookies de Supabase
3. Recargar página
4. Intentar navegar a ruta protegida

**Resultado Esperado:**
- ✅ Redirect automático a `/login`
- ✅ Mensaje: "Tu sesión ha expirado" (opcional)

---

### Test 8: OAuth con Google 🔐

**Objetivo:** Verificar flujo de OAuth.

**Pasos:**
1. En `/login`, click "Continuar con Google"
2. Se abre popup/redirect a Google
3. Seleccionar cuenta de Google
4. Autorizar la aplicación

**Resultado Esperado:**
- ✅ Redirect de vuelta a la app
- ✅ URL temporal: `/api/auth/callback?code=...`
- ✅ Redirect final a `/dashboard`
- ✅ Usuario creado/logueado con datos de Google
- ✅ Email de Google visible en perfil

**Nota:** Requiere configurar OAuth en Supabase Dashboard.

---

### Test 9: Renovación Automática de Token 🔄

**Objetivo:** Verificar que el token se renueva automáticamente.

**Pasos:**
1. Hacer login
2. Abrir DevTools -> Console
3. Esperar ~55 minutos (token expira en 1 hora)
4. Observar logs de Supabase en consola

**Resultado Esperado:**
- ✅ Aparece log: "TOKEN_REFRESHED"
- ✅ Usuario sigue logueado
- ✅ No se interrumpe la sesión
- ✅ Nuevas requests usan nuevo token

**Verificación Rápida (sin esperar):**
```javascript
// En consola del navegador:
const { data } = await supabase.auth.refreshSession()
console.log('Token renovado:', data.session)
```

---

### Test 10: Listeners de Auth Context 👂

**Objetivo:** Verificar que el context escucha cambios de sesión.

**Pasos:**
1. Hacer login
2. Abrir DevTools -> Console
3. Ejecutar:
```javascript
// Forzar logout desde consola
const { createBrowserClient } = await import('./lib/supabase/client')
const supabase = createBrowserClient()
await supabase.auth.signOut()
```

**Resultado Esperado:**
- ✅ Context detecta el cambio
- ✅ `user` se pone en `null`
- ✅ Componentes reaccionan al cambio
- ✅ Redirect a `/login` (si está en ruta protegida)

---

## 🐛 Tests de Edge Cases

### Edge Case 1: Doble Click en Submit

**Pasos:**
1. Llenar formulario de login
2. Click rápido 2 veces en "Iniciar Sesión"

**Resultado Esperado:**
- ✅ Solo se envía 1 request
- ✅ Botón se deshabilita después del primer click
- ✅ Muestra spinner/loading

---

### Edge Case 2: Red Lenta/Sin Conexión

**Pasos:**
1. En DevTools -> Network, activar "Slow 3G"
2. Intentar hacer login

**Resultado Esperado:**
- ✅ Muestra estado de loading
- ✅ No se congela la UI
- ✅ Si falla: muestra error amigable "Error de conexión"

---

### Edge Case 3: Múltiples Tabs

**Pasos:**
1. Hacer login en Tab 1
2. Abrir Tab 2 en la misma app
3. Hacer logout en Tab 1
4. Volver a Tab 2 e intentar interactuar

**Resultado Esperado:**
- ✅ Tab 2 detecta el logout
- ✅ Tab 2 redirige a `/login` automáticamente
- ✅ Gracias a `onAuthStateChange` en ambas tabs

---

## 📊 Checklist Completo

Marca cada test después de ejecutarlo:

### Registro y Login
- [ ] Test 1: Registro de usuario nuevo
- [ ] Test 2: Login con credenciales correctas
- [ ] Test 3: Login con credenciales incorrectas
- [ ] Test 4.1: Email inválido
- [ ] Test 4.2: Contraseña corta
- [ ] Test 4.3: Contraseñas no coinciden

### Sesión
- [ ] Test 5: Persistencia de sesión (reload)
- [ ] Test 6: Logout
- [ ] Test 9: Renovación automática de token
- [ ] Test 10: Listeners de auth context

### Seguridad
- [ ] Test 7.1: Protección de rutas (sin sesión)
- [ ] Test 7.2: Protección de rutas (con sesión)
- [ ] Test 7.3: Sesión expirada

### OAuth
- [ ] Test 8: Login con Google

### Edge Cases
- [ ] Edge Case 1: Doble click en submit
- [ ] Edge Case 2: Red lenta/sin conexión
- [ ] Edge Case 3: Múltiples tabs

---

## 🔍 Verificación en Logs

### Logs Esperados en Consola del Navegador

**Al cargar la app:**
```
[AuthContext] Cargando sesión inicial...
[AuthContext] Sesión encontrada, cargando usuario
[Supabase] TOKEN_REFRESHED (si el token estaba próximo a expirar)
```

**Al hacer login:**
```
[AuthService] Iniciando login
[AuthService] Login completado exitosamente
[AuthContext] SIGNED_IN event recibido
[AuthContext] Usuario cargado: {id: "...", email: "..."}
```

**Al hacer logout:**
```
[AuthService] Cerrando sesión
[Supabase] Sesión cerrada
[AuthContext] SIGNED_OUT event recibido
[AuthContext] Usuario y tenant limpiados
```

### Logs Esperados en Consola del Servidor (Terminal)

**Al hacer login (API route):**
```
[API] POST /api/auth/login
[Supabase] Usuario autenticado: test@ejemplo.com
[API] Login exitoso - userId: xxx, tenantId: yyy (duration: 200ms)
```

**Al obtener usuario actual:**
```
[API] GET /api/auth/me
[API] Usuario encontrado: test@ejemplo.com (duration: 50ms)
```

---

## 🚨 Troubleshooting

### ❌ Error: "Invalid login credentials"

**Causa:** Email o contraseña incorrectos, o usuario no existe en Supabase.

**Solución:**
1. Verificar que el usuario existe en Supabase Dashboard → Authentication → Users
2. Verificar que la contraseña es correcta
3. Si es usuario nuevo, asegurar que se creó correctamente en el registro

---

### ❌ Error: "Usuario no encontrado o inactivo"

**Causa:** El usuario existe en `auth.users` de Supabase, pero no en la tabla `public.users`.

**Solución:**
1. Abrir Supabase Dashboard → Table Editor → users
2. Verificar que hay un registro con el email del usuario
3. Verificar que `active = true`
4. Si no existe, ejecutar:
```sql
INSERT INTO public.users (id, email, name, role, tenant_id, active)
VALUES (
  'uuid-del-auth-user',
  'test@ejemplo.com',
  'Test User',
  'admin',
  'uuid-del-tenant',
  true
);
```

---

### ❌ Error: "Missing Supabase environment variables"

**Causa:** Variables de entorno no configuradas.

**Solución:**
1. Verificar que `.env.local` existe
2. Verificar que contiene `NEXT_PUBLIC_SUPABASE_URL` y `NEXT_PUBLIC_SUPABASE_ANON_KEY`
3. Reiniciar el servidor de desarrollo: `npm run dev`

---

### ❌ Sesión no persiste al recargar

**Causa:** Cookies de Supabase no se están guardando correctamente.

**Solución:**
1. Verificar que `createBrowserClient` en `lib/supabase/client.ts` está implementado correctamente
2. Verificar que no hay errores en la consola relacionados con cookies
3. Probar en modo incógnito (podría ser extensión del navegador)
4. Verificar configuración de Supabase en Dashboard → Settings → API

---

### ❌ Redirect loop entre /login y /dashboard

**Causa:** Middleware y ProtectedRoute en conflicto, o sesión en estado inconsistente.

**Solución:**
1. Hacer logout completo
2. Limpiar cookies manualmente (DevTools → Application → Cookies)
3. Limpiar localStorage: `localStorage.clear()`
4. Recargar la app
5. Intentar login de nuevo

---

## ✅ Criterios de Éxito

El sistema se considera **funcional y estable** cuando:

- ✅ Todos los tests pasan
- ✅ No hay errores en consola (solo warnings aceptables de libraries)
- ✅ No hay bypasses de autenticación activos
- ✅ Sesión persiste correctamente
- ✅ Tokens se renuevan automáticamente
- ✅ Rutas protegidas funcionan
- ✅ Mensajes de error son claros y en español
- ✅ UX es fluida (loading states, sin parpadeos)

---

## 📞 Soporte

Si algún test falla persistentemente:

1. Revisar logs en consola del navegador
2. Revisar logs en terminal del servidor
3. Consultar `/docs/auth/REFACTORIZACION_LOGIN.md`
4. Verificar configuración de Supabase
5. Ejecutar script de verificación: `npm run verify-auth`

---

**Última actualización:** Octubre 12, 2025  
**Versión:** 1.0.0
