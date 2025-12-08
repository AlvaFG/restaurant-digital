# 📋 Plan Completo: Migración a Arquitectura Unificada [locale]

## 🎯 Objetivo Final
Eliminar la dualidad de rutas moviendo TODAS las páginas bajo `app/[locale]/`, logrando:
- ✅ URLs consistentes con i18n: `/es/dashboard`, `/en/mesas`, etc.
- ✅ Middleware simplificado
- ✅ Arquitectura profesional y escalable
- ✅ Sin workarounds temporales

---

## 📊 Estado Actual vs Estado Final

### Estado Actual (Dualidad)
```
app/
├── layout.tsx (root minimal)
├── [locale]/
│   ├── layout.tsx (completo con providers)
│   ├── page.tsx (landing)
│   └── login/page.tsx
├── dashboard/page.tsx ❌ Sin locale
├── mesas/page.tsx ❌ Sin locale
├── (public)/ ✅ Correcto (sin locale por diseño)
│   ├── qr/
│   └── payment/
```

### Estado Final (Unificado)
```
app/
├── layout.tsx (root minimal)
├── [locale]/
│   ├── layout.tsx (completo)
│   ├── page.tsx (landing)
│   ├── login/page.tsx
│   ├── dashboard/ ✅ Con locale
│   │   ├── page.tsx
│   │   └── _components/ (si tiene)
│   ├── mesas/ ✅ Con locale
│   │   ├── page.tsx
│   │   ├── [id]/page.tsx
│   │   ├── editor/page.tsx
│   │   └── _hooks/ (si tiene)
│   ├── menu/ ✅ Con locale
│   ├── pedidos/ ✅ Con locale
│   ├── analitica/ ✅ Con locale
│   └── ... (todas las demás)
├── (public)/ ✅ Sin cambios
│   ├── qr/
│   └── payment/
```

---

## 🚀 FASE 1: Inventario Completo

### 1.1 Mapear Todos los Archivos

Ejecutar para listar TODO lo que hay que mover:

```powershell
# Páginas principales
Get-ChildItem -Path "app" -Recurse -Filter "page.tsx" | 
  Where-Object { $_.FullName -notmatch "\\[locale\\]" -and $_.FullName -notmatch "\\\(public\)" } |
  Select-Object FullName

# Subdirectorios auxiliares (_components, _hooks, _providers, etc.)
Get-ChildItem -Path "app" -Recurse -Directory | 
  Where-Object { $_.Name -like "_*" -and $_.FullName -notmatch "\\[locale\\]" -and $_.FullName -notmatch "\\\(public\)" } |
  Select-Object FullName

# Archivos de prueba
Get-ChildItem -Path "app" -Recurse -Filter "*.test.tsx" | 
  Where-Object { $_.FullName -notmatch "\\[locale\\]" -and $_.FullName -notmatch "\\\(public\)" } |
  Select-Object FullName

# Otros archivos (loading.tsx, error.tsx, layout.tsx, etc.)
Get-ChildItem -Path "app" -Recurse -File | 
  Where-Object { 
    $_.Name -match "loading|error|not-found" -and 
    $_.FullName -notmatch "\\[locale\\]" -and 
    $_.FullName -notmatch "\\\(public\)" 
  } |
  Select-Object FullName
```

### 1.2 Lista de Páginas a Migrar (18 páginas)

1. `app/dashboard/page.tsx`
2. `app/mesas/page.tsx`
3. `app/mesas/editor/page.tsx`
4. `app/mesas/[id]/page.tsx`
5. `app/menu/page.tsx`
6. `app/pedidos/page.tsx`
7. `app/salon/page.tsx`
8. `app/alertas/page.tsx`
9. `app/analitica/page.tsx`
10. `app/configuracion/page.tsx`
11. `app/configuracion/zonas/page.tsx`
12. `app/configuracion/notificaciones/page.tsx`
13. `app/usuarios/page.tsx`
14. `app/qr-management/page.tsx`
15. `app/integraciones/page.tsx`
16. `app/diagnostic/page.tsx`
17. `app/offline/page.tsx`
18. `app/test-error/page.tsx`

### 1.3 Subdirectorios Auxiliares a Migrar

```
app/analitica/_components/  (12 archivos)
app/analitica/loading.tsx
app/menu/_hooks/
app/menu/__tests__/
app/pedidos/__tests__/
app/pedidos/_providers/ (si existe)
app/configuracion/notificaciones/client-page.tsx
```

---

## 🚀 FASE 2: Crear Estructura de Directorios

```powershell
cd C:\Users\alvar\Downloads\restaurantmanagement

# Crear todos los directorios necesarios de una vez
$dirs = @(
  "app\[locale]\dashboard",
  "app\[locale]\mesas",
  "app\[locale]\mesas\editor",
  "app\[locale]\mesas\[id]",
  "app\[locale]\menu",
  "app\[locale]\menu\_hooks",
  "app\[locale]\menu\__tests__",
  "app\[locale]\pedidos",
  "app\[locale]\pedidos\_providers",
  "app\[locale]\pedidos\__tests__",
  "app\[locale]\salon",
  "app\[locale]\alertas",
  "app\[locale]\analitica",
  "app\[locale]\analitica\_components",
  "app\[locale]\configuracion",
  "app\[locale]\configuracion\zonas",
  "app\[locale]\configuracion\notificaciones",
  "app\[locale]\usuarios",
  "app\[locale]\qr-management",
  "app\[locale]\integraciones",
  "app\[locale]\diagnostic",
  "app\[locale]\offline",
  "app\[locale]\test-error"
)

foreach ($dir in $dirs) {
  New-Item -ItemType Directory -Force -Path $dir | Out-Null
}

Write-Host "✅ Estructura de directorios creada"
```

---

## 🚀 FASE 3: Mover Archivos con Robocopy

### 3.1 Mover Páginas y sus Contenidos

```powershell
# Función helper para mover directorios completos
function Move-AppDirectory {
  param([string]$source, [string]$dest)
  
  if (Test-Path $source) {
    robocopy $source $dest /E /MOVE /NFL /NDL /NJH /NJS
    Write-Host "✅ Movido: $source -> $dest"
  }
}

# Mover cada directorio
Move-AppDirectory "app\dashboard" "app\[locale]\dashboard"
Move-AppDirectory "app\mesas" "app\[locale]\mesas"
Move-AppDirectory "app\menu" "app\[locale]\menu"
Move-AppDirectory "app\pedidos" "app\[locale]\pedidos"
Move-AppDirectory "app\salon" "app\[locale]\salon"
Move-AppDirectory "app\alertas" "app\[locale]\alertas"
Move-AppDirectory "app\analitica" "app\[locale]\analitica"
Move-AppDirectory "app\configuracion" "app\[locale]\configuracion"
Move-AppDirectory "app\usuarios" "app\[locale]\usuarios"
Move-AppDirectory "app\qr-management" "app\[locale]\qr-management"
Move-AppDirectory "app\integraciones" "app\[locale]\integraciones"
Move-AppDirectory "app\diagnostic" "app\[locale]\diagnostic"
Move-AppDirectory "app\offline" "app\[locale]\offline"
Move-AppDirectory "app\test-error" "app\[locale]\test-error"

Write-Host "✅ Todos los archivos movidos"
```

### 3.2 Limpiar Directorios Vacíos

```powershell
# Eliminar directorios legacy vacíos
$legacyDirs = @(
  "app\dashboard",
  "app\mesas",
  "app\menu",
  "app\pedidos",
  "app\salon",
  "app\alertas",
  "app\analitica",
  "app\configuracion",
  "app\usuarios",
  "app\qr-management",
  "app\integraciones",
  "app\diagnostic",
  "app\offline",
  "app\test-error"
)

foreach ($dir in $legacyDirs) {
  if (Test-Path $dir) {
    Remove-Item -Recurse -Force $dir -ErrorAction SilentlyContinue
  }
}

Write-Host "✅ Directorios legacy eliminados"
```

---

## 🚀 FASE 4: Actualizar Imports

### 4.1 Actualizar Imports en Componentes

Buscar y reemplazar en TODOS los archivos:

**Buscar:** `@/app/analitica/_components/`
**Reemplazar con:** `@/app/[locale]/analitica/_components/`

**Buscar:** `@/app/menu/_hooks/`
**Reemplazar con:** `@/app/[locale]/menu/_hooks/`

**Buscar:** `@/app/pedidos/_providers/`
**Reemplazar con:** `@/app/[locale]/pedidos/_providers/`

```powershell
# Script automatizado para actualizar imports
$files = Get-ChildItem -Path "app","components" -Recurse -Include "*.tsx","*.ts" -File

foreach ($file in $files) {
  $content = Get-Content $file.FullName -Raw
  $updated = $content `
    -replace '@/app/analitica/_components/', '@/app/[locale]/analitica/_components/' `
    -replace '@/app/menu/_hooks/', '@/app/[locale]/menu/_hooks/' `
    -replace '@/app/pedidos/_providers/', '@/app/[locale]/pedidos/_providers/'
  
  if ($content -ne $updated) {
    Set-Content $file.FullName -Value $updated -NoNewline
    Write-Host "✅ Actualizado: $($file.Name)"
  }
}

Write-Host "✅ Todos los imports actualizados"
```

---

## 🚀 FASE 5: Actualizar Middleware

Reemplazar el middleware con esta versión simplificada:

```typescript
// middleware.ts
import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import { createServerClient, type CookieOptions } from "@supabase/ssr"
import createIntlMiddleware from 'next-intl/middleware';
import { locales } from './i18n';

// i18n middleware ahora aplica a TODAS las rutas bajo [locale]
const intlMiddleware = createIntlMiddleware({
  locales,
  defaultLocale: 'es',
  localePrefix: 'as-needed',
  localeDetection: true,
});

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // 1. Skip static assets and API
  if (
    pathname.startsWith("/_next") || 
    pathname.startsWith("/api") ||
    pathname.startsWith("/favicon") || 
    pathname.startsWith("/apple-") ||
    pathname.startsWith("/icon") ||
    pathname.startsWith("/manifest") ||
    pathname.startsWith("/sw") ||
    pathname.startsWith("/workbox-") ||
    (pathname.includes(".") && !pathname.endsWith("/"))
  ) {
    return NextResponse.next()
  }

  // 2. Public routes sin locale (QR flows)
  if (pathname.startsWith("/qr") || pathname.startsWith("/payment")) {
    return NextResponse.next()
  }

  // 3. Aplicar i18n a todo lo demás
  const intlResponse = intlMiddleware(request)
  
  // Extraer pathname sin locale
  const localeMatch = pathname.match(/^\/(es|en)/)
  const pathnameWithoutLocale = localeMatch ? pathname.slice(3) : pathname
  
  // 4. Rutas públicas con locale (landing + login)
  if (pathnameWithoutLocale === "/" || pathnameWithoutLocale === "/login") {
    return intlResponse
  }

  // 5. Todas las demás rutas requieren auth
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!supabaseUrl || !supabaseAnonKey) {
    return NextResponse.redirect(new URL('/login', request.url))
  }

  let response = NextResponse.next({
    request: { headers: request.headers },
  })

  const supabase = createServerClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      get(name: string) {
        return request.cookies.get(name)?.value
      },
      set(name: string, value: string, options: CookieOptions) {
        request.cookies.set({ name, value, ...options })
        response = NextResponse.next({ request: { headers: request.headers } })
        response.cookies.set({ name, value, ...options })
      },
      remove(name: string, options: CookieOptions) {
        request.cookies.set({ name, value: '', ...options })
        response = NextResponse.next({ request: { headers: request.headers } })
        response.cookies.set({ name, value: '', ...options })
      },
    },
  })

  const { data: { session }, error } = await supabase.auth.getSession()

  if (error || !session) {
    return NextResponse.redirect(new URL('/login', request.url))
  }

  return response
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
}
```

---

## 🚀 FASE 6: Actualizar Root Layout

```typescript
// app/layout.tsx
import type { ReactNode } from 'react';

// Minimal root layout required by Next.js
export default function RootLayout({
  children,
}: {
  children: ReactNode;
}) {
  return children;
}
```

---

## 🚀 FASE 7: Testing y Validación

### 7.1 Build Local

```powershell
npm run build
```

Si hay errores:
- Verificar que todos los imports estén actualizados
- Verificar que todos los archivos auxiliares se hayan movido
- Buscar referencias hardcodeadas a rutas antiguas

### 7.2 Test de Rutas

Después del build exitoso, probar estas rutas:

```
✅ / → redirige a /es o muestra landing
✅ /login → muestra login
✅ /es/dashboard → dashboard en español
✅ /en/dashboard → dashboard en inglés
✅ /es/mesas → gestión de mesas
✅ /qr/[id] → flujo QR (sin locale, correcto)
✅ /payment/success → pago exitoso (sin locale, correcto)
```

### 7.3 Verificar que no existan rutas legacy

```powershell
# No debería devolver nada
Test-Path "app\dashboard"
Test-Path "app\mesas"
Test-Path "app\menu"
```

---

## 🚀 FASE 8: Commit y Deploy

```powershell
git add .
git commit -m "feat: Migrate all routes to unified [locale] architecture

BREAKING CHANGE: All protected routes now require locale prefix
- Moved 18 pages from app/* to app/[locale]/*
- Moved all auxiliary files (_components, _hooks, _providers)
- Simplified middleware - single source of truth for routing
- Updated all imports to new paths
- URLs now: /es/dashboard, /en/mesas, etc.
- Public QR/payment routes remain locale-free by design

Benefits:
- Consistent i18n across entire app
- Cleaner middleware logic
- Professional URL structure
- Easier to maintain and scale
- No more routing duality"

git push origin main
```

---

## 📝 Notas Importantes

### ⚠️ Breaking Changes para Usuarios

- **Bookmarks antiguos**: `/dashboard` → `/es/dashboard`
- **Links compartidos**: Necesitarán actualizarse
- **Emails con links**: Actualizar templates

### ✅ Rutas que NO Cambian

- `/qr/[id]` - Flujo QR público
- `/payment/*` - Flujos de pago
- `/api/*` - APIs

### 🔄 Rollback Plan

Si algo sale mal:

```powershell
git reset --hard HEAD~1
git push origin main --force
```

---

## 🎯 Beneficios Post-Migración

1. **URLs Profesionales**: `/es/dashboard`, `/en/settings`
2. **Middleware Simple**: Una sola lógica, fácil de entender
3. **i18n Consistente**: Todo bajo control de next-intl
4. **Mejor SEO**: URLs localizadas correctamente
5. **Escalable**: Agregar nuevos locales es trivial
6. **Mantenible**: Sin código duplicado ni workarounds

---

## 📚 Referencias

- [next-intl Routing](https://next-intl-docs.vercel.app/docs/routing)
- [Next.js App Router](https://nextjs.org/docs/app/building-your-application/routing)
- [i18n Best Practices](https://www.i18next.com/principles/best-practices)

---

**Tiempo Estimado:** 2-3 horas
**Complejidad:** Media-Alta
**Riesgo:** Medio (con plan de rollback)
**Recomendación:** Ejecutar en rama separada primero

---

## 🚦 Checklist de Ejecución

- [ ] Fase 1: Inventario completo
- [ ] Fase 2: Crear estructura
- [ ] Fase 3: Mover archivos
- [ ] Fase 4: Actualizar imports
- [ ] Fase 5: Actualizar middleware
- [ ] Fase 6: Actualizar root layout
- [ ] Fase 7: Testing local
- [ ] Fase 8: Deploy a producción
- [ ] Verificar que todo funcione en iPhone
- [ ] Verificar que todo funcione en navegadores de escritorio
- [ ] Actualizar documentación
- [ ] Comunicar cambios al equipo

---

**Autor**: GitHub Copilot
**Fecha**: Diciembre 8, 2025
**Versión**: 1.0
