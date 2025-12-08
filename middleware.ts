import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import { createServerClient, type CookieOptions } from "@supabase/ssr"
import createIntlMiddleware from 'next-intl/middleware';
import { locales } from './i18n';

// i18n middleware now applies to ALL routes under [locale]
const intlMiddleware = createIntlMiddleware({
  locales,
  defaultLocale: 'es',
  localePrefix: 'always',
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

  // 3. Apply i18n middleware first (handles locale redirection)
  const intlResponse = intlMiddleware(request)
  
  // If intl middleware returns a redirect (e.g., / -> /es), honor it immediately
  if (intlResponse.status === 307 || intlResponse.status === 308) {
    return intlResponse
  }
  
  // Extract pathname without locale prefix so we can evaluate public routes
  const localePrefixRegex = new RegExp(`^/(${locales.join('|')})(?=/|$)`)
  const localePrefixMatch = pathname.match(localePrefixRegex)
  let pathnameWithoutLocale = pathname
  if (localePrefixMatch) {
    const trimmed = pathname.slice(localePrefixMatch[0].length)
    pathnameWithoutLocale = trimmed.length > 0 ? trimmed : "/"
  }

  // 4. Public routes with locale (landing + login)
  if (pathnameWithoutLocale === "/" || pathnameWithoutLocale === "/login") {
    return intlResponse
  }

  // 5. All other routes require auth
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
