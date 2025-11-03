# 🧪 Script de Validación - Fase 5.2

**Ejecutor**: Manual (con ayuda de este documento)  
**Fecha**: Octubre 16, 2025

---

## 📋 INICIO - Pre-validaciones

### ✅ Ambiente Preparado
- [x] Servidor dev corriendo en http://localhost:3000
- [x] Supabase configurado: `vblbngnajogwypvkfjsr.supabase.co`
- [x] Variables de entorno cargadas
- [x] Feature flags activos (USE_SUPABASE=true)

### 🔑 Credenciales de Prueba

**Necesitamos**:
1. Usuario de prueba en Supabase Auth
2. Tenant ID asociado
3. Mesas creadas en BD

**Acción**: Primero verificar si hay usuarios/datos o crearlos

---

## 🎬 VALIDACIÓN 1: Login y Acceso

### Paso 1.1: Abrir aplicación
- [ ] URL: http://localhost:3000
- [ ] ¿Redirige a login? ✅/❌
- [ ] ¿Muestra pantalla de login? ✅/❌

### Paso 1.2: Intentar login
- [ ] ¿Hay formulario de login? ✅/❌
- [ ] Email de prueba: _______________
- [ ] Password de prueba: _______________
- [ ] ¿Login funciona? ✅/❌
- [ ] ¿Redirige a dashboard? ✅/❌

**Si no hay usuario**: Crear uno en Supabase o usar signup

---

## 🔄 VALIDACIÓN 2: Dashboard Principal

### Paso 2.1: Acceso al dashboard
- [ ] URL actual: _______________
- [ ] ¿Se ve dashboard? ✅/❌
- [ ] ¿Hay métricas visibles? ✅/❌
- [ ] ¿Hay errores en consola? ✅/❌

### Paso 2.2: Verificar datos cargados
```javascript
// Abrir DevTools Console (F12) y ejecutar:
console.log('User:', localStorage.getItem('user'));
console.log('Session:', localStorage.getItem('session'));
```

**Resultado**:
- User ID: _______________
- Tenant ID: _______________
- Session válida: ✅/❌

---

## 🪑 VALIDACIÓN 3: Gestión de Mesas

### Paso 3.1: Ir a gestión de mesas
- [ ] Buscar link "Mesas" o "Tables"
- [ ] URL: http://localhost:3000/mesas (o similar)
- [ ] ¿Página carga? ✅/❌
- [ ] ¿Se ven mesas existentes? ✅/❌

### Paso 3.2: Crear mesa de prueba
- [ ] Click en "Nueva Mesa" o "Crear"
- [ ] Número de mesa: **99**
- [ ] Capacidad: **4**
- [ ] Zona: **Seleccionar o dejar default**
- [ ] ¿Se crea sin errores? ✅/❌

**Verificar en Supabase**:
1. Ir a Supabase Dashboard
2. Table Editor → `tables`
3. Buscar mesa #99
4. ¿Existe? ✅/❌

### Paso 3.3: Editar mesa
- [ ] Seleccionar mesa #99
- [ ] Cambiar capacidad a **6**
- [ ] Guardar cambios
- [ ] ¿Se actualiza? ✅/❌

### Paso 3.4: Verificar real-time
- [ ] Abrir Supabase Dashboard en otra pestaña
- [ ] Actualizar capacidad directamente en Supabase a **8**
- [ ] Volver a la app (NO refrescar)
- [ ] ¿Mesa se actualiza sola? ✅/❌

---

## 📱 VALIDACIÓN 4: QR Code

### Paso 4.1: Generar QR para mesa
- [ ] Ir a QR Management
- [ ] URL: http://localhost:3000/qr-management
- [ ] Seleccionar mesa #99
- [ ] Click "Generar QR"
- [ ] ¿QR se genera? ✅/❌

### Paso 4.2: Copiar URL del QR
- [ ] URL del QR: _______________
- [ ] Formato: `http://localhost:3000/qr/[tableId]?token=xxx`
- [ ] ¿URL válida? ✅/❌

### Paso 4.3: Verificar en Supabase
```sql
SELECT id, number, qr_token, qr_expires_at 
FROM tables 
WHERE number = '99';
```

**Resultado**:
- qr_token presente: ✅/❌
- qr_expires_at configurado: ✅/❌
- Expira en ~24h: ✅/❌

### Paso 4.4: Abrir QR como cliente
- [ ] Abrir URL del QR en ventana incógnito
- [ ] ¿Página carga? ✅/❌
- [ ] ¿Token es válido? ✅/❌
- [ ] ¿Se ve información de mesa? ✅/❌

---

## 🍽️ VALIDACIÓN 5: Menú y Pedidos

### Paso 5.1: Ver menú (como cliente)
- [ ] Desde página del QR
- [ ] ¿Se ven items del menú? ✅/❌
- [ ] ¿Hay categorías? ✅/❌
- [ ] ¿Precios correctos? ✅/❌

**Si no hay items**: Crear algunos en Supabase

```sql
INSERT INTO menu_items (tenant_id, name, description, price, category, available)
VALUES 
  ('tenant-id', 'Hamburguesa', 'Clásica con queso', 15.99, 'Comida', true),
  ('tenant-id', 'Pizza Margherita', 'Tomate y mozzarella', 18.50, 'Comida', true),
  ('tenant-id', 'Coca-Cola', 'Bebida 500ml', 3.50, 'Bebidas', true);
```

### Paso 5.2: Agregar items al carrito
- [ ] Seleccionar "Hamburguesa"
- [ ] Click en "Agregar"
- [ ] ¿Se agrega al carrito? ✅/❌
- [ ] ¿Total se calcula? ✅/❌
- [ ] Agregar 2x "Coca-Cola"
- [ ] Total esperado: 15.99 + (2 × 3.50) = 22.99 ✅/❌

### Paso 5.3: Crear pedido
- [ ] Click "Confirmar pedido"
- [ ] ¿Pedido se crea? ✅/❌
- [ ] ¿Redirige a confirmación? ✅/❌
- [ ] ¿Mesa cambia a ocupada? ✅/❌

**Verificar en Supabase**:
```sql
-- Ver pedido creado
SELECT id, table_id, status, total, items, created_at
FROM orders
WHERE table_id = (SELECT id FROM tables WHERE number = '99')
ORDER BY created_at DESC
LIMIT 1;
```

**Resultado**:
- Pedido existe: ✅/❌
- Total correcto (22.99): ✅/❌
- Items correctos: ✅/❌
- Estado: pending/preparing ✅/❌

---

## 👨‍🍳 VALIDACIÓN 6: Vista de Cocina

### Paso 6.1: Abrir cocina
- [ ] En otra ventana/pestaña
- [ ] URL: http://localhost:3000/pedidos (o kitchen)
- [ ] ¿Página carga? ✅/❌
- [ ] ¿Se ve el pedido recién creado? ✅/❌

### Paso 6.2: Verificar datos del pedido
- [ ] ¿Número de mesa correcto (99)? ✅/❌
- [ ] ¿Items correctos? ✅/❌
- [ ] ¿Total correcto? ✅/❌
- [ ] ¿Tiempo desde creación? ✅/❌

### Paso 6.3: Cambiar estado a "Preparando"
- [ ] Click en pedido
- [ ] Click "Marcar preparando"
- [ ] ¿Estado cambia? ✅/❌
- [ ] ¿Color/icono cambia? ✅/❌

**Verificar en Supabase**:
```sql
SELECT status, updated_at 
FROM orders 
WHERE table_id = (SELECT id FROM tables WHERE number = '99')
ORDER BY created_at DESC 
LIMIT 1;
```

**Resultado**:
- Status = 'preparing': ✅/❌
- updated_at reciente: ✅/❌

### Paso 6.4: Cambiar estado a "Listo"
- [ ] Click "Marcar listo"
- [ ] ¿Estado cambia? ✅/❌
- [ ] ¿Genera alerta? ✅/❌
- [ ] ¿Mueve a sección "listos"? ✅/❌

---

## 🔔 VALIDACIÓN 7: Real-Time Updates

### Paso 7.1: Test de actualización automática
**Setup**:
- Ventana A: Cocina (http://localhost:3000/pedidos)
- Ventana B: Cliente con QR (crear nuevo pedido)

**Prueba**:
1. [ ] En ventana B: Crear nuevo pedido
2. [ ] En ventana A: **SIN REFRESCAR**, ¿aparece pedido? ✅/❌
3. [ ] Tiempo de aparición: _____ segundos
4. [ ] ¿Hay notificación sonora/visual? ✅/❌

**Criterio de éxito**: Aparece en < 3 segundos ✅/❌

### Paso 7.2: Test de cambio de estado
**Setup**:
- Ventana A: Dashboard/Mapa de mesas
- Ventana B: Supabase Dashboard

**Prueba**:
1. [ ] En Supabase: Cambiar estado de mesa 99 a "ocupada"
2. [ ] En app (sin refrescar): ¿Mesa cambia color? ✅/❌
3. [ ] Tiempo: _____ segundos

**Criterio de éxito**: Actualiza en < 3 segundos ✅/❌

---

## 💳 VALIDACIÓN 8: Pagos

### Paso 8.1: Solicitar cuenta
- [ ] Desde vista de cliente
- [ ] Click "Solicitar cuenta"
- [ ] ¿Genera payment intent? ✅/❌
- [ ] ¿Muestra total correcto? ✅/❌

**Si usa payment-store legacy**: ⚠️ Documentar

### Paso 8.2: Verificar payment en Supabase
```sql
SELECT id, order_id, amount, status, payment_method
FROM payments
WHERE order_id = 'el-order-id'
LIMIT 1;
```

**Resultado**:
- Payment creado: ✅/❌
- Amount correcto: ✅/❌
- Status: pending ✅/❌

### Paso 8.3: Simular pago completado
**Opción A** (si MercadoPago configurado):
- [ ] Seguir flujo de pago real

**Opción B** (manual en BD):
```sql
UPDATE payments
SET status = 'completed', paid_at = NOW()
WHERE order_id = 'el-order-id';
```

### Paso 8.4: Verificar actualización
- [ ] ¿Orden marca como pagada? ✅/❌
- [ ] ¿Mesa vuelve a libre? ✅/❌
- [ ] ¿Cliente ve confirmación? ✅/❌

---

## 🏢 VALIDACIÓN 9: Zonas

### Paso 9.1: Gestión de zonas
- [ ] Ir a gestión de zonas
- [ ] URL: http://localhost:3000/salon o /zonas
- [ ] ¿Página carga? ✅/❌
- [ ] ¿Se ven zonas existentes? ✅/❌

### Paso 9.2: Crear zona de prueba
- [ ] Click "Nueva zona"
- [ ] Nombre: "Zona Test"
- [ ] Descripción: "Para validación"
- [ ] ¿Se crea? ✅/❌

**Si usa zones-store legacy**: ⚠️ Documentar

### Paso 9.3: Asignar mesa a zona
- [ ] Editar mesa #99
- [ ] Cambiar zona a "Zona Test"
- [ ] Guardar
- [ ] ¿Se actualiza? ✅/❌

---

## 📊 VALIDACIÓN 10: Analytics

### Paso 10.1: Ver analytics
- [ ] Ir a /analitica o /analytics
- [ ] ¿Página carga? ✅/❌
- [ ] ¿Se ven gráficos? ✅/❌
- [ ] ¿Datos de Supabase? ✅/❌

### Paso 10.2: Verificar métricas
- [ ] Total ventas: _______________
- [ ] Pedidos activos: _______________
- [ ] Mesas ocupadas: _______________
- [ ] ¿Coincide con Supabase? ✅/❌

---

## 🐛 REGISTRO DE PROBLEMAS

### Issue #1:
**Título**: _______________
**Severidad**: Alta/Media/Baja
**Descripción**: _______________
**Solución**: _______________

### Issue #2:
**Título**: _______________
**Severidad**: Alta/Media/Baja
**Descripción**: _______________
**Solución**: _______________

---

## ✅ RESUMEN FINAL

### Flujos Validados
- [ ] Cliente (QR → Pedido → Pago): ___/6 pasos ✅
- [ ] Chef (Cocina): ___/4 pasos ✅
- [ ] Admin (Dashboard/CRUD): ___/4 pasos ✅
- [ ] Real-Time: ___/2 escenarios ✅

### Supabase Integration
- [ ] Todos los datos vienen de Supabase: ✅/❌
- [ ] Real-time funciona: ✅/❌
- [ ] RLS activo (verificar en 5.3): ⏳

### Stores Legacy Encontrados
- [ ] payment-store en uso: ✅/❌
- [ ] zones-store en uso: ✅/❌
- [ ] Otros stores: _______________

### Errores Críticos
- [ ] Cantidad de errores: _______________
- [ ] Errores bloqueantes: _______________
- [ ] Errores menores: _______________

---

## 🎯 CONCLUSIÓN

**Estado de la Fase 5.2**: 
- [ ] ✅ COMPLETADA - Todo funcional
- [ ] ⚠️ COMPLETADA CON ISSUES - Funcional pero con problemas menores
- [ ] ❌ FALLIDA - Problemas críticos encontrados

**Siguiente fase**: 5.3 Auditoría de Seguridad y RLS

**Fecha de finalización**: _______________
**Tiempo total**: _______________

---

**Notas adicionales**:
_______________________________________________
_______________________________________________
_______________________________________________
