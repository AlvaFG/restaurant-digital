-- supabase/migrations/20251016000000_create_alerts_table.sql
-- Migration: Create alerts table for restaurant notifications
-- Purpose: Store alerts for table requests (llamar mozo, pedir cuenta, etc.)

-- Create alerts table
CREATE TABLE IF NOT EXISTS "public"."alerts" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "tenant_id" uuid NOT NULL,
  "table_id" uuid NOT NULL,
  "type" text NOT NULL,
  "message" text NOT NULL,
  "acknowledged" boolean NOT NULL DEFAULT false,
  "acknowledged_at" timestamp with time zone,
  "acknowledged_by" uuid,
  "created_at" timestamp with time zone NOT NULL DEFAULT now(),
  "updated_at" timestamp with time zone NOT NULL DEFAULT now(),
  
  -- Constraints
  CONSTRAINT "alerts_type_check" CHECK (
    "type" IN (
      'llamar_mozo', 
      'pedido_entrante', 
      'quiere_pagar_efectivo', 
      'pago_aprobado'
    )
  ),
  
  -- Foreign keys
  CONSTRAINT "alerts_tenant_id_fkey" FOREIGN KEY ("tenant_id") 
    REFERENCES "public"."tenants"("id") ON DELETE CASCADE,
  CONSTRAINT "alerts_table_id_fkey" FOREIGN KEY ("table_id") 
    REFERENCES "public"."tables"("id") ON DELETE CASCADE,
  CONSTRAINT "alerts_acknowledged_by_fkey" FOREIGN KEY ("acknowledged_by") 
    REFERENCES "public"."users"("id") ON DELETE SET NULL
);

-- Table ownership
ALTER TABLE "public"."alerts" OWNER TO "postgres";

-- Indexes for performance
CREATE INDEX IF NOT EXISTS "idx_alerts_tenant_id" ON "public"."alerts"("tenant_id");
CREATE INDEX IF NOT EXISTS "idx_alerts_table_id" ON "public"."alerts"("table_id");
CREATE INDEX IF NOT EXISTS "idx_alerts_acknowledged" ON "public"."alerts"("acknowledged");
CREATE INDEX IF NOT EXISTS "idx_alerts_created_at" ON "public"."alerts"("created_at" DESC);
CREATE INDEX IF NOT EXISTS "idx_alerts_type" ON "public"."alerts"("type");

-- Composite index for common query pattern (active alerts by tenant)
CREATE INDEX IF NOT EXISTS "idx_alerts_tenant_acknowledged_created" 
  ON "public"."alerts"("tenant_id", "acknowledged", "created_at" DESC);

-- Enable Row Level Security
ALTER TABLE "public"."alerts" ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Users can view alerts in their tenant
CREATE POLICY "users_can_view_alerts_in_their_tenant"
  ON "public"."alerts"
  FOR SELECT
  USING (
    "tenant_id" = (current_setting('app.tenant_id', true))::uuid
  );

-- RLS Policy: Users can create alerts in their tenant
CREATE POLICY "users_can_create_alerts_in_their_tenant"
  ON "public"."alerts"
  FOR INSERT
  WITH CHECK (
    "tenant_id" = (current_setting('app.tenant_id', true))::uuid
  );

-- RLS Policy: Users can update alerts in their tenant
CREATE POLICY "users_can_update_alerts_in_their_tenant"
  ON "public"."alerts"
  FOR UPDATE
  USING (
    "tenant_id" = (current_setting('app.tenant_id', true))::uuid
  )
  WITH CHECK (
    "tenant_id" = (current_setting('app.tenant_id', true))::uuid
  );

-- RLS Policy: Users can delete alerts in their tenant (optional, for cleanup)
CREATE POLICY "users_can_delete_alerts_in_their_tenant"
  ON "public"."alerts"
  FOR DELETE
  USING (
    "tenant_id" = (current_setting('app.tenant_id', true))::uuid
  );

-- Function to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION "public"."update_updated_at_column"()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to update updated_at on alerts table
DROP TRIGGER IF EXISTS "set_updated_at" ON "public"."alerts";
CREATE TRIGGER "set_updated_at"
  BEFORE UPDATE ON "public"."alerts"
  FOR EACH ROW
  EXECUTE FUNCTION "public"."update_updated_at_column"();

-- Comments for documentation
COMMENT ON TABLE "public"."alerts" IS 'Stores restaurant table alerts and notifications';
COMMENT ON COLUMN "public"."alerts"."type" IS 'Alert type: llamar_mozo, pedido_entrante, quiere_pagar_efectivo, pago_aprobado';
COMMENT ON COLUMN "public"."alerts"."acknowledged" IS 'Whether the alert has been attended to';
COMMENT ON COLUMN "public"."alerts"."acknowledged_at" IS 'Timestamp when the alert was acknowledged';
COMMENT ON COLUMN "public"."alerts"."acknowledged_by" IS 'User ID who acknowledged the alert';
