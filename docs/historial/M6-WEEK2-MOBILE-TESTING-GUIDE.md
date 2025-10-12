# M6 Week 2 - Mobile Testing Guide

## 📱 Overview

This guide provides step-by-step instructions for testing the QR Ordering System on mobile devices, including setup, test scenarios, and troubleshooting.

---

## 🔧 Setup Instructions

### Option 1: Test on Physical Devices (Recommended)

#### Connect Device to Development Server

**Method A: Same Wi-Fi Network**
1. Ensure your computer and mobile device are on the same Wi-Fi network
2. Find your computer's local IP address:
   ```powershell
   # Windows
   ipconfig
   # Look for "IPv4 Address" under your active network adapter
   # Example: 192.168.1.100
   ```
3. Start the dev server:
   ```bash
   npm run dev
   ```
4. On your mobile device, open browser and navigate to:
   ```
   http://[YOUR-IP]:3000/qr/TABLE-1
   # Example: http://192.168.1.100:3000/qr/TABLE-1
   ```

**Method B: ngrok (External Access)**
1. Install ngrok: https://ngrok.com/download
2. Start dev server: `npm run dev`
3. In another terminal, run:
   ```bash
   ngrok http 3000
   ```
4. Copy the HTTPS URL from ngrok (e.g., `https://abc123.ngrok.io`)
5. Navigate to: `https://abc123.ngrok.io/qr/TABLE-1` on mobile device

**Method C: Vercel Preview Deploy**
1. Push branch to GitHub
2. Vercel automatically creates preview deployment
3. Access via preview URL on mobile device

#### Enable Developer Tools on Mobile

**iOS Safari:**
1. Settings → Safari → Advanced → Enable "Web Inspector"
2. Connect iPhone to Mac via USB
3. On Mac: Safari → Develop → [Your iPhone] → [Page]

**Android Chrome:**
1. Settings → About phone → Tap "Build number" 7 times (enables Developer mode)
2. Settings → Developer options → Enable "USB debugging"
3. Connect to computer via USB
4. Open Chrome on computer: `chrome://inspect`
5. Inspect device from remote devices list

---

### Option 2: Browser DevTools Emulation (Quick Testing)

1. Open Chrome DevTools (F12)
2. Click "Toggle Device Toolbar" (Ctrl+Shift+M)
3. Select device from dropdown:
   - iPhone 12/13 Pro
   - Samsung Galaxy S20
   - iPad Air
   - Pixel 5
4. Test with touch simulation enabled

**Limitations**: Doesn't test real touch, network conditions, or device-specific behaviors

---

## 🧪 Test Scenarios

### Scenario 1: Customer Scans QR Code

**Preconditions:**
- QR code displayed (or manually navigate to `/qr/TABLE-1`)
- Device connected to internet

**Steps:**
1. Scan QR code with camera app (or type URL)
2. Observe page load time
3. Check if menu displays correctly
4. Verify session creation

**Expected Results:**
- ✅ Page loads in < 3 seconds
- ✅ Menu items visible with images
- ✅ Category tabs appear at top
- ✅ Cart button (0) visible in corner
- ✅ Search bar at top
- ✅ Table number displayed

**Actual Results:**
- Load time: _______________
- Display: ⬜ Pass ⬜ Fail
- Session: ⬜ Pass ⬜ Fail
- Notes: _______________

---

### Scenario 2: Browse Menu Items

**Preconditions:**
- Menu loaded successfully

**Steps:**
1. Scroll through menu items
2. Switch between categories (tap tabs)
3. Check images load
4. Read item descriptions
5. Check prices display correctly

**Expected Results:**
- ✅ Smooth scrolling (60fps)
- ✅ Category tabs switch instantly
- ✅ Images lazy-load as scrolled
- ✅ Text readable on mobile (min 14px)
- ✅ Touch targets ≥ 44px

**Actual Results:**
- Scrolling: ⬜ Pass ⬜ Fail
- Categories: ⬜ Pass ⬜ Fail
- Images: ⬜ Pass ⬜ Fail
- Touch targets: ⬜ Pass ⬜ Fail
- Notes: _______________

---

### Scenario 3: Search for Item

**Preconditions:**
- Menu visible

**Steps:**
1. Tap search bar
2. Keyboard appears
3. Type "pizza" (or any item)
4. Observe filtered results
5. Clear search
6. Verify all items return

**Expected Results:**
- ✅ Keyboard doesn't obscure input
- ✅ Results filter as you type (debounced)
- ✅ Clear button (X) easily tappable
- ✅ "No results" message if no matches
- ✅ Results count displayed

**Actual Results:**
- Keyboard: ⬜ Pass ⬜ Fail
- Search: ⬜ Pass ⬜ Fail
- Clear: ⬜ Pass ⬜ Fail
- Notes: _______________

---

### Scenario 4: Add Items to Cart

**Preconditions:**
- Menu visible, cart empty (0 items)

**Steps:**
1. Tap "Añadir" button on an item
2. Observe cart badge update
3. Notice any animations (bounce, pulse)
4. Add 2-3 more items
5. Check badge increments correctly

**Expected Results:**
- ✅ Button press shows visual feedback (ripple)
- ✅ Cart badge pulses when item added
- ✅ Cart button bounces slightly
- ✅ Badge shows correct count
- ✅ No accidental taps on adjacent elements

**Actual Results:**
- Button feedback: ⬜ Pass ⬜ Fail
- Animations: ⬜ Pass ⬜ Fail
- Badge count: ⬜ Pass ⬜ Fail
- Notes: _______________

---

### Scenario 5: Open and Review Cart

**Preconditions:**
- 3+ items in cart

**Steps:**
1. Tap floating cart button
2. Cart sheet slides in from right
3. Review items in cart
4. Check item details (name, price, modifiers, notes)
5. Verify subtotal calculated correctly

**Expected Results:**
- ✅ Sheet slides in smoothly (300ms)
- ✅ Sheet takes 90% of screen width
- ✅ All items listed with images
- ✅ Quantity controls visible (+/- buttons)
- ✅ Remove button on each item
- ✅ Subtotal at bottom correct
- ✅ "Continuar al pago" button prominent

**Actual Results:**
- Sheet animation: ⬜ Pass ⬜ Fail
- Item display: ⬜ Pass ⬜ Fail
- Calculations: ⬜ Pass ⬜ Fail
- Notes: _______________

---

### Scenario 6: Modify Cart Items

**Preconditions:**
- Cart open with items

**Steps:**
1. Tap "+" to increment quantity
2. Observe quantity update and price recalculation
3. Tap "-" to decrement quantity
4. Tap trash icon to remove item
5. Verify cart updates correctly

**Expected Results:**
- ✅ +/- buttons ≥ 36px (with spacing)
- ✅ Quantity changes immediately
- ✅ Price updates in real-time
- ✅ Animations smooth (expand/collapse)
- ✅ Remove shows confirmation or removes instantly
- ✅ Empty cart message if all items removed

**Actual Results:**
- Touch targets: ⬜ Pass ⬜ Fail
- Updates: ⬜ Pass ⬜ Fail
- Animations: ⬜ Pass ⬜ Fail
- Notes: _______________

---

### Scenario 7: Checkout Flow

**Preconditions:**
- Cart has items, ready to checkout

**Steps:**
1. Tap "Continuar al pago"
2. View switches to checkout form
3. Fill out customer name field (tap, keyboard appears)
4. Enter phone/email
5. Select payment method (tap radio button)
6. Enter table number (should be pre-filled)
7. Add special notes (optional)
8. Tap "Confirmar pedido"

**Expected Results:**
- ✅ View transition smooth
- ✅ Form fields easily tappable
- ✅ Keyboard doesn't hide submit button
- ✅ Radio buttons ≥ 44px touch target
- ✅ Validation errors display clearly
- ✅ Submit button shows loading state
- ✅ No accidental double-submit

**Actual Results:**
- Form layout: ⬜ Pass ⬜ Fail
- Keyboard: ⬜ Pass ⬜ Fail
- Validation: ⬜ Pass ⬜ Fail
- Submit: ⬜ Pass ⬜ Fail
- Notes: _______________

---

### Scenario 8: Order Confirmation

**Preconditions:**
- Order submitted successfully

**Steps:**
1. View switches to confirmation screen
2. Check success icon displays (checkmark animation)
3. Verify order ID shown
4. Check estimated time countdown
5. Read confirmation message
6. Tap "Volver al menú"

**Expected Results:**
- ✅ Checkmark draws smoothly
- ✅ Success message clear
- ✅ Order ID easily readable
- ✅ Countdown updates every minute
- ✅ "Back to menu" button accessible
- ✅ Cart cleared (badge shows 0)

**Actual Results:**
- Animation: ⬜ Pass ⬜ Fail
- Info display: ⬜ Pass ⬜ Fail
- Navigation: ⬜ Pass ⬜ Fail
- Notes: _______________

---

### Scenario 9: Error Handling

**Preconditions:**
- Disconnect from internet OR submit invalid form

**Steps:**
1. Try to submit checkout form with errors:
   - Leave name empty
   - Invalid phone format
2. Observe error messages
3. Fix errors and resubmit
4. (Optional) Disconnect internet, try to submit
5. Check offline handling

**Expected Results:**
- ✅ Error messages display clearly
- ✅ Errors associated with correct fields
- ✅ Error text has good contrast (red, 4.5:1)
- ✅ Can correct and resubmit
- ✅ Network errors shown with retry option
- ✅ No app crash or blank screen

**Actual Results:**
- Validation: ⬜ Pass ⬜ Fail
- Error display: ⬜ Pass ⬜ Fail
- Network handling: ⬜ Pass ⬜ Fail
- Notes: _______________

---

### Scenario 10: Orientation Changes

**Preconditions:**
- Any page (menu, cart, checkout)

**Steps:**
1. Start in portrait orientation
2. Rotate device to landscape
3. Check layout adapts
4. Interact with elements
5. Rotate back to portrait

**Expected Results:**
- ✅ Layout reflows smoothly
- ✅ No horizontal scroll
- ✅ All content visible
- ✅ Touch targets still adequate
- ✅ No data/input loss during rotation

**Actual Results:**
- Portrait: ⬜ Pass ⬜ Fail
- Landscape: ⬜ Pass ⬜ Fail
- Rotation: ⬜ Pass ⬜ Fail
- Notes: _______________

---

### Scenario 11: Reduced Motion

**Preconditions:**
- Enable "Reduce Motion" in device settings

**iOS:**
1. Settings → Accessibility → Motion → Reduce Motion → ON

**Android:**
1. Settings → Accessibility → Remove animations → ON

**Steps:**
1. Refresh page with reduced motion enabled
2. Add items to cart
3. Open cart sheet
4. Switch categories
5. Submit checkout

**Expected Results:**
- ✅ All animations disabled or minimal (< 0.01s)
- ✅ Transitions instant or near-instant
- ✅ No bouncing, sliding, or fancy effects
- ✅ App fully functional without animations
- ✅ No jarring jumps or flashes

**Actual Results:**
- Animations disabled: ⬜ Pass ⬜ Fail
- Functionality intact: ⬜ Pass ⬜ Fail
- Notes: _______________

---

### Scenario 12: PWA Installation (Progressive Web App)

**Preconditions:**
- HTTPS connection (production or ngrok)
- Service Worker registered
- Web App Manifest present

**iOS Safari:**
1. Tap Share button
2. Tap "Add to Home Screen"
3. Confirm
4. Launch from home screen

**Android Chrome:**
1. Tap menu (⋮)
2. Tap "Install app" or "Add to Home Screen"
3. Confirm
4. Launch from home screen/app drawer

**Steps:**
1. Install app to home screen
2. Launch app
3. Check if it opens in standalone mode (no browser UI)
4. Test offline functionality
5. Check app icon and splash screen

**Expected Results:**
- ✅ Install prompt appears
- ✅ App installs successfully
- ✅ Icon appears on home screen
- ✅ Opens in standalone mode
- ✅ Works offline (cached pages)
- ✅ Splash screen displays during launch

**Actual Results:**
- Installation: ⬜ Pass ⬜ Fail
- Standalone: ⬜ Pass ⬜ Fail
- Offline: ⬜ Pass ⬜ Fail
- Notes: _______________

---

## 🎨 Visual QA Checklist

### Layout & Spacing
- [ ] No text truncation
- [ ] Images fit properly (no stretching)
- [ ] Adequate padding/margins
- [ ] No overlapping elements
- [ ] Consistent spacing

### Typography
- [ ] All text readable (min 14px)
- [ ] Line height adequate (≥ 1.5)
- [ ] Headings clearly differentiated
- [ ] No text too wide (max 75ch)

### Colors & Contrast
- [ ] Text readable on all backgrounds
- [ ] Buttons clearly visible
- [ ] Links distinguishable
- [ ] Error messages stand out
- [ ] Dark mode works (if implemented)

### Touch Targets
- [ ] All buttons ≥ 44x44px
- [ ] Adequate spacing between buttons (≥ 8px)
- [ ] No accidental taps
- [ ] Active states visible on tap
- [ ] Long-press doesn't trigger unwanted actions

### Animations & Transitions
- [ ] Smooth (60fps)
- [ ] Not too fast/slow
- [ ] No jarring movements
- [ ] Respect reduced motion
- [ ] Don't interfere with interaction

---

## 🐛 Common Issues & Troubleshooting

### Issue: Can't access dev server from mobile
**Symptoms**: Connection timeout, can't resolve hostname  
**Solutions**:
1. Check firewall: Allow port 3000 through Windows Firewall
2. Verify same Wi-Fi: Both devices on same network, not guest network
3. Try IP instead of hostname: Use `192.168.x.x` instead of `localhost`
4. Disable VPN: VPN may block local network access
5. Use ngrok: Bypass network restrictions with tunneling

### Issue: Styles look broken on mobile
**Symptoms**: Layout doesn't match desktop, elements misaligned  
**Solutions**:
1. Hard refresh: Shift+Reload or clear cache
2. Check viewport meta tag: Should be in `<head>`
3. Test in DevTools emulation first
4. Check for fixed widths: Use responsive units (%, vw, rem)
5. Review Tailwind breakpoints: Ensure mobile-first approach

### Issue: Touch doesn't work correctly
**Symptoms**: Taps don't register, buttons hard to tap  
**Solutions**:
1. Check button size: Ensure ≥ 44x44px
2. Remove hover-only interactions: Implement touch equivalents
3. Check z-index: Ensure buttons not behind other elements
4. Test with fat fingers: Use thumb, not fingertip
5. Add active states: Visual feedback on tap

### Issue: Keyboard hides form inputs
**Symptoms**: Can't see field being typed into, submit button hidden  
**Solutions**:
1. Use `scrollIntoView()`: Scroll field into view on focus
2. Adjust viewport: Use `height: 100dvh` instead of `100vh`
3. Test with software keyboard: Android especially prone to this
4. Reduce header height: Make more room for content
5. Use sticky footer: Keep submit button always visible

### Issue: Animations laggy or stuttering
**Symptoms**: Choppy animations, low FPS  
**Solutions**:
1. Use CSS transforms: `transform` instead of `top/left`
2. Enable GPU acceleration: `will-change: transform`
3. Reduce animation complexity: Simplify keyframes
4. Test on real device: Emulation may not reflect real performance
5. Profile with DevTools: Check for layout thrashing

### Issue: Images load slowly
**Symptoms**: Slow initial load, blank spaces  
**Solutions**:
1. Optimize images: Use WebP format, compress
2. Implement lazy loading: `loading="lazy"` on `<img>`
3. Add placeholders: Skeleton or low-res blur
4. Use CDN: Serve images from fast CDN
5. Responsive images: `srcset` for different resolutions

---

## 📊 Device Testing Matrix

| Device Type | Device Model | OS Version | Browser | Screen Size | Status | Tester | Date | Notes |
|-------------|--------------|------------|---------|-------------|--------|--------|------|-------|
| Phone | iPhone 12 | iOS 15+ | Safari | 390x844 | ⬜ | | | |
| Phone | iPhone SE | iOS 15+ | Safari | 375x667 | ⬜ | | | Small screen |
| Phone | Samsung Galaxy S20 | Android 12+ | Chrome | 360x800 | ⬜ | | | |
| Phone | Google Pixel 5 | Android 12+ | Chrome | 393x851 | ⬜ | | | |
| Tablet | iPad Air | iOS 15+ | Safari | 820x1180 | ⬜ | | | Landscape important |
| Tablet | iPad Pro 12.9" | iOS 15+ | Safari | 1024x1366 | ⬜ | | | Large screen |
| Tablet | Samsung Tab S7 | Android 12+ | Chrome | 800x1280 | ⬜ | | | |
| Emulator | Chrome DevTools | N/A | Chrome | Various | ⬜ | | | Quick tests only |

---

## ✅ Final Mobile Checklist

Before marking mobile testing complete, ensure:

- [ ] Tested on at least 2 physical iOS devices (different sizes)
- [ ] Tested on at least 2 physical Android devices (different manufacturers)
- [ ] Tested on at least 1 tablet (portrait & landscape)
- [ ] All 12 test scenarios completed and passed
- [ ] Visual QA checklist complete
- [ ] No critical bugs found
- [ ] Screenshots captured for each device
- [ ] Performance acceptable (< 3s load, smooth 60fps)
- [ ] Touch targets adequate (no accidental taps)
- [ ] Accessibility features work (VoiceOver, TalkBack)
- [ ] PWA installation tested (if applicable)
- [ ] Offline functionality tested (if applicable)
- [ ] All issues documented in bug tracker
- [ ] Stakeholder demo completed on mobile

---

## 📸 Screenshot Requirements

Capture screenshots for:
1. Menu page (home view)
2. Category tabs (showing active tab)
3. Search results
4. Cart sheet (with items)
5. Checkout form
6. Order confirmation
7. Error states
8. Landscape orientation
9. Tablet view
10. PWA home screen icon

Store in: `docs/screenshots/mobile/[device-name]/`

---

## 🎯 Success Criteria

Mobile testing is considered **COMPLETE** when:

✅ All scenarios pass on minimum 2 iOS + 2 Android devices  
✅ No critical bugs (P0/P1) remain  
✅ Performance meets targets (load < 3s, 60fps animations)  
✅ Touch targets meet WCAG standards (≥ 44px)  
✅ Accessibility features functional (screen readers)  
✅ PWA installable and works offline (if applicable)  
✅ Documentation complete with screenshots  
✅ Stakeholder approval obtained  

---

**Next Steps After Mobile Testing:**
1. Run Lighthouse audit on mobile device
2. Address any medium/low priority issues
3. Document all findings in week report
4. Mark Week 2 Day 9-10 as complete
5. Move to Week 4: Payment Integration

---

*Generated as part of M6 Week 2 Day 9-10: Polish & Accessibility*
