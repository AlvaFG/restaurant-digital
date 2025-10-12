import { createAdminClient } from "@/lib/supabase/admin"
import { manejarError, respuestaExitosa, logRequest, logResponse } from "@/lib/api-helpers"
import { logger } from "@/lib/logger"

export async function POST(_request: Request) {
  const startTime = Date.now()

  try {
    logRequest("POST", "/api/auth/google")

    const supabase = createAdminClient()

    // Obtener la URL de callback desde el entorno o usar una por defecto
    const redirectTo = `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/api/auth/callback`

    logger.info("Iniciando flujo de autenticación con Google", { redirectTo })

    // Generar la URL de autenticación de Google
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo,
        queryParams: {
          access_type: "offline",
          prompt: "consent",
        },
      },
    })

    if (error) {
      logger.error("Error al generar URL de Google OAuth", error as Error)
      throw error
    }

    const duration = Date.now() - startTime
    logResponse("POST", "/api/auth/google", 200, duration)

    logger.info("URL de Google OAuth generada exitosamente", {
      duration: `${duration}ms`,
    })

    return respuestaExitosa({ url: data.url }, "URL de autenticación generada")
  } catch (error) {
    const duration = Date.now() - startTime
    logResponse("POST", "/api/auth/google", 500, duration)
    return manejarError(error, "google-auth")
  }
}
