-- =============================================
-- MIGRACIÓN LIMPIA: Transacciones Atómicas
-- =============================================

-- 1. Función de validación de transiciones
CREATE OR REPLACE FUNCTION validate_table_status_transition(
  p_current_status TEXT,
  p_new_status TEXT
)
RETURNS BOOLEAN AS $$
DECLARE
  v_valid_transitions JSONB;
BEGIN
  v_valid_transitions := '{
    "libre": ["ocupada", "pedido_en_curso"],
    "ocupada": ["pedido_en_curso", "libre"],
    "pedido_en_curso": ["cuenta_solicitada", "libre"],
    "cuenta_solicitada": ["pago_confirmado"],
    "pago_confirmado": ["libre"]
  }'::JSONB;
  
  RETURN (v_valid_transitions->p_current_status ? p_new_status);
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- 2. Función de actualización segura de estado
CREATE OR REPLACE FUNCTION update_table_status_safe(
  p_tenant_id UUID,
  p_table_id UUID,
  p_new_status TEXT,
  p_user_id UUID DEFAULT NULL,
  p_reason TEXT DEFAULT NULL,
  p_order_id UUID DEFAULT NULL
)
RETURNS JSONB AS $$
DECLARE
  v_table_number TEXT;
  v_previous_status TEXT;
  v_is_valid BOOLEAN;
  v_result JSONB;
BEGIN
  SELECT number, status INTO v_table_number, v_previous_status
  FROM public.tables
  WHERE id = p_table_id AND tenant_id = p_tenant_id
  FOR UPDATE;
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Mesa no encontrada: %', p_table_id;
  END IF;
  
  v_is_valid := validate_table_status_transition(v_previous_status, p_new_status);
  
  IF NOT v_is_valid THEN
    RAISE EXCEPTION 'Transición de estado no válida: % -> %', v_previous_status, p_new_status;
  END IF;
  
  UPDATE public.tables
  SET status = p_new_status, updated_at = NOW()
  WHERE id = p_table_id AND tenant_id = p_tenant_id;
  
  PERFORM log_table_status_change(
    p_tenant_id,
    p_table_id,
    v_table_number,
    v_previous_status,
    p_new_status,
    COALESCE(p_user_id, auth.uid()),
    COALESCE(p_reason, 'Actualización manual de estado'),
    p_order_id,
    '{}'::JSONB
  );
  
  v_result := jsonb_build_object(
    'success', true,
    'table_id', p_table_id,
    'table_number', v_table_number,
    'previous_status', v_previous_status,
    'new_status', p_new_status,
    'updated_at', NOW()
  );
  
  RETURN v_result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. Función principal de transacción atómica
CREATE OR REPLACE FUNCTION create_order_with_table_update(
  p_tenant_id UUID,
  p_table_id UUID,
  p_order_data JSONB,
  p_order_items JSONB[],
  p_discounts JSONB[] DEFAULT ARRAY[]::JSONB[],
  p_taxes JSONB[] DEFAULT ARRAY[]::JSONB[],
  p_user_id UUID DEFAULT NULL
)
RETURNS JSONB AS $$
DECLARE
  v_order_id UUID;
  v_order_number TEXT;
  v_table_number TEXT;
  v_previous_status TEXT;
  v_new_status TEXT;
  v_item JSONB;
  v_discount JSONB;
  v_tax JSONB;
  v_order_count INTEGER;
  v_result JSONB;
BEGIN
  IF NOT EXISTS (SELECT 1 FROM public.tenants WHERE id = p_tenant_id) THEN
    RAISE EXCEPTION 'Tenant no encontrado: %', p_tenant_id;
  END IF;
  
  SELECT number, status INTO v_table_number, v_previous_status
  FROM public.tables
  WHERE id = p_table_id AND tenant_id = p_tenant_id
  FOR UPDATE;
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Mesa no encontrada: %', p_table_id;
  END IF;
  
  SELECT COUNT(*) INTO v_order_count
  FROM public.orders
  WHERE tenant_id = p_tenant_id;
  
  v_order_number := 'ORD-' || LPAD((v_order_count + 1)::TEXT, 6, '0');
  
  INSERT INTO public.orders (
    tenant_id, table_id, order_number, status, payment_status, source,
    subtotal_cents, discount_total_cents, tax_total_cents, tip_cents,
    service_charge_cents, total_cents, notes, customer_data,
    created_at, updated_at
  ) VALUES (
    p_tenant_id, p_table_id, v_order_number,
    COALESCE((p_order_data->>'status')::TEXT, 'abierto'),
    COALESCE((p_order_data->>'payment_status')::TEXT, 'pendiente'),
    COALESCE((p_order_data->>'source')::TEXT, 'staff'),
    COALESCE((p_order_data->>'subtotal_cents')::INTEGER, 0),
    COALESCE((p_order_data->>'discount_total_cents')::INTEGER, 0),
    COALESCE((p_order_data->>'tax_total_cents')::INTEGER, 0),
    COALESCE((p_order_data->>'tip_cents')::INTEGER, 0),
    COALESCE((p_order_data->>'service_charge_cents')::INTEGER, 0),
    COALESCE((p_order_data->>'total_cents')::INTEGER, 0),
    p_order_data->>'notes',
    p_order_data->'customer_data',
    NOW(), NOW()
  )
  RETURNING id INTO v_order_id;
  
  FOREACH v_item IN ARRAY p_order_items
  LOOP
    INSERT INTO public.order_items (
      order_id, menu_item_id, name, quantity, unit_price_cents,
      total_cents, notes, modifiers, discount, created_at, updated_at
    ) VALUES (
      v_order_id,
      (v_item->>'menu_item_id')::UUID,
      v_item->>'name',
      (v_item->>'quantity')::INTEGER,
      (v_item->>'unit_price_cents')::INTEGER,
      (v_item->>'total_cents')::INTEGER,
      v_item->>'notes',
      v_item->'modifiers',
      v_item->'discount',
      NOW(), NOW()
    );
  END LOOP;
  
  IF array_length(p_discounts, 1) > 0 THEN
    FOREACH v_discount IN ARRAY p_discounts
    LOOP
      INSERT INTO public.order_discounts (
        order_id, type, value, amount_cents, code, reason,
        created_at, updated_at
      ) VALUES (
        v_order_id,
        v_discount->>'type',
        (v_discount->>'value')::NUMERIC,
        (v_discount->>'amount_cents')::INTEGER,
        v_discount->>'code',
        v_discount->>'reason',
        NOW(), NOW()
      );
    END LOOP;
  END IF;
  
  IF array_length(p_taxes, 1) > 0 THEN
    FOREACH v_tax IN ARRAY p_taxes
    LOOP
      INSERT INTO public.order_taxes (
        order_id, code, name, rate, amount_cents,
        created_at, updated_at
      ) VALUES (
        v_order_id,
        v_tax->>'code',
        v_tax->>'name',
        (v_tax->>'rate')::NUMERIC,
        (v_tax->>'amount_cents')::INTEGER,
        NOW(), NOW()
      );
    END LOOP;
  END IF;
  
  IF v_previous_status = 'libre' THEN
    v_new_status := 'pedido_en_curso';
    
    UPDATE public.tables
    SET status = v_new_status, updated_at = NOW()
    WHERE id = p_table_id AND tenant_id = p_tenant_id;
    
    PERFORM log_table_status_change(
      p_tenant_id,
      p_table_id,
      v_table_number,
      v_previous_status,
      v_new_status,
      COALESCE(p_user_id, auth.uid()),
      'Pedido creado automáticamente (transacción atómica)',
      v_order_id,
      jsonb_build_object(
        'order_number', v_order_number,
        'source', p_order_data->>'source',
        'automatic', true
      )
    );
  ELSE
    v_new_status := v_previous_status;
  END IF;
  
  v_result := jsonb_build_object(
    'success', true,
    'order_id', v_order_id,
    'order_number', v_order_number,
    'table_id', p_table_id,
    'table_number', v_table_number,
    'previous_table_status', v_previous_status,
    'new_table_status', v_new_status,
    'table_status_changed', (v_previous_status != v_new_status),
    'created_at', NOW()
  );
  
  RETURN v_result;
EXCEPTION
  WHEN OTHERS THEN
    RAISE EXCEPTION 'Error al crear pedido con actualización de mesa: % (SQLSTATE: %)', 
      SQLERRM, SQLSTATE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 4. Permisos
GRANT EXECUTE ON FUNCTION create_order_with_table_update TO authenticated;
GRANT EXECUTE ON FUNCTION validate_table_status_transition TO authenticated;
GRANT EXECUTE ON FUNCTION update_table_status_safe TO authenticated;

-- 5. Verificación
SELECT 'Migración 2 completada exitosamente!' as status;
