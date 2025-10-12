# 🚀 Inicio Rápido - Sistema de Login

## ✅ Estado Actual
- Base de datos limpia (0 usuarios)
- Sistema listo para uso
- Tenant configurado

---

## 🎯 Crear Tu Primera Cuenta

### Paso 1: Iniciar el Servidor
```bash
npm run dev
```

### Paso 2: Abrir en el Navegador
```
http://localhost:3000/login
```

### Paso 3: Registrarte
1. Click en **"¿No tienes cuenta? Créala aquí"**
2. Completa el formulario:
   - **Nombre:** Tu nombre completo
   - **Email:** tu@email.com
   - **Contraseña:** mínimo 6 caracteres
   - **Confirmar contraseña:** repite la contraseña

3. Click en **"Crear Cuenta"**

4. Verás el mensaje: ✅ **"Cuenta creada exitosamente. Ahora puedes iniciar sesión."**

### Paso 4: Iniciar Sesión
1. El formulario volverá automáticamente al modo login
2. Tu email ya estará en el campo
3. Ingresa tu contraseña
4. Click en **"Iniciar Sesión"**
5. ✅ Serás redirigido al dashboard

---

## 🔧 Comandos Útiles

### Ver Usuarios
```bash
node --import tsx scripts/check-users.ts
```

### Borrar Todos los Usuarios (requiere confirmación)
```bash
node --import tsx scripts/delete-all-users.ts
```

### Crear Usuarios de Prueba
```bash
node --import tsx scripts/seed-database.ts
```

---

## ❓ Preguntas Frecuentes

### ¿Cómo borro todos los usuarios?
```bash
node --import tsx scripts/delete-all-users.ts
# Confirmar escribiendo: SI
# Confirmar escribiendo: BORRAR TODO
```

### ¿Cómo sé cuántos usuarios hay?
```bash
node --import tsx scripts/check-users.ts
```

### ¿Qué pasa después de registrarme?
1. Ves un mensaje de éxito verde
2. Vuelves automáticamente a la pantalla de login
3. Tu email ya está en el campo
4. Solo ingresas tu contraseña y entras

### ¿Puedo cambiar mi contraseña?
Sí, contacta al administrador o usa:
```bash
node --import tsx scripts/reset-password.ts
```

---

## 🎨 Características

- ✅ Registro de nuevos usuarios
- ✅ Login con email y contraseña
- ✅ Validaciones en tiempo real
- ✅ Mensajes de error claros
- ✅ Feedback visual (verde para éxito, rojo para error)
- ✅ Redirección automática al dashboard
- ✅ Gestión segura de sesiones

---

## 📚 Más Información

- **Documentación completa:** `docs/LOGIN-IMPROVEMENTS.md`
- **Resumen de cambios:** `docs/RESUMEN-MEJORAS-LOGIN.md`
- **Guía de proyecto:** `AGENTS.md`

---

## 🆘 ¿Problemas?

### Error: "Este email ya está registrado"
- El email ya existe en la base de datos
- Usa otro email o borra los usuarios existentes

### Error: "Las contraseñas no coinciden"
- Verifica que ambas contraseñas sean iguales

### Error: "La contraseña debe tener al menos 6 caracteres"
- Usa una contraseña más larga

### No puedo hacer login
1. Verifica que el servidor esté corriendo (`npm run dev`)
2. Verifica que el email y contraseña sean correctos
3. Verifica que tu usuario exista:
   ```bash
   node --import tsx scripts/check-users.ts
   ```

---

**¡Listo para usar! 🎉**
