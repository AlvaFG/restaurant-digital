# ⚡ Scripts SQL - Troubleshooting

> Scripts SQL útiles para troubleshooting de RLS y otras operaciones de base de datos

---

## 1. Deshabilitar RLS (Temporal - Solo Dev/Testing)

### Tabla `zones`
```sql
ALTER TABLE zones DISABLE ROW LEVEL SECURITY;
```

### Tabla `tables`
```sql
ALTER TABLE tables DISABLE ROW LEVEL SECURITY;
```

### Todas las tablas (bulk)
```sql
ALTER TABLE zones DISABLE ROW LEVEL SECURITY;
ALTER TABLE tables DISABLE ROW LEVEL SECURITY;
ALTER TABLE orders DISABLE ROW LEVEL SECURITY;
ALTER TABLE order_items DISABLE ROW LEVEL SECURITY;
ALTER TABLE menu_items DISABLE ROW LEVEL SECURITY;
```

**⚠️ Advertencia:** Solo usar en dev/testing. Nunca en producción.

**Después:** Crear políticas RLS correctas y re-habilitar con `ENABLE ROW LEVEL SECURITY`

---

## 2. Re-habilitar RLS
```sql
ALTER TABLE zones ENABLE ROW LEVEL SECURITY;
ALTER TABLE tables ENABLE ROW LEVEL SECURITY;
```

---

## 3. Verificar Estado de RLS
```sql
SELECT 
  schemaname,
  tablename,
  rowsecurity
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY tablename;
```

**Output:**
- `rowsecurity = true`: RLS habilitado
- `rowsecurity = false`: RLS deshabilitado

---

## 4. Ver Políticas RLS Activas
```sql
SELECT
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies
WHERE schemaname = 'public'
ORDER BY tablename, policyname;
```

---

## 5. Limpiar Datos de Testing
```sql
-- ⚠️ CUIDADO: Esto borra todos los datos

-- Borrar en orden (respetando foreign keys)
DELETE FROM order_items;
DELETE FROM orders;
DELETE FROM tables;
DELETE FROM zones;
DELETE FROM menu_items;
DELETE FROM categories;

-- Resetear sequences
ALTER SEQUENCE zones_id_seq RESTART WITH 1;
ALTER SEQUENCE tables_id_seq RESTART WITH 1;
```

---

## 6. Ver Foreign Keys
```sql
SELECT
  tc.table_name,
  kcu.column_name,
  ccu.table_name AS foreign_table_name,
  ccu.column_name AS foreign_column_name
FROM information_schema.table_constraints AS tc
JOIN information_schema.key_column_usage AS kcu
  ON tc.constraint_name = kcu.constraint_name
JOIN information_schema.constraint_column_usage AS ccu
  ON ccu.constraint_name = tc.constraint_name
WHERE tc.constraint_type = 'FOREIGN KEY'
  AND tc.table_schema = 'public'
ORDER BY tc.table_name, kcu.column_name;
```

---

## 7. Backup de Datos (Export)
```sql
-- Exportar zonas
SELECT * FROM zones;

-- Exportar mesas
SELECT * FROM tables;

-- Exportar pedidos
SELECT * FROM orders;
```

Copiar el resultado y guardar como backup.

---

## 8. Ver Tamaño de Tablas
```sql
SELECT
  schemaname,
  tablename,
  pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) AS size
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;
```

---

## 9. Ver Índices
```sql
SELECT
  schemaname,
  tablename,
  indexname,
  indexdef
FROM pg_indexes
WHERE schemaname = 'public'
ORDER BY tablename, indexname;
```

---

## 10. Limpiar Cache de Supabase
```sql
-- Terminar conexiones idle
SELECT pg_terminate_backend(pid)
FROM pg_stat_activity
WHERE state = 'idle'
  AND query != '<IDLE>'
  AND usename = current_user;
```

---

## 📝 Uso Común

### Problema: "new row violates row-level security policy"

**Causa:** RLS bloqueando INSERT/UPDATE

**Solución temporal:**
```sql
ALTER TABLE [nombre_tabla] DISABLE ROW LEVEL SECURITY;
```

**Solución correcta:**
1. Crear política RLS adecuada
2. Verificar con `SELECT * FROM pg_policies WHERE tablename = '[nombre_tabla]'`
3. Re-habilitar RLS

---

### Problema: Foreign key constraint violation

**Causa:** Intentando borrar registro con dependencias

**Solución:**
1. Ver foreign keys con query #6
2. Borrar en orden inverso (hijos primero)
3. O usar `CASCADE`: `DELETE FROM zones CASCADE;`

---

## ⚠️ Advertencias

- **Nunca** ejecutar `DISABLE RLS` en producción
- **Siempre** hacer backup antes de `DELETE`
- **Cuidado** con `CASCADE` - puede borrar más de lo esperado
- **Testing:** Probar en dev/staging primero

---

**Última actualización:** Noviembre 3, 2025  
**Mantenedor:** DevOps / Backend Lead
