# 🔍 Auditoría de Código - Fase 5.1

**Fecha**: Octubre 16, 2025  
**Objetivo**: Identificar archivos legacy y referencias a stores locales  
**Estado**: 🟡 EN PROGRESO

---

## 📊 Resumen Ejecutivo

### Hallazgos Principales

✅ **BUENO**: Los servicios nuevos (`lib/services/`) usan Supabase  
⚠️ **ATENCIÓN**: Existen stores legacy en `lib/server/` que aún se usan en algunos lugares  
⚠️ **ATENCIÓN**: Archivos en `data/` contienen JSON stores (posible legacy)  
✅ **BUENO**: No se encontró uso de localStorage/sessionStorage en servicios

---

## 🗂️ Archivos Legacy Identificados

### 1. Stores Locales (lib/server/)

#### ❌ Archivos Legacy a Eliminar

| Archivo | Tamaño | Uso Actual | Acción |
|---------|--------|------------|--------|
| `lib/server/table-store.ts` | ~500 líneas | ⚠️ Usado en tests y qr-service | MIGRAR → Supabase |
| `lib/server/order-store.ts` | ~800 líneas | ⚠️ Usado en tipos y tests | MIGRAR → Supabase |
| `lib/server/menu-store.ts` | ~400 líneas | ⚠️ Usado en mock-data | MIGRAR → Supabase |
| `lib/server/payment-store.ts` | ~300 líneas | ❓ Revisar uso | EVALUAR |
| `lib/server/zones-store.ts` | ~200 líneas | ❓ Revisar uso | EVALUAR |
| `lib/server/session-store.ts` | ~250 líneas | ✅ Puede ser útil (caché) | MANTENER |

**Total a migrar**: ~2,200 líneas de código legacy

#### Referencias Encontradas

```typescript
// lib/services/tables-service.ts
// ✅ Comenta que reemplaza a table-store
/**
 * Reemplaza completamente a lib/server/table-store.ts
 */

// lib/services/orders-service.ts
// ✅ Comenta que reemplaza a order-store
/**
 * Reemplaza completamente a lib/server/order-store.ts
 */

// lib/services/menu-service.ts
// ✅ Comenta que reemplaza a menu-store
/**
 * Reemplaza completamente a lib/server/menu-store.ts
 */
```

**Análisis**: Los servicios nuevos **YA REEMPLAZAN** a los stores legacy, pero los archivos legacy aún existen.

---

### 2. Data Files (data/)

#### Archivos JSON Encontrados

```
data/
├── table-store.json    ⚠️ Store local (posible legacy)
└── __test__/           ✅ Tests (mantener)
```

**Análisis**: 
- `table-store.json` parece ser data legacy
- Necesita verificar si se usa en producción
- Probablemente solo para desarrollo/tests

---

### 3. Archivos que Referencian Stores Legacy

#### Alta Prioridad (Producción)

```typescript
// ⚠️ lib/server/qr-service.ts
import { getTableById, updateTableQR } from './table-store';
// PROBLEMA: QR service usa store legacy en vez de Supabase

// ⚠️ lib/server/order-store.ts
import { getMenuItemsSnapshot } from "./menu-store"
import { getTableById, updateTableState } from "./table-store"
// PROBLEMA: Order store importa otros stores legacy

// ⚠️ lib/mock-data.ts
const { getMenuItemsSnapshot } = await import("@/lib/server/menu-store")
// PROBLEMA: Mock data usa store legacy (puede ser OK para desarrollo)
```

#### Media Prioridad (Tests)

```typescript
// ✅ lib/__tests__/table-store.test.ts
// ✅ lib/server/__tests__/qr-service.test.ts
// ✅ lib/server/__tests__/socket-payloads.test.ts
```

**Análisis**: Tests pueden mantener referencias para validar compatibilidad.

#### Baja Prioridad (Tipos)

```typescript
// ✅ lib/server/socket-payloads.ts
import type { OrdersSummary } from "@/lib/server/order-store"

// ✅ lib/order-service.ts
import type { OrdersSummary } from "@/lib/server/order-store"

// ✅ app/pedidos/_hooks/use-orders-panel.ts
import type { OrdersSummary } from "@/lib/server/order-store"
```

**Análisis**: Solo importan tipos, no lógica. Puede mantenerse o migrar tipos a `/types`.

---

## 🎯 Plan de Acción

### Prioridad CRÍTICA

#### 1. Migrar `qr-service.ts` a Supabase ⚠️

**Archivo**: `lib/server/qr-service.ts`

**Problema**: Usa `table-store` legacy  
**Solución**: Usar `tables-service.ts` de Supabase

```typescript
// ❌ ANTES (legacy)
import { getTableById, updateTableQR } from './table-store';

// ✅ DESPUÉS (Supabase)
import { getTableById, updateTable } from '@/lib/services/tables-service';
```

**Impacto**: Alto - QR functionality es core feature  
**Esfuerzo**: 1h  
**Riesgo**: Medio - Requiere testing cuidadoso

---

#### 2. Revisar `payment-store.ts` y `zones-store.ts` ⚠️

**Archivos**:
- `lib/server/payment-store.ts`
- `lib/server/zones-store.ts`

**Acción**: Verificar si tienen equivalentes en `lib/services/`

**Posibles resultados**:
- ✅ Ya migrados → Eliminar legacy
- ⚠️ Parcialmente migrados → Completar migración
- ❌ No migrados → Migrar a Supabase

**Esfuerzo**: 30min verificación + 1-2h migración si necesario

---

### Prioridad ALTA

#### 3. Eliminar Archivos Legacy Confirmados 🗑️

**Una vez verificado que services/ los reemplazan**:

```bash
# Archivos a eliminar (DESPUÉS de verificar)
rm lib/server/table-store.ts
rm lib/server/order-store.ts
rm lib/server/menu-store.ts
rm data/table-store.json  # Si no se usa
```

**Pre-requisitos**:
1. ✅ Verificar que `lib/services/` tiene toda la funcionalidad
2. ✅ Migrar `qr-service.ts`
3. ✅ Actualizar imports en archivos que los referencian
4. ✅ Ejecutar tests para verificar

**Esfuerzo**: 2h  
**Riesgo**: Bajo (con testing adecuado)

---

#### 4. Migrar Tipos a `/types` 📝

**Problema**: Tipos definidos en stores legacy

**Solución**: Mover tipos a directorio centralizado

```typescript
// Crear lib/types/orders.ts
export type OrdersSummary = {
  // ... tipos de order-store
}

// Actualizar imports
// ❌ ANTES
import type { OrdersSummary } from "@/lib/server/order-store"

// ✅ DESPUÉS
import type { OrdersSummary } from "@/lib/types/orders"
```

**Archivos afectados**: ~5 archivos  
**Esfuerzo**: 1h  
**Riesgo**: Muy bajo

---

### Prioridad MEDIA

#### 5. Revisar `session-store.ts` y `session-manager.ts` 🔍

**Archivos**:
- `lib/server/session-store.ts`
- `lib/server/session-manager.ts`

**Análisis**: Podrían ser útiles como caché en memoria

**Opciones**:
- ✅ Mantener si implementan caché útil
- ⚠️ Migrar a Redis/Upstash si es caché distribuido
- ❌ Eliminar si Supabase tiene sesiones

**Acción**: Evaluar funcionalidad  
**Esfuerzo**: 30min

---

#### 6. Limpiar `mock-data.ts` 🧹

**Archivo**: `lib/mock-data.ts`

**Problema**: Usa `menu-store` legacy

**Solución**: 
- Si es solo para desarrollo → OK mantener
- Si se usa en producción → Migrar a Supabase
- Considerar usar Supabase seeding en vez de mocks

**Esfuerzo**: 30min  
**Riesgo**: Bajo

---

## 📋 Checklist de Verificación

### Verificar Servicios Usan Supabase

- [x] `lib/services/tables-service.ts` → ✅ Usa Supabase
- [x] `lib/services/orders-service.ts` → ✅ Usa Supabase
- [x] `lib/services/menu-service.ts` → ✅ Usa Supabase
- [ ] `lib/services/zones-service.ts` → ❓ Verificar existe
- [ ] `lib/services/payments-service.ts` → ❓ Verificar existe
- [ ] `lib/services/sessions-service.ts` → ❓ Verificar existe

### Archivos a Migrar/Eliminar

- [ ] `lib/server/qr-service.ts` → Migrar a Supabase
- [ ] `lib/server/table-store.ts` → Eliminar (reemplazado)
- [ ] `lib/server/order-store.ts` → Eliminar (reemplazado)
- [ ] `lib/server/menu-store.ts` → Eliminar (reemplazado)
- [ ] `lib/server/payment-store.ts` → Evaluar
- [ ] `lib/server/zones-store.ts` → Evaluar
- [ ] `data/table-store.json` → Evaluar

### Tipos a Centralizar

- [ ] Mover `OrdersSummary` a `lib/types/orders.ts`
- [ ] Mover tipos de `table-store` a `lib/types/tables.ts`
- [ ] Mover tipos de `menu-store` a `lib/types/menu.ts`
- [ ] Actualizar todos los imports

---

## 🚨 Riesgos Identificados

### Alto Riesgo

1. **QR Service usa store legacy**
   - Impacto: Core functionality
   - Solución: Migración cuidadosa con tests
   - Timeline: Inmediato

### Medio Riesgo

2. **Eliminar stores sin verificar dependencias**
   - Impacto: Puede romper funcionalidad
   - Solución: Auditoría completa de imports
   - Timeline: Antes de eliminar

3. **Tipos dispersos en múltiples archivos**
   - Impacto: Mantenimiento difícil
   - Solución: Centralizar en `/types`
   - Timeline: Durante limpieza

### Bajo Riesgo

4. **Mock data usa stores legacy**
   - Impacto: Solo desarrollo
   - Solución: Mantener o usar seeding
   - Timeline: No urgente

---

## 📊 Métricas

### Código Legacy Detectado

```
Total archivos legacy: 6-7
├── Confirmed legacy:  3 (table-store, order-store, menu-store)
├── To evaluate:       3 (payment-store, zones-store, session-store)
└── Keep (useful):     1 (session-manager - posible caché)

Total líneas legacy: ~2,500
├── A eliminar:     ~1,700 (stores reemplazados)
├── A evaluar:      ~500 (payment, zones)
└── Útil:           ~250 (sessions)

Archivos que referencian legacy: ~8
├── Producción:     3 (qr-service, mock-data, order-store)
├── Tests:          3 (mantener para compatibilidad)
└── Solo tipos:     2 (migrar a /types)
```

### Próximos Pasos

1. ✅ Auditoría inicial completada
2. ⏳ Verificar servicios en `lib/services/`
3. ⏳ Migrar `qr-service.ts`
4. ⏳ Centralizar tipos
5. ⏳ Eliminar stores legacy confirmados

---

## 🎯 Recomendaciones

### Inmediatas (Hoy)

1. **Migrar qr-service.ts a Supabase** (1h)
2. **Verificar si payment/zones tienen servicios** (30min)
3. **Crear plan de migración de tipos** (30min)

### Corto Plazo (Esta Semana)

4. **Centralizar tipos en /types** (1h)
5. **Eliminar stores legacy confirmados** (2h)
6. **Actualizar tests** (1h)

### Medio Plazo (Próxima Semana)

7. **Evaluar session-store** (utilidad vs eliminación)
8. **Migrar mock-data a seeding** (opcional)
9. **Documentar arquitectura final** (1h)

---

**Estado**: 🟡 Auditoría inicial completada  
**Siguiente acción**: Verificar servicios en `lib/services/`  
**Tiempo invertido**: 1h  
**Tiempo restante estimado**: 3-4h para completar limpieza

---

**Última actualización**: Octubre 16, 2025  
**Auditor**: GitHub Copilot  
**Fase**: 5.1 - Auditoría de Código
