# iOS Safari PWA Support Documentation

## Overview
Comprehensive iOS Safari support for PWA installation and optimal user experience on Apple devices.

## Implemented Features

### 1. Apple Web App Meta Tags
Located in `app/layout.tsx` metadata:

```typescript
appleWebApp: {
  capable: true,                    // Enable standalone mode
  statusBarStyle: "black-translucent", // Translucent status bar
  title: "Restaurant QR",           // App name on home screen
  startupImage: [/* 9 splash screens */],
},
```

**Status Bar Styles:**
- `default`: White background, black text
- `black`: Black background, white text
- `black-translucent`: **✅ Used** - Blends with content, full-height viewport

### 2. Apple Touch Icons
Auto-generated icons in 4 sizes for all iOS devices:

| Size | Filename | Device |
|------|----------|--------|
| 180x180 | `apple-touch-icon.png` | iPhone Retina, iPad Retina (default) |
| 167x167 | `apple-touch-icon-167x167.png` | iPad Pro 10.5" |
| 152x152 | `apple-touch-icon-152x152.png` | iPad Air, Mini |
| 120x120 | `apple-touch-icon-120x120.png` | iPhone SE, 6, 7, 8 |

**Icon Requirements:**
- ✅ Square (1:1 aspect ratio)
- ✅ No transparency (filled background)
- ✅ No rounded corners (iOS adds automatically)
- ✅ No border effects (iOS handles)
- ⚠️ Safe zone: 80% of icon (center 144x144 for 180x180)

### 3. Splash Screens
9 portrait splash screens covering all modern iOS devices:

| Size | Device |
|------|--------|
| 640x1136 | iPhone SE (1st gen) |
| 750x1334 | iPhone 8, 7, 6s, 6 |
| 1242x2208 | iPhone 8 Plus, 7 Plus, 6s Plus, 6 Plus |
| 828x1792 | iPhone 11, XR |
| 1242x2688 | iPhone 11 Pro Max, XS Max |
| 1125x2436 | iPhone 11 Pro, XS, X |
| 1536x2048 | iPad 9.7", Air, Mini |
| 1668x2388 | iPad Pro 11" |
| 2048x2732 | iPad Pro 12.9" |

**Splash Screen Design:**
- Gradient background (purple theme)
- Centered logo with "R" letter
- App name: "Restaurant QR"
- Subtitle: "Sistema de Gestión"
- Loading indicator at bottom

## Installation Process

### User Flow (iOS Safari)
1. User opens app in Safari
2. After 30 seconds, `InstallPrompt` component shows
3. Component displays iOS-specific instructions:
   - Step 1: Tap Share button (📤)
   - Step 2: Select "Agregar a pantalla de inicio"
   - Step 3: Confirm by tapping "Agregar"
4. User follows steps
5. App icon appears on home screen
6. User taps icon → Opens in standalone mode

### Standalone Mode Features
When launched from home screen:
- ✅ No Safari UI (address bar, toolbars)
- ✅ Full-screen viewport with status bar
- ✅ App feels native
- ✅ Separate process from Safari
- ✅ Persistent session

## Detection & Fallbacks

### Detect iOS Safari
```typescript
// hooks/use-install-prompt.ts
const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && 
              !(window as any).MSStream;
const isStandalone = (window.navigator as any).standalone;

// Or modern way
const isStandalone = window.matchMedia('(display-mode: standalone)').matches;
```

### Detect Installed
```typescript
// Check if running in standalone mode
if ((window.navigator as any).standalone === true) {
  // App is installed and running from home screen
  return { isInstalled: true };
}

// Or CSS media query
@media (display-mode: standalone) {
  /* Styles when installed */
}
```

### Platform Detection
```typescript
const getPlatform = () => {
  const ua = navigator.userAgent;
  
  if (/iPad|iPhone|iPod/.test(ua) && !(window as any).MSStream) {
    return 'ios';
  }
  // ...
};
```

## Asset Generation

### Current Setup (Development)
```bash
# Generate placeholder SVG assets
node scripts/generate-ios-assets.js

# Output:
# - 4 apple-touch-icon files
# - 9 splash screen files
```

### Production Setup
For production, generate proper PNG assets:

#### Option 1: pwa-asset-generator
```bash
npm install -g pwa-asset-generator

# Generate all iOS assets from logo
pwa-asset-generator logo.svg public/ \
  --padding "10%" \
  --background "#667eea" \
  --splash-only \
  --portrait-only \
  --type png \
  --quality 100

# Generate apple-touch-icons
pwa-asset-generator logo.svg public/ \
  --icon-only \
  --type png \
  --quality 100 \
  --padding "10%"
```

#### Option 2: Figma/Photoshop
1. Create artboards for each size
2. Export as PNG with correct dimensions
3. Ensure no transparency
4. Optimize with ImageOptim or TinyPNG

#### Option 3: Online Generators
- [RealFaviconGenerator](https://realfavicongenerator.net/)
- [PWA Builder](https://www.pwabuilder.com/)
- [App Icon Generator](https://www.appicon.co/)

## Testing on iOS

### Simulator Testing
```bash
# Xcode Simulator
1. Open Xcode
2. Open Simulator
3. Choose iOS device (iPhone 14, iPad, etc.)
4. Open Safari
5. Navigate to localhost (use ngrok/tunneling for HTTPS)
6. Test Add to Home Screen flow
```

### Physical Device Testing
```bash
# Requirements:
- iOS device with Safari
- HTTPS connection (use ngrok)
- Valid manifest.json

# Steps:
1. ngrok http 3000 --host-header="localhost:3000"
2. Copy HTTPS URL
3. Open in Safari on iOS device
4. Test installation
5. Verify splash screen appears
6. Check standalone mode features
```

### Debugging
```javascript
// Remote debugging via Safari
1. Enable Web Inspector on iOS:
   Settings → Safari → Advanced → Web Inspector

2. Connect device to Mac

3. Safari on Mac → Develop → [Your Device] → [Page]

4. Inspect console, network, resources
```

## iOS-Specific Considerations

### 1. No beforeinstallprompt
iOS Safari **does not** support `beforeinstallprompt` event.
- ✅ Solution: Manual instructions in `InstallPrompt` component
- ✅ Custom UI with step-by-step guide
- ✅ Icons to help users find Share button

### 2. No Push Notifications (Safari <16.4)
iOS Safari added Push API support in version 16.4 (March 2023).
- ✅ Check availability: `'Notification' in window`
- ✅ Graceful fallback if unavailable
- ⚠️ Users on iOS <16.4 won't get push notifications

### 3. Storage Limitations
iOS may clear storage if:
- Device is low on space
- App hasn't been used in 7+ days
- User clears Safari data

**Mitigation:**
```typescript
// Detect storage eviction
if ('storage' in navigator && 'persist' in navigator.storage) {
  const persistent = await navigator.storage.persist();
  if (!persistent) {
    console.warn('Storage may be evicted');
  }
}

// Monitor storage quota
const { usage, quota } = await navigator.storage.estimate();
console.log(`Using ${usage} of ${quota} bytes`);
```

### 4. Viewport Meta Tag
Already configured in `layout.tsx`:
```typescript
viewport: {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  userScalable: true,
  viewportFit: "cover",  // Full screen on iPhone X+ (notch)
},
```

### 5. Safe Area Insets
Handle iPhone notch and home indicator:
```css
/* In globals.css */
body {
  padding-top: env(safe-area-inset-top);
  padding-bottom: env(safe-area-inset-bottom);
  padding-left: env(safe-area-inset-left);
  padding-right: env(safe-area-inset-right);
}

/* For fixed headers */
.header {
  position: fixed;
  top: 0;
  padding-top: env(safe-area-inset-top);
}
```

## Validation

### Check Icon Loading
```javascript
// In browser console
const icons = document.querySelectorAll('link[rel*="apple-touch-icon"]');
icons.forEach(icon => {
  console.log(icon.href, icon.sizes);
  
  // Test if loads
  fetch(icon.href).then(r => 
    console.log(icon.href, r.ok ? '✅' : '❌')
  );
});
```

### Validate Metadata
```bash
# Check metadata in DevTools
# Sources → Page → Frames → top → 
# Look for:
# - <meta name="apple-mobile-web-app-capable">
# - <meta name="apple-mobile-web-app-status-bar-style">
# - <meta name="apple-mobile-web-app-title">
# - <link rel="apple-touch-icon">
# - <link rel="apple-touch-startup-image">
```

### Lighthouse PWA Audit
```bash
# Run Lighthouse
npm run build
npm run start

# Open Chrome DevTools → Lighthouse
# Select "Progressive Web App"
# Generate report

# Check iOS-specific items:
✅ Has apple-touch-icon
✅ Configured for full-screen (apple-mobile-web-app-capable)
✅ Has custom splash screen
```

## Common Issues

### Issue: Splash screen not showing
**Cause:** Media query doesn't match device
**Fix:** Ensure exact pixel dimensions in metadata

### Issue: Wrong icon appears
**Cause:** Missing size or wrong file
**Fix:** Verify all 4 icon sizes exist and are valid PNG

### Issue: App opens in Safari
**Cause:** Not in standalone mode or broken link
**Fix:** Use relative links, avoid `target="_blank"`

### Issue: Status bar overlaps content
**Cause:** Not accounting for safe area insets
**Fix:** Use `viewportFit: "cover"` and CSS safe-area-inset

### Issue: Storage cleared frequently
**Cause:** iOS eviction policy
**Fix:** Request persistent storage, show warning to users

## Future Enhancements

### 1. Landscape Splash Screens
Add landscape orientations (currently portrait-only):
```typescript
startupImage: [
  // Existing portrait...
  {
    url: "/apple-splash-2732-2048.png",
    media: "(device-width: 1024px) and (device-height: 1366px) and (orientation: landscape)",
  },
  // Add more landscape sizes...
],
```

### 2. Dynamic Status Bar
Change status bar based on page:
```typescript
// In page metadata
export const metadata = {
  appleWebApp: {
    statusBarStyle: "black", // Dark status bar for light pages
  },
};
```

### 3. App Clips / Deep Links
Configure universal links:
```json
// apple-app-site-association
{
  "webcredentials": {
    "apps": ["TEAMID.com.restaurant.qr"]
  },
  "applinks": {
    "apps": [],
    "details": [
      {
        "appID": "TEAMID.com.restaurant.qr",
        "paths": ["/pedidos/*", "/menu/*"]
      }
    ]
  }
}
```

### 4. Share Target API
Allow sharing to app:
```json
// manifest.json
"share_target": {
  "action": "/share",
  "method": "POST",
  "enctype": "multipart/form-data",
  "params": {
    "title": "title",
    "text": "text",
    "url": "url"
  }
}
```

## Related Files
- `app/layout.tsx` - iOS metadata configuration
- `scripts/generate-ios-assets.js` - Asset generation script
- `components/install-prompt.tsx` - iOS installation instructions
- `hooks/use-install-prompt.ts` - Platform detection logic
- `public/apple-*` - Generated iOS assets

## References
- [Apple: Configuring Web Applications](https://developer.apple.com/library/archive/documentation/AppleApplications/Reference/SafariWebContent/ConfiguringWebApplications/ConfiguringWebApplications.html)
- [Apple: Supporting Dark Mode](https://webkit.org/blog/8840/dark-mode-support-in-webkit/)
- [iOS PWA Best Practices](https://www.netguru.com/blog/pwa-ios)
- [Safari 16.4 Push Notifications](https://webkit.org/blog/13878/web-push-for-web-apps-on-ios-and-ipados/)
