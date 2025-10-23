# ✅ Checklist de Verificación Pre-Migración

## Archivos de Migración
- [x] 20251017000001_create_table_audit.sql (9,561 bytes)
- [x] 20251017000002_create_atomic_functions.sql (10,985 bytes)

## Servicios TypeScript
- [x] lib/services/audit-service.ts
- [x] lib/business-rules/table-rules.ts

## Archivos Modificados
- [x] lib/services/orders-service.ts (integración completa)
- [x] components/order-form.tsx (validaciones agregadas)

## Estado del Proyecto
- [x] Build exitoso (npm run build)
- [x] Sin errores de compilación
- [x] Commits realizados (2 commits)
- [ ] Migraciones aplicadas en Supabase
- [ ] Sistema probado en desarrollo

---

## 📋 Pasos para Aplicar Migraciones

### PASO 1: Ir a Supabase
1. Abre: https://supabase.com/dashboard
2. Selecciona tu proyecto
3. Ve a "SQL Editor"

### PASO 2: Migración 1 (Tabla de Auditoría)
1. Click en "New query"
2. Abre: `supabase/migrations/20251017000001_create_table_audit.sql`
3. Copia TODO el contenido
4. Pega en Supabase SQL Editor
5. Click en "RUN"
6. Espera mensaje de éxito ✅

### PASO 3: Migración 2 (Funciones RPC)
1. Click en "New query" (nuevo)
2. Abre: `supabase/migrations/20251017000002_create_atomic_functions.sql`
3. Copia TODO el contenido
4. Pega en Supabase SQL Editor
5. Click en "RUN"
6. Espera mensaje de éxito ✅

### PASO 4: Verificar
Ejecuta en SQL Editor:
```sql
SELECT COUNT(*) FROM public.table_status_audit;
```
Debe retornar 0 (tabla vacía pero creada)

### PASO 5: Probar
```powershell
npm run dev
```
1. Ve a http://localhost:3000/pedidos
2. Crea un pedido para una mesa "Libre"
3. Verifica que la mesa cambie a "Pedido en curso"

---

## ✅ Todo listo para aplicar migraciones!
