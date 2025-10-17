# 🚀 Instrucciones: Completar Migración de Alertas

**Fase 3 - Sistema de Alertas**  
**Estado Actual:** Código implementado, requiere 2 pasos manuales

---

## ⚠️ IMPORTANTE: Pasos Manuales Requeridos

La implementación del código está **100% completa**, pero necesitas ejecutar 2 comandos/acciones para que el sistema funcione:

---

## 📋 Paso 1: Aplicar Migración en Supabase

### Opción A: Usando Supabase Dashboard (Recomendado)

1. **Abrir Supabase Dashboard**
   - Ve a: https://app.supabase.com
   - Selecciona tu proyecto

2. **Ir al SQL Editor**
   - Sidebar → SQL Editor
   - Click en "New Query"

3. **Copiar y Ejecutar SQL**
   - Abre el archivo: `supabase/migrations/20251016000000_create_alerts_table.sql`
   - Copia **TODO** el contenido (111 líneas)
   - Pega en el editor SQL
   - Click en **"Run"** (o Ctrl+Enter)

4. **Verificar Success**
   ```
   ✅ Success. No rows returned
   ```

5. **Validar Tabla Creada**
   ```sql
   -- Ejecutar esto en SQL Editor
   SELECT * FROM public.alerts LIMIT 1;
   
   -- Debería retornar: "No rows" (tabla vacía pero existe)
   ```

### Opción B: Usando Supabase CLI (Si tienes Docker)

```powershell
# En la raíz del proyecto
npx supabase db push
```

**Nota:** Requiere Docker Desktop instalado y corriendo.

---

## 📋 Paso 2: Regenerar Tipos TypeScript

### Ejecutar Comando

```powershell
# Reemplaza [YOUR_PROJECT_ID] con tu ID de proyecto Supabase
npx supabase gen types typescript --project-id [YOUR_PROJECT_ID] > lib/supabase/database.types.ts
```

### Encontrar tu Project ID

1. **Opción 1:** Supabase Dashboard
   - Settings → General → Reference ID

2. **Opción 2:** .env.local
   ```
   # En tu archivo .env.local busca la URL
   NEXT_PUBLIC_SUPABASE_URL=https://[PROJECT_ID].supabase.co
   ```

3. **Opción 3:** Supabase URL
   - El PROJECT_ID está en la URL de tu proyecto

### Ejemplo Completo

```powershell
# Si tu proyecto es: https://abcdefgh123456.supabase.co
npx supabase gen types typescript --project-id abcdefgh123456 > lib/supabase/database.types.ts
```

### Verificar Tipos Generados

Abre `lib/supabase/database.types.ts` y busca:

```typescript
export type Database = {
  public: {
    Tables: {
      alerts: {  // ← Debe existir
        Row: {
          id: string
          tenant_id: string
          table_id: string
          type: string
          // ...más campos
        }
        // ...
      }
      // ...otras tablas
    }
  }
}
```

---

## 📋 Paso 3: Actualizar Tipos en Código (Opcional)

Una vez regenerados los tipos, puedes actualizar:

### `lib/services/alerts-service.ts`

**Reemplazar líneas 14-32:**
```typescript
// ANTES (tipos temporales)
type Alert = {
  id: string
  tenant_id: string
  // ...
}

// DESPUÉS (tipos oficiales)
import type { Database } from "@/lib/supabase/database.types"

type Alert = Database['public']['Tables']['alerts']['Row']
type AlertInsert = Database['public']['Tables']['alerts']['Insert']
type AlertUpdate = Database['public']['Tables']['alerts']['Update']
```

### `hooks/use-alerts.ts`

**Reemplazar líneas 28-42 (mismo cambio):**
```typescript
// Usar tipos de Database en vez de tipos manuales
import type { Database } from "@/lib/supabase/database.types"

type Alert = Database['public']['Tables']['alerts']['Row']
```

---

## ✅ Paso 4: Testing Manual

### Test 1: Verificar Tabla en Supabase

```sql
-- En Supabase SQL Editor
SELECT 
  table_name, 
  column_name, 
  data_type 
FROM information_schema.columns 
WHERE table_name = 'alerts';
```

**Debe mostrar 10 columnas:**
- id, tenant_id, table_id, type, message
- acknowledged, acknowledged_at, acknowledged_by
- created_at, updated_at

### Test 2: Crear Alerta de Prueba

```sql
-- Reemplaza con IDs válidos de tu base de datos
INSERT INTO public.alerts (tenant_id, table_id, type, message)
VALUES (
  '[TU_TENANT_ID]',
  '[TU_TABLE_ID]',
  'llamar_mozo',
  'Prueba desde SQL'
);

-- Verificar
SELECT * FROM public.alerts ORDER BY created_at DESC LIMIT 1;
```

### Test 3: Verificar RLS (Row Level Security)

```sql
-- Verificar que RLS está habilitado
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE tablename = 'alerts';

-- rowsecurity debe ser 't' (true)
```

```sql
-- Ver policies activas
SELECT policyname, cmd, qual 
FROM pg_policies 
WHERE tablename = 'alerts';

-- Debe mostrar 4 policies:
-- 1. users_can_view_alerts_in_their_tenant (SELECT)
-- 2. users_can_create_alerts_in_their_tenant (INSERT)
-- 3. users_can_update_alerts_in_their_tenant (UPDATE)
-- 4. users_can_delete_alerts_in_their_tenant (DELETE)
```

### Test 4: Probar en la App

1. **Iniciar servidor de desarrollo**
   ```powershell
   npm run dev
   ```

2. **Ir a /alertas**
   - Debería cargar sin errores
   - Mostrará "0 alertas activas requieren atención"

3. **Abrir campana de notificaciones** (header)
   - Badge debería mostrar "0"
   - Dropdown: "No hay alertas activas"

4. **Crear alerta desde QR** (si tienes configurado)
   - Escanear QR code de mesa
   - Click "Llamar Mozo"
   - Debe aparecer en campana
   - Debe aparecer en /alertas

5. **Confirmar alerta**
   - Click "Marcar como atendida"
   - Debe desaparecer de activas
   - Debe aparecer en tab "Historial"

---

## 🔍 Troubleshooting

### Error: "Property 'alerts' does not exist on type..."

**Causa:** Tipos no regenerados después de crear la tabla.

**Solución:**
```powershell
# Regenerar tipos
npx supabase gen types typescript --project-id [ID] > lib/supabase/database.types.ts

# Reiniciar TypeScript server en VS Code
Ctrl+Shift+P → "TypeScript: Restart TS Server"
```

---

### Error: "relation 'alerts' does not exist"

**Causa:** Migration no ejecutada en Supabase.

**Solución:**
1. Ir a Supabase Dashboard → SQL Editor
2. Ejecutar contenido de `20251016000000_create_alerts_table.sql`
3. Verificar con `SELECT * FROM public.alerts;`

---

### Error: "new row violates row-level security policy"

**Causa:** RLS policy no permite el acceso.

**Solución:**
```sql
-- Verificar que el tenant_id en app.tenant_id está configurado
-- En tu código debe haber algo como:
await supabase.rpc('set_tenant_id', { tenant_id: user.tenant_id })
```

---

### Error: "No data returned" al crear alerta

**Causa:** Posiblemente falta configurar tenant_id en sesión.

**Debug:**
```sql
-- Ver configuración actual
SHOW app.tenant_id;

-- Configurar manualmente para testing
SET app.tenant_id = '[TU_TENANT_ID]';

-- Ahora debería funcionar:
SELECT * FROM public.alerts;
```

---

## 📦 Archivos Creados/Modificados

### ✅ Archivos Nuevos
- `supabase/migrations/20251016000000_create_alerts_table.sql`
- `lib/services/alerts-service.ts`
- `hooks/use-alerts.ts`
- `docs/PLAN_FASE_3_COMPONENTES_PENDIENTES.md`
- `docs/FASE_3_PLAN_EJECUTADO.md`
- `docs/INSTRUCCIONES_MIGRACION_ALERTAS.md` (este archivo)

### ✅ Archivos Modificados
- `components/alerts-center.tsx`
- `components/notification-bell.tsx`

---

## 📚 Documentación Adicional

Para más detalles, consulta:

1. **Plan Completo:** `docs/PLAN_FASE_3_COMPONENTES_PENDIENTES.md`
2. **Resumen Ejecutado:** `docs/FASE_3_PLAN_EJECUTADO.md`
3. **API Hook:** Ver JSDoc en `hooks/use-alerts.ts`
4. **Schema DB:** Ver comentarios en migration SQL

---

## ✅ Checklist Final

Marca cuando completes cada paso:

- [ ] ✅ **Paso 1:** Migration aplicada en Supabase
- [ ] ✅ **Paso 2:** Tipos TypeScript regenerados
- [ ] ✅ **Paso 3:** Tipos actualizados en código (opcional)
- [ ] ✅ **Paso 4:** Testing manual completado
- [ ] ✅ **Validación:** Tabla `alerts` existe en Supabase
- [ ] ✅ **Validación:** RLS policies activas (4)
- [ ] ✅ **Validación:** Indexes creados (5)
- [ ] ✅ **Validación:** App carga sin errores
- [ ] ✅ **Validación:** Crear alerta funciona
- [ ] ✅ **Validación:** Confirmar alerta funciona
- [ ] ✅ **Validación:** Real-time con socket funciona

---

## 🎯 Resultado Esperado

Después de completar estos pasos:

✅ Sistema de alertas 100% funcional  
✅ Persistencia en Supabase  
✅ Real-time con socket.io  
✅ Historial de alertas  
✅ Auditoría (quién atendió cada alerta)  
✅ Multi-tenant con RLS  
✅ Type safety completa  

---

## 🆘 ¿Necesitas Ayuda?

Si encuentras problemas:

1. Revisa la sección **Troubleshooting** arriba
2. Verifica logs en consola del navegador (F12)
3. Verifica logs en terminal del servidor
4. Consulta docs de Supabase: https://supabase.com/docs

---

**Última actualización:** 16 de Octubre de 2025  
**Autor:** Sistema de Migración Fase 3
