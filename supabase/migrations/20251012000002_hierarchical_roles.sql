-- ============================================
-- MIGRACIÓN: Sistema Jerárquico Admin/Staff
-- ============================================
-- Fecha: 2025-10-12
-- Descripción: Agrega campo created_by_admin_id y políticas RLS jerárquicas

-- ============================================
-- 1. AGREGAR CAMPO PARA JERARQUÍA
-- ============================================

-- Agregar columna para vincular staff con su admin creador
ALTER TABLE users ADD COLUMN IF NOT EXISTS created_by_admin_id UUID REFERENCES users(id) ON DELETE SET NULL;

-- Index para mejorar queries de jerarquía
CREATE INDEX IF NOT EXISTS idx_users_created_by_admin ON users(created_by_admin_id);

-- Comentarios
COMMENT ON COLUMN users.created_by_admin_id IS 'ID del admin que creó este usuario (solo para role=staff)';

-- ============================================
-- 2. FUNCIÓN HELPER PARA OBTENER ROL ACTUAL
-- ============================================

-- Función para obtener el rol del usuario actual
CREATE OR REPLACE FUNCTION current_user_role()
RETURNS TEXT AS $$
BEGIN
  RETURN (
    SELECT role
    FROM users
    WHERE id = auth.uid()
    LIMIT 1
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Función para verificar si el usuario actual es admin
CREATE OR REPLACE FUNCTION is_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN (current_user_role() = 'admin');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Función para verificar si el usuario actual es staff
CREATE OR REPLACE FUNCTION is_staff()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN (current_user_role() = 'staff');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- 3. ELIMINAR POLÍTICAS ANTERIORES DE USERS
-- ============================================

DROP POLICY IF EXISTS users_isolation_policy ON users;

-- ============================================
-- 4. POLÍTICAS RLS JERÁRQUICAS PARA USERS
-- ============================================

-- 4.1 Política de LECTURA (SELECT)
-- Admin: puede ver todos los usuarios de su tenant
-- Staff: solo puede ver su propio perfil y el de su admin creador
CREATE POLICY users_read_policy ON users
  FOR SELECT
  USING (
    -- Usuarios del mismo tenant
    tenant_id = current_tenant_id() AND (
      -- Admin puede ver todos
      is_admin() OR
      -- Staff solo puede ver su perfil y el de su admin
      (is_staff() AND (id = auth.uid() OR id = (
        SELECT created_by_admin_id FROM users WHERE id = auth.uid()
      )))
    )
  );

-- 4.2 Política de INSERCIÓN (INSERT)
-- Solo admin puede crear usuarios staff
CREATE POLICY users_insert_policy ON users
  FOR INSERT
  WITH CHECK (
    tenant_id = current_tenant_id() AND (
      -- El usuario que crea debe ser admin
      is_admin() AND
      -- Si está creando un staff, debe vincular created_by_admin_id
      (
        (role = 'staff' AND created_by_admin_id = auth.uid()) OR
        (role = 'admin' AND created_by_admin_id IS NULL)
      )
    )
  );

-- 4.3 Política de ACTUALIZACIÓN (UPDATE)
-- Admin: puede actualizar cualquier usuario de su tenant
-- Staff: solo puede actualizar su propio perfil (campos limitados)
CREATE POLICY users_update_policy ON users
  FOR UPDATE
  USING (
    tenant_id = current_tenant_id() AND (
      -- Admin puede actualizar todos
      is_admin() OR
      -- Staff solo puede actualizar su propio perfil
      (is_staff() AND id = auth.uid())
    )
  )
  WITH CHECK (
    tenant_id = current_tenant_id() AND (
      -- Admin puede actualizar todos
      is_admin() OR
      -- Staff solo puede actualizar su propio perfil y no puede cambiar su rol
      (is_staff() AND id = auth.uid() AND role = 'staff')
    )
  );

-- 4.4 Política de ELIMINACIÓN (DELETE)
-- Solo admin puede eliminar usuarios
CREATE POLICY users_delete_policy ON users
  FOR DELETE
  USING (
    tenant_id = current_tenant_id() AND
    is_admin() AND
    -- No se puede eliminar a sí mismo
    id != auth.uid()
  );

-- ============================================
-- 5. TRIGGER PARA VALIDAR JERARQUÍA
-- ============================================

-- Función para validar que staff tenga created_by_admin_id
CREATE OR REPLACE FUNCTION validate_user_hierarchy()
RETURNS TRIGGER AS $$
BEGIN
  -- Si es staff, debe tener created_by_admin_id
  IF NEW.role = 'staff' THEN
    IF NEW.created_by_admin_id IS NULL THEN
      RAISE EXCEPTION 'Los usuarios staff deben tener un admin creador (created_by_admin_id)';
    END IF;
    
    -- Verificar que el admin creador existe y es realmente admin
    IF NOT EXISTS (
      SELECT 1 FROM users 
      WHERE id = NEW.created_by_admin_id 
        AND role = 'admin' 
        AND tenant_id = NEW.tenant_id
    ) THEN
      RAISE EXCEPTION 'El created_by_admin_id debe ser un usuario admin válido del mismo tenant';
    END IF;
  END IF;
  
  -- Si es admin, no debe tener created_by_admin_id
  IF NEW.role = 'admin' THEN
    NEW.created_by_admin_id := NULL;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Aplicar trigger
DROP TRIGGER IF EXISTS trigger_validate_user_hierarchy ON users;
CREATE TRIGGER trigger_validate_user_hierarchy
  BEFORE INSERT OR UPDATE ON users
  FOR EACH ROW
  EXECUTE FUNCTION validate_user_hierarchy();

-- ============================================
-- 6. FUNCIÓN RPC PARA CREAR STAFF (ADMIN ONLY)
-- ============================================

-- Eliminar función anterior si existe (con cualquier firma)
DROP FUNCTION IF EXISTS create_staff_user(TEXT, TEXT, TEXT);
DROP FUNCTION IF EXISTS create_staff_user;

-- Función para que admin cree usuarios staff
CREATE OR REPLACE FUNCTION create_staff_user(
  p_email TEXT,
  p_name TEXT,
  p_password TEXT
)
RETURNS JSON AS $$
DECLARE
  v_user_id UUID;
  v_tenant_id UUID;
  v_admin_id UUID;
  v_result JSON;
BEGIN
  -- Obtener admin actual
  v_admin_id := auth.uid();
  
  -- Verificar que el usuario actual es admin
  IF NOT is_admin() THEN
    RAISE EXCEPTION 'Solo los administradores pueden crear usuarios staff';
  END IF;
  
  -- Obtener tenant del admin
  SELECT tenant_id INTO v_tenant_id
  FROM users
  WHERE id = v_admin_id;
  
  -- Verificar que el email no exista
  IF EXISTS (SELECT 1 FROM users WHERE email = p_email) THEN
    RAISE EXCEPTION 'El email ya está registrado';
  END IF;
  
  -- Generar UUID para el nuevo usuario
  v_user_id := gen_random_uuid();
  
  -- Crear usuario en auth (esto debe hacerse desde el backend con service role)
  -- Por ahora solo creamos en la tabla users
  -- El backend debe crear el usuario en auth.users usando admin.createUser()
  
  -- Crear en tabla users
  INSERT INTO users (
    id,
    tenant_id,
    email,
    password_hash,
    name,
    role,
    created_by_admin_id,
    active
  ) VALUES (
    v_user_id,
    v_tenant_id,
    p_email,
    crypt(p_password, gen_salt('bf')), -- Hash del password
    p_name,
    'staff',
    v_admin_id,
    true
  );
  
  -- Retornar resultado
  SELECT json_build_object(
    'id', v_user_id,
    'email', p_email,
    'name', p_name,
    'role', 'staff',
    'created_by_admin_id', v_admin_id
  ) INTO v_result;
  
  RETURN v_result;
  
EXCEPTION
  WHEN OTHERS THEN
    RAISE EXCEPTION 'Error al crear usuario staff: %', SQLERRM;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Comentarios
COMMENT ON FUNCTION create_staff_user(TEXT, TEXT, TEXT) IS 'Función para que admin cree usuarios staff (requiere complemento en backend para auth.users)';

-- ============================================
-- 7. VISTA PARA ADMIN: STAFF BAJO SU CONTROL
-- ============================================

-- Eliminar vista anterior si existe
DROP VIEW IF EXISTS v_admin_staff;

CREATE OR REPLACE VIEW v_admin_staff AS
SELECT 
  u.id,
  u.email,
  u.name,
  u.role,
  u.active,
  u.created_at,
  u.created_by_admin_id,
  a.name AS admin_name,
  a.email AS admin_email
FROM users u
LEFT JOIN users a ON u.created_by_admin_id = a.id
WHERE 
  u.role = 'staff' AND
  u.tenant_id = current_tenant_id() AND
  (
    -- Si es admin, ver todos los staff de su tenant
    is_admin() OR
    -- Si es staff, no puede ver esta vista
    FALSE
  );

-- Comentarios
COMMENT ON VIEW v_admin_staff IS 'Vista para admin: lista de usuarios staff bajo su control';

-- ============================================
-- RESUMEN DE LA MIGRACIÓN
-- ============================================

-- 1. ✅ Campo created_by_admin_id agregado
-- 2. ✅ Funciones helper para roles (is_admin, is_staff)
-- 3. ✅ Políticas RLS jerárquicas implementadas
-- 4. ✅ Trigger de validación de jerarquía
-- 5. ✅ Función RPC para crear staff (create_staff_user)
-- 6. ✅ Vista para admin (v_admin_staff)

-- SIGUIENTE PASO: Implementar endpoints en /api/auth/staff
