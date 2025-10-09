# Payment System - PR Checklist

## Pre-Merge Quality Gates

Complete all items before merging `feature/backend-payments-mercadopago` to `main`.

---

## 1. Code Quality ✅

### Files Changed
- [ ] All new files follow project structure conventions (`lib/`, `components/`, `app/`)
- [ ] Naming conventions followed: PascalCase components, camelCase utilities
- [ ] TypeScript strict mode compliance (no `any` types)
- [ ] All imports use `@/` alias
- [ ] No commented-out code blocks

### Code Standards
- [ ] ESLint passes: `npm run lint` (0 errors, <5 warnings)
- [ ] No console.log in production code
- [ ] Proper error boundaries implemented
- [ ] Loading states for all async operations
- [ ] Responsive design (mobile, tablet, desktop)

### TypeScript
- [ ] All functions have return types
- [ ] All React component props are typed
- [ ] No TypeScript compiler errors: `npm run build`
- [ ] Enums used for status values (not string literals)

---

## 2. Testing Coverage 🧪

### Unit Tests
- [ ] Payment store tests pass: `npm run test lib/server/__tests__/payment-store.test.ts`
- [ ] Payment hook tests pass: `npm run test hooks/__tests__/use-payment.test.ts`
- [ ] Client utilities tests pass: `npm run test lib/__tests__/payment-client-utils.test.ts`
- [ ] Coverage: >80% for critical paths

### Integration Tests
- [ ] API endpoint tests pass: `npm run test app/api/__tests__/payment-api.test.ts`
- [ ] Webhook validation tests pass
- [ ] WebSocket event emission tests pass
- [ ] End-to-end payment flow test passes

### Manual Testing Checklist
- [ ] **Happy Path**: Create payment → Complete checkout → Receive webhook → Status updates
- [ ] **Error Handling**: API failure, network timeout, webhook retry
- [ ] **Edge Cases**: Duplicate payment prevention, concurrent requests
- [ ] **Real-time Updates**: Multiple browser tabs show same payment status
- [ ] **Mobile Responsive**: Checkout modal works on mobile devices

### Test Cards Validated (Sandbox)
- [ ] Approved: 5031 7557 3453 0604 (CVV 123, Exp 11/25)
- [ ] Declined: 5031 4332 1540 6351 (CVV 123, Exp 11/25)
- [ ] Pending: Test webhook with `pending` status

---

## 3. Documentation 📚

### API Documentation
- [ ] `docs/api/payments.md` complete with:
  - [ ] All endpoints documented (POST/GET /api/payment, webhook)
  - [ ] Request/response examples
  - [ ] Error codes table
  - [ ] WebSocket events
  - [ ] Environment variables
  - [ ] Testing guide with sandbox cards

### Flow Diagrams
- [ ] `docs/diagrams/payment-flow.md` includes:
  - [ ] User journey diagram
  - [ ] Technical sequence diagram
  - [ ] Payment status state machine
  - [ ] Component architecture
  - [ ] Error handling flow
  - [ ] WebSocket real-time updates
  - [ ] Security validation flow

### Code Comments
- [ ] Complex business logic explained
- [ ] Public API functions have JSDoc comments
- [ ] TODOs removed or converted to GitHub issues

### README Updates
- [ ] Root README mentions payment system
- [ ] Environment variables documented in README
- [ ] Setup instructions include MercadoPago configuration

---

## 4. Security 🔒

### Secrets Management
- [ ] No hardcoded API keys in code
- [ ] `.env.example` updated with required variables
- [ ] `.env.local` in `.gitignore`
- [ ] Webhook secret key validated on every request

### API Security
- [ ] Webhook signature validation implemented
- [ ] Rate limiting considered (documented if not implemented)
- [ ] HTTPS enforced in production (documented)
- [ ] CORS configured correctly

### PCI Compliance
- [ ] No card data stored in database
- [ ] Payment processing via MercadoPago SDK only
- [ ] Checkout Pro integration (client-side form)
- [ ] Secure data transmission

---

## 5. Performance ⚡

### Build Validation
- [ ] `npm run build` succeeds (< 2 minutes)
- [ ] No build warnings for payment files
- [ ] Bundle size increase documented (< 100KB)

### Runtime Performance
- [ ] Payment creation API: < 2 seconds (P95)
- [ ] Webhook processing: < 500ms (P95)
- [ ] WebSocket latency: < 100ms
- [ ] No memory leaks in long-running processes

### Optimization
- [ ] Images optimized (if any added)
- [ ] Lazy loading for payment modal
- [ ] Debounced user actions (if applicable)

---

## 6. User Experience 🎨

### UI/UX Validation
- [ ] Loading spinners during async operations
- [ ] Success/error toast notifications
- [ ] Disabled buttons during processing
- [ ] Clear payment status indicators
- [ ] Accessible ARIA labels

### Error Messages
- [ ] User-friendly error messages (no stack traces)
- [ ] Actionable error guidance ("Retry" button)
- [ ] Network errors handled gracefully
- [ ] Fallback UI for failed states

### Design Consistency
- [ ] Follows existing design system
- [ ] Uses shadcn/ui components
- [ ] Consistent spacing/typography
- [ ] Brand colors applied

---

## 7. Integration ⚙️

### Environment Setup
- [ ] `.env.example` includes:
  ```
  MERCADOPAGO_PUBLIC_KEY=your_public_key_here
  MERCADOPAGO_ACCESS_TOKEN=your_access_token_here
  MERCADOPAGO_WEBHOOK_SECRET=your_webhook_secret_here
  NEXT_PUBLIC_APP_URL=http://localhost:3000
  ```

### MercadoPago Configuration
- [ ] Public key configured (client-side)
- [ ] Access token configured (server-side)
- [ ] Webhook URL registered in MercadoPago dashboard
- [ ] Webhook secret key matches server configuration
- [ ] Back URLs configured (success/failure/pending)

### WebSocket Setup
- [ ] Socket.io server running
- [ ] `payment:updated` event registered
- [ ] Client listeners active in `usePayment` hook

---

## 8. Deployment 🚀

### Pre-Deployment
- [ ] Staging environment tested
- [ ] Database migration plan (if needed)
- [ ] Rollback plan documented

### Environment Variables (Production)
- [ ] Production MercadoPago credentials configured
- [ ] Production webhook URL whitelisted
- [ ] Production app URL set correctly

### Monitoring
- [ ] Error tracking configured (Sentry/similar)
- [ ] Payment metrics dashboard planned
- [ ] Webhook failure alerts configured

### Post-Deployment Validation
- [ ] Health check endpoint responds
- [ ] Test payment in production (sandbox mode)
- [ ] Webhook receives events
- [ ] Real-time updates work across devices

---

## 9. Git & Version Control 📝

### Commit Quality
- [ ] Commits follow Conventional Commits format
- [ ] Clear commit messages (no "WIP" or "fix")
- [ ] Logical commit separation (backend, frontend, docs)
- [ ] No merge commits (rebased on main)

### Branch Hygiene
- [ ] Branch up-to-date with `main`
- [ ] No conflicts with `main`
- [ ] All commits squashed/cleaned (optional)

### PR Description
- [ ] Summary of changes
- [ ] Screenshots/GIFs of UI changes
- [ ] Testing instructions
- [ ] Breaking changes documented
- [ ] Related issues linked

---

## 10. Final Checks ✔️

### Build & Test
```powershell
# Run all checks
npm run lint
npm run build
npm run test

# Verify output:
# ✓ ESLint: 0 errors
# ✓ Build: 34 routes compiled
# ✓ Tests: All passing
```

### Manual Smoke Test
1. [ ] Start dev server: `npm run dev`
2. [ ] Navigate to Orders Panel
3. [ ] Click "Pagar" on an order
4. [ ] Complete payment with test card
5. [ ] Verify status updates in UI
6. [ ] Check webhook logs in terminal

### Documentation Review
- [ ] `docs/api/payments.md` reviewed
- [ ] `docs/diagrams/payment-flow.md` reviewed
- [ ] All code comments accurate

---

## Sign-off

### Developer
- [ ] All checklist items completed
- [ ] Code self-reviewed
- [ ] Manual testing performed
- Name: _________________ Date: _______

### Reviewer
- [ ] Code reviewed
- [ ] Tests validated
- [ ] Documentation reviewed
- Name: _________________ Date: _______

---

## Appendix: Quick Commands

```powershell
# Install dependencies
npm install

# Run linter
npm run lint

# Build for production
npm run build

# Run all tests
npm run test

# Run specific test file
npm run test -- payment-store.test.ts

# Start dev server
npm run dev

# Check types
npx tsc --noEmit
```

---

## Related Documentation

- [Payment API Documentation](../api/payments.md)
- [Payment Flow Diagrams](../diagrams/payment-flow.md)
- [Project Guidelines](../../PROJECT_GUIDELINES.md)
- [MercadoPago Documentation](https://www.mercadopago.com.ar/developers/es/docs)

---

## Notes

- This checklist is a living document; update as needed
- Not all items may apply to every PR
- Use judgment for minor changes (documentation-only PRs may skip some testing)
- Add custom checks specific to your deployment environment

---

**Last Updated**: January 2025  
**Version**: 1.0.0  
**Maintainer**: Development Team
