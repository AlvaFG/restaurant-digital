# 🔐 ROLES Y PERMISOS - Sistema de Login

## 👤 Tipos de Usuarios

### 🔴 Administrador (admin)
**Cómo se crea:** Registrándose desde la página de login

**Características:**
- ✅ Acceso completo a toda la aplicación
- ✅ Puede crear usuarios staff
- ✅ Puede gestionar la configuración
- ✅ Puede ver analytics y reportes
- ✅ Puede administrar el menú, mesas, pedidos

**Cómo obtener este rol:**
```
1. Ve a http://localhost:3000/login
2. Click en "¿No tienes cuenta? Créala aquí"
3. Completa el formulario de registro
4. ✅ Tu cuenta será creada como ADMIN automáticamente
```

---

### 🔵 Staff (staff)
**Cómo se crea:** Solo el admin puede crear estas cuentas desde dentro de la aplicación

**Características:**
- ✅ Puede tomar pedidos
- ✅ Puede ver el menú
- ✅ Puede actualizar estado de mesas
- ❌ No puede crear otros usuarios
- ❌ No puede cambiar configuración del sistema
- ❌ Acceso limitado a reportes

**Cómo crear un usuario staff:**
```
1. Login como admin
2. Ir a /usuarios (Gestión de Usuarios)
3. Click en "Crear Usuario Staff"
4. Completar formulario
5. ✅ Usuario staff creado
```

---

## 🚀 Flujo de Onboarding

### Primer Usuario (Owner/Admin Principal)

```
┌─────────────────────────────────────────────────────────┐
│  1. Ejecutar: npm run dev                              │
│     → Se abre http://localhost:3000                    │
│     → Redirige automáticamente a /login               │
└─────────────────────────────────────────────────────────┘
                         ↓
┌─────────────────────────────────────────────────────────┐
│  2. En /login, click en "Crear cuenta"                │
└─────────────────────────────────────────────────────────┘
                         ↓
┌─────────────────────────────────────────────────────────┐
│  3. Completar formulario:                              │
│     - Nombre: Tu nombre                                │
│     - Email: tu@restaurant.com                         │
│     - Contraseña: ********                             │
│     - Confirmar: ********                              │
└─────────────────────────────────────────────────────────┘
                         ↓
┌─────────────────────────────────────────────────────────┐
│  4. ✅ Cuenta ADMIN creada                              │
│     → Vuelve a login con mensaje de éxito             │
└─────────────────────────────────────────────────────────┘
                         ↓
┌─────────────────────────────────────────────────────────┐
│  5. Ingresar contraseña y hacer login                  │
└─────────────────────────────────────────────────────────┘
                         ↓
┌─────────────────────────────────────────────────────────┐
│  6. ✅ Acceso completo al dashboard como ADMIN          │
└─────────────────────────────────────────────────────────┘
```

---

### Usuarios Staff Adicionales

```
┌─────────────────────────────────────────────────────────┐
│  Admin ingresa al sistema                              │
└─────────────────────────────────────────────────────────┘
                         ↓
┌─────────────────────────────────────────────────────────┐
│  Navega a /usuarios                                    │
└─────────────────────────────────────────────────────────┘
                         ↓
┌─────────────────────────────────────────────────────────┐
│  Click en "Agregar Usuario" o "Crear Staff"           │
└─────────────────────────────────────────────────────────┘
                         ↓
┌─────────────────────────────────────────────────────────┐
│  Completa formulario para usuario staff                │
└─────────────────────────────────────────────────────────┘
                         ↓
┌─────────────────────────────────────────────────────────┐
│  ✅ Usuario STAFF creado                                │
│     → Admin comparte credenciales con el staff         │
└─────────────────────────────────────────────────────────┘
                         ↓
┌─────────────────────────────────────────────────────────┐
│  Staff hace login en http://localhost:3000/login       │
│  → Acceso limitado según permisos de staff            │
└─────────────────────────────────────────────────────────┘
```

---

## 🔒 Matriz de Permisos

| Funcionalidad | Admin | Staff |
|---------------|-------|-------|
| **Usuarios** |
| Crear usuarios | ✅ | ❌ |
| Editar usuarios | ✅ | ❌ |
| Eliminar usuarios | ✅ | ❌ |
| Ver lista de usuarios | ✅ | ❌ |
| **Pedidos** |
| Crear pedidos | ✅ | ✅ |
| Ver pedidos | ✅ | ✅ |
| Actualizar estado | ✅ | ✅ |
| Cancelar pedidos | ✅ | ⚠️ Limitado |
| **Menú** |
| Crear items | ✅ | ❌ |
| Editar items | ✅ | ❌ |
| Eliminar items | ✅ | ❌ |
| Ver menú | ✅ | ✅ |
| **Mesas** |
| Crear/editar mesas | ✅ | ❌ |
| Ver estado de mesas | ✅ | ✅ |
| Actualizar ocupación | ✅ | ✅ |
| **Configuración** |
| Configuración del sistema | ✅ | ❌ |
| Temas y personalización | ✅ | ❌ |
| Integraciones | ✅ | ❌ |
| **Analytics** |
| Ver reportes completos | ✅ | ❌ |
| Ver estadísticas básicas | ✅ | ✅ |
| Exportar datos | ✅ | ❌ |

---

## 🎯 Reglas Importantes

### ✅ LO QUE SÍ ESTÁ PERMITIDO

1. **Cualquier persona puede registrarse desde /login**
   - ✅ Automáticamente obtiene rol de ADMIN
   - ✅ No requiere aprobación
   - ✅ Acceso inmediato después de login

2. **Admins pueden crear usuarios staff ilimitados**
   - ✅ Desde dentro de la aplicación (/usuarios)
   - ✅ Asignan email y contraseña temporal
   - ✅ Staff puede cambiar contraseña después

3. **La ruta raíz (/) siempre redirige**
   - ✅ Si no hay sesión → `/login`
   - ✅ Si hay sesión → `/dashboard`

---

### ❌ LO QUE NO ESTÁ PERMITIDO

1. **Staff NO puede registrarse desde /login**
   - ❌ No hay opción de elegir rol en registro
   - ❌ Solo admin puede crear cuentas staff

2. **Staff NO puede crear otros usuarios**
   - ❌ No tiene acceso a /usuarios
   - ❌ No puede invitar a otros

3. **No hay jerarquía de admins**
   - ℹ️ Todos los admins tienen los mismos permisos
   - ℹ️ Si necesitas roles más complejos, hay que implementarlo

---

## 🧪 Testing de Roles

### Test 1: Crear Primer Admin
```bash
# 1. Iniciar servidor
npm run dev

# 2. Verificar que no hay usuarios
node --import tsx scripts/check-users.ts
# Resultado esperado: 0 usuarios

# 3. Registrarse desde el navegador
# http://localhost:3000
# → Debe redirigir a /login

# 4. Crear cuenta
# Click en "Crear cuenta"
# Completar formulario

# 5. Verificar rol
node --import tsx scripts/check-users.ts
# Resultado esperado: 1 usuario con role: "admin"
```

---

### Test 2: Verificar Redirección Raíz
```bash
# 1. Sin sesión
# Abrir: http://localhost:3000
# Resultado esperado: Redirige a /login

# 2. Con sesión
# Hacer login
# Abrir: http://localhost:3000
# Resultado esperado: Redirige a /dashboard
```

---

## 📝 Código Relevante

### Registro crea ADMIN
**Archivo:** `app/api/auth/register/route.ts`
```typescript
// Línea ~85
role: "admin", // Los usuarios que se registran son administradores
```

### Redirección en Raíz
**Archivo:** `app/page.tsx`
```typescript
useEffect(() => {
  if (isHydrated && !isLoading) {
    if (user) {
      router.replace("/dashboard")
    } else {
      router.replace("/login")
    }
  }
}, [user, isLoading, isHydrated, router])
```

---

## 🔄 Cambio de Roles (Manual)

Si necesitas cambiar el rol de un usuario:

```bash
# Script para actualizar rol
node --import tsx scripts/update-user-role.ts
```

O directamente en la base de datos:
```sql
UPDATE users 
SET role = 'admin' -- o 'staff'
WHERE email = 'usuario@email.com';
```

---

## 🚨 Consideraciones de Seguridad

### ✅ Seguro
- Registro público crea admins (asumiendo restaurante pequeño/familiar)
- Contraseñas hasheadas con bcrypt
- Validación de email único
- Sesiones con JWT

### ⚠️ Consideraciones
- **Registro público = Admin automático**
  - Pro: Fácil setup inicial
  - Con: Cualquiera puede registrarse como admin
  - Solución: Cerrar registro después del primer usuario (si es necesario)

### 🔒 Recomendaciones
1. **Para producción pública:**
   - Considera desactivar registro después del primer admin
   - Implementa sistema de invitaciones
   - Agrega verificación de email

2. **Para uso interno:**
   - Configuración actual es perfecta
   - Solo personas con acceso al servidor pueden registrarse

---

## 📋 Resumen Ejecutivo

```
┌─────────────────────────────────────────────────────────┐
│                                                         │
│  🔴 ADMIN (desde registro público)                     │
│     → Acceso completo                                  │
│     → Puede crear usuarios staff                       │
│                                                         │
│  🔵 STAFF (solo admin puede crear)                     │
│     → Acceso limitado                                  │
│     → Solo operaciones del día a día                   │
│                                                         │
│  🏠 Ruta raíz (/) SIEMPRE redirige:                    │
│     → Sin sesión: /login                               │
│     → Con sesión: /dashboard                           │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

---

## 🎯 Próximos Pasos

1. **Crear primer admin:**
   ```bash
   npm run dev
   # Registrarse desde http://localhost:3000
   ```

2. **Verificar:**
   ```bash
   node --import tsx scripts/check-users.ts
   ```

3. **Usar la aplicación:**
   - Login con cuenta admin
   - Crear usuarios staff desde /usuarios
   - ¡Listo! 🎉

---

**Actualizado:** 11 de octubre, 2025  
**Versión:** 1.0.0  
**Status:** ✅ Documentado
