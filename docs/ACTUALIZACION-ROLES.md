# ⚡ ACTUALIZACIÓN RÁPIDA - Roles y Redirección

## ✅ Cambios Aplicados

### 1. 🔴 Registro crea ADMIN (no staff)
**Archivo modificado:** `app/api/auth/register/route.ts`

**ANTES:**
```typescript
role: "staff", // Por defecto los usuarios registrados son staff
```

**AHORA:**
```typescript
role: "admin", // Los usuarios que se registran son administradores
```

**Impacto:**
- ✅ Primer usuario que se registra = Admin principal
- ✅ Admin puede crear usuarios staff desde `/usuarios`
- ✅ Staff NO puede registrarse (solo admin los crea)

---

### 2. 🏠 Ruta raíz redirige a login
**Archivo:** `app/page.tsx` (ya estaba correcto)

**Comportamiento:**
```typescript
if (user) {
  router.replace("/dashboard")  // Si hay sesión → dashboard
} else {
  router.replace("/login")      // Si NO hay sesión → login
}
```

**Impacto:**
- ✅ `npm run dev` → abre en `http://localhost:3000` → redirige a `/login`
- ✅ Si ya hiciste login → redirige a `/dashboard`
- ✅ Experiencia fluida sin URLs manuales

---

## 📊 Comparación de Roles

| Característica | Admin | Staff |
|----------------|-------|-------|
| **Cómo se crea** | 🔴 Registro público en `/login` | 🔵 Solo admin puede crear |
| **Crear usuarios** | ✅ Sí | ❌ No |
| **Gestionar menú** | ✅ Sí | ❌ No |
| **Tomar pedidos** | ✅ Sí | ✅ Sí |
| **Ver mesas** | ✅ Sí | ✅ Sí |
| **Configuración** | ✅ Sí | ❌ No |
| **Analytics** | ✅ Sí | ⚠️ Limitado |

---

## 🎯 Flujo de Trabajo Típico

### Primera Vez (Setup Inicial)
```
1. npm run dev
   ↓
2. Se abre http://localhost:3000
   ↓
3. Redirige automáticamente a /login
   ↓
4. Click en "Crear cuenta"
   ↓
5. Completar formulario
   ↓
6. ✅ Cuenta ADMIN creada
   ↓
7. Login
   ↓
8. ✅ Acceso completo al dashboard
```

### Agregar Staff
```
1. Login como ADMIN
   ↓
2. Ir a /usuarios
   ↓
3. Click en "Agregar Usuario"
   ↓
4. Completar formulario (role: staff)
   ↓
5. ✅ Usuario STAFF creado
   ↓
6. Staff hace login con sus credenciales
   ↓
7. ✅ Acceso limitado según permisos
```

---

## 🧪 Pruebas Rápidas

### Test 1: Verificar que registro crea ADMIN
```bash
# Antes
node --import tsx scripts/check-users.ts
# Resultado: 0 usuarios

# Registrarse desde el navegador
# (ir a http://localhost:3000, crear cuenta)

# Después
node --import tsx scripts/check-users.ts
# Resultado esperado:
# ✅ 1 usuario
# ✅ Role: admin
```

---

### Test 2: Verificar redirección raíz
```bash
# Test A: Sin sesión
# 1. Abrir navegador en modo incógnito
# 2. Ir a http://localhost:3000
# Resultado esperado: Redirige a /login

# Test B: Con sesión
# 1. Hacer login
# 2. Ir a http://localhost:3000
# Resultado esperado: Redirige a /dashboard
```

---

## 📁 Archivos Modificados

### Código (1 cambio)
- ✅ `app/api/auth/register/route.ts` - Línea ~85 (staff → admin)

### Documentación (3 nuevos)
- ✅ `docs/ROLES-Y-PERMISOS.md` - Documentación completa de roles
- ✅ `RESUMEN-FINAL-LOGIN.md` - Actualizado con info de roles
- ✅ `CHECKLIST-COMPLETO.md` - Actualizado con info de roles

---

## 🎨 Visual del Sistema

```
┌─────────────────────────────────────────────────────────┐
│                  http://localhost:3000                  │
│                         (/)                             │
└─────────────────────────────────────────────────────────┘
                         ↓
                 ¿Hay sesión?
                    /    \
                   /      \
                  NO      SÍ
                 ↓         ↓
         ┌─────────┐  ┌──────────┐
         │ /login  │  │/dashboard│
         └─────────┘  └──────────┘
              ↓
    ¿Ya tienes cuenta?
         /        \
        NO        SÍ
        ↓          ↓
   ┌────────┐  ┌──────┐
   │Registro│  │Login │
   │(ADMIN) │  │      │
   └────────┘  └──────┘
        ↓          ↓
        └──────┬───┘
               ↓
         ┌──────────┐
         │Dashboard │
         │ (Admin)  │
         └──────────┘
               ↓
      Crear usuarios STAFF
      desde /usuarios
```

---

## 💡 Puntos Clave

### ✅ Lo que DEBES saber:
1. **Primer registro = Admin principal** con acceso completo
2. **`npm run dev` abre en login** automáticamente
3. **Staff NO puede registrarse** (solo admin los crea)
4. **Ruta raíz siempre redirige** según estado de sesión

### ⚠️ Consideraciones:
1. **Registro público = Admin**
   - Pro: Setup rápido para primer usuario
   - Con: Cualquiera con acceso al servidor puede registrarse como admin
   - Solución: Cerrar registro después del primer admin (si es necesario)

2. **Para restaurante pequeño/familiar:** Perfecto ✅
3. **Para producción pública:** Considera agregar sistema de invitaciones

---

## 📚 Documentación Relacionada

- **Detalles completos:** `docs/ROLES-Y-PERMISOS.md`
- **Resumen ejecutivo:** `RESUMEN-FINAL-LOGIN.md`
- **Checklist:** `CHECKLIST-COMPLETO.md`
- **Guía rápida:** `docs/QUICK-START-LOGIN.md`

---

## 🚀 Siguiente Paso

```bash
# 1. Iniciar servidor
npm run dev

# 2. Se abre automáticamente en login
# → Crear tu cuenta (será ADMIN)

# 3. Verificar
node --import tsx scripts/check-users.ts
# Debe mostrar: 1 usuario con role: admin
```

---

**Actualizado:** 11 de octubre, 2025  
**Cambio:** Admin por defecto + Documentación de roles  
**Status:** ✅ Completado
