-- PASO 1: SOLO LA TABLA (sin funciones, sin vistas, sin nada más)
CREATE TABLE public.table_status_audit (
  id UUID DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL,
  table_id UUID NOT NULL,
  table_number TEXT NOT NULL,
  previous_status TEXT NOT NULL,
  new_status TEXT NOT NULL,
  changed_by UUID,
  changed_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  reason TEXT,
  order_id UUID,
  session_id UUID,
  duration_seconds INTEGER,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  CONSTRAINT table_status_audit_pkey PRIMARY KEY (id),
  CONSTRAINT table_status_audit_tenant_fkey FOREIGN KEY (tenant_id) REFERENCES public.tenants(id) ON DELETE CASCADE,
  CONSTRAINT table_status_audit_table_fkey FOREIGN KEY (table_id) REFERENCES public.tables(id) ON DELETE CASCADE,
  CONSTRAINT table_status_audit_user_fkey FOREIGN KEY (changed_by) REFERENCES public.users(id) ON DELETE SET NULL,
  CONSTRAINT table_status_audit_order_fkey FOREIGN KEY (order_id) REFERENCES public.orders(id) ON DELETE SET NULL
);

CREATE INDEX idx_table_audit_table_id ON public.table_status_audit(table_id);
CREATE INDEX idx_table_audit_tenant_id ON public.table_status_audit(tenant_id);
CREATE INDEX idx_table_audit_changed_at ON public.table_status_audit(changed_at DESC);
CREATE INDEX idx_table_audit_changed_by ON public.table_status_audit(changed_by);
CREATE INDEX idx_table_audit_order_id ON public.table_status_audit(order_id);
CREATE INDEX idx_table_audit_table_date ON public.table_status_audit(table_id, changed_at DESC);

ALTER TABLE public.table_status_audit ENABLE ROW LEVEL SECURITY;

CREATE POLICY table_audit_tenant_isolation ON public.table_status_audit
  FOR SELECT
  USING (tenant_id IN (SELECT tenant_id FROM public.users WHERE id = auth.uid()));

CREATE POLICY table_audit_insert ON public.table_status_audit
  FOR INSERT
  WITH CHECK (tenant_id IN (SELECT tenant_id FROM public.users WHERE id = auth.uid()));

CREATE POLICY table_audit_no_update ON public.table_status_audit
  FOR UPDATE
  USING (false);

CREATE POLICY table_audit_no_delete ON public.table_status_audit
  FOR DELETE
  USING (EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin' AND tenant_id = table_status_audit.tenant_id));

SELECT 'PASO 1 COMPLETADO: Tabla creada exitosamente' as resultado;
