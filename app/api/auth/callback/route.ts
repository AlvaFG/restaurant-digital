import { NextResponse } from "next/server"
import { createAdminClient } from "@/lib/supabase/admin"
import { logger } from "@/lib/logger"
import type { Database } from "@/lib/supabase/database.types"

type UserRow = Database['public']['Tables']['users']['Row']
type UserInsert = Database['public']['Tables']['users']['Insert']

// Tipo para el select parcial de usuario
type UserRecord = Pick<UserRow, 'id' | 'tenant_id' | 'role' | 'active' | 'name' | 'email'>

// Tipo para settings del tenant (JSON)
interface TenantSettings {
  logoUrl?: string
  theme?: {
    accentColor?: string
  }
  features?: {
    tablets?: boolean
    kds?: boolean
    payments?: boolean
  }
}

export async function GET(request: Request) {
  const requestUrl = new URL(request.url)
  const code = requestUrl.searchParams.get("code")
  const error = requestUrl.searchParams.get("error")

  // Si hay un error de OAuth
  if (error) {
    logger.error("Error en callback de Google OAuth", new Error(error))
    return NextResponse.redirect(`${requestUrl.origin}/login?error=oauth_failed`)
  }

  // Si no hay c�digo, redirigir al login
  if (!code) {
    logger.warn("Callback sin c�digo de autorizaci�n")
    return NextResponse.redirect(`${requestUrl.origin}/login`)
  }

  try {
    const supabase = createAdminClient()

    // Intercambiar el c�digo por una sesi�n
    const { data, error: exchangeError } = await supabase.auth.exchangeCodeForSession(code)

    if (exchangeError) {
      logger.error("Error al intercambiar c�digo por sesi�n", exchangeError as Error)
      return NextResponse.redirect(`${requestUrl.origin}/login?error=session_failed`)
    }

    const { user, session } = data

    if (!user || !session) {
      logger.error("No se obtuvo usuario o sesi�n despu�s del intercambio")
      return NextResponse.redirect(`${requestUrl.origin}/login?error=no_user`)
    }

    logger.info("Usuario autenticado con Google exitosamente", {
      userId: user.id,
      email: user.email,
    })

    // Verificar si el usuario ya existe en nuestra base de datos
    const { data: existingUser } = await supabase
      .from("users")
      .select("id, tenant_id, role, active, name, email")
      .eq("email", user.email!)
      .single()

    let userRecord: UserRecord | null = existingUser

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
        logger.error("No se encontr� tenant por defecto")
        return NextResponse.redirect(`${requestUrl.origin}/login?error=no_tenant`)
      }

      const tenantId = defaultTenant.id

      // Crear el usuario en nuestra base de datos
      const insertData: UserInsert = {
        email: user.email!,
        name: user.user_metadata?.full_name || user.email!.split("@")[0],
        role: "staff",
        tenant_id: tenantId,
        active: true,
        password_hash: "", // Google OAuth no usa contrase�a
      }

      const { data: newUser, error: createError } = await supabase
        .from("users")
        .insert(insertData)
        .select("id, tenant_id, role, active, name, email")
        .single()

      if (createError) {
        logger.error("Error al crear usuario desde Google OAuth", createError as Error)
        return NextResponse.redirect(`${requestUrl.origin}/login?error=create_failed`)
      }

      userRecord = newUser
      logger.info("Usuario creado exitosamente", { userId: userRecord?.id })
    }

    // Verificar que userRecord no sea null despu�s de la creaci�n
    if (!userRecord) {
      logger.error("Error: userRecord es null despu�s de la creaci�n")
      return NextResponse.redirect(`${requestUrl.origin}/login?error=user_creation_failed`)
    }

    // Verificar que el usuario est� activo
    if (!userRecord.active) {
      logger.warn("Intento de login con usuario inactivo", { userId: userRecord.id })
      return NextResponse.redirect(`${requestUrl.origin}/login?error=user_inactive`)
    }

    // Actualizar user_metadata con tenant_id en Supabase Auth
    logger.info('Actualizando user_metadata con tenant_id', { 
      userId: userRecord.id, 
      tenantId: userRecord.tenant_id 
    })
    
    const { error: updateMetadataError } = await supabase.auth.admin.updateUserById(
      userRecord.id,
      {
        user_metadata: {
          tenant_id: userRecord.tenant_id,
          name: userRecord.name,
          role: userRecord.role,
        }
      }
    )

    if (updateMetadataError) {
      logger.warn('No se pudo actualizar user_metadata', { 
        userId: userRecord.id,
        error: updateMetadataError.message 
      })
    } else {
      logger.info('user_metadata actualizado exitosamente', { 
        userId: userRecord.id,
        tenantId: userRecord.tenant_id 
      })
    }

    // Obtener tenant info
    const { data: tenant } = await supabase
      .from("tenants")
      .select("id, name, slug, settings")
      .eq("id", userRecord.tenant_id)
      .single()

    if (!tenant) {
      logger.error("No se encontr� tenant para el usuario")
      return NextResponse.redirect(`${requestUrl.origin}/login?error=no_tenant`)
    }

    // Crear la respuesta y establecer cookies
    const response = NextResponse.redirect(`${requestUrl.origin}/dashboard`)

    const settings = tenant.settings as TenantSettings | null

    // Establecer cookies con la informaci�n del usuario y tenant
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
      maxAge: 60 * 60 * 24 * 7, // 7 d�as
      path: "/",
    })

    response.cookies.set("restaurant_tenant", JSON.stringify({
      id: tenant.id,
      name: tenant.name,
      slug: tenant.slug,
      logoUrl: settings?.logoUrl,
      theme: {
        accentColor: settings?.theme?.accentColor || "#3b82f6",
      },
      features: {
        tablets: settings?.features?.tablets ?? true,
        kds: settings?.features?.kds ?? true,
        payments: settings?.features?.payments ?? true,
      },
    }), {
      httpOnly: false,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 7, // 7 d�as
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
