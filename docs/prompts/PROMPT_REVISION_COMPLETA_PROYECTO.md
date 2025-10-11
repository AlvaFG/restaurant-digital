# 🔍 PROMPT: Revisión, Optimización y Reorganización Completa del Proyecto

**Fecha:** 11 de Octubre de 2025  
**Objetivo:** Realizar una auditoría integral del proyecto, optimizar servicios, internacionalizar a español, reorganizar documentación y preparar para la siguiente etapa de desarrollo.

---

## 📋 TABLA DE CONTENIDOS

1. [Revisión y Debug de Servicios](#1-revisión-y-debug-de-servicios)
2. [Optimización y Mejoras](#2-optimización-y-mejoras)
3. [Internacionalización a Español](#3-internacionalización-a-español)
4. [Reorganización de Documentación](#4-reorganización-de-documentación)
5. [Limpieza de Archivos Innecesarios](#5-limpieza-de-archivos-innecesarios)
6. [Verificación Final](#6-verificación-final)

---

## 1️⃣ REVISIÓN Y DEBUG DE SERVICIOS

### 1.1 Servicios Backend (lib/)

Revisar y corregir los siguientes archivos de servicios:

#### 📦 **Servicios Principales**
- `lib/auth.ts` - Servicio de autenticación con Supabase
- `lib/order-service.ts` - Gestión de pedidos
- `lib/table-service.ts` - Gestión de mesas
- `lib/payment-service.ts` - Procesamiento de pagos
- `lib/analytics-service.ts` - Análisis y métricas
- `lib/mercadopago.ts` - Integración MercadoPago
- `lib/socket.ts` - WebSocket y tiempo real
- `lib/mock-data.ts` - Datos de prueba

#### 🔍 **Puntos de Revisión**

**A. Manejo de Errores**
```typescript
// ❌ INCORRECTO: console.error sin estructura
console.error("[service] error", error)

// ✅ CORRECTO: Logger estructurado + manejo
logger.error('Error al procesar pedido', { 
  error: error.message,
  orderId,
  context: 'createOrder'
})
throw new AppError('No se pudo crear el pedido', 500)
```

**B. Validación de Datos**
- Validar todos los inputs con Zod o similar
- Sanitizar datos antes de enviar a la base de datos
- Verificar permisos y autorizaciones

**C. Gestión de Estados**
- Asegurar transiciones de estado válidas
- Implementar rollback en caso de error
- Logs claros de cambios de estado

**D. Performance**
- Identificar consultas N+1
- Implementar caching donde sea apropiado
- Optimizar queries a Supabase

**E. Tipado TypeScript**
- Eliminar `any` types
- Asegurar tipos completos en interfaces
- Usar tipos generados de Supabase

### 1.2 API Routes (app/api/)

Revisar todas las rutas API:

```
app/api/
├── alerts/
├── analytics/
├── auth/
├── menu/
├── orders/
├── payments/
├── qr/
├── tables/
└── users/
```

#### 🔍 **Checklist por Ruta**

- [ ] Autenticación y autorización implementada
- [ ] Validación de request body
- [ ] Manejo de errores consistente
- [ ] Status codes HTTP correctos
- [ ] Logs estructurados
- [ ] Rate limiting considerado
- [ ] Documentación de endpoints
- [ ] Tests unitarios presentes

### 1.3 Componentes React (components/)

Revisar componentes críticos:

#### 🎨 **Componentes de Negocio**
- `order-form.tsx` - Formulario de pedidos
- `orders-panel.tsx` - Panel de gestión
- `table-list.tsx` - Lista de mesas
- `salon-live-view.tsx` - Vista en tiempo real
- `payment-modal.tsx` - Modal de pagos
- `analytics-dashboard.tsx` - Dashboard de analítica

#### 🔍 **Puntos de Revisión**

**A. Performance**
- Usar `React.memo()` en componentes pesados
- Implementar `useMemo()` y `useCallback()` apropiadamente
- Lazy loading de componentes grandes
- Virtualización de listas largas

**B. Estado y Side Effects**
- Evitar re-renders innecesarios
- Cleanup de efectos (useEffect returns)
- Gestión correcta de loading states
- Error boundaries implementados

**C. Accesibilidad**
- Labels en todos los inputs
- ARIA attributes apropiados
- Navegación por teclado
- Contraste de colores adecuado

---

## 2️⃣ OPTIMIZACIÓN Y MEJORAS

### 2.1 Performance

#### 🚀 **Optimizaciones a Implementar**

**A. Bundle Size**
```typescript
// Implementar code splitting
const AnalyticsDashboard = dynamic(
  () => import('@/components/analytics-dashboard'),
  { loading: () => <LoadingSpinner />, ssr: false }
)
```

**B. Image Optimization**
- Usar Next.js Image component
- Formatos WebP/AVIF
- Lazy loading de imágenes

**C. Database Queries**
- Índices en columnas frecuentemente consultadas
- Uso de `select()` específico en lugar de `*`
- Paginación en listados grandes
- Caching con React Query o SWR

**D. API Response Times**
- Implementar caching de respuestas
- Usar Edge Functions donde sea apropiado
- Comprimir respuestas JSON

### 2.2 Seguridad

#### 🔒 **Checklist de Seguridad**

- [ ] Variables de entorno protegidas
- [ ] Secrets nunca en el código
- [ ] RLS (Row Level Security) habilitado en Supabase
- [ ] Sanitización de inputs
- [ ] CORS configurado correctamente
- [ ] Rate limiting en APIs públicas
- [ ] JWT tokens con expiración
- [ ] HTTPS en producción

### 2.3 Code Quality

#### 📝 **Estándares de Código**

**A. Linting**
```bash
npm run lint -- --fix
```

**B. Formateo**
```bash
npx prettier --write "**/*.{ts,tsx,js,jsx,json,md}"
```

**C. Type Checking**
```bash
npx tsc --noEmit
```

**D. Tests**
```bash
npm run test
npm run test:e2e
```

---

## 3️⃣ INTERNACIONALIZACIÓN A ESPAÑOL

### 3.1 Mensajes de Usuario

#### 📝 **Convertir TODOS los mensajes a español**

**A. Mensajes de Error**
```typescript
// ❌ ANTES
throw new Error("Failed to create order")

// ✅ DESPUÉS
throw new Error("No se pudo crear el pedido")
```

**B. Mensajes de Éxito**
```typescript
// ❌ ANTES
toast.success("Order created successfully")

// ✅ DESPUÉS
toast.success("Pedido creado exitosamente")
```

**C. Labels y Placeholders**
```typescript
// ❌ ANTES
<Input placeholder="Enter table number" />

// ✅ DESPUÉS
<Input placeholder="Ingrese número de mesa" />
```

**D. Validaciones**
```typescript
// ❌ ANTES
"Email is required"

// ✅ DESPUÉS
"El correo electrónico es requerido"
```

### 3.2 Archivos a Traducir

#### 📂 **Prioridad Alta**

**Components**
```
components/
├── login-form.tsx
├── order-form.tsx
├── orders-panel.tsx
├── payment-modal.tsx
├── users-management.tsx
├── configuration-panel.tsx
└── ui/ (todos los componentes)
```

**API Routes**
```
app/api/**/route.ts (todos los endpoints)
```

**Services**
```
lib/
├── auth.ts
├── order-service.ts
├── payment-service.ts
├── table-service.ts
└── analytics-service.ts
```

**Constants y Mensajes**
```typescript
// lib/constants.ts - Crear archivo de constantes en español
export const MENSAJES = {
  ERRORES: {
    GENERICO: "Ocurrió un error inesperado",
    AUTENTICACION: "Error de autenticación",
    PERMISO_DENEGADO: "No tienes permisos para esta acción",
    RECURSO_NO_ENCONTRADO: "Recurso no encontrado",
    VALIDACION: "Datos inválidos",
  },
  EXITO: {
    PEDIDO_CREADO: "Pedido creado exitosamente",
    MESA_ACTUALIZADA: "Mesa actualizada correctamente",
    PAGO_PROCESADO: "Pago procesado exitosamente",
  },
  INFO: {
    CARGANDO: "Cargando...",
    PROCESANDO: "Procesando...",
    SIN_DATOS: "No hay datos disponibles",
  }
}
```

### 3.3 Formato de Fechas y Números

```typescript
// utils/i18n.ts
export const formatearFecha = (fecha: Date): string => {
  return new Intl.DateTimeFormat('es-AR', {
    dateStyle: 'full',
    timeStyle: 'short'
  }).format(fecha)
}

export const formatearMoneda = (monto: number): string => {
  return new Intl.NumberFormat('es-AR', {
    style: 'currency',
    currency: 'ARS'
  }).format(monto)
}
```

---

## 4️⃣ REORGANIZACIÓN DE DOCUMENTACIÓN

### 4.1 Nueva Estructura de Documentación

#### 📁 **Crear estructura organizada en `/docs`**

```
docs/
├── README.md (índice principal)
├── 01-inicio/
│   ├── README.md
│   ├── instalacion.md
│   ├── configuracion.md
│   └── primeros-pasos.md
├── 02-arquitectura/
│   ├── README.md
│   ├── estructura-proyecto.md
│   ├── patron-diseno.md
│   ├── base-datos.md
│   └── autenticacion.md
├── 03-desarrollo/
│   ├── README.md
│   ├── guia-desarrollo.md
│   ├── convenciones-codigo.md
│   ├── testing.md
│   └── debugging.md
├── 04-features/
│   ├── README.md
│   ├── gestion-pedidos.md
│   ├── sistema-mesas.md
│   ├── codigo-qr.md
│   ├── pagos.md
│   └── analytics.md
├── 05-api/
│   ├── README.md
│   ├── autenticacion.md
│   ├── pedidos.md
│   ├── mesas.md
│   ├── menu.md
│   ├── pagos.md
│   └── analytics.md
├── 06-despliegue/
│   ├── README.md
│   ├── configuracion-produccion.md
│   ├── variables-entorno.md
│   └── monitoreo.md
├── 07-historico/
│   ├── README.md
│   ├── changelog.md
│   ├── migraciones/
│   └── sesiones-desarrollo/
└── 08-referencias/
    ├── README.md
    ├── glosario.md
    ├── recursos.md
    └── troubleshooting.md
```

### 4.2 Migración de Documentos Existentes

#### 📋 **Mapeo de archivos actuales a nueva estructura**

**Raíz del proyecto → docs/01-inicio/**
- `README.md` → mantener en raíz + copia mejorada en docs/
- `CONTRIBUTING.md` → `docs/03-desarrollo/guia-contribucion.md`
- `CHANGELOG.md` → `docs/07-historico/changelog.md`

**Documentos de configuración → docs/01-inicio/**
- `PROJECT_OVERVIEW.md` → `docs/02-arquitectura/vision-general.md`
- `PROJECT_GUIDELINES.md` → `docs/03-desarrollo/convenciones-codigo.md`
- `AGENTS.md` → `docs/08-referencias/guia-agentes.md`

**Documentos de estado → docs/07-historico/**
- `RESUMEN_REORGANIZACION.md` → `docs/07-historico/reorganizacion-2025.md`
- `REPORTE_AUDITORIA_COMPLETA.md` → `docs/07-historico/auditoria-completa.md`
- Todos los `SESSION-SUMMARY-*.md` → `docs/07-historico/sesiones-desarrollo/`

**Documentos técnicos → docs/ según categoría**
- `docs/database/*.md` → `docs/02-arquitectura/base-datos/`
- `docs/payments/*.md` → `docs/04-features/pagos/`
- `docs/api/*.md` → `docs/05-api/`
- `docs/features/*.md` → `docs/04-features/`

### 4.3 Documentos a Crear

#### 📝 **Documentación faltante crítica**

1. **docs/README.md** - Índice maestro con links a todas las secciones

2. **docs/01-inicio/instalacion.md**
```markdown
# Guía de Instalación

## Requisitos Previos
- Node.js 18+
- npm o pnpm
- Cuenta de Supabase

## Pasos de Instalación
1. Clonar repositorio
2. Instalar dependencias
3. Configurar variables de entorno
4. Ejecutar migraciones
5. Iniciar servidor de desarrollo

[Contenido detallado...]
```

3. **docs/02-arquitectura/estructura-proyecto.md**
- Explicación de cada directorio
- Convenciones de nombrado
- Flujo de datos

4. **docs/05-api/README.md**
- Lista completa de endpoints
- Autenticación requerida
- Ejemplos de uso
- Respuestas y errores

5. **docs/08-referencias/troubleshooting.md**
- Problemas comunes y soluciones
- FAQ
- Contactos de soporte

---

## 5️⃣ LIMPIEZA DE ARCHIVOS INNECESARIOS

### 5.1 Identificar Archivos Obsoletos

#### 🗑️ **Categorías de archivos a revisar**

**A. Documentación Duplicada**
- Archivos `.md` con contenido repetido
- Documentos obsoletos de iteraciones anteriores
- Session summaries muy antiguos (> 3 meses)

**B. Código No Utilizado**
```bash
# Buscar exports no utilizados
npx ts-unused-exports tsconfig.json

# Buscar imports no utilizados
npx eslint . --ext .ts,.tsx --fix
```

**C. Archivos de Configuración Temporales**
- `.tmp/` completo
- Archivos de cache
- Logs locales

**D. Assets No Utilizados**
- Imágenes no referenciadas
- Iconos duplicados
- Fuentes no usadas

### 5.2 Carpetas a Limpiar

#### 📂 **Revisión por carpeta**

**.codex/**
- Mantener solo configuración activa
- Archivar agentes no utilizados
- Eliminar workflows deprecados

**docs/archive/**
- Revisar qué es realmente necesario mantener
- Mover a `docs/07-historico/` lo relevante
- Eliminar lo obsoleto

**tests/**
- Eliminar tests rotos sin funcionalidad asociada
- Actualizar tests obsoletos
- Mantener solo tests relevantes

**data/**
- Limpiar stores de prueba viejos
- Mantener solo datos seed necesarios

### 5.3 Criterios de Eliminación

#### ✅ **Mantener SI:**
- Está referenciado en código activo
- Documenta decisiones arquitectónicas importantes
- Es necesario para onboarding de nuevos desarrolladores
- Contiene configuración activa del proyecto

#### ❌ **Eliminar SI:**
- No se ha modificado en > 6 meses
- Es un duplicado exacto de otro archivo
- Contiene información obsoleta o incorrecta
- Nadie en el equipo sabe para qué sirve
- Es un archivo temporal o de testing manual

### 5.4 Plan de Limpieza

```bash
# 1. Crear backup antes de eliminar
git checkout -b cleanup/pre-deletion-backup

# 2. Identificar archivos grandes no necesarios
npx npkill  # Limpiar node_modules duplicados

# 3. Eliminar archivos específicos
rm -rf .tmp/
rm -rf .next/

# 4. Limpiar documentación obsoleta
# (revisar manualmente cada archivo en docs/archive/)

# 5. Commit de limpieza
git add .
git commit -m "chore: limpieza de archivos obsoletos e innecesarios"
```

---

## 6️⃣ VERIFICACIÓN FINAL

### 6.1 Checklist de Completitud

#### ✅ **Pre-Deploy Checklist**

**Código**
- [ ] Todos los servicios revisados y optimizados
- [ ] Manejo de errores consistente en toda la app
- [ ] Logs estructurados implementados
- [ ] Tests pasando al 100%
- [ ] Sin warnings de TypeScript
- [ ] Sin warnings de ESLint

**Internacionalización**
- [ ] Todos los mensajes en español
- [ ] Fechas y números formateados correctamente
- [ ] Validaciones en español
- [ ] Emails/notificaciones en español
- [ ] Documentación de código en español

**Documentación**
- [ ] Nueva estructura implementada
- [ ] Documentos migrados correctamente
- [ ] README principal actualizado
- [ ] API docs completa
- [ ] Guías de troubleshooting creadas

**Limpieza**
- [ ] Archivos obsoletos eliminados
- [ ] Carpetas organizadas
- [ ] Sin archivos duplicados
- [ ] .gitignore actualizado
- [ ] Dependencias limpiadas

**Performance**
- [ ] Bundle size optimizado
- [ ] Lazy loading implementado
- [ ] Imágenes optimizadas
- [ ] Database queries optimizadas
- [ ] Caching implementado

**Seguridad**
- [ ] Variables de entorno en .env.example
- [ ] Secrets protegidos
- [ ] RLS configurado
- [ ] CORS configurado
- [ ] Rate limiting implementado

### 6.2 Tests de Integración

```bash
# 1. Verificar que el proyecto compila
npm run build

# 2. Ejecutar linter
npm run lint

# 3. Ejecutar tests unitarios
npm run test

# 4. Ejecutar tests E2E
npm run test:e2e

# 5. Verificar tipos
npx tsc --noEmit

# 6. Analizar bundle
npm run build -- --analyze
```

### 6.3 Documentación de Cambios

#### 📝 **Crear documento resumen**

**docs/07-historico/revision-completa-2025-10-11.md**
```markdown
# Revisión Completa del Proyecto - 11 de Octubre 2025

## Resumen Ejecutivo
[Descripción general de los cambios]

## Servicios Optimizados
- auth.ts: [cambios realizados]
- order-service.ts: [cambios realizados]
- payment-service.ts: [cambios realizados]
[...]

## Internacionalización
- Mensajes traducidos: X
- Componentes actualizados: Y
- Archivos modificados: Z

## Reorganización de Documentación
- Archivos migrados: X
- Documentos nuevos: Y
- Archivos eliminados: Z

## Archivos Eliminados
[Lista con justificación]

## Mejoras de Performance
[Métricas antes/después]

## Próximos Pasos
[Recomendaciones para la siguiente etapa]
```

### 6.4 Git y Version Control

```bash
# 1. Crear rama para esta revisión
git checkout -b feature/revision-completa-2025-10

# 2. Commits organizados
git add lib/
git commit -m "refactor(services): optimizar y traducir servicios a español"

git add components/
git commit -m "refactor(components): optimizar y traducir componentes a español"

git add docs/
git commit -m "docs: reorganizar estructura de documentación"

git add .
git commit -m "chore: eliminar archivos obsoletos e innecesarios"

# 3. Push y crear PR
git push origin feature/revision-completa-2025-10
```

---

## 🎯 CRITERIOS DE ÉXITO

### Resultados Esperados

1. **✅ Código Limpio y Optimizado**
   - 0 errores de TypeScript
   - 0 warnings de ESLint
   - Code coverage > 80%
   - Bundle size reducido en > 20%

2. **✅ Completamente en Español**
   - 100% de mensajes de usuario en español
   - Documentación en español
   - Comentarios de código en español
   - Logs y errores en español

3. **✅ Documentación Profesional**
   - Estructura clara y navegable
   - Guías completas de instalación y uso
   - API docs exhaustiva
   - Troubleshooting documentado

4. **✅ Proyecto Organizado**
   - Sin archivos duplicados
   - Sin código muerto
   - Dependencias actualizadas
   - Git history limpio

5. **✅ Performance Mejorada**
   - Tiempo de carga < 2s
   - First Contentful Paint < 1s
   - Time to Interactive < 3s
   - Lighthouse score > 90

6. **✅ Listo para Producción**
   - Todos los tests pasando
   - Configuración de producción lista
   - Variables de entorno documentadas
   - Monitoreo configurado

---

## 🚀 SIGUIENTE ETAPA

Una vez completada esta revisión, el proyecto estará listo para:

1. **Deploy a Staging**: Ambiente de pruebas con datos reales
2. **Testing de Usuario**: Pruebas con usuarios finales
3. **Optimización Final**: Ajustes basados en feedback
4. **Deploy a Producción**: Lanzamiento oficial
5. **Monitoreo y Mantenimiento**: Operación continua

---

## 📚 RECURSOS Y REFERENCIAS

### Documentación Técnica
- [Next.js 14 Docs](https://nextjs.org/docs)
- [Supabase Docs](https://supabase.com/docs)
- [React Best Practices](https://react.dev/)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)

### Herramientas de Calidad
- [ESLint](https://eslint.org/)
- [Prettier](https://prettier.io/)
- [Vitest](https://vitest.dev/)
- [Playwright](https://playwright.dev/)

### Performance
- [Web Vitals](https://web.dev/vitals/)
- [Lighthouse CI](https://github.com/GoogleChrome/lighthouse-ci)
- [Bundle Analyzer](https://www.npmjs.com/package/@next/bundle-analyzer)

---

**Preparado por:** GitHub Copilot  
**Fecha:** 11 de Octubre de 2025  
**Versión:** 1.0  
**Estado:** Listo para Implementación
