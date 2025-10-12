# 🚀 Instrucciones para Aplicar Migraciones de Zonas

## ⚠️ IMPORTANTE: Estas migraciones DEBEN aplicarse para que el sistema de zonas funcione

Las migraciones están en: `supabase/migrations/`

---

## 📝 Método 1: Aplicar desde el Dashboard de Supabase (Recomendado)

### Paso 1: Acceder al SQL Editor
1. Ve a tu proyecto en [https://supabase.com/dashboard](https://supabase.com/dashboard)
2. En el menú lateral, haz clic en **"SQL Editor"**
3. Haz clic en **"New query"**

### Paso 2: Aplicar las Migraciones (EN ORDEN)

#### Migración 1: Crear tabla `zones`
```sql
-- Archivo: 20251012000001_create_zones_table.sql
-- Copiar y pegar el contenido completo del archivo
-- Hacer clic en "Run" o presionar Ctrl+Enter
```

#### Migración 2: Modificar tabla `tables`
```sql
-- Archivo: 20251012000002_modify_tables_structure.sql
-- Copiar y pegar el contenido completo del archivo
-- Hacer clic en "Run" o presionar Ctrl+Enter
```

#### Migración 3: Seed de zonas por defecto
```sql
-- Archivo: 20251012000003_seed_default_zones.sql
-- Copiar y pegar el contenido completo del archivo
-- Hacer clic en "Run" o presionar Ctrl+Enter
```

### Paso 3: Verificar
Ejecuta esta query para verificar que todo funcionó:
```sql
-- Verificar que la tabla zones existe
SELECT * FROM zones LIMIT 5;

-- Verificar que la tabla tables tiene las nuevas columnas
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'tables' 
AND column_name IN ('number', 'zone_id');
```

**Resultado esperado:**
- `zones`: Debería mostrar 5 zonas por defecto (Salón Principal, Terraza, Patio, Bar, VIP)
- `tables`: `number` debería ser `text` y `zone_id` debería ser `uuid`

---

## 📝 Método 2: Usar psql (Si tienes PostgreSQL CLI)

```bash
# Obtener tu connection string desde Supabase Dashboard → Project Settings → Database
# Formato: postgresql://postgres:[PASSWORD]@[HOST]:[PORT]/postgres

# Aplicar cada migración en orden
psql "tu_connection_string" -f supabase/migrations/20251012000001_create_zones_table.sql
psql "tu_connection_string" -f supabase/migrations/20251012000002_modify_tables_structure.sql
psql "tu_connection_string" -f supabase/migrations/20251012000003_seed_default_zones.sql
```

---

## 📝 Método 3: Instalar Supabase CLI (Para el futuro)

### Windows (PowerShell):
```powershell
# Usando Scoop
scoop bucket add supabase https://github.com/supabase/scoop-bucket.git
scoop install supabase

# O usando npm
npm install -g supabase
```

### Una vez instalado:
```bash
# Login
supabase login

# Link al proyecto
supabase link --project-ref your-project-ref

# Aplicar migraciones
supabase db push
```

---

## ✅ Checklist Post-Migración

Después de aplicar las migraciones, verifica:

- [ ] La tabla `zones` existe
- [ ] Hay 5 zonas por defecto creadas
- [ ] La tabla `tables` tiene campo `number` como TEXT
- [ ] La tabla `tables` tiene campo `zone_id` como UUID
- [ ] El trigger `create_default_zones_trigger` existe
- [ ] Las políticas RLS están activas en `zones`

### Query de Verificación Completa:
```sql
-- 1. Contar zonas
SELECT COUNT(*) as total_zones FROM zones;

-- 2. Ver estructura de tables
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'tables'
ORDER BY ordinal_position;

-- 3. Verificar trigger
SELECT trigger_name, event_manipulation, event_object_table
FROM information_schema.triggers
WHERE trigger_name = 'create_default_zones_trigger';

-- 4. Verificar RLS policies
SELECT schemaname, tablename, policyname
FROM pg_policies
WHERE tablename = 'zones';
```

---

## 🐛 Troubleshooting

### Error: "relation zones does not exist"
**Solución:** La migración 1 no se aplicó correctamente. Ejecutarla de nuevo.

### Error: "column zone_id does not exist"
**Solución:** La migración 2 no se aplicó correctamente. Ejecutarla de nuevo.

### Error: "duplicate key value violates unique constraint"
**Solución:** Ya existe una zona con ese nombre. Esto es normal si ejecutaste la migración 3 varias veces.

### Las zonas no aparecen en el dropdown
**Solución:** 
1. Verifica que tu usuario tenga un `tenant_id` asignado
2. Verifica las RLS policies
3. Revisa los logs del navegador (F12 → Console)

---

## 📞 Después de Aplicar las Migraciones

1. **Reinicia el servidor de desarrollo:**
   ```bash
   # Presiona Ctrl+C en la terminal donde corre npm run dev
   # Luego ejecuta de nuevo:
   npm run dev
   ```

2. **Recarga la página de Mesas**

3. **Prueba crear una zona:**
   - Ve a Mesas
   - Click en "Crear Zona"
   - Completa el formulario
   - Click en "Crear Zona"

4. **Prueba crear una mesa:**
   - Click en "Agregar Mesa"
   - El dropdown de zonas debería mostrar las zonas disponibles
   - Completa el formulario
   - Click en "Crear Mesa"

---

## 📄 Contenido de las Migraciones

Si necesitas ver el contenido exacto de cada migración, están en:

- `supabase/migrations/20251012000001_create_zones_table.sql`
- `supabase/migrations/20251012000002_modify_tables_structure.sql`
- `supabase/migrations/20251012000003_seed_default_zones.sql`

Puedes abrirlos con cualquier editor de texto y copiar el contenido completo al SQL Editor de Supabase.
