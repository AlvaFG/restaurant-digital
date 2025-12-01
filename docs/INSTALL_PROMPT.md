# Install Prompt Component Documentation

## Overview
Custom PWA installation prompt component with platform-specific UI and smart timing logic.

## Components

### `<InstallPrompt />`
Main floating card-style installation prompt that appears after 30 seconds.

**Features:**
- Platform detection (Android, iOS, Desktop)
- Smart timing: 30-second delay before showing
- Persistent dismissal tracking via localStorage
- Platform-specific UI and messaging
- Animated slide-in entrance

**Usage:**
```tsx
import { InstallPrompt } from '@/components/install-prompt';

// In layout or dashboard
<InstallPrompt />
```

### `<InstallBanner />`
Alternative top banner style for less intrusive prompts.

**Features:**
- Session-based dismissal (shows once per session)
- Compact top banner design
- Responsive layout with truncation
- Install button for Chrome/Edge/Android only

**Usage:**
```tsx
import { InstallBanner } from '@/components/install-prompt';

// Alternative to InstallPrompt
<InstallBanner />
```

## Platform-Specific Behavior

### Android & Chrome Desktop
- **UI:** Floating card with install button
- **Action:** Triggers native browser prompt via `beforeinstallprompt` API
- **Benefits shown:** 
  - Acceso desde pantalla de inicio
  - Funciona sin conexión
  - Notificaciones push en tiempo real

### iOS Safari
- **UI:** Floating card with manual instructions
- **Action:** Step-by-step guide for Add to Home Screen
- **Steps:**
  1. Tap Share button (icon shown)
  2. Select "Agregar a pantalla de inicio" (icon shown)
  3. Confirm by tapping "Agregar"

### Desktop (Other browsers)
- **UI:** Same as Chrome Desktop
- **Action:** Attempts native prompt if available

## Timing & Visibility

### Show Conditions
```typescript
// InstallPrompt shows when ALL true:
✅ isInstallable === true (from hook)
✅ isInstalled === false
✅ 30 seconds have passed since render
✅ No localStorage 'pwa-prompt-dismissed' entry

// InstallBanner shows when ALL true:
✅ isInstallable === true
✅ isInstalled === false
✅ No sessionStorage 'pwa-banner-dismissed' entry
```

### Hide Conditions
- User clicks "Ahora no" or "Entendido"
- User clicks X button
- User completes installation (auto-hides)
- User previously dismissed (localStorage check)

## Storage Strategy

### localStorage (InstallPrompt)
```typescript
// Persistent across sessions
localStorage.setItem('pwa-prompt-dismissed', Date.now().toString());

// User won't see prompt again until localStorage cleared
// Consider adding 7-day expiry logic:
const dismissed = localStorage.getItem('pwa-prompt-dismissed');
if (dismissed) {
  const dismissedAt = parseInt(dismissed);
  const daysSince = (Date.now() - dismissedAt) / (1000 * 60 * 60 * 24);
  if (daysSince > 7) {
    localStorage.removeItem('pwa-prompt-dismissed');
  }
}
```

### sessionStorage (InstallBanner)
```typescript
// Clears on tab/browser close
sessionStorage.setItem('pwa-banner-dismissed', 'true');

// Less aggressive - shows again in new sessions
```

## Styling

### Card Prompt
- Position: `fixed bottom-4 right-4 left-4 sm:left-auto sm:w-96`
- Z-index: `z-50` (above most content)
- Animation: `animate-in slide-in-from-bottom-5`
- Border: `border-2 border-primary/20`
- Shadow: `shadow-lg`

### Banner
- Position: `top of page, full-width`
- Background: `bg-primary text-primary-foreground`
- Responsive: Stacks vertically on mobile
- Truncation: Text truncates on small screens

## Integration

Current integration in `app/layout.tsx`:
```tsx
<PWAProvider>
  <ConnectionStatus />
  <InstallPrompt />  {/* Added here */}
  <Suspense fallback={null}>
    <AuthProvider>{children}</AuthProvider>
  </Suspense>
</PWAProvider>
```

## Testing

### Unit Tests (30+ cases)
- Visibility logic (not installable, already installed, timing)
- Platform-specific rendering (Android, iOS, Desktop)
- User interactions (install, dismiss, close)
- Storage persistence (localStorage, sessionStorage)
- Button behaviors

**Run tests:**
```bash
npm run test tests/components/install-prompt.test.tsx
```

### E2E Tests (TODO: T4.6)
```typescript
// tests/e2e/pwa-install.spec.ts
test('should show install prompt after 30 seconds', async ({ page }) => {
  await page.goto('/dashboard');
  await page.waitForTimeout(31000);
  await expect(page.getByText('Instalar App')).toBeVisible();
});

test('should trigger install prompt on button click', async ({ page, context }) => {
  // Mock beforeinstallprompt event
  // Click install button
  // Verify native prompt appears
});
```

## Accessibility

### Keyboard Navigation
- All buttons focusable with Tab
- Enter/Space to activate
- Escape to dismiss (TODO: add handler)

### Screen Readers
- Semantic HTML: `<Card>`, `<Button>`, `<Alert>`
- ARIA labels on icon-only buttons
- Descriptive button text

### Color Contrast
- Primary text on primary background
- Border for low-vision users
- Icons with sufficient color contrast

## Future Enhancements

### 1. Expiry Logic
Add 7-day expiry to localStorage dismissal:
```typescript
const DISMISSAL_EXPIRY_DAYS = 7;

// On dismiss
const dismissedAt = Date.now();
localStorage.setItem('pwa-prompt-dismissed', dismissedAt.toString());
localStorage.setItem('pwa-prompt-dismissal-count', '1');

// On check
const dismissed = localStorage.getItem('pwa-prompt-dismissed');
if (dismissed) {
  const daysSince = (Date.now() - parseInt(dismissed)) / (1000 * 60 * 60 * 24);
  if (daysSince > DISMISSAL_EXPIRY_DAYS) {
    localStorage.removeItem('pwa-prompt-dismissed');
    setShowPrompt(true);
  }
}
```

### 2. A/B Testing
Track conversion rates:
```typescript
// On show
analytics.track('pwa_prompt_shown', { platform, variant: 'card' });

// On install
analytics.track('pwa_install_success', { platform, source: 'prompt' });

// On dismiss
analytics.track('pwa_prompt_dismissed', { platform });
```

### 3. Smart Timing
Show based on user engagement:
```typescript
// After user performs 3 actions
useEffect(() => {
  const actions = sessionStorage.getItem('user-actions') || '0';
  if (parseInt(actions) >= 3 && !hasShownPrompt) {
    setShowPrompt(true);
  }
}, [userActions]);

// Or after visiting 3 pages
// Or after spending 2 minutes on site
```

### 4. Custom Animations
```tsx
// Attention-grabbing pulse
<Card className="animate-in slide-in-from-bottom-5 hover:scale-105 transition-transform">
  {/* Add subtle pulse animation */}
</Card>
```

### 5. Multi-language Support
```typescript
// hooks/use-translations.ts
const translations = {
  es: {
    installApp: 'Instalar App',
    installNow: 'Instalar',
    notNow: 'Ahora no',
    // ...
  },
  en: {
    installApp: 'Install App',
    installNow: 'Install',
    notNow: 'Not Now',
    // ...
  },
};
```

## Troubleshooting

### Prompt not showing
1. Check browser supports PWA installation
2. Verify HTTPS (required for PWA)
3. Check manifest.json is valid
4. Clear localStorage: `localStorage.removeItem('pwa-prompt-dismissed')`
5. Wait 30 seconds after page load

### iOS instructions not accurate
- Ensure testing on iOS Safari (not Chrome iOS)
- Check iOS version (A2HS requires iOS 11.3+)
- Verify manifest.json has proper icons

### Install button does nothing
- Check browser console for errors
- Verify `beforeinstallprompt` event is firing
- Test on Chrome/Edge (Safari doesn't support)

## Related Files
- `hooks/use-install-prompt.ts` - Installation logic hook
- `app/layout.tsx` - Integration point
- `public/manifest.json` - PWA manifest configuration
- `docs/PWA_ASSETS_GUIDE.md` - Asset generation guide
- `tests/components/install-prompt.test.tsx` - Unit tests

## References
- [Web.dev: Add a web app manifest](https://web.dev/add-manifest/)
- [MDN: beforeinstallprompt](https://developer.mozilla.org/en-US/docs/Web/API/BeforeInstallPromptEvent)
- [Apple: Configuring Web Applications](https://developer.apple.com/library/archive/documentation/AppleApplications/Reference/SafariWebContent/ConfiguringWebApplications/ConfiguringWebApplications.html)
