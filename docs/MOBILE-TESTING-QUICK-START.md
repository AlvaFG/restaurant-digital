# 📱 Quick Mobile Testing Reference

## 🚀 Quick Start

### Your Local Network
- **Wi-Fi IP**: `192.168.123.44`
- **Dev Server**: Running on port 3000
- **Mobile URL**: `http://192.168.123.44:3000/qr/TABLE-1`

### Steps to Test on Your Phone:
1. ✅ Connect phone to **same Wi-Fi** (bbrouter network)
2. ✅ Open browser on phone (Safari/Chrome)
3. ✅ Navigate to: `http://192.168.123.44:3000/qr/TABLE-1`
4. ✅ Test all interactions (scroll, tap, cart, checkout)

---

## 🔧 Alternative Methods

### If Same Wi-Fi Doesn't Work:

**Option A: Use ngrok (Easiest)**
```bash
# Install ngrok from https://ngrok.com/download
# Then run:
ngrok http 3000

# Copy the HTTPS URL (e.g., https://abc123.ngrok.io)
# Navigate to: https://abc123.ngrok.io/qr/TABLE-1
```

**Option B: Windows Firewall Rule**
```powershell
# Allow incoming connections on port 3000
New-NetFirewallRule -DisplayName "Next.js Dev Server" -Direction Inbound -LocalPort 3000 -Protocol TCP -Action Allow
```

---

## ✅ What to Test

### Critical Flow (5 minutes):
1. ⬜ Load menu page
2. ⬜ Scroll through items
3. ⬜ Add 3 items to cart
4. ⬜ Open cart sheet
5. ⬜ Modify quantities (+/-)
6. ⬜ Tap "Continuar al pago"
7. ⬜ Fill checkout form
8. ⬜ Submit order
9. ⬜ See confirmation

### Animations (2 minutes):
1. ⬜ Badge pulse when adding items
2. ⬜ Cart bounce animation
3. ⬜ Sheet slide-in from right
4. ⬜ Button ripple on tap
5. ⬜ Hover lift on menu items

### Touch Targets (2 minutes):
1. ⬜ All buttons easy to tap (no misses)
2. ⬜ No accidental taps on adjacent buttons
3. ⬜ +/- controls easy to use with thumb

### Keyboard (1 minute):
1. ⬜ Search bar: tap, type, see results
2. ⬜ Checkout form: tap fields, keyboard appears
3. ⬜ Keyboard doesn't hide submit button

### Orientation (1 minute):
1. ⬜ Rotate to landscape
2. ⬜ Layout adapts, no horizontal scroll
3. ⬜ Rotate back to portrait

---

## 🐛 Common Issues

| Problem | Solution |
|---------|----------|
| Can't connect | Check same Wi-Fi network |
| Firewall blocks | Use ngrok instead |
| Styles broken | Hard refresh (Shift+Reload) |
| Touch doesn't work | Ensure buttons ≥ 44px |
| Keyboard hides form | Scroll field into view |
| Animations laggy | Test on real device, not emulator |

---

## 📊 Quick Checklist

- ⬜ Tested on iPhone (Safari)
- ⬜ Tested on Android (Chrome)
- ⬜ All 9 critical flows passed
- ⬜ Animations smooth (no lag)
- ⬜ Touch targets adequate
- ⬜ No critical bugs found
- ⬜ Screenshots captured

---

## 📸 Screenshot Checklist

Capture and save to `docs/screenshots/mobile/`:
- ⬜ Menu page (home)
- ⬜ Cart sheet (with items)
- ⬜ Checkout form
- ⬜ Order confirmation
- ⬜ Landscape orientation

---

## 🎯 Success = Green Checkmarks Above ✅

**When all checkmarks complete**: Mark Week 2 Day 9-10 as DONE!

---

*Updated: October 11, 2025*  
*Part of M6 Week 2 Day 9-10: Polish & Accessibility*
