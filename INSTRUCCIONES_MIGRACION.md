# 🚀 Instrucciones para Aplicar Migraciones

## 📋 Resumen
Vas a aplicar 2 migraciones SQL en tu base de datos Supabase para habilitar las funcionalidades avanzadas.

---

## ✅ PASO 1: Acceder a Supabase Dashboard

1. Ve a: https://supabase.com/dashboard
2. Inicia sesión con tu cuenta
3. Selecciona tu proyecto del restaurante
4. En el menú lateral izquierdo, haz clic en **"SQL Editor"**

---

## ✅ PASO 2: Aplicar Primera Migración (Tabla de Auditoría)

### 2.1 Crear nuevo query
- En SQL Editor, haz clic en **"New query"** (botón verde arriba a la derecha)

### 2.2 Copiar SQL
- Abre el archivo: `supabase/migrations/20251017000001_create_table_audit.sql`
- Selecciona TODO el contenido (Ctrl+A)
- Copia (Ctrl+C)

### 2.3 Pegar y Ejecutar
- Pega el SQL en el editor de Supabase (Ctrl+V)
- Haz clic en **"RUN"** (botón verde abajo a la derecha)
- Espera a que aparezca: ✅ "Success. No rows returned"

### 2.4 Verificar
Ejecuta esta query para verificar:
```sql
SELECT COUNT(*) FROM public.table_status_audit;
```
Debe retornar: `0` (tabla vacía pero creada)

---

## ✅ PASO 3: Aplicar Segunda Migración (Funciones RPC)

### 3.1 Crear nuevo query
- Haz clic en **"New query"** nuevamente

### 3.2 Copiar SQL
- Abre el archivo: `supabase/migrations/20251017000002_create_atomic_functions.sql`
- Selecciona TODO el contenido (Ctrl+A)
- Copia (Ctrl+C)

### 3.3 Pegar y Ejecutar
- Pega el SQL en el editor de Supabase (Ctrl+V)
- Haz clic en **"RUN"**
- Espera confirmación: ✅ "Success. No rows returned"

### 3.4 Verificar
Ejecuta esta query para verificar que la función existe:
```sql
SELECT proname 
FROM pg_proc 
WHERE proname = 'create_order_with_table_update';
```
Debe retornar: `create_order_with_table_update`

---

## ✅ PASO 4: Verificación Final

Ejecuta esta query completa para verificar TODO:
```sql
-- Verificar tabla de auditoría
SELECT 
  'table_status_audit existe' as verificacion,
  EXISTS(
    SELECT 1 FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name = 'table_status_audit'
  ) as resultado;

-- Verificar función RPC
SELECT 
  'create_order_with_table_update existe' as verificacion,
  EXISTS(
    SELECT 1 FROM pg_proc 
    WHERE proname = 'create_order_with_table_update'
  ) as resultado;

-- Verificar función de log
SELECT 
  'log_table_status_change existe' as verificacion,
  EXISTS(
    SELECT 1 FROM pg_proc 
    WHERE proname = 'log_table_status_change'
  ) as resultado;
```

**Resultado esperado:** Las 3 filas deben mostrar `true` en la columna `resultado`

---

## 🎯 PASO 5: Probar la Funcionalidad

### 5.1 Iniciar el servidor de desarrollo
```powershell
npm run dev
```

### 5.2 Crear un pedido de prueba
1. Ve a: http://localhost:3000/pedidos
2. Haz clic en **"Nuevo pedido"** (pestaña superior)
3. Selecciona una mesa que esté en estado **"Libre"** (verde)
4. Agrega al menos 1 item del menú
5. Haz clic en **"Crear pedido"**

### 5.3 Verificar el resultado
- ✅ Debe aparecer un toast verde: "Pedido creado"
- ✅ El mensaje debe decir: "Mesa cambió de estado a 'Pedido en curso'"
- ✅ La mesa debe cambiar de color verde → azul

### 5.4 Verificar la auditoría
Vuelve a Supabase SQL Editor y ejecuta:
```sql
SELECT 
  table_number,
  previous_status,
  new_status,
  changed_at,
  duration_seconds,
  reason
FROM public.table_status_audit
ORDER BY changed_at DESC
LIMIT 5;
```

**Resultado esperado:** Debe aparecer al menos 1 registro con el cambio de estado de tu mesa

---

## ❌ Solución de Problemas

### Error: "relation public.table_status_audit already exists"
✅ **Solución:** La tabla ya existe, continúa con el siguiente paso

### Error: "function create_order_with_table_update already exists"
✅ **Solución:** La función ya existe, continúa con las pruebas

### Error: "permission denied"
❌ **Problema:** No tienes permisos de administrador en Supabase
✅ **Solución:** Asegúrate de estar usando la cuenta owner del proyecto

### Error al crear pedido: "create_order_with_table_update does not exist"
❌ **Problema:** La migración 2 no se aplicó correctamente
✅ **Solución:** Vuelve a ejecutar el PASO 3

### Error: "El restaurante está cerrado"
❌ **Problema:** La validación de horarios está activa
✅ **Solución temporal:** 
1. Abre: `lib/business-rules/table-rules.ts`
2. Busca la función `checkOperatingHours()`
3. Comenta las líneas 157-163 (el if que retorna el error)
4. Guarda el archivo
5. Reinicia el servidor (`npm run dev`)

---

## 📊 Checklist de Completitud

- [ ] Migración 1 aplicada (tabla de auditoría)
- [ ] Migración 2 aplicada (funciones RPC)
- [ ] Verificación SQL ejecutada (3 resultados = true)
- [ ] Servidor de desarrollo iniciado
- [ ] Pedido de prueba creado exitosamente
- [ ] Mesa cambió de estado correctamente
- [ ] Registro de auditoría visible en SQL
- [ ] Sin errores en la consola del navegador

---

## 🎉 ¡Listo!

Si completaste todos los pasos del checklist, el sistema está funcionando correctamente con:
- ✅ Transacciones atómicas
- ✅ Auditoría completa
- ✅ Validaciones de negocio
- ✅ Cambios de estado automáticos

---

## 📞 Siguiente Paso

Una vez que verifiques que todo funciona, ejecuta:
```powershell
git add INSTRUCCIONES_MIGRACION.md
git commit -m "docs: Agregar instrucciones de migración para funcionalidades avanzadas"
git push origin main
```

---

**Fecha de creación:** 23 de octubre de 2025
**Estado:** Listo para aplicar
**Tiempo estimado:** 15-20 minutos
