# ✅ Estado de Migración QR Service - LISTO PARA EJECUTAR

**Fecha**: Octubre 16, 2025  
**Estado**: 🟢 Todas las verificaciones completadas, listo para migrar

---

## ✅ Verificaciones Completadas

### 1. Schema de Supabase ✅

**Tabla `tables` contiene todas las columnas necesarias**:

```typescript
// lib/supabase/database.types.ts (líneas 728-742)
tables: {
  Row: {
    id: string
    number: string
    capacity: number
    status: string
    zone_id: string | null
    tenant_id: string
    position: Json | null
    metadata: Json | null
    // ✅ COLUMNAS QR EXISTEN
    qr_token: string | null
    qr_expires_at: string | null
    qrcode_url: string | null
    created_at: string | null
    updated_at: string | null
  }
}
```

**Conclusión**: ✅ NO necesitamos crear migration SQL, las columnas ya existen

---

### 2. Tables Service ✅

**`lib/services/tables-service.ts` tiene todas las funciones necesarias**:

```typescript
// ✅ Exporta getTableById (línea 61)
export async function getTableById(tableId: string, tenantId: string)

// ✅ Exporta updateTable con soporte QR (línea 133)
export async function updateTable(
  tableId: string,
  updates: {
    qrToken?: string        // ✅ Mapea a qr_token
    qrExpiresAt?: string    // ✅ Mapea a qr_expires_at
    qrcodeUrl?: string      // ✅ Mapea a qrcode_url
    // ... otros campos
  },
  tenantId: string
)
```

**Mapeo de propiedades** (líneas 162-164):
```typescript
if (updates.qrToken !== undefined) updateData.qr_token = updates.qrToken
if (updates.qrExpiresAt !== undefined) updateData.qr_expires_at = updates.qrExpiresAt
if (updates.qrcodeUrl !== undefined) updateData.qrcode_url = updates.qrcodeUrl
```

**Conclusión**: ✅ Service tiene todo lo necesario, solo adaptar llamadas

---

### 3. Diferencias Identificadas ⚠️

#### Problema: getTableById signature

```typescript
// ❌ QR Service usa (solo tableId)
const table = await getTableById(tableId);

// ✅ Tables Service requiere (tableId + tenantId)
const table = await getTableById(tableId, tenantId);
```

**Solución**: Obtener `tenantId` dentro de qr-service

---

## 🔧 Cambios Exactos a Realizar

### Cambio 1: Import

```typescript
// ❌ ANTES (línea 14)
import { getTableById, updateTableQR } from './table-store';

// ✅ DESPUÉS
import { getTableById, updateTable } from '@/lib/services/tables-service';
import { createBrowserClient } from '@/lib/supabase/client';
```

---

### Cambio 2: Función auxiliar para obtener tenant_id

```typescript
// ✅ NUEVA FUNCIÓN (añadir después de línea 27)
/**
 * Get tenant ID from Supabase session
 * Required for tables service calls
 */
async function getTenantId(): Promise<string> {
  const supabase = createBrowserClient();
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user?.user_metadata?.tenant_id) {
    throw new Error('No tenant ID found in session');
  }
  
  return user.user_metadata.tenant_id;
}
```

---

### Cambio 3: generateQR - obtener table (línea 75)

```typescript
// ❌ ANTES
const table = await getTableById(tableId);

// ✅ DESPUÉS
const tenantId = await getTenantId();
const { data: table, error: tableError } = await getTableById(tableId, tenantId);

if (tableError || !table) {
  throw new Error(`Table not found: ${tableId}`);
}
```

---

### Cambio 4: validateToken - obtener table (línea 217)

```typescript
// ❌ ANTES
const table = await getTableById(decoded.tableId);

// ✅ DESPUÉS
const tenantId = await getTenantId();
const { data: table, error: tableError } = await getTableById(decoded.tableId, tenantId);

if (tableError || !table) {
  logger.warn(`[validateToken] Table not found: ${decoded.tableId}`);
  return {
    valid: false,
    error: 'Table not found',
    errorCode: QRValidationErrorCode.TABLE_NOT_FOUND,
  };
}
```

---

### Cambio 5: updateTableQRMetadata (líneas 364-380)

```typescript
// ❌ ANTES
async function updateTableQRMetadata(
  tableId: string,
  metadata: QRMetadata
): Promise<void> {
  try {
    await updateTableQR(tableId, metadata.token, metadata.expiresAt);
  } catch (error) {
    logger.error(
      `[updateTableQRMetadata] Error updating metadata:`,
      error instanceof Error ? error : new Error(String(error))
    );
  }
}

// ✅ DESPUÉS
async function updateTableQRMetadata(
  tableId: string,
  metadata: QRMetadata
): Promise<void> {
  try {
    const tenantId = await getTenantId();
    
    const { error } = await updateTable(
      tableId,
      {
        qrToken: metadata.token,
        qrExpiresAt: metadata.expiresAt.toISOString(),
        // Opcional: guardar también generatedAt en metadata
        metadata: {
          qr_generated_at: metadata.generatedAt.toISOString(),
          scan_count: metadata.scanCount || 0,
        },
      },
      tenantId
    );

    if (error) {
      throw error;
    }

    logger.debug(`[updateTableQRMetadata] Metadata updated for table ${tableId}`);
  } catch (error) {
    logger.error(
      `[updateTableQRMetadata] Error updating metadata:`,
      error instanceof Error ? error : new Error(String(error))
    );
    // Don't throw - metadata update is non-critical
  }
}
```

---

### Cambio 6: incrementScanCount (líneas 383-395)

```typescript
// ❌ ANTES (placeholder)
async function incrementScanCount(tableId: string): Promise<void> {
  try {
    // TODO: Implement scan counting in session store (Day 2-3)
    logger.debug(`[incrementScanCount] Scan counted for table ${tableId}`);
  } catch (error) {
    logger.error(
      `[incrementScanCount] Error:`,
      error instanceof Error ? error : new Error(String(error))
    );
  }
}

// ✅ DESPUÉS (implementación completa)
async function incrementScanCount(tableId: string): Promise<void> {
  try {
    const tenantId = await getTenantId();
    
    // Get current table to read scan_count from metadata
    const { data: table, error: getError } = await getTableById(tableId, tenantId);
    
    if (getError || !table) {
      logger.warn(`[incrementScanCount] Table not found: ${tableId}`);
      return;
    }

    // Increment scan count in metadata
    const currentMetadata = (table.metadata as Record<string, any>) || {};
    const scanCount = (currentMetadata.scan_count || 0) + 1;

    const { error: updateError } = await updateTable(
      tableId,
      {
        metadata: {
          ...currentMetadata,
          scan_count: scanCount,
          last_scanned_at: new Date().toISOString(),
        },
      },
      tenantId
    );

    if (updateError) {
      throw updateError;
    }

    logger.debug(`[incrementScanCount] Scan counted for table ${tableId} (count: ${scanCount})`);
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

### Cambio 7: Adaptar estructura de table retornado

**Verificar estructura de `table` en las funciones**:

```typescript
// Tables service retorna:
{
  id: string
  number: string        // ✅ OK
  capacity: number      // ⚠️ En qr-service se usa table.seats
  status: string        // ✅ OK
  zone_id: string       // ⚠️ En qr-service se usa table.zone
  // ...
}
```

**Adaptaciones necesarias** (líneas 96, 110, 119, 229):

```typescript
// ❌ ANTES
table.seats
table.zone

// ✅ DESPUÉS
table.capacity
table.zone_id || 'main'
```

**Cambios específicos**:

1. **Línea 96** (createToken):
```typescript
// ✅ CAMBIAR
const token = createToken(table.id, table.number, table.zone || 'main');
// ✅ A
const token = createToken(table.id, Number(table.number), table.zone_id || 'main');
```

2. **Línea 110** (result.table):
```typescript
// ✅ CAMBIAR
table: {
  id: table.id,
  number: table.number,
  zone: table.zone || 'main',
},
// ✅ A
table: {
  id: table.id,
  number: table.number,
  zone: table.zone_id || 'main',
},
```

3. **Línea 229** (validateToken return):
```typescript
// ✅ CAMBIAR
tableData: {
  id: table.id,
  number: table.number,
  zone: table.zone || 'main',
  status: table.status,
  seats: table.seats || 4,
},
// ✅ A
tableData: {
  id: table.id,
  number: table.number,
  zone: table.zone_id || 'main',
  status: table.status,
  seats: table.capacity || 4,
},
```

---

## 📝 Checklist de Ejecución

### Pre-migración
- [x] ✅ Verificar schema Supabase (columnas QR existen)
- [x] ✅ Verificar tables-service exporta funciones necesarias
- [x] ✅ Identificar todos los cambios necesarios
- [ ] Backup del archivo original
- [ ] Crear rama git para migración

### Migración (30 minutos)
- [ ] Actualizar imports (Cambio 1)
- [ ] Añadir función getTenantId (Cambio 2)
- [ ] Actualizar generateQR (Cambio 3)
- [ ] Actualizar validateToken (Cambio 4)
- [ ] Actualizar updateTableQRMetadata (Cambio 5)
- [ ] Implementar incrementScanCount (Cambio 6)
- [ ] Adaptar propiedades table (Cambio 7)

### Testing (45 minutos)
- [ ] `npm run type-check` (sin errores TypeScript)
- [ ] `npm run lint` (sin errores ESLint)
- [ ] `npm run test lib/server/__tests__/qr-service.test.ts`
- [ ] Test manual: Generar QR
- [ ] Test manual: Validar QR
- [ ] Verificar en Supabase dashboard que datos se guardan

### Validación (15 minutos)
- [ ] Verificar qr_token en Supabase
- [ ] Verificar qr_expires_at en Supabase
- [ ] Verificar scan_count incrementa
- [ ] Revisar logs (no errores)
- [ ] Commit cambios

---

## ⚠️ Notas Importantes

### 1. tenantId requerido en todos los servicios Supabase

**Razón**: RLS (Row Level Security) requiere tenant_id para aislar datos entre restaurantes.

**Solución**: Función `getTenantId()` obtiene tenant_id del user session.

---

### 2. table.number es string, no number

**Schema Supabase**: `number: string`

**Función createToken espera**: `tableNumber: number`

**Solución**: Convertir con `Number(table.number)` en línea 96

---

### 3. scan_count se guarda en metadata, no columna separada

**Razón**: tabla `tables` no tiene columna `scan_count` dedicada

**Solución**: Usar campo `metadata` (JSONB) para guardar:
```json
{
  "scan_count": 5,
  "last_scanned_at": "2025-10-16T10:30:00Z",
  "qr_generated_at": "2025-10-15T09:00:00Z"
}
```

---

### 4. zone vs zone_id

**Legacy**: `table.zone` (string del nombre de zona)  
**Supabase**: `table.zone_id` (UUID de referencia a tabla zones)

**Implicación**: 
- Si se necesita nombre de zona, hacer JOIN con tabla `zones`
- tables-service ya hace JOIN en select (línea 63-67)
- Para QR, usar zone_id como identificador es suficiente

---

## 🚀 Siguiente Paso

**Ejecutar migración siguiendo cambios 1-7 en orden.**

Comandos preparatorios:
```bash
# 1. Crear backup
cp lib/server/qr-service.ts lib/server/qr-service.ts.backup

# 2. Crear rama
git checkout -b migration/qr-service-supabase

# 3. Abrir archivo para editar
code lib/server/qr-service.ts
```

**¿Proceder con la migración?**

---

**Documentación relacionada**:
- docs/AUDIT_5.1_STORES_LEGACY.md
- docs/MIGRATION_QR_SERVICE.md
