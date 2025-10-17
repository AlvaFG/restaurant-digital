# 🧪 Fase 5.2 - Validación de Flujos de Usuario

**Fecha**: Octubre 16, 2025  
**Estado**: 🟡 EN PROGRESO  
**Objetivo**: Validar que todos los flujos de usuario funcionan correctamente con Supabase

---

## 🎯 Objetivos

1. ✅ Validar flujo completo de **Cliente** (QR → Pedido → Pago)
2. ✅ Validar flujo completo de **Chef** (Cocina → Estados)
3. ✅ Validar flujo completo de **Admin** (Dashboard → CRUD)
4. ✅ Verificar **real-time updates** funcionan
5. ✅ Verificar **integración con Supabase** en todos los puntos

---

## 📱 Flujo 1: Cliente (QR Order)

### Objetivo
Simular el flujo completo de un cliente que escanea QR, hace pedido y paga.

### Pasos a Validar

#### 1.1 Generación de QR
- [ ] Ir a `/qr-management`
- [ ] Generar QR para una mesa
- [ ] Verificar que QR se genera correctamente
- [ ] Verificar que token se guarda en Supabase
- [ ] Copiar URL del QR

**Verificación en Supabase**:
```sql
SELECT id, number, qr_token, qr_expires_at, qrcode_url
FROM tables
WHERE id = 'mesa-test-id';
```

**Criterios de éxito**:
- ✅ QR se genera sin errores
- ✅ `qr_token` está en base de datos
- ✅ `qr_expires_at` está configurado (24h)
- ✅ URL del QR es válida

---

#### 1.2 Escanear QR y Ver Menú
- [ ] Abrir URL del QR en navegador
- [ ] Verificar que carga página de mesa
- [ ] Verificar que token es válido
- [ ] Ver menú disponible
- [ ] Verificar que items se cargan desde Supabase

**Puntos de verificación**:
- URL: `http://localhost:3000/qr/[tableId]?token=xxx`
- Ver items del menú
- Verificar categorías
- Verificar precios

**Verificación en Supabase**:
```sql
SELECT id, name, price, category, available
FROM menu_items
WHERE tenant_id = 'test-tenant-id' AND available = true;
```

**Criterios de éxito**:
- ✅ Página carga sin errores
- ✅ Token se valida correctamente
- ✅ Menú se muestra completo
- ✅ Datos vienen de Supabase

---

#### 1.3 Agregar Items al Carrito
- [ ] Seleccionar varios items del menú
- [ ] Agregar al carrito
- [ ] Modificar cantidades
- [ ] Verificar cálculo de totales

**Puntos de verificación**:
- Agregar items
- Incrementar/decrementar cantidad
- Ver subtotal actualizado
- Ver total con impuestos

**Criterios de éxito**:
- ✅ Items se agregan al carrito
- ✅ Cantidades se actualizan
- ✅ Totales se calculan correctamente
- ✅ UI responsive

---

#### 1.4 Crear Pedido
- [ ] Confirmar pedido
- [ ] Verificar que pedido se crea en Supabase
- [ ] Verificar estado inicial del pedido
- [ ] Verificar que mesa cambia de estado

**Verificación en Supabase**:
```sql
-- Ver pedido creado
SELECT id, table_id, status, total, items, created_at
FROM orders
WHERE table_id = 'mesa-test-id'
ORDER BY created_at DESC
LIMIT 1;

-- Ver estado de mesa
SELECT id, number, status
FROM tables
WHERE id = 'mesa-test-id';
```

**Criterios de éxito**:
- ✅ Pedido se crea en Supabase
- ✅ Estado inicial: `pending` o `preparing`
- ✅ Items correctos en pedido
- ✅ Total correcto
- ✅ Mesa cambia a estado `ocupada`

---

#### 1.5 Solicitar Cuenta
- [ ] Solicitar cuenta desde app
- [ ] Verificar que se genera payment intent
- [ ] Verificar integración con MercadoPago

**Puntos de verificación**:
- Botón "Solicitar cuenta"
- Genera link de pago
- Redirige a MercadoPago (si está configurado)

**Verificación en Supabase**:
```sql
SELECT id, order_id, status, amount, external_id, payment_method
FROM payments
WHERE order_id = 'order-test-id';
```

**Criterios de éxito**:
- ✅ Payment intent se crea
- ✅ Link de pago válido
- ✅ Datos en Supabase
- ⚠️ Si payment-store legacy: documentar

---

#### 1.6 Confirmar Pago
- [ ] Simular pago exitoso
- [ ] Verificar webhook recibido
- [ ] Verificar estado de pedido actualizado
- [ ] Verificar estado de mesa actualizado

**Verificación en Supabase**:
```sql
-- Ver pago confirmado
SELECT id, status, paid_at
FROM payments
WHERE order_id = 'order-test-id';

-- Ver orden actualizada
SELECT id, status, payment_status
FROM orders
WHERE id = 'order-test-id';

-- Ver mesa liberada
SELECT id, status
FROM tables
WHERE id = 'mesa-test-id';
```

**Criterios de éxito**:
- ✅ Pago marca como `completed`
- ✅ Orden marca como `paid`
- ✅ Mesa vuelve a `libre`
- ✅ Webhook procesa correctamente

---

## 👨‍🍳 Flujo 2: Chef (Kitchen Display)

### Objetivo
Validar que chef puede ver y gestionar pedidos en tiempo real.

### Pasos a Validar

#### 2.1 Ver Pedidos Pendientes
- [ ] Ir a `/pedidos` o kitchen display
- [ ] Verificar que pedidos aparecen
- [ ] Verificar que datos vienen de Supabase
- [ ] Verificar orden de pedidos (más antiguos primero)

**Verificación en Supabase**:
```sql
SELECT id, table_id, status, items, created_at
FROM orders
WHERE tenant_id = 'test-tenant-id' 
  AND status IN ('pending', 'preparing')
ORDER BY created_at ASC;
```

**Criterios de éxito**:
- ✅ Pedidos se muestran
- ✅ Datos correctos (mesa, items, tiempo)
- ✅ Orden correcto
- ✅ UI clara y usable

---

#### 2.2 Real-Time Updates
- [ ] Crear nuevo pedido desde cliente
- [ ] Verificar que aparece en cocina SIN refrescar
- [ ] Verificar notificación sonora/visual
- [ ] Verificar tiempo se actualiza en vivo

**Criterios de éxito**:
- ✅ Pedido aparece automáticamente
- ✅ Sin necesidad de F5
- ✅ Notificación funciona
- ✅ Supabase real-time activo

---

#### 2.3 Cambiar Estado a "Preparando"
- [ ] Seleccionar pedido
- [ ] Marcar como "preparando"
- [ ] Verificar actualización en Supabase
- [ ] Verificar que cliente ve cambio (si tiene vista)

**Verificación en Supabase**:
```sql
UPDATE orders
SET status = 'preparing', updated_at = NOW()
WHERE id = 'order-test-id';

-- Verificar
SELECT id, status, updated_at
FROM orders
WHERE id = 'order-test-id';
```

**Criterios de éxito**:
- ✅ Estado cambia a `preparing`
- ✅ Se actualiza en BD
- ✅ UI refleja cambio
- ✅ Timestamp actualizado

---

#### 2.4 Cambiar Estado a "Listo"
- [ ] Marcar pedido como "listo"
- [ ] Verificar actualización
- [ ] Verificar que genera alerta para mesero
- [ ] Verificar que pedido sale de lista activa

**Verificación en Supabase**:
```sql
-- Actualizar pedido
UPDATE orders
SET status = 'ready', updated_at = NOW()
WHERE id = 'order-test-id';

-- Ver alertas generadas
SELECT id, type, message, table_id, acknowledged
FROM alerts
WHERE table_id = 'mesa-test-id'
ORDER BY created_at DESC
LIMIT 1;
```

**Criterios de éxito**:
- ✅ Estado cambia a `ready`
- ✅ Alerta se crea
- ✅ Pedido mueve a sección "listos"
- ✅ Notificación a mesero

---

## 💼 Flujo 3: Admin (Dashboard)

### Objetivo
Validar gestión completa de mesas, zonas y analytics.

### Pasos a Validar

#### 3.1 Dashboard Principal
- [ ] Ir a `/dashboard`
- [ ] Verificar métricas en tiempo real
- [ ] Verificar gráficos se cargan
- [ ] Verificar datos de Supabase

**Métricas a verificar**:
- Total de ventas hoy
- Pedidos activos
- Mesas ocupadas
- Ingreso promedio por mesa

**Verificación en Supabase**:
```sql
-- Ventas del día
SELECT COUNT(*), SUM(total)
FROM orders
WHERE tenant_id = 'test-tenant-id'
  AND created_at >= CURRENT_DATE;

-- Mesas ocupadas
SELECT COUNT(*)
FROM tables
WHERE tenant_id = 'test-tenant-id'
  AND status = 'ocupada';
```

**Criterios de éxito**:
- ✅ Dashboard carga sin errores
- ✅ Métricas correctas
- ✅ Gráficos se renderizan
- ✅ Datos de Supabase

---

#### 3.2 Gestión de Mesas (CRUD)
- [ ] Ir a `/mesas`
- [ ] **CREATE**: Crear nueva mesa
- [ ] **READ**: Ver lista de mesas
- [ ] **UPDATE**: Editar mesa existente
- [ ] **DELETE**: Eliminar mesa

**Verificación CREATE**:
```sql
INSERT INTO tables (tenant_id, number, capacity, status)
VALUES ('test-tenant-id', '99', 4, 'libre')
RETURNING *;
```

**Verificación UPDATE**:
```sql
UPDATE tables
SET capacity = 6, number = '100'
WHERE id = 'nueva-mesa-id'
RETURNING *;
```

**Verificación DELETE**:
```sql
DELETE FROM tables
WHERE id = 'nueva-mesa-id'
RETURNING *;
```

**Criterios de éxito**:
- ✅ CREATE: Mesa se crea en Supabase
- ✅ READ: Mesas se listan correctamente
- ✅ UPDATE: Cambios se guardan
- ✅ DELETE: Mesa se elimina o soft-delete
- ✅ UI actualiza en tiempo real

---

#### 3.3 Gestión de Zonas
- [ ] Ir a `/salon` o zonas
- [ ] Crear nueva zona
- [ ] Editar zona existente
- [ ] Asignar mesas a zona
- [ ] Verificar en Supabase

**Verificación en Supabase**:
```sql
-- Ver zonas
SELECT id, name, description, active
FROM zones
WHERE tenant_id = 'test-tenant-id';

-- Ver mesas por zona
SELECT t.id, t.number, z.name as zone_name
FROM tables t
LEFT JOIN zones z ON t.zone_id = z.id
WHERE t.tenant_id = 'test-tenant-id';
```

**Criterios de éxito**:
- ✅ Zonas se crean/editan
- ✅ Mesas se asignan correctamente
- ✅ Datos en Supabase
- ⚠️ Si usa zones-store legacy: documentar

---

#### 3.4 Reportes y Analytics
- [ ] Ir a `/analitica`
- [ ] Ver reporte de ventas
- [ ] Filtrar por fecha
- [ ] Exportar datos (si disponible)
- [ ] Verificar cálculos correctos

**Verificación en Supabase**:
```sql
-- Ventas por día
SELECT 
  DATE(created_at) as fecha,
  COUNT(*) as total_pedidos,
  SUM(total) as total_ventas
FROM orders
WHERE tenant_id = 'test-tenant-id'
  AND created_at >= CURRENT_DATE - INTERVAL '7 days'
GROUP BY DATE(created_at)
ORDER BY fecha DESC;
```

**Criterios de éxito**:
- ✅ Reportes se generan
- ✅ Filtros funcionan
- ✅ Cálculos correctos
- ✅ Performance aceptable

---

## 🔄 Validaciones de Real-Time

### Objetivo
Verificar que Supabase real-time funciona en todos los módulos.

### Escenarios a Probar

#### RT-1: Actualización de Pedidos
1. Abrir cocina en ventana A
2. Crear pedido desde cliente en ventana B
3. Verificar que aparece en cocina SIN refrescar

**Criterio**: ✅ Actualización inmediata (< 2 segundos)

---

#### RT-2: Cambio de Estado de Mesa
1. Abrir mapa de mesas en ventana A
2. Ocupar mesa desde cliente en ventana B
3. Verificar que color cambia en mapa SIN refrescar

**Criterio**: ✅ Mesa cambia de verde a rojo automáticamente

---

#### RT-3: Notificaciones de Alertas
1. Abrir dashboard en ventana A
2. Generar alerta (pedido listo) en ventana B
3. Verificar que alerta aparece SIN refrescar

**Criterio**: ✅ Alerta aparece con notificación

---

## 📊 Checklist de Validación

### Flujo Cliente
- [ ] 1.1 Generación de QR
- [ ] 1.2 Escanear QR y ver menú
- [ ] 1.3 Agregar items al carrito
- [ ] 1.4 Crear pedido
- [ ] 1.5 Solicitar cuenta
- [ ] 1.6 Confirmar pago

### Flujo Chef
- [ ] 2.1 Ver pedidos pendientes
- [ ] 2.2 Real-time updates
- [ ] 2.3 Cambiar a "preparando"
- [ ] 2.4 Cambiar a "listo"

### Flujo Admin
- [ ] 3.1 Dashboard principal
- [ ] 3.2 CRUD de mesas
- [ ] 3.3 Gestión de zonas
- [ ] 3.4 Reportes y analytics

### Real-Time
- [ ] RT-1 Actualización de pedidos
- [ ] RT-2 Cambio estado de mesa
- [ ] RT-3 Notificaciones de alertas

---

## 🐛 Registro de Issues Encontrados

### Issue #1: [Título]
- **Severidad**: Alta/Media/Baja
- **Descripción**: 
- **Pasos para reproducir**: 
- **Comportamiento esperado**: 
- **Comportamiento actual**: 
- **Solución propuesta**: 

---

## ✅ Criterios de Éxito Global

Para considerar la Fase 5.2 completada:

- ✅ **Flujo Cliente**: 100% funcional (6/6 pasos)
- ✅ **Flujo Chef**: 100% funcional (4/4 pasos)
- ✅ **Flujo Admin**: 100% funcional (4/4 pasos)
- ✅ **Real-Time**: 100% funcional (3/3 escenarios)
- ✅ **Sin errores críticos** en consola
- ✅ **Supabase como única fuente** de datos
- ⚠️ **Issues documentados** (si existen)

---

## 📝 Notas de Testing

### Ambiente de Prueba
- **URL**: http://localhost:3000
- **Tenant ID**: [obtener de sesión]
- **User ID**: [obtener de sesión]
- **Supabase URL**: [de .env.local]

### Datos de Prueba
- **Mesa de test**: Mesa #99
- **Items de menú**: [verificar disponibles]
- **Zona de test**: Zona Test

### Herramientas
- **Browser**: Chrome DevTools
- **Supabase Dashboard**: Para verificar datos
- **Network Tab**: Para ver llamadas API
- **Console**: Para ver errores

---

**Inicio del testing**: [Fecha/Hora]  
**Fin del testing**: [Fecha/Hora]  
**Duración total**: [Tiempo]  
**Tester**: GitHub Copilot + Usuario

---

**Estado actual**: 🟡 PREPARANDO AMBIENTE  
**Siguiente**: Iniciar validación de flujo cliente
