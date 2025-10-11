# Configuración de Google OAuth en Supabase

Este documento describe cómo configurar Google OAuth para permitir que los usuarios inicien sesión con sus cuentas de Google.

## Pasos para configurar Google OAuth

### 1. Configurar Google Cloud Console

1. Ve a [Google Cloud Console](https://console.cloud.google.com/)
2. Crea un nuevo proyecto o selecciona uno existente
3. Habilita la API de Google+ (Google+ API)
4. Ve a **APIs & Services** > **Credentials**
5. Haz clic en **Create Credentials** > **OAuth client ID**
6. Selecciona **Web application**
7. Configura:
   - **Name**: Restaurante Digital
   - **Authorized JavaScript origins**: 
     - `http://localhost:3000` (desarrollo)
     - Tu URL de producción
   - **Authorized redirect URIs**:
     - `http://localhost:3000/api/auth/callback` (desarrollo)
     - `https://[tu-proyecto].supabase.co/auth/v1/callback` (Supabase)
     - Tu URL de producción + `/api/auth/callback`

8. Guarda el **Client ID** y **Client Secret**

### 2. Configurar Supabase

1. Ve a tu proyecto en [Supabase Dashboard](https://supabase.com/dashboard)
2. Ve a **Authentication** > **Providers**
3. Busca **Google** y habilítalo
4. Ingresa:
   - **Client ID**: El Client ID de Google Cloud Console
   - **Client Secret**: El Client Secret de Google Cloud Console
5. Guarda los cambios

### 3. Configurar variables de entorno

Agrega o verifica estas variables en tu archivo `.env.local`:

```env
# URL de tu aplicación
NEXT_PUBLIC_APP_URL=http://localhost:3000

# Supabase (ya deberías tenerlas)
NEXT_PUBLIC_SUPABASE_URL=https://[tu-proyecto].supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=tu-anon-key
SUPABASE_SERVICE_ROLE_KEY=tu-service-role-key

# Google OAuth (opcional, si quieres manejar directamente)
GOOGLE_CLIENT_ID=tu-client-id
GOOGLE_CLIENT_SECRET=tu-client-secret
```

### 4. Actualizar la configuración de Supabase Auth

En tu proyecto de Supabase:

1. Ve a **Authentication** > **URL Configuration**
2. Configura:
   - **Site URL**: `http://localhost:3000` (desarrollo) o tu dominio de producción
   - **Redirect URLs**: 
     - `http://localhost:3000/api/auth/callback`
     - Tu URL de producción + `/api/auth/callback`

### 5. Probar la integración

1. Reinicia tu servidor de desarrollo: `npm run dev`
2. Ve a `/login`
3. Haz clic en **"Continuar con Google"**
4. Completa el flujo de autenticación
5. Deberías ser redirigido al dashboard

## Flujo de autenticación

1. Usuario hace clic en "Continuar con Google"
2. Se llama a `/api/auth/google` que genera la URL de OAuth
3. Usuario es redirigido a Google para autorizar
4. Google redirige a `/api/auth/callback` con un código
5. El callback intercambia el código por una sesión de Supabase
6. Se verifica/crea el usuario en la base de datos
7. Se establecen cookies con la información del usuario
8. Usuario es redirigido al dashboard

## Seguridad

- Las sesiones de Supabase son seguras y manejadas por el servidor
- Las cookies se establecen con `httpOnly: false` para permitir acceso desde el cliente
- En producción, asegúrate de usar `secure: true` para HTTPS
- Los tokens de Google nunca se exponen al cliente

## Troubleshooting

### Error: "redirect_uri_mismatch"
- Verifica que las Redirect URIs en Google Cloud Console coincidan exactamente
- Asegúrate de incluir tanto la URL de Supabase como la de tu app

### Error: "no_tenant"
- Asegúrate de que existe al menos un tenant en tu base de datos
- Ejecuta: `npm run seed` si necesitas datos de prueba

### Error: "session_failed"
- Verifica que las variables de entorno de Supabase estén correctas
- Revisa los logs del servidor para más detalles

## Recursos adicionales

- [Documentación de Supabase Auth](https://supabase.com/docs/guides/auth)
- [Google OAuth 2.0](https://developers.google.com/identity/protocols/oauth2)
- [Next.js API Routes](https://nextjs.org/docs/api-routes/introduction)
