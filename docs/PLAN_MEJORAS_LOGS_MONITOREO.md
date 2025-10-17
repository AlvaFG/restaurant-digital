# 🔧 PLAN DE MEJORAS - LOGS Y MONITOREO

**Fecha**: 17 de octubre, 2025  
**Basado en**: FASE_5.5_AUDITORIA_LOGS_MONITOREO.md  
**Objetivo**: Mejorar sistema de logging y monitoreo para producción

---

## 🎯 RESUMEN EJECUTIVO

### Problemas Identificados
1. ⚠️ **Console.log en producción** (15+ archivos afectados)
2. ⚠️ **Logger estructurado no utilizado** (existe pero ignorado)
3. 🔴 **Sin error tracking** (errores se pierden)
4. 🔴 **Sin monitoreo en producción** (ceguera operacional)

### Impacto sin Mejoras
```
❌ Debugging difícil en producción
❌ Errores invisibles hasta que usuarios reportan
❌ Logs contaminados con debug info
❌ No hay métricas de salud del sistema
❌ MTTR (Mean Time To Repair) alto
```

### ROI de Implementación
```
✅ 80% reducción en tiempo de debugging
✅ Detección proactiva de errores
✅ Mejor experiencia de soporte
✅ Datos para mejora continua
✅ Alertas automáticas 24/7
```

---

## 🚀 PRIORIDAD 1: LIMPIEZA DE CONSOLE.LOG (CRÍTICO)

### 🎯 Objetivo
Eliminar console.log de código de producción para tener logs limpios.

### 📊 Alcance
- **Archivos afectados**: 15+
- **Tiempo estimado**: 2 horas
- **Impacto**: Alto (limpieza de logs)
- **Complejidad**: Baja

### 📝 Tareas Específicas

#### 1. Limpiar API Routes
**Archivos**:
- `app/api/zones/route.ts` (9 console.log → eliminar)
- `app/api/table-layout/route.ts` (2 console.error → migrar)
- `app/api/tables/by-token/[token]/route.ts` (1 console.error → migrar)

**Acción**:
```typescript
// ❌ ANTES
console.log('[GET /api/zones] Iniciando petición...')
console.log('[GET /api/zones] ✅ Usuario autenticado:', user.id)
console.log('[GET /api/zones] ✅ Zonas obtenidas:', zones?.length || 0)

// ✅ DESPUÉS
// Eliminar completamente o migrar a logger.debug() si es crítico
```

#### 2. Limpiar Páginas
**Archivos**:
- `app/dashboard/page.tsx` (11 console.log → eliminar)
- `app/menu/page.tsx` (5 console.log → eliminar)

**Acción**:
```typescript
// ❌ ANTES (dashboard/page.tsx)
console.log('🔍 Dashboard useEffect ejecutado', { ... })
console.log('📊 Cargando métricas para tenant:', user.tenant_id)
console.log('✅ Métricas cargadas:', data)

// ✅ DESPUÉS
// Eliminar todos los console.log de debugging
```

#### 3. Script de Limpieza
```bash
# Crear script para encontrar console.log restantes
# scripts/check-console-logs.sh

#!/bin/bash
echo "Buscando console.log en producción..."
grep -r "console.log" app/ --include="*.ts" --include="*.tsx" | grep -v "node_modules"
```

### ✅ Criterio de Éxito
- [ ] 0 console.log en `app/api/**/*.ts`
- [ ] 0 console.log en `app/**/page.tsx` (excepto comentados)
- [ ] console.error permitido solo en bloques catch críticos
- [ ] Script de verificación pasa sin warnings

---

## 🔧 PRIORIDAD 2: ADOPTAR LOGGER ESTRUCTURADO (CRÍTICO)

### 🎯 Objetivo
Usar el logger estructurado existente en lugar de console.log/error directo.

### 📊 Alcance
- **Archivos afectados**: 20+
- **Tiempo estimado**: 3 horas
- **Impacto**: Alto (logs estructurados)
- **Complejidad**: Media

### 📝 Implementación Paso a Paso

#### Paso 1: Migrar API Routes a Logger

**Archivo**: `app/api/zones/route.ts`

```typescript
// ✅ AÑADIR al inicio
import { createLogger } from '@/lib/logger'

const logger = createLogger('api:zones')

// ✅ REEMPLAZAR en funciones
export async function GET(request: Request) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      logger.warn('Unauthenticated access attempt')
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const tenantId = getTenantIdFromUser(user)
    if (!tenantId) {
      logger.error('User without tenant_id', undefined, { userId: user.id })
      return NextResponse.json({ error: 'No tenant' }, { status: 400 })
    }

    const supabase = createServerClient()
    const { data: zones, error } = await supabase
      .from('zones')
      .select('*')
      .eq('tenant_id', tenantId)
      .eq('active', true)
      .order('sort_order', { ascending: true })

    if (error) {
      logger.error('Failed to fetch zones', error, { tenantId })
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    logger.info('Zones fetched successfully', { 
      tenantId, 
      count: zones?.length || 0 
    })

    return NextResponse.json({ data: zones })
  } catch (error) {
    logger.error('Unexpected error in GET /api/zones', error as Error)
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}
```

#### Paso 2: Migrar Contexts

**Archivo**: `contexts/auth-context.tsx`

```typescript
// ✅ AÑADIR
import { createLogger } from '@/lib/logger'

const logger = createLogger('auth-context')

// ✅ REEMPLAZAR
// ❌ console.warn('[loadUserData] No access token found...')
logger.warn('No access token found, relying on cookies only', {
  hasSession: !!session
})

// ❌ console.warn('[loadUserData] Timeout de 10 segundos alcanzado')
logger.warn('User data load timeout', {
  timeout: 10000,
  userId: session?.user?.id
})
```

#### Paso 3: Migrar Hooks

**Archivo**: `app/pedidos/_hooks/use-orders-panel.ts`

```typescript
import { createLogger } from '@/lib/logger'

const logger = createLogger('orders-panel')

// ✅ REEMPLAZAR
catch (error) {
  // ❌ console.error("[useOrdersPanel]", error)
  logger.error('Failed to load orders', error as Error, {
    tableId,
    filters: activeFilters
  })
}
```

### 📦 Template de Logger por Módulo

```typescript
// Template para nuevos archivos
import { createLogger } from '@/lib/logger'

// Nombrar según el módulo (kebab-case)
const logger = createLogger('module-name')

// Uso en funciones
try {
  // Operación
  logger.info('Operation successful', { data })
} catch (error) {
  logger.error('Operation failed', error as Error, { context })
  throw error
}
```

### ✅ Criterio de Éxito
- [ ] Todos los API routes usan logger
- [ ] Contexts críticos usan logger
- [ ] Hooks principales usan logger
- [ ] Formato consistente en todos los logs
- [ ] Contexto rico en logs de error

---

## 🚨 PRIORIDAD 3: INTEGRAR ERROR TRACKING (CRÍTICO)

### 🎯 Objetivo
Capturar y reportar errores automáticamente con Sentry.

### 📊 Alcance
- **Servicio**: Sentry (recomendado)
- **Tiempo estimado**: 2 horas
- **Impacto**: Muy Alto (visibilidad de errores)
- **Complejidad**: Media

### 🔧 Implementación con Sentry

#### Paso 1: Instalación
```bash
npm install @sentry/nextjs
npx @sentry/wizard@latest -i nextjs
```

Esto creará automáticamente:
- `sentry.client.config.ts`
- `sentry.server.config.ts`
- `sentry.edge.config.ts`
- Actualizará `next.config.js`

#### Paso 2: Configuración Básica

**Archivo**: `sentry.client.config.ts`
```typescript
import * as Sentry from "@sentry/nextjs"

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  
  // Performance Monitoring
  tracesSampleRate: 1.0, // 100% en desarrollo, 0.1 en producción
  
  // Session Replay
  replaysSessionSampleRate: 0.1, // 10% de sesiones normales
  replaysOnErrorSampleRate: 1.0, // 100% cuando hay error
  
  integrations: [
    new Sentry.BrowserTracing({
      tracePropagationTargets: [
        "localhost",
        /^https:\/\/yourapp\.com/
      ],
    }),
    new Sentry.Replay({
      maskAllText: true,
      blockAllMedia: true,
    }),
  ],
  
  environment: process.env.NODE_ENV,
  
  // Filtrar errores conocidos
  ignoreErrors: [
    'ResizeObserver loop limit exceeded',
    'Non-Error promise rejection captured',
  ],
  
  // Enriquecer contexto
  beforeSend(event, hint) {
    // Añadir contexto custom
    if (event.user) {
      event.user = {
        ...event.user,
        tenant_id: localStorage.getItem('tenant_id')
      }
    }
    return event
  }
})
```

**Archivo**: `sentry.server.config.ts`
```typescript
import * as Sentry from "@sentry/nextjs"

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  tracesSampleRate: 1.0,
  environment: process.env.NODE_ENV,
  
  // Server-specific config
  debug: false,
})
```

#### Paso 3: Variables de Entorno

**Archivo**: `.env.local`
```env
# Sentry Configuration
NEXT_PUBLIC_SENTRY_DSN=https://your-dsn@sentry.io/project-id
SENTRY_AUTH_TOKEN=your-auth-token
SENTRY_ORG=your-org
SENTRY_PROJECT=restaurant-management
```

#### Paso 4: Mejorar Error Boundary

**Archivo**: `components/error-boundary.tsx`
```typescript
"use client"

import { Component, type ReactNode, type ErrorInfo } from "react"
import * as Sentry from "@sentry/nextjs"
import { createLogger } from "@/lib/logger"

const logger = createLogger('error-boundary')

interface Props {
  children: ReactNode
  fallback?: ReactNode
}

interface State {
  hasError: boolean
  error?: Error
  errorInfo?: ErrorInfo
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = { hasError: false }
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    // ✅ Log estructurado
    logger.error('React error boundary caught error', error, {
      componentStack: errorInfo.componentStack,
      route: typeof window !== 'undefined' ? window.location.pathname : 'unknown',
    })

    // ✅ Enviar a Sentry con contexto completo
    Sentry.withScope((scope) => {
      scope.setContext('react', {
        componentStack: errorInfo.componentStack,
      })
      scope.setContext('location', {
        pathname: typeof window !== 'undefined' ? window.location.pathname : 'unknown',
        search: typeof window !== 'undefined' ? window.location.search : '',
      })
      Sentry.captureException(error)
    })

    this.setState({ errorInfo })
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback
      }

      return (
        <div className="flex items-center justify-center min-h-[400px] p-4">
          <Card className="w-full max-w-md">
            <CardHeader className="text-center">
              <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-destructive/10">
                <AlertTriangle className="h-6 w-6 text-destructive" />
              </div>
              <CardTitle>Algo salió mal</CardTitle>
              <CardDescription>
                Ha ocurrido un error inesperado. Nuestro equipo ha sido notificado.
              </CardDescription>
            </CardHeader>
            <CardContent className="text-center space-y-2">
              <Button 
                onClick={() => window.location.reload()} 
                className="w-full"
              >
                <RefreshCw className="mr-2 h-4 w-4" />
                Recargar página
              </Button>
              
              {process.env.NODE_ENV === 'development' && this.state.error && (
                <details className="mt-4 text-left">
                  <summary className="cursor-pointer text-sm text-muted-foreground">
                    Detalles técnicos
                  </summary>
                  <pre className="mt-2 text-xs bg-muted p-2 rounded overflow-auto">
                    {this.state.error.toString()}
                    {this.state.errorInfo?.componentStack}
                  </pre>
                </details>
              )}
            </CardContent>
          </Card>
        </div>
      )
    }

    return this.props.children
  }
}
```

#### Paso 5: Usar Error Boundary en Layout

**Archivo**: `app/layout.tsx`
```typescript
import { ErrorBoundary } from '@/components/error-boundary'

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es">
      <body>
        <ErrorBoundary>
          {children}
        </ErrorBoundary>
      </body>
    </html>
  )
}
```

#### Paso 6: Captura Manual en API Routes

```typescript
import * as Sentry from "@sentry/nextjs"
import { createLogger } from '@/lib/logger'

const logger = createLogger('api:example')

export async function POST(request: Request) {
  try {
    // Operación
  } catch (error) {
    // Log estructurado
    logger.error('API operation failed', error as Error, {
      method: request.method,
      url: request.url
    })

    // Enviar a Sentry con contexto
    Sentry.withScope((scope) => {
      scope.setContext('request', {
        method: request.method,
        url: request.url,
      })
      Sentry.captureException(error)
    })

    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}
```

### 📊 Configurar Alertas en Sentry

1. **Email notifications**: Errores nuevos o picos de frecuencia
2. **Slack integration**: Canal #alerts para errores críticos
3. **Issue assignment**: Auto-asignar por módulo/ruta
4. **Release tracking**: Asociar errores con versiones

### ✅ Criterio de Éxito
- [ ] Sentry instalado y configurado
- [ ] Source maps funcionando (ver stack traces correctos)
- [ ] Error boundary enviando a Sentry
- [ ] API routes capturando excepciones
- [ ] Alertas configuradas para errores críticos
- [ ] Contexto de usuario en errores (tenant_id, etc.)

---

## 📊 PRIORIDAD 4: MONITOREO DE LOGS (IMPORTANTE)

### 🎯 Objetivo
Implementar sistema de logs centralizado para producción.

### 📊 Alcance
- **Servicio**: Logtail o similar
- **Tiempo estimado**: 3 horas
- **Impacto**: Alto (observabilidad)
- **Complejidad**: Media

### 🔧 Implementación con Logtail

#### Paso 1: Instalación
```bash
npm install @logtail/node @logtail/next
```

#### Paso 2: Extender Logger Existente

**Archivo**: `lib/logger.ts` (modificar)
```typescript
import { Logtail } from "@logtail/node"

// Inicializar Logtail solo en producción
const logtail = process.env.NODE_ENV === 'production' && process.env.LOGTAIL_TOKEN
  ? new Logtail(process.env.LOGTAIL_TOKEN)
  : null

class Logger {
  private write(entry: LogEntry): void {
    if (!this.shouldLog(entry.level)) {
      return
    }

    // Console output (desarrollo)
    if (process.env.NODE_ENV !== 'production') {
      const output = this.format(entry)
      console[entry.level](output)
    }

    // Logtail (producción)
    if (logtail) {
      const logData = {
        message: entry.message,
        level: entry.level,
        module: this.config.moduleName,
        timestamp: entry.timestamp,
        ...entry.context,
      }

      if (entry.error) {
        logData.error = {
          name: entry.error.name,
          message: entry.error.message,
          stack: entry.error.stack,
        }
      }

      logtail[entry.level](logData)
    }
  }
}
```

#### Paso 3: Variables de Entorno

**Archivo**: `.env.local`
```env
# Logtail Configuration
LOGTAIL_TOKEN=your-logtail-token-here
```

#### Paso 4: Flush en Server Shutdown

**Archivo**: `lib/logger.ts` (añadir)
```typescript
// Asegurar que logs se envíen antes de shutdown
if (logtail && typeof process !== 'undefined') {
  process.on('beforeExit', async () => {
    await logtail.flush()
  })
}

export async function flushLogs(): Promise<void> {
  if (logtail) {
    await logtail.flush()
  }
}
```

#### Paso 5: Configurar Dashboards en Logtail

1. **Dashboard de Errores**:
   - Gráfico de errores por hora
   - Top 10 errores más frecuentes
   - Errores por módulo

2. **Dashboard de Performance**:
   - Logs de operaciones lentas
   - Requests por minuto
   - Latencia de API routes

3. **Dashboard de Usuarios**:
   - Logins por día
   - Errores por tenant
   - Actividad por usuario

#### Paso 6: Configurar Alertas

```sql
-- Query para alertas en Logtail
-- Alerta: Más de 10 errores en 5 minutos
SELECT COUNT(*) as error_count
FROM logs
WHERE level = 'error'
  AND dt > NOW() - INTERVAL '5 minutes'
HAVING error_count > 10

-- Alerta: Error en pago
SELECT *
FROM logs
WHERE level = 'error'
  AND message LIKE '%payment%'
  AND dt > NOW() - INTERVAL '1 minute'

-- Alerta: Usuario sin tenant_id
SELECT *
FROM logs
WHERE message LIKE '%No tenant%'
  AND dt > NOW() - INTERVAL '5 minutes'
```

### ✅ Criterio de Éxito
- [ ] Logtail integrado en logger
- [ ] Logs fluyendo a Logtail en producción
- [ ] Dashboards creados (errores, performance, usuarios)
- [ ] Alertas configuradas para eventos críticos
- [ ] Retention configurado (30 días mínimo)

---

## 📋 TIMELINE DE IMPLEMENTACIÓN

### Semana 1: Críticos (Prioridad 1 y 2)
```
Día 1-2: Limpieza de console.log (2h)
  ├─ Limpiar API routes
  ├─ Limpiar páginas
  └─ Script de verificación

Día 3-4: Adoptar logger estructurado (3h)
  ├─ Migrar API routes
  ├─ Migrar contexts
  ├─ Migrar hooks
  └─ Verificar consistency
```

### Semana 2: Error Tracking (Prioridad 3)
```
Día 1: Setup Sentry (2h)
  ├─ Instalación y configuración
  ├─ Variables de entorno
  └─ Verificar funcionamiento

Día 2: Integración completa (2h)
  ├─ Mejorar error boundary
  ├─ Añadir a API routes
  ├─ Configurar alertas
  └─ Testing
```

### Semana 3: Monitoreo (Prioridad 4)
```
Día 1-2: Setup Logtail (3h)
  ├─ Instalación
  ├─ Extender logger
  ├─ Variables de entorno
  └─ Verificar flujo de logs

Día 3: Dashboards y Alertas (2h)
  ├─ Crear dashboards
  ├─ Configurar alertas
  └─ Documentar queries
```

---

## 💰 ESTIMACIÓN DE COSTOS

### Sentry (Error Tracking)
```
Free Tier:
- 5,000 errors/mes
- 10,000 performance units/mes
- 30 días de retención
- ✅ Suficiente para MVP

Team Plan ($26/mes):
- 50,000 errors/mes
- 100,000 performance units/mes
- 90 días de retención
- Recommended para producción
```

### Logtail (Log Management)
```
Free Tier:
- 1 GB/mes
- 3 días de retención
- ⚠️ Limitado

Starter ($7/mes):
- 5 GB/mes
- 7 días de retención
- ✅ Suficiente para MVP

Growth ($25/mes):
- 25 GB/mes
- 30 días de retención
- Recommended para producción
```

### Total Mensual
```
MVP (Free tiers): $0/mes
Producción (Sentry Team + Logtail Growth): ~$50/mes

ROI: Ahorro de 10-20 horas/mes en debugging = $500-1000/mes
```

---

## 📊 MÉTRICAS DE ÉXITO

### KPIs Técnicos
```
Antes:
❌ Console.log en producción: 15+ archivos
❌ Errores sin tracking: 100%
❌ MTTR: 2-4 horas
❌ Detección de errores: Reactiva (usuarios reportan)

Después:
✅ Console.log en producción: 0 archivos
✅ Errores con tracking: 100%
✅ MTTR: 15-30 minutos
✅ Detección de errores: Proactiva (alertas automáticas)
```

### KPIs de Negocio
```
✅ Reducción 80% en tiempo de soporte
✅ Incremento en satisfacción de usuarios
✅ Detección temprana de problemas críticos
✅ Datos para mejora continua
```

---

## ✅ CHECKLIST FINAL

### Pre-Producción (Obligatorio)
- [ ] Console.log eliminados de producción
- [ ] Logger estructurado adoptado
- [ ] Sentry instalado y funcionando
- [ ] Error boundary mejorado
- [ ] Source maps configurados

### Producción (Recomendado)
- [ ] Logtail o similar integrado
- [ ] Dashboards configurados
- [ ] Alertas funcionando
- [ ] Documentación de runbooks
- [ ] Proceso de on-call definido

### Post-Lanzamiento (Opcional)
- [ ] APM (Application Performance Monitoring)
- [ ] Distributed tracing
- [ ] Custom metrics
- [ ] Automated incident response

---

## 🎯 CONCLUSIÓN

### Implementación Mínima (MVP)
```
✅ Limpieza console.log (2h)
✅ Adoptar logger (3h)
✅ Sentry básico (2h)

Total: 7 horas
Costo: $0/mes (free tiers)
```

### Implementación Recomendada (Producción)
```
✅ Todo lo anterior
✅ Logtail integrado (3h)
✅ Dashboards y alertas (2h)

Total: 12 horas
Costo: ~$50/mes
ROI: 10-20x en ahorro de tiempo
```

### Prioridad de Implementación
1. 🔴 **CRÍTICO**: Limpieza console.log + Logger
2. 🔴 **CRÍTICO**: Sentry para error tracking
3. 🟡 **IMPORTANTE**: Logtail para logs
4. 🟢 **NICE TO HAVE**: APM y métricas avanzadas

---

**Próximo Paso**: ¿Quieres que implemente alguna de estas mejoras ahora o continuamos con la Fase 5.6 (Documentación)?
