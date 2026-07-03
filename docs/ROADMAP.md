# Market-readiness roadmap

A checklist of what LaundriX still needs to become a production-grade,
commercially competitive laundry-management SaaS. Grouped by area; roughly
ordered by priority within each group. Tags: **[P0]** blocker before real
users · **[P1]** important · **[P2]** nice-to-have / scale.

Legend: `[ ]` todo · `[~]` partially done · `[x]` done.

---

## 1. Security & auth

- [ ] **[P0]** Wire the `/me` auth guard on the frontend — validate the session
  on load, gate protected routes, and redirect unauthenticated users (backend
  endpoint exists; UI still trusts `sessionStorage`).
- [ ] **[P0]** Email verification on signup (verify address before ordering).
- [ ] **[P0]** CSRF protection for cookie-based state-changing requests
  (`SameSite=None` cross-site cookies need CSRF tokens).
- [ ] **[P1]** 2FA for admin accounts.
- [ ] **[P1]** Refresh tokens + rotation; shorter access-token lifetime; server
  session revocation on logout.
- [ ] **[P1]** Account lockout / progressive delays on repeated failed logins.
- [ ] **[P1]** Move rate limiting to a shared store (Redis) — the in-memory
  limiter is per-instance and ineffective on serverless.
- [ ] **[P1]** Strengthen the password-reset token scheme (dedicated secret,
  single-use, invalidation) and audit the reset flow end-to-end.
- [ ] **[P2]** Audit log of admin actions (approvals, role changes, deletions).
- [ ] **[P2]** Dependency & secret scanning in CI (Dependabot, `npm audit`,
  gitleaks).
- [~] Security headers (helmet), RBAC guards, ownership checks, password
  hashing, server-side pricing — **done**.

## 2. Payments & billing

- [ ] **[P0]** Harden the Razorpay integration: idempotency keys, webhook-based
  confirmation (don't trust only the client handler), refunds, and failed-/
  pending-payment reconciliation.
- [ ] **[P1]** Configurable payment timing (pay-on-order vs pay-on-delivery).
- [ ] **[P1]** Payout/settlement flow to launderers (marketplace take-rate,
  ledger, statements).
- [ ] **[P1]** Tax/GST compliance: proper invoice numbering, GSTIN capture,
  downloadable tax invoices.
- [ ] **[P2]** Wallet / stored credits; subscriptions or laundry plans.
- [~] One-shot Razorpay checkout, coupons, express surcharge, tax on total,
  printable receipts — **done**.

## 3. Reliability & infrastructure

- [ ] **[P0]** Move the stale-order cron off serverless (Vercel Cron / worker) —
  `cron.schedule` won't fire reliably on Vercel.
- [ ] **[P1]** Error monitoring (Sentry) with request IDs threaded through the
  existing structured logs.
- [ ] **[P1]** `/health` + `/ready` endpoints and uptime monitoring.
- [ ] **[P1]** Database indexes on hot queries; connection pooling review;
  backups + restore drills; a staging environment.
- [ ] **[P1]** Caching for settings/catalog reads (currently refetched often).
- [ ] **[P2]** Image storage/CDN (S3/Cloudinary) for catalog + order photos.
- [ ] **[P2]** Load/perf testing and autoscaling review.
- [~] Dockerized stack, GitHub Actions CI (lint + build + tests) — **done**.

## 4. Product & features

- [ ] **[P1]** Real-time notifications (websockets/push) — currently polled once
  on mount.
- [ ] **[P1]** In-app / email notifications for every order status change.
- [ ] **[P1]** Launderer capacity limits & working-days calendar (beyond time
  slots); order scheduling conflicts.
- [ ] **[P1]** Order photos + damage reporting (before/after).
- [ ] **[P1]** Search & pagination on all admin lists (users/orders/catalog/
  coupons) — they currently load everything.
- [ ] **[P2]** Live order tracking / ETA for pickup & delivery.
- [ ] **[P2]** Chat/support between student and launderer.
- [ ] **[P2]** Multi-currency / multi-region; localization (i18n).
- [ ] **[P2]** Referral program; loyalty points.
- [~] Approval, ratings/reviews, discovery, lifecycle (reschedule/cancel/
  timeline), per-launderer availability, pickup mode, coupons, express,
  invoices, analytics — **done**.

## 5. Quality & testing

- [ ] **[P0]** Frontend tests (Vitest + React Testing Library) for the core
  flows.
- [ ] **[P1]** Browser E2E tests (Playwright) for signup → order → pay → rate.
- [ ] **[P1]** Coverage reporting + a threshold gate in CI.
- [ ] **[P2]** Contract/API tests and load tests.
- [x] Backend end-to-end/integration suite (Jest + supertest, 44 tests) in CI.

## 6. UX & accessibility

- [ ] **[P1]** React error boundaries + consistent loading skeletons / empty
  states.
- [ ] **[P1]** Inline form validation (react-hook-form + zod) replacing
  toast-only errors.
- [ ] **[P1]** Accessibility pass (WCAG: labels, focus management, contrast,
  keyboard nav).
- [ ] **[P2]** Onboarding tours for each role; richer analytics charts.
- [ ] **[P2]** PWA / installable app; offline resilience.
- [~] Mobile-responsive layouts, order-schedule persistence, route
  code-splitting — **done**.

## 7. API & architecture

- [ ] **[P1]** API versioning (`/api/v1`) + OpenAPI/Swagger docs (needs a
  coordinated frontend + backend redeploy).
- [ ] **[P1]** Consistent error response envelope across all endpoints.
- [ ] **[P2]** Input validation via a schema library (zod/joi) everywhere.
- [ ] **[P2]** Extract shared constants (prices/wash-type helpers) to a single
  source across FE/BE.
- [~] Structured logging, DRY auth middleware, app/server split for
  testability — **done**.

## 8. Business & compliance

- [ ] **[P0]** Privacy policy, terms of service, cookie consent.
- [ ] **[P1]** GDPR/data-protection: data export & account deletion flows.
- [ ] **[P1]** Admin onboarding for real launderers (KYC/verification docs).
- [ ] **[P2]** Analytics/telemetry (privacy-respecting) for product decisions.
- [ ] **[P2]** SLA definitions, incident runbook, status page.

---

### Suggested next sprint (highest leverage)

1. Wire the `/me` auth guard + protected routes (security correctness).
2. Harden Razorpay with webhooks + refunds (money correctness).
3. Real-time / email notifications on status changes (core UX).
4. Frontend + Playwright tests for the primary flow (safety net).
5. Move the cron off serverless and add Sentry + `/health` (reliability).
