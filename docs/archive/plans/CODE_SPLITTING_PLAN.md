# Plan de Code Splitting - Fase 4.3

## 📋 Resumen

Plan para implementar **code splitting** y **lazy loading** en la aplicación, reduciendo el tamaño del bundle inicial y mejorando métricas de rendimiento (TTI, FCP).

**Estado**: ⚠️ **Pendiente** - Bloqueado por errores de tipos existentes

---

## 🎯 Objetivos

1. **Reducir bundle inicial**: Target <200KB (actualmente ~280KB)
2. **Mejorar TTI**: Target <2 segundos (actualmente ~3.5s)
3. **Lazy loading**: Componentes pesados cargados bajo demanda
4. **Split por rutas**: Cada ruta debe tener su propio chunk

---

## 📦 Componentes Candidatos para Dynamic Import

### Alta Prioridad (Componentes Pesados)

#### 1. TableMap Component
**Archivo**: `components/table-map.tsx` (725 líneas)
**Peso estimado**: ~45KB + Konva library (~120KB)
**Razón**: Canvas rendering con react-konva, no necesario en SSR
**Usado en**:
- `app/salon/page.tsx`
- `app/mesas/editor/page.tsx`

**Implementación**:
```typescript
const TableMap = dynamic(
  () => import("@/components/table-map").then(mod => ({ default: mod.TableMap })),
  { 
    ssr: false, // Canvas no funciona en SSR
    loading: () => <LoadingSpinner />
  }
)
```

**Impacto esperado**: -165KB del bundle inicial

---

#### 2. OrdersPanel Component
**Archivo**: `components/orders-panel.tsx` (441 líneas)
**Peso estimado**: ~32KB
**Razón**: Muchas órdenes, filtros complejos, no crítico para FCP
**Usado en**:
- `app/pedidos/page.tsx`

**Implementación**:
```typescript
const OrdersPanel = dynamic(
  () => import("@/components/orders-panel").then(mod => ({ default: mod.OrdersPanel })),
  { loading: () => <LoadingSpinner /> }
)
```

**Impacto esperado**: -32KB del bundle inicial

---

#### 3. OrderForm Component
**Archivo**: `components/order-form.tsx`
**Peso estimado**: ~28KB
**Razón**: Form complejo con validaciones, solo usado en tab "Nuevo pedido"
**Usado en**:
- `app/pedidos/page.tsx`

**Implementación**:
```typescript
const OrderForm = dynamic(
  () => import("@/components/order-form").then(mod => ({ default: mod.OrderForm })),
  { loading: () => <LoadingSpinner /> }
)
```

**Impacto esperado**: -28KB del bundle inicial

---

#### 4. AnalyticsDashboard Component
**Archivo**: `components/analytics-dashboard.tsx`
**Peso estimado**: ~35KB + recharts library (~80KB)
**Razón**: Gráficos y cálculos pesados, solo para admins
**Usado en**:
- `app/analitica/page.tsx`

**Implementación**:
```typescript
const AnalyticsDashboard = dynamic(
  () => import("@/components/analytics-dashboard").then(mod => ({ default: mod.AnalyticsDashboard })),
  { loading: () => <div className="flex items-center justify-center h-[400px]"><LoadingSpinner /></div> }
)
```

**Impacto esperado**: -115KB del bundle inicial

---

#### 5. QRManagementPanel Component
**Archivo**: `components/qr-management-panel.tsx`
**Peso estimado**: ~25KB + qrcode library (~15KB)
**Razón**: QR generation, solo para admins
**Usado en**:
- `app/qr-management/page.tsx`

**Implementación**:
```typescript
const QRManagementPanel = dynamic(
  () => import('@/components/qr-management-panel').then(mod => ({ default: mod.QRManagementPanel })),
  { loading: () => <LoadingSpinner /> }
)
```

**Impacto esperado**: -40KB del bundle inicial

---

#### 6. ConfigurationPanel Component
**Archivo**: `components/configuration-panel.tsx`
**Peso estimado**: ~30KB
**Razón**: Settings panel, solo para admins
**Usado en**:
- `app/configuracion/page.tsx`

**Implementación**:
```typescript
const ConfigurationPanel = dynamic(
  () => import("@/components/configuration-panel").then(mod => ({ default: mod.ConfigurationPanel })),
  { loading: () => <LoadingSpinner /> }
)
```

**Impacto esperado**: -30KB del bundle inicial

---

### Total Impacto Estimado
**Reducción de bundle inicial**: -410KB (147% de reducción sobre 280KB actual)
**Nuevo tamaño inicial estimado**: ~170KB ✅ (target: <200KB)

---

## 🚫 Bloqueador Actual: Errores de Tipos

**Status**: ⚠️ **Bloqueado**

Al intentar implementar dynamic imports, se detectaron **errores de tipos existentes** que causan fallo en el build:

### Errores Principales

#### 1. Type Mismatches en Supabase Types
**Archivo**: `lib/server/table-store.ts`, `lib/server/order-store.ts`
**Problema**: Incompatibilidad entre tipos de Supabase y tipos de la aplicación
- `table.status`: Type `string` vs `"libre" | "ocupada" | ...`
- `table.zone`: Missing property in Supabase row type
- `table.zone_id`: `null` vs `undefined`

#### 2. Type Errors en Components
**Archivos**: `components/table-list.tsx`, `components/zones-management.tsx`, `components/salon-zones-panel.tsx`
**Problema**: Incompatibilidad de tipos entre Supabase DB types y application types
- `table.zone`: Type mismatch (partial zone vs full zone type)
- `zone.table_count`: Property doesn't exist
- `table.number`: Type `string` vs `number`

#### 3. Type Errors en Pages
**Archivo**: `app/mesas/[id]/page.tsx`
**Problema**: 
- `table.zone`: Object rendered as React child
- `table.seats` vs `table.capacity`: Property name mismatch

---

## ✅ Solución Requerida: Fix de Tipos

**Prioridad**: CRÍTICA - Debe resolverse antes de continuar con code splitting

### Estrategia de Solución

#### Opción 1: Actualizar Database Types (Recomendado)
1. Regenerar tipos desde Supabase schema actual:
   ```bash
   npx supabase gen types typescript --project-id <id> --schema public > lib/supabase/database.types.ts
   ```

2. Actualizar interfaces en `lib/mock-data.ts` para coincidir con DB types

3. Crear type guards y transformers:
   ```typescript
   // lib/type-guards.ts
   export function isValidTableStatus(status: string): status is TableStatus {
     return ['libre', 'ocupada', 'pedido_en_curso', 'cuenta_solicitada', 'pago_confirmado'].includes(status)
   }
   ```

#### Opción 2: Type Assertions con Validación
1. Agregar type assertions donde sea necesario
2. Validar datos en runtime
3. Documentar discrepancias

#### Opción 3: Migration Script
1. Crear script de migración de datos
2. Asegurar consistencia DB <-> Application
3. Actualizar tipos después

---

## 📝 Plan de Implementación (Post-Fix de Tipos)

### Fase 1: TableMap Dynamic Import (1h)
- [ ] Implementar dynamic import en `app/salon/page.tsx`
- [ ] Implementar dynamic import en `app/mesas/editor/page.tsx`
- [ ] Verificar: TableMap NO está en bundle inicial
- [ ] Test: Canvas renderiza correctamente al navegar
- [ ] Medir: Reducción de bundle size

### Fase 2: Orders Components (1h)
- [ ] Implementar dynamic imports en `app/pedidos/page.tsx`
- [ ] OrdersPanel + OrderForm lazy loaded
- [ ] Test: Tab switching funciona
- [ ] Medir: TTI improvement

### Fase 3: Admin Components (1h)
- [ ] AnalyticsDashboard dynamic import
- [ ] QRManagementPanel dynamic import
- [ ] ConfigurationPanel dynamic import
- [ ] SessionMonitorDashboard dynamic import
- [ ] Test: Admin pages funcionan
- [ ] Medir: Bundle size por ruta

### Fase 4: Route-based Splitting (30min)
- [ ] Verificar: Next.js automáticamente hace split por rutas
- [ ] Configurar `next.config.mjs` si es necesario
- [ ] Analizar chunks con webpack-bundle-analyzer

### Fase 5: Verificación y Testing (1h)
- [ ] npm run build exitoso
- [ ] Lighthouse audit: Score >90
- [ ] Test manual: Todas las rutas cargan
- [ ] Test manual: Loading states funcionan
- [ ] Performance metrics: FCP <1s, TTI <2s

---

## 📊 Métricas Esperadas

### Antes
| Métrica | Valor Actual | Target |
|---------|--------------|--------|
| Bundle inicial | ~280KB | <200KB |
| FCP (First Contentful Paint) | ~1.8s | <1s |
| TTI (Time to Interactive) | ~3.5s | <2s |
| Lighthouse Score | ~75 | >90 |

### Después (Estimado)
| Métrica | Valor Esperado | Mejora |
|---------|----------------|--------|
| Bundle inicial | ~170KB | 39% ↓ |
| FCP | ~1.2s | 33% ↓ |
| TTI | ~2.0s | 43% ↓ |
| Lighthouse Score | ~92 | 23% ↑ |

---

## 🔍 Herramientas de Análisis

### 1. Webpack Bundle Analyzer
```bash
npm install --save-dev @next/bundle-analyzer
```

```javascript
// next.config.mjs
const withBundleAnalyzer = require('@next/bundle-analyzer')({
  enabled: process.env.ANALYZE === 'true',
})

module.exports = withBundleAnalyzer(nextConfig)
```

**Uso**:
```bash
ANALYZE=true npm run build
```

### 2. Lighthouse CI
```bash
npm install -g @lhci/cli
lhci autorun --collect.url=http://localhost:3000
```

### 3. Next.js Built-in Analytics
Ver en build output: "First Load JS" por ruta

---

## 📋 Checklist Final

- [ ] Tipos corregidos (bloqueador)
- [ ] Dynamic imports implementados
- [ ] Build exitoso
- [ ] Tests manuales: todas las rutas
- [ ] Loading states funcionando
- [ ] Lighthouse audit >90
- [ ] Bundle analyzer ejecutado
- [ ] Documentación actualizada
- [ ] Performance metrics registradas

---

## 📌 Notas

- **Code splitting automático**: Next.js ya hace split por rutas app/**
- **SSR consideration**: `ssr: false` necesario para TableMap (canvas)
- **Loading states**: Crítico para UX, usar LoadingSpinner consistente
- **Error boundaries**: Considerar para manejar errores en lazy loaded components

---

**Última actualización**: Octubre 2025
**Estado**: Bloqueado por errores de tipos
**Próximo paso**: Resolver type mismatches en Supabase integration
