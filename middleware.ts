import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import { createServerClient, type CookieOptions } from "@supabase/ssr"
import createIntlMiddleware from 'next-intl/middleware';
import { locales } from './i18n';

// Create i18n middleware with flexible prefix strategy
const intlMiddleware = createIntlMiddleware({
  locales,
  defaultLocale: 'es',
  localePrefix: 'as-needed',
  localeDetection: true,
});

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  console.log('🔒 [Middleware] Ejecutado para:', pathname)
  
  // Skip middleware for static assets
  const isStaticAsset = pathname.startsWith("/_next") || 
                        pathname.startsWith("/favicon") || 
                        pathname.startsWith("/apple-") ||
                        pathname.startsWith("/icon") ||
                        pathname.startsWith("/manifest") ||
                        pathname.startsWith("/sw") ||
                        pathname.startsWith("/workbox-") ||
                        (pathname.includes(".") && !pathname.endsWith("/"))
  const isApiRoute = pathname.startsWith("/api")
  
  if (isStaticAsset || isApiRoute) {
    return NextResponse.next()
  }

  // Public routes that bypass auth (these are in (public) folder)
  const bypassRoutes = ["/qr", "/payment"]
  const isBypassRoute = bypassRoutes.some(route => pathname.startsWith(route))
  
  if (isBypassRoute) {
    console.log('✅ [Middleware] Ruta pública bypass:', pathname)
    return NextResponse.next()
  }

  // Check if this is a locale-prefixed route or root route
  const hasLocale = locales.some(locale => 
    pathname === `/${locale}` || pathname.startsWith(`/${locale}/`)
  )
  const isRootPath = pathname === '/' || pathname === ''

  // Apply i18n middleware only for locale routes and root
  if (hasLocale || isRootPath) {
    const intlResponse = intlMiddleware(request);
    const pathnameAfterIntl = intlResponse.headers.get('x-middleware-request-url') || pathname
    const pathnameWithoutLocale = pathnameAfterIntl.replace(/^\/(es|en)/, '') || '/'
    const publicPaths = ["/", "/login"]
    const isPublicPath = publicPaths.includes(pathnameWithoutLocale)
    
    // Allow public paths without auth validation
    if (isPublicPath) {
      console.log('✅ [Middleware] Ruta pública con locale:', pathnameWithoutLocale)
      return intlResponse
    }
  }
  
  // For non-locale routes (legacy protected routes like /dashboard, /mesas, etc)
  // continue with auth validation
  const pathnameWithoutLocale = pathname.replace(/^\/(es|en)/, '') || '/'

  console.log('🔍 [Middleware] Validando autenticación para:', pathname)

  // Verificar que las variables de entorno estén configuradas
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!supabaseUrl || !supabaseAnonKey) {
    console.error('❌ [Middleware] Variables de entorno de Supabase no configuradas')
    // En desarrollo o si falta configuración, redirigir a login
    const loginUrl = new URL('/es/login', request.url)
    return NextResponse.redirect(loginUrl)
  }

  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  })

  // Create Supabase client with cookie handling
  const supabase = createServerClient(
    supabaseUrl,
    supabaseAnonKey,
    {
      cookies: {
        get(name: string) {
          return request.cookies.get(name)?.value
        },
        set(name: string, value: string, options: CookieOptions) {
          request.cookies.set({
            name,
            value,
            ...options,
          })
          response = NextResponse.next({
            request: {
              headers: request.headers,
            },
          })
          response.cookies.set({
            name,
            value,
            ...options,
          })
        },
        remove(name: string, options: CookieOptions) {
          request.cookies.set({
            name,
            value: '',
            ...options,
          })
          response = NextResponse.next({
            request: {
              headers: request.headers,
            },
          })
          response.cookies.set({
            name,
            value: '',
            ...options,
          })
        },
      },
    }
  )

  // No validar sesión para rutas de API
  if (isApiRoute) {
    console.log('✅ [Middleware] Ruta de API, permitiendo acceso')
    return response
  }

  // Verificar sesión del usuario solo para rutas protegidas
  const { data: { session }, error } = await supabase.auth.getSession()

  console.log('🔍 [Middleware] Sesión:', { 
    hasSession: !!session, 
    error: error?.message,
    pathname,
    userId: session?.user?.id
  })

  // Si no hay sesión válida, redirigir a login
  if (error || !session) {
    console.log('⚠️ [Middleware] No hay sesión válida, redirigiendo a /es/login')
    const loginUrl = new URL('/es/login', request.url)
    return NextResponse.redirect(loginUrl)
  }

  console.log('✅ [Middleware] Sesión válida, permitiendo acceso')
  return response
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    "/((?!api|_next/static|_next/image|favicon.ico).*)",
  ],
}
