# 🔍 Prompt — Diagnóstico y solución del Dashboard que se queda cargando después del login

> **Contexto**: Sistema de gestión de restaurantes con autenticación Supabase y arquitectura multi-tenant

Quiero que actúes como un desarrollador senior especializado en debugging de autenticación y manejo de estado con Supabase en aplicaciones Next.js 14 (App Router).

Tu tarea es diagnosticar y corregir el problema por el cual, después de loguearse, el usuario es redirigido al dashboard pero la página queda cargando indefinidamente y no muestra nada.

---

## 🧩 1. Análisis inicial — Identificar el punto de bloqueo

### Archivos críticos a revisar:

1. **`contexts/auth-context.tsx`** - Contexto global de autenticación
2. **`app/dashboard/page.tsx`** - Página principal del dashboard
3. **`components/protected-route.tsx`** - HOC de protección de rutas
4. **`middleware.ts`** - Middleware de Next.js para validación de sesión
5. **`lib/auth.ts`** - Cliente de autenticación Supabase
6. **`components/login-form.tsx`** - Formulario de inicio de sesión

### Puntos de verificación:

- [ ] **AuthContext (`contexts/auth-context.tsx`)**:
  - ¿El `useEffect` principal se ejecuta correctamente al montar?
  - ¿La función `loadSession()` obtiene la sesión de Supabase?
  - ¿El estado `isLoading` cambia correctamente a `false`?
  - ¿El estado `isHydrated` se actualiza a `true`?
  - ¿La función `loadUserData()` completa exitosamente?
  - ¿El listener `onAuthStateChange` captura el evento `SIGNED_IN`?

- [ ] **Dashboard Page (`app/dashboard/page.tsx`)**:
  - ¿El hook `useAuth()` obtiene correctamente `user`, `isLoading`?
  - ¿El `useEffect` de carga de métricas se ejecuta?
  - ¿La llamada a `/api/dashboard/metrics` devuelve datos?
  - ¿El `user.tenant_id` existe y es válido?
  - ¿El componente renderiza después de `setIsLoading(false)`?

- [ ] **ProtectedRoute (`components/protected-route.tsx`)**:
  - ¿El `useEffect` evalúa correctamente la existencia de `user`?
  - ¿Se redirige correctamente si no hay usuario?
  - ¿El render condicional permite mostrar `children` cuando hay usuario?

- [ ] **Middleware (`middleware.ts`)**:
  - ¿La función `getSession()` de Supabase devuelve sesión válida?
  - ¿El middleware permite el acceso a `/dashboard` con sesión válida?
  - ¿Las cookies se están configurando correctamente?

---

## 🧠 2. Verificación de sesión con Supabase

### Flujo esperado:

```typescript
1. Usuario envía credenciales → POST /api/auth/login
2. Supabase autentica → Retorna session + user
3. Cookies se guardan automáticamente
4. AuthContext escucha onAuthStateChange → SIGNED_IN
5. loadUserData() obtiene perfil completo desde /api/auth/me
6. AuthContext actualiza: user, tenant, session
7. isLoading → false, isHydrated → true
8. Router redirige a /dashboard
9. Middleware valida sesión en cookies
10. Dashboard renderiza con datos del usuario
```

### Verificaciones críticas:

```typescript
// En contexts/auth-context.tsx
const loadSession = async () => {
  try {
    const { data: { session: currentSession }, error } = await supabase.auth.getSession()
    
    console.log('🔍 DEBUG: getSession result', { 
      hasSession: !!currentSession, 
      error,
      userId: currentSession?.user?.id 
    })
    
    if (error) {
      logger.error('❌ Error al cargar sesión inicial', error)
      // IMPORTANTE: Asegurar que isLoading se pone en false
      setIsLoading(false)
      setIsHydrated(true)
      return
    }

    if (currentSession) {
      console.log('✅ Sesión válida encontrada, cargando datos...')
      setSession(currentSession)
      await loadUserData() // ⚠️ VERIFICAR QUE ESTA FUNCIÓN NO CUELGUE
    } else {
      console.log('⚠️ No hay sesión activa')
      setUser(null)
      setTenant(null)
      setSession(null)
    }
  } catch (error) {
    console.error('❌ Error crítico en loadSession', error)
    logger.error('Error al cargar sesión', error as Error)
  } finally {
    // ✅ CRÍTICO: Esto DEBE ejecutarse siempre
    console.log('✅ Finalizando loadSession, actualizando isLoading y isHydrated')
    setIsLoading(false)
    setIsHydrated(true)
  }
}
```

### Problema común detectado:

**Si `loadUserData()` falla o se cuelga**, el `finally` NO se ejecutará hasta que termine, causando que `isLoading` nunca pase a `false`.

**Solución**:

```typescript
const loadUserData = async () => {
  try {
    console.log('🔍 Llamando a /api/auth/me...')
    
    // AGREGAR TIMEOUT para evitar espera infinita
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 10000) // 10 segundos max
    
    const response = await fetch('/api/auth/me', {
      signal: controller.signal
    })
    
    clearTimeout(timeoutId)
    
    console.log('📦 Respuesta de /api/auth/me:', response.status)
    
    if (!response.ok) {
      throw new Error('Error al cargar datos del usuario')
    }

    const data = await response.json()
    console.log('✅ Datos recibidos:', { 
      hasUser: !!data.data?.user, 
      hasTenant: !!data.data?.tenant 
    })
    
    if (data.data?.user && data.data?.tenant) {
      setUser(data.data.user)
      setTenant(data.data.tenant)
      localStorage.setItem('restaurant_tenant', JSON.stringify(data.data.tenant))
    }
  } catch (error) {
    console.error('❌ Error en loadUserData:', error)
    logger.error('Error al cargar datos del usuario', error as Error)
    // NO lanzar error, solo loguear y continuar
    setUser(null)
    setTenant(null)
  }
}
```

---

## ⚙️ 3. Revisión del render del Dashboard

### Verificar el orden de evaluación:

```typescript
// En app/dashboard/page.tsx

export default function DashboardPage() {
  const { user } = useAuth() // ⚠️ ¿user está disponible?
  const [isLoading, setIsLoading] = useState(true) // ⚠️ Estado local de carga
  
  useEffect(() => {
    console.log('🔍 Dashboard useEffect ejecutado', { 
      hasUser: !!user, 
      tenantId: user?.tenant_id 
    })
    
    const loadMetrics = async () => {
      try {
        if (!user?.tenant_id) {
          console.error('❌ No se encontró tenant_id en user')
          setIsLoading(false) // ⚠️ IMPORTANTE: Actualizar estado aunque falle
          return
        }

        console.log('📊 Cargando métricas para tenant:', user.tenant_id)
        
        const response = await fetch(`/api/dashboard/metrics?tenantId=${user.tenant_id}`)
        
        if (!response.ok) {
          throw new Error('Error al cargar métricas')
        }

        const data = await response.json()
        console.log('✅ Métricas cargadas:', data)
        setMetrics(data.data || {})
      } catch (error) {
        console.error('❌ Error loading metrics:', error)
      } finally {
        console.log('✅ Finalizando loadMetrics, isLoading → false')
        setIsLoading(false) // ✅ CRÍTICO: SIEMPRE ejecutar
      }
    }
    
    if (user) {
      loadMetrics()
    } else {
      console.log('⚠️ Usuario no disponible aún, esperando...')
    }
  }, [user]) // ⚠️ Dependencia crítica

  // ⚠️ PROBLEMA COMÚN: Si AuthContext.isLoading nunca cambia a false,
  // este componente nunca se renderiza
  
  if (isLoading) {
    console.log('⏳ Dashboard en estado de carga...')
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    )
  }

  console.log('✅ Renderizando Dashboard completo')
  return (
    <ProtectedRoute>
      <DashboardLayout>
        {/* Contenido del dashboard */}
      </DashboardLayout>
    </ProtectedRoute>
  )
}
```

### Problema común #2: Doble loader

Si tanto `ProtectedRoute` como `DashboardPage` tienen su propio estado `isLoading`, y ambos dependen de `useAuth().isLoading`, puede haber conflicto.

**Solución**: Usar solo el `isLoading` del `AuthContext` para la protección de rutas, y un estado local separado para la carga de datos del dashboard.

---

## 🧩 4. Logs y validaciones - Sistema de debugging

### Agregar logs estratégicos:

```typescript
// 1. En contexts/auth-context.tsx - Al inicio del componente
useEffect(() => {
  console.log('🚀 AuthProvider montado, iniciando carga de sesión...')
  const supabase = createBrowserClient()
  
  const loadSession = async () => {
    console.log('⏳ Ejecutando loadSession...')
    // ... resto del código
  }
  
  loadSession()
}, [])

// 2. En middleware.ts - Al validar sesión
export async function middleware(request: NextRequest) {
  console.log('🔒 Middleware ejecutado para:', request.nextUrl.pathname)
  
  const { data: { session }, error } = await supabase.auth.getSession()
  console.log('🔍 Middleware - Sesión:', { 
    hasSession: !!session, 
    error: error?.message,
    pathname: request.nextUrl.pathname 
  })
  
  // ... resto del código
}

// 3. En components/login-form.tsx - Después del login
const handleSubmit = async (e: React.FormEvent) => {
  try {
    console.log('📝 Intentando login con:', email)
    await login(email, password)
    console.log('✅ Login exitoso, redirigiendo a dashboard...')
    router.push("/dashboard")
  } catch (err) {
    console.error('❌ Error en login:', err)
    // ...
  }
}

// 4. En components/protected-route.tsx
useEffect(() => {
  console.log('🛡️ ProtectedRoute - Estado:', { 
    hasUser: !!user, 
    isLoading,
    pathname: window.location.pathname 
  })
  
  if (!isLoading) {
    if (!user) {
      console.log('⚠️ No hay usuario, redirigiendo a login...')
      router.push("/login")
    } else {
      console.log('✅ Usuario autenticado, permitiendo acceso')
    }
  }
}, [user, isLoading, router])
```

### Checklist de verificación en consola:

Después de hacer login, deberías ver esta secuencia:

```
✅ Secuencia esperada:
1. 📝 Intentando login con: user@example.com
2. ✅ Login exitoso, redirigiendo a dashboard...
3. 🔒 Middleware ejecutado para: /dashboard
4. 🔍 Middleware - Sesión: { hasSession: true }
5. 🚀 AuthProvider montado, iniciando carga de sesión...
6. ⏳ Ejecutando loadSession...
7. 🔍 DEBUG: getSession result { hasSession: true, userId: "xxx" }
8. ✅ Sesión válida encontrada, cargando datos...
9. 🔍 Llamando a /api/auth/me...
10. 📦 Respuesta de /api/auth/me: 200
11. ✅ Datos recibidos: { hasUser: true, hasTenant: true }
12. ✅ Finalizando loadSession, actualizando isLoading y isHydrated
13. 🛡️ ProtectedRoute - Estado: { hasUser: true, isLoading: false }
14. ✅ Usuario autenticado, permitiendo acceso
15. 🔍 Dashboard useEffect ejecutado { hasUser: true, tenantId: "xxx" }
16. 📊 Cargando métricas para tenant: xxx
17. ✅ Métricas cargadas
18. ✅ Finalizando loadMetrics, isLoading → false
19. ✅ Renderizando Dashboard completo
```

Si la secuencia se detiene en algún punto, ESE es el problema.

---

## 🔧 5. Solución esperada - Checklist final

### Asegurarse de que el flujo sea:

- [x] Usuario se loguea → `AuthService.login()` llama a `/api/auth/login`
- [x] Supabase devuelve `session` → Cookies se guardan automáticamente
- [x] `onAuthStateChange` captura evento `SIGNED_IN`
- [x] `loadUserData()` obtiene perfil completo desde `/api/auth/me`
- [x] `AuthContext` actualiza: `user`, `tenant`, `session`
- [x] `isLoading` → `false`, `isHydrated` → `true`
- [x] Router ejecuta `push('/dashboard')`
- [x] Middleware valida sesión en `middleware.ts`
- [x] `ProtectedRoute` verifica usuario y permite acceso
- [x] Dashboard carga métricas desde `/api/dashboard/metrics`
- [x] Dashboard renderiza interfaz completa

### Validaciones críticas:

```typescript
// ✅ REGLA 1: SIEMPRE usar try/catch/finally en funciones async
async function someFunction() {
  try {
    // código que puede fallar
  } catch (error) {
    console.error('Error:', error)
    // NO relanzar el error si no es necesario
  } finally {
    // SIEMPRE actualizar estados de loading aquí
    setIsLoading(false)
  }
}

// ✅ REGLA 2: Timeout en llamadas fetch críticas
const controller = new AbortController()
const timeoutId = setTimeout(() => controller.abort(), 10000)
const response = await fetch(url, { signal: controller.signal })
clearTimeout(timeoutId)

// ✅ REGLA 3: Logs descriptivos en cada paso crítico
console.log('🔍 PASO X:', { datos_relevantes })

// ✅ REGLA 4: Verificar dependencias de useEffect
useEffect(() => {
  // ...
}, [user]) // ⚠️ Si user nunca se actualiza, esto no se ejecuta

// ✅ REGLA 5: Renders condicionales deben tener todas las salidas
if (isLoading) return <Loader />
if (!user) return null // ⚠️ Asegurar que hay salida para todos los casos
return <Dashboard /> // ✅ Caso exitoso
```

---

## 🧾 6. Limpieza y validación final

### Una vez corregido el flujo:

1. **Eliminar logs de debugging**:
   ```typescript
   // Buscar y eliminar todos los console.log agregados
   // O usar un flag de desarrollo:
   const DEBUG = process.env.NODE_ENV === 'development'
   if (DEBUG) console.log('...')
   ```

2. **Validar flujo completo**:
   - [ ] Usuario puede loguearse correctamente
   - [ ] Dashboard carga sin quedarse en loader
   - [ ] Métricas se muestran correctamente
   - [ ] No hay errores en consola
   - [ ] No hay warnings de React
   - [ ] Session persiste al recargar página
   - [ ] Logout funciona correctamente

3. **Verificar estados edge cases**:
   - [ ] Usuario con sesión expirada
   - [ ] Usuario sin tenant_id
   - [ ] API de métricas caída
   - [ ] Error de red durante login
   - [ ] Token inválido

4. **Performance**:
   - [ ] Dashboard carga en < 2 segundos
   - [ ] No hay re-renders innecesarios
   - [ ] Llamadas a API están optimizadas
   - [ ] useEffect no tiene dependencias faltantes

---

## 🎯 Objetivo final

Lograr que:

1. **Al iniciar sesión**, el usuario sea redirigido correctamente al dashboard
2. **La página cargue completamente** la interfaz sin quedarse colgada
3. **El flujo de sesión esté sincronizado**, estable y sin dependencias que fallen en tiempo de carga
4. **Los estados de loading** cambien correctamente en cada paso
5. **El usuario vea el dashboard completo** con sus métricas y datos en < 2 segundos

### Arquitectura del proyecto:

```
Login Flow:
┌─────────────────┐
│  LoginForm      │
│  components/    │
└────────┬────────┘
         │ login(email, pass)
         ↓
┌─────────────────┐
│  AuthContext    │
│  contexts/      │
└────────┬────────┘
         │ POST /api/auth/login
         ↓
┌─────────────────┐
│  Supabase Auth  │
│  (Cookies)      │
└────────┬────────┘
         │ onAuthStateChange
         ↓
┌─────────────────┐
│  loadUserData() │
│  GET /api/auth/me│
└────────┬────────┘
         │ user + tenant
         ↓
┌─────────────────┐
│  router.push    │
│  /dashboard     │
└────────┬────────┘
         │
         ↓
┌─────────────────┐
│  Middleware     │
│  middleware.ts  │
└────────┬────────┘
         │ validateSession
         ↓
┌─────────────────┐
│  ProtectedRoute │
│  components/    │
└────────┬────────┘
         │ if (user) allow
         ↓
┌─────────────────┐
│  DashboardPage  │
│  app/dashboard/ │
└────────┬────────┘
         │ loadMetrics()
         ↓
┌─────────────────┐
│  Dashboard UI   │
│  ✅ RENDERIZADO │
└─────────────────┘
```

---

## 📋 Comandos útiles para debugging

```powershell
# Ver logs del servidor Next.js en desarrollo
npm run dev

# Limpiar cache de Next.js
Remove-Item -Recurse -Force .next

# Verificar errores de TypeScript
npx tsc --noEmit

# Ver estado de Supabase
# (revisar cookies en DevTools → Application → Cookies)

# Logs estructurados con pino
# Revisar lib/logger.ts para mensajes estructurados
```

---

## 🚨 Errores comunes y soluciones

| Error | Causa | Solución |
|-------|-------|----------|
| Dashboard cargando infinitamente | `isLoading` nunca cambia a `false` | Verificar `finally` en `loadSession()` |
| `user` es `null` en Dashboard | `loadUserData()` falla silenciosamente | Agregar logs y timeout |
| Redirect loop login ↔ dashboard | Middleware y ProtectedRoute en conflicto | Verificar lógica de redirección |
| API `/api/auth/me` responde 401 | Cookies no se envían correctamente | Verificar configuración de Supabase cookies |
| `tenant_id` es `undefined` | Perfil de usuario incompleto en BD | Verificar estructura de tabla `users` |
| Métricas no cargan | Falta `tenant_id` en llamada API | Verificar que `user` existe antes de fetch |

---

**Resultado esperado**: Sistema de autenticación robusto, con manejo de errores completo, estados de carga correctos y debugging facilitado para futuras mejoras.
