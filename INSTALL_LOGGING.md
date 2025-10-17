# 🚀 INSTRUCCIONES DE INSTALACIÓN - LOGGING Y ERROR TRACKING

**Fecha**: 17 de octubre, 2025  
**Estado**: LISTO PARA EJECUTAR

---

## ⚠️ IMPORTANTE: DETENER SERVIDOR PRIMERO

Antes de instalar, **detén el servidor de desarrollo** (Ctrl+C en la terminal donde corre `npm run dev`).

---

## 📦 PASO 1: INSTALAR PAQUETES

Ejecuta en la terminal (con el servidor detenido):

```bash
npm install --save @sentry/nextjs @logtail/node @logtail/next
```

**Paquetes a instalar**:
- `@sentry/nextjs`: Error tracking y performance monitoring
- `@logtail/node`: Log management para producción
- `@logtail/next`: Integración Next.js para Logtail

**Tiempo estimado**: 1-2 minutos

---

## 🔧 PASO 2: CONFIGURAR SENTRY

### Opción A: Wizard Automático (Recomendado)
```bash
npx @sentry/wizard@latest -i nextjs
```

Esto creará automáticamente:
- `sentry.client.config.ts`
- `sentry.server.config.ts`
- `sentry.edge.config.ts`
- Actualizará `next.config.mjs`

### Opción B: Manual
Si el wizard falla, los archivos ya están creados en:
- `/sentry.client.config.ts`
- `/sentry.server.config.ts`
- `/sentry.edge.config.ts`

---

## 🔑 PASO 3: VARIABLES DE ENTORNO

Añade a tu `.env.local`:

```env
# ===================================
# SENTRY CONFIGURATION
# ===================================
# Get your DSN from: https://sentry.io/settings/projects/
NEXT_PUBLIC_SENTRY_DSN=https://YOUR_DSN_HERE@sentry.io/YOUR_PROJECT_ID

# Auth token for uploading source maps (optional for dev)
SENTRY_AUTH_TOKEN=your-auth-token-here

# Organization and project
SENTRY_ORG=your-org-name
SENTRY_PROJECT=restaurant-digital

# ===================================
# LOGTAIL CONFIGURATION  
# ===================================
# Get your token from: https://betterstack.com/logs
LOGTAIL_SOURCE_TOKEN=your-logtail-token-here
```

### Cómo Obtener las Credenciales

#### Sentry DSN (Gratis):
1. Ve a https://sentry.io/signup/
2. Crea una cuenta (free tier incluye 5,000 errores/mes)
3. Crea un nuevo proyecto → Selecciona "Next.js"
4. Copia el DSN que aparece

#### Logtail Token (Opcional - Gratis):
1. Ve a https://betterstack.com/logs
2. Crea una cuenta (free tier incluye 1GB/mes)
3. Crea un nuevo source → Selecciona "Node.js"
4. Copia el source token

---

## ✅ PASO 4: VERIFICAR INSTALACIÓN

Una vez instalado y configurado:

```bash
# Reiniciar servidor
npm run dev

# Debería compilar sin errores
# Busca en los logs:
✓ Compiled in Xms
```

---

## 🧪 PASO 5: PROBAR ERROR TRACKING

### Test 1: Probar Error Boundary

Ve a cualquier página y en DevTools console ejecuta:
```javascript
throw new Error('Test error from console')
```

Deberías ver:
1. Error boundary mostrando UI de error
2. Error enviado a Sentry (si configurado)
3. Error logueado estructuradamente

### Test 2: Probar Logger

Crea una zona o mesa y revisa logs en terminal:
```
[2025-10-17T...][INFO] Zonas obtenidas {"count":4,"duration":"519ms",...}
```

---

## 📊 ESTADO DE ARCHIVOS

### ✅ Archivos Ya Creados
- `/sentry.client.config.ts` - Configuración Sentry cliente
- `/sentry.server.config.ts` - Configuración Sentry servidor
- `/sentry.edge.config.ts` - Configuración Sentry edge
- `/components/error-boundary.tsx` - Error boundary mejorado
- `/lib/logger.ts` - Logger extendido con Logtail
- `/app/api/zones/route.ts` - API route con logger
- `/contexts/auth-context.tsx` - Context con logger
- `/app/dashboard/page.tsx` - Página limpia sin console.log
- `/app/menu/page.tsx` - Página limpia sin console.log

### ⏳ Pendiente de Instalación
- Paquetes npm (Sentry, Logtail)
- Variables de entorno (.env.local)

---

## 🎯 SIGUIENTE PASO

Una vez instalado todo:

```bash
# 1. Detener servidor (Ctrl+C)
# 2. Instalar paquetes (comando arriba)
# 3. Configurar .env.local (copiar template)
# 4. Reiniciar servidor (npm run dev)
# 5. Probar error tracking (test arriba)
```

**Luego continúa con**:
- Fase 5.6.8: Documentación final
- Fase 5.7: Code review final

---

## ❓ TROUBLESHOOTING

### Error: "Cannot find module '@sentry/nextjs'"
```bash
# Solución: Instalar dependencias
npm install --save @sentry/nextjs
```

### Error: "SENTRY_DSN is not defined"
```bash
# Solución: Configurar .env.local
# El DSN es opcional para desarrollo
# La app funcionará sin él (logs solo a consola)
```

### Warning: "Source maps not configured"
```bash
# Solución: Ejecutar wizard o configurar manualmente
npx @sentry/wizard@latest -i nextjs
```

---

**¿Listo? Ejecuta los comandos arriba y avísame cuando termine la instalación!** 🚀
