-- =============================================
-- Migration: Atomic Transaction for Order Creation
-- Description: Función RPC que maneja la creación de pedidos con actualización de mesa en transacción atómica
-- Author: System
-- Date: 2025-10-17
-- =============================================

-- =============================================
-- Función: Crear pedido con actualización atómica de mesa
-- =============================================

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
  -- =============================================
  -- INICIO DE TRANSACCIÓN ATÓMICA
  -- =============================================
  
  -- 1. Validar que el tenant existe
  IF NOT EXISTS (SELECT 1 FROM public.tenants WHERE id = p_tenant_id) THEN
    RAISE EXCEPTION 'Tenant no encontrado: %', p_tenant_id;
  END IF;
  
  -- 2. Validar que la mesa existe y obtener su información
  SELECT number, status INTO v_table_number, v_previous_status
  FROM public.tables
  WHERE id = p_table_id AND tenant_id = p_tenant_id
  FOR UPDATE; -- Lock pesimista para evitar race conditions
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Mesa no encontrada: %', p_table_id;
  END IF;
  
  -- 3. Generar número de orden único
  SELECT COUNT(*) INTO v_order_count
  FROM public.orders
  WHERE tenant_id = p_tenant_id;
  
  v_order_number := 'ORD-' || LPAD((v_order_count + 1)::TEXT, 6, '0');
  
  -- 4. Crear la orden
  INSERT INTO public.orders (
    tenant_id,
    table_id,
    order_number,
    status,
    payment_status,
    source,
    subtotal_cents,
    discount_total_cents,
    tax_total_cents,
    tip_cents,
    service_charge_cents,
    total_cents,
    notes,
    customer_data,
    created_at,
    updated_at
  ) VALUES (
    p_tenant_id,
    p_table_id,
    v_order_number,
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
    NOW(),
    NOW()
  )
  RETURNING id INTO v_order_id;
  
  -- 5. Insertar items del pedido
  FOREACH v_item IN ARRAY p_order_items
  LOOP
    INSERT INTO public.order_items (
      order_id,
      menu_item_id,
      name,
      quantity,
      unit_price_cents,
      total_cents,
      notes,
      modifiers,
      discount,
      created_at,
      updated_at
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
      NOW(),
      NOW()
    );
  END LOOP;
  
  -- 6. Insertar descuentos si existen
  IF array_length(p_discounts, 1) > 0 THEN
    FOREACH v_discount IN ARRAY p_discounts
    LOOP
      INSERT INTO public.order_discounts (
        order_id,
        type,
        value,
        amount_cents,
        code,
        reason,
        created_at,
        updated_at
      ) VALUES (
        v_order_id,
        v_discount->>'type',
        (v_discount->>'value')::NUMERIC,
        (v_discount->>'amount_cents')::INTEGER,
        v_discount->>'code',
        v_discount->>'reason',
        NOW(),
        NOW()
      );
    END LOOP;
  END IF;
  
  -- 7. Insertar impuestos si existen
  IF array_length(p_taxes, 1) > 0 THEN
    FOREACH v_tax IN ARRAY p_taxes
    LOOP
      INSERT INTO public.order_taxes (
        order_id,
        code,
        name,
        rate,
        amount_cents,
        created_at,
        updated_at
      ) VALUES (
        v_order_id,
        v_tax->>'code',
        v_tax->>'name',
        (v_tax->>'rate')::NUMERIC,
        (v_tax->>'amount_cents')::INTEGER,
        NOW(),
        NOW()
      );
    END LOOP;
  END IF;
  
  -- 8. Actualizar estado de la mesa SI está libre
  IF v_previous_status = 'libre' THEN
    v_new_status := 'pedido_en_curso';
    
    UPDATE public.tables
    SET status = v_new_status, updated_at = NOW()
    WHERE id = p_table_id AND tenant_id = p_tenant_id;
    
    -- 9. Registrar cambio en auditoría
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
    v_new_status := v_previous_status; -- Sin cambio
  END IF;
  
  -- 10. Construir respuesta
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
  
  -- =============================================
  -- FIN DE TRANSACCIÓN ATÓMICA
  -- Si llegamos aquí, todo se confirmará (COMMIT)
  -- Si hubo error, se hará ROLLBACK automático
  -- =============================================
  
  RETURN v_result;
  
EXCEPTION
  WHEN OTHERS THEN
    -- Cualquier error causa ROLLBACK automático
    RAISE EXCEPTION 'Error al crear pedido con actualización de mesa: % (SQLSTATE: %)', 
      SQLERRM, SQLSTATE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =============================================
-- Función: Validar transición de estado
-- =============================================

CREATE OR REPLACE FUNCTION validate_table_status_transition(
  p_current_status TEXT,
  p_new_status TEXT
)
RETURNS BOOLEAN AS $$
DECLARE
  v_valid_transitions JSONB;
BEGIN
  -- Definir transiciones válidas
  v_valid_transitions := '{
    "libre": ["ocupada", "pedido_en_curso"],
    "ocupada": ["pedido_en_curso", "libre"],
    "pedido_en_curso": ["cuenta_solicitada", "libre"],
    "cuenta_solicitada": ["pago_confirmado"],
    "pago_confirmado": ["libre"]
  }'::JSONB;
  
  -- Verificar si la transición es válida
  RETURN (
    v_valid_transitions->p_current_status ? p_new_status
  );
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- =============================================
-- Función: Actualizar estado de mesa con validación
-- =============================================

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
  -- Obtener estado actual con lock
  SELECT number, status INTO v_table_number, v_previous_status
  FROM public.tables
  WHERE id = p_table_id AND tenant_id = p_tenant_id
  FOR UPDATE;
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Mesa no encontrada: %', p_table_id;
  END IF;
  
  -- Validar transición
  v_is_valid := validate_table_status_transition(v_previous_status, p_new_status);
  
  IF NOT v_is_valid THEN
    RAISE EXCEPTION 'Transición de estado no válida: % -> %', v_previous_status, p_new_status;
  END IF;
  
  -- Actualizar estado
  UPDATE public.tables
  SET status = p_new_status, updated_at = NOW()
  WHERE id = p_table_id AND tenant_id = p_tenant_id;
  
  -- Registrar en auditoría
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
  
EXCEPTION
  WHEN OTHERS THEN
    RAISE EXCEPTION 'Error al actualizar estado de mesa: %', SQLERRM;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =============================================
-- Grants de permisos
-- =============================================

GRANT EXECUTE ON FUNCTION create_order_with_table_update TO authenticated;
GRANT EXECUTE ON FUNCTION validate_table_status_transition TO authenticated;
GRANT EXECUTE ON FUNCTION update_table_status_safe TO authenticated;

-- =============================================
-- Comentarios de documentación
-- =============================================

COMMENT ON FUNCTION create_order_with_table_update IS 
  'Crea un pedido y actualiza el estado de la mesa en una transacción atómica. ' ||
  'Si ocurre algún error, se hace rollback automático de todos los cambios.';

COMMENT ON FUNCTION validate_table_status_transition IS 
  'Valida si una transición de estado de mesa es permitida según las reglas de negocio.';

COMMENT ON FUNCTION update_table_status_safe IS 
  'Actualiza el estado de una mesa con validación de transición y registro en auditoría.';

-- =============================================
-- Tests de ejemplo
-- =============================================

-- Test 1: Validar transiciones válidas
DO $$
BEGIN
  ASSERT validate_table_status_transition('libre', 'ocupada') = true, 
    'Libre -> Ocupada debe ser válido';
  ASSERT validate_table_status_transition('libre', 'pedido_en_curso') = true, 
    'Libre -> Pedido en curso debe ser válido';
  ASSERT validate_table_status_transition('libre', 'cuenta_solicitada') = false, 
    'Libre -> Cuenta solicitada debe ser inválido';
  
  RAISE NOTICE 'Todos los tests de validación pasaron correctamente';
END $$;
