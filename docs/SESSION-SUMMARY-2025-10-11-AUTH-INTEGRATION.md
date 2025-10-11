# 🔐 Integración de Autenticación con Supabase

**Fecha:** 11 de octubre de 2025  
**Status:** ✅ COMPLETO

---

## 📋 Resumen

Se integró completamente el sistema de autenticación existente con Supabase, reemplazando los datos mock con consultas reales a la base de datos.

---

## ✅ Cambios Realizados

### 1. Instalación de Dependencias

```bash
npm install bcrypt
npm install --save-dev @types/bcrypt
```

**Paquetes instalados:**
- `bcrypt@5.x` - Para hashear y verificar passwords
- `@types/bcrypt` - Tipos de TypeScript

---

### 2. Actualización de `lib/auth.ts`

#### Cambios en Interfaces:
```typescript
// Antes
export interface User {
  id: string
  name: string
  email: string
  role: "admin" | "staff"
  active: boolean
}

// Después
export interface User {
  id: string
  name: string
  email: string
  role: "admin" | "staff" | "manager"  // ← Agregado "manager"
  active: boolean
  tenant_id: string                     // ← Nuevo
  last_login_at?: string                // ← Nuevo
}
```

#### Método `login()` Refactorizado:

**Antes:**
```typescript
static async login(email: string, password: string) {
  if (password !== "123456") {
    throw new Error("Credenciales inválidas")
  }
  const user = MOCK_USERS.find(u => u.email === email)
  // ...
}
```

**Después:**
```typescript
static async login(email: string, password: string) {
  const supabase = createBrowserClient()
  
  // 1. Consultar Supabase
  const { data: users, error } = await supabase
    .from("users")
    .select(`
      *,
      tenants (id, name, slug, settings)
    `)
    .eq("email", email)
    .eq("active", true)
    .limit(1)
  
  // 2. Verificar con bcrypt
  const isValid = await bcrypt.compare(password, userData.password_hash)
  
  // 3. Actualizar last_login_at
  await supabase.from("users")
    .update({ last_login_at: new Date().toISOString() })
    .eq("id", userData.id)
  
  // 4. Guardar sesión
  return user
}
```

---

### 3. Script `hash-passwords.ts`

Creado script para actualizar passwords en la base de datos:

```typescript
// scripts/hash-passwords.ts
import bcrypt from 'bcrypt'
import { createClient } from '@supabase/supabase-js'

async function hashPasswords() {
  const passwords = {
    'admin@demo.restaurant': 'demo123',
    'mesero@demo.restaurant': 'staff123'
  }
  
  for (const [email, password] of Object.entries(passwords)) {
    const hash = await bcrypt.hash(password, 10)
    await supabase
      .from('users')
      .update({ password_hash: hash })
      .eq('email', email)
  }
}
```

**Resultado:**
```
✅ Usuario actualizado: Admin Demo
   Hash: $2b$10$o/V/ilPxjiUQ08n4YqnYnOOiVqqZ1jtSWrGHQejllqKOvxDgjv1um

✅ Usuario actualizado: Juan Mesero
   Hash: $2b$10$3swA6E48VIRaLWdrkm7mqOVQKm5GjodSp0MFI0auLMoDCV3zkpXb2
```

---

### 4. Actualización de `login-form.tsx`

Actualizadas las credenciales demo:

```typescript
// Antes
Admin (admin@admin.com) / 123456
Staff (staff@staff.com) / 123456

// Después
Admin (admin@demo.restaurant) / demo123
Staff (mesero@demo.restaurant) / staff123
```

---

## 🔐 Seguridad

### Hashing de Passwords

- **Algoritmo:** bcrypt con 10 salt rounds
- **Formato:** `$2b$10$...` (60 caracteres)
- **Irreversible:** No se puede obtener el password original del hash

### Almacenamiento

- **Base de Datos:** Solo se guarda `password_hash`
- **Nunca** se almacena el password en texto plano
- **Verificación:** Se usa `bcrypt.compare()` para validar

### Flujo de Login

```
1. Usuario ingresa email + password
2. Frontend hashea el password
3. Se busca usuario en Supabase
4. Se compara hash con bcrypt.compare()
5. Si válido → Se crea sesión
6. Se actualiza last_login_at
```

---

## 📊 Estado Actual

### Archivos Modificados

| Archivo | Cambios | Líneas |
|---------|---------|--------|
| `lib/auth.ts` | Integración Supabase + bcrypt | ~60 |
| `components/login-form.tsx` | Credenciales actualizadas | ~10 |
| `scripts/hash-passwords.ts` | Script nuevo | ~70 |

### Features Funcionando

- ✅ Login con Supabase
- ✅ Verificación de passwords con bcrypt
- ✅ Actualización de `last_login_at`
- ✅ Carga de datos de tenant
- ✅ Sesión persistente (localStorage + cookies)
- ✅ Manejo de errores

---

## 🧪 Testing

### Credenciales de Prueba

```bash
# Admin
Email: admin@demo.restaurant
Password: demo123

# Staff
Email: mesero@demo.restaurant
Password: staff123
```

### Verificación Manual

1. **Visitar:** http://localhost:3000/login
2. **Hacer clic en:** "Admin (admin@demo.restaurant)"
3. **Hacer clic en:** "Iniciar Sesión"
4. **Resultado esperado:** Redirección a `/dashboard`

### Verificar en Supabase

```sql
-- Ver last_login_at actualizado
SELECT 
  email, 
  name, 
  last_login_at,
  created_at
FROM users
ORDER BY last_login_at DESC NULLS LAST;
```

---

## 🚀 Próximos Pasos

### Completado ✅
- [x] Instalar bcrypt
- [x] Integrar lib/auth.ts con Supabase
- [x] Hashear passwords en base de datos
- [x] Actualizar LoginForm con credenciales correctas
- [x] Probar login end-to-end

### Pendiente ⏳
- [ ] Integrar users-management.tsx con Supabase
- [ ] Crear API route para login (más seguro)
- [ ] Agregar rate limiting
- [ ] Implementar password reset
- [ ] Agregar 2FA (opcional)

---

## 📝 Notas Importantes

### ⚠️ Seguridad en Producción

**Actualmente:** El hash de bcrypt se hace en el **cliente** (navegador).

**Problema:** El password viaja en texto plano desde el navegador al código JavaScript.

**Solución recomendada:**
```typescript
// Crear API Route: /api/auth/login
export async function POST(request: Request) {
  const { email, password } = await request.json()
  
  // Hashear y verificar en SERVIDOR
  const user = await verifyCredentials(email, password)
  
  // Crear JWT o session
  return Response.json({ user, token })
}
```

### 📦 Dependencias

```json
{
  "dependencies": {
    "@supabase/supabase-js": "^2.49.2",
    "@supabase/ssr": "^0.6.1",
    "bcrypt": "^5.1.1"
  },
  "devDependencies": {
    "@types/bcrypt": "^5.0.2"
  }
}
```

---

## 🎯 Resultado Final

### Antes
```typescript
// Mock data hardcodeado
const MOCK_USERS = [
  { id: "1", email: "admin@admin.com", password: "123456" }
]
```

### Después
```typescript
// Datos reales desde Supabase
const { data } = await supabase
  .from("users")
  .select("*")
  .eq("email", email)

const isValid = await bcrypt.compare(password, user.password_hash)
```

---

**Estado:** ✅ Login completamente funcional con Supabase + bcrypt  
**Tiempo de desarrollo:** ~40 minutos  
**Tests:** ✅ Login manual exitoso

