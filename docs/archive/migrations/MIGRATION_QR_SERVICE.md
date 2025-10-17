# 🔧 Plan de Migración: QR Service → Supabase

**Archivo**: `lib/server/qr-service.ts`  
**Prioridad**: 🔴 CRÍTICA  
**Esfuerzo estimado**: 1-2 horas  
**Riesgo**: MEDIO (requiere testing exhaustivo)

---

## 🎯 Objetivo

Migrar `qr-service.ts` de usar **table-store legacy** a usar **tables-service (Supabase)**.

---

## 📋 Estado Actual

### Problema Identificado

```typescript
// ❌ LÍNEA 14 - USA STORE LEGACY
import { getTableById, updateTableQR } from './table-store';
```

**Funciones legacy usadas**:
1. `getTableById(tableId)` - Línea 75, 217
2. `updateTableQR(tableId, token, expiresAt)` - Línea 372

### Funcionalidad Actual

**qr-service.ts** es responsable de:
- ✅ Generar códigos QR (QRCode library)
- ✅ Crear/validar tokens JWT
- ✅ Gestionar metadata de QR (token, expiry, scan count)
- ⚠️ **PROBLEMA**: Leer/actualizar tables usando legacy store

---

## 🔄 Plan de Migración

### Paso 1: Actualizar Imports

```typescript
// ❌ ANTES
import { getTableById, updateTableQR } from './table-store';

// ✅ DESPUÉS
import { getTableById, updateTable } from '@/lib/services/tables-service';
```

**Verificación**: 
- ✅ `tables-service.ts` exporta `getTableById` 
- ✅ `tables-service.ts` exporta `updateTable`

---

### Paso 2: Migrar `generateQR()` (línea 71-120)

#### Cambio 1: getTableById

```typescript
// ❌ ANTES (línea 75)
const table = await getTableById(tableId);

// ✅ DESPUÉS
const table = await getTableById(tableId);
// ⚠️ NOTA: Verificar estructura del objeto retornado
// Si tables-service retorna estructura diferente, adaptar
```

**Verificación necesaria**:
```typescript
// Confirmar que table tiene:
// - table.id
// - table.number
// - table.zone (o table.zone_id)
// - table.status (opcional)
```

#### Cambio 2: updateTableQRMetadata (línea 119)

```typescript
// ❌ ANTES (función helper línea 370-375)
async function updateTableQRMetadata(
  tableId: string,
  metadata: QRMetadata
): Promise<void> {
  await updateTableQR(tableId, metadata.token, metadata.expiresAt);
}

// ✅ DESPUÉS
async function updateTableQRMetadata(
  tableId: string,
  metadata: QRMetadata
): Promise<void> {
  // Usar updateTable de Supabase
  await updateTable(tableId, {
    qr_token: metadata.token,
    qr_expires_at: metadata.expiresAt.toISOString(),
    qr_generated_at: metadata.generatedAt.toISOString(),
    // Verificar que columnas existan en Supabase
  });
}
```

**⚠️ VERIFICACIÓN CRÍTICA**: Confirmar schema de tabla `tables` en Supabase:
- ¿Existe columna `qr_token`?
- ¿Existe columna `qr_expires_at`?
- ¿Existe columna `qr_generated_at`?
- Si no existen, se deben crear o usar otra tabla (e.g., `table_qr_metadata`)

---

### Paso 3: Migrar `validateToken()` (línea 187-247)

#### Cambio: getTableById

```typescript
// ❌ ANTES (línea 217)
const table = await getTableById(decoded.tableId);

// ✅ DESPUÉS
const table = await getTableById(decoded.tableId);
// Verificar mismo objeto structure
```

**Validación**:
- Confirmar que `table.status` existe y tiene valores esperados
- Confirmar que `table.seats` existe (línea 229)

---

### Paso 4: Revisar Schema de Supabase

**Verificar tabla `tables` tiene columnas**:

```sql
-- Ejecutar en Supabase SQL Editor
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'tables' AND table_schema = 'public';
```

**Columnas esperadas para QR**:
- `qr_token` (text, nullable)
- `qr_expires_at` (timestamptz, nullable)
- `qr_generated_at` (timestamptz, nullable)
- `scan_count` (integer, default 0, nullable)
- `last_scanned_at` (timestamptz, nullable)

**Si no existen**:

```sql
-- Añadir columnas a tabla tables
ALTER TABLE public.tables 
ADD COLUMN IF NOT EXISTS qr_token TEXT,
ADD COLUMN IF NOT EXISTS qr_expires_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS qr_generated_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS scan_count INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS last_scanned_at TIMESTAMPTZ;
```

---

### Paso 5: Actualizar incrementScanCount() (línea 383-395)

```typescript
// ❌ ANTES (placeholder)
async function incrementScanCount(tableId: string): Promise<void> {
  // TODO: Implement scan counting in session store (Day 2-3)
  logger.debug(`[incrementScanCount] Scan counted for table ${tableId}`);
}

// ✅ DESPUÉS (implementar con Supabase)
async function incrementScanCount(tableId: string): Promise<void> {
  try {
    // Get current table
    const table = await getTableById(tableId);
    if (!table) {
      logger.warn(`[incrementScanCount] Table not found: ${tableId}`);
      return;
    }

    // Increment scan count
    await updateTable(tableId, {
      scan_count: (table.scan_count || 0) + 1,
      last_scanned_at: new Date().toISOString(),
    });

    logger.debug(`[incrementScanCount] Scan counted for table ${tableId}`);
  } catch (error) {
    logger.error(
      `[incrementScanCount] Error:`,
      error instanceof Error ? error : new Error(String(error))
    );
    // Don't throw - scan counting is non-critical
  }
}
```

---

## 🧪 Testing Plan

### Test 1: Unit Tests

```bash
# Ejecutar tests existentes
npm run test lib/server/__tests__/qr-service.test.ts

# Verificar:
# ✅ generateQR funciona
# ✅ validateToken funciona
# ✅ refreshToken funciona
# ✅ Token expiry funciona
```

**Posibles ajustes**:
- Mockear `tables-service` en vez de `table-store`
- Actualizar fixtures si estructura de table cambió

### Test 2: Integration Test

```typescript
// Crear nuevo test: lib/server/__tests__/qr-service-integration.test.ts
describe('QR Service - Supabase Integration', () => {
  it('should generate QR and store in Supabase', async () => {
    // 1. Generate QR for test table
    const qr = await generateQR('test-table-1');
    
    // 2. Verify token stored in Supabase
    const table = await getTableById('test-table-1');
    expect(table.qr_token).toBe(qr.token);
    expect(table.qr_expires_at).toBeDefined();
  });

  it('should validate token and increment scan count', async () => {
    // 1. Generate QR
    const qr = await generateQR('test-table-1');
    
    // 2. Get initial scan count
    const tableBefore = await getTableById('test-table-1');
    const initialCount = tableBefore.scan_count || 0;
    
    // 3. Validate token
    const result = await validateToken(qr.token);
    expect(result.valid).toBe(true);
    
    // 4. Verify scan count incremented
    const tableAfter = await getTableById('test-table-1');
    expect(tableAfter.scan_count).toBe(initialCount + 1);
    expect(tableAfter.last_scanned_at).toBeDefined();
  });
});
```

### Test 3: Manual E2E Test

**Flujo completo**:

1. **Generar QR**:
   ```bash
   npm run dev
   # Ir a: http://localhost:3000/qr-management
   # Generar QR para mesa de prueba
   ```

2. **Escanear QR**:
   - Copiar URL del QR
   - Abrir en navegador
   - Verificar que carga página de mesa
   - Verificar que token es válido

3. **Verificar en Supabase**:
   ```sql
   SELECT id, number, qr_token, qr_expires_at, scan_count, last_scanned_at
   FROM tables
   WHERE id = 'test-table-id';
   ```

4. **Verificar logs**:
   - Revisar console del navegador
   - Revisar Supabase logs
   - No debe haber errores

---

## ⚠️ Riesgos y Mitigaciones

### Riesgo 1: Schema de tabla incompleto

**Problema**: Tabla `tables` no tiene columnas QR  
**Mitigación**: Ejecutar migration SQL (ver Paso 4)  
**Severidad**: ALTA

### Riesgo 2: Estructura de table diferente

**Problema**: `tables-service` retorna objeto con estructura diferente a legacy  
**Mitigación**: Adaptar código para acceder propiedades correctas  
**Severidad**: MEDIA

### Riesgo 3: RLS bloquea updates

**Problema**: Row Level Security previene actualización de QR metadata  
**Mitigación**: 
- Verificar policies en Supabase
- Puede necesitar usar service role para updates de sistema
**Severidad**: ALTA

### Riesgo 4: Tests rotos

**Problema**: Unit tests mockean table-store legacy  
**Mitigación**: Actualizar mocks para tables-service  
**Severidad**: BAJA

---

## 📝 Checklist de Migración

### Pre-migración

- [ ] Backup del archivo original (`cp qr-service.ts qr-service.ts.bak`)
- [ ] Verificar schema de tabla `tables` en Supabase
- [ ] Añadir columnas QR si no existen (migration SQL)
- [ ] Verificar RLS policies permiten updates de QR

### Migración

- [ ] Actualizar import: `table-store` → `tables-service`
- [ ] Cambiar `updateTableQR` → `updateTable` en updateTableQRMetadata
- [ ] Implementar `incrementScanCount` con Supabase
- [ ] Verificar estructura de objeto `table` en todas las referencias
- [ ] Actualizar tipos si necesario

### Post-migración

- [ ] Ejecutar `npm run lint` (sin errores)
- [ ] Ejecutar `npm run type-check` (sin errores TypeScript)
- [ ] Ejecutar `npm run test` (todos los tests pasan)
- [ ] Test manual E2E (generar + validar QR)
- [ ] Verificar en Supabase que datos se guardan correctamente
- [ ] Revisar logs (no errores)

### Validación final

- [ ] Generar QR para 3 mesas diferentes
- [ ] Escanear cada QR y verificar funcionamiento
- [ ] Verificar scan_count incrementa en Supabase
- [ ] Probar token expirado (cambiar fecha manualmente)
- [ ] Verificar error handling funciona

---

## 🚀 Ejecución

### Orden de operaciones

1. **Preparación** (15min)
   - Verificar schema Supabase
   - Crear migration si necesario
   - Hacer backup

2. **Migración de código** (30min)
   - Actualizar imports
   - Cambiar funciones
   - Implementar incrementScanCount

3. **Testing** (45min)
   - Unit tests
   - Integration test
   - Manual E2E test

4. **Validación** (15min)
   - Lint + type-check
   - Verificar en Supabase
   - Revisar logs

**TOTAL**: ~2 horas

---

## 📊 Criterios de Éxito

✅ Código compila sin errores TypeScript  
✅ Todos los unit tests pasan  
✅ Integration test pasa  
✅ QR se genera correctamente (manual test)  
✅ QR se valida correctamente (manual test)  
✅ Datos se guardan en Supabase (verificado en dashboard)  
✅ Scan count incrementa correctamente  
✅ No hay console.errors en navegador  
✅ No hay errores en logs de Supabase

---

## 🔗 Referencias

- **Archivo a migrar**: `lib/server/qr-service.ts`
- **Servicio nuevo**: `lib/services/tables-service.ts`
- **Tests**: `lib/server/__tests__/qr-service.test.ts`
- **Documentación**: `docs/AUDIT_5.1_STORES_LEGACY.md`

---

**Siguiente paso**: Ejecutar migración siguiendo este plan paso a paso
