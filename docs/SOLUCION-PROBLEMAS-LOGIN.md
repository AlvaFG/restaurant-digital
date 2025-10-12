# 🔐 Guía de Solución de Problemas de Login

## Estado Actual

✅ **Tu usuario ha sido actualizado:**
- Email: `afernandezguyot@gmail.com`
- Rol: **admin** (actualizado correctamente)
- Estado: activo
- Tenant: Restaurant Demo

## Pasos para Resolver el Problema

### 1️⃣ Verificar la Contraseña

Si no recuerdas tu contraseña actual, puedes restablecerla con este comando:

```powershell
node --import tsx scripts/reset-password.ts afernandezguyot@gmail.com TuNuevaContraseña123
```

**Ejemplo:**
```powershell
node --import tsx scripts/reset-password.ts afernandezguyot@gmail.com Admin2024!
```

### 2️⃣ Probar el Login desde la Terminal

Antes de probar en el navegador, verifica que todo funciona desde el backend:

```powershell
node --import tsx scripts/test-login.ts afernandezguyot@gmail.com TuContraseña
```

Esto te mostrará:
- ✅ Si el usuario existe
- ✅ Si la contraseña es correcta
- ✅ Si el tenant está configurado
- ❌ Cualquier error específico

### 3️⃣ Iniciar el Servidor de Desarrollo

Asegúrate de que el servidor esté corriendo:

```powershell
npm run dev
```

### 4️⃣ Probar el Login en el Navegador

1. Abre tu navegador en: `http://localhost:3000/login`
2. Abre la Consola de Desarrollador (F12)
3. Ve a la pestaña "Console"
4. Ingresa tus credenciales
5. Observa los logs en la consola

### 5️⃣ Interpretar los Logs

Los logs te mostrarán exactamente dónde está el problema:

```
[AuthService] Iniciando login para: afernandezguyot@gmail.com
[AuthService] Enviando petición a /api/auth/login
[AuthService] Respuesta recibida, status: 200
[AuthService] Usuario autenticado: afernandezguyot@gmail.com Rol: admin
[AuthService] Login completado exitosamente
```

Si ves un error, copia el mensaje completo.

## Errores Comunes y Soluciones

### ❌ "Credenciales inválidas"
**Causa:** La contraseña no coincide con la almacenada en la base de datos.
**Solución:** Restablece tu contraseña con el script `reset-password.ts`

### ❌ "Usuario no encontrado"
**Causa:** El email no existe o el usuario está inactivo.
**Solución:** Verifica el email con `node --import tsx scripts/check-users.ts`

### ❌ Error de CORS o Network
**Causa:** El servidor no está corriendo o hay problemas de red.
**Solución:** Verifica que `npm run dev` esté corriendo sin errores.

### ❌ "Error en la operación"
**Causa:** Error genérico del servidor.
**Solución:** Revisa la terminal donde corre `npm run dev` para ver el error completo.

## Verificación Final

Una vez que puedas iniciar sesión:

1. ✅ Deberías ser redirigido a `/dashboard`
2. ✅ Deberías ver tu nombre en la esquina superior derecha
3. ✅ Como admin, deberías tener acceso a todas las secciones

## Usuarios de Prueba Disponibles

Si necesitas probar con otros usuarios:

1. **Admin Demo**
   - Email: `admin@demo.restaurant`
   - Rol: admin
   - Contraseña: `admin123` (después de ejecutar `hash-passwords.ts`)

2. **Mesero Demo**
   - Email: `mesero@demo.restaurant`
   - Rol: staff
   - Contraseña: `mesero123` (después de ejecutar `hash-passwords.ts`)

## Scripts Útiles

```powershell
# Ver todos los usuarios
node --import tsx scripts/check-users.ts

# Restablecer contraseña
node --import tsx scripts/reset-password.ts <email> <nueva_password>

# Cambiar rol de usuario
node --import tsx scripts/update-user-role.ts

# Probar login
node --import tsx scripts/test-login.ts <email> <password>

# Hashear passwords de usuarios demo
npx tsx scripts/hash-passwords.ts
```

## Necesitas Más Ayuda?

Si después de estos pasos aún no puedes iniciar sesión:

1. Ejecuta el script de prueba y copia el output completo
2. Abre la consola del navegador y copia todos los logs
3. Revisa la terminal de `npm run dev` para errores del servidor
4. Comparte esta información para un diagnóstico más específico

---

**Última actualización:** Tu rol ha sido actualizado a `admin` correctamente ✅
