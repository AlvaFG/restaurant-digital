-- ============================================
-- Migration: Add payment type field
-- Description: Add type field to payments table to distinguish between sales, courtesy, and voids
-- Author: Restaurant Digital Team
-- Date: 2025-10-31
-- ============================================

-- Add type column to payments table
ALTER TABLE payments 
ADD COLUMN type TEXT NOT NULL DEFAULT 'sale' 
CHECK (type IN ('sale', 'courtesy', 'void'));

-- Add index for filtering by type
CREATE INDEX idx_payments_type ON payments(type);

-- Update comment
COMMENT ON COLUMN payments.type IS 'Type of payment: sale (normal), courtesy (house invite), void (cancelled)';

-- Update existing records to be 'sale' type (already default)
UPDATE payments SET type = 'sale' WHERE type IS NULL;

-- Add helpful view for reporting
CREATE OR REPLACE VIEW v_payment_summary AS
SELECT
  p.tenant_id,
  p.type,
  p.status,
  COUNT(*) as payment_count,
  SUM(p.amount_cents) as total_amount_cents,
  MIN(p.created_at) as first_payment,
  MAX(p.created_at) as last_payment
FROM payments p
GROUP BY p.tenant_id, p.type, p.status;

-- Grant access to view
GRANT SELECT ON v_payment_summary TO authenticated;

COMMENT ON VIEW v_payment_summary IS 'Summary of payments by type and status for reporting';
