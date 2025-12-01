# Database Triggers Configuration

Esta guía explica cómo configurar los triggers automáticos para enviar push notifications.

## 📋 Triggers Implementados

Los siguientes eventos disparan notificaciones automáticamente:

### 1. **Nuevo Pedido** (`notify_new_order`)
- **Evento**: INSERT en tabla `orders`
- **Notificación**: "🔔 Nuevo pedido - Mesa X"
- **Tipo**: `new_order`

### 2. **Cambio de Estado de Pedido** (`notify_order_status_change`)
- **Evento**: UPDATE en tabla `orders` (campo `status`)
- **Notificación**: "📦 Estado actualizado - Listo / En preparación / etc"
- **Tipo**: `order_status`

### 3. **Nueva Alerta** (`notify_new_alert`)
- **Evento**: INSERT en tabla `alerts`
- **Notificación**: "🚨 Cocina - CRITICAL" o "⚠️ Mesa - HIGH"
- **Tipo**: `kitchen_alert` o `table_alert`

### 4. **Cambio de Estado de Mesa** (`notify_table_status_change`) - OPCIONAL
- **Evento**: UPDATE en tabla `tables`
- **Notificación**: "🪑 Mesa X - Requiere atención"
- **Tipo**: `table_alert`
- **Nota**: Comentado por defecto (puede ser ruidoso)

### 5. **Pago Completado** (`notify_payment_completed`)
- **Evento**: INSERT/UPDATE en tabla `payments` (status = 'completed')
- **Notificación**: "💰 Pago recibido - $XXX"
- **Tipo**: `payment`

## 🔧 Configuración

### Paso 1: Aplicar migración

Ejecuta la migración en Supabase SQL Editor:

```sql
-- Copiar y ejecutar el contenido de:
-- supabase/migrations/20251103000002_create_notification_triggers.sql
```

### Paso 2: Configurar variables del sistema

Los triggers necesitan saber la URL de tu Edge Function. Configura en SQL Editor:

```sql
-- Configurar URL de Edge Function
ALTER DATABASE postgres SET app.edge_function_url = 'https://YOUR_PROJECT_REF.supabase.co/functions/v1/send-push';

-- Configurar Project Ref
ALTER DATABASE postgres SET app.project_ref = 'YOUR_PROJECT_REF';

-- Configurar Service Role Key (para autenticación)
ALTER DATABASE postgres SET app.service_role_key = 'YOUR_SERVICE_ROLE_KEY';
```

**Ejemplo:**
```sql
ALTER DATABASE postgres SET app.edge_function_url = 'https://vblbngnajogwypvkfjsr.supabase.co/functions/v1/send-push';
ALTER DATABASE postgres SET app.project_ref = 'vblbngnajogwypvkfjsr';
ALTER DATABASE postgres SET app.service_role_key = 'eyJhbGc...'; -- Tu service_role_key
```

### Paso 3: Habilitar pg_net extension

Los triggers usan `pg_net` para hacer HTTP requests:

```sql
CREATE EXTENSION IF NOT EXISTS pg_net;
```

Esto ya está incluido en la migración.

### Paso 4: Desplegar Edge Function

Asegúrate de que la Edge Function `send-push` esté desplegada:

```bash
npx supabase functions deploy send-push
```

## 🧪 Probar Triggers

### Prueba 1: Crear un pedido

```sql
INSERT INTO orders (tenant_id, table_id, status, total)
VALUES (
  'your-tenant-id',
  'your-table-id',
  'pending',
  100.00
);
```

Deberías recibir una notificación: "🔔 Nuevo pedido - Mesa X"

### Prueba 2: Cambiar estado de pedido

```sql
UPDATE orders
SET status = 'ready'
WHERE id = 'your-order-id';
```

Deberías recibir: "📦 Estado actualizado - Listo"

### Prueba 3: Crear una alerta

```sql
INSERT INTO alerts (tenant_id, type, priority, message)
VALUES (
  'your-tenant-id',
  'kitchen',
  'high',
  'Falta ingrediente: tomate'
);
```

Deberías recibir: "⚠️ Cocina - HIGH"

## 📊 Monitoreo

### Ver logs de pg_net requests

```sql
-- Ver últimas peticiones HTTP
SELECT *
FROM net.http_request_queue
ORDER BY created_at DESC
LIMIT 10;
```

### Ver triggers activos

```sql
-- Ver todos los triggers en la base de datos
SELECT
  trigger_name,
  event_object_table,
  action_statement
FROM information_schema.triggers
WHERE trigger_name LIKE 'trigger_notify%';
```

### Deshabilitar trigger temporalmente

```sql
-- Deshabilitar
ALTER TABLE orders DISABLE TRIGGER trigger_notify_new_order;

-- Re-habilitar
ALTER TABLE orders ENABLE TRIGGER trigger_notify_new_order;
```

## ⚙️ Personalización

### Cambiar el emoji o mensaje

Edita las funciones en SQL Editor:

```sql
CREATE OR REPLACE FUNCTION notify_new_order()
RETURNS TRIGGER AS $$
BEGIN
  PERFORM send_push_notification(
    p_tenant_id := NEW.tenant_id,
    p_notification_type := 'new_order',
    p_payload := jsonb_build_object(
      'title', '🎉 ¡Nuevo pedido llegó!',  -- <-- Cambiar aquí
      'body', 'Mesa ' || v_table_number,
      ...
    )
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;
```

### Enviar a usuarios específicos

Modifica las funciones para pasar `p_user_ids`:

```sql
-- Enviar solo a administradores
PERFORM send_push_notification(
  p_tenant_id := NEW.tenant_id,
  p_notification_type := 'new_order',
  p_payload := ...,
  p_user_ids := ARRAY(
    SELECT id FROM users 
    WHERE tenant_id = NEW.tenant_id 
    AND role = 'admin'
  )
);
```

### Habilitar notificaciones de mesas

Por defecto, las notificaciones de cambios de estado de mesa están comentadas:

```sql
-- Descomentar en la migración:
CREATE TRIGGER trigger_notify_table_status_change
  AFTER UPDATE ON tables
  FOR EACH ROW
  EXECUTE FUNCTION notify_table_status_change();
```

## 🔍 Troubleshooting

### Notificaciones no se envían

1. **Verificar pg_net**:
   ```sql
   SELECT * FROM pg_extension WHERE extname = 'pg_net';
   ```

2. **Verificar Edge Function URL**:
   ```sql
   SELECT current_setting('app.edge_function_url', true);
   ```

3. **Ver errores en logs**:
   ```sql
   SELECT * FROM net.http_request_queue WHERE status = 'ERROR';
   ```

4. **Verificar Edge Function está desplegada**:
   - Ir a Supabase Dashboard > Edge Functions
   - Verificar que `send-push` aparece y está activa

### Notificaciones se envían pero no llegan

1. Verificar que los usuarios tienen suscripciones activas:
   ```sql
   SELECT * FROM push_subscriptions WHERE is_active = true;
   ```

2. Verificar preferencias del usuario:
   ```sql
   SELECT * FROM notification_preferences WHERE enabled = true;
   ```

3. Verificar VAPID keys en Edge Function Secrets

### Performance

Si hay muchos usuarios, los triggers pueden ser lentos. Optimizaciones:

1. **Usar pg_net async**: Ya implementado
2. **Filtrar usuarios**: Enviar solo a usuarios relevantes
3. **Queue system**: Para miles de notificaciones, usar un sistema de colas

## 📚 Referencias

- [Supabase pg_net](https://supabase.com/docs/guides/database/extensions/pg_net)
- [PostgreSQL Triggers](https://www.postgresql.org/docs/current/sql-createtrigger.html)
- [Edge Functions](https://supabase.com/docs/guides/functions)
