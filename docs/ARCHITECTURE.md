# NutriScan Architecture

## Objective

Transform the current prototype into a production-grade nutrition platform with:

- image-based food analysis
- authenticated user journeys
- persistent nutrition profile and goals
- scan history and progress tracking
- deployable, observable, and secure backend flows

## Current State

The current repository has a good product direction but still behaves like an early prototype.

What already exists:

- Vite + React frontend
- serverless endpoint for image analysis in [api/scan.js](../api/scan.js)
- Supabase dependency and data access layer in [src/lib/db.js](../src/lib/db.js)
- initial database schema in [supabase/schema.sql](../supabase/schema.sql)

What is still missing:

- real application shell and page structure
- authentication flow in the UI
- state model for session, profile, scans, and goals
- API client abstraction for frontend to backend communication
- input validation and error boundaries
- tests, observability, analytics, and release discipline

## Target Architecture

### 1. Frontend

Stack:

- React + Vite
- feature-based folder organization
- centralized API/data hooks
- isolated design system primitives

Recommended frontend structure:

```text
src/
  app/
    AppShell.jsx
    router.jsx
    providers.jsx
  components/
    ui/
    charts/
    feedback/
  features/
    auth/
      components/
      hooks/
      services/
    onboarding/
      components/
      services/
    scan/
      components/
      services/
    dashboard/
      components/
      services/
    history/
      components/
      services/
    goals/
      components/
      services/
  lib/
    api/
    supabase/
    utils/
    validation/
  styles/
  main.jsx
```

Principles:

- keep business logic out of large view files
- separate UI state from data access
- use feature folders, not one giant App file
- make every async action explicit: loading, success, empty, error

### 2. Backend

Use Vercel serverless functions only for privileged operations and AI orchestration.

Responsibilities of the backend:

- call Anthropic securely
- validate request payloads
- persist scan results when appropriate
- enforce server-side rules for premium or rate-limited actions
- prepare future integrations such as billing, moderation, and analytics

Recommended backend growth path:

```text
api/
  scan.js
  auth/
  scans/
  profile/
  webhooks/
```

### 3. Data Layer

Supabase should be the system of record.

Core entities:

- profiles
- daily_goals
- scan_history
- meal_entries
- subscriptions
- user_settings

Near-term schema strategy:

- keep user-owned tables protected by RLS
- store AI raw output for traceability
- denormalize the most useful nutrition fields for fast dashboard queries
- add migration discipline instead of manually editing schema ad hoc

### 4. Authentication

Use Supabase Auth as the primary identity layer.

Recommended rollout:

- email/password first
- social login later if product needs it
- session bootstrap on app load
- protected routes for dashboard and history
- onboarding gate for first-time users

### 5. Product Flows

Primary user journey:

1. User signs up or logs in.
2. User completes onboarding profile.
3. System calculates nutrition goals.
4. User scans a meal.
5. Backend analyzes image and stores result.
6. Dashboard updates progress against daily goals.
7. History screen allows review and trend analysis.

Secondary flows:

- profile editing
- goal recalculation
- manual meal correction
- scan retry when AI confidence is low

### 6. Security

Minimum professional standard:

- no secret keys in client code or committed env files
- service role key only on the server
- RLS enabled on all user data tables
- validate body payloads before AI calls and before inserts
- rate-limit scan endpoint per user or IP
- avoid storing base64 images unless there is a clear product need

### 7. Observability

You need operational visibility before scale.

Recommended immediately:

- structured server logs for scan requests
- error tracking in frontend and backend
- analytics events for onboarding, scan success, and retention
- request ids for tracing failed scans

### 8. Quality Standards

Professional execution requires a predictable delivery baseline.

Add:

- ESLint
- Prettier or a formatter policy
- schema validation with Zod
- unit tests for nutrition calculation and parsing
- integration tests for the scan endpoint
- preview deployment checks before production merge

## Recommended Execution Plan

### Phase 1. Foundation

Goal: stop being a prototype.

Deliverables:

- split [src/App.jsx](../src/App.jsx) into app shell and features
- introduce routing
- centralize env access and API client usage
- add auth session bootstrap
- remove `window.storage` dependency and replace with Supabase-backed persistence plus local fallback only where justified

Exit criteria:

- user can sign in
- user session survives refresh
- app has clear page boundaries

### Phase 2. Core Product

Goal: make the main flow real.

Deliverables:

- onboarding screen for profile setup
- goals page connected to `profiles` and `daily_goals`
- scan flow connected to [api/scan.js](../api/scan.js)
- history page connected to `scan_history`
- loading and error UX for all async flows

Exit criteria:

- a real user can create an account, scan food, and see saved history

### Phase 3. Reliability

Goal: make production supportable.

Deliverables:

- request validation with Zod
- retry-safe parsing for AI responses
- rate limiting on scan endpoint
- error monitoring and analytics events
- migration workflow for schema changes

Exit criteria:

- failures are traceable and non-silent
- schema changes are repeatable

### Phase 4. Differentiation

Goal: build product moat.

Deliverables:

- confidence-aware UX and manual correction
- weekly nutrition trends
- meal categorization and macros timeline
- personalized coaching insights
- premium features and subscription model if needed

Exit criteria:

- product moves beyond a single-image demo into a user retention system

## Immediate Next Steps

These are the next steps I would execute now, in this exact order:

1. Refactor the frontend into app shell, routes, and feature folders.
2. Implement authentication screens and session provider.
3. Build onboarding and persist `profiles` and `daily_goals`.
4. Build scan UI and connect it to [api/scan.js](../api/scan.js).
5. Build dashboard and history using `scan_history`.
6. Add validation, linting, and initial tests.

## What I Would Not Do Yet

Avoid these distractions before the core flow is stable:

- native mobile app
- complex microservices split
- multi-provider AI abstraction
- offline-first support
- premium billing implementation

## Definition of Excellent for This Project

The project will look professionally architected when:

- the codebase is organized by product features
- authentication and persistence are first-class, not bolted on
- the scan flow is observable and reliable
- the dashboard reflects real saved user data
- the system can be deployed without manual hacks
- each new feature has a clear place in the architecture

## Suggested Next Build Sprint

If we start now, the smartest sprint is:

1. frontend architecture refactor
2. auth flow
3. onboarding + goals persistence
4. real scan screen
5. history screen

That sprint will convert this repository from promising prototype into a real product base.