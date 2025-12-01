# PWA Icons & Screenshots Guide

Esta guía explica cómo generar y optimizar todos los assets necesarios para la PWA.

## 📋 Assets Requeridos

### Iconos

| Tamaño | Propósito | Archivo |
|--------|-----------|---------|
| 72x72 | Android (ldpi) | `icon-72x72.png` |
| 96x96 | Android (mdpi) | `icon-96x96.png` |
| 128x128 | Android (hdpi) | `icon-128x128.png` |
| 144x144 | Android (xhdpi) | `icon-144x144.png` |
| 152x152 | iOS | `icon-152x152.png` |
| 192x192 | Android (xxhdpi) | `icon-192x192.png` |
| 384x384 | Android (xxxhdpi) | `icon-384x384.png` |
| 512x512 | Android | `icon-512x512.png` |
| 512x512 | Maskable (adaptive) | `maskable-icon.png` |
| 72x72 | Badge (notificaciones) | `badge-72x72.png` |

### Favicon

| Tamaño | Archivo |
|--------|---------|
| 16x16 | `favicon-16x16.png` |
| 32x32 | `favicon-32x32.png` |
| 48x48 | `favicon-48x48.png` |
| ICO | `favicon.ico` |

### Screenshots

| Formato | Tamaño | Archivo |
|---------|--------|---------|
| Desktop | 1280x720 | `screenshots/dashboard-wide.png` |
| Desktop | 1280x720 | `screenshots/salon-wide.png` |
| Mobile | 750x1334 | `screenshots/dashboard-narrow.png` |
| Mobile | 750x1334 | `screenshots/salon-narrow.png` |

## 🛠️ Generación Automática

### Opción 1: PWA Asset Generator (Recomendado)

```bash
# Instalar
npm install -g pwa-asset-generator

# Generar iconos desde logo
pwa-asset-generator public/logo.svg public \
  --icon-only \
  --favicon \
  --maskable \
  --type png \
  --background "#0ea5e9"

# Generar splash screens (opcional)
pwa-asset-generator public/logo.svg public/splash \
  --splash-only \
  --type png \
  --background "#0ea5e9"
```

### Opción 2: Real Favicon Generator

1. Visita https://realfavicongenerator.net/
2. Sube tu logo (SVG o PNG de alta resolución)
3. Configura opciones:
   - iOS: Background color #0ea5e9
   - Android: Theme color #0ea5e9
   - Windows: Tile color #0ea5e9
4. Descarga el paquete
5. Extrae en `/public`

### Opción 3: PWA Builder

1. Visita https://www.pwabuilder.com/
2. Genera manifest y assets
3. Descarga y extrae en `/public`

## 🎨 Diseño de Iconos

### Guías Generales

- **Formato**: PNG con transparencia
- **Fondo**: Sólido o gradiente (evitar transparencia para Android)
- **Padding**: 10% del tamaño total (safe zone)
- **Colores**: Usar theme color (#0ea5e9) como base

### Maskable Icons

Los maskable icons deben tener **safe zone del 80%**:

```
┌─────────────────────┐
│     10% padding     │
│  ┌───────────────┐  │
│  │               │  │
│  │   80% safe    │  │
│  │    content    │  │
│  │               │  │
│  └───────────────┘  │
│     10% padding     │
└─────────────────────┘
```

Validar en: https://maskable.app/

### Badge Icons

Para notificaciones push:
- 72x72px mínimo
- Monocromático o de alto contraste
- Reconocible en tamaño pequeño

## 📸 Screenshots

### Desktop (Wide)

- **Tamaño**: 1280x720px
- **Páginas sugeridas**:
  - Dashboard con estadísticas
  - Salón con mesas
  - Lista de pedidos
  - Panel de analítica

### Mobile (Narrow)

- **Tamaño**: 750x1334px (iPhone 6/7/8 Plus)
- **Páginas sugeridas**:
  - Dashboard móvil
  - Vista de salón
  - Detalle de pedido
  - Configuración

### Captura de Screenshots

#### Opción 1: Manual (Chrome DevTools)

```bash
1. Abrir Chrome DevTools (F12)
2. Toggle device toolbar (Ctrl+Shift+M)
3. Seleccionar tamaño:
   - Desktop: 1280x720
   - Mobile: 750x1334
4. Capturar (⋮ > Capture screenshot)
5. Guardar en /public/screenshots/
```

#### Opción 2: Playwright

```javascript
// scripts/capture-screenshots.js
const { chromium } = require('playwright');

async function captureScreenshots() {
  const browser = await chromium.launch();
  
  // Desktop
  const desktopPage = await browser.newPage({
    viewport: { width: 1280, height: 720 }
  });
  await desktopPage.goto('http://localhost:3000/dashboard');
  await desktopPage.screenshot({ 
    path: 'public/screenshots/dashboard-wide.png' 
  });
  
  // Mobile
  const mobilePage = await browser.newPage({
    viewport: { width: 750, height: 1334 }
  });
  await mobilePage.goto('http://localhost:3000/dashboard');
  await mobilePage.screenshot({ 
    path: 'public/screenshots/dashboard-narrow.png' 
  });
  
  await browser.close();
}

captureScreenshots();
```

## ✅ Checklist

- [ ] Todos los iconos generados (9 tamaños)
- [ ] Maskable icon creado y validado
- [ ] Badge icon para notificaciones
- [ ] Favicon en todos los tamaños
- [ ] 2 screenshots desktop (wide)
- [ ] 2 screenshots mobile (narrow)
- [ ] Todos los archivos optimizados (<50KB)
- [ ] Manifest.json actualizado con rutas correctas
- [ ] Icons visibles en Chrome DevTools > Application
- [ ] Screenshots visibles en PWA install prompt

## 🔍 Validación

### Validar Manifest

```bash
# Chrome DevTools
1. Abrir DevTools (F12)
2. Application > Manifest
3. Verificar que todos los iconos cargan
4. Verificar screenshots
```

### Validar Iconos

```bash
# Lighthouse PWA Audit
1. DevTools > Lighthouse
2. Categories: PWA
3. Generate report
4. Verificar "Installable" checks
```

### Online Validators

- https://manifest-validator.appspot.com/
- https://web.dev/measure/ (Lighthouse)
- https://webhint.io/ (PWA Scanner)

## 📦 Optimización

### Comprimir Imágenes

```bash
# TinyPNG API
npm install -g tinypng-cli
tinypng public/*.png --key YOUR_API_KEY

# O usar herramientas online:
# - https://tinypng.com/
# - https://squoosh.app/
```

### Objetivos

- Icons: <50KB cada uno
- Screenshots: <200KB cada uno
- Total icons: <500KB

## 🎯 Resultado Final

```
public/
├── icon-72x72.png
├── icon-96x96.png
├── icon-128x128.png
├── icon-144x144.png
├── icon-152x152.png
├── icon-192x192.png
├── icon-384x384.png
├── icon-512x512.png
├── maskable-icon.png
├── badge-72x72.png
├── favicon-16x16.png
├── favicon-32x32.png
├── favicon.ico
├── screenshots/
│   ├── dashboard-wide.png
│   ├── salon-wide.png
│   ├── dashboard-narrow.png
│   └── salon-narrow.png
└── manifest.json
```

## 📚 Referencias

- [Web App Manifest](https://developer.mozilla.org/en-US/docs/Web/Manifest)
- [Maskable Icons](https://web.dev/maskable-icon/)
- [PWA Asset Generator](https://github.com/elegantapp/pwa-asset-generator)
- [Real Favicon Generator](https://realfavicongenerator.net/)
