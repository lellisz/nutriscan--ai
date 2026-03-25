# Inventário — Praxis Nutri
**Data**: 2026-03-25
**Stack real**: React 18.3 + Vite 5.3 + React Router 7 + CSS Custom (sem Tailwind)
**Linguagem**: JavaScript/JSX (sem TypeScript)
**Deploy**: Netlify (frontend) + Vercel (API serverless)

---

## Rotas (AppRouter.jsx)

| Rota | Arquivo | Descrição |
|------|---------|-----------|
| `/signin` | `src/features/auth/pages/SignInPage.jsx` | Login (email + Google + Apple) |
| `/signup` | `src/features/auth/pages/SignUpPage.jsx` | Cadastro |
| `/dashboard` | `src/features/dashboard/pages/DashboardPage.jsx` | Home — calorias, macros, hidratação |
| `/history` | `src/features/history/pages/HistoryPage.jsx` | Histórico de scans |
| `/insights` | `src/features/insights/pages/InsightsPage.jsx` | Gráficos peso, treinos, análise |
| `/coach` | `src/features/coach/pages/CoachChatPage.jsx` | Chat com Coach Praxi |
| `/profile` | `src/features/profile/pages/ProfilePage.jsx` | Perfil + menu |
| `/profile/edit` | `src/features/profile/pages/EditProfilePage.jsx` | Editar dados pessoais |
| `/profile/goals` | `src/features/profile/pages/EditGoalsPage.jsx` | Editar metas nutricionais |
| `/scan` | `src/features/scan/pages/ScanPage.jsx` | Câmera/upload → análise IA |
| `/onboarding` | `src/features/onboarding/pages/OnboardingPage.jsx` | Wizard de configuração inicial |
| `/subscription` | `src/features/subscription/pages/SubscriptionPage.jsx` | Planos premium |
| `/paywall-welcome` | `src/features/subscription/pages/PaywallWelcomePage.jsx` | Boas-vindas premium |

---

## Componentes

| Componente | Arquivo | Usado em |
|-----------|---------|---------|
| AppShell | `src/app/AppShell.jsx` | Todo o app (layout + BottomNav) |
| AppRouter | `src/app/AppRouter.jsx` | main.jsx |
| AppProviders | `src/app/providers.jsx` | AppRouter |
| ScanCorrectionModal | `src/components/ScanCorrectionModal.jsx` | ScanPage, HistoryPage |
| SplashScreen | `src/components/SplashScreen.jsx` | Inicial |
| ErrorBoundary | `src/components/feedback/ErrorBoundary.jsx` | AppProviders |
| ToastProvider | `src/components/feedback/ToastProvider.jsx` | AppProviders |
| StatusBar | exportada de AppShell.jsx | DashboardPage, outras telas |
| BottomNav | exportada de AppShell.jsx | AppShell |

---

## Supabase — Tabelas e RLS

| Tabela | Colunas principais | RLS |
|--------|-------------------|-----|
| profiles | user_id, full_name, age, weight, goal, is_premium, role | ✅ (SELECT/INSERT/UPDATE/DELETE) |
| daily_goals | user_id, calories, protein, carbs, fat, fiber, water | ✅ |
| scan_history | user_id, food_name, calories, protein, carbs, fat, meal_type | ✅ |
| user_insights | user_id, insight_type, title, description | ✅ |
| weight_logs | user_id, weight, logged_at | ✅ |
| workout_logs | user_id, workout_type, duration_min, logged_at | ✅ |
| hydration_logs | user_id, glasses, logged_at | ✅ |
| rate_limit_hits | user_id, request_id, timestamp | ✅ |
| chat_conversations | user_id, title, summary, message_count | ✅ |
| chat_messages | conversation_id, user_id, role, content, model | ✅ |
| **conversation_insights** | **NÃO EXISTE — precisa criar (Etapa 3)** | — |

---

## IA atual

- **Providers**: Groq (principal), Gemini (fallback), Anthropic (fallback pago)
- **Scan**: `api/scan.js` — Gemini Vision (gemini-2.5-flash-lite) → fallback Groq/Anthropic
- **Chat**: `api/chat.js` — Groq (llama-3.3-70b-versatile) → fallback Gemini → Anthropic
- **Env vars**: `GROQ_API_KEY`, `GEMINI_API_KEY`, `ANTHROPIC_API_KEY`, `AI_PROVIDER`, `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `SUPABASE_ANON_KEY`, `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`, `ALLOWED_ORIGIN`, `VITE_API_URL`
- **O que FALTA**: Intent router (LLaMA 8B), system prompt com personalidade Praxi, memória de sessão (conversation_insights)

---

## Design System atual

- **Arquivo**: `src/styles/index.css` (Version 6.0 — Verde Petróleo Premium)
- **Fonte**: Sistema (sem Google Fonts instaladas) — Nunito/DM Sans/Space Grotesk **não instaladas**
- **Cor primária**: `#1B3A2D` (verde petróleo)
- **Accent**: `#2D8F5E` (verde folha)
- **Background**: `#F4F5F0` (off-white quente)
- **Macros**: proteína `#2563EB`, carb `#D97706`, gordura `#7C3AED`
- **Border-radius cards**: 14-16px
- **Prefixo de classes**: `ns-`

---

## Bugs identificados (Etapa 2)

| # | Bug | Localização | Severidade |
|---|-----|------------|-----------|
| 1 | "Inicio"/"Historico" sem acento | AppShell.jsx:107-108 | Alta |
| 2 | Markdown bruto no chat (`**bold**`) | CoachChatPage.jsx | Crítica |
| 3 | Streak "0d" incorreto | DashboardPage.jsx | Alta |
| 4 | "0 kcal hoje/ontem" — timezone UTC vs UTC-3 | DashboardPage.jsx / db.js | Média |
| 5 | Média 7 dias divide por 7 sem filtrar dias vazios | DashboardPage.jsx / HistoryPage.jsx | Média |
| 6 | Barras de macros finas demais | DashboardPage.jsx / MacroCard | Média |
| 7 | Gotas de hidratação sem feedback ao clicar | DashboardPage.jsx | Média |
| 8 | Avatar "P" genérico nos registros | HistoryPage.jsx | Baixa |
