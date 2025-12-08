import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import { createServerClient, type CookieOptions } from "@supabase/ssr"
import createIntlMiddleware from 'next-intl/middleware';
import { locales } from './i18n';

// Create i18n middleware that adds locale prefix when needed
const intlMiddleware = createIntlMiddleware({
  locales,
  defaultLocale: 'es',
  localePrefix: 'as-needed', // Only add prefix when necessary
  localeDetection: true,
});

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  console.log('🔒 [Middleware] Path:', pathname)
  
  // 1. Skip static assets and API routes
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

  // 2. Public routes that bypass auth but need i18n
  const publicWithLocale = ["/", "/login"]
  const isPublicWithLocale = publicWithLocale.some(p => pathname === p || pathname === `/es${p}` || pathname === `/en${p}`)
  
  if (isPublicWithLocale) {
    const response = intlMiddleware(request)
    console.log('✅ [Middleware] Public with i18n:', pathname)
    return response
  }

  // 3. Public routes that bypass both auth and i18n (QR, payment)
  const publicNoLocale = ["/qr", "/payment"]
  const isPublicNoLocale = publicNoLocale.some(p => pathname.startsWith(p))
  
  if (isPublicNoLocale) {
    console.log('✅ [Middleware] Public no-locale:', pathname)
    return NextResponse.next()
  }

  // 4. Protected routes - need auth check
  console.log('🔍 [Middleware] Auth check:', pathname)
  
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!supabaseUrl || !supabaseAnonKey) {
    console.error('❌ [Middleware] Missing Supabase config')
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
    console.log('⚠️  [Middleware] No session, redirect to login')
    return NextResponse.redirect(new URL('/login', request.url))
  }

  console.log('✅ [Middleware] Authorized')
  return response
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
}
