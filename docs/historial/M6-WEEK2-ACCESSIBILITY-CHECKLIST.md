# M6 Week 2 - Accessibility Testing Checklist

## 🎯 Manual Testing Session
**Date**: October 11, 2025  
**Tester**: Development Team  
**Environment**: Chrome on Windows + Dev Server (localhost:3000)

---

## ✅ Keyboard Navigation Testing

### General Navigation
- [ ] **Tab Key**: Move forward through all interactive elements
  - Expected: Logical order (menu items → cart → search → categories)
  - Actual: _______________
  - Status: ⬜ Pass ⬜ Fail ⬜ N/A

- [ ] **Shift + Tab**: Move backward through elements
  - Expected: Reverse tab order
  - Actual: _______________
  - Status: ⬜ Pass ⬜ Fail ⬜ N/A

- [ ] **Enter Key**: Activate focused buttons/links
  - Expected: Opens cart, adds items, submits forms
  - Actual: _______________
  - Status: ⬜ Pass ⬜ Fail ⬜ N/A

- [ ] **Space Bar**: Activate focused buttons
  - Expected: Same as Enter for buttons
  - Actual: _______________
  - Status: ⬜ Pass ⬜ Fail ⬜ N/A

- [ ] **Escape Key**: Close modals/sheets
  - Expected: Cart sheet closes, returns focus to trigger
  - Actual: _______________
  - Status: ⬜ Pass ⬜ Fail ⬜ N/A

### Focus Indicators
- [ ] **All Interactive Elements**: Visible focus ring
  - Elements: Buttons, links, inputs, cart trigger, category tabs
  - Expected: Blue outline (2px solid ring) with offset
  - Actual: _______________
  - Status: ⬜ Pass ⬜ Fail ⬜ N/A

- [ ] **Focus Contrast**: Focus indicator has 3:1 contrast
  - Test: Check against background colors
  - Expected: Clearly visible in all contexts
  - Actual: _______________
  - Status: ⬜ Pass ⬜ Fail ⬜ N/A

- [ ] **No Focus Loss**: Focus never disappears or jumps unexpectedly
  - Test: Tab through entire page without losing visual focus
  - Expected: Always know where focus is
  - Actual: _______________
  - Status: ⬜ Pass ⬜ Fail ⬜ N/A

### Category Tabs
- [ ] **Tab to Tabs**: Can reach tab list with Tab key
  - Expected: Focus on first/selected tab
  - Actual: _______________
  - Status: ⬜ Pass ⬜ Fail ⬜ N/A

- [ ] **Arrow Keys**: Navigate between tabs (TODO: implement)
  - Expected: Left/Right arrows change tab
  - Actual: _______________
  - Status: ⬜ Pass ⬜ Fail ⬜ N/A
  - **Note**: Currently requires Tab to each tab - enhancement needed

- [ ] **Tab Out**: Tab moves focus beyond tab list
  - Expected: Focus moves to menu items
  - Actual: _______________
  - Status: ⬜ Pass ⬜ Fail ⬜ N/A

### Cart Sheet
- [ ] **Open Cart**: Cart opens with keyboard (Enter/Space on trigger)
  - Expected: Sheet slides in, focus moves to close button
  - Actual: _______________
  - Status: ⬜ Pass ⬜ Fail ⬜ N/A

- [ ] **Focus Trap**: Focus stays within cart when open
  - Expected: Tab cycles through cart elements only
  - Actual: _______________
  - Status: ⬜ Pass ⬜ Fail ⬜ N/A

- [ ] **Quantity Controls**: Can increment/decrement with keyboard
  - Expected: Enter/Space activates +/- buttons
  - Actual: _______________
  - Status: ⬜ Pass ⬜ Fail ⬜ N/A

- [ ] **Remove Item**: Can remove items with keyboard
  - Expected: Focus on remove button, activate with Enter/Space
  - Actual: _______________
  - Status: ⬜ Pass ⬜ Fail ⬜ N/A

- [ ] **Close Cart**: Escape key closes cart
  - Expected: Sheet closes, focus returns to cart trigger
  - Actual: _______________
  - Status: ⬜ Pass ⬜ Fail ⬜ N/A

### Checkout Form
- [ ] **Form Navigation**: Tab through all form fields
  - Expected: Logical order (name → contact → payment → table → notes)
  - Actual: _______________
  - Status: ⬜ Pass ⬜ Fail ⬜ N/A

- [ ] **Radio Groups**: Arrow keys navigate options
  - Expected: Up/Down or Left/Right arrows select payment method
  - Actual: _______________
  - Status: ⬜ Pass ⬜ Fail ⬜ N/A

- [ ] **Error Messages**: Focus moves to first error field
  - Expected: On submit with errors, focus on invalid field
  - Actual: _______________
  - Status: ⬜ Pass ⬜ Fail ⬜ N/A

- [ ] **Submit**: Enter key submits form
  - Expected: Form submits, shows loading state
  - Actual: _______________
  - Status: ⬜ Pass ⬜ Fail ⬜ N/A

### Search Bar
- [ ] **Focus Search**: Can focus search input
  - Expected: Tab or click focuses input, shows placeholder
  - Actual: _______________
  - Status: ⬜ Pass ⬜ Fail ⬜ N/A

- [ ] **Type to Search**: Input responds to keyboard
  - Expected: Characters appear, debounce triggers search
  - Actual: _______________
  - Status: ⬜ Pass ⬜ Fail ⬜ N/A

- [ ] **Clear Search**: Can clear with keyboard
  - Expected: Tab to clear button, activate with Enter/Space
  - Actual: _______________
  - Status: ⬜ Pass ⬜ Fail ⬜ N/A

---

## 🎨 Visual Design Testing

### Color Contrast
- [ ] **Body Text**: Check contrast ratio
  - Tool: Chrome DevTools Contrast Checker
  - Target: ≥ 4.5:1 (AA)
  - Actual: _______________
  - Status: ⬜ Pass ⬜ Fail

- [ ] **Large Text**: Check contrast ratio (18pt+)
  - Target: ≥ 3:1 (AA)
  - Actual: _______________
  - Status: ⬜ Pass ⬜ Fail

- [ ] **Interactive Elements**: Button/link contrast
  - Target: ≥ 4.5:1 (AA)
  - Actual: _______________
  - Status: ⬜ Pass ⬜ Fail

- [ ] **Muted Text**: Secondary text contrast
  - Target: ≥ 4.5:1 (AA)
  - Actual: _______________
  - Status: ⬜ Pass ⬜ Fail

- [ ] **Error Messages**: Red text contrast
  - Target: ≥ 4.5:1 (AA)
  - Actual: _______________
  - Status: ⬜ Pass ⬜ Fail

### Touch Targets (Mobile)
- [ ] **Cart Button**: Size measurement
  - Target: ≥ 44x44px
  - Actual: _______________
  - Status: ⬜ Pass ⬜ Fail

- [ ] **Add to Cart Buttons**: Size measurement
  - Target: ≥ 44x44px
  - Actual: _______________
  - Status: ⬜ Pass ⬜ Fail

- [ ] **Quantity Controls**: Size measurement
  - Target: ≥ 44x44px (or 36x36px with adequate spacing)
  - Actual: _______________
  - Status: ⬜ Pass ⬜ Fail

- [ ] **Category Tabs**: Height measurement
  - Target: ≥ 44px
  - Actual: _______________
  - Status: ⬜ Pass ⬜ Fail

- [ ] **Button Spacing**: Gap between adjacent buttons
  - Target: ≥ 8px
  - Actual: _______________
  - Status: ⬜ Pass ⬜ Fail

### Text Resizing
- [ ] **200% Zoom**: Test at 200% browser zoom
  - Expected: All content visible, no horizontal scroll
  - Actual: _______________
  - Status: ⬜ Pass ⬜ Fail

- [ ] **150% Zoom**: Test at 150% browser zoom
  - Expected: Layout adapts, no overlapping text
  - Actual: _______________
  - Status: ⬜ Pass ⬜ Fail

- [ ] **Text Spacing**: Adjust line height/letter spacing
  - Expected: Still readable with increased spacing
  - Actual: _______________
  - Status: ⬜ Pass ⬜ Fail

---

## 🎬 Animation Testing

### Standard Animations
- [ ] **Badge Pulse**: Cart badge pulses when items added
  - Expected: Smooth pulse animation (scale 1.0 → 1.2 → 1.0)
  - Actual: _______________
  - Status: ⬜ Pass ⬜ Fail

- [ ] **Cart Bounce**: Cart button bounces on add
  - Expected: Slight bounce effect (translateY 0 → -8px → -4px → 0)
  - Actual: _______________
  - Status: ⬜ Pass ⬜ Fail

- [ ] **Sheet Slide**: Cart sheet slides in from right
  - Expected: Smooth slide-in animation (300ms)
  - Actual: _______________
  - Status: ⬜ Pass ⬜ Fail

- [ ] **Tab Transitions**: Category tabs slide when switching
  - Expected: Horizontal slide animation
  - Actual: _______________
  - Status: ⬜ Pass ⬜ Fail

- [ ] **Item Expand**: Menu items expand/collapse smoothly
  - Expected: Smooth height transition with fade
  - Actual: _______________
  - Status: ⬜ Pass ⬜ Fail

- [ ] **Button Ripple**: Buttons show ripple effect on click
  - Expected: Circular ripple expands from tap point
  - Actual: _______________
  - Status: ⬜ Pass ⬜ Fail

- [ ] **Hover Lift**: Items lift slightly on hover
  - Expected: translateY(-4px) with shadow increase
  - Actual: _______________
  - Status: ⬜ Pass ⬜ Fail

- [ ] **Loading Skeleton**: Skeleton pulses while loading
  - Expected: Subtle opacity pulse
  - Actual: _______________
  - Status: ⬜ Pass ⬜ Fail

- [ ] **Success Checkmark**: Checkmark draws on order success
  - Expected: SVG path draws from start to end
  - Actual: _______________
  - Status: ⬜ Pass ⬜ Fail

- [ ] **Toast Slide**: Notifications slide in from bottom
  - Expected: Smooth slide-up animation
  - Actual: _______________
  - Status: ⬜ Pass ⬜ Fail

### Reduced Motion
- [ ] **Enable Reduced Motion**: Set OS/browser preference
  - Windows: Settings → Ease of Access → Display → Show animations
  - Chrome: Settings → Accessibility → Prefers reduced motion
  - Status: ⬜ Configured

- [ ] **Test Animations Disabled**: All animations should be minimal
  - Expected: Instant transitions (0.01ms), no fancy effects
  - Actual: _______________
  - Status: ⬜ Pass ⬜ Fail

- [ ] **Functional Integrity**: UI still works without animations
  - Expected: All interactions functional, just no motion
  - Actual: _______________
  - Status: ⬜ Pass ⬜ Fail

---

## 📱 Mobile-Specific Testing

### Device Testing Matrix
| Device | OS | Browser | Status | Notes |
|--------|----|---------.|--------|-------|
| iPhone 12 | iOS 15+ | Safari | ⬜ | Touch, PWA, Service Worker |
| Samsung Galaxy | Android 12+ | Chrome | ⬜ | Touch, PWA, Offline |
| iPad Air | iOS 15+ | Safari | ⬜ | Landscape, Large screen |
| iPad Pro | iOS 15+ | Safari | ⬜ | Split view, Multitasking |
| Pixel 6 | Android 12+ | Chrome | ⬜ | Dark mode, Touch |

### Orientation Testing
- [ ] **Portrait Mode**: Test in portrait
  - Expected: Full functionality, touch targets adequate
  - Actual: _______________
  - Status: ⬜ Pass ⬜ Fail

- [ ] **Landscape Mode**: Test in landscape
  - Expected: Layout adapts, no horizontal scroll
  - Actual: _______________
  - Status: ⬜ Pass ⬜ Fail

- [ ] **Rotation**: Rotate device during use
  - Expected: Content reflows smoothly, no data loss
  - Actual: _______________
  - Status: ⬜ Pass ⬜ Fail

### Touch Interactions
- [ ] **Tap Accuracy**: All buttons easily tappable
  - Test: Tap each button with thumb
  - Expected: No missed taps, no accidental taps
  - Actual: _______________
  - Status: ⬜ Pass ⬜ Fail

- [ ] **Swipe Gestures**: Cart sheet can be swiped closed
  - Expected: Swipe right closes sheet
  - Actual: _______________
  - Status: ⬜ Pass ⬜ Fail

- [ ] **Pinch to Zoom**: Can zoom menu items
  - Expected: Pinch gesture works (if not disabled)
  - Actual: _______________
  - Status: ⬜ Pass ⬜ Fail

- [ ] **Double Tap**: No unwanted zoom
  - Expected: Double tap doesn't zoom (if disabled)
  - Actual: _______________
  - Status: ⬜ Pass ⬜ Fail

### Performance on Device
- [ ] **Smooth Scrolling**: 60fps while scrolling
  - Test: Fast scroll through menu
  - Expected: No jank, smooth rendering
  - Actual: _______________
  - Status: ⬜ Pass ⬜ Fail

- [ ] **Animation Performance**: Animations run smoothly
  - Test: Open/close cart, switch tabs, add items
  - Expected: 60fps, no dropped frames
  - Actual: _______________
  - Status: ⬜ Pass ⬜ Fail

- [ ] **Load Time**: Initial page load
  - Test: Clear cache, reload page
  - Expected: < 3 seconds on 3G
  - Actual: _______________
  - Status: ⬜ Pass ⬜ Fail

---

## 🔊 Screen Reader Testing

### Screen Reader Setup
- [ ] **Windows + NVDA**: Installed and running
  - Download: https://www.nvaccess.org/download/
  - Status: ⬜ Ready

- [ ] **Windows + JAWS**: Installed and running (if available)
  - Download: https://www.freedomscientific.com/
  - Status: ⬜ Ready

- [ ] **macOS + VoiceOver**: Enabled (Cmd+F5)
  - Status: ⬜ Ready

- [ ] **iOS + VoiceOver**: Enabled (Settings → Accessibility)
  - Status: ⬜ Ready

- [ ] **Android + TalkBack**: Enabled (Settings → Accessibility)
  - Status: ⬜ Ready

### Announcement Testing (NVDA/JAWS)
- [ ] **Page Title**: Announces page title on load
  - Expected: "Mesa TABLE-1 - Menu Digital"
  - Actual: _______________
  - Status: ⬜ Pass ⬜ Fail

- [ ] **Main Heading**: Announces main content heading
  - Expected: "Menu heading level 1" or similar
  - Actual: _______________
  - Status: ⬜ Pass ⬜ Fail

- [ ] **Cart Badge**: Announces item count
  - Expected: "Shopping cart, 3 items"
  - Actual: _______________
  - Status: ⬜ Pass ⬜ Fail

- [ ] **Add to Cart**: Confirms item added
  - Expected: "Pizza Margherita added to cart"
  - Actual: _______________
  - Status: ⬜ Pass ⬜ Fail

- [ ] **Quantity Change**: Announces new quantity
  - Expected: "Quantity: 2"
  - Actual: _______________
  - Status: ⬜ Pass ⬜ Fail

- [ ] **Form Errors**: Reads error messages
  - Expected: "Customer name required. Invalid field."
  - Actual: _______________
  - Status: ⬜ Pass ⬜ Fail

- [ ] **Order Success**: Announces confirmation
  - Expected: "Order confirmed. Order ID: [id]"
  - Actual: _______________
  - Status: ⬜ Pass ⬜ Fail

- [ ] **Loading States**: Announces loading
  - Expected: "Loading" or "Submitting order"
  - Actual: _______________
  - Status: ⬜ Pass ⬜ Fail

- [ ] **Countdown Timer**: Updates announced (TODO: implement)
  - Expected: "Estimated time: 19 minutes" (every minute)
  - Actual: _______________
  - Status: ⬜ Pass ⬜ Fail
  - **Note**: Needs aria-live="polite" on countdown

### Navigation with Screen Reader
- [ ] **Browse by Headings**: Can jump between sections
  - Test: H key to move through headings
  - Expected: Logical heading structure announced
  - Actual: _______________
  - Status: ⬜ Pass ⬜ Fail

- [ ] **Browse by Regions**: Can jump to landmarks
  - Test: D key to move through regions (main, navigation, etc.)
  - Expected: Regions announced (main, navigation, search)
  - Actual: _______________
  - Status: ⬜ Pass ⬜ Fail

- [ ] **Forms Mode**: Form fields properly labeled
  - Test: Tab through checkout form
  - Expected: Each field announces label and type
  - Actual: _______________
  - Status: ⬜ Pass ⬜ Fail

- [ ] **Lists**: Menu items in proper lists
  - Test: L key to jump to lists
  - Expected: "List with X items"
  - Actual: _______________
  - Status: ⬜ Pass ⬜ Fail

---

## 🚀 Browser DevTools Testing

### Chrome Lighthouse Audit
- [ ] **Run Lighthouse**: Chrome DevTools → Lighthouse tab
  - Configuration: Mobile, Clear storage, All categories
  - Status: ⬜ Run

- [ ] **Accessibility Score**: Target ≥ 95
  - Actual Score: _______________
  - Status: ⬜ Pass ⬜ Fail

- [ ] **Performance Score**: Target ≥ 90
  - Actual Score: _______________
  - Status: ⬜ Pass ⬜ Fail

- [ ] **Best Practices Score**: Target ≥ 90
  - Actual Score: _______________
  - Status: ⬜ Pass ⬜ Fail

- [ ] **SEO Score**: Target ≥ 90
  - Actual Score: _______________
  - Status: ⬜ Pass ⬜ Fail

- [ ] **PWA**: Check PWA readiness
  - Expected: Installable, Service Worker, Manifest
  - Actual: _______________
  - Status: ⬜ Pass ⬜ Fail

### Chrome Accessibility Inspector
- [ ] **Inspect Accessibility Tree**: DevTools → Accessibility pane
  - Expected: Proper tree structure, no missing names
  - Actual: _______________
  - Status: ⬜ Pass ⬜ Fail

- [ ] **Computed Properties**: Check ARIA states
  - Expected: Proper roles, states, properties
  - Actual: _______________
  - Status: ⬜ Pass ⬜ Fail

- [ ] **Source Order Viewer**: Visual order matches DOM
  - Expected: Reading order makes sense
  - Actual: _______________
  - Status: ⬜ Pass ⬜ Fail

---

## 📊 Results Summary

### Pass/Fail Count
- **Total Tests**: ___ / ___
- **Passed**: ___ (___%)
- **Failed**: ___ (___%)
- **N/A**: ___

### Critical Issues Found
1. _______________
2. _______________
3. _______________

### Medium Issues Found
1. _______________
2. _______________
3. _______________

### Minor Issues Found
1. _______________
2. _______________
3. _______________

### Recommendations
1. _______________
2. _______________
3. _______________

---

## ✅ Sign-off

**Tested by**: _______________  
**Date Completed**: _______________  
**Overall Status**: ⬜ Approved ⬜ Needs Work ⬜ Blocked  
**Ready for Production**: ⬜ Yes ⬜ No  

**Notes**:
_______________________________________________________________________________
_______________________________________________________________________________
_______________________________________________________________________________

---

*This checklist should be completed manually by a human tester with access to devices and assistive technologies.*
