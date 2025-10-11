import { NextResponse } from "next/server"
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

    const tenantId = (defaultTenant as any).id

    logger.info("Creando nuevo usuario", { email, tenantId })

    // Hash de la contraseña
    const passwordHash = await bcrypt.hash(password, 10)

    // Crear usuario
    const { data: newUser, error: createError } = await supabase
      .from("users")
      .insert({
        email,
        password_hash: passwordHash,
        name,
        role: "staff", // Por defecto los usuarios registrados son staff
        tenant_id: tenantId,
        active: true,
      } as any)
      .select()
      .single()

    if (createError) {
      logger.error("Error al crear usuario", createError as Error, { email })
      throw new DatabaseError(MENSAJES.ERRORES.DB_ERROR, {
        operation: "createUser",
        email,
      })
    }

    const userData = newUser as any

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
