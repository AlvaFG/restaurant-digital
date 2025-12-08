import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import { createServerClient, type CookieOptions } from "@supabase/ssr"
import createIntlMiddleware from 'next-intl/middleware';
import { locales } from './i18n';

// Create i18n middleware
const intlMiddleware = createIntlMiddleware({
  locales,
  defaultLocale: 'es',
  localePrefix: 'as-needed',
  localeDetection: true,
});

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  console.log('🔒 [Middleware] Ejecutado para:', pathname)
  
  // Skip middleware for static assets and API routes
  const isStaticAsset = pathname.startsWith("/_next") || pathname.startsWith("/favicon") || pathname.includes(".")
  const isApiRoute = pathname.startsWith("/api")
  
  if (isStaticAsset) {
    return NextResponse.next()
  }
  
  // Handle i18n routing first (this will add locale prefix if missing)
  const intlResponse = intlMiddleware(request);
  
  // Check if the path is public (landing page or login)
  const pathnameWithoutLocale = pathname.replace(/^\/(es|en)/, '') || '/'
  const publicPaths = ["/", "/login"]
  const isPublicPath = publicPaths.includes(pathnameWithoutLocale) || isApiRoute
  
  // Allow public paths without auth validation
  if (isPublicPath) {
    console.log('✅ [Middleware] Ruta pública:', pathnameWithoutLocale)
    return intlResponse
  }

  // Verificar que las variables de entorno estén configuradas
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!supabaseUrl || !supabaseAnonKey) {
    console.error('❌ [Middleware] Variables de entorno de Supabase no configuradas')
    // En desarrollo o si falta configuración, redirigir a login
    const loginUrl = new URL('/login', request.url)
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

  // No validar sesión para rutas de API (excepto las públicas ya permitidas)
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
    console.log('⚠️ [Middleware] No hay sesión válida, redirigiendo a /login')
    const loginUrl = new URL('/login', request.url)
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
