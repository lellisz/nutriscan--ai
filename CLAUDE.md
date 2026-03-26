# NutriScan - Claude Code Project Guide

## What is this project?
**Praxis Nutri** (rebrand de NutriScan) é um app consumer de nutrição com IA de precisão. Usuários escaneiam fotos de alimentos, recebem análise nutricional instantânea e acompanham sua jornada de saúde. O app é em português (pt-BR), com expansão global planejada.

## Tech Stack
- **Frontend**: React 18.3 + Vite 5.3 + React Router 7 (SPA)
- **Backend**: Vercel serverless functions (`api/` directory)
- **Database**: Supabase (PostgreSQL with RLS)
- **AI**: Groq (LLaMA 3.3 70B + 3.1 8B) + Gemini Flash 2.0 — NÃO usar Anthropic/Claude
- **Animations**: motion (framer-motion fork) — spring physics, useReducedMotion
- **PWA**: vite-plugin-pwa + Workbox (offline-first)
- **Validation**: Zod
- **Charts**: Recharts
- **Monitoring**: Sentry
- **Styling**: Custom CSS design system v2 (no Tailwind, no CSS-in-JS libs)
- **Deploy**: Netlify (frontend) + Vercel (API serverless)

## Project Structure
```
api/              → Vercel serverless functions
  scan.js         → Análise de imagem (Groq Vision + Gemini fallback)
  chat.js         → Coach IA conversacional (Groq 70B + Gemini Flash)
  voice.js        → Parse voz→alimento (Groq 70B, pt-BR)
src/
  app/            → AppShell.jsx (bottom nav + .glass), router.jsx (all routes)
  components/     → ScanCorrectionModal, SplashScreen, PraxiAvatar (8 estados SVG)
  features/       → Feature modules (each has pages/ and optionally hooks/, components/)
    auth/         → SignInPage, SignUpPage, useAuth hook, AuthProvider
    coach/        → CoachChatPage (chat IA com Praxi)
    dashboard/    → DashboardPage (home com Praxi reativo, quick actions, Chrono Score)
    scan/         → ScanPage (câmera/upload + botão voz → AI analysis)
    history/      → HistoryPage (histórico com scroll-snap, Praxi empty state)
    insights/     → InsightsPage (peso, treinos, gráficos Recharts)
    profile/      → ProfilePage, EditProfilePage, EditGoalsPage
    onboarding/   → OnboardingPage (wizard 3 telas com Praxi animado)
    subscription/ → PaywallWelcomePage, SubscriptionPage
  lib/
    db.js         → All Supabase data access functions
    supabase.js   → Supabase client singleton
    validation/   → Zod schemas (schemas.js)
    hooks/        → useVoiceInput.js, useTrack.js, useErrorHandler.js
    haptics.js    → Haptic feedback (light/medium/success via navigator.vibrate)
    pwa.js        → IndexedDB queue offline (queueAction, syncPendingActions)
  styles/         → index.css (design system v2: .glass, .mono-num, .skeleton, .scan-btn-glow)
supabase/
  schema.sql      → Full database schema (tables, RLS policies, indexes)
  functions/chat/ → Edge Function TypeScript/Deno (pendente deploy)
docs/
  ai-engine.md          → Providers IA, endpoints, Edge Function, system prompt Praxi
  design-system.md      → Fontes, paleta, classes utilitárias, filosofia
  features-implementadas.md → Tabela completa de features e status
  ROADMAP.md, IMPLEMENTATION.md, security/
```

## Key Conventions

### Code Style
- All user-facing text is in **Portuguese (pt-BR)** — never use English in UI strings
- Inline styles are the primary styling approach (no CSS modules, no Tailwind)
- CSS variables design system v2: `--praxis-green`, `--bg-warm`, `--macro-protein`, `--macro-carb`, `--macro-fat`, `--attention-gentle`
- CSS classes follow `ns-` prefix: `ns-card`, `ns-btn`, `ns-btn-primary`, `ns-input`, `ns-badge`, `ns-spinner`, `ns-page`, `ns-label`
- Utility classes: `.glass`, `.mono-num`, `.skeleton`, `.scan-btn-glow`
- Animation classes: `animate-fade-up`, `stagger-1` through `stagger-5`
- Animations via `motion` package (framer-motion fork) — sempre incluir `useReducedMotion()`
- Nunca usar vermelho para indicar falha → usar `--attention-gentle` (#E5A44D, âmbar)

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

### API
- **api/scan.js**: análise de imagem — Groq Vision primário, Gemini Flash fallback
- **api/chat.js**: coach IA — intent router (LLaMA 8B ~10ms) → LLaMA 70B / Gemini Flash
- **api/voice.js**: parse voz→alimento — Groq LLaMA 70B, conhece PF/coxinha/açaí/tapioca
- Todos os endpoints: JWT obrigatório (`validateAuth()`), Zod validation, rate limiting, Sentry
- Retorna JSON estruturado: food_name, calories, protein, carbs, fat, fiber, sugar, sodium, confidence, benefits, ai_tip, verdict, next_action
- NÃO usar Anthropic/Claude API — usar apenas Groq e Gemini

## Commands
- `npm run dev` — Start Vite dev server
- `npm run build` — Production build
- `npm run preview` — Preview production build locally

## Database Tables
profiles, daily_goals, scan_history, weight_logs, workout_logs, hydration_logs, analytics_events, coach_sessions, coach_messages

## Environment Variables
See `.env.example` for all required variables (Supabase URL/key, Groq API key, Gemini API key, Sentry DSN).

## Important Notes
- Never commit `.env` or `.env.claude` files
- The `dist/` folder is committed for Netlify deploys — rebuild before committing dist changes
- All new tables need RLS policies (see schema.sql for pattern)
- The app is mobile-first (max-width: 480px design)
- PWA icons needed: `public/pwa-192x192.png` and `public/pwa-512x512.png`
- Edge Function pendente deploy: `supabase functions deploy chat` (código em supabase/functions/chat/)
- Migrations pendentes: analytics_events, conversation_insights (ver supabase/migrations/)
- PraxiAvatar tem 8 estados: waving, thinking, celebrating, worried, sleeping, proud, curious, neutral

## Segundo cerebro (Obsidian)
Vault em: `C:\projetos\nutriscan\NUTRISCAN\`

### Inicio de sessao (OBRIGATORIO)
Ao iniciar qualquer sessao, SEMPRE executar antes de qualquer outra tarefa:
1. Ler `NUTRISCAN/Coach Nutri.md` — status geral do projeto e links
2. Ler a sessao mais recente em `NUTRISCAN/sessoes/` — contexto do que foi feito por ultimo
3. Verificar bugs pendentes em `NUTRISCAN/bugs/` (procurar `status: pendente`)
4. Usar essas informacoes para priorizar trabalho e tomar decisoes

### Regras durante a sessao
- Antes de resolver um bug, verificar se existe nota em `bugs/` com erro similar
- Ao resolver um bug novo (>15 min), criar nota em `bugs/` seguindo `bugs/_template.md`
- Ao tomar uma decisao de arquitetura, criar nota em `decisoes/`
- Ao fim de cada sessao longa, resumir em `sessoes/YYYY-MM-DD.md`
