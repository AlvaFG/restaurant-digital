-- Migration: Create triggers for automatic push notifications
-- Description: Auto-send push notifications on important events
-- Date: 2025-11-03

-- ============================================
-- Helper function to call Edge Function
-- ============================================

-- Note: Supabase Edge Functions are called via HTTP POST
-- We use pg_net extension to make HTTP requests from triggers

-- Enable pg_net extension if not already enabled
CREATE EXTENSION IF NOT EXISTS pg_net;

-- ============================================
-- Function: Send push notification
-- ============================================

CREATE OR REPLACE FUNCTION send_push_notification(
  p_tenant_id UUID,
  p_notification_type TEXT,
  p_payload JSONB,
  p_user_ids UUID[] DEFAULT NULL
)
RETURNS void AS $$
DECLARE
  v_edge_function_url TEXT;
  v_service_role_key TEXT;
  v_request_id BIGINT;
BEGIN
  -- Get Edge Function URL from environment or use default
  -- Format: https://YOUR_PROJECT.supabase.co/functions/v1/send-push
  v_edge_function_url := current_setting('app.edge_function_url', true);
  
  IF v_edge_function_url IS NULL THEN
    -- Default URL pattern (replace YOUR_PROJECT with actual project ref)
    v_edge_function_url := 'https://' || current_setting('app.project_ref', true) || '.supabase.co/functions/v1/send-push';
  END IF;

  -- Get service role key
  v_service_role_key := current_setting('app.service_role_key', true);

  -- Make async HTTP request to Edge Function
  SELECT INTO v_request_id net.http_post(
    url := v_edge_function_url,
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || COALESCE(v_service_role_key, '')
    ),
    body := jsonb_build_object(
      'tenantId', p_tenant_id,
      'notificationType', p_notification_type,
      'payload', p_payload,
      'userIds', p_user_ids
    )
  );

  -- Log the request (optional)
  RAISE NOTICE 'Push notification request sent: % (request_id: %)', p_notification_type, v_request_id;

EXCEPTION
  WHEN OTHERS THEN
    -- Don't fail the transaction if push notification fails
    RAISE WARNING 'Failed to send push notification: %', SQLERRM;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- Trigger: New order created
-- ============================================

CREATE OR REPLACE FUNCTION notify_new_order()
RETURNS TRIGGER AS $$
DECLARE
  v_table_number TEXT;
BEGIN
  -- Get table number if available
  SELECT number INTO v_table_number
  FROM tables
  WHERE id = NEW.table_id;

  -- Send push notification
  PERFORM send_push_notification(
    p_tenant_id := NEW.tenant_id,
    p_notification_type := 'new_order',
    p_payload := jsonb_build_object(
      'title', '🔔 Nuevo pedido',
      'body', CASE 
        WHEN v_table_number IS NOT NULL THEN 'Mesa ' || v_table_number || ' - Pedido #' || NEW.id
        ELSE 'Pedido #' || NEW.id
      END,
      'icon', '/icon-192x192.png',
      'badge', '/badge-72x72.png',
      'tag', 'order-' || NEW.id,
      'data', jsonb_build_object(
        'orderId', NEW.id,
        'tableId', NEW.table_id,
        'tableNumber', v_table_number,
        'url', '/pedidos/' || NEW.id
      ),
      'actions', jsonb_build_array(
        jsonb_build_object(
          'action', 'view',
          'title', 'Ver pedido'
        ),
        jsonb_build_object(
          'action', 'dismiss',
          'title', 'Cerrar'
        )
      )
    )
  );

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger
DROP TRIGGER IF EXISTS trigger_notify_new_order ON orders;
CREATE TRIGGER trigger_notify_new_order
  AFTER INSERT ON orders
  FOR EACH ROW
  EXECUTE FUNCTION notify_new_order();

-- ============================================
-- Trigger: Order status changed
-- ============================================

CREATE OR REPLACE FUNCTION notify_order_status_change()
RETURNS TRIGGER AS $$
DECLARE
  v_table_number TEXT;
  v_status_text TEXT;
BEGIN
  -- Only notify if status actually changed
  IF OLD.status = NEW.status THEN
    RETURN NEW;
  END IF;

  -- Get table number
  SELECT number INTO v_table_number
  FROM tables
  WHERE id = NEW.table_id;

  -- Translate status to Spanish
  v_status_text := CASE NEW.status
    WHEN 'pending' THEN 'Pendiente'
    WHEN 'preparing' THEN 'En preparación'
    WHEN 'ready' THEN 'Listo'
    WHEN 'delivered' THEN 'Entregado'
    WHEN 'paid' THEN 'Pagado'
    WHEN 'cancelled' THEN 'Cancelado'
    ELSE NEW.status
  END;

  -- Send notification
  PERFORM send_push_notification(
    p_tenant_id := NEW.tenant_id,
    p_notification_type := 'order_status',
    p_payload := jsonb_build_object(
      'title', '📦 Estado de pedido actualizado',
      'body', CASE 
        WHEN v_table_number IS NOT NULL THEN 'Mesa ' || v_table_number || ' - ' || v_status_text
        ELSE 'Pedido #' || NEW.id || ' - ' || v_status_text
      END,
      'icon', '/icon-192x192.png',
      'badge', '/badge-72x72.png',
      'tag', 'order-status-' || NEW.id,
      'data', jsonb_build_object(
        'orderId', NEW.id,
        'tableId', NEW.table_id,
        'tableNumber', v_table_number,
        'status', NEW.status,
        'url', '/pedidos/' || NEW.id
      ),
      'actions', jsonb_build_array(
        jsonb_build_object(
          'action', 'view',
          'title', 'Ver pedido'
        )
      )
    )
  );

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger
DROP TRIGGER IF EXISTS trigger_notify_order_status_change ON orders;
CREATE TRIGGER trigger_notify_order_status_change
  AFTER UPDATE ON orders
  FOR EACH ROW
  EXECUTE FUNCTION notify_order_status_change();

-- ============================================
-- Trigger: New alert created
-- ============================================

CREATE OR REPLACE FUNCTION notify_new_alert()
RETURNS TRIGGER AS $$
DECLARE
  v_priority_emoji TEXT;
  v_type_text TEXT;
BEGIN
  -- Get emoji based on priority
  v_priority_emoji := CASE NEW.priority
    WHEN 'critical' THEN '🚨'
    WHEN 'high' THEN '⚠️'
    WHEN 'medium' THEN '⚡'
    ELSE '📢'
  END;

  -- Translate type
  v_type_text := CASE NEW.type
    WHEN 'kitchen' THEN 'Cocina'
    WHEN 'table' THEN 'Mesa'
    WHEN 'order' THEN 'Pedido'
    WHEN 'payment' THEN 'Pago'
    ELSE NEW.type
  END;

  -- Send notification
  PERFORM send_push_notification(
    p_tenant_id := NEW.tenant_id,
    p_notification_type := CASE NEW.type
      WHEN 'kitchen' THEN 'kitchen_alert'
      WHEN 'table' THEN 'table_alert'
      ELSE 'kitchen_alert'
    END,
    p_payload := jsonb_build_object(
      'title', v_priority_emoji || ' ' || v_type_text || ' - ' || UPPER(NEW.priority),
      'body', NEW.message,
      'icon', '/icon-192x192.png',
      'badge', '/badge-72x72.png',
      'tag', 'alert-' || NEW.id,
      'data', jsonb_build_object(
        'alertId', NEW.id,
        'type', NEW.type,
        'priority', NEW.priority,
        'url', '/alertas'
      ),
      'actions', jsonb_build_array(
        jsonb_build_object(
          'action', 'view',
          'title', 'Ver alerta'
        )
      )
    )
  );

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger
DROP TRIGGER IF EXISTS trigger_notify_new_alert ON alerts;
CREATE TRIGGER trigger_notify_new_alert
  AFTER INSERT ON alerts
  FOR EACH ROW
  EXECUTE FUNCTION notify_new_alert();

-- ============================================
-- Trigger: Table status changed (optional)
-- ============================================

CREATE OR REPLACE FUNCTION notify_table_status_change()
RETURNS TRIGGER AS $$
DECLARE
  v_status_text TEXT;
BEGIN
  -- Only notify for important status changes
  IF OLD.status = NEW.status THEN
    RETURN NEW;
  END IF;

  -- Only notify for certain statuses
  IF NEW.status NOT IN ('occupied', 'needs_attention', 'needs_cleaning') THEN
    RETURN NEW;
  END IF;

  -- Translate status
  v_status_text := CASE NEW.status
    WHEN 'occupied' THEN 'Ocupada'
    WHEN 'needs_attention' THEN 'Requiere atención'
    WHEN 'needs_cleaning' THEN 'Requiere limpieza'
    ELSE NEW.status
  END;

  -- Send notification
  PERFORM send_push_notification(
    p_tenant_id := NEW.tenant_id,
    p_notification_type := 'table_alert',
    p_payload := jsonb_build_object(
      'title', '🪑 Estado de mesa actualizado',
      'body', 'Mesa ' || NEW.number || ' - ' || v_status_text,
      'icon', '/icon-192x192.png',
      'badge', '/badge-72x72.png',
      'tag', 'table-' || NEW.id,
      'data', jsonb_build_object(
        'tableId', NEW.id,
        'tableNumber', NEW.number,
        'status', NEW.status,
        'url', '/mesas/' || NEW.id
      ),
      'actions', jsonb_build_array(
        jsonb_build_object(
          'action', 'view',
          'title', 'Ver mesa'
        )
      )
    )
  );

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger (optional - can be noisy)
-- Uncomment if you want table status notifications
-- DROP TRIGGER IF EXISTS trigger_notify_table_status_change ON tables;
-- CREATE TRIGGER trigger_notify_table_status_change
--   AFTER UPDATE ON tables
--   FOR EACH ROW
--   EXECUTE FUNCTION notify_table_status_change();

-- ============================================
-- Trigger: Payment completed
-- ============================================

CREATE OR REPLACE FUNCTION notify_payment_completed()
RETURNS TRIGGER AS $$
DECLARE
  v_order_id UUID;
  v_table_number TEXT;
BEGIN
  -- Only notify on successful payments
  IF NEW.status != 'completed' THEN
    RETURN NEW;
  END IF;

  -- Get order info
  SELECT table_id INTO v_order_id
  FROM orders
  WHERE id = NEW.order_id;

  IF v_order_id IS NOT NULL THEN
    SELECT number INTO v_table_number
    FROM tables
    WHERE id = v_order_id;
  END IF;

  -- Send notification
  PERFORM send_push_notification(
    p_tenant_id := NEW.tenant_id,
    p_notification_type := 'payment',
    p_payload := jsonb_build_object(
      'title', '💰 Pago recibido',
      'body', CASE 
        WHEN v_table_number IS NOT NULL THEN 'Mesa ' || v_table_number || ' - $' || NEW.amount
        ELSE 'Pedido - $' || NEW.amount
      END,
      'icon', '/icon-192x192.png',
      'badge', '/badge-72x72.png',
      'tag', 'payment-' || NEW.id,
      'data', jsonb_build_object(
        'paymentId', NEW.id,
        'orderId', NEW.order_id,
        'amount', NEW.amount,
        'url', '/pedidos/' || NEW.order_id
      )
    )
  );

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger
DROP TRIGGER IF EXISTS trigger_notify_payment_completed ON payments;
CREATE TRIGGER trigger_notify_payment_completed
  AFTER INSERT OR UPDATE ON payments
  FOR EACH ROW
  EXECUTE FUNCTION notify_payment_completed();

-- ============================================
-- Grant permissions
-- ============================================

GRANT EXECUTE ON FUNCTION send_push_notification(UUID, TEXT, JSONB, UUID[]) TO service_role;
GRANT EXECUTE ON FUNCTION notify_new_order() TO service_role;
GRANT EXECUTE ON FUNCTION notify_order_status_change() TO service_role;
GRANT EXECUTE ON FUNCTION notify_new_alert() TO service_role;
GRANT EXECUTE ON FUNCTION notify_table_status_change() TO service_role;
GRANT EXECUTE ON FUNCTION notify_payment_completed() TO service_role;

-- ============================================
-- Configuration
-- ============================================

-- To configure the Edge Function URL, run in SQL Editor:
-- ALTER DATABASE postgres SET app.edge_function_url = 'https://YOUR_PROJECT.supabase.co/functions/v1/send-push';
-- ALTER DATABASE postgres SET app.project_ref = 'YOUR_PROJECT_REF';
-- ALTER DATABASE postgres SET app.service_role_key = 'YOUR_SERVICE_ROLE_KEY';

-- Or set per session:
-- SET app.edge_function_url = 'https://YOUR_PROJECT.supabase.co/functions/v1/send-push';

COMMENT ON FUNCTION send_push_notification(UUID, TEXT, JSONB, UUID[]) IS 'Calls Edge Function to send push notifications';
COMMENT ON FUNCTION notify_new_order() IS 'Trigger: Send notification when new order is created';
COMMENT ON FUNCTION notify_order_status_change() IS 'Trigger: Send notification when order status changes';
COMMENT ON FUNCTION notify_new_alert() IS 'Trigger: Send notification when new alert is created';
COMMENT ON FUNCTION notify_table_status_change() IS 'Trigger: Send notification when table status changes';
COMMENT ON FUNCTION notify_payment_completed() IS 'Trigger: Send notification when payment is completed';
