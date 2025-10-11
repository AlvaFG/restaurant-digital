import { NextResponse } from "next/server"
import { createAdminClient } from "@/lib/supabase/admin"
import { logger } from "@/lib/logger"

export async function GET(request: Request) {
  const requestUrl = new URL(request.url)
  const code = requestUrl.searchParams.get("code")
  const error = requestUrl.searchParams.get("error")

  // Si hay un error de OAuth
  if (error) {
    logger.error("Error en callback de Google OAuth", new Error(error))
    return NextResponse.redirect(`${requestUrl.origin}/login?error=oauth_failed`)
  }

  // Si no hay código, redirigir al login
  if (!code) {
    logger.warn("Callback sin código de autorización")
    return NextResponse.redirect(`${requestUrl.origin}/login`)
  }

  try {
    const supabase = createAdminClient()

    // Intercambiar el código por una sesión
    const { data, error: exchangeError } = await supabase.auth.exchangeCodeForSession(code)

    if (exchangeError) {
      logger.error("Error al intercambiar código por sesión", exchangeError as Error)
      return NextResponse.redirect(`${requestUrl.origin}/login?error=session_failed`)
    }

    const { user, session } = data

    if (!user || !session) {
      logger.error("No se obtuvo usuario o sesión después del intercambio")
      return NextResponse.redirect(`${requestUrl.origin}/login?error=no_user`)
    }

    logger.info("Usuario autenticado con Google exitosamente", {
      userId: user.id,
      email: user.email,
    })

    // Verificar si el usuario ya existe en nuestra base de datos
    const { data: existingUser } = await supabase
      .from("users")
      .select("id, tenant_id, role, active")
      .eq("email", user.email!)
      .single()

    let userRecord = existingUser as any

    // Si no existe, crear el usuario
    if (!userRecord) {
      logger.info("Creando nuevo usuario desde Google OAuth", { email: user.email })

      // Obtener el tenant por defecto
      const { data: defaultTenant } = await supabase
        .from("tenants")
        .select("id")
        .limit(1)
        .single()

      if (!defaultTenant) {
        logger.error("No se encontró tenant por defecto")
        return NextResponse.redirect(`${requestUrl.origin}/login?error=no_tenant`)
      }

      const tenantId = (defaultTenant as any).id

      // Crear el usuario en nuestra base de datos
      const { data: newUser, error: createError } = await supabase
        .from("users")
        .insert({
          email: user.email!,
          name: user.user_metadata?.full_name || user.email!.split("@")[0],
          role: "staff",
          tenant_id: tenantId,
          active: true,
          password_hash: "", // Google OAuth no usa contraseña
        } as any)
        .select()
        .single()

      if (createError) {
        logger.error("Error al crear usuario desde Google OAuth", createError as Error)
        return NextResponse.redirect(`${requestUrl.origin}/login?error=create_failed`)
      }

      userRecord = newUser as any
      logger.info("Usuario creado exitosamente", { userId: userRecord.id })
    }

    // Verificar que el usuario esté activo
    if (!userRecord.active) {
      logger.warn("Intento de login con usuario inactivo", { userId: userRecord.id })
      return NextResponse.redirect(`${requestUrl.origin}/login?error=user_inactive`)
    }

    // Obtener tenant info
    const { data: tenant } = await supabase
      .from("tenants")
      .select("id, name, slug, settings")
      .eq("id", userRecord.tenant_id)
      .single()

    const tenantData = tenant as any

    // Crear la respuesta y establecer cookies
    const response = NextResponse.redirect(`${requestUrl.origin}/dashboard`)

    // Establecer cookies con la información del usuario y tenant
    response.cookies.set("restaurant_auth", JSON.stringify({
      id: userRecord.id,
      email: user.email,
      name: userRecord.name || user.user_metadata?.full_name,
      role: userRecord.role,
      tenant_id: userRecord.tenant_id,
      active: userRecord.active,
    }), {
      httpOnly: false,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 7, // 7 días
      path: "/",
    })

    response.cookies.set("restaurant_tenant", JSON.stringify({
      id: tenantData.id,
      name: tenantData.name,
      slug: tenantData.slug,
      logoUrl: tenantData.settings?.logoUrl,
      theme: {
        accentColor: tenantData.settings?.theme?.accentColor || "#3b82f6",
      },
      features: {
        tablets: tenantData.settings?.features?.tablets ?? true,
        kds: tenantData.settings?.features?.kds ?? true,
        payments: tenantData.settings?.features?.payments ?? true,
      },
    }), {
      httpOnly: false,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 7, // 7 días
      path: "/",
    })

    logger.info("Login con Google completado exitosamente", {
      userId: userRecord.id,
      tenantId: userRecord.tenant_id,
    })

    return response
  } catch (error) {
    logger.error("Error en callback de Google OAuth", error as Error)
    return NextResponse.redirect(`${requestUrl.origin}/login?error=unexpected`)
  }
}
