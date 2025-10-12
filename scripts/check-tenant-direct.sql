-- ============================================
-- Script: Verificar y crear tenant faltante
-- Ejecutar en Supabase SQL Editor
-- ============================================

-- 1. Verificar si el tenant existe
SELECT 
  id, 
  name, 
  slug, 
  settings,
  created_at
FROM tenants 
WHERE id = '46824e99-1d3f-4a13-8e96-17797f6149af';

-- Si el resultado es vacío, ejecutar el siguiente INSERT:

-- 2. Crear el tenant (si no existe)
INSERT INTO tenants (id, name, slug, settings, created_at, updated_at)
VALUES (
  '46824e99-1d3f-4a13-8e96-17797f6149af',
  'Mi Restaurante',
  'mi-restaurante',
  '{
    "logoUrl": null,
    "theme": {
      "accentColor": "#3b82f6"
    },
    "features": {
      "tablets": true,
      "kds": true,
      "payments": true
    }
  }'::jsonb,
  NOW(),
  NOW()
)
ON CONFLICT (id) DO NOTHING;

-- 3. Verificar que se creó correctamente
SELECT 
  id, 
  name, 
  slug, 
  settings,
  created_at
FROM tenants 
WHERE id = '46824e99-1d3f-4a13-8e96-17797f6149af';

-- 4. Verificar la relación con el usuario
SELECT 
  u.id as user_id,
  u.email,
  u.tenant_id,
  t.name as tenant_name,
  t.slug as tenant_slug
FROM users u
LEFT JOIN tenants t ON u.tenant_id = t.id
WHERE u.id = 'f46e1868-1b50-422c-b4d9-1eae1e6c6f1d';
