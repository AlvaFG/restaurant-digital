# 🧪 Guía de Testing - Fase 6 PWA

Esta guía explica cómo ejecutar todos los tests implementados para la funcionalidad PWA y offline del sistema de gestión de restaurantes.

## 📋 Tabla de Contenidos

- [Requisitos Previos](#requisitos-previos)
- [Tests Unitarios](#tests-unitarios)
- [Tests E2E de PWA](#tests-e2e-de-pwa)
- [Lighthouse Audit](#lighthouse-audit)
- [CI/CD Integration](#cicd-integration)
- [Troubleshooting](#troubleshooting)

---

## 📦 Requisitos Previos

### Instalación de Dependencias
```powershell
# Instalar todas las dependencias
npm install

# Verificar que Playwright está instalado
npx playwright install

# Verificar que Lighthouse está disponible
npm list lighthouse
```

### Variables de Entorno
```bash
# .env.local
NEXT_PUBLIC_SUPABASE_URL=tu_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=tu_anon_key
SUPABASE_SERVICE_ROLE_KEY=tu_service_key

# Para Lighthouse CI
LIGHTHOUSE_URL=http://localhost:3000
```

---

## 🧪 Tests Unitarios

### Ejecutar Todos los Tests
```powershell
# Ejecutar todos los tests unitarios
npm test

# Output esperado:
# ✓ tests/service-worker.test.ts (29 tests)
# ✓ tests/db/sync-manager.test.ts (65+ tests)
# ✓ tests/push/push-manager.test.ts (17 tests)
# Total: 111+ tests passing
```

### Tests de Sync Manager (T2.6)
```powershell
# Ejecutar solo tests de sincronización
npm run test:sync

# Output esperado:
# ✓ Sync Queue Management
#   ✓ should add item to queue with priority
#   ✓ should sort by priority (high > medium > low)
#   ✓ should sort by timestamp within same priority
#   ✓ should exclude items with max retries
#   ... (65+ tests)
# 
# Test Suites: 1 passed, 1 total
# Tests: 65+ passed, 65+ total
# Time: ~2s
```

### Modo Watch (Desarrollo)
```powershell
# Ejecutar tests en modo watch
npm run test:watch

# Los tests se re-ejecutarán automáticamente al guardar archivos
# Útil durante desarrollo
```

### Coverage Report
```powershell
# Generar reporte de cobertura
npm test -- --coverage

# Output en terminal + HTML report en /coverage/index.html
# Abrir con navegador para ver detalles visuales
```

---

## 🎭 Tests E2E de PWA

### Configuración Inicial
```powershell
# Instalar browsers de Playwright (solo primera vez)
npx playwright install chromium
npx playwright install webkit  # Para tests de iOS
```

### Ejecutar Tests E2E de PWA
```powershell
# Paso 1: Iniciar servidor de desarrollo
npm run dev
# Esperar a que aparezca: "✓ Ready on http://localhost:3000"

# Paso 2: En otra terminal, ejecutar tests E2E
npm run test:e2e:pwa

# Output esperado:
# Running 23 tests using 1 worker
# 
# ✓ PWA Installation
#   ✓ should have valid manifest.json (2s)
#   ✓ should load all manifest icons (3s)
#   ✓ should register service worker (1s)
#   ✓ should have iOS meta tags (500ms)
#   ... (9 tests)
# 
# ✓ Offline Functionality
#   ✓ should work offline (5s)
#   ✓ should show offline fallback for uncached pages (2s)
#   ... (4 tests)
# 
# ✓ PWA Manifest Validation (5 tests)
# ✓ PWA Features (3 tests)
# ✓ Performance (2 tests)
# 
# 23 passed (30s)
```

### Modo UI Interactivo (Recomendado)
```powershell
# Iniciar dev server
npm run dev

# En otra terminal, ejecutar con UI
npm run test:e2e:ui

# Se abrirá navegador con:
# - Lista de tests ejecutables
# - Timeline de acciones
# - Inspector de elementos
# - Network logs
# - Console logs
```

### Modo Headed (Ver Browser)
```powershell
# Ver los tests ejecutándose en el navegador
npm run test:e2e:headed

# Útil para debugging visual
```

### Ver Reporte HTML
```powershell
# Después de ejecutar tests, ver reporte
npm run test:e2e:report

# Se abrirá navegador con:
# - Resultados de todos los tests
# - Screenshots de fallos
# - Traces de ejecución
# - Logs de console/network
```

---

## 🔦 Lighthouse Audit

### Audit Local
```powershell
# Paso 1: Build de producción
npm run build

# Output esperado:
# ✓ Collecting page data
# ✓ Generating static pages (62/62)
# ✓ Successfully injected push handlers

# Paso 2: Iniciar servidor de producción
npm start
# Esperar a que esté listo en http://localhost:3000

# Paso 3: En otra terminal, ejecutar Lighthouse
npm run lighthouse

# Output en consola:
# 🔦 Running Lighthouse audit...
# 📊 Target: http://localhost:3000
# 
# ✅ PWA:              95/100
# ✅ Performance:      92/100
# ✅ Accessibility:    97/100
# ✅ Best Practices:   96/100
# ✅ SEO:              100/100
# 
# 📈 Performance Metrics:
# FCP: 0.8s
# LCP: 1.2s
# Speed Index: 1.5s
# TTI: 2.1s
# TBT: 50ms
# CLS: 0.05
# 
# 📄 Reports saved:
# - HTML: lighthouse-reports/lighthouse-2025-01-XX-XX-XX-XX.html
# - JSON: lighthouse-reports/lighthouse-2025-01-XX-XX-XX-XX.json
# 
# ✅ All audits passed!
```

### Ver Reporte HTML
```powershell
# Abrir el reporte más reciente
cd lighthouse-reports
# Abrir con navegador: lighthouse-{timestamp}.html

# El reporte incluye:
# - Scores detallados por categoría
# - PWA checklist con status de cada item
# - Performance metrics con gráficos
# - Oportunidades de optimización
# - Diagnostics y mejores prácticas
```

### Audit para CI/CD
```powershell
# Usar variable de entorno para URL
$env:LIGHTHOUSE_URL="http://localhost:3000"
npm run lighthouse:ci

# Exit code 0 si todos los scores ≥90
# Exit code 1 si algún score <90
# Útil para gates en CI/CD pipelines
```

---

## 🔄 CI/CD Integration

### GitHub Actions Workflow

```yaml
# .github/workflows/pwa-tests.yml
name: PWA Tests

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest
    
    steps:
      - uses: actions/checkout@v4
      
      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'
      
      - name: Install dependencies
        run: npm ci
      
      - name: Run unit tests
        run: npm test
      
      - name: Build application
        run: npm run build
        env:
          NEXT_PUBLIC_SUPABASE_URL: ${{ secrets.SUPABASE_URL }}
          NEXT_PUBLIC_SUPABASE_ANON_KEY: ${{ secrets.SUPABASE_ANON_KEY }}
      
      - name: Start server
        run: npm start &
      
      - name: Wait for server
        run: npx wait-on http://localhost:3000 --timeout 60000
      
      - name: Install Playwright
        run: npx playwright install --with-deps chromium
      
      - name: Run E2E tests
        run: npm run test:e2e:pwa
      
      - name: Run Lighthouse audit
        run: npm run lighthouse:ci
      
      - name: Upload Lighthouse report
        if: always()
        uses: actions/upload-artifact@v4
        with:
          name: lighthouse-report
          path: lighthouse-reports/
      
      - name: Upload Playwright report
        if: always()
        uses: actions/upload-artifact@v4
        with:
          name: playwright-report
          path: playwright-report/
```

### Scripts de Pre-Commit
```json
// package.json
{
  "husky": {
    "hooks": {
      "pre-commit": "npm run test:sync && npm run lint"
    }
  }
}
```

---

## 🐛 Troubleshooting

### Tests Unitarios Fallan

#### Error: Cannot find module '@/lib/db/sync-manager'
```powershell
# Solución: Verificar que el archivo existe
ls lib/db/sync-manager.ts

# Si no existe, crearlo desde el repositorio
# El archivo debería exportar SyncManager class
```

#### Error: Supabase client not initialized
```powershell
# Solución: Verificar variables de entorno
echo $env:NEXT_PUBLIC_SUPABASE_URL
echo $env:NEXT_PUBLIC_SUPABASE_ANON_KEY

# Si están vacías, agregarlas a .env.local
```

---

### Tests E2E Fallan

#### Error: Timeout waiting for element
```powershell
# Solución: Aumentar timeout en playwright.config.ts
# timeout: 30000 → 60000

# O iniciar server antes de tests
npm run dev
npm run test:e2e:pwa
```

#### Error: Browser not installed
```powershell
# Solución: Instalar browsers de Playwright
npx playwright install chromium
npx playwright install webkit
```

#### Error: Connection refused to localhost:3000
```powershell
# Solución: Verificar que el servidor está corriendo
# En una terminal separada:
npm run dev

# Verificar en navegador: http://localhost:3000
# Luego ejecutar tests en otra terminal
```

---

### Lighthouse Falla

#### Error: Cannot connect to Chrome
```powershell
# Solución: Instalar Chrome o Chromium
# Windows: Descargar de google.com/chrome
# Linux: sudo apt install chromium-browser

# Verificar instalación:
chrome --version
```

#### Error: Lighthouse scores below threshold
```powershell
# Ver detalles en el reporte HTML:
cd lighthouse-reports
# Abrir lighthouse-{timestamp}.html

# Revisar secciones:
# 1. Opportunities: Optimizaciones disponibles
# 2. Diagnostics: Problemas detectados
# 3. Passed audits: Lo que está bien

# Optimizaciones comunes:
# - Comprimir imágenes (WebP, AVIF)
# - Minificar JS/CSS
# - Habilitar compresión gzip/brotli
# - Usar CDN para assets
# - Lazy loading de imágenes
```

#### Error: Build not found
```powershell
# Solución: Hacer build antes de Lighthouse
npm run build
npm start
npm run lighthouse
```

---

## 📊 Interpretar Resultados

### Tests Unitarios
✅ **65+ passing**: Sync manager funciona correctamente  
⚠️ **Algunos fallan**: Revisar logs, puede ser issue de mock de Supabase  
❌ **Todos fallan**: Verificar instalación de dependencias y env vars

### Tests E2E
✅ **23+ passing**: PWA funciona en todos los flows  
⚠️ **Algunos fallan**: Revisar screenshots en playwright-report/  
❌ **Todos fallan**: Server no está corriendo o puerto 3000 ocupado

### Lighthouse
✅ **Todos ≥90**: Excelente, listo para producción  
⚠️ **Algunos <90**: Ver recomendaciones en HTML report  
❌ **PWA <90**: Revisar manifest, SW registration, offline mode

---

## 🎯 Checklist Pre-Deploy

```
Pre-Deploy Testing Checklist:
□ npm test (111+ tests passing)
□ npm run test:sync (65+ tests passing)
□ npm run test:e2e:pwa (23+ tests passing)
□ npm run lighthouse (all scores ≥90)
□ Test en Chrome desktop (install prompt)
□ Test en Chrome Android (install prompt)
□ Test en Safari iOS (A2HS instructions)
□ Test offline mode (disconnect network)
□ Test sync queue (create order offline → online)
□ Test push notifications (receive notification)
□ Review HTML reports (Lighthouse + Playwright)
□ Check console for errors (no red errors)
□ Verify service worker registered
□ Verify IndexedDB populated
□ Verify manifest.json loads correctly
```

---

## 📚 Recursos Adicionales

- [Playwright Documentation](https://playwright.dev/)
- [Lighthouse Documentation](https://developers.google.com/web/tools/lighthouse)
- [PWA Checklist](https://web.dev/pwa-checklist/)
- [Vitest Documentation](https://vitest.dev/)
- [Testing Library](https://testing-library.com/)

---

## 🆘 Soporte

Si encuentras problemas:

1. **Revisa esta guía** primero (sección Troubleshooting)
2. **Revisa logs** de tests/lighthouse para detalles
3. **Revisa documentación** en `/docs/`
4. **Contacta al equipo** con:
   - Comando ejecutado
   - Error completo
   - Screenshot si aplica
   - Sistema operativo y versión de Node

---

**Última Actualización**: Enero 2025  
**Versión**: 1.0.0  
**Mantenido por**: Equipo de Desarrollo
