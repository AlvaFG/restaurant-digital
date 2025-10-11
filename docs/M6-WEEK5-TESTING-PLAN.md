# M6 Week 5 - Testing & QA Plan

## 📋 Overview
**Goal**: Comprehensive testing, QA, and production deployment of the QR Ordering System.

**Timeline**: Days 21-25 (5 days)

---

## 🎯 Testing Strategy

### Phase 1: E2E Testing with Playwright (Days 21-22)
**Duration**: 8-10 hours

#### Setup
```bash
npm install -D @playwright/test
npx playwright install
```

#### Test Scenarios

**1. Customer QR Flow** (Priority: HIGH)
- Scan QR code → Session created
- Browse menu → Items displayed
- Search items → Results filtered
- Filter by category → Category items shown
- View item details → Modifiers/allergens visible
- Add to cart → Cart updated
- Modify quantity → Price recalculated
- Checkout → Customer form
- Submit order → Confirmation shown

**2. Payment Flow** (Priority: HIGH)
- Create payment → MercadoPago redirect
- Complete payment → Webhook received
- Payment success → Order confirmed
- Payment failure → Retry option
- Payment pending → Processing message

**3. Admin Dashboard** (Priority: MEDIUM)
- Login → Dashboard visible
- View analytics → Metrics displayed
- Change date range → Data updated
- View orders → Orders list shown
- Update order status → Status changed

**4. Error Scenarios** (Priority: HIGH)
- Network failure → Error message
- Expired session → Redirect to start
- Invalid QR → Error page
- Payment timeout → Handle gracefully

**5. Performance** (Priority: MEDIUM)
- Page load time < 2s
- Time to interactive < 3s
- First contentful paint < 1s
- Largest contentful paint < 2.5s

#### Playwright Configuration
```typescript
// playwright.config.ts
import { defineConfig, devices } from '@playwright/test'

export default defineConfig({
  testDir: './tests/e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: 'html',
  use: {
    baseURL: 'http://localhost:3000',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'Mobile Chrome',
      use: { ...devices['Pixel 5'] },
    },
    {
      name: 'Mobile Safari',
      use: { ...devices['iPhone 12'] },
    },
  ],
  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:3000',
    reuseExistingServer: !process.env.CI,
  },
})
```

---

### Phase 2: Manual Testing & UAT (Days 23-24)
**Duration**: 6-8 hours

#### Deployment to Preview
1. Deploy to Vercel preview
2. Configure environment variables
3. Seed test data
4. Generate QR codes
5. Create demo credentials

#### UAT Checklist

**Customer Experience**:
- [ ] QR code scans successfully
- [ ] Menu loads quickly (<2s)
- [ ] Images display correctly
- [ ] Search works accurately
- [ ] Filters work correctly
- [ ] Cart updates in real-time
- [ ] Checkout form is intuitive
- [ ] Payment flow is smooth
- [ ] Confirmation is clear
- [ ] Error messages are helpful

**Admin Experience**:
- [ ] Login works
- [ ] Dashboard loads fast
- [ ] Analytics are accurate
- [ ] Charts render correctly
- [ ] Date filters work
- [ ] Orders can be managed
- [ ] Status updates reflect immediately
- [ ] Alerts work properly

**Mobile Experience**:
- [ ] Responsive on all devices
- [ ] Touch targets are adequate (44x44px min)
- [ ] Scrolling is smooth
- [ ] Forms are easy to fill
- [ ] No horizontal scrolling
- [ ] Font sizes are readable
- [ ] Images don't overflow

**Accessibility**:
- [ ] Keyboard navigation works
- [ ] Screen reader compatible
- [ ] Color contrast meets WCAG AA
- [ ] Focus indicators visible
- [ ] Alt text on images
- [ ] ARIA labels present
- [ ] Error announcements work

#### Feedback Collection

**Feedback Form**:
1. What did you like?
2. What was confusing?
3. Did you encounter any bugs?
4. How would you rate the overall experience? (1-10)
5. Any feature requests?

**Bug Report Template**:
- **Severity**: Critical / High / Medium / Low
- **Steps to reproduce**:
- **Expected behavior**:
- **Actual behavior**:
- **Screenshots**:
- **Device/Browser**:

---

### Phase 3: Load Testing (Day 24)
**Duration**: 3-4 hours

#### Tools
- k6 (load testing)
- Artillery (stress testing)

#### Test Scenarios

**1. Normal Load**
- 50 concurrent users
- 5 minute duration
- Ramp-up: 30 seconds

**2. Peak Load**
- 100 concurrent users
- 10 minute duration
- Ramp-up: 1 minute

**3. Stress Test**
- 200 concurrent users
- 5 minute duration
- Ramp-up: 2 minutes

#### Metrics to Monitor
- Response time (p95 < 500ms)
- Error rate (< 1%)
- Throughput (requests/sec)
- Database query time
- Memory usage
- CPU usage

#### k6 Script Example
```javascript
import http from 'k6/http'
import { check, sleep } from 'k6'

export const options = {
  stages: [
    { duration: '30s', target: 50 },
    { duration: '5m', target: 50 },
    { duration: '30s', target: 0 },
  ],
}

export default function () {
  // QR menu page
  const res = http.get('http://localhost:3000/qr/mesa-1')
  
  check(res, {
    'status is 200': (r) => r.status === 200,
    'response time < 500ms': (r) => r.timings.duration < 500,
  })
  
  sleep(1)
}
```

---

### Phase 4: Performance Optimization (Day 24-25)
**Duration**: 4-6 hours

#### Lighthouse Audit
Target scores:
- **Performance**: >90
- **Accessibility**: >95
- **Best Practices**: >90
- **SEO**: >90

#### Optimization Checklist

**Images**:
- [ ] Convert to WebP
- [ ] Add lazy loading
- [ ] Use next/image
- [ ] Optimize sizes
- [ ] Add blur placeholders

**Code**:
- [ ] Remove unused code
- [ ] Tree-shake dependencies
- [ ] Code split routes
- [ ] Minify CSS/JS
- [ ] Enable gzip compression

**Caching**:
- [ ] Set cache headers
- [ ] Use SWR for data fetching
- [ ] Cache API responses
- [ ] Use React.memo wisely

**Database**:
- [ ] Add indexes
- [ ] Optimize queries
- [ ] Use connection pooling
- [ ] Cache frequent queries

---

### Phase 5: Production Deployment (Day 25)
**Duration**: 4-6 hours

#### Pre-Deployment Checklist

**Environment**:
- [ ] Production .env configured
- [ ] Database migrated
- [ ] MercadoPago production keys set
- [ ] Error monitoring (Sentry) configured
- [ ] Analytics (Google/Posthog) configured
- [ ] Backup strategy in place

**Security**:
- [ ] HTTPS enabled
- [ ] CORS configured
- [ ] Rate limiting enabled
- [ ] SQL injection protection
- [ ] XSS protection
- [ ] CSRF tokens
- [ ] Secure headers set

**Performance**:
- [ ] CDN configured
- [ ] Assets cached
- [ ] Database optimized
- [ ] Connection pooling
- [ ] Load balancing (if needed)

**Monitoring**:
- [ ] Error tracking active
- [ ] Performance monitoring
- [ ] Uptime monitoring
- [ ] Log aggregation
- [ ] Alert thresholds set

#### Deployment Steps

1. **Build & Test**
```bash
npm run build
npm run lint
npm run test
```

2. **Deploy to Vercel**
```bash
vercel --prod
```

3. **Configure Domain**
- Add custom domain
- Configure DNS
- Verify SSL certificate

4. **Post-Deployment Verification**
- [ ] Homepage loads
- [ ] QR links work
- [ ] API endpoints respond
- [ ] Payment webhook active
- [ ] Analytics tracking
- [ ] Error monitoring working

#### Rollback Plan
1. Keep previous deployment active
2. Document rollback commands
3. Test rollback procedure
4. Monitor first 24 hours closely

---

## 🔧 Testing Tools Installation

```bash
# Playwright
npm install -D @playwright/test
npx playwright install

# k6 (install separately)
# Windows: choco install k6
# Mac: brew install k6
# Linux: apt-get install k6

# Artillery
npm install -g artillery
```

---

## 📊 Success Metrics

### Quality Gates
- **Test Coverage**: >80%
- **E2E Pass Rate**: 100%
- **Performance Score**: >90
- **Accessibility Score**: >95
- **Zero Critical Bugs**: Before launch

### Performance Targets
- **Page Load**: <2s
- **Time to Interactive**: <3s
- **API Response**: <200ms (p95)
- **Error Rate**: <0.1%
- **Uptime**: >99.9%

---

## 📝 Documentation Deliverables

1. **Test Report**: E2E test results
2. **UAT Summary**: Stakeholder feedback
3. **Performance Report**: Lighthouse + k6 results
4. **Deployment Guide**: Step-by-step instructions
5. **Rollback Procedure**: Emergency playbook
6. **Monitoring Dashboard**: Links and access

---

## 🚀 Go-Live Checklist

Final checks before launch:
- [ ] All tests passing
- [ ] UAT approved
- [ ] Performance optimized
- [ ] Security reviewed
- [ ] Monitoring active
- [ ] Backups configured
- [ ] Team trained
- [ ] Documentation complete
- [ ] Rollback plan ready
- [ ] Stakeholder sign-off

---

**Ready for Week 5 execution!** 🎉
