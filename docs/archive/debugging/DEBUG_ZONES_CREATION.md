# 🔍 Debug: Creación de Zonas No Funciona

**Fecha**: Octubre 16, 2025, 8:30 PM  
**Síntoma**: Botón "Guardando..." aparece 1 segundo y desaparece, pero no se crea la zona  
**Objetivo**: Identificar por qué no se guarda en Supabase y no aparece en el selector

---

## 🎯 Plan de Análisis (7 Posibilidades)

### 1. ❓ Frontend no llama al API correctamente
- **Qué revisar**: Componente que maneja el formulario de crear zona
- **Archivos**: `components/zones-management.tsx`, `components/create-zone-dialog.tsx`
- **Buscar**:
  - ¿Hace POST a `/api/zones`?
  - ¿Envía el body correcto `{ name }`?
  - ¿Maneja la respuesta?
  - ¿Actualiza el estado local después de crear?

### 2. ❓ API recibe la petición pero falla silenciosamente
- **Qué revisar**: Logs del servidor
- **Verificar**:
  - ¿Llega el POST a `/api/zones`?
  - ¿Qué imprime el console.log?
  - ¿Hay errores en try/catch?

### 3. ❓ Error de autenticación (no hay tenant_id)
- **Qué revisar**: `getCurrentUser()` en el API
- **Verificar**:
  - ¿El usuario tiene `tenant_id` en metadata?
  - ¿Se extrae correctamente con `getTenantIdFromUser()`?
  - ¿Falla la validación y retorna 403?

### 4. ❓ zones-service.createZone() falla en Supabase
- **Qué revisar**: `lib/services/zones-service.ts`
- **Verificar**:
  - ¿El insert a Supabase funciona?
  - ¿Hay error de permisos RLS?
  - ¿Error de schema (campos faltantes)?

### 5. ❓ API responde con error pero frontend no lo muestra
- **Qué revisar**: Manejo de errores en frontend
- **Verificar**:
  - ¿El componente muestra errores?
  - ¿Hay try/catch que los capture?
  - ¿Console.error en frontend?

### 6. ❓ Zona se crea pero no se actualiza la lista
- **Qué revisar**: Estado y fetching en frontend
- **Verificar**:
  - ¿Se hace refetch después de crear?
  - ¿El estado local se actualiza?
  - ¿El selector de zonas consulta la misma fuente?

### 7. ❓ Selector de zonas usa otra fuente de datos
- **Qué revisar**: Componente "Agregar mesa"
- **Verificar**:
  - ¿Obtiene zonas desde `/api/zones`?
  - ¿O usa un store local legacy?
  - ¿Filtra por tenant_id?

---

## 🔍 Proceso de Debug (Paso a Paso)

### Paso 1: Ver logs del servidor (AHORA)
```bash
# Terminal donde corre npm run dev
# Buscar líneas que digan:
# [GET /api/zones]
# [POST /api/zones]
```

**Objetivo**: Confirmar si llega la petición al API

---

### Paso 2: Encontrar componente de crear zona
```bash
grep -r "Crear zona" components/
grep -r "createZone" components/
```

**Objetivo**: Identificar qué componente maneja el formulario

---

### Paso 3: Revisar código del componente
- ¿Hace fetch/axios a `/api/zones`?
- ¿Qué hace con la respuesta?
- ¿Tiene manejo de errores?

---

### Paso 4: Agregar logs en el API
```typescript
// En app/api/zones/route.ts POST
console.log('[POST /api/zones] INICIO - Body recibido:', body)
console.log('[POST /api/zones] Tenant ID:', tenantId)
console.log('[POST /api/zones] Llamando createZone...')
console.log('[POST /api/zones] Resultado:', { zone, error })
```

---

### Paso 5: Agregar logs en zones-service
```typescript
// En lib/services/zones-service.ts createZone
console.log('[zones-service] createZone INICIO:', { input, tenantId })
console.log('[zones-service] Insert data:', insertData)
console.log('[zones-service] Resultado Supabase:', { data, error })
```

---

### Paso 6: Verificar RLS en Supabase
- Ir a Supabase Dashboard
- Tabla `zones`
- Verificar políticas RLS
- ¿Permite INSERT con tenant_id?

---

### Paso 7: Ver datos en Supabase
- Abrir tabla `zones` en Supabase
- ¿Se creó algún registro?
- ¿Qué tenant_id tiene?

---

## 📋 Checklist de Verificación

### Frontend
- [ ] Componente hace POST a `/api/zones`
- [ ] Envía `{ name: "999" }` en body
- [ ] Tiene try/catch y muestra errores
- [ ] Actualiza lista después de crear
- [ ] Cierra el modal después de crear

### API
- [ ] Recibe POST en `/api/zones`
- [ ] Extrae `tenant_id` correctamente
- [ ] Llama a `createZone()` del servicio
- [ ] Maneja errores y los retorna
- [ ] Retorna status 201 con `{ data: zone }`

### Servicio Supabase
- [ ] `createZone()` hace insert correcto
- [ ] Incluye `tenant_id` en el insert
- [ ] Retorna `{ data, error }` correctamente
- [ ] No hay errores de schema

### Base de Datos
- [ ] Tabla `zones` existe
- [ ] RLS permite INSERT
- [ ] Tenant_id es correcto
- [ ] Datos se guardan

### Selector de Zonas
- [ ] Componente de agregar mesa existe
- [ ] Obtiene zonas desde `/api/zones`
- [ ] Filtra por tenant_id
- [ ] Muestra zonas creadas

---

## 🚀 Acciones Inmediatas

1. **Revisar logs del servidor** (terminal npm run dev)
2. **Buscar componente de crear zona**
3. **Leer código del componente**
4. **Agregar logs de debug**
5. **Intentar crear zona nuevamente**
6. **Revisar Supabase Dashboard**

---

**Estado**: 🔴 INICIANDO DEBUG  
**Prioridad**: 🔥 ALTA (Bloqueante para testing)
