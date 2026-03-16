# Phase 2: Reliability & Observability

**Status**: Ready to Start
**Duration**: 2 weeks (3-4 sprints de 3-4 dias)
**Goal**: Make the product production-ready and observable

---

## Executive Summary

**Phase 1** (✅ Done) delivered a complete user flow with authentication, onboarding, scan, dashboard, and history. The app compiles and the architecture is clean.

**Phase 2** (Starting Now) focuses on **three critical gaps**:

1. **Nothing fails silently** — errors are tracked, logged, and actionable
2. **Every operation is observable** — we know what's happening in production
3. **Data quality is enforced** — bad input doesn't create bad data

After Phase 2, you'll have a product that:
- ✅ Can be deployed to production without fear
- ✅ Shows you when and why things break
- ✅ Protects users from invalid data
- ✅ Meets audit and compliance standards

---

## What We're Building in Phase 2

### 1. Request Validation Layer (Backend)
**Problem**: `api/scan.js` accepts whatever the frontend sends. If Anthropic changes behavior or frontend sends malformed data, we have no defense.

**Solution**:
- Add Zod validation to request body before processing
- Add retry logic with exponential backoff for Anthropic API failures
- Add request ID to every call for tracing

**Deliverables**:
- `api/scan.js` validates `ScanRequestSchema` at entry
- `api/scan.js` validates `ScanResponseSchema` from Anthropic
- Structured error responses with codes
- Retry up to 3x on transient failures

**Success Criteria**:
- 100% of scan requests validated
- Malformed requests return 400 + helpful error message
- IA timeouts retry automatically; user sees "retrying..." UI

---

### 2. Error Handling in Frontend
**Problem**: When backend fails, user sees blank screen or "Error" with no context.

**Solution**:
- Error boundary component that catches crashes
- Toast notifications for transient errors (retry-able)
- Modal for permanent errors (show what happened)
- Fallback UI for key flows (scan, history, dashboard)

**Deliverables**:
- `ErrorBoundary.jsx` — catches unhandled React errors
- `useErrorHandler()` hook — easy error handling in async flows
- Toast notification system — success, info, warn, error
- Specific error messages for common cases (network, auth, quota)

**Success Criteria**:
- App never shows blank screen
- Every error has a "what happened" + "what to do next"
- User can retry failed operations one-click

---

### 3. Observability Infrastructure
**Problem**: If the app breaks in production, you have no way to know why.

**Solution**:
- Structured logging to console (for local dev)
- Error tracking service (Sentry free tier)
- Analytics events for key user actions
- Request IDs for tracing failures end-to-end

**Deliverables**:
- `logger.js` — structured logging wrapper
- Sentry integration (frontend + backend)
- Analytics events for: signup, onboarding complete, scan success, scan fail
- Request IDs in all backend logs

**Success Criteria**:
- Every error is captured in Sentry with context
- Can trace a failed scan from frontend request → backend → Anthropic
- Can see user drop-off in analytics (onboarding → scan → dashboard)

---

### 4. Rate Limiting & Security
**Problem**: Without rate limits, a bot can spam your Anthropic quota.

**Solution**:
- Rate limit `/api/scan` to 5 scans/minute per user
- Return 429 (Too Many Requests) with retry-after header
- Log rate limit hits to detect abuse

**Deliverables**:
- Rate limiter middleware in Vercel (using `X-Forwarded-For` or Supabase auth)
- Frontend shows "slow down" message at 3/5 limit
- Analytics event when user hits rate limit

**Success Criteria**:
- Can do 5 scans/minute, 6th blocks temporarily
- Legitimate users not impacted
- Abuse is visible in logs

---

### 5. Integration Tests
**Problem**: You can't be sure the whole flow (frontend → backend → Supabase) actually works without manual testing.

**Solution**:
- Single happy-path integration test
- Test: signup → onboarding → scan → history
- Run on every push

**Deliverables**:
- `tests/integration.test.js` using Playwright or Cypress
- Test script in `package.json`
- GitHub Actions workflow (or similar) to run tests

**Success Criteria**:
- Test runs in CI/CD
- Tests cover: auth, onboarding, scan, history view
- All tests pass before deploy allowed

---

### 6. Deployment & Release Process
**Problem**: Currently, how do you safe deploy without breaking production?

**Solution**:
- Vercel preview deployments for every PR
- Manual approval before production
- Rollback plan documented
- Release notes template

**Deliverables**:
- `vercel.json` configured for preview + production
- GitHub branch protection rules
- Rollback checklist in docs
- Release checklist before going live

**Success Criteria**:
- Every PR gets a preview URL
- Can safely merge only after testing preview
- Production deploy is one-click and reversible

---

## Sprint Breakdown

### Sprint 1: Validation + Error Handling (3 days)
**Goal**: No invalid data can enter the system; no unhandled errors.

- [ ] Add request validation to `api/scan.js` (Zod)
- [ ] Add response validation from Anthropic
- [ ] Build `ErrorBoundary.jsx` component
- [ ] Build toast notification system
- [ ] Test: signup → scan → error → retry flow
- [ ] Commit + push to staging

**Definition of Done**: 
- All scans validate request + response
- App never crashes (ErrorBoundary catches all)
- User sees helpful error messages

---

### Sprint 2: Observability + Analytics (3 days)
**Goal**: You can see what's happening in production.

- [ ] Create `logger.js` (structured logging)
- [ ] Integrate Sentry (frontend + backend)
- [ ] Add analytics events (signup, onboarding, scan, error)
- [ ] Add request IDs to scan endpoint
- [ ] Test: generate an error, verify it appears in Sentry
- [ ] Set up dashboard in Sentry

**Definition of Done**:
- Errors appear in Sentry within 5 seconds
- Can filter errors by user, time, operation
- Analytics shows user conversion funnel

---

### Sprint 3: Rate Limiting + Security (2-3 days)
**Goal**: Protect your Anthropic quota and backend from abuse.

- [ ] Add rate limiter to `api/scan.js`
- [ ] Frontend shows rate limit status
- [ ] Test: hit rate limit, see 429, see message
- [ ] Document rate limit policy
- [ ] Add analytics event for rate limit hits

**Definition of Done**:
- 5 scans/min limit enforced
- User sees "come back in X seconds" message
- No legitimate users impacted

---

### Sprint 4: Testing + Release (2-3 days)
**Goal**: Safe, repeatable deployment process.

- [ ] Write integration test (signup → scan → history)
- [ ] Add test script to `package.json`
- [ ] Set up GitHub Actions (or CI tool)
- [ ] Configure Vercel preview + production
- [ ] Write rollback checklist
- [ ] Write release notes template
- [ ] Deploy to production

**Definition of Done**:
- Tests run in CI and pass
- Every PR has preview URL
- Production deploy takes < 1 minute
- Can rollback in < 5 minutes if needed

---

## Metrics of Success

After Phase 2, you should be able to answer:

| Metric | Target | How to Measure |
|--------|--------|-----------------|
| Error capture rate | 100% | All backend errors appear in Sentry |
| Time to detect issue | < 1 min | Set Sentry alert, get notified |
| Mean time to resolve (MTTR) | < 15 min | Deploy fix, verify in preview, merge |
| User error impact | 0% | No user-facing crashes (ErrorBoundary) |
| Test coverage | > 80% happy path | Integration tests run before deploy |
| Deployment safety | 100% | Preview + review before production |
| Rate limit abuse | Visible | Can see in logs/analytics if happening |

---

## Technical Checklist

### Code Quality
- [ ] All async operations have try/catch or .catch()
- [ ] All API calls validate input and output
- [ ] All user-facing errors have messages
- [ ] No console.error() without context
- [ ] Structured logging in backend (JSON format)

### Observability
- [ ] Sentry account created and configured
- [ ] Sentry error tracking working (test it)
- [ ] Analytics events fired for key flows
- [ ] Request IDs logged in backend
- [ ] Alert configured for critical errors

### Security
- [ ] Rate limiter in place and tested
- [ ] RLS policies verified in Supabase
- [ ] No secrets in code or .env git history
- [ ] CORS configured if needed
- [ ] Input sanitization (Zod validates everything)

### Testing & Deployment
- [ ] Integration test written and passing
- [ ] CI/CD pipeline configured
- [ ] Preview deployments working
- [ ] Rollback tested and documented
- [ ] Release checklist created

### Documentation
- [ ] How to deploy to production (steps)
- [ ] How to rollback (steps)
- [ ] How to read logs in Sentry
- [ ] How to understand analytics
- [ ] Rate limit policy documented for users

---

## Definition of "Done" for Phase 2

Phase 2 is complete when you can:

✅ Deploy confidently to production  
✅ See errors in real-time (Sentry dashboard)  
✅ Understand user behavior (analytics)  
✅ Handle failures gracefully (no crashes)  
✅ Rate limit abusers (no quota overruns)  
✅ Rollback safely if something breaks  
✅ Run automated tests before merging  

---

## Tools & Services (Minimal)

| Tool | Purpose | Cost | Setup Time |
|------|---------|------|-----------|
| Sentry | Error tracking | Free tier (100 events/day) | 5 min |
| Supabase Logs | Backend logs | Included | 2 min |
| GitHub Actions | CI/CD | Free for public repos | 10 min |
| Vercel | Hosting | Included with current setup | 0 min |

**Total setup time**: ~20 minutes  
**Total monthly cost**: $0 (all free tiers)

---

## What NOT to Do in Phase 2

These are distractions. Save them for Phase 3+:

- ❌ Vitest/Jest unit tests (integration test is enough)
- ❌ Complex monitoring dashboards (Sentry dashboard suffices)
- ❌ Database backups automation (Supabase handles this)
- ❌ Multi-region deployment (one region fine for now)
- ❌ Performance optimization (app is fast enough)
- ❌ Mobile app (focus web first)
- ❌ Premium features (free tier first)

---

## Risk Mitigation

### Risk: Sentry shows too many errors
**Mitigation**: Errors are normal during development. Set alerts only for production environment.

### Risk: Rate limit breaks legitimate power users
**Mitigation**: 5 scans/minute = 300/hour = 7200/day. Most users << this.

### Risk: Integration tests are flaky
**Mitigation**: Use Supabase test environment. Reset DB between runs.

### Risk: Rollback doesn't work
**Mitigation**: Test rollback plan locally. Vercel makes this trivial (revert to previous build).

---

## Handoff to Phase 3

After Phase 2 is complete, the product is **stable and observable**. Phase 3 focuses on **differentiation**:

- Real-time dashboard with charts
- Personalized recommendations
- Weekly email digest
- Meal tagging and search
- Premium features if needed

But you cannot move to Phase 3 until Phase 2 is solid. Production reliability first, features second.

---

## Sign-Off

**Current State**: Functional prototype with clean architecture  
**Phase 2 Goal**: Production-ready with observability  
**Expected Outcome**: Safe to deploy and monitor in production  
**Timeline**: 2 weeks  
**Next Review**: End of Sprint 4

Ready to start?
