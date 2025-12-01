-- Migration: Create push_subscriptions table
-- Description: Store push notification subscriptions for PWA
-- Date: 2025-11-03

-- Create push_subscriptions table
CREATE TABLE IF NOT EXISTS push_subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  tenant_id UUID NOT NULL,
  endpoint TEXT NOT NULL UNIQUE,
  expiration_time BIGINT,
  keys JSONB NOT NULL, -- Contains p256dh and auth keys
  user_agent TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  last_used_at TIMESTAMPTZ,
  is_active BOOLEAN DEFAULT true,
  
  -- Composite index for efficient lookups
  CONSTRAINT unique_user_endpoint UNIQUE(user_id, endpoint)
);

-- Add indexes for performance
CREATE INDEX idx_push_subscriptions_user_id ON push_subscriptions(user_id);
CREATE INDEX idx_push_subscriptions_tenant_id ON push_subscriptions(tenant_id);
CREATE INDEX idx_push_subscriptions_active ON push_subscriptions(is_active) WHERE is_active = true;
CREATE INDEX idx_push_subscriptions_endpoint ON push_subscriptions(endpoint);

-- Create notification_preferences table for user settings
CREATE TABLE IF NOT EXISTS notification_preferences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  tenant_id UUID NOT NULL,
  
  -- Notification type preferences
  enabled BOOLEAN DEFAULT true,
  new_orders BOOLEAN DEFAULT true,
  order_status_changes BOOLEAN DEFAULT true,
  kitchen_alerts BOOLEAN DEFAULT true,
  table_alerts BOOLEAN DEFAULT true,
  payment_notifications BOOLEAN DEFAULT true,
  
  -- Quiet hours
  quiet_hours_enabled BOOLEAN DEFAULT false,
  quiet_hours_start TIME,
  quiet_hours_end TIME,
  
  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  CONSTRAINT unique_user_preferences UNIQUE(user_id, tenant_id)
);

-- Add indexes
CREATE INDEX idx_notification_preferences_user_id ON notification_preferences(user_id);
CREATE INDEX idx_notification_preferences_tenant_id ON notification_preferences(tenant_id);

-- Enable RLS
ALTER TABLE push_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE notification_preferences ENABLE ROW LEVEL SECURITY;

-- RLS Policies for push_subscriptions
-- Users can only manage their own subscriptions
CREATE POLICY "Users can view their own push subscriptions"
  ON push_subscriptions FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own push subscriptions"
  ON push_subscriptions FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own push subscriptions"
  ON push_subscriptions FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own push subscriptions"
  ON push_subscriptions FOR DELETE
  USING (auth.uid() = user_id);

-- Service role can manage all subscriptions (for Edge Functions)
CREATE POLICY "Service role can manage all push subscriptions"
  ON push_subscriptions FOR ALL
  USING (auth.jwt()->>'role' = 'service_role');

-- RLS Policies for notification_preferences
CREATE POLICY "Users can view their own notification preferences"
  ON notification_preferences FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own notification preferences"
  ON notification_preferences FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own notification preferences"
  ON notification_preferences FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Service role can manage all notification preferences"
  ON notification_preferences FOR ALL
  USING (auth.jwt()->>'role' = 'service_role');

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_push_subscriptions_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION update_notification_preferences_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers
CREATE TRIGGER push_subscriptions_updated_at
  BEFORE UPDATE ON push_subscriptions
  FOR EACH ROW
  EXECUTE FUNCTION update_push_subscriptions_updated_at();

CREATE TRIGGER notification_preferences_updated_at
  BEFORE UPDATE ON notification_preferences
  FOR EACH ROW
  EXECUTE FUNCTION update_notification_preferences_updated_at();

-- Create function to get active subscriptions for a user
CREATE OR REPLACE FUNCTION get_active_push_subscriptions(p_user_id UUID)
RETURNS SETOF push_subscriptions AS $$
BEGIN
  RETURN QUERY
  SELECT *
  FROM push_subscriptions
  WHERE user_id = p_user_id
    AND is_active = true
    AND (expiration_time IS NULL OR expiration_time > EXTRACT(EPOCH FROM NOW()) * 1000);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function to get users to notify for tenant events
CREATE OR REPLACE FUNCTION get_notification_recipients(
  p_tenant_id UUID,
  p_notification_type TEXT
)
RETURNS TABLE(user_id UUID, endpoint TEXT, keys JSONB) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    ps.user_id,
    ps.endpoint,
    ps.keys
  FROM push_subscriptions ps
  INNER JOIN notification_preferences np ON ps.user_id = np.user_id AND ps.tenant_id = np.tenant_id
  WHERE ps.tenant_id = p_tenant_id
    AND ps.is_active = true
    AND np.enabled = true
    AND (expiration_time IS NULL OR expiration_time > EXTRACT(EPOCH FROM NOW()) * 1000)
    AND CASE p_notification_type
      WHEN 'new_order' THEN np.new_orders
      WHEN 'order_status' THEN np.order_status_changes
      WHEN 'kitchen_alert' THEN np.kitchen_alerts
      WHEN 'table_alert' THEN np.table_alerts
      WHEN 'payment' THEN np.payment_notifications
      ELSE true
    END
    -- Check quiet hours
    AND (
      NOT np.quiet_hours_enabled
      OR NOT (CURRENT_TIME BETWEEN np.quiet_hours_start AND np.quiet_hours_end)
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant necessary permissions
GRANT SELECT, INSERT, UPDATE, DELETE ON push_subscriptions TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON notification_preferences TO authenticated;
GRANT EXECUTE ON FUNCTION get_active_push_subscriptions(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION get_notification_recipients(UUID, TEXT) TO service_role;

-- Add comments
COMMENT ON TABLE push_subscriptions IS 'Stores Web Push API subscriptions for PWA notifications';
COMMENT ON TABLE notification_preferences IS 'User preferences for push notifications';
COMMENT ON FUNCTION get_active_push_subscriptions(UUID) IS 'Returns all active push subscriptions for a user';
COMMENT ON FUNCTION get_notification_recipients(UUID, TEXT) IS 'Returns users who should receive notifications for specific tenant events';
