# 🔴 CONFLICTO: Archivos JSON Legacy vs Supabase

**Fecha:** 28 de Octubre, 2025  
**Severidad:** 🔴 **CRÍTICA**  
**Estado:** ⚠️ **ACTIVO - Requiere Acción Inmediata**

---

## 🎯 PROBLEMA IDENTIFICADO

El sistema tiene **DOBLE FUENTE DE VERDAD**:
- ✅ **Supabase** (Base de datos en la nube) - Sistema nuevo y correcto
- ❌ **Archivos JSON** (Stores locales) - Sistema legacy que debería estar deprecado

**Esto causa:**
1. 🔴 Inconsistencia de datos
2. 🔴 Bugs impredecibles (datos en JSON vs Supabase)
3. 🔴 Pérdida de datos (se sobreescriben entre sí)
4. 🔴 Confusión en el código (¿cuál usar?)

---

## 📋 ARCHIVOS JSON ENCONTRADOS

### 🗂️ Archivos de Datos (data/)

```bash
data/
├── table-store.json    # ❌ 353 líneas - CONFLICTO con Supabase tables
├── order-store.json    # ❌ 7 líneas - CONFLICTO con Supabase orders  
└── menu-store.json     # ❌ 522 líneas - CONFLICTO con Supabase menu_items
```

**Contenido actual:**
- `table-store.json`: 6 mesas con layout y zonas
- `order-store.json`: vacío (solo metadata)
- `menu-store.json`: 9 items de menú, 4 categorías, 8 alérgenos

### 🔧 Archivos de Código Legacy (lib/server/)

```bash
lib/server/
├── table-store.ts       # ❌ 355 líneas - Lee/escribe table-store.json
├── order-store.ts       # ❌ 258 líneas - Lee/escribe order-store.json
├── menu-store.ts        # ❌ 243 líneas - Lee/escribe menu-store.json
└── payment-store.ts     # ❌ 166 líneas - Sistema de pagos legacy
```

---

## 🔍 RUTAS API QUE USAN STORES LEGACY

### ❌ APIs de Mesas (Deberían usar Supabase)

```typescript
// ❌ app/api/tables/route.ts
import { getStoreMetadata, listTables, createTable } from "@/lib/server/table-store"

// ❌ app/api/tables/[id]/route.ts  
import { getTable, updateTableStatus } from "@/lib/server/table-store"

// ❌ app/api/tables/[id]/covers/route.ts
import { updateTableCovers } from "@/lib/server/table-store"

// ❌ app/api/table-layout/route.ts
import { getTableLayout, getStoreMetadata, listTables } from "@/lib/server/table-store"
```

### ❌ APIs de Órdenes (Deberían usar Supabase)

```typescript
// ❌ app/api/order/route.ts
import { createOrder, listOrders, getOrdersSummary } from "@/lib/server/order-store"

// ❌ app/api/payment/route.ts
import { listOrders } from '@/lib/server/order-store'
```

### ❌ APIs de Menú (Deberían usar Supabase)

```typescript
// ❌ app/api/menu/route.ts
import { getMenuCatalog } from "@/lib/server/menu-store"

// ❌ app/api/menu/categories/route.ts
import { getMenuCatalog } from "@/lib/server/menu-store"

// ❌ app/api/menu/orders/route.ts
import { getMenuMetadata } from "@/lib/server/menu-store"
```

### ❌ WebSocket (También usa stores legacy)

```typescript
// ❌ app/api/socket/route.ts
import { getOrdersSummary, getOrderStoreMetadata } from "@/lib/server/order-store"
import { getTableLayout, listTables } from "@/lib/server/table-store"
```

---

## 🔥 IMPACTO DEL PROBLEMA

### Escenario Real de Conflicto:

```typescript
// Usuario A usa la interfaz (va a Supabase)
await createTableService({ number: "7", capacity: 4 }, tenantId)
// ✅ Mesa guardada en Supabase

// Usuario B hace una petición a /api/tables
GET /api/tables
// ❌ Devuelve datos de table-store.json (no incluye mesa 7!)

// Usuario A refresca la página
// ❌ La mesa 7 desaparece porque el cliente solo ve lo que devuelve /api/tables
```

### Consecuencias:

1. **Pérdida de Datos**
   - Mesas creadas vía UI desaparecen en refresh
   - Órdenes no se sincronizan entre dispositivos
   - Cambios de estado se pierden

2. **Bugs Intermitentes**
   - A veces funciona, a veces no (depende de qué API se use)
   - Datos diferentes en distintas pantallas
   - Tests pasan pero producción falla

3. **Performance Degradada**
   - Dos sistemas escribiendo/leyendo al mismo tiempo
   - I/O innecesario en archivos JSON
   - Queries duplicadas

---

## ✅ SERVICIOS CORRECTOS (Usan Supabase)

### ✅ Estos SÍ están bien:

```typescript
// ✅ lib/services/tables-service.ts
import { createBrowserClient } from "@/lib/supabase/client"
// Usa Supabase directamente

// ✅ lib/services/orders-service.ts  
import { createBrowserClient } from "@/lib/supabase/client"
// Usa Supabase directamente

// ✅ hooks/use-tables.ts
import { getTables as getTablesService } from '@/lib/services/tables-service'
// Usa el servicio correcto de Supabase

// ✅ hooks/use-orders.ts
import { getOrders as getOrdersService } from '@/lib/services/orders-service'
// Usa el servicio correcto de Supabase
```

**Estos componentes están bien porque:**
- Usan `lib/services/*-service.ts` (Supabase)
- NO usan `lib/server/*-store.ts` (JSON legacy)

---

## 📋 PLAN DE LIMPIEZA

### Fase 1: Backup y Verificación (15 minutos)

#### 1.1 Backup de Datos JSON

```bash
# Crear carpeta de backup
mkdir -p data/legacy-backup

# Copiar archivos JSON
cp data/table-store.json data/legacy-backup/table-store-backup-$(date +%Y%m%d).json
cp data/order-store.json data/legacy-backup/order-store-backup-$(date +%Y%m%d).json
cp data/menu-store.json data/legacy-backup/menu-store-backup-$(date +%Y%m%d).json

# Verificar que se copiaron
ls -la data/legacy-backup/
```

#### 1.2 Verificar que Supabase tiene todos los datos

```sql
-- Verificar mesas en Supabase
SELECT COUNT(*) as total_tables FROM tables;
SELECT * FROM tables ORDER BY created_at DESC LIMIT 5;

-- Verificar órdenes
SELECT COUNT(*) as total_orders FROM orders;

-- Verificar menú
SELECT COUNT(*) as total_items FROM menu_items;
SELECT COUNT(*) as total_categories FROM menu_categories;
```

**Criterio de éxito:** Si Supabase tiene datos, podemos eliminar los JSON.

---

### Fase 2: Migrar APIs a Supabase (2-3 horas)

#### 2.1 Actualizar API de Mesas

**Archivo:** `app/api/tables/route.ts`

**❌ Antes:**
```typescript
import { getStoreMetadata, listTables, createTable } from "@/lib/server/table-store"

export async function GET() {
  const [tables, metadata] = await Promise.all([
    listTables(),
    getStoreMetadata(),
  ])
  // ...
}
```

**✅ Después:**
```typescript
import { getTables, createTable as createTableService } from '@/lib/services/tables-service'
import { createServerClient } from '@/lib/supabase/server'

export async function GET() {
  const supabase = createServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user?.user_metadata?.tenant_id) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  }
  
  const tenantId = user.user_metadata.tenant_id
  const { data: tables, error } = await getTables(tenantId)
  
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
  
  return NextResponse.json({ data: tables })
}
```

#### 2.2 Actualizar API de Órdenes

**Archivo:** `app/api/order/route.ts`

Similar al patrón anterior, reemplazar:
- `lib/server/order-store` → `lib/services/orders-service`

#### 2.3 Actualizar API de Menú

**Archivo:** `app/api/menu/route.ts`

Crear nuevo servicio `lib/services/menu-service.ts` si no existe, o usar queries directas a Supabase.

---

### Fase 3: Eliminar Código Legacy (1 hora)

#### 3.1 Deprecar Stores

```bash
# Mover a carpeta legacy
mkdir -p lib/server/legacy
mv lib/server/table-store.ts lib/server/legacy/
mv lib/server/order-store.ts lib/server/legacy/
mv lib/server/menu-store.ts lib/server/legacy/
mv lib/server/payment-store.ts lib/server/legacy/
```

#### 3.2 Eliminar Archivos JSON de Data

```bash
# Mover a legacy-backup (ya están respaldados)
mv data/table-store.json data/legacy-backup/
mv data/order-store.json data/legacy-backup/
mv data/menu-store.json data/legacy-backup/

# O eliminar directamente si estás seguro
# rm data/table-store.json
# rm data/order-store.json
# rm data/menu-store.json
```

#### 3.3 Actualizar .gitignore

```bash
# Agregar a .gitignore para evitar re-crear estos archivos
echo "" >> .gitignore
echo "# Legacy JSON stores (deprecated - use Supabase)" >> .gitignore
echo "data/*-store.json" >> .gitignore
echo "lib/server/legacy/" >> .gitignore
```

---

### Fase 4: Testing y Verificación (1 hora)

#### 4.1 Tests Manuales

```bash
# Iniciar servidor
npm run dev

# Probar cada endpoint
curl http://localhost:3000/api/tables
curl http://localhost:3000/api/order
curl http://localhost:3000/api/menu
```

#### 4.2 Tests Automatizados

```bash
# Ejecutar suite de tests
npm test

# Tests E2E
npm run test:e2e
```

#### 4.3 Verificación de Datos

1. Crear una mesa desde la UI
2. Verificar que aparece en `/api/tables`
3. Crear una orden
4. Verificar que aparece en `/api/order`
5. Refrescar la página
6. Verificar que los datos persisten

---

## 🚀 EJECUCIÓN RÁPIDA (Script Automatizado)

### Script de Limpieza Automática

```bash
#!/bin/bash
# cleanup-legacy-stores.sh

set -e

echo "🧹 Limpiando stores legacy..."

# 1. Crear backup
echo "📦 Creando backup..."
mkdir -p data/legacy-backup
timestamp=$(date +%Y%m%d_%H%M%S)

if [ -f "data/table-store.json" ]; then
  cp data/table-store.json data/legacy-backup/table-store-$timestamp.json
  echo "✅ Backup de table-store.json creado"
fi

if [ -f "data/order-store.json" ]; then
  cp data/order-store.json data/legacy-backup/order-store-$timestamp.json
  echo "✅ Backup de order-store.json creado"
fi

if [ -f "data/menu-store.json" ]; then
  cp data/menu-store.json data/legacy-backup/menu-store-$timestamp.json
  echo "✅ Backup de menu-store.json creado"
fi

# 2. Mover código legacy
echo "📁 Moviendo código legacy..."
mkdir -p lib/server/legacy

if [ -f "lib/server/table-store.ts" ]; then
  mv lib/server/table-store.ts lib/server/legacy/
  echo "✅ table-store.ts movido a legacy/"
fi

if [ -f "lib/server/order-store.ts" ]; then
  mv lib/server/order-store.ts lib/server/legacy/
  echo "✅ order-store.ts movido a legacy/"
fi

if [ -f "lib/server/menu-store.ts" ]; then
  mv lib/server/menu-store.ts lib/server/legacy/
  echo "✅ menu-store.ts movido a legacy/"
fi

# 3. Eliminar JSON stores
echo "🗑️  Eliminando archivos JSON..."
rm -f data/table-store.json
rm -f data/order-store.json
rm -f data/menu-store.json
echo "✅ Archivos JSON eliminados"

# 4. Actualizar .gitignore
echo "📝 Actualizando .gitignore..."
if ! grep -q "data/*-store.json" .gitignore; then
  echo "" >> .gitignore
  echo "# Legacy JSON stores (deprecated - use Supabase)" >> .gitignore
  echo "data/*-store.json" >> .gitignore
  echo "lib/server/legacy/" >> .gitignore
  echo "✅ .gitignore actualizado"
fi

echo ""
echo "✨ Limpieza completada!"
echo "📦 Backups guardados en: data/legacy-backup/"
echo "📁 Código legacy movido a: lib/server/legacy/"
echo ""
echo "⚠️  SIGUIENTE PASO: Actualizar las APIs para usar Supabase"
echo "    Ver: CONFLICTO_JSON_SUPABASE.md - Fase 2"
```

**Para ejecutar en PowerShell (Windows):**

```powershell
# cleanup-legacy-stores.ps1

Write-Host "🧹 Limpiando stores legacy..." -ForegroundColor Cyan

# 1. Crear backup
Write-Host "📦 Creando backup..." -ForegroundColor Yellow
New-Item -ItemType Directory -Force -Path "data\legacy-backup" | Out-Null
$timestamp = Get-Date -Format "yyyyMMdd_HHmmss"

if (Test-Path "data\table-store.json") {
    Copy-Item "data\table-store.json" "data\legacy-backup\table-store-$timestamp.json"
    Write-Host "✅ Backup de table-store.json creado" -ForegroundColor Green
}

if (Test-Path "data\order-store.json") {
    Copy-Item "data\order-store.json" "data\legacy-backup\order-store-$timestamp.json"
    Write-Host "✅ Backup de order-store.json creado" -ForegroundColor Green
}

if (Test-Path "data\menu-store.json") {
    Copy-Item "data\menu-store.json" "data\legacy-backup\menu-store-$timestamp.json"
    Write-Host "✅ Backup de menu-store.json creado" -ForegroundColor Green
}

# 2. Mover código legacy
Write-Host "📁 Moviendo código legacy..." -ForegroundColor Yellow
New-Item -ItemType Directory -Force -Path "lib\server\legacy" | Out-Null

if (Test-Path "lib\server\table-store.ts") {
    Move-Item "lib\server\table-store.ts" "lib\server\legacy\" -Force
    Write-Host "✅ table-store.ts movido a legacy/" -ForegroundColor Green
}

if (Test-Path "lib\server\order-store.ts") {
    Move-Item "lib\server\order-store.ts" "lib\server\legacy\" -Force
    Write-Host "✅ order-store.ts movido a legacy/" -ForegroundColor Green
}

if (Test-Path "lib\server\menu-store.ts") {
    Move-Item "lib\server\menu-store.ts" "lib\server\legacy\" -Force
    Write-Host "✅ menu-store.ts movido a legacy/" -ForegroundColor Green
}

# 3. Eliminar JSON stores
Write-Host "🗑️  Eliminando archivos JSON..." -ForegroundColor Yellow
Remove-Item "data\table-store.json" -ErrorAction SilentlyContinue
Remove-Item "data\order-store.json" -ErrorAction SilentlyContinue
Remove-Item "data\menu-store.json" -ErrorAction SilentlyContinue
Write-Host "✅ Archivos JSON eliminados" -ForegroundColor Green

# 4. Actualizar .gitignore
Write-Host "📝 Actualizando .gitignore..." -ForegroundColor Yellow
$gitignoreContent = Get-Content .gitignore -Raw
if ($gitignoreContent -notmatch "data/\*-store\.json") {
    Add-Content .gitignore "`n# Legacy JSON stores (deprecated - use Supabase)"
    Add-Content .gitignore "data/*-store.json"
    Add-Content .gitignore "lib/server/legacy/"
    Write-Host "✅ .gitignore actualizado" -ForegroundColor Green
}

Write-Host ""
Write-Host "✨ Limpieza completada!" -ForegroundColor Green
Write-Host "📦 Backups guardados en: data\legacy-backup\" -ForegroundColor Cyan
Write-Host "📁 Código legacy movido a: lib\server\legacy\" -ForegroundColor Cyan
Write-Host ""
Write-Host "⚠️  SIGUIENTE PASO: Actualizar las APIs para usar Supabase" -ForegroundColor Yellow
Write-Host "    Ver: CONFLICTO_JSON_SUPABASE.md - Fase 2" -ForegroundColor Yellow
```

---

## 🎯 CHECKLIST DE MIGRACIÓN

### Pre-Migración
- [ ] Backup de archivos JSON creado
- [ ] Verificar que Supabase tiene datos
- [ ] Verificar que servicios de Supabase funcionan
- [ ] Informar al equipo sobre cambios

### Durante Migración
- [ ] Actualizar `app/api/tables/route.ts`
- [ ] Actualizar `app/api/tables/[id]/route.ts`
- [ ] Actualizar `app/api/order/route.ts`
- [ ] Actualizar `app/api/menu/route.ts`
- [ ] Actualizar `app/api/socket/route.ts`
- [ ] Mover stores a `lib/server/legacy/`
- [ ] Eliminar archivos JSON
- [ ] Actualizar .gitignore

### Post-Migración
- [ ] Tests manuales pasan
- [ ] Tests automatizados pasan
- [ ] Tests E2E pasan
- [ ] Verificar datos persisten después de refresh
- [ ] Verificar multi-usuario funciona
- [ ] Deploy a staging
- [ ] Monitorear errores en Sentry

---

## 🆘 ROLLBACK (Si algo sale mal)

### Plan B - Restaurar Legacy

```bash
# 1. Restaurar archivos JSON
cp data/legacy-backup/table-store-*.json data/table-store.json
cp data/legacy-backup/order-store-*.json data/order-store.json
cp data/legacy-backup/menu-store-*.json data/menu-store.json

# 2. Restaurar código
cp lib/server/legacy/*.ts lib/server/

# 3. Revertir cambios en Git
git checkout app/api/tables/route.ts
git checkout app/api/order/route.ts
git checkout app/api/menu/route.ts

# 4. Reiniciar servidor
npm run dev
```

---

## 📊 COMPARACIÓN: Legacy vs Supabase

| Aspecto | Legacy (JSON) | Supabase | Ganador |
|---------|--------------|----------|---------|
| **Performance** | Lento (I/O disco) | Rápido (DB optimizada) | ✅ Supabase |
| **Concurrencia** | ❌ Race conditions | ✅ Transacciones ACID | ✅ Supabase |
| **Escalabilidad** | ❌ Un solo archivo | ✅ Distribuido | ✅ Supabase |
| **Backup** | Manual | ✅ Automático | ✅ Supabase |
| **Multi-usuario** | ❌ Conflictos | ✅ Row Level Security | ✅ Supabase |
| **Queries** | ❌ Cargar todo en memoria | ✅ SQL optimizado | ✅ Supabase |
| **Real-time** | ❌ No soportado | ✅ Suscripciones | ✅ Supabase |
| **Audit** | ❌ Manual | ✅ Triggers automáticos | ✅ Supabase |

**Resultado:** Supabase es superior en todos los aspectos.

---

## 🎓 LECCIONES APRENDIDAS

### ¿Por qué pasó esto?

1. **Migración Incompleta:** Se crearon servicios de Supabase pero no se eliminaron los legacy
2. **Código Duplicado:** APIs usan una fuente, componentes usan otra
3. **Falta de Documentación:** No estaba claro qué sistema usar

### ¿Cómo prevenir esto en el futuro?

1. **Feature Flags:** Usar flags para activar/desactivar sistemas
2. **Tests de Integración:** Verificar que ambos sistemas no coexistan
3. **Documentación Clara:** README con "Sistema a usar"
4. **Code Reviews:** Revisar que no se usen imports legacy

---

## 📞 CONTACTO Y SOPORTE

**Si tienes dudas durante la migración:**
1. Revisar este documento
2. Consultar `docs/database/SUPABASE_MIGRATION_PLAN.md`
3. Verificar logs en consola
4. Revisar errores en Sentry (si está configurado)

**Si algo falla:**
1. No entrar en pánico 😊
2. Ejecutar el rollback (sección 🆘)
3. Revisar los backups en `data/legacy-backup/`
4. Reportar el error con contexto

---

## ✅ CONCLUSIÓN

**Acción Requerida:** 🔴 **INMEDIATA**

Este conflicto debe resolverse antes de continuar el desarrollo o deploy a producción. Los datos están en riesgo de perderse o corromperse.

**Tiempo Estimado Total:** 4-5 horas

**Recompensa:** 
- ✅ Sistema consistente
- ✅ Cero conflictos de datos
- ✅ Performance mejorada
- ✅ Código más limpio
- ✅ Preparado para escalar

---

**Generado:** 28 de Octubre, 2025  
**Versión:** 1.0  
**Última Actualización:** Análisis inicial completo
