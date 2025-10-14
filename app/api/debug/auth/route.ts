import { NextResponse } from "next/server"
import { createServerClient, getCurrentUser } from "@/lib/supabase/server"
import { cookies } from "next/headers"

export async function GET() {
  try {
    // 1. Verificar cookies
    const cookieStore = cookies()
    const allCookies = cookieStore.getAll()
    const authCookies = allCookies.filter(c => 
      c.name.includes('supabase') || c.name.includes('auth')
    )

    // 2. Verificar usuario
    const user = await getCurrentUser()

    // 3. Verificar sesión directamente
    const supabase = createServerClient()
    const { data: session, error: sessionError } = await supabase.auth.getSession()

    const metadata = user?.user_metadata as Record<string, unknown> | undefined
    const tenantIdFromMetadata = typeof metadata?.tenant_id === 'string' ? metadata.tenant_id : undefined
    const userWithTenant = user as (typeof user & { tenant_id?: string }) | null
    const tenantIdFromUser = typeof userWithTenant?.tenant_id === 'string' ? userWithTenant.tenant_id : undefined
    const resolvedTenantId = tenantIdFromMetadata ?? tenantIdFromUser
    // 4. Verificar variables de entorno
    const envCheck = {
      SUPABASE_URL: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
      SUPABASE_ANON_KEY: !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
      USE_SUPABASE_AUTH: process.env.NEXT_PUBLIC_USE_SUPABASE_AUTH,
      USE_SUPABASE_TABLES: process.env.NEXT_PUBLIC_USE_SUPABASE_TABLES,
    }

    return NextResponse.json({
      status: 'ok',
      timestamp: new Date().toISOString(),
      auth: {
        hasUser: !!user,
        userId: user?.id,
        email: user?.email,
        tenantId: resolvedTenantId,
        metadata: user?.user_metadata,
      },
      session: {
        hasSession: !!session.session,
        error: sessionError?.message,
        accessToken: session.session?.access_token ? 'present' : 'missing',
      },
      cookies: {
        total: allCookies.length,
        authCookies: authCookies.map(c => ({ name: c.name, hasValue: !!c.value })),
      },
      environment: envCheck,
    })
  } catch (error) {
    return NextResponse.json({
      status: 'error',
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
    }, { status: 500 })
  }
}
