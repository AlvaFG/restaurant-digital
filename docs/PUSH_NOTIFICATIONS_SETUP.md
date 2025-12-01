# Push Notifications Setup Guide

Esta guía explica cómo configurar las notificaciones push en el sistema.

## 📋 Prerrequisitos

- Proyecto de Supabase activo
- Acceso a Supabase Dashboard
- Node.js y npm instalados

## 🔧 Paso 1: Instalar dependencias

```bash
npm install web-push
```

## 🔐 Paso 2: Generar VAPID Keys

Las VAPID keys son necesarias para autenticar las notificaciones push.

```bash
node scripts/generate-vapid-keys.js
```

Este script generará:
1. Un archivo `vapid-keys.json` con las keys (NO COMMITEAR)
2. Instrucciones para configurar las variables de entorno

## 🗄️ Paso 3: Aplicar migración de base de datos

```bash
# Conectarse a Supabase
supabase login

# Aplicar la migración
supabase db push
```

O manualmente en el SQL Editor de Supabase Dashboard:
1. Ir a SQL Editor
2. Copiar el contenido de `supabase/migrations/20251103000001_create_push_subscriptions.sql`
3. Ejecutar

La migración crea:
- Tabla `push_subscriptions`: Almacena las suscripciones push
- Tabla `notification_preferences`: Preferencias de notificaciones por usuario
- Funciones: `get_active_push_subscriptions`, `get_notification_recipients`
- Políticas RLS para seguridad

## ⚙️ Paso 4: Configurar variables de entorno

### Frontend (.env.local)

```env
NEXT_PUBLIC_VAPID_PUBLIC_KEY="YOUR_PUBLIC_KEY_HERE"
```

### Backend (Supabase Edge Function Secrets)

En Supabase Dashboard > Edge Functions > Secrets:

```
VAPID_PUBLIC_KEY=YOUR_PUBLIC_KEY_HERE
VAPID_PRIVATE_KEY=YOUR_PRIVATE_KEY_HERE
VAPID_SUBJECT=mailto:your-email@restaurant.com
```

## 📡 Paso 5: Desplegar Edge Function

```bash
# Instalar Supabase CLI si no está instalado
npm install -g supabase

# Desplegar la función
supabase functions deploy send-push
```

## 🧪 Paso 6: Probar las notificaciones

### Desde el frontend:

```typescript
import { usePushNotifications } from '@/hooks/use-push-notifications';

function NotificationTest() {
  const { subscribe, sendTest, isSubscribed } = usePushNotifications();
  
  return (
    <div>
      {!isSubscribed ? (
        <button onClick={() => subscribe(userId, tenantId)}>
          Activar notificaciones
        </button>
      ) : (
        <button onClick={sendTest}>
          Enviar notificación de prueba
        </button>
      )}
    </div>
  );
}
```

### Desde el backend (Edge Function):

```bash
curl -i --location --request POST 'https://YOUR_PROJECT.supabase.co/functions/v1/send-push' \
  --header 'Authorization: Bearer YOUR_ANON_KEY' \
  --header 'Content-Type: application/json' \
  --data '{
    "tenantId": "uuid-here",
    "notificationType": "new_order",
    "payload": {
      "title": "Nuevo pedido",
      "body": "Mesa 5 - Pedido #123",
      "icon": "/icon-192x192.png",
      "badge": "/badge-72x72.png",
      "tag": "order-123",
      "data": {
        "orderId": "123",
        "tableNumber": "5"
      },
      "actions": [
        {
          "action": "view",
          "title": "Ver pedido"
        },
        {
          "action": "dismiss",
          "title": "Cerrar"
        }
      ]
    }
  }'
```

## 🔔 Tipos de notificaciones

El sistema soporta 5 tipos de notificaciones:

1. **new_order**: Nuevos pedidos creados
2. **order_status**: Cambios de estado en pedidos
3. **kitchen_alert**: Alertas de cocina
4. **table_alert**: Alertas de mesas
5. **payment**: Notificaciones de pago

## 🛡️ Seguridad

- Las suscripciones tienen RLS (Row Level Security)
- Cada usuario solo puede ver/editar sus propias suscripciones
- Las VAPID keys nunca se exponen en el frontend (solo la pública)
- Las Edge Functions usan service_role para enviar notificaciones

## 🔍 Troubleshooting

### "Push not supported"
- Verificar que el navegador soporte Push API
- Verificar que el sitio use HTTPS (o localhost)

### "Permission denied"
- El usuario rechazó los permisos
- Limpiar permisos del sitio en configuración del navegador

### "Subscription failed"
- Verificar que `NEXT_PUBLIC_VAPID_PUBLIC_KEY` esté configurada
- Verificar que la key sea válida (sin espacios extra)

### "Send failed with 401"
- Verificar que las VAPID keys en Supabase sean correctas
- Verificar que `VAPID_SUBJECT` esté configurado

### "Send failed with 410"
- La suscripción expiró o fue eliminada
- El sistema la marca automáticamente como inactiva

## 📊 Monitoreo

Verificar el estado de las suscripciones:

```sql
-- Ver todas las suscripciones activas
SELECT 
  user_id,
  endpoint,
  created_at,
  last_used_at,
  is_active
FROM push_subscriptions
WHERE is_active = true;

-- Ver preferencias de usuario
SELECT * FROM notification_preferences;
```

## 🔄 Integración con triggers

Las notificaciones se pueden disparar automáticamente desde triggers de Supabase:

```sql
-- Ejemplo: Notificar cuando se crea un pedido
CREATE OR REPLACE FUNCTION notify_new_order()
RETURNS TRIGGER AS $$
BEGIN
  -- Llamar a Edge Function via pg_net
  PERFORM net.http_post(
    url := 'https://YOUR_PROJECT.supabase.co/functions/v1/send-push',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || current_setting('app.service_role_key')
    ),
    body := jsonb_build_object(
      'tenantId', NEW.tenant_id,
      'notificationType', 'new_order',
      'payload', jsonb_build_object(
        'title', 'Nuevo pedido',
        'body', 'Mesa ' || NEW.table_number
      )
    )
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;
```

## 📚 Referencias

- [Web Push API](https://developer.mozilla.org/en-US/docs/Web/API/Push_API)
- [Supabase Edge Functions](https://supabase.com/docs/guides/functions)
- [VAPID Protocol](https://datatracker.ietf.org/doc/html/rfc8292)
