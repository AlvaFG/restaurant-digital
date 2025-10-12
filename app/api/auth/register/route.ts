import { createAdminClient } from "@/lib/supabase/admin"
import bcrypt from "bcryptjs"
import {
  manejarError,
  validarBody,
  respuestaExitosa,
  logRequest,
  logResponse,
} from "@/lib/api-helpers"
import { ValidationError, DatabaseError } from "@/lib/errors"
import { MENSAJES } from "@/lib/i18n/mensajes"
import { logger } from "@/lib/logger"

export async function POST(request: Request) {
  const startTime = Date.now()

  try {
    logRequest("POST", "/api/auth/register")

    // Validar y extraer body
    const { email, password, name } = await validarBody<{
      email: string
      password: string
      name: string
    }>(request)

    // Validar inputs
    if (!email || !password || !name) {
      throw new ValidationError(MENSAJES.VALIDACIONES.CAMPO_REQUERIDO, {
        fields: ["email", "password", "name"],
      })
    }

    if (!email.includes("@")) {
      throw new ValidationError(MENSAJES.VALIDACIONES.EMAIL_INVALIDO)
    }

    if (password.length < 6) {
      throw new ValidationError("La contraseña debe tener al menos 6 caracteres")
    }

    // Usar admin client
    const supabase = createAdminClient()

    logger.info("Verificando si el email ya existe", { email })

    // Verificar si el usuario ya existe
    const { data: existingUser } = await supabase
      .from("users")
      .select("id")
      .eq("email", email)
      .single()

    if (existingUser) {
      throw new ValidationError("Este email ya está registrado")
    }

    // Obtener el tenant por defecto (puedes cambiar esto según tu lógica)
    const { data: defaultTenant } = await supabase
      .from("tenants")
      .select("id")
      .limit(1)
      .single()

    if (!defaultTenant) {
      throw new DatabaseError("No se encontró un tenant para asignar")
    }

    interface TenantData {
      id: string
    }

    const tenantId = (defaultTenant as TenantData).id

    logger.info("Creando nuevo usuario", { email, tenantId })

    // 1. Crear usuario en Supabase Auth primero
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true, // Auto-confirmar email
      user_metadata: {
        name,
      }
    })

    if (authError || !authData.user) {
      logger.error("Error al crear usuario en Auth", authError as Error, { email })
      throw new DatabaseError('Error al crear usuario en el sistema de autenticación', {
        operation: "createAuthUser",
        email,
        error: authError?.message
      })
    }

    const authUser = authData.user
    logger.info("Usuario creado en Supabase Auth", { authUserId: authUser.id, email })

    // 2. Hash de la contraseña para guardar en tabla users (backup)
    const passwordHash = await bcrypt.hash(password, 10)

    // 3. Crear usuario en tabla users con el mismo ID de Auth
    interface NewUserData {
      id: string
      email: string
      name: string
      role: string
    }

    // ✅ REGISTRO PÚBLICO: Solo se permite crear usuarios con rol 'admin'
    // Los usuarios 'staff' solo pueden ser creados por un admin desde el panel
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: newUser, error: createError } = await (supabase.from("users") as any)
      .insert({
        id: authUser.id, // Usar el mismo ID que auth.users
        email,
        password_hash: passwordHash,
        name,
        role: "admin", // 🔒 FORZAR ROL ADMIN en registro público
        tenant_id: tenantId,
        active: true,
        created_by_admin_id: null, // Admin no tiene creador
      })
      .select()
      .single()

    if (createError) {
      // Si falla la inserción en users, borrar el usuario de Auth
      logger.error("Error al crear usuario en tabla users, rollback Auth user", createError as Error, { email })
      await supabase.auth.admin.deleteUser(authUser.id)
      
      throw new DatabaseError(MENSAJES.ERRORES.DB_ERROR, {
        operation: "createUser",
        email,
      })
    }

    const userData = newUser as NewUserData

    const duration = Date.now() - startTime
    logResponse("POST", "/api/auth/register", 201, duration)

    logger.info("Usuario creado exitosamente", {
      userId: userData.id,
      email: userData.email,
      duration: `${duration}ms`,
    })

    return respuestaExitosa(
      {
        user: {
          id: userData.id,
          email: userData.email,
          name: userData.name,
          role: userData.role,
        },
      },
      "Usuario creado exitosamente",
      201
    )
  } catch (error) {
    const duration = Date.now() - startTime
    logResponse("POST", "/api/auth/register", 400, duration)
    return manejarError(error, "register")
  }
}
