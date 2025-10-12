# 🧪 Guía de Testing - Flujo de Autenticación y Dashboard

> **Fecha**: 12 de octubre de 2025  
> **Objetivo**: Verificar que el sistema de debugging funciona correctamente

---

## 🚀 Inicio rápido

### 1. Levantar el servidor de desarrollo

```powershell
npm run dev
```

Debería iniciar en `http://localhost:3000`

---

## 🔍 Test 1: Login y carga del Dashboard

### Pasos:

1. **Abrir el navegador**:
   - Ir a `http://localhost:3000`
   - Abrir DevTools (F12)
   - Ir a la pestaña **Console**

2. **Intentar acceder al dashboard sin sesión**:
   - Ir a `http://localhost:3000/dashboard`
   - **Resultado esperado**: 
     - Debe redirigir automáticamente a `/login`
     - En consola debe aparecer:
       ```
       🔒 Middleware ejecutado para: /dashboard
       ⚠️ No hay sesión válida, redirigiendo a /login
       ```

3. **Hacer login**:
   - En la página de login, ingresar credenciales válidas
   - Click en "Iniciar Sesión"
   - **Logs esperados en consola**:

   ```
   📝 Intentando login con: user@example.com
   ✅ Login exitoso, redirigiendo a dashboard...
   🔒 Middleware ejecutado para: /dashboard
   🔍 Middleware - Sesión: { hasSession: true, userId: "xxx" }
   ✅ Sesión válida, permitiendo acceso
   🚀 AuthProvider montado, iniciando carga de sesión...
   ⏳ Ejecutando loadSession...
   🔍 DEBUG: getSession result { hasSession: true, userId: "xxx" }
   ✅ Sesión válida encontrada, cargando datos...
   🔍 Llamando a /api/auth/me...
   📦 Respuesta de /api/auth/me: 200
   ✅ Datos recibidos: { hasUser: true, hasTenant: true }
   🔄 Cambio de estado de autenticación: SIGNED_IN
   ✅ SIGNED_IN detectado, cargando datos del usuario...
   🔍 Llamando a /api/auth/me...
   📦 Respuesta de /api/auth/me: 200
   ✅ Datos recibidos: { hasUser: true, hasTenant: true }
   ✅ Finalizando loadSession, actualizando isLoading y isHydrated
   🛡️ ProtectedRoute - Estado: { hasUser: true, isLoading: false }
   ✅ Usuario autenticado, verificando permisos...
   ✅ Usuario tiene permisos para acceder
   🔍 Dashboard useEffect ejecutado { hasUser: true, tenantId: "xxx" }
   📊 Cargando métricas para tenant: xxx
   ✅ Métricas cargadas
   ✅ Finalizando loadMetrics, isLoading → false
   ⏳ Dashboard en estado de carga...
   ✅ Renderizando Dashboard completo
   ```

4. **Verificar dashboard**:
   - La página debe mostrar el dashboard completo
   - Debe mostrar métricas del restaurante
   - No debe quedarse en spinner de carga

### ✅ Criterios de éxito:

- [ ] Secuencia completa de logs aparece
- [ ] Dashboard carga en < 3 segundos
- [ ] No hay errores en consola (excepto warnings de desarrollo)
- [ ] Métricas se muestran correctamente
- [ ] No hay spinner infinito

### ❌ Problemas comunes y diagnóstico:

| Síntoma | Causa probable | Solución |
|---------|---------------|----------|
| Spinner infinito | `isLoading` no cambia a `false` | Verificar que el `finally` en `loadSession()` se ejecuta |
| Dashboard vacío | Métricas no cargan | Verificar que `user.tenant_id` existe |
| Redirect loop | Middleware y ProtectedRoute en conflicto | Verificar logs para ver qué componente redirige |
| Error 401 en `/api/auth/me` | Cookies no se envían | Verificar configuración de Supabase SSR |

---

## 🔍 Test 2: Recargar página con sesión activa

### Pasos:

1. **Con sesión activa** (después de hacer login exitoso)
2. **Recargar la página** (F5 o Ctrl+R)
3. **Resultado esperado**:
   - No debe redirigir a login
   - Dashboard debe cargar directamente
   - Debe aparecer spinner brevemente
   - Logs deben mostrar recuperación de sesión

### Logs esperados:

```
🔒 Middleware ejecutado para: /dashboard
🔍 Middleware - Sesión: { hasSession: true, userId: "xxx" }
✅ Sesión válida, permitiendo acceso
🚀 AuthProvider montado, iniciando carga de sesión...
⏳ Ejecutando loadSession...
🔍 DEBUG: getSession result { hasSession: true, userId: "xxx" }
✅ Sesión válida encontrada, cargando datos...
(... resto de la secuencia ...)
```

### ✅ Criterios de éxito:

- [ ] Sesión persiste después de recargar
- [ ] No redirige a login
- [ ] Dashboard carga correctamente
- [ ] Tiempo de carga < 2 segundos

---

## 🔍 Test 3: Logout

### Pasos:

1. **Con sesión activa**, hacer click en botón de logout
2. **Resultado esperado**:
   - Redirige a `/login`
   - Limpia localStorage
   - Limpia cookies de Supabase

### Logs esperados:

```
🚪 SIGNED_OUT detectado, limpiando estado...
```

3. **Intentar acceder a `/dashboard` después del logout**:
   - Debe redirigir a `/login`
   - No debe tener sesión activa

### ✅ Criterios de éxito:

- [ ] Logout exitoso
- [ ] Redirige a login
- [ ] No puede acceder a rutas protegidas
- [ ] localStorage limpio
- [ ] Cookies de Supabase eliminadas

---

## 🔍 Test 4: Error en API `/api/auth/me`

### Simulación:

Temporalmente modificar `app/api/auth/me/route.ts` para que devuelva error:

```typescript
export async function GET() {
  // Simular error
  return new Response(JSON.stringify({ error: 'Simulated error' }), {
    status: 500,
  })
}
```

### Resultado esperado:

```
❌ Error en loadUserData: Error: Error al cargar datos del usuario
```

**Importante**: El flujo debe continuar, `isLoading` debe cambiar a `false`, y el usuario debe ver el dashboard (aunque sin datos completos).

### ✅ Criterios de éxito:

- [ ] No se queda en spinner infinito
- [ ] Se muestra mensaje de error o dashboard con datos vacíos
- [ ] El usuario puede seguir usando la aplicación
- [ ] `isLoading` cambia a `false`

**Recuerda revertir el cambio después del test.**

---

## 🔍 Test 5: Timeout en `/api/auth/me`

### Simulación:

Temporalmente modificar `app/api/auth/me/route.ts` para que tarde más de 10 segundos:

```typescript
export async function GET() {
  // Simular delay de 15 segundos
  await new Promise(resolve => setTimeout(resolve, 15000))
  
  return NextResponse.json({ data: { user, tenant } })
}
```

### Resultado esperado:

Después de 10 segundos:

```
❌ Error en loadUserData: AbortError: The user aborted a request.
✅ Finalizando loadSession, actualizando isLoading y isHydrated
```

### ✅ Criterios de éxito:

- [ ] Timeout se ejecuta a los 10 segundos
- [ ] No espera los 15 segundos completos
- [ ] El flujo continúa después del timeout
- [ ] Dashboard se muestra (posiblemente sin datos completos)

**Recuerda revertir el cambio después del test.**

---

## 🔍 Test 6: Credenciales incorrectas

### Pasos:

1. Intentar login con email/contraseña incorrectos
2. **Resultado esperado**:
   - No redirige al dashboard
   - Muestra mensaje de error: "Correo o contraseña incorrectos"
   - Logs:

```
📝 Intentando login con: wrong@email.com
❌ Error en login: Error: Correo o contraseña incorrectos
```

### ✅ Criterios de éxito:

- [ ] Mensaje de error amigable
- [ ] No redirige al dashboard
- [ ] Usuario puede reintentar
- [ ] No hay errores en consola (solo el log de error esperado)

---

## 📊 Checklist general de funcionamiento

### Flujo de autenticación:

- [ ] Login con credenciales válidas funciona
- [ ] Login con credenciales inválidas muestra error
- [ ] Redirección a dashboard después del login
- [ ] Dashboard carga correctamente
- [ ] Sesión persiste al recargar página
- [ ] Logout funciona correctamente
- [ ] Rutas protegidas redirigen a login sin sesión

### Performance:

- [ ] Dashboard carga en < 2 segundos (con sesión activa)
- [ ] Login completo en < 3 segundos
- [ ] No hay re-renders innecesarios
- [ ] Métricas se actualizan cada 30 segundos

### Logs de debugging:

- [ ] Todos los emojis aparecen correctamente
- [ ] Secuencia de logs es lógica y fácil de seguir
- [ ] Errores se muestran claramente con ❌
- [ ] Advertencias se muestran claramente con ⚠️
- [ ] Éxitos se muestran claramente con ✅

### Manejo de errores:

- [ ] Timeout en fetch funciona
- [ ] Try/catch/finally implementado correctamente
- [ ] Estados de loading siempre se resuelven
- [ ] Errores de red se manejan gracefully
- [ ] Usuario nunca queda bloqueado

---

## 🧹 Limpieza de logs (Opcional)

Una vez verificado que todo funciona, puedes:

### Opción 1: Deshabilitar en producción

Crear `.env.local`:

```env
NEXT_PUBLIC_DEBUG_MODE=true
```

En los archivos, usar:

```typescript
const DEBUG = process.env.NEXT_PUBLIC_DEBUG_MODE === 'true'

if (DEBUG) console.log('🔍 Debug info')
```

### Opción 2: Migrar a logger estructurado

Reemplazar `console.log` por `logger.debug`:

```typescript
import { logger } from '@/lib/logger'

// En lugar de:
console.log('🔍 Ejecutando loadSession...')

// Usar:
logger.debug('Ejecutando loadSession', { timestamp: new Date() })
```

### Opción 3: Mantener solo logs críticos

Mantener:
- ❌ Errores (siempre)
- ⚠️ Advertencias (siempre)
- 🔍 Debug (solo en desarrollo)

Eliminar:
- ✅ Mensajes de éxito (reducir ruido)
- 📊 Logs de datos (solo si son necesarios)

---

## 📝 Reportar problemas

Si encuentras un problema durante el testing:

1. **Capturar logs completos** de consola
2. **Anotar el paso exacto** donde ocurre
3. **Verificar tabla de errores comunes** en `IMPLEMENTATION_DEBUG_DASHBOARD.md`
4. **Agregar el problema** a la documentación si es nuevo

---

## 🎯 Objetivo final

Al completar todos los tests, deberías tener:

- ✅ Login funcionando correctamente
- ✅ Dashboard cargando sin problemas
- ✅ Sesión persistente al recargar
- ✅ Logout limpiando correctamente
- ✅ Manejo de errores robusto
- ✅ Logs útiles para debugging
- ✅ Performance óptima (< 2 segundos)

---

**Status**: 🧪 Listo para testing  
**Fecha**: 12 de octubre de 2025
