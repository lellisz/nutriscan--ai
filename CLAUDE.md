# NutriScan - Claude Code Project Guide

## What is this project?
NutriScan is a consumer-grade AI-powered nutrition app. Users scan food photos, get instant nutritional analysis, and track their health journey over time. The app is in Portuguese (pt-BR).

## Tech Stack
- **Frontend**: React 18.3 + Vite 5.3 + React Router 7 (SPA)
- **Backend**: Vercel serverless functions (`api/` directory)
- **Database**: Supabase (PostgreSQL with RLS)
- **AI**: Anthropic Claude (cloud) + Ollama/llava (local fallback)
- **Validation**: Zod
- **Charts**: Recharts
- **Monitoring**: Sentry
- **Styling**: Custom CSS design system (no Tailwind, no CSS-in-JS libs)

## Project Structure
```
api/              → Vercel serverless functions (scan.js is the main AI endpoint)
src/
  app/            → AppShell.jsx (bottom nav), router.jsx (all routes)
  components/     → Shared components (ScanCorrectionModal, SplashScreen)
  features/       → Feature modules (each has pages/ and optionally hooks/, components/)
    auth/         → SignInPage, SignUpPage, useAuth hook, AuthProvider
    dashboard/    → DashboardPage (main home with daily progress)
    scan/         → ScanPage (camera/upload → AI analysis)
    history/      → HistoryPage (scan history with edit/delete)
    insights/     → InsightsPage (weight tracking, workout logs, charts)
    profile/      → ProfilePage (user info, preferences, diet goals)
    onboarding/   → OnboardingPage (profile setup wizard)
    subscription/ → PaywallWelcomePage, SubscriptionPage
  lib/
    db.js         → All Supabase data access functions
    supabase.js   → Supabase client singleton
    validation/   → Zod schemas (schemas.js)
  styles/         → index.css (full design system with CSS variables)
supabase/
  schema.sql      → Full database schema (tables, RLS policies, indexes)
docs/             → ROADMAP.md, IMPLEMENTATION.md
```

## Key Conventions

### Code Style
- All user-facing text is in **Portuguese (pt-BR)** — never use English in UI strings
- Inline styles are the primary styling approach (no CSS modules, no Tailwind)
- CSS variables from the design system: `--ns-accent`, `--ns-bg-card`, `--ns-text-primary`, `--ns-text-muted`, `--ns-border-subtle`, etc.
- CSS classes follow `ns-` prefix: `ns-card`, `ns-btn`, `ns-btn-primary`, `ns-input`, `ns-badge`, `ns-spinner`, `ns-page`, `ns-label`
- Animation classes: `animate-fade-up`, `stagger-1` through `stagger-5`

### Data Layer
- All DB operations go through `src/lib/db.js` — never call Supabase client directly from components
- db.js functions throw on error (no silent failures)
- Supabase tables use `user_id` column with RLS policies enforcing `auth.uid() = user_id`
- Upsert pattern for daily tracking tables (hydration_logs, weight_logs) using `onConflict: "user_id,logged_at"`

### Component Patterns
- Pages are lazy-loaded via `React.lazy()` in router.jsx
- Protected routes wrap with `<ProtectedRoute>` component
- Loading states use `<div className="ns-spinner ns-spinner-lg" />`
- Empty states use `ns-empty` / `ns-empty-icon` / `ns-empty-sub` classes
- Bottom sheet modals: fixed overlay with `alignItems: "flex-end"`, content slides up with `borderRadius: "20px 20px 0 0"`

### API (api/scan.js)
- Single serverless function handles food image analysis
- Supports 3 AI provider modes via `AI_PROVIDER` env var: `anthropic`, `ollama`, `anthropic_with_fallback`
- Request validation with Zod, rate limiting, Sentry error tracking
- Returns structured JSON with: food_name, calories, protein, carbs, fat, fiber, sugar, sodium, confidence, benefits, ai_tip, etc.

## Commands
- `npm run dev` — Start Vite dev server
- `npm run build` — Production build
- `npm run preview` — Preview production build locally

## Database Tables
profiles, daily_goals, scan_history, weight_logs, workout_logs, hydration_logs

## Environment Variables
See `.env.example` for all required variables (Supabase URL/key, Anthropic API key, Ollama config, Sentry DSN).

## Important Notes
- Never commit `.env` or `.env.claude` files
- The `dist/` folder is committed for Netlify deploys — rebuild before committing dist changes
- All new tables need RLS policies (see schema.sql for pattern)
- The app is mobile-first (max-width: 480px design)
