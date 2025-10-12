import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import { createServerClient, type CookieOptions } from "@supabase/ssr"

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  console.log('🔒 [Middleware] Ejecutado para:', pathname)

  // Permitir acceso a páginas públicas y assets
  const publicPaths = ["/login", "/api/auth/login", "/api/auth/register", "/api/auth/google", "/api/auth/callback"]
  const isPublicPath = publicPaths.some(path => pathname.startsWith(path))
  const isStaticAsset = pathname.startsWith("/_next") || pathname.startsWith("/favicon")
  const isApiRoute = pathname.startsWith("/api")
  
  // Permitir todos los assets estáticos y rutas de API sin validación
  if (isStaticAsset) {
    return NextResponse.next()
  }
  
  // Permitir rutas públicas sin validación
  if (isPublicPath) {
    console.log('✅ [Middleware] Ruta pública, permitiendo acceso sin validación')
    return NextResponse.next()
  }

  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  })

  // Create Supabase client with cookie handling
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
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
