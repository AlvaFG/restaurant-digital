# Guía Rápida: Configurar Google OAuth

## Estado Actual
✅ Tu Supabase está configurado
✅ Las APIs de autenticación están listas
✅ El frontend tiene el botón de Google

## Lo que necesitas hacer:

### Paso 1: Configurar Google Cloud Console (10 minutos)

1. **Ir a Google Cloud Console**
   - Ve a: https://console.cloud.google.com/
   - Crea un proyecto nuevo o selecciona uno existente

2. **Habilitar Google+ API**
   - En el menú lateral: APIs & Services → Library
   - Busca "Google+ API"
   - Haz clic en "Enable"

3. **Crear OAuth Client ID**
   - Ve a: APIs & Services → Credentials
   - Clic en "Create Credentials" → "OAuth client ID"
   - Tipo de aplicación: "Web application"
   - Nombre: "Restaurante Digital"
   
4. **Configurar URLs autorizadas**
   
   **JavaScript origins:**
   ```
   http://localhost:3000
   https://vblbngnajogwypvkfjsr.supabase.co
   ```
   
   **Redirect URIs:**
   ```
   http://localhost:3000/api/auth/callback
   https://vblbngnajogwypvkfjsr.supabase.co/auth/v1/callback
   ```

5. **Copiar credenciales**
   - Te dará un **Client ID** (algo como: 123456789-abc.apps.googleusercontent.com)
   - Y un **Client Secret** (algo como: GOCSPX-abc123def456)
   - ⚠️ Guarda estos valores, los necesitarás en el siguiente paso

---

### Paso 2: Configurar Supabase (5 minutos)

1. **Ir a tu proyecto de Supabase**
   - Ve a: https://supabase.com/dashboard/project/vblbngnajogwypvkfjsr

2. **Habilitar Google Provider**
   - En el menú lateral: Authentication → Providers
   - Busca "Google" en la lista
   - Haz clic en "Google" para expandir

3. **Pegar credenciales**
   - **Client ID**: Pega el Client ID de Google Cloud
   - **Client Secret**: Pega el Client Secret de Google Cloud
   - Activa el toggle "Enable Sign in with Google"
   - Clic en "Save"

4. **Verificar Redirect URL**
   - En Authentication → URL Configuration
   - **Site URL**: `http://localhost:3000`
   - **Redirect URLs**: Agregar `http://localhost:3000/api/auth/callback`

---

### Paso 3: Probar (2 minutos)

1. Ve a: http://localhost:3000/login
2. Haz clic en "Continuar con Google"
3. Selecciona tu cuenta de Google
4. Deberías ser redirigido al dashboard

---

## Alternativa Rápida (Solo para Desarrollo)

Si solo quieres probar el registro tradicional (sin Google OAuth):

### ✅ Ya funciona:
- Registro con email y contraseña
- Inicio de sesión
- Almacenamiento en Supabase

### Para probar:
1. Ve a: http://localhost:3000/login
2. Clic en "¿No tienes cuenta? Créala aquí"
3. Completa el formulario
4. El usuario se guarda automáticamente en Supabase

---

## Verificar usuarios creados

```bash
# Ver usuarios en la base de datos
npx tsx scripts/test-registration.ts
```

---

## ¿Qué prefieres?

**Opción A:** Configurar Google OAuth ahora (necesitas cuenta de Google Cloud)
**Opción B:** Usar solo registro tradicional por ahora (ya funciona 100%)

Si eliges Opción A, puedo guiarte paso a paso con capturas de qué hacer en cada pantalla.
Si eliges Opción B, ya está todo listo para usar.
